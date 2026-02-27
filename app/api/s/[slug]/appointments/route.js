import { query } from "@/lib/db";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req, { params }) {
  const slug = params?.slug;

  try {
    const body = await req.json().catch(() => ({}));

    const {
      service_id,
      start_at,
      end_at,
      customer_name,
      customer_phone,
      customer_email,
      internal_note,
    } = body || {};

    if (!slug) return json({ error: "Missing slug" }, 400);
    if (!service_id || !start_at || !end_at)
      return json({ error: "Missing required fields" }, 400);

    const name = String(customer_name || "").trim();
    if (!name) {
      return json(
        { error: "Bitte Kundennamen eingeben.", code: "MISSING_CUSTOMER_NAME" },
        400
      );
    }

    // Resolve salon
    const salonRes = await query(
      "select id from public.salons where slug=$1 limit 1",
      [slug]
    );

    if (!salonRes.rowCount)
      return json({ error: "Salon not found" }, 404);

    const salon_id = salonRes.rows[0].id;

    // Insert
    const ins = await query(
      `
      insert into public.appointments
      (salon_id, service_id, kind, status, start_at, end_at,
       customer_name, customer_phone, customer_email, internal_note)
      values
      ($1,$2,'booking','confirmed',$3,$4,$5,$6,$7,$8)
      returning id
      `,
      [
        salon_id,
        service_id,
        start_at,
        end_at,
        name,
        customer_phone || null,
        customer_email || null,
        internal_note || null,
      ]
    );

    return json({ ok: true, id: ins.rows[0].id });
  } catch (error) {
    const msg = String(error?.message || "");

    if (msg.includes("no_overlapping_appointments")) {
      return json(
        { error: "Zeit ist bereits belegt.", code: "OVERLAP" },
        409
      );
    }

    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/appointments",
      slug,
      message: error?.message,
    });

    return json(
      { error: "Technischer Fehler. Bitte erneut versuchen." },
      500
    );
  }
}
