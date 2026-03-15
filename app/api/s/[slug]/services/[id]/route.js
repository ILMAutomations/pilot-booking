import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(_req, { params }) {

  const slug = params?.slug;
  const id = params?.id;

  try {

    if (!slug || !id) {
      return NextResponse.json(
        { error: "missing_params" },
        { status: 400 }
      );
    }

    const salonRes = await query(
      "select id from salons where slug=$1 limit 1",
      [slug]
    );

    if (!salonRes.rowCount) {
      return NextResponse.json(
        { error: "salon_not_found" },
        { status: 404 }
      );
    }

    const salonId = salonRes.rows[0].id;

    await query(
      `
      delete from services
      where id=$1 and salon_id=$2
      `,
      [id, salonId]
    );

    return NextResponse.json({
      ok: true
    });

  } catch (error) {

    console.error("[API_ERROR]", {
      route: "DELETE /api/s/[slug]/services/[id]",
      slug,
      id,
      message: error?.message,
    });

    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );

  }

}
