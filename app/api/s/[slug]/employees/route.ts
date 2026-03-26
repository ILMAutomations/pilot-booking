import { query } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const salon = await query(
    `select id from salons where slug = $1`,
    [slug]
  );

  if (!salon.rows[0]) {
    return Response.json({ error: 'Salon not found' }, { status: 404 });
  }

  const salon_id = salon.rows[0].id;

  const res = await query(
    `select id, name, active
     from employees
     where salon_id = $1
     order by created_at asc`,
    [salon_id]
  );

  return Response.json({ rows: res.rows });
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const body = await req.json();

  const { name } = body;

  if (!name) {
    return Response.json({ error: 'name required' }, { status: 400 });
  }

  const salon = await query(
    `select id from salons where slug = $1`,
    [slug]
  );

  if (!salon.rows[0]) {
    return Response.json({ error: 'Salon not found' }, { status: 404 });
  }

  const salon_id = salon.rows[0].id;

  const res = await query(
    `insert into employees (salon_id, name)
     values ($1, $2)
     returning id`,
    [salon_id, name]
  );

  return Response.json({ ok: true, id: res.rows[0].id });
}
