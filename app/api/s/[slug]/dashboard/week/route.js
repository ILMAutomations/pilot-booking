import { query } from "@/lib/db";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dayKeyUTC(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export async function GET(req, { params }) {
  const slug = params?.slug;

  try {
    if (!slug) return json({ error: "Missing slug" }, 400);

    const salonRes = await query("select id from public.salons where slug=$1 limit 1", [slug]);
    if (!salonRes.rowCount) return json({ error: "Salon not found" }, 404);
    const salon_id = salonRes.rows[0].id;

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 0, 0, 0));

    const rowsRes = await query(
      `
      select
        a.*,
        s.name as service_name
      from public.appointments a
      join public.services s on s.id = a.service_id
      where a.salon_id = $1
        and a.start_at >= $2
        and a.start_at < $3
      order by a.start_at asc
      `,
      [salon_id, start.toISOString(), end.toISOString()]
    );

    const rows = rowsRes.rows.map((r) => {
      const d = new Date(r.start_at);
      return { ...r, day_key: dayKeyUTC(d) };
    });

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = dayKeyUTC(d);
      days.push({
        date: key,
        rows: rows.filter((x) => x.day_key === key),
      });
    }

    return json({ slug, salon_id, days });
  } catch (error) {
    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/dashboard/week",
      slug,
      message: error?.message,
    });
    return json({ error: "Technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
