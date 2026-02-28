"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISOFromDatetimeLocal(v) {
  // v like "2026-02-19T15:00"
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function minutesFromISO(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function weekdayLabelDe(weekday) {
  // 1=Mon ... 7=Sun
  const map = {
    1: "Mo",
    2: "Di",
    3: "Mi",
    4: "Do",
    5: "Fr",
    6: "Sa",
    7: "So",
  };
  return map[weekday] || String(weekday);
}

function normalizeHHMM(v) {
  if (!v) return "";
  const s = String(v).slice(0, 5);
  // expects "HH:MM"
  if (!/^\d{2}:\d{2}$/.test(s)) return "";
  return s;
}

// ====== UI THEME (Dark, calm, owner-tool) ======
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
    boxShadow: "0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(6px)",
    padding: 18,
  },

  tabsRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
  },
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

  controlsCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.6)",
    padding: 14,
    position: "sticky",
    top: 16,
    zIndex: 40,
    backdropFilter: "blur(6px)",
  },

  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto",
    gap: 10,
    alignItems: "center",
  },
  controlsGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    alignItems: "center",
    marginTop: 10,
  },
  controlsGrid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    alignItems: "start",
    marginTop: 10,
  },

  input: {
    width: "100%",
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 88,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.35,
  },
  hint: { fontSize: 12, color: "#93A4BF", marginTop: 6 },

  button: {
    height: 40,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid rgba(59, 130, 246, 0.45)",
    background: "rgba(59, 130, 246, 0.16)",
    color: "#DBEAFE",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248, 113, 113, 0.45)",
    background: "rgba(127, 29, 29, 0.22)",
    color: "#FCA5A5",
    fontSize: 13,
  },
  ok: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(34, 197, 94, 0.35)",
    background: "rgba(20, 83, 45, 0.25)",
    color: "#86EFAC",
    fontSize: 13,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "88px 1fr",
    gap: 12,
    alignItems: "start",
    marginTop: 12,
  },

  hourCol: (h) => ({ position: "relative", height: h, userSelect: "none", zIndex: 1 }),

  // label for every 15 minutes
  timeLabel: (isHour) => ({
    position: "absolute",
    fontSize: isHour ? 12 : 11,
    fontWeight: isHour ? 800 : 600,
    color: isHour ? "#E5E7EB" : "rgba(229,231,235,0.55)",
    transform: "translateY(-50%)",
    letterSpacing: "-0.01em",
  }),

  canvas: (h) => ({
    position: "relative",
    height: h,
    borderRadius: 20,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "linear-gradient(180deg, rgba(2,6,23,0.72) 0%, rgba(11,18,32,0.72) 100%)",
    overflow: "hidden",
    zIndex: 1,
  }),

  gridLine: (top, isHour) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: isHour ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
  }),

  block: (top, height) => ({
    position: "absolute",
    left: 12,
    right: 12,
    top,
    height,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    padding: 12,
    boxShadow: "0 10px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }),

  blockTime: { fontWeight: 850, letterSpacing: "-0.01em", fontSize: 13, color: "#E5E7EB" },
  blockService: { fontSize: 13, color: "#CBD5E1", marginTop: 2 },
  blockName: { fontSize: 12, color: "#E5E7EB", fontWeight: 750, marginTop: 4 },
  blockDetails: { fontSize: 11, color: "#93A4BF", marginTop: 2, lineHeight: 1.25 },
  blockStatus: { fontSize: 11, color: "#93A4BF" },

  sectionTitle: { fontSize: 14, fontWeight: 800, marginTop: 18, marginBottom: 10, color: "#E5E7EB" },

  hoursCard: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(2,6,23,0.28)",
    padding: 14,
  },
  hoursTable: { width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" },
  hoursTh: { textAlign: "left", fontSize: 12, color: "#93A4BF", fontWeight: 700, paddingBottom: 6 },
  hoursTd: { paddingRight: 10 },
  timeInput: {
    width: 96,
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
  },
  hoursSaveRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 10 },
  small: { fontSize: 12, color: "#93A4BF" },
};

