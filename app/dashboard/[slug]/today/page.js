"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const UI = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#070B14 0%,#0B1220 55%,#070B14 100%)",
    color: "#E5E7EB",
    padding: "48px 20px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
  },

  shell: { maxWidth: 1100, margin: "0 auto" },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18
  },

  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  sub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  badge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #233044",
    background: "rgba(17,24,39,.55)"
  },

  card: {
    borderRadius: 18,
    border: "1px solid rgba(35,48,68,.9)",
    background: "rgba(11,18,32,.72)",
    padding: 18
  },

  tabsRow: { display: "flex", gap: 10, marginBottom: 14 },

  tab: (active) => ({
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: active
      ? "1px solid rgba(59,130,246,.6)"
      : "1px solid rgba(35,48,68,.9)",
    background: active
      ? "rgba(59,130,246,.16)"
      : "rgba(2,6,23,.35)",
    color: active ? "#DBEAFE" : "#CBD5E1",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    textDecoration: "none"
  }),

  timelineWrap: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(35,48,68,.9)",
    background: "rgba(2,6,23,.35)",
    overflow: "hidden"
  },

  timeline: {
    display: "grid",
    gridTemplateColumns: "86px 1fr"
  },

  axis: { padding: "10px 0" },

  axisItem: (isHour) => ({
    height: 18,
    paddingLeft: 12,
    fontSize: isHour ? 12 : 11,
    fontWeight: isHour ? 800 : 600,
    color: isHour ? "#E5E7EB" : "rgba(229,231,235,.55)"
  }),

  gridArea: { position: "relative", padding: "10px 12px 14px 12px" },

  slotLine: (isHour) => ({
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    background: isHour ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)"
  }),

  appt: {
    position: "absolute",
    left: 10,
    right: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.1)",
    background:
      "linear-gradient(180deg,rgba(17,24,39,.92),rgba(11,18,32,.92))",
    padding: "6px 8px",
    boxShadow: "0 8px 20px rgba(0,0,0,.35)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflow: "hidden"
  },

  apptTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },

  apptTime: {
    fontSize: 11,
    fontWeight: 900
  },

  apptService: {
    fontSize: 11,
    color: "#CBD5E1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  apptName: {
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  apptMeta: {
    fontSize: 10,
    color: "#93A4BF",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },

  miniBtn: {
    height: 24,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(2,6,23,.35)",
    color: "#E5E7EB",
    fontSize: 11,
    padding: "0 6px",
    cursor: "pointer"
  },

  apptActions: {
    display: "flex",
    gap: 6
  }
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export default function Page({ params }) {
  const slug = params?.slug;

  const [today, setToday] = useState(null);

  async function loadToday() {
    const res = await fetch(`/api/s/${slug}/dashboard/today`, {
      cache: "no-store"
    });

    const data = await res.json();

    if (res.ok) setToday(data);
  }

  useEffect(() => {
    if (slug) loadToday();
  }, [slug]);

  const rows = today?.rows || [];

  const displayStart = Number(today?.display_start_min ?? 540);
  const displayEnd = Number(today?.display_end_min ?? 1140);

  const slotMin = 15;
  const slotPx = 18;

  const axisMarks = useMemo(() => {
    const arr = [];
    for (let m = displayStart; m <= displayEnd; m += slotMin) arr.push(m);
    return arr;
  }, [displayStart, displayEnd]);

  function minFromISO(iso) {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  }

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

          <div style={UI.timelineWrap}>
            <div style={UI.timeline}>

              <div style={UI.axis}>
                {axisMarks.map((m) => {
                  const isHour = m % 60 === 0;
                  return (
                    <div key={m} style={UI.axisItem(isHour)}>
                      {toHHMM(m)}
                    </div>
                  );
                })}
              </div>

              <div style={UI.gridArea}>

                {rows.map((a) => {

                  const startMin = minFromISO(a.start_at);
                  const endMin = minFromISO(a.end_at);

                  const top =
                    ((startMin - displayStart) / slotMin) * slotPx;

                  const duration = endMin - startMin;

                  const height =
                    Math.max(34, (duration / slotMin) * slotPx);

                  const st = new Date(a.start_at);

                  const time =
                    pad2(st.getHours()) +
                    ":" +
                    pad2(st.getMinutes());

                  return (
                    <div key={a.id} style={{ ...UI.appt, top, height }}>

                      <div style={UI.apptTop}>
                        <div style={UI.apptTime}>{time}</div>

                        <div style={UI.apptActions}>
                          <button style={UI.miniBtn}>Move</button>
                          <button style={UI.miniBtn}>Delete</button>
                        </div>
                      </div>

                      <div style={UI.apptService}>
                        {a.service_name || "Service"}
                      </div>

                      <div style={UI.apptName}>
                        {a.customer_name || "—"}
                      </div>

                      <div style={UI.apptMeta}>
                        {a.customer_phone || ""}
                      </div>

                      <div style={UI.apptMeta}>
                        {a.customer_email || ""}
                      </div>

                      <div style={UI.apptMeta}>
                        {a.internal_note || ""}
                      </div>

                      <div style={UI.apptMeta}>
                        {a.status || ""}
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
