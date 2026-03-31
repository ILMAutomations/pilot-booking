"use client";
 
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode.react";

const UI = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070B14 0%, #0B1220 55%, #070B14 100%)",
    color: "#E5E7EB",
    padding: "48px 20px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  shell: { maxWidth: 1100, margin: "0 auto" },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 },
  sub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  badge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #233044",
    background: "rgba(17, 24, 39, 0.55)",
    color: "#C7D2FE",
  },
  card: {
    borderRadius: 18,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(11, 18, 32, 0.72)",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(6px)",
    padding: 18,
  },
  tabsRow: { display: "flex", gap: 10, alignItems: "center", marginBottom: 14 },
  tab: (active) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: active ? "1px solid rgba(59, 130, 246, 0.55)" : "1px solid rgba(35,48,68,0.9)",
    background: active ? "rgba(59, 130, 246, 0.16)" : "rgba(2,6,23,0.35)",
    color: active ? "#DBEAFE" : "#CBD5E1",
    fontWeight: 650,
    fontSize: 13,
    textDecoration: "none",
  }),
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.9fr 0.9fr",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(2,6,23,0.35)",
    color: "#E5E7EB",
    padding: "0 10px",
    outline: "none",
  },
  textarea: {
    minHeight: 0,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(2,6,23,0.35)",
    color: "#E5E7EB",
    padding: "10px",
    outline: "none",
    resize: "vertical",
  },
  btn: (disabled) => ({
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(59, 130, 246, 0.45)",
    background: disabled ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.20)",
    color: disabled ? "rgba(219,234,254,0.55)" : "#DBEAFE",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  success: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(16, 185, 129, 0.35)",
    background: "rgba(16, 185, 129, 0.12)",
    color: "#A7F3D0",
    fontSize: 13,
  },
  error: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248, 113, 113, 0.45)",
    background: "rgba(127, 29, 29, 0.22)",
    color: "#FCA5A5",
    fontSize: 13,
  },
  timelineWrap: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(35,48,68,0.9)",
    background: "rgba(2,6,23,0.35)",
    overflow: "hidden",
  },
  timeline: { display: "grid", gridTemplateColumns: "86px 1fr" },
 axis: { padding: "0" },
  axisItem: (isHour) => ({
    height: 18, // 15-min slot height
    paddingLeft: 12,
    fontSize: isHour ? 12 : 11,
    fontWeight: isHour ? 800 : 600,
    color: isHour ? "#E5E7EB" : "rgba(229,231,235,0.55)",
    opacity: isHour ? 1 : 0.85,
  }),
  gridArea: { position: "relative", padding: "0 12px 14px 12px" },
  slotLine: (isHour) => ({
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    background: isHour ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
  }),
  appt: (status) => {

  let border = "rgba(255,255,255,0.10)";
  let bg = "rgba(17,24,39,0.92)";

  if (status === "confirmed") {
    border = "rgba(59,130,246,0.9)";
    bg = "rgba(37,99,235,0.25)";
  }

  if (status === "completed") {
    border = "rgba(16,185,129,0.9)";
    bg = "rgba(16,185,129,0.25)";
  }

  if (status === "no_show") {
    border = "rgba(239,68,68,0.9)";
    bg = "rgba(127,29,29,0.35)";
  }

  if (status === "cancelled") {
    border = "rgba(148,163,184,0.6)";
    bg = "rgba(71,85,105,0.35)";
  }

  return {
    position: "absolute",
    left: 10,
    right: 10,
    borderRadius: 14,
    border: `1px solid ${border}`,
    background: bg,
    padding: 10,
    boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
minHeight: 0
  };

},
  apptTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  apptTime: { fontSize: 12, fontWeight: 900 },
apptService: {
  fontSize: 12,
  color: "#CBD5E1",
  lineHeight: "14px",
  maxHeight: "28px",
  overflow: "hidden"
},