export default function Page({ params }) {
  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");

  // customer fields (Feature 2)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [todayRows, setTodayRows] = useState([]);
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  // business hours section
  const [hoursByDay, setHoursByDay] = useState(() => {
    const init = {};
    for (let w = 1; w <= 7; w++) init[w] = { open_time: "", close_time: "" };
    return init;
  });
  const [hoursError, setHoursError] = useState("");
  const [hoursOk, setHoursOk] = useState("");

  const PX_PER_MIN = 2; // timeline scale (do not change logic)

  const timelineHeight = useMemo(() => {
    return Math.max(300, (displayEndMin - displayStartMin) * PX_PER_MIN);
  }, [displayStartMin, displayEndMin]);

  async function loadServices() {
    if (!slug) return;
    const res = await fetch(`/api/s/${slug}/services`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const arr = Array.isArray(data.services) ? data.services : [];
    setServices(arr);
  }

  async function loadToday() {
    if (!slug) return;
    const res = await fetch(`/api/s/${slug}/dashboard/today`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      setTodayRows([]);
      return;
    }
    setError("");
    setTodayRows(Array.isArray(data.rows) ? data.rows : []);
    if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
    if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
  }

  async function loadHours() {
    if (!slug) return;
    setHoursError("");
    const res = await fetch(`/api/s/${slug}/business-hours`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const arr = Array.isArray(data.hours) ? data.hours : [];

    const next = {};
    for (let w = 1; w <= 7; w++) next[w] = { open_time: "", close_time: "" };

    for (const r of arr) {
      const w = Number(r.weekday);
      if (w >= 1 && w <= 7) {
        next[w] = {
          open_time: normalizeHHMM(r.open_time),
          close_time: normalizeHHMM(r.close_time),
        };
      }
    }
    setHoursByDay(next);
  }

  useEffect(() => {
    setOkMsg("");
    setHoursOk("");
    loadServices();
    loadToday();
    loadHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const blocks = useMemo(() => {
    return (todayRows || [])
      .map((r) => {
        const startMin = minutesFromISO(r.start_at);
        const endMin = minutesFromISO(r.end_at);
        if (startMin == null || endMin == null) return null;

        const top = (startMin - displayStartMin) * PX_PER_MIN;
        const height = Math.max(32, (endMin - startMin) * PX_PER_MIN);

        const st = new Date(r.start_at);
        const label = `${pad2(st.getHours())}:${pad2(st.getMinutes())}`;

        return {
          id: r.id,
          top,
          height,
          startLabel: label,
          service_name: r.service_name,
          status: r.status,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          customer_email: r.customer_email,
          internal_note: r.internal_note,
        };
      })
      .filter(Boolean)
      .filter((b) => b.top + b.height > 0 && b.top < timelineHeight);
  }, [todayRows, displayStartMin, timelineHeight]);

  // 15-min ticks (DISPLAY ONLY) – no new logic
  const ticks15 = useMemo(() => {
    const start = Math.floor(displayStartMin / 15) * 15;
    const end = Math.ceil(displayEndMin / 15) * 15;
    const out = [];
    for (let m = start; m <= end; m += 15) out.push(m);
    return out;
  }, [displayStartMin, displayEndMin]);

  async function createAppointment() {
    try {
      setError("");
      setOkMsg("");

      if (!serviceId) return setError("Bitte Service auswählen.");
      if (!start) return setError("Bitte Startzeit auswählen.");
      if (!customerName.trim()) return setError("Bitte Kundennamen eintragen.");

      const svc = services.find((s) => s.id === serviceId);
      const duration = Number(svc?.duration_min || 0);
      if (!duration || duration <= 0) return setError("Service-Dauer fehlt. Bitte kurz melden.");

      const startISO = toISOFromDatetimeLocal(start);
      if (!startISO) return setError("Ungültige Startzeit.");

      const startDate = new Date(startISO);
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
      const endISO = endDate.toISOString();

      const res = await fetch(`/api/s/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          start_at: startISO,
          end_at: endISO,
          customer_name: customerName.trim(),
          phone: customerPhone.trim() || null,
          email: customerEmail.trim() || null,
          internal_note: internalNote.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) return setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");

      if (!res.ok) {
        if (data?.code === "OUTSIDE_HOURS") return setError("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
        if (String(data?.error || "").includes("no_overlapping_appointments"))
          return setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
        return setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      }

      setOkMsg("Termin erstellt.");
      await loadToday();
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

  async function saveHours() {
    try {
      setHoursError("");
      setHoursOk("");

      // always send hours[] (fix for “Missing hours[]”)
      const hours = [];
      for (let w = 1; w <= 7; w++) {
        const open_time = normalizeHHMM(hoursByDay[w]?.open_time);
        const close_time = normalizeHHMM(hoursByDay[w]?.close_time);

        // closed if either missing
        if (!open_time || !close_time) {
          hours.push({ weekday: w, open_time: "", close_time: "" });
        } else {
          hours.push({ weekday: w, open_time, close_time });
        }
      }

      const res = await fetch(`/api/s/${slug}/business-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setHoursError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
        return;
      }

      setHoursOk("Gespeichert.");
      await loadHours();
      await loadToday(); // display_start_min might change based on hours
    } catch (e) {
      setHoursError("Technischer Fehler. Bitte erneut versuchen.");
    }
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
          <div style={UI.tabsRow}>
            <Link href={`/dashboard/${slug}/today`} style={UI.tab(true)}>
              Today
            </Link>
            <Link href={`/dashboard/${slug}/overview`} style={UI.tab(false)}>
              Overview
            </Link>
          </div>

          <div style={UI.controlsCard}>
            <div style={UI.controlsGrid}>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={{ ...UI.input, position: "relative", zIndex: 50 }}
              >
                <option value="">Service wählen</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ({Number(s.duration_min || 0)} Min)
                  </option>
                ))}
              </select>

              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={UI.input} />

              <button onClick={createAppointment} style={UI.button}>
                Create
              </button>
            </div>

            <div style={UI.controlsGrid2}>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Kundenname (Pflicht)"
                style={UI.input}
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Telefon (optional)"
                style={UI.input}
              />
            </div>

            <div style={UI.controlsGrid3}>
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="E-Mail (optional)"
                style={UI.input}
              />
              <div>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Interne Notiz (nur intern sichtbar)"
                  style={UI.textarea}
                />
                <div style={UI.hint}>Nur intern sichtbar.</div>
              </div>
            </div>

            {error && <div style={UI.error}>{error}</div>}
            {okMsg && <div style={UI.ok}>{okMsg}</div>}
          </div>

          <div style={UI.grid}>
            {/* LEFT AXIS: every 15 minutes */}
            <div style={UI.hourCol(timelineHeight)}>
              {ticks15.map((minute) => {
                const top = (minute - displayStartMin) * PX_PER_MIN;
                if (top < 0 || top > timelineHeight) return null;

                const h = Math.floor(minute / 60);
                const m = minute % 60;
                const isHour = m === 0;
                return (
                  <div key={minute} style={{ ...UI.timeLabel(isHour), top }}>
                    {pad2(h)}:{pad2(m)}
                  </div>
                );
              })}
            </div>

            {/* TIMELINE */}
            <div style={UI.canvas(timelineHeight)}>
              {ticks15.map((minute) => {
                const top = (minute - displayStartMin) * PX_PER_MIN;
                if (top < 0 || top > timelineHeight) return null;
                const isHour = minute % 60 === 0;
                return <div key={minute} style={UI.gridLine(top, isHour)} />;
              })}

              {blocks.map((b) => {
                const phone = b.customer_phone ? `Tel: ${b.customer_phone}` : null;
                const mail = b.customer_email ? `Mail: ${b.customer_email}` : null;
                const note = b.internal_note ? `Notiz: ${b.internal_note}` : null;
                const details = [phone, mail, note].filter(Boolean).join(" · ");

                return (
                  <div key={b.id} style={UI.block(b.top, b.height)}>
                    <div>
                      <div style={UI.blockTime}>{b.startLabel}</div>
                      <div style={UI.blockService}>{b.service_name || "Service"}</div>
                      {b.customer_name && <div style={UI.blockName}>{b.customer_name}</div>}
                      {details && <div style={UI.blockDetails}>{details}</div>}
                    </div>
                    <div style={UI.blockStatus}>{b.status}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BUSINESS HOURS */}
          <div style={UI.sectionTitle}>Öffnungszeiten (Mo–So)</div>
          <div style={UI.hoursCard}>
            <table style={UI.hoursTable}>
              <thead>
                <tr>
                  <th style={UI.hoursTh}>Tag</th>
                  <th style={UI.hoursTh}>Open</th>
                  <th style={UI.hoursTh}>Close</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, idx) => {
                  const w = idx + 1;
                  const row = hoursByDay[w] || { open_time: "", close_time: "" };
                  return (
                    <tr key={w}>
                      <td style={{ ...UI.hoursTd, width: 80, color: "#E5E7EB", fontSize: 13, fontWeight: 700 }}>
                        {weekdayLabelDe(w)}
                      </td>
                      <td style={UI.hoursTd}>
                        <input
                          type="time"
                          value={row.open_time || ""}
                          onChange={(e) =>
                            setHoursByDay((prev) => ({
                              ...prev,
                              [w]: { ...prev[w], open_time: e.target.value },
                            }))
                          }
                          style={UI.timeInput}
                        />
                      </td>
                      <td style={UI.hoursTd}>
                        <input
                          type="time"
                          value={row.close_time || ""}
                          onChange={(e) =>
                            setHoursByDay((prev) => ({
                              ...prev,
                              [w]: { ...prev[w], close_time: e.target.value },
                            }))
                          }
                          style={UI.timeInput}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={UI.hoursSaveRow}>
              <button onClick={saveHours} style={UI.button}>
                Speichern
              </button>
              <div style={UI.small}>Leere Zeiten = geschlossen. Buchungen außerhalb werden serverseitig blockiert.</div>
            </div>

            {hoursError && <div style={UI.error}>{hoursError}</div>}
            {hoursOk && <div style={UI.ok}>{hoursOk}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
