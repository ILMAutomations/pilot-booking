"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const UI = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #070B14 0%, #0B1220 55%, #070B14 100%)",
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
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(6px)",
    padding: 18,
  },

  tabs: { display: "flex", gap: 8, marginBottom: 14 },
  tab: (active) => ({
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(35,48,68,0.9)",
    background: active ? "rgba(59,130,246,0.16)" : "rgba(2,6,23,0.35)",
    color: active ? "#DBEAFE" : "#CBD5E1",
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-block",
  }),

  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 10,
  },

  dayCol: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.55)",
    padding: 10,
    minHeight: 260,
    display: "flex",
    flexDirection: "column",
  },

  dayHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  dayTitle: { fontSize: 13, fontWeight: 700, margin: 0, color: "#E5E7EB" },
  daySub: { fontSize: 12, color: "#93A4BF" },

  empty: {
    fontSize: 12,
    color: "#93A4BF",
    marginTop: 8,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(2,6,23,0.4)",
    border: "1px solid rgba(255,255,255,0.04)",
  },

  apptCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.28)",
  },
  apptTime: { fontSize: 12, fontWeight: 800, color: "#E5E7EB" },
  apptService: { fontSize: 12, color: "#CBD5E1", marginTop: 4 },
  apptMeta: { fontSize: 12, color: "#93A4BF", marginTop: 6 },
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
    if (!res.ok || data?.error) {
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

  const todayHref = `/dashboard/${slug}/today`;
  const overviewHref = `/dashboard/${slug}/overview`;

  const weekCols = useMemo(() => {
    return (days || []).map((d) => {
      const rows = Array.isArray(d.rows) ? d.rows : [];
      return { date: d.date, rows };
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

        <div style={UI.card}>
          <div style={UI.tabs}>
            <a href={todayHref} style={UI.tab(false)}>
              Today
            </a>
            <a href={overviewHref} style={UI.tab(true)}>
              Overview
            </a>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(248, 113, 113, 0.45)",
                background: "rgba(127, 29, 29, 0.22)",
                color: "#FCA5A5",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div style={UI.weekGrid}>
            {weekCols.map((d, idx) => (
              <div key={idx} style={UI.dayCol}>
                <div style={UI.dayHeader}>
                  <p style={UI.dayTitle}>{d.date}</p>
                  <div style={UI.daySub}>{d.rows.length} Termine</div>
                </div>

                {d.rows.length === 0 ? (
                  <div style={UI.empty}>Keine Termine</div>
                ) : (
                  d.rows.map((r) => (
                    <div key={r.id} style={UI.apptCard}>
                      <div style={UI.apptTime}>{formatTime(r.start_at)}</div>
                      <div style={UI.apptService}>
                        {r.service_name || "Service"}
                      </div>
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
