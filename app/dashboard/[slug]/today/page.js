"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function minutesSinceMidnight(date) {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
}
function fmtTime(iso) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const UI = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #060A12 0%, #0B1220 55%, #060A12 100%)",
    color: "#E5E7EB",
    padding: "48px 20px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  shell: { maxWidth: 1100, margin: "0 auto" },

  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: 680, letterSpacing: "-0.02em", margin: 0 },
  sub: { fontSize: 13, color: "#9CA3AF", marginTop: 6 },

  badge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15, 23, 42, 0.55)",
    color: "#C7D2FE",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    height: "fit-content",
  },

  card: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(11, 18, 32, 0.72)",
    boxShadow:
      "0 14px 34px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(6px)",
    padding: 22,
  },

  // Sticky controls
  controlsCard: {
    position: "sticky",
    top: 16,
    zIndex: 10,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.70)",
    padding: 14,
    marginBottom: 14,
    backdropFilter: "blur(8px)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.25)",
  },
  controlsRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto",
    gap: 10,
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
  },
  button: {
    height: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid rgba(59, 130, 246, 0.45)",
    background: "rgba(59, 130, 246, 0.18)",
    color: "#DBEAFE",
    fontWeight: 650,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248, 113, 113, 0.40)",
    background: "rgba(127, 29, 29, 0.20)",
    color: "#FCA5A5",
    fontSize: 13,
  },

  grid: { display: "grid", gridTemplateColumns: "84px 1fr", gap: 12, alignItems: "start" },
  hourCol: (h) => ({ position: "relative", height: h, userSelect: "none" }),
  hourLabel: {
    position: "absolute",
    fontSize: 12,
    color: "#94A3B8",
    transform: "translateY(-50%)",
  },

  timelineCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.45)",
    padding: 14,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.03), 0 10px 24px rgba(0,0,0,0.35)",
  },
  canvas: (h) => ({
    position: "relative",
    height: h,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.72) 0%, rgba(11,18,32,0.72) 100%)",
    overflow: "hidden",
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
    background:
      "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    padding: 12,
    boxShadow:
      "0 10px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }),
  blockTime: { fontWeight: 750, letterSpacing: "-0.01em", fontSize: 13, color: "#E5E7EB" },
  blockService: { fontSize: 13, color: "#CBD5E1", marginTop: 2 },
  blockMetaRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 },
  blockMeta: { fontSize: 12, color: "#93A4BF" },
  statusText: (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "confirmed") return { color: "rgba(134, 239, 172, 0.90)" };
    if (s === "cancelled") return { color: "rgba(252, 165, 165, 0.90)" };
    if (s === "no_show") return { color: "rgba(248, 113, 113, 0.95)" };
    if (s === "new") return { color: "rgba(187, 247, 208, 0.95)" };
    return { color: "#93A4BF" };
  },
};

export default function TodayPage() {
  const { slug } = useParams();
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [start, setStart] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [error, setError] = useState("");

  // Dynamic display window from API (fallback 08–21)
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  // Fit on screen: px/min adapts to range (display only)
  const rangeMin = Math.max(1, displayEndMin - displayStartMin);
  const PX_PER_MIN = useMemo(() => {
    // target canvas around ~820px height on desktop
    const targetPx = 820;
    const v = targetPx / rangeMin;
    return Math.min(2.0, Math.max(1.1, v));
  }, [rangeMin]);

  const timelineHeight = rangeMin * PX_PER_MIN;

  useEffect(() => {
    fetch(`/api/s/${slug}/dashboard/today`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
        if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
      });

    fetch(`/api/s/${slug}/services`)
      .then((r) => r.json())
      .then((data) => setServices(data.services || []));
  }, [slug]);

  async function createAppointment() {
    setError("");
    if (!serviceId || !start) return;

    const res = await fetch(`/api/s/${slug}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        start_at: new Date(start).toISOString(),
        source: "dashboard",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
        return;
      }
      if (err.code === "OUTSIDE_HOURS") {
        setError("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
        return;
      }
      setError(err.error || "Create failed");
      return;
    }

    const updated = await fetch(`/api/s/${slug}/dashboard/today`).then((r) => r.json());
    setRows(updated.rows || []);
  }

  const serviceNameById = useMemo(() => {
    const m = new Map();
    (services || []).forEach((s) => m.set(s.id, s.name));
    return m;
  }, [services]);

  const blocks = rows
    .map((r) => {
      const startMin = minutesSinceMidnight(r.start_at);
      const endMin = minutesSinceMidnight(r.end_at);
      const top = (startMin - displayStartMin) * PX_PER_MIN;
      const height = Math.max(34, (endMin - startMin) * PX_PER_MIN);

      return {
        ...r,
        top,
        height,
        startLabel: fmtTime(r.start_at),
        serviceLabel: r.service_name || serviceNameById.get(r.service_id) || "Service",
      };
    })
    .filter((b) => b.top + b.height >= 0 && b.top <= timelineHeight);

  const hourStart = Math.ceil(displayStartMin / 60);
  const hourEnd = Math.floor(displayEndMin / 60);

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
          <div style={UI.controlsCard}>
            <div style={UI.controlsRow}>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={UI.input}>
                <option value="">Service wählen</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={UI.input} />

              <button onClick={createAppointment} style={UI.button}>
                Create
              </button>
            </div>

            {error && <div style={UI.error}>{error}</div>}
          </div>

          <div style={UI.grid}>
            <div style={UI.hourCol(timelineHeight)}>
              {Array.from({ length: Math.max(0, hourEnd - hourStart + 1) }).map((_, i) => {
                const hour = hourStart + i;
                const top = (hour * 60 - displayStartMin) * PX_PER_MIN;
                return (
                  <div key={hour} style={{ ...UI.hourLabel, top }}>
                    {pad2(hour)}:00
                  </div>
                );
              })}
            </div>

            <div style={UI.timelineCard}>
              <div style={UI.canvas(timelineHeight)}>
                {Array.from({ length: Math.max(0, hourEnd - hourStart + 1) }).map((_, i) => {
                  const hour = hourStart + i;
                  const top = (hour * 60 - displayStartMin) * PX_PER_MIN;
                  return <div key={hour} style={UI.hourLine(top)} />;
                })}

                {blocks.map((b) => (
                  <div key={b.id} style={UI.block(b.top, b.height)}>
                    <div>
                      <div style={UI.blockTime}>{b.startLabel}</div>
                      <div style={UI.blockService}>{b.serviceLabel}</div>
                    </div>
                    <div style={UI.blockMetaRow}>
                      <div style={{ ...UI.blockMeta, ...UI.statusText(b.status) }}>{b.status}</div>
                      <div style={UI.blockMeta}>dashboard</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 6 }} />
        </div>
      </div>
    </div>
  );
}
