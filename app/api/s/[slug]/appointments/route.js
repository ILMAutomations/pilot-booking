import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function isoOrNull(v) {
  try {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

export async function POST(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) {
      return NextResponse.json({ error: "missing_slug" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const serviceId = body?.service_id || null;
    const startAtIso = isoOrNull(body?.start_at);

    if (!serviceId) {
      return NextResponse.json({ error: "missing_service_id" }, { status: 400 });
    }
    if (!startAtIso) {
      return NextResponse.json({ error: "invalid_start_at" }, { status: 400 });
    }

    const salonRes = await query("select id from salons where slug=$1 limit 1", [
      slug,
    ]);
    if (!salonRes.rowCount) {
      return NextResponse.json({ error: "salon_not_found", slug }, { status: 404 });
    }
    const salonId = salonRes.rows[0].id;

    // Verify service belongs to this salon + get duration
    const svcRes = await query(
      "select id, duration_min from services where id=$1 and salon_id=$2 limit 1",
      [serviceId, salonId]
    );
    if (!svcRes.rowCount) {
      return NextResponse.json({ error: "service_not_found_for_salon" }, { status: 404 });
    }

    const durationMin = Number(svcRes.rows[0].duration_min || 0);
    if (!durationMin || durationMin < 1) {
      return NextResponse.json({ error: "invalid_service_duration" }, { status: 400 });
    }

    const startDate = new Date(startAtIso);
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
    const endAtIso = endDate.toISOString();

    // Business hours enforcement (Mon=1..Sun=7)
    const weekday = ((startDate.getUTCDay() + 6) % 7) + 1;

    const bhRes = await query(
      `
      select open_time, close_time
      from business_hours
      where salon_id=$1 and weekday=$2
      limit 1
      `,
      [salonId, weekday]
    );

    if (!bhRes.rowCount) {
      return NextResponse.json(
        { error: "outside_hours", message: "Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen." },
        { status: 400 }
      );
    }

    // Compare times in minutes (UTC-based)
    const open = String(bhRes.rows[0].open_time || "").split(":");
    const close = String(bhRes.rows[0].close_time || "").split(":");
    const openMin = Number(open[0]) * 60 + Number(open[1] || 0);
    const closeMin = Number(close[0]) * 60 + Number(close[1] || 0);

    const startMin = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
    const endMin = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();

    if (Number.isNaN(openMin) || Number.isNaN(closeMin) || startMin < openMin || endMin > closeMin) {
      return NextResponse.json(
        { error: "outside_hours", message: "Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen." },
        { status: 400 }
      );
    }

    // Insert appointment (Overlap handled by DB exclusion constraint)
    try {
      const ins = await query(
        `
        insert into appointments
          (salon_id, service_id, kind, status, start_at, end_at, notes)
        values
          ($1, $2, 'booking', 'confirmed', $3, $4, $5)
        returning *
        `,
        [salonId, serviceId, startAtIso, endAtIso, body?.notes ?? null]
      );

      return NextResponse.json(ins.rows[0], { status: 201 });
    } catch (dbErr) {
      // Overlap constraint is a "professional" error, not a raw DB message
      const msg = String(dbErr?.message || "");
      const code = dbErr?.code;

      // Postgres exclusion violation is commonly 23P01
      if (code === "23P01" || msg.includes("no_overlapping_appointments")) {
        return NextResponse.json(
          { error: "overlap", message: "Zeit ist bereits belegt. Bitte andere Uhrzeit wählen." },
          { status: 409 }
        );
      }

      console.error("[API_ERROR]", {
        route: "/api/s/[slug]/appointments",
        slug,
        message: dbErr?.message,
      });

      return NextResponse.json(
        { error: "internal_error", message: "Technischer Fehler. Bitte erneut versuchen." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/appointments",
      slug,
      message: error?.message,
    });

    return NextResponse.json(
      { error: "internal_error", message: "Technischer Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
