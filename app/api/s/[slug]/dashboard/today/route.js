import { query } from "@/lib/db";

function weekdayBerlin(d = new Date()) {
  // JS: 0=Sun..6=Sat -> DB: 1=Mon..7=Sun
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

function timeToMinutes(t) {
  // "10:15:00" | "10:15" -> minutes
  if (!t) return null;
  const parts = String(t).split(":");
  const hh = Number(parts[0]);
  const mm = Number(parts[1] || 0);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    // Resolve salon_id
    const salonRes = await query("select id from salons where slug = $1 limit 1", [slug]);
    if (salonRes.rowCount === 0) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salon_id = salonRes.rows[0].id;

    // Today bounds (UTC day)
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    // Rows (include customer fields)
    const rowsRes = await query(
      `
      select
        a.id,
        a.salon_id,
        a.service_id,
        a.customer_id,
        a.kind,
        a.status,
        a.start_at,
        a.end_at,
        a.notes,
        a.gcal_event_id,
        a.gcal_sync_status,
        a.gcal_last_sync_at,
        a.gcal_sync_error,
        a.created_at,
        a.updated_at,
        a.customer_name,
        a.customer_phone,
        a.customer_email,
        a.customer_mail,
        a.internal_note,
        s.name as service_name
      from appointments a
      left join services s on s.id = a.service_id
      where a.salon_id = $1
        and a.start_at >= $2
        and a.start_at <= $3
      order by a.start_at asc
      `,
      [salon_id, start.toISOString(), end.toISOString()]
    );

    // Display window (based on business_hours for today — Berlin weekday)
    const wd = weekdayBerlin(new Date());
    const bhRes = await query(
      `
      select open_time, close_time
      from business_hours
      where salon_id = $1 and weekday = $2
      limit 1
      `,
      [salon_id, wd]
    );

    let display_start_min = 8 * 60;
    let display_end_min = 21 * 60;

    if (bhRes.rowCount > 0) {
      const openMin = timeToMinutes(bhRes.rows[0].open_time);
      const closeMin = timeToMinutes(bhRes.rows[0].close_time);

      // Only if both present -> open day
      if (openMin != null && closeMin != null) {
        display_start_min = clamp(openMin - 60, 6 * 60, 22 * 60);
        display_end_min = clamp(closeMin + 60, 6 * 60, 22 * 60);
        if (display_end_min <= display_start_min) {
          display_start_min = 8 * 60;
          display_end_min = 21 * 60;
        }
      }
    }

    return Response.json({
      slug,
      salon_id,
      today_count: rowsRes.rows.length,
      rows: rowsRes.rows,
      display_start_min,
      display_end_min,
    });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/dashboard/today",
      slug,
      message: error?.message,
    });
    return Response.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
  }
}
