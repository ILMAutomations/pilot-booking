import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req, { params }) {

  const slug = params?.slug;

  const salonRes = await query(
    `select id from salons where slug = $1 limit 1`,
    [slug]
  );

  const salon = salonRes.rows?.[0];

  if (!salon) {
    return NextResponse.json({ error: "Salon nicht gefunden." }, { status: 404 });
  }

  const res = await query(
    `select
      customer_name,
      customer_phone,
      MAX(start_at) as last_visit
     from appointments
     where salon_id = $1
     group by customer_name, customer_phone
     order by last_visit desc`,
    [salon.id]
  );

  return NextResponse.json({
    rows: res.rows || []
  });
}
