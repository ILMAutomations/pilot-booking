import { query } from "../../../../../../lib/db";


export async function GET(req, { params }) {
  const slug = params.slug;
  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });

  try {
    const result = await query(
      `SELECT *
       FROM appointments
       WHERE salon_slug = $1
       AND date::date = CURRENT_DATE
       ORDER BY date ASC`,
      [slug]
    );

    return Response.json({ slug, today_count: result.rows.length, rows: result.rows });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
