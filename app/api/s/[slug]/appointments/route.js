import { query } from "@/lib/db";

function isPgOverlapError(e) {
  // Postgres exclusion constraint violation often shows code 23P01
  return e?.code === "23P01" || String(e?.message || "").includes("no_overlapping_appointments");
}

export async function POST(req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const service_id = body?.service_id;
    const start_at = body?.start_at;
    const end_at = body?.end_at;
    const notes = body?.notes ?? null;

    if (!service_id) return Response.json({ error: "Missing service_id" }, { status: 400 });
    if (!start_at) return Response.json({ error: "Missing start_at" }, { status: 400 });
    if (!end_at) return Response.json({ error: "Missing end_at" }, { status: 400 });

    // 1) Resolve salon
    const salonRes = await query("select id from salons where slug = $1 limit 1", [slug]);
    if (salonRes.rowCount === 0) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }
    const salon_id = salonRes.rows[0].id;

    // 2) Ensure service belongs to salon + get duration (tenant safety)
    const svcRes = await query(
      "select id, duration_min from services where id = $1 and salon_id = $2 limit 1",
      [service_id, salon_id]
    );
    if (svcRes.rowCount === 0) {
      return Response.json({ error: "Service not found for this salon" }, { status: 400 });
    }

    // 3) Enforce Business Hours (server-side)
    // We check weekday + local time in Europe/Berlin against business_hours.weekday/open_time/close_time
    // If no row for that weekday -> treated as CLOSED.
    const hoursRes = await query(
      `
      select
        bh.open_time,
        bh.close_time
      from business_hours bh
      where bh.salon_id = $1
        and bh.weekday = extract(isodow from ($2::timestamptz at time zone 'Europe/Berlin'))::int
      limit 1
      `,
      [salon_id, start_at]
    );

    if (hoursRes.rowCount === 0) {
      return Response.json(
        { error: "Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.", code: "OUTSIDE_HOURS" },
        { status: 400 }
      );
    }

    const withinRes = await query(
      `
      select
        (
          ($2::timestamptz at time zone 'Europe/Berlin')::time >= bh.open_time
          and
          ($3::timestamptz at time zone 'Europe/Berlin')::time <= bh.close_time
        ) as ok
      from business_hours bh
      where bh.salon_id = $1
        and bh.weekday = extract(isodow from ($2::timestamptz at time zone 'Europe/Berlin'))::int
      limit 1
      `,
      [salon_id, start_at, end_at]
    );

    const ok = Boolean(withinRes.rows?.[0]?.ok);
    if (!ok) {
      return Response.json(
        { error: "Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.", code: "OUTSIDE_HOURS" },
        { status: 400 }
      );
    }

    // 4) Insert appointment (overlap is enforced by DB exclusion constraint)
    const insRes = await query(
      `
      insert into appointments
        (salon_id, service_id, customer_id, kind, status, start_at, end_at, notes, gcal_sync_status)
      values
        ($1, $2, null, 'booking', 'confirmed', $3, $4, $5, 'pending')
      returning *
      `,
      [salon_id, service_id, start_at, end_at, notes]
    );

    return Response.json(insRes.rows[0], { status: 201 });
  } catch (e) {
    // Overlap -> 409 with clean message
    if (isPgOverlapError(e)) {
      return Response.json(
        { error: "Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.", code: "OVERLAP" },
        { status: 409 }
      );
    }

    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

