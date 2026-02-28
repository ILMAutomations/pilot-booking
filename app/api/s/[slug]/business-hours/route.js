import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeTime(v) {
  if (!v) return "";
  const s = String(v).slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(s)) return "";
  return s;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SERVICE_ROLE_KEY).");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

async function getSalonIdBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from("salons")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) return null;
  return data.id;
}

export async function GET(_req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) return json({ error: "Missing slug" }, 400);

    const supabase = getSupabaseAdmin();
    const salon_id = await getSalonIdBySlug(supabase, slug);
    if (!salon_id) return json({ error: "Salon not found" }, 404);

    const { data, error } = await supabase
      .from("business_hours")
      .select("weekday, open_time, close_time")
      .eq("salon_id", salon_id)
      .order("weekday", { ascending: true });

    if (error) throw error;

    return json({
      slug,
      salon_id,
      hours: (data || []).map((r) => ({
        weekday: Number(r.weekday),
        open_time: normalizeTime(r.open_time),
        close_time: normalizeTime(r.close_time),
      })),
    });
  } catch (e) {
    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}

export async function POST(req, { params }) {
  try {
    const slug = params?.slug;
    if (!slug) return json({ error: "Missing slug" }, 400);

    const body = await req.json().catch(() => ({}));
    const hours = Array.isArray(body?.hours) ? body.hours : null;

    if (!hours || hours.length === 0) {
      return json({ error: "Missing hours[]" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const salon_id = await getSalonIdBySlug(supabase, slug);
    if (!salon_id) return json({ error: "Salon not found" }, 404);

    // sanitize rows (weekday 1-7, allow empty open/close to mark closed)
    const rows = [];
    for (const h of hours) {
      const weekday = Number(h?.weekday);
      if (!(weekday >= 1 && weekday <= 7)) continue;

      const open_time = normalizeTime(h?.open_time);
      const close_time = normalizeTime(h?.close_time);

      rows.push({
        salon_id,
        weekday,
        open_time: open_time || null,
        close_time: close_time || null,
      });
    }

    if (rows.length !== 7) {
      // Force 7 rows always (Mo–So)
      const byW = new Map(rows.map((r) => [r.weekday, r]));
      const full = [];
      for (let w = 1; w <= 7; w++) {
        const r = byW.get(w);
        full.push(
          r || {
            salon_id,
            weekday: w,
            open_time: null,
            close_time: null,
          }
        );
      }
      rows.length = 0;
      rows.push(...full);
    }

    // upsert (salon_id, weekday) must exist as unique constraint
    const { error: upsertErr } = await supabase
      .from("business_hours")
      .upsert(rows, { onConflict: "salon_id,weekday" });

    if (upsertErr) throw upsertErr;

    // return fresh state (proof)
    const { data, error } = await supabase
      .from("business_hours")
      .select("weekday, open_time, close_time")
      .eq("salon_id", salon_id)
      .order("weekday", { ascending: true });

    if (error) throw error;

    return json({
      ok: true,
      slug,
      salon_id,
      hours: (data || []).map((r) => ({
        weekday: Number(r.weekday),
        open_time: normalizeTime(r.open_time),
        close_time: normalizeTime(r.close_time),
      })),
    });
  } catch (e) {
    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
