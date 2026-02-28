import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SERVICE_ROLE_KEY).");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function normalizeTime(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // accept "10:00" or "10:00:00"
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  return null;
}

export async function GET(_req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const supabase = getAdmin();

    const { data: salon, error: salonErr } = await supabase
      .from("salons")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (salonErr || !salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    const { data: rows, error } = await supabase
      .from("business_hours")
      .select("weekday, open_time, close_time")
      .eq("salon_id", salon.id)
      .order("weekday", { ascending: true });

    if (error) {
      console.error("[API_ERROR]", { route: "/api/s/[slug]/business-hours", slug, message: error.message });
      return NextResponse.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
    }

    return NextResponse.json({
      slug,
      salon_id: salon.id,
      rows: Array.isArray(rows) ? rows : [],
    });
  } catch (e) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug: params?.slug,
      message: e?.message || String(e),
    });
    return NextResponse.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const supabase = getAdmin();

    const body = await req.json().catch(() => ({}));

    // accept {hours:[...]} OR {rows:[...]} OR direct array [...]
    const hours =
      Array.isArray(body?.hours) ? body.hours :
      Array.isArray(body?.rows) ? body.rows :
      Array.isArray(body) ? body :
      null;

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: "Missing hours[]" }, { status: 400 });
    }

    const { data: salon, error: salonErr } = await supabase
      .from("salons")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (salonErr || !salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Validate + split into upserts & deletes
    const toUpsert = [];
    const toDelete = [];

    for (const h of hours) {
      const weekday = Number(h?.weekday);
      if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) continue;

      const open = normalizeTime(h?.open_time ?? h?.open);
      const close = normalizeTime(h?.close_time ?? h?.close);

      // if either missing => treat as closed => delete row
      if (!open || !close) {
        toDelete.push(weekday);
        continue;
      }

      toUpsert.push({
        salon_id: salon.id,
        weekday,
        open_time: open,
        close_time: close,
      });
    }

    // delete closed weekdays
    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("business_hours")
        .delete()
        .eq("salon_id", salon.id)
        .in("weekday", toDelete);

      if (delErr) {
        console.error("[API_ERROR]", { route: "/api/s/[slug]/business-hours", slug, message: delErr.message });
        return NextResponse.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
      }
    }

    // upsert open weekdays
    if (toUpsert.length > 0) {
      const { error: upErr } = await supabase
        .from("business_hours")
        .upsert(toUpsert, { onConflict: "salon_id,weekday" });

      if (upErr) {
        console.error("[API_ERROR]", { route: "/api/s/[slug]/business-hours", slug, message: upErr.message });
        return NextResponse.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
      }
    }

    // proof readback
    const { data: rows, error: readErr } = await supabase
      .from("business_hours")
      .select("weekday, open_time, close_time")
      .eq("salon_id", salon.id)
      .order("weekday", { ascending: true });

    if (readErr) {
      console.error("[API_ERROR]", { route: "/api/s/[slug]/business-hours", slug, message: readErr.message });
      return NextResponse.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
    }

    return NextResponse.json({
      slug,
      salon_id: salon.id,
      rows: Array.isArray(rows) ? rows : [],
    });
  } catch (e) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/business-hours",
      slug: params?.slug,
      message: e?.message || String(e),
    });
    return NextResponse.json({ error: "Technischer Fehler. Bitte erneut versuchen." }, { status: 500 });
  }
}
