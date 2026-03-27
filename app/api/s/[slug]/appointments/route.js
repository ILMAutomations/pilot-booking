import { query } from "@/lib/db";

export async function POST(req, { params }) {

const slug = params?.slug;

  try {

    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    const body = await req.json();

const {
  service_id,
  service_ids,
  start_at,
  customer_name,
  customer_phone,
  customer_email,
  internal_note,
  employee_id
} = body;

   if ((!service_id && (!service_ids || service_ids.length === 0)) || !start_at) {
      return Response.json(
        { error: "service_id and start_at required" },
        { status: 400 }
      );
    }

    // ---------- resolve salon ----------
    const salonRes = await query(
      `select id, timezone
       from public.salons
       where slug = $1
       limit 1`,
      [slug]
    );

    if (!salonRes.rowCount) {
      return Response.json({ error: "Salon not found" }, { status: 404 });
    }

    const salon_id = salonRes.rows[0].id;

    // ---------- resolve service ----------
let totalDuration = 0;
let finalServiceIds = [];

if (service_ids && service_ids.length > 0) {

  // remove duplicates
  finalServiceIds = [...new Set(service_ids)];

  const servicesRes = await query(
    `select duration_min
     from public.services
     where id = any($1::uuid[])`,
    [finalServiceIds]
  );

  if (!servicesRes.rowCount) {
    return Response.json({ error: "Services not found" }, { status: 404 });
  }

  totalDuration = servicesRes.rows.reduce(
    (sum, s) => sum + Number(s.duration_min),
    0
  );

} else {

  // fallback old system
  finalServiceIds = [service_id];

  const serviceRes = await query(
    `select duration_min
     from public.services
     where id = $1
     limit 1`,
    [service_id]
  );

  if (!serviceRes.rowCount) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  totalDuration = Number(serviceRes.rows[0].duration_min);
}

    // ---------- parse time safely ----------
    const start = new Date(start_at);

    if (Number.isNaN(start.getTime())) {
      return Response.json(
        { error: "Invalid start_at value" },
        { status: 400 }
      );
    }

    // ---------- block past bookings ----------
    const now = new Date();

    if (start.getTime() < now.getTime() - 60000) {
      return Response.json(
        { error: "Cannot book in the past" },
        { status: 400 }
      );
    }

    const end = new Date(start.getTime() + totalDuration * 60000);
    // ---------- business hours check (wie PATCH) ----------

// helper functions (falls nicht vorhanden, oben im File einfügen)
function getLocalParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;

  const wdMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  return {
    hh: Number(map.hour),
    mm: Number(map.minute),
    weekday: wdMap[map.weekday] ?? null,
  };
}

function timeToMin(t) {
  if (!t) return null;
  const [hh, mm] = String(t).split(":");
  return Number(hh) * 60 + Number(mm);
}

// timezone aus salon
const tz = salonRes.rows[0].timezone || "Europe/Berlin";

// local parts berechnen
const lp = getLocalParts(start, tz);
const endParts = getLocalParts(end, tz);

// business hours laden
const bh = await query(
  `select open_time, close_time
   from public.business_hours
   where salon_id = $1 and weekday = $2
   limit 1`,
  [salon_id, lp.weekday]
);

if (!bh.rowCount) {
  return Response.json(
    { error: "Außerhalb der Öffnungszeiten." },
    { status: 400 }
  );
}

const openMin = timeToMin(bh.rows[0].open_time);
const closeMin = timeToMin(bh.rows[0].close_time);

const startMin = lp.hh * 60 + lp.mm;
const endMin = endParts.hh * 60 + endParts.mm;

// kein über Mitternacht
if (endParts.weekday !== lp.weekday) {
  return Response.json(
    { error: "Termin darf nicht über Mitternacht gehen." },
    { status: 400 }
  );
}

// außerhalb Öffnungszeiten
if (!(startMin >= openMin && endMin <= closeMin)) {
  return Response.json(
    { error: "Außerhalb der Öffnungszeiten." },
    { status: 400 }
  );
} 

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // ---------- transaction ----------
    await query(`BEGIN`);

    if (employee_id) {

  const empCheck = await query(
    `select id
     from public.employees
     where id = $1 and salon_id = $2 and active = true
     limit 1`,
    [employee_id, salon_id]
  );

  if (!empCheck.rowCount) {
    await query(`ROLLBACK`);
    return Response.json(
      { error: "Mitarbeiter ungültig" },
      { status: 400 }
    );
  }

}

    // ---------- overlap protection ----------
    console.log("EMPLOYEE_ID:", employee_id);
let overlap;

if (employee_id) {

  console.log("CHECK: EMPLOYEE OVERLAP", employee_id);

  overlap = await query(
    `
    select id
    from public.appointments
    where salon_id = $1
    and status <> 'cancelled'
    and (
      employee_id = $2
      OR employee_id IS NULL
    )
    and start_at < $3
    and end_at > $4
    limit 1
    `,
    [salon_id, employee_id, endISO, startISO]
  );

} else {

  console.log("CHECK: GLOBAL OVERLAP");

  overlap = await query(
    `
    select id
    from public.appointments
    where salon_id = $1
    and status <> 'cancelled'
    and start_at < $2
    and end_at > $3
    limit 1
    `,
    [salon_id, endISO, startISO]
  );

}

  // 🔹 legacy global block
  overlap = await query(
    `
    select id
    from public.appointments
    where salon_id = $1
    and status <> 'cancelled'
    and start_at < $2
    and end_at > $3
    limit 1
    `,
    [salon_id, endISO, startISO]
  );

}

if (overlap.rowCount) {
  await query(`ROLLBACK`);
  return Response.json(
    { error: "Slot already booked" },
    { status: 409 }
  );
}{
      await query(`ROLLBACK`);
      return Response.json(
        { error: "Slot already booked" },
        { status: 409 }
      );
    }

    // ---------- insert appointment ----------
    const insert = await query(
      `
insert into public.appointments (
  salon_id,
  service_ids,
  start_at,
  end_at,
  customer_name,
  customer_phone,
  customer_email,
  internal_note,
  status,
  employee_id
)
values ($1,$2,$3,$4,$5,$6,$7,$8,'confirmed',$9)
      returning id
      `,
[
  salon_id,
  finalServiceIds,
  startISO,
  endISO,
  customer_name ? String(customer_name).trim() : null,
  customer_phone ? String(customer_phone).trim() : null,
  customer_email ? String(customer_email).trim() : null,
  internal_note ? String(internal_note).trim() : null,
  employee_id ?? null
]
    );

    await query(`COMMIT`);

    return Response.json({
      ok: true,
      id: insert.rows[0].id
    });

  } catch (error) {

    try {
      await query(`ROLLBACK`);
    } catch {}

    console.error("[API_ERROR]", {
      route: "/api/s/[slug]/appointments",
      slug,
      message: error?.message,
    });

console.error("POST APPOINTMENT ERROR:", error);

return Response.json(
  { error: error?.message || "Technischer Fehler." },
  { status: 500 }
);
  }
}
