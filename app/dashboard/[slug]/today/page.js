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

function fmtTimeFromISO(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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
    border: active
      ? "1px solid rgba(59, 130, 246, 0.55)"
      : "1px solid rgba(35,48,68,0.9)",
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

  controlsRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  controlsRow2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  controlsRow3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    alignItems: "center",
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

  inputHi: {
    width: "100%",
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(2, 6, 23, 0.72)",
    color: "#E5E7EB",
    outline: "none",
    boxShadow: "0 0 0 2px rgba(59,130,246,0.10)",
  },

  textarea: {
    width: "100%",
    minHeight: 74,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
    resize: "vertical",
  },

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

  hint: { fontSize: 12, color: "#93A4BF", marginTop: 6 },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248, 113, 113, 0.45)",
    background: "rgba(127, 29, 29, 0.22)",
    color: "#FCA5A5",
    fontSize: 13,
  },

  sectionTitle: { fontSize: 14, fontWeight: 800, color: "#E5E7EB", margin: "18px 0 10px" },

  grid: {
    display: "grid",
    gridTemplateColumns: "88px 1fr",
    gap: 12,
    alignItems: "start",
    marginTop: 12,
  },
  hourCol: (h) => ({ position: "relative", height: h, userSelect: "none", zIndex: 1 }),
  hourLabel: { position: "absolute", fontSize: 12, color: "#93A4BF", transform: "translateY(-50%)" },

  canvas: (h) => ({
    position: "relative",
    height: h,
    borderRadius: 20,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "linear-gradient(180deg, rgba(2,6,23,0.72) 0%, rgba(11,18,32,0.72) 100%)",
    overflow: "hidden",
    zIndex: 1,
  }),
  hourLine: (top) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: "rgba(255,255,255,0.10)",
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
  blockTime: { fontWeight: 900, letterSpacing: "-0.01em", fontSize: 13, color: "#E5E7EB" },
  blockService: { fontSize: 13, color: "#CBD5E1" },
  blockCustomer: { fontSize: 12, color: "#C7D2FE" },
  blockMeta: { fontSize: 12, color: "#93A4BF" },
  blockNote: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },

  // Business hours editor
  hoursTable: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 14,
    border: "1px solid rgba(35, 48, 68, 0.9)",
  },
  hoursTh: {
    textAlign: "left",
    fontSize: 12,
    color: "#93A4BF",
    padding: "10px 12px",
    background: "rgba(2,6,23,0.35)",
    borderBottom: "1px solid rgba(35,48,68,0.9)",
  },
  hoursTd: {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(35,48,68,0.55)",
    fontSize: 12,
    color: "#CBD5E1",
  },
  smallInput: {
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
  },
  saveRow: { display: "flex", gap: 10, alignItems: "center", marginTop: 10 },
  saved: { fontSize: 12, color: "#A7F3D0" },
};

const WEEKDAYS = [
  { k: 1, label: "Mo" },
  { k: 2, label: "Di" },
  { k: 3, label: "Mi" },
  { k: 4, label: "Do" },
  { k: 5, label: "Fr" },
  { k: 6, label: "Sa" },
  { k: 7, label: "So" },
];

