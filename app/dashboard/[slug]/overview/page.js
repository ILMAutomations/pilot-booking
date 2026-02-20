"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTimeBerlin(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // show Berlin local time without heavy libs (browser will use local tz; that's fine for pilot)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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
    marginBottom: 14,
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
    padding: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
  },
  dayCol: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.55)",
    padding: 10,
    minHeight: 220,
  },
  dayTitle: { fontSize: 12, color: "#93A4BF", marginBottom: 8 },
  appt: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    padding: 10,
    marginBottom: 8,
    boxShadow: "0 10px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  apptTime: { fontSize: 12, fontWeight: 800, color: "#E5E7EB" },
  apptSvc: { fontSize: 12, color: "#CBD5E1", marginTop: 2 },
  apptMeta: { fontSize: 11, color: "#93A4BF", marginTop: 6 },
  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(248, 113, 113, 0.45)",
    background: "rgba(127, 29, 29, 0.22)",
    color: "#FCA5A5",
    fontSize: 13,
  },
};

export default function Page({ params }) {
  const slug = params?.slug;

  const [days, setDays] = useState([]);
  const [error, setError] = useState("");

  async function loadWeek() {
    if (!slug) return;
    setError("");
    const res = await fetch(`/api/s/${slug}/dashboard/week`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Fehler beim Laden.");
      setDays([]);
      return;
    }
    setDays(Array.isArray(data.days) ? data.days : []);
  }

  useEffect(() => {
    loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const labels = useMemo(() => {
    // display label: "Mon 19.02" etc (simple)
    return (days || []).map((d) => {
      const iso = d.date; // YYYY-MM-DD
      const parts = String(iso).split("-");
      if (parts.length !== 3) return iso;
      const [y, m, day] = parts;
      return `${day}.${m}`;
    });
  }, [days]);

  if (!slug) return null;

  return (
    <div style={UI.page}>
      <div style={UI.shell}>
        <div style={UI.headerRow}>
          <div>
            <h2 style={UI.title}>Dashboard Overview</h2>
            <div style={UI.sub}>Salon: {slug}</div>
          </div>
          <div style={UI.badge}>Pilot</div>
        </div>

        <div style={UI.tabs}>
          <a href={`/dashboard/${slug}/today`} style={UI.tab(false)}>
            Today
          </a>
          <a href={`/dashboard/${slug}/overview`} style={UI.tab(true)}>
            Overview
          </a>
        </div>

        <div style={UI.card}>
          {error && <div style={UI.error}>{error}</div>}

          <div style={UI.grid}>
            {(days || []).map((d, idx) => (
              <div key={d.date || idx} style={UI.dayCol}>
                <div style={UI.dayTitle}>{labels[idx] || d.date}</div>

                {(d.rows || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: "#93A4BF" }}>Keine Termine</div>
                ) : (
                  (d.rows || []).map((r) => (
                    <div key={r.id} style={UI.appt}>
                      <div style={UI.apptTime}>{formatTimeBerlin(r.start_at)}</div>
                      <div style={UI.apptSvc}>{r.service_name || "Service"}</div>
                      <div style={UI.apptMeta}>{r.status}</div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
