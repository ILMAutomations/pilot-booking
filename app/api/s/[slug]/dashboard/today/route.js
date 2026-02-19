import { query } from "@/lib/db";

function minutesFromTimeString(t) {
  // "10:00:00" or "10:00"
  if (!t) return null;
  const [hh, mm] = String(t).split(":");
  const h = Number(hh);
  const m = Number(mm);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(_req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    // 1) Resolve salon_id
    const salonRes = await query(
      "select id from salons where slug = $1 limit 1",
      [slug]
    );
    if (salonRes.rowCount === 0) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salon_id = salonRes.rows[0].id;

    // 2) Today range (UTC day)
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    // 3) Load appointments (today) + service name
    const apptRes = await query(
      `
      select
        a.*,
        s.name as service_name
      from appointments a
      left join services s on s.id = a.service_id
      where a.salon_id = $1
        and a.start_at >= $2
        and a.start_at <= $3
      order by a.start_at asc
      `,
      [salon_id, dayStart.toISOString(), dayEnd.toISOString()]
    );

    // 4) Display window (based on today's business_hours if present)
    // weekday: 1=Mon ... 7=Sun  (assumption based on your data)
    // We'll compute "today weekday" in Europe/Berlin-like, but DB stores just weekday.
    // Using JS local weekday: 0=Sun..6=Sat -> convert to 1..7
    const jsDay = new Date().getDay(); // 0..6
    const weekday = jsDay === 0 ? 7 : jsDay; // 1..7

    const hoursRes = await query(
      `
      select open_time, close_time
      from business_hours
      where salon_id = $1 and weekday = $2
      limit 1
      `,
      [salon_id, weekday]
    );

    let display_start_min = 8 * 60;
    let display_end_min = 21 * 60;

    if (hoursRes.rowCount > 0) {
      const openMin = minutesFromTimeString(hoursRes.rows[0].open_time);
      const closeMin = minutesFromTimeString(hoursRes.rows[0].close_time);

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
      today_count: apptRes.rows.length,
      rows: apptRes.rows,
      display_start_min,
      display_end_min,
    });
  } catch (e) {
    return Response.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
