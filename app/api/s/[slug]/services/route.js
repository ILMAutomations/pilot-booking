// app/api/s/[slug]/services/route.js
import { query } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const slug = params?.slug;

    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    // 1) slug -> salon_id
    const salonRes = await query(
      "select id, slug from salons where slug = $1 limit 1",
      [slug]
    );

    if (salonRes.rowCount === 0) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }

    const salon_id = salonRes.rows[0].id;

    // 2) services for salon
    const servicesRes = await query(
      `
      select id, name, duration_min
      from services
      where salon_id = $1
      order by name asc
      `,
      [salon_id]
    );

    return Response.json({
      slug,
      salon_id,
      services: servicesRes.rows,
    });
  } catch (e) {
    // Keep error readable (pilot)
    return Response.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
