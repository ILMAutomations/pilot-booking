import { query } from "@/lib/db";

export async function GET(req) {
  const url = new URL(req.url);
  const employee_id = url.searchParams.get("employee_id");

  const res = await query(
    `select * from employee_hours where employee_id = $1`,
    [employee_id]
  );

  return Response.json(res.rows);
}

export async function POST(req) {
  const body = await req.json();

  const res = await query(
    `
    insert into employee_hours (
      employee_id, weekday, start_time, end_time, is_active
    )
    values ($1,$2,$3,$4,$5)
    returning *
    `,
    [
      body.employee_id,
      body.weekday,
      body.start_time,
      body.end_time,
      body.is_active ?? true
    ]
  );

  return Response.json(res.rows[0]);
}
