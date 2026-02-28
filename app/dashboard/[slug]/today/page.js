"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISOFromDatetimeLocal(v) {
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

// ✅ 15-min grid helpers
function floor15(min) {
  return Math.floor(min / 15) * 15;
}
function ceil15(min) {
  return Math.ceil(min / 15) * 15;
}
function ceilHour(min) {
  return Math.ceil(min / 60) * 60;
}

const WEEKDAYS = [
  { k: 1, label: "Mo" },
  { k: 2, label: "Di" },
  { k: 3, label: "Mi" },
  { k: 4, label: "Do" },
  { k: 5, label: "Fr" },
  { k: 6, label: "Sa" },
  { k: 7, label: "So" },
];

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

  controlsRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto",
    gap: 10,
    alignItems: "center",
  },

  formRow2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 10,
  },
  formRow2b: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 10,
    alignItems: "start",
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
    minHeight: 92,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
    resize: "vertical",
  },
  hint: { marginTop: 6, fontSize: 12, color: "#93A4BF" },

  button: {
    height: 40,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid rgba(59, 130, 246, 0.45)",
    background: "rgba(59, 130, 246, 0.16)",
    color: "#DBEAFE",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    whiteSpace: "nowrap",
  },

  ok: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(34, 197, 94, 0.35)",
    background: "rgba(20, 83, 45, 0.22)",
    color: "#86EFAC",
    fontSize: 13,
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

  // ✅ 15-min grid lines (hour lines a bit stronger)
  gridLine: (top, strong) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: strong ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
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
    overflow: "hidden",
  }),
  blockTime: { fontWeight: 800, letterSpacing: "-0.01em", fontSize: 13, color: "#E5E7EB" },
  blockService: { fontSize: 13, color: "#CBD5E1", marginTop: 2 },
  blockCustomer: { fontSize: 12, color: "#E5E7EB", marginTop: 2, fontWeight: 650 },
  blockMeta: { fontSize: 12, color: "#93A4BF", marginTop: 4 },
  blockStatus: { fontSize: 12, color: "#93A4BF" },

  hoursTitle: { marginTop: 22, marginBottom: 10, fontSize: 14, fontWeight: 800, color: "#E5E7EB" },
  hoursCard: {
    borderRadius: 16,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.35)",
    padding: 14,
    marginTop: 10,
  },
  hoursTable: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, color: "#93A4BF", fontWeight: 700, padding: "10px 8px" },
  td: { padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" },
  time: {
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(35,48,68,0.9)",
    background: "rgba(2,6,23,0.55)",
    color: "#E5E7EB",
    outline: "none",
    width: 110,
  },
  pill: (open) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    border: open ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(148,163,184,0.20)",
    background: open ? "rgba(20, 83, 45, 0.22)" : "rgba(15, 23, 42, 0.35)",
    color: open ? "#86EFAC" : "#93A4BF",
    fontSize: 12,
    fontWeight: 700,
    width: 80,
  }),
};

