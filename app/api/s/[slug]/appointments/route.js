import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function timeToMinutes(t) {
  // "HH:MM:SS" or "HH:MM"
  if (!t) return null;
  const parts = String(t).split(":");
  const hh = parseInt(parts[0] || "0", 10);
  const mm = parseInt(parts[1] || "0", 10);
  return hh * 60 + mm;
}

function isoToDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

export async function POST(req, { params }) {
  const slug = params.slug;

  try {
    const body = await req.json().catch(() => ({}));

    const service_id = body.service_id || null;
    const start_at = body.start_at || null;
    const source = body.source || "dashboard"; // website | phone | dashboard (we keep it simple)
    const notes = body.notes ?? null;

    if (!service_id) {
      return NextResponse.json({ error: "Missing service_id" }, { status: 400 });
    }
    if (!start_at) {
      return NextResponse.json({ error: "Missing start_at (ISO string)" }, { status: 400 });
    }

    const startDate = isoToDate(start_at);
    if (!startDate) {
      return NextResponse.json({ error: "Invalid start_at (ISO string)" }, { status: 400 });
    }

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

    // 2) service lookup (must belong to salon)
    const svcRes = await db.query(
      `select id, duration_min from services where id = $1 and salon_id = $2 limit 1`,
      [service_id, salon_id]
    );
    const svc = svcRes.rows[0];
    if (!svc) {
      return NextResponse.json({ error: "Service not found for this salon" }, { status: 400 });
    }

    const durationMin = Number(svc.duration_min || 0);
    if (!durationMin || durationMin < 5) {
      return NextResponse.json({ error: "Invalid service duration" }, { status: 400 });
    }

    // 3) compute end_at server-side (THIS IS THE FIX)
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
    const end_at = endDate.toISOString();

    // 4) business hours validation (uses business_hours table)
    // Robust weekday mapping:
    // JS getDay: 0..6 (Sun..Sat)
    const jsDow = startDate.getDay();
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

    if (bhRes.rows[0]) {
      const openMin = timeToMinutes(bhRes.rows[0].open_time);
      const closeMin = timeToMinutes(bhRes.rows[0].close_time);

      // only enforce if we have valid open/close
      if (openMin != null && closeMin != null) {
        const startMin = startDate.getHours() * 60 + startDate.getMinutes();
        const endMin = endDate.getHours() * 60 + endDate.getMinutes();

        // outside hours -> block
        if (startMin < openMin || endMin > closeMin) {
          return NextResponse.json(
            { error: "Outside business hours", code: "OUTSIDE_HOURS" },
            { status: 400 }
          );
        }
      }
    }

    // 5) insert (overlap constraint will throw 409)
    let inserted;
    try {
      const ins = await db.query(
        `
        insert into appointments
          (salon_id, service_id, kind, status, start_at, end_at, notes, gcal_sync_status)
        values
          ($1, $2, 'booking', 'confirmed', $3, $4, $5, 'pending')
        returning *
        `,
        [salon_id, service_id, start_at, end_at, notes]
      );
      inserted = ins.rows[0];
    } catch (e) {
      // overlap exclusion constraint → return 409 clean
      const msg = String(e?.message || "");
      const code = String(e?.code || "");
      if (code === "23P01" || msg.toLowerCase().includes("no_overlapping_appointments")) {
        return NextResponse.json(
          { error: "Time slot already booked" },
          { status: 409 }
        );
      }
      throw e;
    }

    return NextResponse.json(
      {
        id: inserted.id,
        salon_id: inserted.salon_id,
        service_id: inserted.service_id,
        start_at: inserted.start_at,
        end_at: inserted.end_at,
        status: inserted.status,
        source,
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
