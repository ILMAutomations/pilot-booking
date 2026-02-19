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

export default function TodayPage() {
  const { slug } = useParams();

  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [start, setStart] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [error, setError] = useState("");

  // --- Timeline constants (unchanged logic) ---
  const DAY_START_MIN = 8 * 60; // 08:00
  const DAY_END_MIN = 21 * 60; // 21:00
  const PX_PER_MIN = 2; // 2px per minute
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

      if (res.status === 409 || err.code === "OVERLAP") {
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

  // --- Build blocks (unchanged logic) ---
  const blocks = (rows || [])
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
        endLabel: fmtTime(r.end_at),
      };
    })
    .filter((b) => b.top + b.height >= 0 && b.top <= timelineHeight);

  // --- Styles (dark, calm, owner-like) ---
  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0b1220",
      color: "#e5e7eb",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      padding: 28,
    },
    shell: {
      maxWidth: 1100,
      margin: "0 auto",
    },
    card: {
      background: "#0f172a",
      border: "1px solid #1f2a44",
      borderRadius: 16,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      padding: 18,
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
      marginBottom: 14,
    },
    title: {
      fontSize: 16,
      fontWeight: 700,
      margin: 0,
      lineHeight: 1.2,
      color: "#f3f4f6",
    },
    subtitle: {
      marginTop: 6,
      fontSize: 12.5,
      color: "#9ca3af",
    },
    divider: {
      height: 1,
      background: "#18233b",
      margin: "14px 0",
    },
    controls: {
      display: "grid",
      gridTemplateColumns: "1.6fr 1.2fr auto",
      gap: 10,
      alignItems: "end",
    },
    label: {
      fontSize: 12,
      color: "#9ca3af",
      marginBottom: 6,
    },
    input: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      border: "1px solid #243244",
      background: "#0b1324",
      color: "#e5e7eb",
      padding: "0 12px",
      outline: "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    button: {
      height: 40,
      borderRadius: 12,
      border: "1px solid #2b3a55",
      background: "#111c33",
      color: "#f3f4f6",
      padding: "0 14px",
      cursor: "pointer",
      fontWeight: 700,
      letterSpacing: 0.2,
    },
    helperRow: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    hint: { fontSize: 12, color: "#94a3b8" },
    errorBox: {
      marginTop: 12,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(248,113,113,0.35)",
      background: "rgba(248,113,113,0.10)",
      color: "#fecaca",
      fontSize: 13,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "90px 1fr",
      gap: 12,
      marginTop: 16,
    },
    axis: {
      position: "relative",
      height: timelineHeight,
    },
    axisLabel: {
      position: "absolute",
      left: 0,
      fontSize: 12,
      color: "#7c8aa3",
      letterSpacing: 0.2,
    },
    lane: {
      position: "relative",
      height: timelineHeight,
      border: "1px solid #1f2a44",
      borderRadius: 16,
      background: "#0b1324",
      overflow: "hidden",
    },
    hourLine: {
      position: "absolute",
      left: 0,
      right: 0,
      borderTop: "1px solid rgba(148,163,184,0.10)",
    },
    block: {
      position: "absolute",
      left: 12,
      right: 12,
      borderRadius: 14,
      background: "#111827",
      border: "1px solid #243244",
      padding: 10,
      boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
      overflow: "hidden",
    },
    blockTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    blockTime: { fontWeight: 800, fontSize: 13, color: "#f3f4f6" },
    blockStatus: { fontSize: 12, color: "#9ca3af" },
    blockService: { fontSize: 13, color: "#e5e7eb" },
    blockMeta: { marginTop: 4, fontSize: 12, color: "#94a3b8" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Dashboard — Today</h1>
              <div style={styles.subtitle}>
                Salon: <b style={{ color: "#e5e7eb" }}>{slug}</b>
              </div>
            </div>
          </div>

          <div style={styles.controls}>
            <div>
              <div style={styles.label}>Service</div>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={styles.input}
                required
              >
                <option value="">Service wählen</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={styles.label}>Startzeit</div>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={styles.input}
              />
            </div>

            <button onClick={createAppointment} style={styles.button}>
              Create
            </button>
          </div>

          <div style={styles.helperRow}>
            <div style={styles.hint}>
              Zeitachse: {pad2(DAY_START_MIN / 60)}:00–{pad2(DAY_END_MIN / 60)}:00
            </div>
            <div style={styles.hint}>Overlaps werden serverseitig blockiert.</div>
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <div style={styles.divider} />

          <div style={styles.grid}>
            {/* Time axis */}
            <div style={styles.axis}>
              {Array.from({
                length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1,
              }).map((_, i) => {
                const hour = 8 + i;
                const top = (hour * 60 - DAY_START_MIN) * PX_PER_MIN;
                return (
                  <div
                    key={hour}
                    style={{ ...styles.axisLabel, top: top - 8 }}
                  >
                    {pad2(hour)}:00
                  </div>
                );
              })}
            </div>

            {/* Timeline lane */}
            <div style={styles.lane}>
              {Array.from({
                length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1,
              }).map((_, i) => {
                const hour = 8 + i;
                const top = (hour * 60 - DAY_START_MIN) * PX_PER_MIN;
                return <div key={hour} style={{ ...styles.hourLine, top }} />;
              })}

              {blocks.map((b) => (
                <div
                  key={b.id}
                  style={{
                    ...styles.block,
                    top: b.top,
                    height: b.height,
                  }}
                  title={`${b.startLabel}–${b.endLabel}`}
                >
                  <div style={styles.blockTop}>
                    <div style={styles.blockTime}>{b.startLabel}</div>
                    <div style={styles.blockStatus}>{b.status}</div>
                  </div>

                  <div style={styles.blockService}>
                    {b.service_name || "Service"}
                  </div>

                  <div style={styles.blockMeta}>
                    {(() => {
                      try {
                        const meta = JSON.parse(b.notes || "{}");
                        const src = meta?.source;
                        const icon =
                          src === "phone" ? "📞" : src === "website" ? "🌐" : "🧑‍💼";
                        const cname = meta?.customer?.name;
                        return `${icon}${cname ? ` ${cname}` : ""}`;
                      } catch {
                        return "";
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
