import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function parseTimeToMin(t) {
  // "10:00:00" or "10:00"
  if (!t) return null;
  const parts = String(t).split(":");
  const hh = Number(parts[0]);
  const mm = Number(parts[1] || 0);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function isoToMin(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

export async function POST(req, { params }) {
  const slug = params?.slug;

  try {
    const body = await req.json().catch(() => ({}));
    const { service_id, start_at, end_at } = body || {};

    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    if (!service_id) return NextResponse.json({ error: "Missing service_id" }, { status: 400 });
    if (!start_at) return NextResponse.json({ error: "Missing start_at" }, { status: 400 });
    if (!end_at) return NextResponse.json({ error: "Missing end_at (ISO string)" }, { status: 400 });

    // Resolve salon_id
    const salonRes = await query("select id from salons where slug = $1 limit 1", [slug]);
    if (!salonRes.rowCount) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    const salon_id = salonRes.rows[0].id;

    // Validate service belongs to salon
    const svcRes = await query(
      "select id from services where id = $1 and salon_id = $2 limit 1",
      [service_id, salon_id]
    );
    if (!svcRes.rowCount) {
      return NextResponse.json({ error: "Service not found for this salon" }, { status: 400 });
    }

    // Business hours enforcement (no new behavior — this was already intended)
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid start/end time" }, { status: 400 });
    }

    // weekday based on local time in the Date object (consistent with UI)
    const weekday = startDate.getDay(); // 0=Sun .. 6=Sat

    const bhRes = await query(
      "select open_time, close_time from business_hours where salon_id = $1 and weekday = $2 limit 1",
      [salon_id, weekday]
    );

    if (!bhRes.rowCount) {
      return NextResponse.json({ code: "OUTSIDE_HOURS", error: "Outside hours" }, { status: 400 });
    }

    const openMin = parseTimeToMin(bhRes.rows[0].open_time);
    const closeMin = parseTimeToMin(bhRes.rows[0].close_time);
    const stMin = isoToMin(start_at);
    const enMin = isoToMin(end_at);

    if (
      openMin == null ||
      closeMin == null ||
      stMin == null ||
      enMin == null ||
      stMin < openMin ||
      enMin > closeMin
    ) {
      return NextResponse.json({ code: "OUTSIDE_HOURS", error: "Outside hours" }, { status: 400 });
    }

    // Insert (overlap enforced by exclusion constraint)
    const ins = await query(
      `insert into appointments (salon_id, service_id, kind, status, start_at, end_at)
       values ($1, $2, 'booking', 'confirmed', $3, $4)
       returning *`,
      [salon_id, service_id, start_at, end_at]
    );

    return NextResponse.json(ins.rows[0], { status: 201 });
  } catch (error) {
    // Overlap: exclusion constraint -> 23P01
    if (error?.code === "23P01") {
      return NextResponse.json({ code: "OVERLAP", error: "Overlap" }, { status: 409 });
    }

    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/appointments",
      slug,
      message: error?.message,
      code: error?.code,
    });

    return NextResponse.json(
      { error: "Technischer Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
