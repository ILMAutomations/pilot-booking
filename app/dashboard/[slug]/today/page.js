"use client";

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
    marginBottom: 12,
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

  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  tab: (active) => ({
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: active ? "rgba(59, 130, 246, 0.16)" : "rgba(2, 6, 23, 0.45)",
    color: active ? "#DBEAFE" : "#CBD5E1",
    fontSize: 13,
    fontWeight: 650,
  }),

  card: {
    borderRadius: 18,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(11, 18, 32, 0.72)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(6px)",
    padding: 18,
  },

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
  hourLine: (top) => ({ position: "absolute", left: 0, right: 0, top, height: 1, background: "rgba(255,255,255,0.08)" }),

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
};

export default function Page({ params }) {
  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");
  const [error, setError] = useState("");

  const [todayRows, setTodayRows] = useState([]);
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  const PX_PER_MIN = 2; // timeline scale

  const timelineHeight = useMemo(() => {
    return Math.max(300, (displayEndMin - displayStartMin) * PX_PER_MIN);
  }, [displayStartMin, displayEndMin]);

  async function loadServices() {
    if (!slug) return;
    setError("");
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
    if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
    if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
  }

  useEffect(() => {
    loadServices();
    loadToday();
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
        };
      })
      .filter(Boolean)
      .filter((b) => b.top + b.height > 0 && b.top < timelineHeight);
  }, [todayRows, displayStartMin, timelineHeight]);

  async function createAppointment() {
    try {
      setError("");

      if (!serviceId) {
        setError("Bitte Service auswählen.");
        return;
      }
      if (!start) {
        setError("Bitte Startzeit auswählen.");
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
        setError(data?.error || "Fehler beim Erstellen.");
        return;
      }

      await loadToday();
    } catch (e) {
      setError(e?.message || String(e));
    }
  }

  if (!slug) return null;

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

        <div style={UI.tabs}>
          <a href={`/dashboard/${slug}/today`} style={UI.tab(true)}>
            Today
          </a>
          <a href={`/dashboard/${slug}/overview`} style={UI.tab(false)}>
            Overview
          </a>
        </div>

        <div style={UI.card}>
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

            {error && <div style={UI.error}>{error}</div>}
          </div>

          <div style={UI.grid}>
            <div style={UI.hourCol(timelineHeight)}>
              {Array.from({ length: hourCount }).map((_, i) => {
                const minute = displayStartMin + i * 60;
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
              {Array.from({ length: hourCount }).map((_, i) => {
                const top = i * 60 * PX_PER_MIN;
                return <div key={i} style={UI.hourLine(top)} />;
              })}

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
