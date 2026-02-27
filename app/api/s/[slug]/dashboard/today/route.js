import { query } from "@/lib/db";

function minutesFromTimeStr(t) {
  if (!t) return null;
  const parts = String(t).split(":");
  const hh = Number(parts[0] || 0);
  const mm = Number(parts[1] || 0);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    // 1) Resolve salon + timezone
    const salonRes = await query(
      `select id, slug, timezone
       from public.salons
       where slug = $1
       limit 1`,
      [slug]
    );

    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }

    const salon = salonRes.rows[0];
    const salonId = salon.id;
    const tz = salon.timezone || "Europe/Berlin";

    // 2) Compute today's UTC range for the salon's local day
    const rangeRes = await query(
      `select
         (((now() at time zone $1)::date)::timestamp at time zone $1) as day_start_utc,
         ((((now() at time zone $1)::date + 1)::timestamp) at time zone $1) as day_end_utc,
         extract(isodow from (now() at time zone $1))::int as weekday`,
      [tz]
    );

    const dayStartUtc = rangeRes.rows[0].day_start_utc;
    const dayEndUtc = rangeRes.rows[0].day_end_utc;
    const weekday = rangeRes.rows[0].weekday;

    // 3) Display window from business hours (optional)
    const bhRes = await query(
      `select open_time, close_time
       from public.business_hours
       where salon_id = $1 and weekday = $2
       limit 1`,
      [salonId, weekday]
    );

    let displayStartMin = 8 * 60;
    let displayEndMin = 21 * 60;

    if (bhRes.rowCount) {
      const openMin = minutesFromTimeStr(bhRes.rows[0].open_time);
      const closeMin = minutesFromTimeStr(bhRes.rows[0].close_time);
      if (openMin != null && closeMin != null) {
        displayStartMin = clamp(openMin - 60, 6 * 60, 22 * 60);
        displayEndMin = clamp(closeMin + 60, 6 * 60, 22 * 60);
      }
    }

    // 4) Appointments for today (timezone-safe range)
    // IMPORTANT: column is customer_email (NOT customer_mail)
    const apptRes = await query(
      `select
         a.id,
         a.salon_id,
         a.service_id,
         a.customer_id,
         a.kind,
         a.status,
         a.start_at,
         a.end_at,
         a.notes,
         a.created_at,
         a.updated_at,
         a.customer_name,
         a.customer_phone,
         a.customer_email,
         a.internal_note,
         s.name as service_name
       from public.appointments a
       left join public.services s on s.id = a.service_id
       where a.salon_id = $1
         and a.start_at >= $2
         and a.start_at < $3
       order by a.start_at asc`,
      [salonId, dayStartUtc, dayEndUtc]
    );

    return Response.json({
      slug: salon.slug,
      salon_id: salonId,
      today_count: apptRes.rows.length,
      rows: apptRes.rows,
      display_start_min: displayStartMin,
      display_end_min: displayEndMin,
    });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/dashboard/today",
      slug,
      message: error?.message,
    });
    return Response.json(
      { error: "Technischer Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
