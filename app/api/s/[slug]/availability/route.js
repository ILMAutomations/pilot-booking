import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function bad(msg) {
  return json({ error: msg || "Technischer Fehler." }, 400);
}

function isUuid(v) {
  return typeof v === "string" &&
    /^[0-9a-f-]{36}$/i.test(v);
}

function timeToMin(t) {
  if (!t) return null;
  const [hh, mm] = String(t).split(":");
  return Number(hh) * 60 + Number(mm);
}

function minToTime(m) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function getSalonBySlug(slug) {
  const r = await query(
    `select id, timezone
     from public.salons
     where slug = $1
     limit 1`,
    [slug]
  );
  return r.rows?.[0] || null;
}

async function getServiceForSalon(salon_id, service_id) {
  const r = await query(
    `select duration_min
     from public.services
     where salon_id = $1 and id = $2
     limit 1`,
    [salon_id, service_id]
  );
  return r.rows?.[0] || null;
}

async function getBusinessHoursForWeekday(salon_id, weekday) {
  const r = await query(
    `select open_time, close_time
     from public.business_hours
     where salon_id = $1 and weekday = $2
     limit 1`,
    [salon_id, weekday]
  );
  return r.rows?.[0] || null;
}

async function getAppointmentsForDay(salon_id, date) {
  const r = await query(
    `select start_at, end_at, employee_id
     from public.appointments
     where salon_id = $1
     and date(start_at) = $2
     and (status is null or status <> 'cancelled')`,
    [salon_id, date]
  );
  return r.rows || [];
}

export async function GET(req, { params }) {

  try {

    const slug = params?.slug;
    if (!slug) return bad("Ungültiger Salon.");

    const url = new URL(req.url);

    const service_id = url.searchParams.get("service_id");
    const date = url.searchParams.get("date");

    if (!service_id || !date) {
      return bad("service_id und date erforderlich.");
    }

    if (!isUuid(service_id)) {
      return bad("Ungültige Service ID.");
    }

    const salon = await getSalonBySlug(slug);
    if (!salon) return bad("Salon nicht gefunden.");

    const tz = salon.timezone || "Europe/Berlin";

    const service = await getServiceForSalon(salon.id, service_id);
    if (!service) return bad("Service nicht gefunden.");

    const duration = Number(service.duration_min);

    const weekday = new Date(date).getDay();

    const weekdayMap = {
      0: 7,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6
    };

    const bh = await getBusinessHoursForWeekday(
      salon.id,
      weekdayMap[weekday]
    );

    if (!bh?.open_time || !bh?.close_time) {
      return json({ slots: [] });
    }

    const openMin = timeToMin(bh.open_time);
    const closeMin = timeToMin(bh.close_time);

    const appointments = await getAppointmentsForDay(salon.id, date);
    // 🔹 employees laden
const employeesRes = await query(
  `select id, name
   from public.employees
   where salon_id = $1 and active = true`,
  [salon.id]
);

const employees = employeesRes.rows || [];

const globalAppts = [];
const employeeAppts = {};

for (const e of employees) {
  employeeAppts[e.id] = [];
}

for (const a of appointments) {

  const start = new Date(a.start_at);
  const end = new Date(a.end_at);

  const startLocal = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz
  });

  const endLocal = end.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz
  });

  const obj = {
    start: timeToMin(startLocal),
    end: timeToMin(endLocal)
  };

  if (!a.employee_id) {
    globalAppts.push(obj);
  } else {
    if (!employeeAppts[a.employee_id]) {
      employeeAppts[a.employee_id] = [];
    }
    employeeAppts[a.employee_id].push(obj);
  }

} 

    const slots = [];

    // current time block (prevents past bookings)
    const now = new Date();
    const todayStr = now.toISOString().slice(0,10);

    let nowMin = 0;

    if (date === todayStr) {

      const nowLocal = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz
      });

      nowMin = timeToMin(nowLocal);
    }

    for (let m = openMin; m + duration <= closeMin; m += 15) {

      if (m < nowMin) continue;

      const slotStart = m;
      const slotEnd = m + duration;

// 🔹 zuerst global check
let globalBlocked = false;

for (const a of globalAppts) {
  if (slotStart < a.end && slotEnd > a.start) {
    globalBlocked = true;
    break;
  }
}

if (globalBlocked) continue;

// 🔹 jetzt pro employee prüfen
const availableEmployees = [];

for (const e of employees) {

  const list = employeeAppts[e.id] || [];

  let blocked = false;

  for (const a of list) {
    if (slotStart < a.end && slotEnd > a.start) {
      blocked = true;
      break;
    }
  }

  if (!blocked) {
    availableEmployees.push({
      id: e.id,
      name: e.name
    });
  }
}

// 🔹 wenn mindestens 1 Mitarbeiter frei → Slot gültig
if (availableEmployees.length > 0) {
  slots.push({
    time: minToTime(slotStart),
    employees: availableEmployees
  });
}

    }

    return json({ slots });

  } catch (e) {

    console.error(e);

    return json({ error: "Technischer Fehler." }, 500);

  }
}
