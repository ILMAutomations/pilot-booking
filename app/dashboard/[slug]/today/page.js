"use client";

import { useEffect, useState } from "react";
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
  shell: {
    maxWidth: 1050,
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 650,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  sub: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
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

  // Controls
  controlsRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
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
    marginTop: 12,
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
    borderRadius: 18,
    border: "1px solid rgba(35, 48, 68, 0.9)",
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
    background: "rgba(148, 163, 184, 0.10)",
  }),

  block: (top, height) => ({
    position: "absolute",
    left: 12,
    right: 12,
    top,
    height,
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
  },
  blockMeta: {
    fontSize: 12,
    color: "#93A4BF",
  },
};

export default function TodayPage() {
  const { slug } = useParams();
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [start, setStart] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [error, setError] = useState("");

  const DAY_START_MIN = 8 * 60;
  const DAY_END_MIN = 21 * 60;
  const PX_PER_MIN = 2;
  const timelineHeight = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN;

  useEffect(() => {
    fetch(`/api/s/${slug}/dashboard/today`)
      .then((r) => r.json())
      .then((data) => setRows(data.rows || []));

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
        setError(
          "Zeit ist bereits belegt. Bitte andere Uhrzeit wählen."
        );
        return;
      }

      if (err.code === "OUTSIDE_HOURS") {
        setError(
          "Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen."
        );
        return;
      }

      setError(err.error || "Create failed");
      return;
    }

    const updated = await fetch(`/api/s/${slug}/dashboard/today`).then((r) =>
      r.json()
    );
    setRows(updated.rows || []);
  }

  const blocks = rows
    .map((r) => {
      const startMin = minutesSinceMidnight(r.start_at);
      const endMin = minutesSinceMidnight(r.end_at);

      const top = (startMin - DAY_START_MIN) * PX_PER_MIN;
      const height = Math.max(28, (endMin - startMin) * PX_PER_MIN);

      return {
        ...r,
        top,
        height,
        startLabel: fmtTime(r.start_at),
      };
    })
    .filter((b) => b.top + b.height >= 0 && b.top <= timelineHeight);

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

            <button onClick={createAppointment} style={UI.button}>
              Create
            </button>
          </div>

          {error && <div style={UI.error}>{error}</div>}

          <div style={UI.grid}>
            {/* Hours column */}
            <div style={UI.hourCol(timelineHeight)}>
              {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }).map(
                (_, i) => {
                  const hour = 8 + i;
                  const top = (hour * 60 - DAY_START_MIN) * PX_PER_MIN;
                  return (
                    <div
                      key={hour}
                      style={{
                        ...UI.hourLabel,
                        top,
                      }}
                    >
                      {pad2(hour)}:00
                    </div>
                  );
                }
              )}
            </div>

            {/* Canvas */}
            <div style={UI.canvas(timelineHeight)}>
              {/* Hour lines */}
              {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }).map(
                (_, i) => {
                  const hour = 8 + i;
                  const top = (hour * 60 - DAY_START_MIN) * PX_PER_MIN;
                  return <div key={hour} style={UI.hourLine(top)} />;
                }
              )}

              {/* Blocks */}
              {blocks.map((b) => (
                <div key={b.id} style={UI.block(b.top, b.height)}>
                  <div>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name || "Service"}</div>
                  </div>
                  <div style={UI.blockMeta}>{b.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
