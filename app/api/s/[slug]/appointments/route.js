import { query } from "../../../../../lib/db";

function json(status, payload) {
  return Response.json(payload, { status });
}

export async function POST(req, { params }) {
  const slug = params.slug;

  try {
    const body = await req.json();

    const start_at = body.start_at;
    const end_at = body.end_at;
    const service_id = body.service_id;
    const notes = body.notes || null;

    if (!slug) return json(400, { error: "Missing slug", code: "MISSING_SLUG" });
    if (!start_at) return json(400, { error: "Missing start_at (ISO string)", code: "MISSING_START" });
    if (!end_at) return json(400, { error: "Missing end_at (ISO string)", code: "MISSING_END" });
    if (!service_id) return json(400, { error: "Missing service_id", code: "MISSING_SERVICE" });

    // 1) Resolve salon_id by slug
    const salonRes = await query("select id from salons where slug = $1 limit 1", [slug]);
    if (salonRes.rowCount === 0) return json(404, { error: "Salon not found", code: "SALON_NOT_FOUND" });
    const salon_id = salonRes.rows[0].id;

    // 2) Ensure service belongs to this salon
    const svcRes = await query(
      "select id from services where id = $1 and salon_id = $2 limit 1",
      [service_id, salon_id]
    );
    if (svcRes.rowCount === 0) {
      return json(400, { error: "service_id not found for this salon", code: "BAD_SERVICE" });
    }

    // 3) Business hours check (Europe/Berlin)
    // Sunday closed = no row in business_hours
    const hoursRes = await query(
      `
      with t as (
        select
          ($1::timestamptz at time zone 'Europe/Berlin') as local_start,
          ($2::timestamptz at time zone 'Europe/Berlin') as local_end
      )
      select 1
      from business_hours bh, t
      where bh.salon_id = $3
        and bh.weekday = extract(isodow from t.local_start)::int
        and (t.local_start::time) >= bh.open_time
        and (t.local_end::time) <= bh.close_time
      limit 1
      `,
      [start_at, end_at, salon_id]
    );

    if (hoursRes.rowCount === 0) {
      return json(400, {
        error: "Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.",
        code: "OUTSIDE_HOURS"
      });
    }

    // 4) Insert appointment (catch overlap constraint cleanly)
    try {
      const ins = await query(
        `insert into appointments
          (salon_id, service_id, customer_id, kind, status, start_at, end_at, notes, gcal_sync_status)
         values
          ($1, $2, null, 'booking', 'confirmed', $3::timestamptz, $4::timestamptz, $5, 'pending')
         returning *`,
        [salon_id, service_id, start_at, end_at, notes]
      );

      return json(201, ins.rows[0]);
    } catch (e) {
      const msg = String(e?.message || e);

      // Postgres exclusion violation (overlap) is usually SQLSTATE 23P01
      if (e?.code === "23P01" || msg.includes("no_overlapping_appointments")) {
        return json(409, {
          error: "Dieser Zeitpunkt ist schon belegt. Bitte wähle eine andere Uhrzeit.",
          code: "OVERLAP"
        });
      }

      return json(500, { error: msg, code: "INSERT_FAILED" });
    }
  } catch (e) {
    return json(500, { error: String(e?.message || e), code: "SERVER_ERROR" });
  }
}
