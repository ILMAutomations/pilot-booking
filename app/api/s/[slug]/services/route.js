import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/* =========================
   GET SERVICES
========================= */

export async function GET(_req, { params }) {

  const slug = params?.slug;

  try {

    if (!slug) {
      return NextResponse.json({ error: "missing_slug" }, { status: 400 });
    }

    const salonRes = await query(
      "select id from salons where slug=$1 limit 1",
      [slug]
    );

    if (!salonRes.rowCount) {
      return NextResponse.json(
        { error: "salon_not_found", slug },
        { status: 404 }
      );
    }

    const salonId = salonRes.rows[0].id;

    const servicesRes = await query(
      `
      select id, name, duration_min, price_cents
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


/* =========================
   CREATE SERVICE
========================= */

export async function POST(req, { params }) {

  const slug = params?.slug;

  try {

    if (!slug) {
      return NextResponse.json({ error: "missing_slug" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const name = body?.name;
    const price_cents = body?.price_cents;
    const duration_min = body?.duration_min;

    if (!name || !price_cents || !duration_min) {
      return NextResponse.json(
        { error: "missing_fields" },
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

    const insertRes = await query(
      `
      insert into services
      (salon_id, name, duration_min, price_cents)
      values ($1,$2,$3,$4)
      returning id
      `,
      [salonId, name, duration_min, price_cents]
    );

    return NextResponse.json({
      ok: true,
      id: insertRes.rows[0].id
    });

  } catch (error) {

    console.error("[API_ERROR]", {
      route: "POST /api/s/[slug]/services",
      slug,
      message: error?.message,
    });

    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );

  }

}
