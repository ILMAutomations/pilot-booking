import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(_req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) {
      return NextResponse.json({ error: "missing_slug" }, { status: 400 });
    }

    const salonRes = await query("select id from salons where slug=$1 limit 1", [
      slug,
    ]);
    if (!salonRes.rowCount) {
      return NextResponse.json({ error: "salon_not_found", slug }, { status: 404 });
    }

    const salonId = salonRes.rows[0].id;

    const servicesRes = await query(
      `
      select id, name, duration_min
      from services
      where salon_id=$1
      order by name asc
      `,
      [salonId]
    );

    return NextResponse.json({
      slug,
      salon_id: salonId,
      services: servicesRes.rows,
    });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/services",
      slug,
      message: error?.message,
    });
    return NextResponse.json(
      { error: "internal_error", slug },
      { status: 500 }
    );
  }
}
