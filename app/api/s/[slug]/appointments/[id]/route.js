import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// ---- helpers ----
function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function isUuid(v) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// Get local date parts in salon timezone (no external libs)
function getLocalParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;

  // weekday map (Mon=1..Sun=7)
  const wd = map.weekday; // e.g. "Mon"
  const wdMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    hh: Number(map.hour),
    mm: Number(map.minute),
    weekday: wdMap[wd] ?? null,
  };
}

function timeToMin(t) {
  // t can be "HH:MM" or "HH:MM:SS"
  if (!t) return null;
  const s = String(t);
  const [hh, mm] = s.split(":");
  const H = Number(hh);
  const M = Number(mm);
  if (!Number.isFinite(H) || !Number.isFinite(M)) return null;
  return H * 60 + M;
}

async function getSalonBySlug(slug) {
  const r = await query(
    `select id, slug, timezone
     from public.salons
     where slug = $1
     limit 1`,
    [slug]
  );
  return r.rows?.[0] || null;
}

async function getAppointment(salon_id, id) {
  const r = await query(
    `select
       a.*,
       sv.duration_min as service_duration_min
     from public.appointments a
     left join public.services sv on sv.id = a.service_id
     where a.salon_id = $1 and a.id = $2
     limit 1`,
    [salon_id, id]
  );
  return r.rows?.[0] || null;
}

async function getBusinessHoursForWeekday(salon_id, weekday) {
  const r = await query(
    `select weekday, open_time, close_time
     from public.business_hours
     where salon_id = $1 and weekday = $2
     limit 1`,
    [salon_id, weekday]
  );
  return r.rows?.[0] || null;
}

async function hasOverlap({ salon_id, new_start, new_end, exclude_id }) {
  const r = await query(
    `select id
     from public.appointments
     where salon_id = $1
       and id <> $2
       and kind = 'booking'
       and (status is null or status <> 'cancelled')
       and start_at < $3
       and end_at > $4
     limit 1`,
    [salon_id, exclude_id, new_end.toISOString(), new_start.toISOString()]
  );
  return !!r.rows?.length;
}

function bad(msg) {
  return json({ error: msg || "Technischer Fehler. Bitte erneut versuchen." }, 400);
}

function conflict(msg) {
  return json({ error: msg || "Zeit ist bereits belegt. Bitte andere Uhrzeit wählen." }, 409);
}

// ---- PATCH: reschedule ----
export async function PATCH(req, { params }) {
  try {
    const slug = params?.slug;
    const id = params?.id;

    if (!slug || !id || !isUuid(id)) return bad("Ungültige Anfrage.");

    const salon = await getSalonBySlug(slug);
    if (!salon) return bad("Salon nicht gefunden.");

    const body = await req.json().catch(() => ({}));
    const start_at_raw = body?.start_at;

    if (!start_at_raw) return bad("start_at fehlt.");
    const newStart = new Date(start_at_raw);
    if (Number.isNaN(newStart.getTime())) return bad("Ungültiges Datum.");

    const appt = await getAppointment(salon.id, id);
    if (!appt) return bad("Termin nicht gefunden.");

    const dur = Number(appt.service_duration_min || 0);
    if (!Number.isFinite(dur) || dur <= 0) return bad("Service-Dauer fehlt.");

    const newEnd = new Date(newStart.getTime() + dur * 60 * 1000);

    // Hours check in salon timezone
    const tz = salon.timezone || "Europe/Berlin";
    const lp = getLocalParts(newStart, tz);
    if (!lp.weekday) return bad("Timezone Fehler.");

    const bh = await getBusinessHoursForWeekday(salon.id, lp.weekday);
    if (!bh?.open_time || !bh?.close_time) {
      return bad("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
    }

    const openMin = timeToMin(bh.open_time);
    const closeMin = timeToMin(bh.close_time);
    if (openMin == null || closeMin == null) {
      return bad("Öffnungszeiten ungültig konfiguriert.");
    }

    const startLocalMin = lp.hh * 60 + lp.mm;

    // compute end local minutes (same local day assumption for V1)
    const endParts = getLocalParts(newEnd, tz);
    if (!endParts.weekday) return bad("Timezone Fehler.");
    if (endParts.weekday !== lp.weekday) {
      return bad("Termin darf nicht über Mitternacht gehen (V1).");
    }
    const endLocalMin = endParts.hh * 60 + endParts.mm;

    if (!(startLocalMin >= openMin && endLocalMin <= closeMin)) {
      return bad("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
    }

    // Overlap check
    const overlap = await hasOverlap({ salon_id: salon.id, new_start: newStart, new_end: newEnd, exclude_id: id });
    if (overlap) return conflict("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");

    await query(
      `update public.appointments
       set start_at = $1,
           end_at = $2,
           updated_at = now()
       where salon_id = $3 and id = $4`,
      [newStart.toISOString(), newEnd.toISOString(), salon.id, id]
    );

    return json({ ok: true });
  } catch (e) {
    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}

// ---- DELETE: hard delete (V1) ----
export async function DELETE(_req, { params }) {
  try {
    const slug = params?.slug;
    const id = params?.id;

    if (!slug || !id || !isUuid(id)) return bad("Ungültige Anfrage.");

    const salon = await getSalonBySlug(slug);
    if (!salon) return bad("Salon nicht gefunden.");

    await query(`delete from public.appointments where salon_id = $1 and id = $2`, [salon.id, id]);

    return json({ ok: true });
  } catch (e) {
    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
