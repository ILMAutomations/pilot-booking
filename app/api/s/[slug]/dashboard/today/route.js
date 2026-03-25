import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

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

function normalizeStatus(status) {

  if (!status) return "booked";

  if (status === "confirmed") return "booked";

  if (status === "booked") return "booked";

  if (status === "completed") return "completed";

  if (status === "no_show") return "no_show";

  if (status === "cancelled") return "cancelled";

  return "booked";
}

export async function GET(req, { params }) {

  const slug = params?.slug;

  try {

    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    // ---------- resolve salon ----------

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

    // ---------- today range in salon timezone ----------

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

    // ---------- business hours ----------

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

        let rawStart = clamp(openMin - 60, 6 * 60, 22 * 60);
        let rawEnd = clamp(closeMin + 60, 6 * 60, 22 * 60);

        displayStartMin = Math.floor(rawStart / 60) * 60;
        displayEndMin = Math.ceil(rawEnd / 60) * 60;
      }
    }

    // ---------- appointments ----------

    const apptRes = await query(
      `
select
  a.id,
  a.start_at,
  a.end_at,
  a.customer_name,
  a.customer_phone,
  a.customer_email,
  a.internal_note,
  a.status,

  -- 🔹 timeline label
  (
    select 
      case 
        when count(*) = 1 then min(s.name)
        else min(s.name) || ' +' || (count(*) - 1)
      end
    from public.services s
    where s.id = any(
      coalesce(a.service_ids, array[a.service_id])
    )
  ) as service_name,

  -- 🔹 FULL SERVICES LIST (NEU)
  (
    select json_agg(
      json_build_object(
        'name', s.name,
        'duration', s.duration_min,
        'price', s.price_cents
      )
    )
    from public.services s
    where s.id = any(
      coalesce(a.service_ids, array[a.service_id])
    )
  ) as services,

  -- 🔹 TOTAL DURATION
  (
    select coalesce(sum(s.duration_min),0)
    from public.services s
    where s.id = any(
      coalesce(a.service_ids, array[a.service_id])
    )
  ) as total_duration,

  -- 🔹 TOTAL PRICE
  (
    select coalesce(sum(s.price_cents),0)
    from public.services s
    where s.id = any(
      coalesce(a.service_ids, array[a.service_id])
    )
  ) as total_price

from public.appointments a
      
      where a.salon_id = $1
        and a.start_at >= $2
        and a.start_at < $3
      order by a.start_at asc
      `,
      [salonId, dayStartUtc, dayEndUtc]
    );

    // ---------- normalize rows ----------

    const rows = apptRes.rows.map(r => ({

      id: r.id,

      start_at: r.start_at,

      end_at: r.end_at,

services: r.services || [],
total_duration: Number(r.total_duration || 0),
total_price: Number(r.total_price || 0),

      customer_name: r.customer_name || "",

      customer_phone: r.customer_phone || "",

      customer_email: r.customer_email || "",

      internal_note: r.internal_note || "",

      status: normalizeStatus(r.status)

    }));

    // ---------- response ----------

    return Response.json({

      slug: salon.slug,

      salon_id: salonId,

      today_count: rows.length,

      rows,

      display_start_min: displayStartMin,

      display_end_min: displayEndMin

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
