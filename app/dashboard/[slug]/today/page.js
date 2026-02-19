"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 650,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  sub: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 6,
  },
  badge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #233044",
    background: "rgba(17, 24, 39, 0.55)",
    color: "#C7D2FE",
    height: "fit-content",
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

  // Controls
  controlsWrap: {
    position: "sticky",
    top: 16,
    zIndex: 10,
    borderRadius: 18,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(11, 18, 32, 0.86)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    padding: 14,
    marginBottom: 14,
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

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248, 113, 113, 0.45)",
    background: "rgba(127, 29, 29, 0.22)",
    color: "#FCA5A5",
    fontSize: 13,
  },

  // Timeline layout
  grid: {
    display: "grid",
    gridTemplateColumns: "88px 1fr",
    gap: 12,
    alignItems: "start",
    marginTop: 10,
  },
  hourCol: (h) => ({
    position: "relative",
    height: h,
    userSelect: "none",
  }),
  hourLabel: {
    position: "absolute",
    fontSize: 12,
    color: "#93A4BF",
    transform: "translateY(-50%)",
  },

  canvas: (h) => ({
    position: "relative",
    height: h,
    borderRadius: 20,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.72) 0%, rgba(11,18,32,0.72) 100%)",
    overflow: "hidden",
    padding: 10,
  }),
  hourLine: (top) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: "rgba(148, 163, 184, 0.12)",
  }),

  block: (top, height) => ({
    position: "absolute",
    left: 12,
    right: 12,
    top,
    height: Math.max(44, height),
    borderRadius: 16,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background:
      "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    padding: 12,
    boxShadow:
      "0 10px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }),
  blockTime: {
    fontWeight: 700,
    letterSpacing: "-0.01em",
    fontSize: 13,
    color: "#E5E7EB",
  },
  blockService: {
    fontSize: 13,
    color: "#CBD5E1",
    marginTop: 2,
  },
  blockMeta: {
    fontSize: 12,
    color: "#93A4BF",
    marginTop: 8,
    textTransform: "none",
  },
};

export default function DashboardToday({ params }) {
  const slug = params.slug;

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [today, setToday] = useState({ today_count: 0, rows: [] });
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  const PX_PER_MIN = 2;

  const timelineHeight = useMemo(() => {
    return Math.max(240, (displayEndMin - displayStartMin) * PX_PER_MIN);
  }, [displayStartMin, displayEndMin]);

  async function loadServices() {
    const res = await fetch(`/api/s/${slug}/services`);
    const data = await res.json();
    setServices(Array.isArray(data.services) ? data.services : []);
  }

  async function loadToday() {
    const res = await fetch(`/api/s/${slug}/dashboard/today`);
    const data = await res.json();

    setToday({
      today_count: data.today_count || 0,
      rows: Array.isArray(data.rows) ? data.rows : [],
    });

    // Optional dynamic display window coming from API:
    // display_start_min / display_end_min (numbers)
    if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
    if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
  }

  useEffect(() => {
    loadServices();
    loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const blocks = useMemo(() => {
    const rows = today.rows || [];
    return rows
      .map((r) => {
        const s = new Date(r.start_at);
        const e = new Date(r.end_at);

        const startMin = s.getHours() * 60 + s.getMinutes();
        const endMin = e.getHours() * 60 + e.getMinutes();

        const top = (startMin - displayStartMin) * PX_PER_MIN;
        const height = (endMin - startMin) * PX_PER_MIN;

        const startLabel = `${pad2(s.getHours())}:${pad2(s.getMinutes())}`;
        const serviceName = r.service_name || "Service";
        const status = r.status || "";

        return {
          id: r.id,
          top,
          height,
          startLabel,
          service_name: serviceName,
          status,
        };
      })
      .filter((b) => b.top + b.height > -40 && b.top < timelineHeight + 40)
      .sort((a, b) => a.top - b.top);
  }, [today, displayStartMin, PX_PER_MIN, timelineHeight]);

  async function createAppointment() {
    setError("");

    if (!serviceId) {
      setError("Bitte Service auswählen.");
      return;
    }
    if (!start) {
      setError("Bitte Startzeit auswählen.");
      return;
    }

    setLoading(true);
    try {
      const startIso = new Date(start).toISOString();

      const res = await fetch(`/api/s/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          start_at: startIso,
          source: "dashboard",
        }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          `Create failed (${res.status}).`;
        setError(msg);
        return;
      }

      await loadToday();
    } catch (e) {
      setError(e?.message || "Create failed.");
    } finally {
      setLoading(false);
    }
  }

  const hourCount = Math.floor((displayEndMin - displayStartMin) / 60) + 1;

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
          <div style={UI.controlsWrap}>
            <div style={UI.controlsRow}>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={UI.input}
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

              <button
                onClick={createAppointment}
                disabled={loading}
                style={{
                  ...UI.button,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>

            {error && <div style={UI.error}>{error}</div>}
          </div>

          <div style={UI.grid}>
            {/* Hours column */}
            <div style={UI.hourCol(timelineHeight)}>
              {Array.from({ length: hourCount }).map((_, i) => {
                const hourMin = displayStartMin + i * 60;
                const hour = Math.floor(hourMin / 60);
                const top = (hourMin - displayStartMin) * PX_PER_MIN;

                return (
                  <div
                    key={hourMin}
                    style={{
                      ...UI.hourLabel,
                      top,
                    }}
                  >
                    {pad2(hour)}:00
                  </div>
                );
              })}
            </div>

            {/* Canvas */}
            <div style={UI.canvas(timelineHeight)}>
              {/* Hour lines */}
              {Array.from({ length: hourCount }).map((_, i) => {
                const hourMin = displayStartMin + i * 60;
                const top = (hourMin - displayStartMin) * PX_PER_MIN;
                return <div key={hourMin} style={UI.hourLine(top)} />;
              })}

              {/* Blocks */}
              {blocks.map((b) => (
                <div key={b.id} style={UI.block(b.top, b.height)}>
                  <div>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name}</div>
                  </div>
                  <div style={UI.blockMeta}>{b.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tiny footer */}
        <div style={{ marginTop: 14, fontSize: 12, color: "#64748B" }}>
          Today: {today.today_count} appointment(s)
        </div>
      </div>
    </div>
  );
}
