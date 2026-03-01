"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function isoToTime(iso) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function isoToLocalInputValue(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
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
  tabsRow: { display: "flex", gap: 10, alignItems: "center", marginBottom: 14 },
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
  dayTitle: { fontSize: 12, fontWeight: 850, color: "#E5E7EB" },
  dayCount: { fontSize: 12, color: "#93A4BF" },
  item: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  itemTime: { fontSize: 12, fontWeight: 900, color: "#E5E7EB" },
  itemService: { fontSize: 12, color: "#CBD5E1" },
  itemMeta: { fontSize: 11, color: "#93A4BF" },
  actions: { display: "flex", gap: 8, marginTop: 4 },
  miniBtn: {
    height: 28,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(2,6,23,0.35)",
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    padding: "0 10px",
  },
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
  success: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(16, 185, 129, 0.35)",
    background: "rgba(16, 185, 129, 0.12)",
    color: "#A7F3D0",
    fontSize: 13,
  },
  input: {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(2,6,23,0.35)",
    color: "#E5E7EB",
    padding: "0 10px",
    outline: "none",
  },
};

export default function Page({ params }) {
  const slug = params?.slug;

  const [days, setDays] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // move modal
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveId, setMoveId] = useState("");
  const [moveStart, setMoveStart] = useState("");

  const okTimer = useRef(null);
  function showOk(msg) {
    setOk(msg);
    if (okTimer.current) clearTimeout(okTimer.current);
    okTimer.current = setTimeout(() => setOk(""), 3000);
  }

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

  function openMove(appt) {
    setMoveId(appt.id);
    setMoveStart(isoToLocalInputValue(appt.start_at));
    setMoveOpen(true);
  }

  async function saveMove() {
    setError("");
    if (!moveId || !moveStart) return;

    const dt = new Date(moveStart);
    if (Number.isNaN(dt.getTime())) {
      setError("Ungültige Uhrzeit.");
      return;
    }

    const res = await fetch(`/api/s/${slug}/appointments/${moveId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ start_at: dt.toISOString() }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      return;
    }

    setMoveOpen(false);
    showOk("Termin verschoben.");
    await loadWeek();
  }

  async function deleteAppt(id) {
    if (!confirm("Termin wirklich löschen?")) return;
    setError("");
    const res = await fetch(`/api/s/${slug}/appointments/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      return;
    }
    showOk("Termin gelöscht.");
    await loadWeek();
  }

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

          {ok && <div style={UI.success}>{ok}</div>}
          {error && <div style={UI.error}>{error}</div>}

          {moveOpen && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(2,6,23,0.35)" }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Termin verschieben</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  style={UI.input}
                  type="datetime-local"
                  value={moveStart}
                  onChange={(e) => setMoveStart(e.target.value)}
                />
                <button style={UI.miniBtn} onClick={saveMove}>Speichern</button>
                <button style={UI.miniBtn} onClick={() => setMoveOpen(false)}>Abbrechen</button>
              </div>
            </div>
          )}

          <div style={UI.grid}>
            {safeDays.map((d) => {
              const rows = Array.isArray(d.rows) ? d.rows : [];
              return (
                <div key={d.date} style={UI.dayCard}>
                  <div style={UI.dayHeader}>
                    <div style={UI.dayTitle}>{d.date}</div>
                    <div style={UI.dayCount}>{rows.length} Termine</div>
                  </div>

                  {rows.length === 0 ? (
                    <div style={UI.empty}>Keine Termine</div>
                  ) : (
                    rows.map((r) => (
                      <div key={r.id} style={UI.item}>
                        <div style={UI.itemTime}>{isoToTime(r.start_at)}</div>
                        <div style={UI.itemService}>{r.service_name || "Service"}</div>
                        <div style={UI.itemMeta}>{r.status || ""}</div>
                        <div style={UI.actions}>
                          <button style={UI.miniBtn} onClick={() => openMove(r)}>Verschieben</button>
                          <button style={UI.miniBtn} onClick={() => deleteAppt(r.id)}>Löschen</button>
                        </div>
                      </div>
                    ))
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
