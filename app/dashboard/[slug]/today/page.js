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

function fmtTimeFromMin(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

const WEEKDAY_LABELS = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  7: "So",
};

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

  // 3 rows: row1 (service + datetime + button), row2 (name + phone), row3 (email + note)
  controlsRow1: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto",
    gap: 10,
    alignItems: "center",
  },
  controlsRow2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 10,
  },
  controlsRow3: {
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
    minHeight: 86,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
    resize: "vertical",
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#93A4BF",
  },
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
  success: {
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
    gridTemplateColumns: "92px 1fr",
    gap: 12,
    alignItems: "start",
    marginTop: 12,
  },
  hourCol: (h) => ({ position: "relative", height: h, userSelect: "none", zIndex: 1 }),

  // 15-min labels
  timeLabel: (isHour) => ({
    position: "absolute",
    transform: "translateY(-50%)",
    fontSize: isHour ? 12 : 11,
    fontWeight: isHour ? 800 : 600,
    color: isHour ? "#E5E7EB" : "#93A4BF",
    opacity: isHour ? 0.9 : 0.55,
    lineHeight: 1,
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

  // hour line + 15-min line
  lineHour: (top) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: "rgba(255,255,255,0.10)",
  }),
  lineQuarter: (top) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: "rgba(255,255,255,0.06)",
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
  blockService: { fontSize: 13, color: "#CBD5E1" },
  blockCustomer: { fontSize: 12, color: "#E5E7EB", opacity: 0.92, marginTop: 2 },
  blockMeta: { fontSize: 11, color: "#93A4BF" },

  // Business Hours
  hoursCard: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.45)",
    padding: 14,
  },
  hoursTitle: { fontSize: 13, fontWeight: 800, color: "#E5E7EB", marginBottom: 10 },
  hoursTable: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, color: "#93A4BF", padding: "8px 6px" },
  td: { padding: "8px 6px", borderTop: "1px solid rgba(255,255,255,0.06)" },
  chipOpen: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid rgba(34, 197, 94, 0.25)",
    background: "rgba(20, 83, 45, 0.25)",
    color: "#86EFAC",
  },
  chipClosed: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid rgba(148, 163, 184, 0.20)",
    background: "rgba(2, 6, 23, 0.35)",
    color: "#93A4BF",
  },
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
  const [success, setSuccess] = useState("");

  const [todayRows, setTodayRows] = useState([]);
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  const [hours, setHours] = useState([]); // [{weekday, open_time, close_time}]
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursMsg, setHoursMsg] = useState("");

  const PX_PER_MIN = 2; // DO NOT TOUCH (grid math uses this)

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
    const res = await fetch(`/api/s/${slug}/business-hours`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const arr = Array.isArray(data.hours) ? data.hours : Array.isArray(data.rows) ? data.rows : [];
    setHours(arr);
  }

  useEffect(() => {
    setError("");
    setSuccess("");
    setHoursMsg("");
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

        const metaParts = [];
        if (r.customer_phone) metaParts.push(`Tel: ${r.customer_phone}`);
        if (r.customer_email) metaParts.push(`Mail: ${r.customer_email}`);
        if (r.internal_note) metaParts.push(`Notiz: ${r.internal_note}`);

        return {
          id: r.id,
          top,
          height,
          startLabel: label,
          service_name: r.service_name,
          customer_name: r.customer_name,
          meta: metaParts.join(" · "),
          status: r.status,
        };
      })
      .filter(Boolean)
      .filter((b) => b.top + b.height > 0 && b.top < timelineHeight);
  }, [todayRows, displayStartMin, timelineHeight]);

  async function createAppointment() {
    try {
      setError("");
      setSuccess("");

      if (!serviceId) {
        setError("Bitte Service auswählen.");
        return;
      }
      if (!start) {
        setError("Bitte Startzeit auswählen.");
        return;
      }
      if (!customerName.trim()) {
        setError("Bitte Kundennamen eingeben.");
        return;
      }

      const svc = services.find((s) => s.id === serviceId);
      const duration = Number(svc?.duration_min || 0);
      if (!duration || duration <= 0) {
        setError("Service-Dauer fehlt. Bitte kurz melden.");
        return;
      }

      const startISO = toISOFromDatetimeLocal(start);
      if (!startISO) {
        setError("Ungültige Startzeit.");
        return;
      }

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

      if (res.status === 409) {
        setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
        return;
      }

      if (!res.ok) {
        if (data?.code === "OUTSIDE_HOURS") {
          setError("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
          return;
        }
        if (String(data?.error || "").includes("no_overlapping_appointments")) {
          setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
          return;
        }
        setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
        return;
      }

      setSuccess("Termin erstellt.");
      await loadToday();
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

  async function saveHours() {
    try {
      setHoursMsg("");
      setError("");
      setSuccess("");
      setHoursSaving(true);

      if (!Array.isArray(hours) || hours.length < 7) {
        setHoursMsg("Missing hours[].");
        return;
      }

      const payload = hours.map((h) => ({
        weekday: Number(h.weekday),
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
        setHoursMsg(data?.error || "Server Error");
        return;
      }

      setHoursMsg("Gespeichert.");
      await loadHours();
    } catch (e) {
      setHoursMsg("Server Error");
    } finally {
      setHoursSaving(false);
    }
  }

  const timeLabels = useMemo(() => {
    // Show every 15 minutes between displayStartMin and displayEndMin (inclusive)
    const labels = [];
    const startMin = Math.floor(displayStartMin / 15) * 15;
    const endMin = Math.ceil(displayEndMin / 15) * 15;

    for (let m = startMin; m <= endMin; m += 15) {
      const isHour = m % 60 === 0;
      const top = (m - displayStartMin) * PX_PER_MIN;
      labels.push({ key: m, top, text: fmtTimeFromMin(m), isHour });
    }
    return labels;
  }, [displayStartMin, displayEndMin]);

  const gridLines = useMemo(() => {
    // 15-min lines across the canvas
    const lines = [];
    const startMin = Math.floor(displayStartMin / 15) * 15;
    const endMin = Math.ceil(displayEndMin / 15) * 15;

    for (let m = startMin; m <= endMin; m += 15) {
      const top = (m - displayStartMin) * PX_PER_MIN;
      const isHour = m % 60 === 0;
      lines.push({ key: m, top, isHour });
    }
    return lines;
  }, [displayStartMin, displayEndMin]);

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
            <div style={UI.controlsRow1}>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={{ ...UI.input, position: "relative", zIndex: 50 }}
              >
                <option value="">Service wählen</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} – ({Number(s.duration_min || 0)} Min)
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

            <div style={UI.controlsRow2}>
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

            <div style={UI.controlsRow3}>
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
            {success && <div style={UI.success}>{success}</div>}
          </div>

          <div style={UI.grid}>
            <div style={UI.hourCol(timelineHeight)}>
              {timeLabels.map((t) => (
                <div key={t.key} style={{ ...UI.timeLabel(t.isHour), top: t.top }}>
                  {t.text}
                </div>
              ))}
            </div>

            <div style={UI.canvas(timelineHeight)}>
              {gridLines.map((l) => (
                <div key={l.key} style={l.isHour ? UI.lineHour(l.top) : UI.lineQuarter(l.top)} />
              ))}

              {blocks.map((b) => (
                <div key={b.id} style={UI.block(b.top, b.height)}>
                  <div>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name || "Service"}</div>
                    {b.customer_name && <div style={UI.blockCustomer}>{b.customer_name}</div>}
                    {b.meta && <div style={UI.blockMeta}>{b.meta}</div>}
                  </div>
                  {b.status && <div style={UI.blockMeta}>{b.status}</div>}
                </div>
              ))}
            </div>
          </div>

          <div style={UI.hoursCard}>
            <div style={UI.hoursTitle}>Öffnungszeiten (Mo–So)</div>

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
                {(hours || [])
                  .slice()
                  .sort((a, b) => Number(a.weekday) - Number(b.weekday))
                  .map((h) => {
                    const isOpen = Boolean(h.open_time && h.close_time);
                    return (
                      <tr key={h.weekday}>
                        <td style={UI.td}>{WEEKDAY_LABELS[Number(h.weekday)] || h.weekday}</td>
                        <td style={UI.td}>
                          <input
                            type="time"
                            value={h.open_time || ""}
                            onChange={(e) => {
                              const v = e.target.value || null;
                              setHours((prev) =>
                                prev.map((x) => (x.weekday === h.weekday ? { ...x, open_time: v } : x))
                              );
                            }}
                            style={{ ...UI.input, height: 34 }}
                          />
                        </td>
                        <td style={UI.td}>
                          <input
                            type="time"
                            value={h.close_time || ""}
                            onChange={(e) => {
                              const v = e.target.value || null;
                              setHours((prev) =>
                                prev.map((x) =>
                                  x.weekday === h.weekday ? { ...x, close_time: v } : x
                                )
                              );
                            }}
                            style={{ ...UI.input, height: 34 }}
                          />
                        </td>
                        <td style={UI.td}>
                          {isOpen ? <span style={UI.chipOpen}>Open</span> : <span style={UI.chipClosed}>Closed</span>}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <button onClick={saveHours} style={UI.button} disabled={hoursSaving}>
                {hoursSaving ? "Speichern..." : "Speichern"}
              </button>
              <div style={UI.hint}>
                Leere Zeiten = geschlossen. Buchungen außerhalb werden serverseitig blockiert.
              </div>
            </div>

            {hoursMsg && <div style={{ ...UI.success, marginTop: 10 }}>{hoursMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