apptName: {
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "normal",
  lineHeight: "14px"
},
  apptMeta: { fontSize: 11, color: "#93A4BF" },
  apptActions: { display: "flex", gap: 8, alignItems: "center" },
  miniBtn: {
    height: 28,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(2,6,23,0.35)",
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    padding: "0 10px",
  },
  sectionTitle: { marginTop: 18, fontSize: 14, fontWeight: 900, color: "#E5E7EB" },

  hoursTable: {
    marginTop: 10,
    borderRadius: 16,
    border: "1px solid rgba(35,48,68,0.9)",
    background: "rgba(2,6,23,0.35)",
    overflow: "hidden",
  },
  hoursRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 1fr 120px",
    gap: 10,
    padding: "10px 12px",
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  hoursHeader: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 1fr 120px",
    gap: 10,
    padding: "10px 12px",
    alignItems: "center",
    color: "#93A4BF",
    fontSize: 12,
    fontWeight: 800,
  },
  pill: (open) => ({
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: open ? "rgba(16,185,129,0.18)" : "rgba(148,163,184,0.10)",
    color: open ? "#A7F3D0" : "rgba(226,232,240,0.75)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  }),
};

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}
function isoToLocalInputValue(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

const WEEKDAYS = [
  { w: 1, label: "Mo" },
  { w: 2, label: "Di" },
  { w: 3, label: "Mi" },
  { w: 4, label: "Do" },
  { w: 5, label: "Fr" },
  { w: 6, label: "Sa" },
  { w: 7, label: "So" },
];

export default function Page({ params }) {
  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [serviceIds, setServiceIds] = useState([]);
  const [startAtLocal, setStartAtLocal] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const [today, setToday] = useState(null);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const okTimer = useRef(null);

  // owner-control modal
  const [moveOpen, setMoveOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppt, setDetailAppt] = useState(null);
  const [moveId, setMoveId] = useState("");
  const [moveStart, setMoveStart] = useState("");
function openDetail(appt) {
  console.log("APPT DATA:", appt);
  setDetailAppt(appt);
  setDetailOpen(true);
} 
  // business hours
  const [hours, setHours] = useState(() =>
    WEEKDAYS.map((d) => ({ weekday: d.w, open: false, open_time: "", close_time: "" }))
  );
  const [hoursErr, setHoursErr] = useState("");
  const [hoursOk, setHoursOk] = useState("");

  function showOk(msg) {
    setOkMsg(msg);
    if (okTimer.current) clearTimeout(okTimer.current);
    okTimer.current = setTimeout(() => setOkMsg(""), 3000);
  }

  async function loadServices() {
    const res = await fetch(`/api/s/${slug}/services`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.services)) setServices(data.services);
  }

  async function loadToday() {
    setError("");
    const res = await fetch(`/api/s/${slug}/dashboard/today`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setToday(null);
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      return;
    }
    setToday(data);
  }

async function loadEmployees() {
  const res = await fetch(`/api/s/${slug}/employees`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));

  if (res.ok && Array.isArray(data.rows)) {
    setEmployees(data.rows);
  }
}
 
  async function loadHours() {
    setHoursErr("");
    const res = await fetch(`/api/s/${slug}/business-hours`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      // keep default blank
      return;
    }
    const rows = Array.isArray(data.rows) ? data.rows : [];
    const map = new Map(rows.map((r) => [Number(r.weekday), r]));
    const next = WEEKDAYS.map((d) => {
      const r = map.get(d.w);
      if (!r || !r.open_time || !r.close_time) {
        return { weekday: d.w, open: false, open_time: "", close_time: "" };
      }
      // normalize: "HH:MM:SS" -> "HH:MM"
      const ot = String(r.open_time).slice(0, 5);
      const ct = String(r.close_time).slice(0, 5);
      return { weekday: d.w, open: true, open_time: ot, close_time: ct };
    });
    setHours(next);
  }

