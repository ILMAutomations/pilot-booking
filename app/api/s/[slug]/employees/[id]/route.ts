import { query } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json();

  const { name, active } = body;

  await query(
    `update employees
     set
       name = coalesce($1, name),
       active = coalesce($2, active)
     where id = $3`,
    [name ?? null, active ?? null, id]
  );

  return Response.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  await query(
    `delete from employees where id = $1`,
    [id]
  );

  return Response.json({ ok: true });
}
