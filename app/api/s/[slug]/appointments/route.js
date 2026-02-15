import { query } from "@/lib/db";

export async function POST(req, { params }) {
  const slug = params.slug;

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const name = body?.name;
  const date = body?.date;

  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });
  if (!name) return Response.json({ error: "Missing name" }, { status: 400 });
  if (!date) return Response.json({ error: "Missing date" }, { status: 400 });

  try {
    const result = await query(
      "INSERT INTO appointments (salon_slug, name, date) VALUES ($1, $2, $3) RETURNING *",
      [slug, name, date]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