useEffect(() => {
  if (!slug) return;
  loadServices();
  loadToday();
  loadHours();
  loadEmployees();
  }, [slug]);

  const canCreate =
  serviceIds.length > 0 &&
  !!startAtLocal &&
  customerName.trim().length > 0;

  async function createAppointment() {
    setError("");
    setOkMsg("");
    if (!canCreate) return;

    const start = new Date(startAtLocal);
    if (Number.isNaN(start.getTime())) {
      setError("Ungültige Startzeit.");
      return;
    }

const payload = {
  service_ids: serviceIds,
  start_at: start.toISOString(),
  customer_name: customerName.trim(),
  customer_phone: phone ? phone.trim() : null,
  customer_email: email ? email.trim() : null,
  internal_note: note ? note.trim() : null,
};
    const res = await fetch(`/api/s/${slug}/appointments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      return;
    }

    showOk("Termin erstellt.");
    await loadToday();
  }

  function openMove(appt) {
    setMoveId(appt.id);
    setMoveStart(isoToLocalInputValue(appt.start_at));
    setMoveOpen(true);
  }

  async function saveMove() {
    setError("");
    if (!moveId || !moveStart) return;

    const dt = new Date(moveStart);
    if (Number.isNaN(dt.getTime())) {
      setError("Ungültige Uhrzeit.");
      return;
    }

    const res = await fetch(`/api/s/${slug}/appointments/${moveId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ start_at: dt.toISOString() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      return;
    }

    setMoveOpen(false);
    showOk("Termin verschoben.");
    await loadToday();
  }

async function deleteAppt(id) {

  if (!confirm("Termin wirklich löschen?")) return;

  setError("");

  const res = await fetch(`/api/s/${slug}/appointments/${id}`, {
    method: "DELETE"
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.error) {
    setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
    return;
  }

  showOk("Termin gelöscht.");
  await loadToday();
}

async function updateStatus(status) {

  const apptId = detailAppt?.id;
  if (!apptId) return;

  try {

    const res = await fetch(`/api/s/${slug}/appointments/${apptId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.error) {
      setError(data?.error || "Status konnte nicht aktualisiert werden.");
      return;
    }

    setDetailOpen(false);
    setDetailAppt(null);

    await loadToday();

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
  }
}

async function saveHours() {
  setHoursErr("");
  setHoursOk("");

  const payload = {
    hours: hours.map((h) => ({
      weekday: h.weekday,
      open_time: h.open ? (h.open_time ? `${h.open_time}:00` : null) : null,
      close_time: h.open ? (h.close_time ? `${h.close_time}:00` : null) : null,
    })),
  };

  const res = await fetch(`/api/s/${slug}/business-hours`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setHoursErr(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      return;
    }

    setHoursOk("Gespeichert.");
    setTimeout(() => setHoursOk(""), 3000);
    await loadHours();
    await loadToday();
  }

  // ---- timeline math ----
  const rows = today?.rows && Array.isArray(today.rows) ? today.rows : [];
 let displayStart = Number(today?.display_start_min ?? 540);
let displayEnd = Number(today?.display_end_min ?? 1140);

// snap start to full hour to avoid visual offset
displayStart = Math.floor(displayStart / 60) * 60;

// safety fallback
if (!Number.isFinite(displayStart)) displayStart = 540;
if (!Number.isFinite(displayEnd)) displayEnd = 1140;

  const slotMin = 15;
  const slotPx = 28; // height per 15-min slot
  const totalSlots = Math.max(1, Math.ceil((displayEnd - displayStart) / slotMin));
  const gridHeight = Math.max(600, totalSlots * slotPx);

const timeline = useMemo(() => {
  const marks = [];
  for (let m = displayStart; m <= displayEnd; m += slotMin) {
    marks.push(m);
  }
  return marks;
}, [displayStart, displayEnd]);

function minFromISO(iso) {
  const d = new Date(iso);

  return (
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
      .split(":")
      .map(Number)
      .reduce((h, m) => h * 60 + m)
  );
}

  if (!slug) return null;

  return (
    <div style={UI.page}>
      <div style={UI.shell}>
        <div style={UI.headerRow}>
          <div>
            <h2 style={UI.title}>Dashboard Today</h2>
            <div style={UI.sub}>Salon: {slug}</div>
          </div>
          <div style={UI.badge}>Pilot</div>
        </div>

        <div style={UI.card}>
{/* BOOKING LINK + QR */}

<div style={{
  marginBottom:20,
  padding:16,
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:12
}}>

  <h3 style={{marginBottom:10}}>Dein Buchungslink</h3>

  <div style={{marginBottom:10,fontSize:14}}>
    {typeof window !== "undefined" && `${window.location.origin}/s/${slug}`}
  </div>

  <div style={{marginBottom:12}}>
    {typeof window !== "undefined" && (
      <QRCode
        value={`${window.location.origin}/s/${slug}`}
        size={200}
      />
    )}
  </div>

  <button
    style={UI.miniBtn}
    onClick={() => {

      const canvas = document.querySelector("canvas");

      if (!canvas) return;

      const link = document.createElement("a");

      link.download = `${slug}-booking-qr.png`;

      link.href = canvas.toDataURL();

      link.click();

    }}
  >
    QR Code herunterladen
  </button>

</div>
    
 <div style={UI.tabsRow}>
  <Link href={`/dashboard/${slug}/today`} style={UI.tab(true)}>
    Today
  </Link>

  <Link href={`/dashboard/${slug}/overview`} style={UI.tab(false)}>
    Overview
  </Link>

  <Link href={`/dashboard/${slug}/customers`} style={UI.tab(false)}>
    Customers
  </Link>

  <Link href={`/dashboard/${slug}/services`} style={UI.tab(false)}>
    Services
  </Link>
</div>

  <div style={UI.formGrid}>

 <div style={{
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>
      Mitarbeiter wählen
    </div>

    {employees.length === 0 && (
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        Keine Mitarbeiter vorhanden
      </div>
    )}

    {employees.map(emp => (
      <label key={emp.id} style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        cursor: "pointer"
      }}>
        <input
          type="radio"
          name="employee"
          checked={selectedEmployee === emp.id}
          onChange={() => setSelectedEmployee(emp.id)}
        />
        <span>{emp.name}</span>
      </label>
    ))}
  </div>

     
  <div style={{
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: 10,
  maxHeight: 140,
  overflowY: "auto"
}}>
  {services
  .slice()
  .sort((a, b) => a.duration_min - b.duration_min)
  .map((s) => {

    const checked = serviceIds.includes(s.id);

    return (
      <label key={s.id} style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        cursor: "pointer"
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            if (checked) {
              setServiceIds(serviceIds.filter(id => id !== s.id));
            } else {
              setServiceIds([...serviceIds, s.id]);
            }
          }}
        />

        <span>
{s.name} ({s.duration_min} Min • {(s.price_cents / 100).toFixed(2)}€)
        </span>
      </label>
    );
  })}
</div>

<div style={{ marginTop: 10, fontSize: 13 }}>

  <b>Ausgewählt:</b>

  {serviceIds.length === 0 && (
    <div style={{ opacity: 0.6 }}>Keine Services gewählt</div>
  )}

  {services
    .filter(s => serviceIds.includes(s.id))
    .map(s => (
      <div key={s.id}>
• {s.name} ({s.duration_min} min • {(s.price_cents / 100).toFixed(2)}€)
      </div>
    ))}

{serviceIds.length > 0 && (
  <>
    <div style={{ marginTop: 6, fontWeight: 700 }}>
      Gesamt: {
        services
          .filter(s => serviceIds.includes(s.id))
          .reduce((sum, s) => sum + s.duration_min, 0)
      } min
    </div>

    <div style={{ fontWeight: 700 }}>
      Preis: {
        (services
          .filter(s => serviceIds.includes(s.id))
          .reduce((sum, s) => sum + s.price_cents, 0) / 100
        ).toFixed(2)
      } €
    </div>
  </>
)}

</div>

            <input
              style={{
                ...UI.input,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(15, 23, 42, 0.55)",
              }}
              type="datetime-local"
              value={startAtLocal}
              onChange={(e) => setStartAtLocal(e.target.value)}
            />

            <button style={UI.btn(!canCreate)} disabled={!canCreate} onClick={createAppointment}>
              Create
            </button>

            <input
              style={UI.input}
              placeholder="Kundenname (Pflicht)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <input
              style={UI.input}
              placeholder="Telefon (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div />

            <input
              style={UI.input}
              placeholder="E-Mail (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <textarea
              style={UI.textarea}
              placeholder="Interne Notiz (nur intern sichtbar)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div style={{ fontSize: 11, color: "rgba(229,231,235,0.55)" }}>
              Nur intern sichtbar.
            </div>
          </div>

          {okMsg && <div style={UI.success}>{okMsg}</div>}
          {error && <div style={UI.error}>{error}</div>}

          {/* Move modal */}
          {moveOpen && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(2,6,23,0.35)" }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Termin verschieben</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  style={UI.input}
                  type="datetime-local"
                  value={moveStart}
                  onChange={(e) => setMoveStart(e.target.value)}
                />
                <button style={UI.btn(false)} onClick={saveMove}>Speichern</button>
                <button
                  style={{ ...UI.miniBtn, borderColor: "rgba(255,255,255,0.10)" }}
                  onClick={() => setMoveOpen(false)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div style={UI.timelineWrap}>
            <div style={UI.timeline}>
              <div style={UI.axis}>
               {timeline.map((m) => {
                  const isHour = m % 60 === 0;
                  return (
                    <div key={m} style={UI.axisItem(isHour)}>
                      {toHHMM(m)}
                    </div>
                  );
                })}
              </div>

<div style={{ ...UI.gridArea, minHeight: gridHeight }}>
                {/* slot lines */}
                {timeline.map((m) => {
                  const idx = timeline.indexOf(m);
                  const top = idx * slotPx;
                  const isHour = m % 60 === 0;
                  return <div key={m} style={{ ...UI.slotLine(isHour), top }} />;
                })}

                {/* appointments */}
                {rows.map((a, index) => {
                 console.log("DURATION DEBUG:", {
  start: a.start_at,
  duration: a.total_duration
});
                  console.log("TIMELINE SERVICES:", a.services);
                 
                  const startMin = minFromISO(a.start_at);
const endMin = startMin + (a.total_duration || 0);
                  const top = ((startMin - displayStart) / 15) * slotPx;
const duration = a.total_duration || 0;

const height = Math.max(
  slotPx,
  (duration / 15) * slotPx
);

                  const st = new Date(a.start_at);
                  const time = `${pad2(st.getHours())}:${pad2(st.getMinutes())}`;

return (
  <div
    key={a.id}
    style={{
      ...UI.appt(a.status),
      top,
      height,
      left: index % 2 === 0 ? "10px" : "55%",
      width: index % 2 === 0 ? "40%" : "40%",
      right: index % 2 === 0 ? "auto" : "10px",
      cursor: "pointer"
    }}
    onClick={() => openDetail(a)}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      
      <div style={UI.apptTime}>{time}</div>

      <div style={UI.apptService}>
        {a.services && a.services.length > 0
          ? `${a.services[0].name}${a.services.length > 1 ? ` +${a.services.length - 1}` : ""}`
          : "Service"}
      </div>

      <div style={{ fontSize: 11, opacity: 0.6 }}>
        {a.employee_name || "—"}
      </div>

      <div style={UI.apptName}>
        {a.customer_name || "—"}
      </div>

    </div>
  </div>
);
                })}
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div style={UI.sectionTitle}>Öffnungszeiten (Mo–So)</div>

          <div style={UI.hoursTable}>
            <div style={UI.hoursHeader}>
              <div>Tag</div>
              <div>Open</div>
              <div>Close</div>
              <div>Status</div>
            </div>

            {WEEKDAYS.map((d) => {
              const row = hours.find((h) => h.weekday === d.w) || { open: false, open_time: "", close_time: "" };
              return (
                <div key={d.w} style={UI.hoursRow}>
                  <div style={{ fontWeight: 800 }}>{d.label}</div>

                  <input
                    style={UI.input}
                    type="time"
                    value={row.open ? row.open_time : ""}
                    disabled={!row.open}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHours((prev) => prev.map((h) => (h.weekday === d.w ? { ...h, open_time: v } : h)));
                    }}
                  />

                  <input
                    style={UI.input}
                    type="time"
                    value={row.open ? row.close_time : ""}
                    disabled={!row.open}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHours((prev) => prev.map((h) => (h.weekday === d.w ? { ...h, close_time: v } : h)));
                    }}
                  />

                  <button
                    style={UI.pill(row.open)}
                    onClick={() => {
                      setHours((prev) =>
                        prev.map((h) =>
                          h.weekday === d.w
                            ? row.open
                              ? { ...h, open: false, open_time: "", close_time: "" }
                              : { ...h, open: true, open_time: h.open_time || "10:00", close_time: h.close_time || "18:00" }
                            : h
                        )
                      );
                    }}
                  >
                    {row.open ? "Open" : "Closed"}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <button style={UI.btn(false)} onClick={saveHours}>Speichern</button>
            <div style={{ fontSize: 12, color: "rgba(229,231,235,0.55)" }}>
              Closed = leere Zeiten. Buchungen außerhalb werden serverseitig blockiert.
            </div>
          </div>

          {hoursOk && <div style={UI.success}>{hoursOk}</div>}
          {hoursErr && <div style={UI.error}>{hoursErr}</div>}
        </div>
      </div>
            {detailOpen && detailAppt && (
  <div
    onClick={() => setDetailOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}
  >
    <div
  onClick={(e) => e.stopPropagation()}
  style={{
    width: 420,
    borderRadius: 16,
    padding: 20,
    background: "#0B1220",
    border: "1px solid rgba(255,255,255,0.1)"
  }}
>

      <h3 style={{marginBottom:12}}>Appointment</h3>

      <div style={{marginTop:10}}>
  <b>Services:</b>

{Array.isArray(detailAppt.services) && detailAppt.services.map((s, i) => {
  if (!s || typeof s.name !== "string") return null;

  return (
    <div key={i} style={{fontSize:13}}>
      • {s.name}
    </div>
  );
})} 
</div>

<div style={{marginTop:10}}>
  <b>Dauer:</b> {detailAppt.total_duration} min
</div>

<div>
  <b>Preis:</b> {(detailAppt.total_price / 100).toFixed(2)} €
</div>
      <div><b>Name:</b> {detailAppt.customer_name}</div>
<div>
  <b>Mitarbeiter:</b> {detailAppt.employee_name || "—"}
</div>

      {detailAppt.customer_phone && (
        <div><b>Tel:</b> {detailAppt.customer_phone}</div>
      )}

      {detailAppt.customer_email && (
        <div><b>Email:</b> {detailAppt.customer_email}</div>
      )}

      {detailAppt.internal_note && (
        <div><b>Note:</b> {detailAppt.internal_note}</div>
      )}

 <div style={{marginTop:10}}>
  <b>Status:</b> {detailAppt.status}
</div>

<div style={{display:"flex", gap:8, marginTop:12}}>

<button
 style={UI.miniBtn}
 onClick={(e) => {
   e.stopPropagation();
   setTimeout(() => updateStatus("completed"), 0);
 }}
>
Completed
</button>

<button
 style={UI.miniBtn}
 onClick={(e) => {
   e.stopPropagation();
   setTimeout(() => updateStatus("no_show"), 0);
 }}
>
No Show
</button>
<button
 style={UI.miniBtn}
 onClick={(e) => {
   e.stopPropagation();
   setTimeout(() => updateStatus("cancelled"), 0);
 }}
>
Cancel
</button>
</div>
      <div style={{display:"flex", gap:10, marginTop:16}}>

        <button
          style={UI.miniBtn}
          onClick={(e) => {
  e.stopPropagation();
  setDetailOpen(false);
  openMove(detailAppt);
}}
        >
          Move
        </button>

        <button
          style={UI.miniBtn}
          onClick={(e) => {
  e.stopPropagation();
  deleteAppt(detailAppt.id);
}}
        >
          Delete
        </button>

        <button
          style={UI.miniBtn}
          onClick={(e) => {
  e.stopPropagation();
  setDetailOpen(false);
}}
        >
          Close
        </button>

      </div>

    </div>
  </div>
)}
    </div>
  );
}
