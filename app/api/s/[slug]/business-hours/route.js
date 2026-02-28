import { query } from "@/lib/db";

function normalizeTime(t) {
  // Accept "HH:MM" or "HH:MM:SS" -> return "HH:MM:SS"
  if (!t || typeof t !== "string") return null;
  const s = t.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return null;
}

async function getSalonIdBySlug(slug) {
  const r = await query(`select id from salons where slug = $1 limit 1`, [slug]);
  return r.rows?.[0]?.id || null;
}

export async function GET(_req, { params }) {
  const slug = params?.slug;
  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

  try {
    const salonId = await getSalonIdBySlug(slug);
    if (!salonId) return Response.json({ error: "Salon not found" }, { status: 404 });

    const r = await query(
      `select weekday, open_time, close_time
       from business_hours
       where salon_id = $1
       order by weekday asc`,
      [salonId]
    );

    return Response.json({
      slug,
      salon_id: salonId,
      rows: r.rows || [],
    });
  } catch (e) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug,
      message: e?.message || String(e),
    });
    return Response.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const slug = params?.slug;
  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

  try {
    const salonId = await getSalonIdBySlug(slug);
    if (!salonId) return Response.json({ error: "Salon not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const hours = Array.isArray(body?.hours)
      ? body.hours
      : Array.isArray(body?.rows)
      ? body.rows
      : null;

    if (!Array.isArray(hours)) {
      return Response.json({ error: "Missing hours[]" }, { status: 400 });
    }

    // Expect entries shaped like:
    // { weekday: 1..7, open_time: "10:00"|"10:00:00", close_time: "...", is_closed: true|false }
    // If is_closed true -> delete that weekday row
    // If open -> upsert open/close
    const closedWeekdays = [];
    const openEntries = [];

    for (const h of hours) {
      const weekday = Number(h?.weekday);
      if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
        return Response.json({ error: "Invalid weekday (must be 1..7)" }, { status: 400 });
      }

      const isClosed = Boolean(h?.is_closed);

      if (isClosed) {
        closedWeekdays.push(weekday);
        continue;
      }

      const open = normalizeTime(h?.open_time);
      const close = normalizeTime(h?.close_time);

      if (!open || !close) {
        return Response.json(
          { error: `Invalid open/close time for weekday ${weekday}` },
          { status: 400 }
        );
      }

      openEntries.push({ weekday, open, close });
    }

    // transaction
    await query("begin");

    // delete closed weekdays (if any)
    if (closedWeekdays.length > 0) {
      await query(
        `delete from business_hours
         where salon_id = $1 and weekday = any($2::int[])`,
        [salonId, closedWeekdays]
      );
    }

    // upsert open weekdays
    for (const e of openEntries) {
      await query(
        `insert into business_hours (salon_id, weekday, open_time, close_time)
         values ($1, $2, $3::time, $4::time)
         on conflict (salon_id, weekday)
         do update set open_time = excluded.open_time, close_time = excluded.close_time`,
        [salonId, e.weekday, e.open, e.close]
      );
    }

    await query("commit");

    // return fresh rows
    const r = await query(
      `select weekday, open_time, close_time
       from business_hours
       where salon_id = $1
       order by weekday asc`,
      [salonId]
    );

    return Response.json({
      slug,
      salon_id: salonId,
      rows: r.rows || [],
    });
  } catch (e) {
    try {
      await query("rollback");
    } catch {}
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug,
      message: e?.message || String(e),
    });
    return Response.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
  }
}
