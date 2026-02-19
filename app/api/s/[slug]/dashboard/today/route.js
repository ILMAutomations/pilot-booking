import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function timeToMinutes(t) {
  // expects "HH:MM:SS" or "HH:MM"
  if (!t) return null;
  const parts = String(t).split(":");
  const hh = parseInt(parts[0] || "0", 10);
  const mm = parseInt(parts[1] || "0", 10);
  return hh * 60 + mm;
}

export async function GET(req, { params }) {
  const slug = params.slug;

  try {
    // 1) salon lookup
    const salonRes = await db.query(
      `select id from salons where slug = $1 limit 1`,
      [slug]
    );
    const salon = salonRes.rows[0];
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }
    const salon_id = salon.id;

    // 2) today bounds (UTC)
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    // 3) appointments (today, salon scoped)
    const apptRes = await db.query(
      `
      select
        a.*,
        s.name as service_name
      from appointments a
      left join services s on s.id = a.service_id
      where a.salon_id = $1
        and a.start_at >= $2
        and a.start_at < $3
      order by a.start_at asc
      `,
      [salon_id, start.toISOString(), end.toISOString()]
    );

    // 4) business hours for "today" (robust weekday mapping)
    // JS: get day 0..6 (Sun..Sat)
    const jsDow = new Date().getDay(); // local day
    // We try to match both systems:
    // - If DB stores 0..6 (Sun..Sat): match jsDow
    // - If DB stores 1..7 (Mon..Sun): match altDow (Sun=7, Mon=1..Sat=6)
    const altDow = jsDow === 0 ? 7 : jsDow;

    const bhRes = await db.query(
      `
      select weekday, open_time, close_time
      from business_hours
      where salon_id = $1
        and weekday in ($2, $3)
      order by case when weekday = $2 then 0 else 1 end
      limit 1
      `,
      [salon_id, jsDow, altDow]
    );

    let display_start_min = 8 * 60;
    let display_end_min = 21 * 60;

    if (bhRes.rows[0]) {
      const openMin = timeToMinutes(bhRes.rows[0].open_time);
      const closeMin = timeToMinutes(bhRes.rows[0].close_time);

      if (openMin != null && closeMin != null) {
        // padding rules
        const startMin = Math.max(6 * 60, openMin - 60);
        const endMin = Math.min(22 * 60, closeMin + 60);

        // safety: keep sane range
        if (endMin > startMin) {
          display_start_min = startMin;
          display_end_min = endMin;
        }
      }
    }

    return NextResponse.json({
      slug,
      salon_id,
      today_count: apptRes.rows.length,
      rows: apptRes.rows,
      display_start_min,
      display_end_min,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

