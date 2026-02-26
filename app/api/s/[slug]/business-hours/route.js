import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const salonRes = await query("select id from salons where slug=$1", [slug]);
    if (!salonRes.rowCount) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    const salon_id = salonRes.rows[0].id;

    const { rows } = await query(
      `select weekday, open_time, close_time
       from business_hours
       where salon_id=$1
       order by weekday asc`,
      [salon_id]
    );

    return NextResponse.json({ slug, salon_id, rows });
  } catch (error) {
    console.error("[API_ERROR]", { route: "/api/s/[slug]/business-hours GET", slug, message: error?.message });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const body = await req.json().catch(() => null);
    const hours = Array.isArray(body?.hours) ? body.hours : null;

    if (!hours) {
      return NextResponse.json({ error: "Missing hours[]" }, { status: 400 });
    }

    const salonRes = await query("select id from salons where slug=$1", [slug]);
    if (!salonRes.rowCount) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    const salon_id = salonRes.rows[0].id;

    // validate + normalize
    for (const h of hours) {
      const weekday = Number(h?.weekday);
      const open_time = h?.open_time || null;
      const close_time = h?.close_time || null;
      const closed = !!h?.closed;

      if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
        return NextResponse.json({ error: "Invalid weekday (must be 1..7)" }, { status: 400 });
      }

      // If closed OR missing times => delete row (represents closed)
      if (closed || !open_time || !close_time) {
        await query("delete from business_hours where salon_id=$1 and weekday=$2", [salon_id, weekday]);
        continue;
      }

      // Upsert (requires unique index salon_id+weekday, added via SQL Paste 1)
      await query(
        `insert into business_hours (salon_id, weekday, open_time, close_time)
         values ($1,$2,$3,$4)
         on conflict (salon_id, weekday)
         do update set open_time=excluded.open_time, close_time=excluded.close_time`,
        [salon_id, weekday, open_time, close_time]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API_ERROR]", { route: "/api/s/[slug]/business-hours POST", slug, message: error?.message });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
