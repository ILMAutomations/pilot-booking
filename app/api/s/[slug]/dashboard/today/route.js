import { query } from "../../../../../../lib/db";

export async function GET(req, { params }) {
  const slug = params.slug;
  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

  try {
    // resolve salon_id
    const salonRes = await query(
      "SELECT id FROM salons WHERE slug = $1 LIMIT 1",
      [slug]
    );
    if (salonRes.rowCount === 0) {
      return Response.json({ error: `Salon slug not found: ${slug}` }, { status: 404 });
    }
    const salon_id = salonRes.rows[0].id;

    // fetch today's appointments for this salon
    const result = await query(
      `SELECT *
       FROM appointments
       WHERE salon_id = $1
       AND start_at::date = CURRENT_DATE
       ORDER BY start_at ASC`,
      [salon_id]
    );

    return Response.json({
      slug,
      salon_id,
      today_count: result.rows.length,
      rows: result.rows
    });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
