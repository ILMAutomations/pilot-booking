import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export async function GET(req, { params }) {

  const slug = params.slug;

  const { searchParams } = new URL(req.url);

  const serviceId = searchParams.get("service_id");
  const date = searchParams.get("date");

  if (!serviceId || !date) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  // --------------------------------------------------
  // 1 Salon
  // --------------------------------------------------

  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!salon) {
    return Response.json({ error: "Salon not found" }, { status: 404 });
  }

  const salonId = salon.id;

  // --------------------------------------------------
  // 2 Service duration
  // --------------------------------------------------

  const { data: service } = await supabase
    .from("services")
    .select("duration_min")
    .eq("id", serviceId)
    .single();

  if (!service) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const duration = service.duration_min;

  // --------------------------------------------------
  // 3 Business Hours
  // --------------------------------------------------

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

  const weekdayDb = weekdayMap[weekday];

  const { data: hours } = await supabase
    .from("business_hours")
    .select("open_time, close_time")
    .eq("salon_id", salonId)
    .eq("weekday", weekdayDb)
    .single();

  if (!hours || !hours.open_time || !hours.close_time) {
    return Response.json({ slots: [] });
  }

  const open = `${date}T${hours.open_time}`;
  const close = `${date}T${hours.close_time}`;

  // --------------------------------------------------
  // 4 Existing appointments
  // --------------------------------------------------

  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_at, end_at")
    .eq("salon_id", salonId)
    .gte("start_at", `${date}T00:00:00`)
    .lt("start_at", `${date}T23:59:59`)
    .neq("status", "cancelled");

  const appts = appointments || [];

  // --------------------------------------------------
  // 5 Generate slots
  // --------------------------------------------------

  const slots = [];

  let cursor = new Date(open);
  const end = new Date(close);

  while (cursor < end) {

    const slotStart = new Date(cursor);
    const slotEnd = addMinutes(slotStart, duration);

    if (slotEnd > end) break;

    // --------------------------------------------------
    // overlap check
    // --------------------------------------------------

    const overlap = appts.some(appt => {

      const apptStart = new Date(appt.start_at);
      const apptEnd = new Date(appt.end_at);

      return (
        slotStart < apptEnd &&
        slotEnd > apptStart
      );

    });

    if (!overlap) {

      slots.push(
        slotStart.toTimeString().slice(0,5)
      );

    }

    cursor = addMinutes(cursor, 15);
  }

  return Response.json({
    slots
  });
}
