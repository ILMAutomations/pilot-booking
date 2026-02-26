import { query } from "@/lib/db";

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

    const salonRes = await query("select id from public.salons where slug = $1", [slug]);
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

    const salonRes = await query("select id from public.salons where slug = $1", [slug]);
    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salonId = salonRes.rows[0].id;

    // We accept 0..6 weekdays. Empty open/close means "closed" => no row stored.
    const cleaned = hours
      .map((h) => ({
        weekday: Number(h?.weekday),
        open_time: (h?.open_time || "").trim(),
        close_time: (h?.close_time || "").trim(),
      }))
      .filter((h) => Number.isFinite(h.weekday) && h.weekday >= 0 && h.weekday <= 6);

    // Store only rows that have both times present (valid open day)
    const toStore = cleaned.filter((h) => h.open_time && h.close_time);

    await query("begin");

    // Hard reset for salon (safe & simple for v1)
    await query("delete from public.business_hours where salon_id = $1", [salonId]);

    for (const h of toStore) {
      await query(
        `
        insert into public.business_hours (salon_id, weekday, open_time, close_time)
        values ($1, $2, $3, $4)
        `,
        [salonId, h.weekday, h.open_time, h.close_time]
      );
    }

    await query("commit");

    return Response.json({
      ok: true,
      slug,
      salon_id: salonId,
      stored_count: toStore.length,
      note: "Empty days treated as closed (no row stored).",
    });
  } catch (error) {
    try {
      await query("rollback");
    } catch {}

    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours (POST)",
      slug,
      message: error?.message,
    });

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
