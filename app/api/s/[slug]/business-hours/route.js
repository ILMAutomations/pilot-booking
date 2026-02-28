import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function toHHMMSS(t) {
  if (t == null) return null;
  const s = String(t).trim();
  if (!s) return null;

  // accept "HH:MM" or "HH:MM:SS"
  const m1 = /^(\d{2}):(\d{2})$/.exec(s);
  if (m1) return `${m1[1]}:${m1[2]}:00`;

  const m2 = /^(\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (m2) return `${m2[1]}:${m2[2]}:${m2[3]}`;

  return null;
}

function minutesFromHHMMSS(t) {
  const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

async function getSalonIdBySlug(slug) {
  const r = await query(
    `select id from public.salons where slug = $1 limit 1`,
    [slug]
  );
  return r?.rows?.[0]?.id || null;
}

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const salonId = await getSalonIdBySlug(slug);
    if (!salonId) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

    const r = await query(
      `
      select weekday, open_time, close_time
      from public.business_hours
      where salon_id = $1
      order by weekday asc
      `,
      [salonId]
    );

    return NextResponse.json({
      slug,
      salon_id: salonId,
      rows: r.rows || [],
    });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug,
      message: error?.message || String(error),
    });
    return NextResponse.json(
      { error: "Technischer Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const salonId = await getSalonIdBySlug(slug);
    if (!salonId) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const hours = Array.isArray(body?.hours) ? body.hours : null;

    if (!hours) {
      return NextResponse.json({ error: "Missing hours[]" }, { status: 400 });
    }

    // normalize + dedupe by weekday (keep last)
    const byDay = new Map();
    for (const h of hours) {
      const weekday = Number(h?.weekday);
      if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) continue;

      const openN = toHHMMSS(h?.open_time);
      const closeN = toHHMMSS(h?.close_time);

      // CLOSED: allow both null/empty (delete row)
      if (!openN && !closeN) {
        byDay.set(weekday, { weekday, open_time: null, close_time: null });
        continue;
      }

      // OPEN: require both times valid
      if (!openN || !closeN) {
        return NextResponse.json(
          { error: `Invalid open/close time for weekday ${weekday}` },
          { status: 400 }
        );
      }

      const oMin = minutesFromHHMMSS(openN);
      const cMin = minutesFromHHMMSS(closeN);

      if (oMin == null || cMin == null || cMin <= oMin) {
        return NextResponse.json(
          { error: `Invalid open/close time for weekday ${weekday}` },
          { status: 400 }
        );
      }

      byDay.set(weekday, { weekday, open_time: openN, close_time: closeN });
    }

    // Apply changes in a transaction
    await query("begin");

    try {
      for (let weekday = 1; weekday <= 7; weekday++) {
        const h = byDay.get(weekday);

        // If not provided at all -> do nothing (safe)
        if (!h) continue;

        // Closed -> delete
        if (!h.open_time && !h.close_time) {
          await query(
            `delete from public.business_hours where salon_id = $1 and weekday = $2`,
            [salonId, weekday]
          );
          continue;
        }

        // Open -> upsert
        await query(
          `
          insert into public.business_hours (salon_id, weekday, open_time, close_time)
          values ($1, $2, $3, $4)
          on conflict (salon_id, weekday)
          do update set open_time = excluded.open_time, close_time = excluded.close_time
          `,
          [salonId, weekday, h.open_time, h.close_time]
        );
      }

      await query("commit");
    } catch (e) {
      await query("rollback");
      throw e;
    }

    return NextResponse.json({ ok: true, slug, salon_id: salonId });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug,
      message: error?.message || String(error),
    });
    return NextResponse.json(
      { error: "Technischer Fehler. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
