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

function minutesFromHHMM(v) {
  if (!v) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(String(v));
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function weekdayLabelShort(weekday) {
  return ["", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][weekday] || String(weekday);
}

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
  inputStrong: {
    width: "100%",
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(99, 102, 241, 0.45)",
    background: "rgba(2, 6, 23, 0.75)",
    color: "#E5E7EB",
    outline: "none",
    boxShadow: "0 0 0 2px rgba(99,102,241,0.10)",
  },
  textarea: {
    width: "100%",
    minHeight: 80,
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
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  success: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(34, 197, 94, 0.35)",
    background: "rgba(22, 101, 52, 0.18)",
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
  timeLabel: (isHour) => ({
    position: "absolute",
    fontSize: isHour ? 12 : 11,
    fontWeight: isHour ? 800 : 600,
    color: isHour ? "#E5E7EB" : "rgba(229,231,235,0.55)",
    transform: "translateY(-50%)",
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
  line: (top, strong) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: strong ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
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
  blockTime: { fontWeight: 800, letterSpacing: "-0.01em", fontSize: 13, color: "#E5E7EB" },
  blockService: { fontSize: 13, color: "#CBD5E1" },
  blockMeta: { fontSize: 12, color: "#93A4BF" },
  blockSmall: { fontSize: 11, color: "rgba(203,213,225,0.75)" },

  sectionTitle: { fontSize: 14, fontWeight: 800, marginTop: 18, marginBottom: 10, color: "#E5E7EB" },

  hoursCard: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.45)",
    padding: 14,
  },
  hoursGrid: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 1fr 120px",
    gap: 10,
    alignItems: "center",
  },
  hoursHead: { fontSize: 12, color: "#93A4BF", fontWeight: 700 },
  timeInput: (disabled) => ({
    height: 36,
    width: "100%",
    borderRadius: 10,
    border: "1px solid rgba(35,48,68,0.9)",
    background: disabled ? "rgba(2,6,23,0.25)" : "rgba(2,6,23,0.55)",
    color: disabled ? "rgba(229,231,235,0.40)" : "#E5E7EB",
    padding: "0 10px",
    outline: "none",
  }),
  statusBtn: (open) => ({
    height: 34,
    borderRadius: 999,
    border: open ? "1px solid rgba(34,197,94,0.40)" : "1px solid rgba(148,163,184,0.35)",
    background: open ? "rgba(34,197,94,0.18)" : "rgba(2,6,23,0.25)",
    color: open ? "#86EFAC" : "#CBD5E1",
    fontWeight: 750,
    cursor: "pointer",
  }),
  hint: { marginTop: 10, fontSize: 12, color: "#93A4BF" },
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

  const [hours, setHours] = useState(
    Array.from({ length: 7 }).map((_, i) => ({
      weekday: i + 1,
      isOpen: false,
      open: "",
      close: "",
    }))
  );
  const [hoursError, setHoursError] = useState("");
  const [hoursSuccess, setHoursSuccess] = useState("");

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
    setError("");
    setTodayRows(Array.isArray(data.rows) ? data.rows : []);
    if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
    if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
  }

  async function loadBusinessHours() {
    if (!slug) return;
    setHoursError("");
    const res = await fetch(`/api/s/${slug}/business-hours`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const rows = Array.isArray(data?.rows) ? data.rows : [];

    const map = new Map();
    for (const r of rows) {
      map.set(Number(r.weekday), {
        open_time: String(r.open_time || ""),
        close_time: String(r.close_time || ""),
      });
    }

    setHours(
      Array.from({ length: 7 }).map((_, i) => {
        const weekday = i + 1;
        const v = map.get(weekday);
        const openT = v?.open_time ? String(v.open_time).slice(0, 5) : "";
        const closeT = v?.close_time ? String(v.close_time).slice(0, 5) : "";
        const isOpen = Boolean(openT && closeT);
        return { weekday, isOpen, open: openT, close: closeT };
      })
    );
  }

  useEffect(() => {
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

  async function createAppointment() {
    try {
      setError("");
      setSuccess("");

      if (!serviceId) return setError("Bitte Service auswählen.");
      if (!start) return setError("Bitte Startzeit auswählen.");

      const name = String(customerName || "").trim();
      if (!name) return setError("Kundenname ist Pflicht.");

      const svc = services.find((s) => s.id === serviceId);
      const duration = Number(svc?.duration_min || 0);
      if (!duration || duration <= 0) return setError("Service-Dauer fehlt. Bitte kurz melden.");

      const startISO = toISOFromDatetimeLocal(start);
      if (!startISO) return setError("Ungültige Startzeit.");

      const startDate = new Date(startISO);
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      const res = await fetch(`/api/s/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          customer_name: name,
          customer_phone: String(customerPhone || "").trim() || null,
          customer_email: String(customerEmail || "").trim() || null,
          internal_note: String(internalNote || "").trim() || null,
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

      setSuccess("Termin erstellt.");
      await loadToday();
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

  function toggleDay(weekday) {
    setHours((prev) =>
      prev.map((h) => {
        if (h.weekday !== weekday) return h;
        const nextOpen = !h.isOpen;
        // When opening, if empty -> set safe defaults
        if (nextOpen) {
          return { ...h, isOpen: true, open: h.open || "10:00", close: h.close || "18:00" };
        }
        // When closing, keep times locally but disable (send null on save)
        return { ...h, isOpen: false };
      })
    );
  }

  async function saveHours() {
    try {
      setHoursError("");
      setHoursSuccess("");

      // Validate only OPEN days; closed can be empty
      for (const h of hours) {
        if (!h.isOpen) continue;
        const o = minutesFromHHMM(h.open);
        const c = minutesFromHHMM(h.close);
        if (o == null || c == null || c <= o) {
          setHoursError(`Invalid open/close time for weekday ${h.weekday}`);
          return;
        }
      }

      const payload = {
        hours: hours.map((h) => ({
          weekday: h.weekday,
          open_time: h.isOpen ? h.open : null,
          close_time: h.isOpen ? h.close : null,
        })),
      };

      const res = await fetch(`/api/s/${slug}/business-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setHoursError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
        return;
      }

      setHoursSuccess("Gespeichert.");
      await loadBusinessHours(); // reload from DB so UI matches truth
      await loadToday(); // refresh display window if dependent
    } catch (e) {
      setHoursError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

  if (!slug) return null;

  const totalMinutes = displayEndMin - displayStartMin;
  const tickCount = Math.floor(totalMinutes / 15) + 1;

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
                    {s.name} – ({Number(s.duration_min || 0)} Min)
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={UI.inputStrong}
              />

              <button onClick={createAppointment} style={UI.button}>
                Create
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
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
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="E-Mail (optional)"
                style={UI.input}
              />
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Interne Notiz (nur intern sichtbar)"
                style={UI.textarea}
              />
            </div>

            {success && <div style={UI.success}>{success}</div>}
            {error && <div style={UI.error}>{error}</div>}
          </div>

          <div style={UI.grid}>
            {/* LEFT TIME AXIS: every 15 minutes */}
            <div style={UI.hourCol(timelineHeight)}>
              {Array.from({ length: tickCount }).map((_, i) => {
                const minute = displayStartMin + i * 15;
                const isHour = minute % 60 === 0;
                const hh = Math.floor(minute / 60);
                const mm = minute % 60;
                const top = (minute - displayStartMin) * PX_PER_MIN;
                return (
                  <div key={i} style={{ ...UI.timeLabel(isHour), top }}>
                    {pad2(hh)}:{pad2(mm)}
                  </div>
                );
              })}
            </div>

            {/* CANVAS */}
            <div style={UI.canvas(timelineHeight)}>
              {Array.from({ length: tickCount }).map((_, i) => {
                const top = i * 15 * PX_PER_MIN;
                const minute = displayStartMin + i * 15;
                const strong = minute % 60 === 0;
                return <div key={i} style={UI.line(top, strong)} />;
              })}

              {blocks.map((b) => (
                <div key={b.id} style={UI.block(b.top, b.height)}>
                  <div>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name || "Service"}</div>
                    <div style={UI.blockSmall}>{b.customer_name || ""}</div>
                    <div style={UI.blockSmall}>
                      {b.customer_phone ? `Tel: ${b.customer_phone}` : ""}
                      {b.customer_email ? ` · Mail: ${b.customer_email}` : ""}
                      {b.internal_note ? ` · Notiz: ${b.internal_note}` : ""}
                    </div>
                  </div>
                  <div style={UI.blockMeta}>{b.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BUSINESS HOURS */}
          <div style={UI.sectionTitle}>Öffnungszeiten (Mo–So)</div>
          <div style={UI.hoursCard}>
            <div style={UI.hoursGrid}>
              <div style={UI.hoursHead}>Tag</div>
              <div style={UI.hoursHead}>Open</div>
              <div style={UI.hoursHead}>Close</div>
              <div style={UI.hoursHead}>Status</div>

              {hours.map((h) => {
                const disabled = !h.isOpen;
                return (
                  <div key={h.weekday} style={{ display: "contents" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#E5E7EB" }}>
                      {weekdayLabelShort(h.weekday)}
                    </div>

                    <input
                      type="time"
                      value={disabled ? "" : h.open}
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((x) => (x.weekday === h.weekday ? { ...x, open: e.target.value } : x))
                        )
                      }
                      disabled={disabled}
                      style={UI.timeInput(disabled)}
                    />

                    <input
                      type="time"
                      value={disabled ? "" : h.close}
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((x) => (x.weekday === h.weekday ? { ...x, close: e.target.value } : x))
                        )
                      }
                      disabled={disabled}
                      style={UI.timeInput(disabled)}
                    />

                    <button type="button" onClick={() => toggleDay(h.weekday)} style={UI.statusBtn(h.isOpen)}>
                      {h.isOpen ? "Open" : "Closed"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={saveHours} style={UI.button}>
                Speichern
              </button>
            </div>

            {hoursSuccess && <div style={UI.success}>{hoursSuccess}</div>}
            {hoursError && <div style={UI.error}>{hoursError}</div>}

            <div style={UI.hint}>
              Closed = leere Zeiten. Buchungen außerhalb werden serverseitig blockiert.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
