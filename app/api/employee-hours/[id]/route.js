import { query } from "@/lib/db";

export async function PATCH(req, { params }) {
  const body = await req.json();

  await query(
    `
    update employee_hours
    set start_time = $1,
        end_time = $2,
        is_active = $3
    where id = $4
    `,
    [
      body.start_time,
      body.end_time,
      body.is_active,
      params.id
    ]
  );

  return Response.json({ ok: true });
}
