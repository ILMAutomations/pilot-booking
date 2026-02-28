"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDayTitle(isoDate) {
  return isoDate;
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
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)",
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

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 12,
    alignItems: "stretch",
    marginTop: 10,
  },

  dayCard: {
    borderRadius: 16,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.35)",
    padding: 12,
    minHeight: 180,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  dayHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  dayTitle: { fontSize: 12, fontWeight: 750, color: "#E5E7EB" },
  dayCount: { fontSize: 12, color: "#93A4BF" },

  item: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  itemTime: { fontSize: 12, fontWeight: 800, color: "#E5E7EB" },
  itemService: { fontSize: 12, color: "#CBD5E1" },
  itemMeta: { fontSize: 11, color: "#93A4BF" },

  empty: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15, 23, 42, 0.45)",
    padding: 10,
    color: "#93A4BF",
    fontSize: 12,
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
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      setDays([]);
      return;
    }
    setDays(Array.isArray(data.days) ? data.days : []);
  }

  useEffect(() => {
    loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const safeDays = useMemo(() => (Array.isArray(days) ? days : []), [days]);

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
          <div style={UI.tabsRow}>
            <Link href={`/dashboard/${slug}/today`} style={UI.tab(false)}>
              Today
            </Link>
            <Link href={`/dashboard/${slug}/overview`} style={UI.tab(true)}>
              Overview
            </Link>
          </div>

          {error && <div style={UI.error}>{error}</div>}

          <div style={UI.grid}>
            {safeDays.map((d) => {
              const rowsRaw = Array.isArray(d.rows) ? d.rows : [];
              // ✅ keep it clean: sort by start_at
              const rows = [...rowsRaw].sort((a, b) => {
                const ta = new Date(a?.start_at || 0).getTime();
                const tb = new Date(b?.start_at || 0).getTime();
                return ta - tb;
              });

              return (
                <div key={d.date} style={UI.dayCard}>
                  <div style={UI.dayHeader}>
                    <div style={UI.dayTitle}>{formatDayTitle(d.date)}</div>
                    <div style={UI.dayCount}>{rows.length} Termine</div>
                  </div>

                  {rows.length === 0 ? (
                    <div style={UI.empty}>Keine Termine</div>
                  ) : (
                    rows.map((r) => {
                      const st = new Date(r.start_at);
                      const hh = pad2(st.getHours());
                      const mm = pad2(st.getMinutes());
                      const time = `${hh}:${mm}`;
                      const status = (r?.status ? String(r.status) : "confirmed").toLowerCase();

                      return (
                        <div key={r.id} style={UI.item}>
                          <div style={UI.itemTime}>{time}</div>
                          <div style={UI.itemService}>{r.service_name || "Service"}</div>
                          <div style={UI.itemMeta}>{status}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