export default function Page({ params }) {
  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");

  // customer fields
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const [error, setError] = useState("");

  const [todayRows, setTodayRows] = useState([]);
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  // business hours editor state
  const [hours, setHours] = useState(() =>
    WEEKDAYS.map((w) => ({ weekday: w.k, open_time: "", close_time: "" }))
  );
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);

  const PX_PER_MIN = 2;

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
    setTodayRows(Array.isArray(data.rows) ? data.rows : []);
    if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
    if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
  }

  async function loadHours() {
    if (!slug) return;
    // Existing Feature-1 endpoint
    const res = await fetch(`/api/s/${slug}/business-hours`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const arr = Array.isArray(data.hours) ? data.hours : Array.isArray(data.rows) ? data.rows : [];
    if (!Array.isArray(arr) || arr.length === 0) {
      // fallback keep defaults
      return;
    }
    // Normalize into 7 weekdays
    const map = new Map();
    for (const r of arr) {
      map.set(Number(r.weekday), {
        weekday: Number(r.weekday),
        open_time: r.open_time || "",
        close_time: r.close_time || "",
      });
    }
    const next = WEEKDAYS.map((w) => map.get(w.k) || { weekday: w.k, open_time: "", close_time: "" });
    setHours(next);
  }

  useEffect(() => {
    setError("");
    loadServices();
    loadToday();
    loadHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ===== Fix for 60s offset: draw lines/labels on real clock hours =====
  const hourMarks = useMemo(() => {
    // first full hour >= displayStartMin
    const first = Math.ceil(displayStartMin / 60) * 60;
    const marks = [];
    for (let m = first; m <= displayEndMin; m += 60) marks.push(m);
    return marks;
  }, [displayStartMin, displayEndMin]);

  const blocks = useMemo(() => {
    return (todayRows || [])
      .map((r) => {
        const startMin = minutesFromISO(r.start_at);
        const endMin = minutesFromISO(r.end_at);
        if (startMin == null || endMin == null) return null;

        const top = (startMin - displayStartMin) * PX_PER_MIN;
        const height = Math.max(32, (endMin - startMin) * PX_PER_MIN);

        const startLabel = fmtTimeFromISO(r.start_at);

        return {
          id: r.id,
          top,
          height,
          startLabel,
          service_name: r.service_name,
          status: r.status,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          customer_email: r.customer_email || r.customer_mail,
          internal_note: r.internal_note,
        };
      })
      .filter(Boolean)
      .filter((b) => b.top + b.height > 0 && b.top < timelineHeight);
  }, [todayRows, displayStartMin, timelineHeight]);

  async function createAppointment() {
    try {
      setError("");

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
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          internal_note: internalNote?.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) return setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
      if (!res.ok) {
        if (data?.code === "OUTSIDE_HOURS") return setError("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
        if (String(data?.error || "").includes("no_overlapping_appointments")) {
          return setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
        }
        return setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      }

      // Success: reload
      await loadToday();
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

  async function saveHours() {
    try {
      if (!slug) return;
      setSavingHours(true);
      setHoursSaved(false);
      setError("");

      const payload = hours.map((h) => ({
        weekday: h.weekday,
        open_time: h.open_time || null,
        close_time: h.close_time || null,
      }));

      const res = await fetch(`/api/s/${slug}/business-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setError(data?.error || "Speichern fehlgeschlagen.");
        return;
      }

      setHoursSaved(true);
      await loadHours();
      await loadToday(); // refresh display window too
    } catch (e) {
      setError("Speichern fehlgeschlagen.");
    } finally {
      setSavingHours(false);
      setTimeout(() => setHoursSaved(false), 1800);
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
          {/* Tabs */}
          <div style={UI.tabsRow}>
            <Link href={`/dashboard/${slug}/today`} style={UI.tab(true)}>
              Today
            </Link>
            <Link href={`/dashboard/${slug}/overview`} style={UI.tab(false)}>
              Overview
            </Link>
          </div>

          {/* Controls */}
          <div style={UI.controlsCard}>
            <div style={UI.controlsRow}>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={{ ...UI.input, position: "relative", zIndex: 50 }}
              >
                <option value="">Service wählen</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={UI.inputHi}
              />

              <button onClick={createAppointment} style={UI.button}>
                Create
              </button>
            </div>

            <div style={UI.controlsRow2}>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Kundenname (Pflicht)"
                style={UI.input}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon (optional)"
                style={UI.input}
              />
            </div>

            <div style={UI.controlsRow3}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail (optional)"
                style={UI.input}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
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
          </div>

          {/* Timeline */}
          <div style={UI.grid}>
            <div style={UI.hourCol(timelineHeight)}>
              {hourMarks.map((m) => {
                const top = (m - displayStartMin) * PX_PER_MIN;
                const hh = Math.floor(m / 60);
                return (
                  <div key={m} style={{ ...UI.hourLabel, top }}>
                    {pad2(hh)}:00
                  </div>
                );
              })}
            </div>

            <div style={UI.canvas(timelineHeight)}>
              {hourMarks.map((m) => {
                const top = (m - displayStartMin) * PX_PER_MIN;
                return <div key={m} style={UI.hourLine(top)} />;
              })}

              {blocks.map((b) => (
                <div key={b.id} style={UI.block(b.top, b.height)}>
                  <div>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name || "Service"}</div>
                    <div style={UI.blockCustomer}>{b.customer_name || "Kunde"}</div>

                    {(b.customer_phone || b.customer_email) && (
                      <div style={UI.blockMeta}>
                        {b.customer_phone ? `☎ ${b.customer_phone}` : ""}
                        {b.customer_phone && b.customer_email ? " · " : ""}
                        {b.customer_email ? `✉ ${b.customer_email}` : ""}
                      </div>
                    )}

                    {b.internal_note ? (
                      <div style={UI.blockNote}>Notiz: {b.internal_note}</div>
                    ) : null}
                  </div>

                  <div style={UI.blockMeta}>{b.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Hours Editor (Feature 1 stays visible) */}
          <div style={{ marginTop: 22 }}>
            <div style={UI.sectionTitle}>Öffnungszeiten (Mo–So)</div>

            <table style={UI.hoursTable}>
              <thead>
                <tr>
                  <th style={UI.hoursTh}>Tag</th>
                  <th style={UI.hoursTh}>Open</th>
                  <th style={UI.hoursTh}>Close</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h, idx) => (
                  <tr key={h.weekday}>
                    <td style={UI.hoursTd}>{WEEKDAYS.find((w) => w.k === h.weekday)?.label || h.weekday}</td>
                    <td style={UI.hoursTd}>
                      <input
                        type="time"
                        value={h.open_time || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setHours((prev) => prev.map((x, i) => (i === idx ? { ...x, open_time: v } : x)));
                        }}
                        style={UI.smallInput}
                      />
                    </td>
                    <td style={{ ...UI.hoursTd, borderBottom: "none" }}>
                      <input
                        type="time"
                        value={h.close_time || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setHours((prev) => prev.map((x, i) => (i === idx ? { ...x, close_time: v } : x)));
                        }}
                        style={UI.smallInput}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={UI.saveRow}>
              <button onClick={saveHours} style={UI.button} disabled={savingHours}>
                {savingHours ? "Speichere..." : "Speichern"}
              </button>
              {hoursSaved && <div style={UI.saved}>Gespeichert.</div>}
            </div>

            <div style={UI.hint}>
              Leere Zeiten = geschlossen. Buchungen außerhalb werden serverseitig blockiert.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
