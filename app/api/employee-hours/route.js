import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const employee_id = searchParams.get("employee_id");

  const res = await query(
    `SELECT * FROM employee_hours WHERE employee_id = $1`,
    [employee_id]
  );

  return NextResponse.json(res.rows);
}

// POST (UPSERT)
export async function POST(req) {
  try {
    const body = await req.json();

    console.log("BODY:", body);

    const { employee_id, weekday, start_time, end_time, is_active } = body;

    console.log("VALUES:", {
      employee_id,
      weekday,
      start_time,
      end_time,
      is_active,
    });

    await query(
      `
      INSERT INTO employee_hours (employee_id, weekday, start_time, end_time, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id, weekday)
      DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        is_active = EXCLUDED.is_active
      `,
      [employee_id, weekday, start_time, end_time, is_active]
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
