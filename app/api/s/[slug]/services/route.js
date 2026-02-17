import { query } from "../../../../../lib/db";

export async function GET(req, { params }) {
  const slug = params.slug;
  if (!slug) {
    return Response.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const salonRes = await query(
      "SELECT id FROM salons WHERE slug = $1 LIMIT 1",
      [slug]
    );

    if (salonRes.rowCount === 0) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }

    const salon_id = salonRes.rows[0].id;

const servicesRes = await query(
  `SELECT id, name, duration_min
   FROM services
   WHERE salon_id = $1
   ORDER BY created_at ASC`,
  [salon_id]
);


    return Response.json({
      slug,
      services: servicesRes.rows
    });
  } catch (e) {
    return Response.json({ error: String(e.message) }, { status: 500 });
  }
}
