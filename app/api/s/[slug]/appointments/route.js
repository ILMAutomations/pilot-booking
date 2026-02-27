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

    const service_id = body?.service_id;
    const start_at = body?.start_at;
    const end_at = body?.end_at;

    const customer_name = String(body?.customer_name || "").trim();
    const customer_phone = body?.customer_phone ? String(body.customer_phone).trim() : null;
    const customer_email = body?.customer_email ? String(body.customer_email).trim() : null;
    const internal_note = body?.internal_note ? String(body.internal_note).trim() : null;

    if (!slug) return json({ error: "Missing slug" }, 400);
    if (!service_id || !start_at || !end_at) return json({ error: "Missing fields" }, 400);

    // Minimal validation: customer_name required
    if (!customer_name) {
      return json(
        { error: "Bitte Kundennamen eingeben.", code: "MISSING_CUSTOMER_NAME" },
        400
      );
    }

    // Resolve salon_id
    const salonRes = await query("select id from public.salons where slug = $1 limit 1", [slug]);
    if (!salonRes.rowCount) return json({ error: "Salon not found" }, 404);
    const salon_id = salonRes.rows[0].id;

    // Business hours validation (existing behavior) — keep exactly
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return json({ error: "Invalid datetime" }, 400);
    }

    // weekday 1..7 (Mon..Sun)
    const jsDay = startDate.getDay(); // 0=Sun..6=Sat
    const weekday = jsDay === 0 ? 7 : jsDay;

    const hh = String(startDate.getHours()).padStart(2, "0");
    const mm = String(startDate.getMinutes()).padStart(2, "0");
    const startTime = `${hh}:${mm}:00`;

    const hh2 = String(endDate.getHours()).padStart(2, "0");
    const mm2 = String(endDate.getMinutes()).padStart(2, "0");
    const endTime = `${hh2}:${mm2}:00`;

    const bhRes = await query(
      `
      select open_time, close_time
      from public.business_hours
      where salon_id = $1 and weekday = $2
      limit 1
      `,
      [salon_id, weekday]
    );

    // If no row => closed
    if (!bhRes.rowCount) {
      return json(
        { error: "Außerhalb der Öffnungszeiten.", code: "OUTSIDE_HOURS" },
        400
      );
    }

    const open_time = bhRes.rows[0].open_time;  // time
    const close_time = bhRes.rows[0].close_time; // time

    // Ensure start/end inside [open, close]
    // (time compare works in postgres format "HH:MM:SS")
    if (!(startTime >= open_time && endTime <= close_time)) {
      return json(
        { error: "Außerhalb der Öffnungszeiten.", code: "OUTSIDE_HOURS" },
        400
      );
    }

    // Insert appointment (overlap constraint stays DB-level)
    const ins = await query(
      `
      insert into public.appointments
        (salon_id, service_id, kind, status, start_at, end_at, customer_name, customer_phone, customer_email, internal_note)
      values
        ($1, $2, 'booking', 'confirmed', $3, $4, $5, $6, $7, $8)
      returning id
      `,
      [
        salon_id,
        service_id,
        start_at,
        end_at,
        customer_name,
        customer_phone,
        customer_email,
        internal_note,
      ]
    );

    return json({ ok: true, id: ins.rows[0].id });
  } catch (error) {
    // Overlap constraint -> 409 (keep UX mapping)
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

    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}import { query } from "@/lib/db";

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

    const service_id = body?.service_id;
    const start_at = body?.start_at;
    const end_at = body?.end_at;

    const customer_name = String(body?.customer_name || "").trim();
    const customer_phone = body?.customer_phone ? String(body.customer_phone).trim() : null;
    const customer_email = body?.customer_email ? String(body.customer_email).trim() : null;
    const internal_note = body?.internal_note ? String(body.internal_note).trim() : null;

    if (!slug) return json({ error: "Missing slug" }, 400);
    if (!service_id || !start_at || !end_at) return json({ error: "Missing fields" }, 400);

    // Minimal validation: customer_name required
    if (!customer_name) {
      return json(
        { error: "Bitte Kundennamen eingeben.", code: "MISSING_CUSTOMER_NAME" },
        400
      );
    }

    // Resolve salon_id
    const salonRes = await query("select id from public.salons where slug = $1 limit 1", [slug]);
    if (!salonRes.rowCount) return json({ error: "Salon not found" }, 404);
    const salon_id = salonRes.rows[0].id;

    // Business hours validation (existing behavior) — keep exactly
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return json({ error: "Invalid datetime" }, 400);
    }

    // weekday 1..7 (Mon..Sun)
    const jsDay = startDate.getDay(); // 0=Sun..6=Sat
    const weekday = jsDay === 0 ? 7 : jsDay;

    const hh = String(startDate.getHours()).padStart(2, "0");
    const mm = String(startDate.getMinutes()).padStart(2, "0");
    const startTime = `${hh}:${mm}:00`;

    const hh2 = String(endDate.getHours()).padStart(2, "0");
    const mm2 = String(endDate.getMinutes()).padStart(2, "0");
    const endTime = `${hh2}:${mm2}:00`;

    const bhRes = await query(
      `
      select open_time, close_time
      from public.business_hours
      where salon_id = $1 and weekday = $2
      limit 1
      `,
      [salon_id, weekday]
    );

    // If no row => closed
    if (!bhRes.rowCount) {
      return json(
        { error: "Außerhalb der Öffnungszeiten.", code: "OUTSIDE_HOURS" },
        400
      );
    }

    const open_time = bhRes.rows[0].open_time;  // time
    const close_time = bhRes.rows[0].close_time; // time

    // Ensure start/end inside [open, close]
    // (time compare works in postgres format "HH:MM:SS")
    if (!(startTime >= open_time && endTime <= close_time)) {
      return json(
        { error: "Außerhalb der Öffnungszeiten.", code: "OUTSIDE_HOURS" },
        400
      );
    }

    // Insert appointment (overlap constraint stays DB-level)
    const ins = await query(
      `
      insert into public.appointments
        (salon_id, service_id, kind, status, start_at, end_at, customer_name, customer_phone, customer_email, internal_note)
      values
        ($1, $2, 'booking', 'confirmed', $3, $4, $5, $6, $7, $8)
      returning id
      `,
      [
        salon_id,
        service_id,
        start_at,
        end_at,
        customer_name,
        customer_phone,
        customer_email,
        internal_note,
      ]
    );

    return json({ ok: true, id: ins.rows[0].id });
  } catch (error) {
    // Overlap constraint -> 409 (keep UX mapping)
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

    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
