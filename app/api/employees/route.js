import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { randomUUID } from "crypto";

// GET employees by slug
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  const salonRes = await query(
    `select id from salons where slug = $1 limit 1`,
    [slug]
  );

  if (!salonRes.rowCount) {
    return NextResponse.json([]);
  }

  const salon_id = salonRes.rows[0].id;

  const res = await query(
    `select id, name, active from employees where salon_id = $1 order by name asc`,
    [salon_id]
  );

  return NextResponse.json(res.rows);
}

// CREATE employee
export async function POST(req) {
  const body = await req.json();

  const { name, slug } = body;

  const salonRes = await query(
    `select id from salons where slug = $1 limit 1`,
    [slug]
  );

  if (!salonRes.rowCount) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  const salon_id = salonRes.rows[0].id;

  const id = randomUUID();

  await query(
    `
    insert into employees (id, salon_id, name, active)
    values ($1, $2, $3, true)
    `,
    [id, salon_id, name]
  );

  return NextResponse.json({ id, name, active: true });
}
