import { query } from "@/lib/db";

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

    const salonRes = await query(
      "select id from public.salons where slug = $1",
      [slug]
    );
    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salonId = salonRes.rows[0].id;

    const hoursRes = await query(
      `
      select id, weekday, open_time, close_time, created_at
      from public.business_hours
      where salon_id = $1
      order by weekday asc
      `,
      [salonId]
    );

    return Response.json({ slug, salon_id: salonId, hours: hoursRes.rows });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours (GET)",
      slug,
      message: error?.message,
    });
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const hours = Array.isArray(body?.hours) ? body.hours : [];

    const salonRes = await query(
      "select id from public.salons where slug = $1",
      [slug]
    );
    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salonId = salonRes.rows[0].id;

    // We store only rows that have open+close (empty = closed => no row).
    // ISO weekday: 1..7 (Mon..Sun)
    const payload = hours
      .map((h) => ({
        weekday: Number(h?.weekday),
        open_time: (h?.open_time || "").trim(),
        close_time: (h?.close_time || "").trim(),
      }))
      .filter(
        (h) =>
          Number.isFinite(h.weekday) &&
          h.weekday >= 1 &&
          h.weekday <= 7 &&
          h.open_time &&
          h.close_time
      );

    // ATOMIC replace in ONE SQL statement (no BEGIN/COMMIT needed)
    const res = await query(
      `
      with input as (
        select $2::jsonb as j
      ),
      del as (
        delete from public.business_hours
        where salon_id = $1
        returning 1
      ),
      ins as (
        insert into public.business_hours (salon_id, weekday, open_time, close_time)
        select
          $1,
          (r->>'weekday')::int,
          (r->>'open_time')::time,
          (r->>'close_time')::time
        from jsonb_array_elements((select j from input)) r
        where
          (r->>'weekday') is not null
          and (r->>'weekday')::int between 1 and 7
          and coalesce(r->>'open_time','') <> ''
          and coalesce(r->>'close_time','') <> ''
        returning 1
      )
      select
        (select count(*) from ins) as stored_count
      `,
      [salonId, JSON.stringify(payload)]
    );

    return Response.json({
      ok: true,
      slug,
      salon_id: salonId,
      stored_count: res?.rows?.[0]?.stored_count ?? 0,
      note: "ISO weekday: 1=Mon .. 7=Sun. Empty days are treated as closed (not stored).",
    });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours (POST)",
      slug,
      message: error?.message,
    });
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
