import { query } from "@/lib/db";

export async function POST(req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const service_id = body?.service_id;
    const start_at = body?.start_at;
    const end_at = body?.end_at;

    if (!service_id) {
      return Response.json({ error: "Missing service_id" }, { status: 400 });
    }
    if (!start_at) {
      return Response.json({ error: "Missing start_at" }, { status: 400 });
    }
    if (!end_at) {
      return Response.json({ error: "Missing end_at" }, { status: 400 });
    }

    // Resolve salon
    const salonRes = await query(
      "select id from salons where slug = $1 limit 1",
      [slug]
    );
    if (salonRes.rowCount === 0) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salon_id = salonRes.rows[0].id;

    // Ensure service belongs to salon
    const svcRes = await query(
      "select id, duration_min from services where id = $1 and salon_id = $2 limit 1",
      [service_id, salon_id]
    );
    if (svcRes.rowCount === 0) {
      return Response.json({ error: "Service not found for this salon" }, { status: 400 });
    }

    // Insert appointment
    const insRes = await query(
      `
      insert into appointments (salon_id, service_id, customer_id, kind, status, start_at, end_at, notes, gcal_sync_status)
      values ($1, $2, null, 'booking', 'confirmed', $3, $4, $5, 'pending')
      returning *
      `,
      [salon_id, service_id, start_at, end_at, body?.notes ?? null]
    );

    return Response.json(insRes.rows[0], { status: 201 });
  } catch (e) {
    // If overlap constraint triggers, Postgres usually returns code 23P01
    const msg = e?.message || String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
