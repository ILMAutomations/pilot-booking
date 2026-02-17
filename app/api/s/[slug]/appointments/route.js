import { query } from "../../../../../lib/db";

export async function POST(req, { params }) {
  const slug = params.slug;

  try {
    const body = await req.json();

    const start_at = body.start_at;
    const end_at = body.end_at;
    const service_id = body.service_id;
    const notes = body.notes || null;

    if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });
    if (!start_at) return Response.json({ error: "Missing start_at (ISO string)" }, { status: 400 });
    if (!end_at) return Response.json({ error: "Missing end_at (ISO string)" }, { status: 400 });
    if (!service_id) return Response.json({ error: "Missing service_id" }, { status: 400 });

    // 1) Resolve salon_id by slug
    const salonRes = await query("select id from salons where slug = $1 limit 1", [slug]);
    if (salonRes.rowCount === 0) return Response.json({ error: "Salon not found" }, { status: 404 });
    const salon_id = salonRes.rows[0].id;

    // 2) Safety: ensure service belongs to this salon
    const svcRes = await query(
      "select id from services where id = $1 and salon_id = $2 limit 1",
      [service_id, salon_id]
    );
    if (svcRes.rowCount === 0) {
      return Response.json({ error: "service_id not found for this salon" }, { status: 400 });
    }

    // 3) Insert appointment
    const ins = await query(
      `insert into appointments
        (salon_id, service_id, customer_id, kind, status, start_at, end_at, notes, gcal_sync_status)
       values
        ($1, $2, null, 'booking', 'confirmed', $3::timestamptz, $4::timestamptz, $5, 'pending')
       returning *`,
      [salon_id, service_id, start_at, end_at, notes]
    );

    return Response.json(ins.rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
