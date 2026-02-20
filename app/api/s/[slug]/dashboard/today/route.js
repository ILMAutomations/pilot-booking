import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function toMinutesHHMM(timeStr) {
  // accepts "HH:MM:SS" or "HH:MM"
  if (!timeStr) return null;
  const [hh, mm] = String(timeStr).split(":");
  const h = Number(hh);
  const m = Number(mm);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export async function GET(_req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) {
      return NextResponse.json({ error: "missing_slug" }, { status: 400 });
    }

    const salonRes = await query("select id from salons where slug=$1 limit 1", [
      slug,
    ]);
    if (!salonRes.rowCount) {
      return NextResponse.json({ error: "salon_not_found", slug }, { status: 404 });
    }
    const salonId = salonRes.rows[0].id;

    // Today range (UTC) – keep simple/pilot-safe:
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    // Join service name for display
    const apptRes = await query(
      `
      select a.*,
             s.name as service_name
      from appointments a
      left join services s on s.id = a.service_id
      where a.salon_id = $1
        and a.start_at >= $2
        and a.start_at < $3
      order by a.start_at asc
      `,
      [salonId, start.toISOString(), end.toISOString()]
    );

    // Business hours display window for *today's weekday* (fallback 08–21)
    const weekday = ((start.getUTCDay() + 6) % 7) + 1; // Mon=1..Sun=7 (matches typical weekday storage)
    const bhRes = await query(
      `
      select open_time, close_time
      from business_hours
      where salon_id=$1 and weekday=$2
      limit 1
      `,
      [salonId, weekday]
    );

    let displayStartMin = 8 * 60;
    let displayEndMin = 21 * 60;

    if (bhRes.rowCount) {
      const openMin = toMinutesHHMM(bhRes.rows[0].open_time);
      const closeMin = toMinutesHHMM(bhRes.rows[0].close_time);

      if (openMin != null && closeMin != null) {
        displayStartMin = Math.max(6 * 60, openMin - 60);
        displayEndMin = Math.min(22 * 60, closeMin + 60);
      }
    }

    return NextResponse.json({
      slug,
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
    return NextResponse.json(
      { error: "internal_error", slug },
      { status: 500 }
    );
  }
}
