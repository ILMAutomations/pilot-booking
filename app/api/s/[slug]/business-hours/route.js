import { query } from "@/lib/db";

export async function GET(req, { params }) {
  const slug = params.slug;

  try {
    const salonRes = await query(
      "select id from salons where slug = $1",
      [slug]
    );

    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }

    const salonId = salonRes.rows[0].id;

    const hours = await query(
      "select id, weekday, open_time, close_time from business_hours where salon_id = $1 order by weekday",
      [salonId]
    );

    return Response.json({ hours: hours.rows });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug,
      message: error.message,
    });

    return Response.json(
      { error: "Technischer Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const slug = params.slug;

  try {
    const body = await req.json();
    const { hours } = body;

    const salonRes = await query(
      "select id from salons where slug = $1",
      [slug]
    );

    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }

    const salonId = salonRes.rows[0].id;

    for (const row of hours) {
      await query(
        `update business_hours
         set open_time = $1,
             close_time = $2
         where id = $3
           and salon_id = $4`,
        [row.open_time, row.close_time, row.id, salonId]
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug,
      message: error.message,
    });

    return Response.json(
      { error: "Technischer Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
