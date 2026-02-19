"use client";

import { useEffect, useMemo, useState } from "react";

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
    maxWidth: 1100,
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
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
  controlsCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.6)",
    padding: 14,
    marginBottom: 12,
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
    zIndex: 1,
  }),
  hourLine: (top) => ({
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height: 1,
    background: "rgba(255,255,255,0.08)",
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
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toIsoFromDatetimeLocal(val) {
  // val like "2026-02-19T13:00"
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function minutesFromISO(iso) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function DashboardTodayPage({ params }) {
  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");
  const [error, setError] = useState("");

  const [rows, setRows] = useState([]);
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  const PX_PER_MIN = 2; // keep readable at 100% zoom

  const timelineHeight = Math.max(
    480,
    (displayEndMin - displayStartMin) * PX_PER_MIN
  );

  // ---- Fetch services (robust to multiple shapes) ----
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setError("");

    (async () => {
      try {
        const res = await fetch(`/api/s/${slug}/services`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        // Accept:
        // { services: [...] }  OR  { slug, services: [...] }  OR  [...] (fallback)
        const list =
          (data && Array.isArray(data.services) && data.services) ||
          (Array.isArray(data) && data) ||
          [];

        setServices(list);

        // Keep selection valid
        if (list.length && !list.find((s) => s.id === serviceId)) {
          setServiceId("");
        }
      } catch (e) {
        if (cancelled) return;
        setServices([]);
        setError(e?.message || String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ---- Fetch today dashboard ----
  async function refreshToday() {
    if (!slug) return;

    const res = await fetch(`/api/s/${slug}/dashboard/today`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || `Failed to load (${res.status})`);
      return;
    }

    setError("");

    setRows(Array.isArray(data.rows) ? data.rows : []);
    if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
    if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
  }

  useEffect(() => {
    refreshToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ---- Create appointment ----
  async function createAppointment() {
    setError("");

    if (!slug) return;
    if (!serviceId) {
      setError("Bitte Service auswählen.");
      return;
    }

    const startIso = toIsoFromDatetimeLocal(start);
    if (!startIso) {
      setError("Bitte Startzeit wählen.");
      return;
    }

    // Use duration from selected service (UI) to compute end, server will also validate
    const svc = services.find((s) => s.id === serviceId);
    const dur = Number(svc?.duration_min || 0);
    if (!dur) {
      setError("Service-Dauer fehlt. Bitte anderen Service wählen.");
      return;
    }

    const endIso = new Date(new Date(startIso).getTime() + dur * 60_000).toISOString();

    try {
      const res = await fetch(`/api/s/${slug}/appointments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          start_at: startIso,
          end_at: endIso,
          status: "confirmed",
          kind: "booking",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // handle overlap / outside hours nicely if your API returns these
        const msg = data?.error || `Fehler (${res.status})`;
        setError(msg);
        return;
      }

      setStart("");
      await refreshToday();
    } catch (e) {
      setError(e?.message || String(e));
    }
  }

  // ---- Build blocks for timeline ----
  const blocks = useMemo(() => {
    const dayStart = displayStartMin;
    const dayEnd = displayEndMin;

    return (rows || [])
      .map((r) => {
        const sMin = minutesFromISO(r.start_at);
        const eMin = minutesFromISO(r.end_at);
        const top = (sMin - dayStart) * PX_PER_MIN;
        const height = Math.max(26, (eMin - sMin) * PX_PER_MIN);

        // only render if within display window (soft clamp)
        const clampedTop = clamp(top, -200, (dayEnd - dayStart) * PX_PER_MIN + 200);

        const startLabel = `${pad2(Math.floor(sMin / 60))}:${pad2(sMin % 60)}`;

        return {
          id: r.id,
          top: clampedTop,
          height,
          startLabel,
          service_name: r.service_name,
          status: r.status,
        };
      })
      .sort((a, b) => a.top - b.top);
  }, [rows, displayStartMin, displayEndMin]);

  const hourMarks = useMemo(() => {
    const startHour = Math.floor(displayStartMin / 60);
    const endHour = Math.ceil(displayEndMin / 60);
    const arr = [];
    for (let h = startHour; h <= endHour; h++) arr.push(h);
    return arr;
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
          {/* Sticky controls */}
          <div
            style={{
              ...UI.controlsCard,
              position: "sticky",
              top: 16,
              zIndex: 50,
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={UI.controlsRow}>
              {/* IMPORTANT: wrapper z-index so native dropdown is clickable */}
              <div style={{ position: "relative", zIndex: 60 }}>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  style={{ ...UI.input, appearance: "auto" }}
                >
                  <option value="">Service wählen</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

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

          {/* Timeline */}
          <div style={UI.grid}>
            {/* Hours column */}
            <div style={UI.hourCol(timelineHeight)}>
              {hourMarks.map((hour) => {
                const top = (hour * 60 - displayStartMin) * PX_PER_MIN;
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
              })}
            </div>

            {/* Canvas */}
            <div style={UI.canvas(timelineHeight)}>
              {/* Hour lines */}
              {hourMarks.map((hour) => {
                const top = (hour * 60 - displayStartMin) * PX_PER_MIN;
                return <div key={hour} style={UI.hourLine(top)} />;
              })}

              {/* Blocks */}
              {blocks.map((b) => (
                <div key={b.id} style={UI.block(b.top, b.height)}>
                  <div>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name || "Service"}</div>
                  </div>
                  <div style={UI.blockMeta}>
                    <div>{b.status}</div>
                    <div />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* hidden refresh hook (optional) */}
      </div>
    </div>
  );
}
