import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// ---------- helpers ----------
function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function bad(msg) {
  return json({ error: msg || "Technischer Fehler. Bitte erneut versuchen." }, 400);
}

function conflict(msg) {
  return json({ error: msg || "Zeit ist bereits belegt. Bitte andere Uhrzeit wählen." }, 409);
}

function isUuid(v) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function timeToMin(t) {
  if (!t) return null;
  const s = String(t);
  const [hh, mm] = s.split(":");
  const H = Number(hh);
  const M = Number(mm);
  if (!Number.isFinite(H) || !Number.isFinite(M)) return null;
  return H * 60 + M;
}

// local parts in salon timezone (no libs)
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

  const wdMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    weekday: wdMap[map.weekday] ?? null,
    hh: Number(map.hour),
    mm: Number(map.minute),
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
  };
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

async function getServiceForSalon(salon_id, service_id) {
  const r = await query(
    `select id, name, duration_min
     from public.services
     where salon_id = $1 and id = $2
     limit 1`,
    [salon_id, service_id]
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

async function hasOverlap({ salon_id, new_start, new_end }) {
  const r = await query(
    `select id
     from public.appointments
     where salon_id = $1
       and kind = 'booking'
       and (status is null or status <> 'cancelled')
       and start_at < $2
       and end_at > $3
     limit 1`,
    [salon_id, new_end.toISOString(), new_start.toISOString()]
  );
  return !!r.rows?.length;
}

// ---------- POST: create appointment ----------
export async function POST(req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) return bad("Ungültige Anfrage.");

    const salon = await getSalonBySlug(slug);
    if (!salon) return bad("Salon nicht gefunden.");

    const body = await req.json().catch(() => ({}));

    // Accept BOTH naming styles (prevents regressions)
    const service_id = body?.service_id || body?.serviceId || body?.serviceID || "";
    const start_at_raw = body?.start_at || body?.startAt || body?.start || "";

    const customer_name =
      (body?.customer_name ?? body?.customerName ?? "").toString().trim();

    const customer_phone =
      (body?.customer_phone ?? body?.customerPhone ?? body?.phone ?? null);
    const customer_email =
      (body?.customer_email ?? body?.customer_mail ?? body?.email ?? null);
    const internal_note =
      (body?.internal_note ?? body?.internalNote ?? body?.note ?? null);

    // Required fields
    if (!service_id || !start_at_raw || !customer_name) {
      return bad("Missing required fields.");
    }
    if (!isUuid(service_id)) return bad("Ungültiger Service.");

    const start = new Date(start_at_raw);
    if (Number.isNaN(start.getTime())) return bad("Ungültiges Datum.");

    const service = await getServiceForSalon(salon.id, service_id);
    if (!service) return bad("Service nicht gefunden.");

    const dur = Number(service.duration_min || 0);
    if (!Number.isFinite(dur) || dur <= 0) return bad("Service-Dauer fehlt.");

    const end = new Date(start.getTime() + dur * 60 * 1000);

    // Business hours check
    const tz = salon.timezone || "Europe/Berlin";
    const lpStart = getLocalParts(start, tz);
    const lpEnd = getLocalParts(end, tz);

    if (!lpStart.weekday || !lpEnd.weekday) return bad("Timezone Fehler.");
    if (lpEnd.weekday !== lpStart.weekday) {
      return bad("Termin darf nicht über Mitternacht gehen (V1).");
    }

    const bh = await getBusinessHoursForWeekday(salon.id, lpStart.weekday);
    if (!bh?.open_time || !bh?.close_time) {
      return bad("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
    }

    const openMin = timeToMin(bh.open_time);
    const closeMin = timeToMin(bh.close_time);
    if (openMin == null || closeMin == null) return bad("Öffnungszeiten ungültig konfiguriert.");

    const startLocalMin = lpStart.hh * 60 + lpStart.mm;
    const endLocalMin = lpEnd.hh * 60 + lpEnd.mm;

    if (!(startLocalMin >= openMin && endLocalMin <= closeMin)) {
      return bad("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
    }

    // Overlap check
    const overlap = await hasOverlap({ salon_id: salon.id, new_start: start, new_end: end });
    if (overlap) return conflict("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");

    // Insert
    const ins = await query(
      `insert into public.appointments
       (salon_id, service_id, customer_id, kind, status, start_at, end_at, notes,
        customer_name, customer_phone, customer_email, internal_note, created_at, updated_at)
       values
       ($1, $2, null, 'booking', 'confirmed', $3, $4, null,
        $5, $6, $7, $8, now(), now())
       returning id`,
      [
        salon.id,
        service_id,
        start.toISOString(),
        end.toISOString(),
        customer_name,
        customer_phone ? String(customer_phone).trim() : null,
        customer_email ? String(customer_email).trim() : null,
        internal_note ? String(internal_note).trim() : null,
      ]
    );

    return json({ ok: true, id: ins.rows?.[0]?.id || null });
  } catch (e) {
    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
