import { query } from "@/lib/db";

function minutesFromTimeStr(t) {
  // t like "10:15:00" or "10:15"
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

    // 2) Determine "today" in salon timezone
    // today_date: date in salon tz, weekday: ISO dow (Mon=1..Sun=7)
    const todayInfoRes = await query(
      `select
         (now() at time zone $1)::date as today_date,
         extract(isodow from (now() at time zone $1))::int as weekday`,
      [tz]
    );

    const todayDate = todayInfoRes.rows[0].today_date; // e.g. 2026-02-27
    const weekday = todayInfoRes.rows[0].weekday; // 1..7

    // 3) Fetch business hours for today (may be null => closed)
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
        // padding +-60min, clamp 06:00..22:00
        displayStartMin = clamp(openMin - 60, 6 * 60, 22 * 60);
        displayEndMin = clamp(closeMin + 60, 6 * 60, 22 * 60);
      }
    }

    // 4) Appointments for "today" by salon timezone date
    // IMPORTANT: customer_mail column name is used (not customer_email)
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
         a.customer_mail,
         a.internal_note,
         s.name as service_name
       from public.appointments a
       left join public.services s on s.id = a.service_id
       where a.salon_id = $1
         and (a.start_at at time zone $2)::date = $3::date
       order by a.start_at asc`,
      [salonId, tz, todayDate]
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
