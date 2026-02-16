import { query } from "../../../../../lib/db";

export async function POST(req, { params }) {
  const slug = params.slug;

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  // REQUIRED
  const start_at = body?.start_at; // ISO string
  const end_at = body?.end_at;     // ISO string

  // OPTIONAL
  const service_id = body?.service_id; // UUID or int (whatever your schema uses)
  const notes = body?.notes ?? null;

  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });
  if (!start_at) return Response.json({ error: "Missing start_at (ISO string)" }, { status: 400 });
  if (!end_at) return Response.json({ error: "Missing end_at (ISO string)" }, { status: 400 });

  try {
    // 1) Resolve salon_id from slug
    const salonRes = await query(
      "SELECT id FROM salons WHERE slug = $1 LIMIT 1",
      [slug]
    );
    if (salonRes.rowCount === 0) {
      return Response.json({ error: `Salon slug not found: ${slug}` }, { status: 404 });
    }
    const salon_id = salonRes.rows[0].id;

    // 2) Resolve service_id: use provided or pick first service for salon
    let final_service_id = service_id;
    if (!final_service_id) {
      const svcRes = await query(
        "SELECT id FROM services WHERE salon_id = $1 ORDER BY created_at ASC LIMIT 1",
        [salon_id]
      );
      if (svcRes.rowCount === 0) {
        return Response.json(
          { error: `No services found for salon_id ${salon_id}. Provide service_id in request.` },
          { status: 400 }
        );
      }
      final_service_id = svcRes.rows[0].id;
    }

    // 3) Insert appointment (only columns we know exist)
    const ins = await query(
      `INSERT INTO appointments (salon_id, service_id, start_at, end_at, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [salon_id, final_service_id, start_at, end_at, notes]
    );

    return Response.json(ins.rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
