import { query } from "@/lib/db";

export async function POST(req, { params }) {

  const slug = params?.slug;

  try {

    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    const body = await req.json();

    const {
      service_id,
      start_at,
      customer_name,
      customer_phone,
      customer_email,
      internal_note
    } = body;

    if (!service_id || !start_at) {
      return Response.json(
        { error: "service_id and start_at required" },
        { status: 400 }
      );
    }

    const salonRes = await query(
      `select id from salons where slug = $1 limit 1`,
      [slug]
    );

    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }

    const salon_id = salonRes.rows[0].id;

    const serviceRes = await query(
      `select duration_min from services where id = $1 limit 1`,
      [service_id]
    );

    if (!serviceRes.rowCount) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }

    const duration = serviceRes.rows[0].duration_min;

    const start = new Date(start_at);
    const end = new Date(start.getTime() + duration * 60000);

    const overlap = await query(
      `
      select id
      from appointments
      where salon_id = $1
      and status <> 'cancelled'
      and start_at < $2
      and end_at > $3
      limit 1
      `,
      [salon_id, end.toISOString(), start.toISOString()]
    );

    if (overlap.rowCount) {
      return Response.json(
        { error: "Slot already booked" },
        { status: 409 }
      );
    }

    const insert = await query(
      `
      insert into appointments (
        salon_id,
        service_id,
        start_at,
        end_at,
        customer_name,
        customer_phone,
        customer_email,
        internal_note,
        status
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,'confirmed')
      returning id
      `,
      [
        salon_id,
        service_id,
        start.toISOString(),
        end.toISOString(),
        customer_name || null,
        customer_phone || null,
        customer_email || null,
        internal_note || null
      ]
    );

    return Response.json({
      ok: true,
      id: insert.rows[0].id
    });

  } catch (error) {

    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/appointments",
      slug,
      message: error?.message,
    });

    return Response.json(
      { error: "Technischer Fehler." },
      { status: 500 }
    );
  }
}
