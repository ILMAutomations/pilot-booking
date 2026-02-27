import { query } from "@/lib/db";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return json({ error: "Missing slug" }, 400);

    const salonRes = await query("select id from public.salons where slug=$1 limit 1", [slug]);
    if (!salonRes.rowCount) return json({ error: "Salon not found" }, 404);
    const salon_id = salonRes.rows[0].id;

    // Today range in UTC (simple, matches existing behavior)
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    const rowsRes = await query(
      `
      select
        a.*,
        s.name as service_name
      from public.appointments a
      join public.services s on s.id = a.service_id
      where a.salon_id = $1
        and a.start_at >= $2
        and a.start_at < $3
      order by a.start_at asc
      `,
      [salon_id, start.toISOString(), end.toISOString()]
    );

    // Display window from business hours (existing feature)
    const jsDay = now.getDay(); // 0=Sun..6=Sat
    const weekday = jsDay === 0 ? 7 : jsDay;

    const bh = await query(
      `select open_time, close_time from public.business_hours where salon_id=$1 and weekday=$2 limit 1`,
      [salon_id, weekday]
    );

    let display_start_min = 8 * 60;
    let display_end_min = 21 * 60;

    if (bh.rowCount) {
      const open = String(bh.rows[0].open_time || "08:00:00").slice(0, 5);
      const close = String(bh.rows[0].close_time || "21:00:00").slice(0, 5);
      const [oh, om] = open.split(":").map((x) => parseInt(x, 10));
      const [ch, cm] = close.split(":").map((x) => parseInt(x, 10));

      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;

      display_start_min = Math.max(6 * 60, openMin - 60);
      display_end_min = Math.min(22 * 60, closeMin + 60);
    }

    return json({
      slug,
      salon_id,
      today_count: rowsRes.rows.length,
      rows: rowsRes.rows, // includes customer_name/phone/email/internal_note columns automatically
      display_start_min,
      display_end_min,
    });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/dashboard/today",
      slug,
      message: error?.message,
    });
    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
