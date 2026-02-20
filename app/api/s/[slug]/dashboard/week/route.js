import { query } from "@/lib/db";

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    // Resolve salon_id
    const salonRes = await query("select id from salons where slug = $1 limit 1", [slug]);
    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salonId = salonRes.rows[0].id;

    // Week window based on Europe/Berlin calendar days (pilot-safe, reduces TZ confusion)
    // week_start_date = today in Berlin (YYYY-MM-DD)
    // week_end_date = week_start_date + 7 days
    const rowsRes = await query(
      `
      with params as (
        select
          ($1::uuid) as salon_id,
          ((now() at time zone 'Europe/Berlin')::date) as week_start_date,
          (((now() at time zone 'Europe/Berlin')::date) + 7) as week_end_date
      ),
      bounds as (
        select
          salon_id,
          week_start_date,
          week_end_date,
          (week_start_date::timestamp at time zone 'Europe/Berlin') as start_ts,
          (week_end_date::timestamp at time zone 'Europe/Berlin') as end_ts
        from params
      )
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
        a.created_at,
        s.name as service_name,
        to_char((a.start_at at time zone 'Europe/Berlin')::date, 'YYYY-MM-DD') as day_key
      from appointments a
      join services s on s.id = a.service_id
      cross join bounds b
      where
        a.salon_id = b.salon_id
        and a.start_at >= b.start_ts
        and a.start_at < b.end_ts
      order by a.start_at asc
      `,
      [salonId]
    );

    // group into 7 buckets (Mon-Sun layout is UI concern; here we just provide day_key groups)
    const grouped = {};
    for (const r of rowsRes.rows) {
      const k = r.day_key;
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(r);
    }

    // return 7 day keys starting from today (Berlin)
    const daysRes = await query(
      `
      select
        to_char(((now() at time zone 'Europe/Berlin')::date + i)::date, 'YYYY-MM-DD') as day_key
      from generate_series(0, 6) as i
      `,
      []
    );

    const dayKeys = daysRes.rows.map((x) => x.day_key);
    const days = dayKeys.map((k) => ({
      date: k,
      rows: grouped[k] || [],
    }));

    return Response.json({
      slug,
      salon_id: salonId,
      days,
    });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/dashboard/week",
      slug,
      message: error?.message,
    });
    return Response.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