export default function Page({ params }) {
  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [todayRows, setTodayRows] = useState([]);
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  const [hours, setHours] = useState(() =>
    WEEKDAYS.map((w) => ({ weekday: w.k, open_time: "", close_time: "" }))
  );
  const [hoursSaving, setHoursSaving] = useState(false);

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
    if (data?.error) {
      setError(data.error);
      setTodayRows([]);
      return;
    }

    setTodayRows(Array.isArray(data.rows) ? data.rows : []);

    // ✅ snap to 15-min grid (NO rounding to full hours)
    if (typeof data.display_start_min === "number") {
      setDisplayStartMin(clamp(floor15(data.display_start_min), 0, 24 * 60));
    }
    if (typeof data.display_end_min === "number") {
      setDisplayEndMin(clamp(ceil15(data.display_end_min), 0, 24 * 60));
    }
  }

  async function loadBusinessHours() {
    if (!slug) return;
    const res = await fetch(`/api/s/${slug}/business-hours`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const rows = Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : [];
    const byDay = new Map();
    for (const r of rows) {
      if (r && typeof r.weekday === "number") byDay.set(r.weekday, r);
    }
    const next = WEEKDAYS.map((w) => {
      const r = byDay.get(w.k);
      return {
        weekday: w.k,
        open_time: r?.open_time || "",
        close_time: r?.close_time || "",
      };
    });
    setHours(next);
  }

  useEffect(() => {
    setError("");
    setOkMsg("");
    loadServices();
    loadToday();
    loadBusinessHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const blocks = useMemo(() => {
    return (todayRows || [])
      .map((r) => {
        const startMin = minutesFromISO(r.start_at);
        const endMin = minutesFromISO(r.end_at);
        if (startMin == null || endMin == null) return null;

        const top = (startMin - displayStartMin) * PX_PER_MIN;
        const height = Math.max(44, (endMin - startMin) * PX_PER_MIN);

        const st = new Date(r.start_at);
        const label = `${pad2(st.getHours())}:${pad2(st.getMinutes())}`;

        const metaParts = [];
        if (r.customer_phone) metaParts.push(`Tel: ${r.customer_phone}`);
        if (r.customer_email) metaParts.push(`Mail: ${r.customer_email}`);
        if (r.internal_note) metaParts.push(`Notiz: ${r.internal_note}`);

        const statusLabel = (r.status ? String(r.status) : "confirmed").toLowerCase();

        return {
          id: r.id,
          top,
          height,
          startLabel: label,
          service_name: r.service_name,
          customer_name: r.customer_name,
          meta: metaParts.join(" · "),
          status: statusLabel,
        };
      })
      .filter(Boolean)
      .filter((b) => b.top + b.height > 0 && b.top < timelineHeight);
  }, [todayRows, displayStartMin, timelineHeight]);

  async function createAppointment() {
    try {
      setError("");
      setOkMsg("");

      if (!serviceId) return setError("Bitte Service auswählen.");
      if (!start) return setError("Bitte Startzeit auswählen.");
      if (!customerName.trim()) return setError("Bitte Kundennamen eingeben.");

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
          customer_phone: customerPhone.trim() || null,
          customer_email: customerEmail.trim() || null,
          internal_note: internalNote.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) return setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");

      if (!res.ok) {
        if (data?.code === "OUTSIDE_HOURS") {
          return setError("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
        }
        if (String(data?.error || "").includes("no_overlapping_appointments")) {
          return setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
        }
        return setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      }

      await loadToday();
      setOkMsg("Termin erstellt.");
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

  async function saveBusinessHours() {
    try {
      if (!slug) return;
      setError("");
      setOkMsg("");
      setHoursSaving(true);

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
        setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
        return;
      }

      await loadBusinessHours();
      setOkMsg("Gespeichert.");
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    } finally {
      setHoursSaving(false);
    }
  }

  if (!slug) return null;

  // ✅ hour labels: show whole-hour marks within visible range
  const firstHourMark = Math.ceil(displayStartMin / 60) * 60;
  const lastHourMark = ceilHour(displayEndMin);
  const hourLabelCount =
    lastHourMark >= firstHourMark ? Math.floor((lastHourMark - firstHourMark) / 60) + 1 : 0;

  // ✅ 15-min lines
  const totalQuarterSegments = Math.floor((displayEndMin - displayStartMin) / 15);
  const quarterLineCount = Math.max(0, totalQuarterSegments) + 1;

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
                style={UI.input}
              />

              <button onClick={createAppointment} style={UI.button}>
                Create
              </button>
            </div>

            <div style={UI.formRow2}>
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

            <div style={UI.formRow2b}>
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

            {okMsg && <div style={UI.ok}>{okMsg}</div>}
            {error && <div style={UI.error}>{error}</div>}
          </div>

          <div style={UI.grid}>
            <div style={UI.hourCol(timelineHeight)}>
              {Array.from({ length: hourLabelCount }).map((_, i) => {
                const minute = firstHourMark + i * 60;
                const hour = Math.floor(minute / 60);
                const top = (minute - displayStartMin) * PX_PER_MIN;
                return (
                  <div key={i} style={{ ...UI.hourLabel, top }}>
                    {pad2(hour)}:00
                  </div>
                );
              })}
            </div>

            <div style={UI.canvas(timelineHeight)}>
              {Array.from({ length: quarterLineCount }).map((_, i) => {
                const minute = displayStartMin + i * 15;
                const top = i * 15 * PX_PER_MIN;
                const strong = minute % 60 === 0;
                return <div key={i} style={UI.gridLine(top, strong)} />;
              })}

              {blocks.map((b) => (
                <div key={b.id} style={UI.block(b.top, b.height)}>
                  <div>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name || "Service"}</div>
                    {b.customer_name ? <div style={UI.blockCustomer}>{b.customer_name}</div> : null}
                    {b.meta ? <div style={UI.blockMeta}>{b.meta}</div> : null}
                  </div>
                  <div style={UI.blockStatus}>{b.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={UI.hoursTitle}>Öffnungszeiten (Mo–So)</div>
          <div style={UI.hoursCard}>
            <table style={UI.hoursTable}>
              <thead>
                <tr>
                  <th style={UI.th}>Tag</th>
                  <th style={UI.th}>Open</th>
                  <th style={UI.th}>Close</th>
                  <th style={UI.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h) => {
                  const open = Boolean(h.open_time && h.close_time);
                  return (
                    <tr key={h.weekday}>
                      <td style={UI.td}>{WEEKDAYS.find((w) => w.k === h.weekday)?.label}</td>
                      <td style={UI.td}>
                        <input
                          type="time"
                          value={h.open_time || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setHours((prev) =>
                              prev.map((x) => (x.weekday === h.weekday ? { ...x, open_time: v } : x))
                            );
                          }}
                          style={UI.time}
                        />
                      </td>
                      <td style={UI.td}>
                        <input
                          type="time"
                          value={h.close_time || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setHours((prev) =>
                              prev.map((x) => (x.weekday === h.weekday ? { ...x, close_time: v } : x))
                            );
                          }}
                          style={UI.time}
                        />
                      </td>
                      <td style={UI.td}>
                        <span style={UI.pill(open)}>{open ? "Open" : "Closed"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={saveBusinessHours} style={UI.button} disabled={hoursSaving}>
                {hoursSaving ? "Speichern..." : "Speichern"}
              </button>
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
