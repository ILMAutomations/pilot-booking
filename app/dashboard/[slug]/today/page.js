"use client";

import Link from "next/link";
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

const WEEKDAYS = [
  { k: 1, short: "Mo", label: "Montag" },
  { k: 2, short: "Di", label: "Dienstag" },
  { k: 3, short: "Mi", label: "Mittwoch" },
  { k: 4, short: "Do", label: "Donnerstag" },
  { k: 5, short: "Fr", label: "Freitag" },
  { k: 6, short: "Sa", label: "Samstag" },
  { k: 7, short: "So", label: "Sonntag" },
];

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

  card: {
    borderRadius: 18,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(11, 18, 32, 0.72)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)",
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

  controlsRow2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    alignItems: "center",
    marginTop: 10,
  },

  controlsRow3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    alignItems: "start",
    marginTop: 10,
  },

  input: {
    width: "100%",
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.65)",
    color: "#E5E7EB",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },

  // Visibility fix for datetime-local (stronger contrast + focus)
  inputDateTime: {
    width: "100%",
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.28)",
    background: "rgba(2, 6, 23, 0.78)",
    color: "#E5E7EB",
    outline: "none",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(59,130,246,0.10)",
  },

  textarea: {
    width: "100%",
    minHeight: 82,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.55)",
    color: "#E5E7EB",
    outline: "none",
    resize: "vertical",
  },

  hint: { marginTop: 6, fontSize: 12, color: "#93A4BF" },

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
  ok: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(34, 197, 94, 0.28)",
    background: "rgba(20, 83, 45, 0.22)",
    color: "#86EFAC",
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
    background: "linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(11,18,32,0.92) 100%)",
    padding: 12,
    boxShadow: "0 10px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 8,
  }),
  blockTop: { display: "flex", flexDirection: "column", gap: 2 },
  blockTime: { fontWeight: 800, letterSpacing: "-0.01em", fontSize: 13, color: "#E5E7EB" },
  blockService: { fontSize: 13, color: "#CBD5E1" },
  blockName: { fontSize: 12, color: "#E5E7EB", opacity: 0.92 },
  blockMeta: { fontSize: 12, color: "#93A4BF" },
  blockDetail: { fontSize: 11, color: "#93A4BF", lineHeight: 1.35 },

  // Business Hours section
  sectionTitle: { marginTop: 18, marginBottom: 10, fontSize: 14, fontWeight: 800, color: "#E5E7EB" },
  bhWrap: {
    borderRadius: 16,
    border: "1px solid rgba(35, 48, 68, 0.9)",
    background: "rgba(2, 6, 23, 0.35)",
    padding: 12,
  },
  bhHeaderRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 1fr 110px",
    gap: 10,
    alignItems: "center",
    padding: "8px 8px",
    color: "#93A4BF",
    fontSize: 12,
  },
  bhRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 1fr 110px",
    gap: 10,
    alignItems: "center",
    padding: "8px 8px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  bhTag: (open) => ({
    justifySelf: "end",
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: open ? "1px solid rgba(34,197,94,0.30)" : "1px solid rgba(148,163,184,0.18)",
    background: open ? "rgba(34,197,94,0.12)" : "rgba(2,6,23,0.35)",
    color: open ? "#86EFAC" : "#93A4BF",
    fontWeight: 700,
    textAlign: "center",
    width: 80,
  }),
  bhFooter: { marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
};

export default function Page({ params }) {
  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [todayRows, setTodayRows] = useState([]);
  const [displayStartMin, setDisplayStartMin] = useState(8 * 60);
  const [displayEndMin, setDisplayEndMin] = useState(21 * 60);

  const [bh, setBh] = useState(() =>
    WEEKDAYS.map((d) => ({ weekday: d.k, open_time: "", close_time: "" }))
  );
  const [bhSaving, setBhSaving] = useState(false);

  const PX_PER_MIN = 2;

  const timelineHeight = useMemo(() => {
    return Math.max(300, (displayEndMin - displayStartMin) * PX_PER_MIN);
  }, [displayStartMin, displayEndMin]);

  async function loadServices() {
    if (!slug) return;
    const res = await fetch(`/api/s/${slug}/services`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const arr = Array.isArray(data.services) ? data.services : [];
    setServices(arr);
  }

  async function loadToday() {
    if (!slug) return;
    const res = await fetch(`/api/s/${slug}/dashboard/today`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.error) {
      setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
      setTodayRows([]);
      return;
    }

    setTodayRows(Array.isArray(data.rows) ? data.rows : []);
    if (typeof data.display_start_min === "number") setDisplayStartMin(data.display_start_min);
    if (typeof data.display_end_min === "number") setDisplayEndMin(data.display_end_min);
  }

  async function loadBusinessHours() {
    if (!slug) return;
    const res = await fetch(`/api/s/${slug}/business-hours`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const rows = Array.isArray(data.rows) ? data.rows : [];

    // normalize to 1..7 always
    const map = new Map(rows.map((r) => [Number(r.weekday), r]));
    const next = WEEKDAYS.map((d) => {
      const r = map.get(d.k);
      return {
        weekday: d.k,
        open_time: r?.open_time ? String(r.open_time).slice(0, 5) : "",
        close_time: r?.close_time ? String(r.close_time).slice(0, 5) : "",
      };
    });
    setBh(next);
  }

  useEffect(() => {
    if (!slug) return;
    setError("");
    setOkMsg("");
    loadServices();
    loadToday();
    loadBusinessHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const blocks = useMemo(() => {
    return (todayRows || [])
      .map((r) => {
        const startMin = minutesFromISO(r.start_at);
        const endMin = minutesFromISO(r.end_at);
        if (startMin == null || endMin == null) return null;

        const top = (startMin - displayStartMin) * PX_PER_MIN;
        const height = Math.max(40, (endMin - startMin) * PX_PER_MIN);

        const st = new Date(r.start_at);
        const label = `${pad2(st.getHours())}:${pad2(st.getMinutes())}`;

        const custName = r.customer_name || "";
        const custPhone = r.customer_phone || "";
        const custMail = r.customer_mail || "";
        const note = r.internal_note || "";

        const detailParts = [];
        if (custPhone) detailParts.push(`Tel: ${custPhone}`);
        if (custMail) detailParts.push(`Mail: ${custMail}`);
        if (note) detailParts.push(`Notiz: ${note}`);

        return {
          id: r.id,
          top,
          height,
          startLabel: label,
          service_name: r.service_name,
          status: r.status,
          customer_name: custName,
          detail: detailParts.join(" · "),
        };
      })
      .filter(Boolean)
      .filter((b) => b.top + b.height > 0 && b.top < timelineHeight);
  }, [todayRows, displayStartMin, timelineHeight]);

  async function createAppointment() {
    try {
      setError("");
      setOkMsg("");

      if (!serviceId) return setError("Bitte Service auswählen.");
      if (!start) return setError("Bitte Startzeit auswählen.");
      if (!customerName.trim()) return setError("Bitte Kundennamen eingeben.");

      const svc = services.find((s) => s.id === serviceId);
      const duration = Number(svc?.duration_min || 0);
      if (!duration || duration <= 0) return setError("Service-Dauer fehlt. Bitte kurz melden.");

      const startISO = toISOFromDatetimeLocal(start);
      if (!startISO) return setError("Ungültige Startzeit.");

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
          customer_name: customerName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          internal_note: internalNote.trim() || null,
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
        setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
        return;
      }

      setOkMsg("Termin erstellt.");
      await loadToday();
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

  function setBHField(weekday, field, value) {
    setBh((prev) =>
      prev.map((r) => (r.weekday === weekday ? { ...r, [field]: value } : r))
    );
  }

  async function saveBusinessHours() {
    try {
      if (!slug) return;
      setError("");
      setOkMsg("");
      setBhSaving(true);

      const payload = bh.map((r) => ({
        weekday: r.weekday,
        open_time: r.open_time || null,
        close_time: r.close_time || null,
      }));

      const res = await fetch(`/api/s/${slug}/business-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setError(data?.error || "Technischer Fehler. Bitte erneut versuchen.");
        return;
      }

      setOkMsg("Gespeichert.");
      await loadBusinessHours();
      await loadToday(); // refresh window bounds for today
    } catch (e) {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    } finally {
      setBhSaving(false);
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

        <div style={UI.card}>
          <div style={UI.tabsRow}>
            <Link href={`/dashboard/${slug}/today`} style={UI.tab(true)}>
              Today
            </Link>
            <Link href={`/dashboard/${slug}/overview`} style={UI.tab(false)}>
              Overview
            </Link>
          </div>

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
                style={UI.inputDateTime}
              />

              <button onClick={createAppointment} style={UI.button}>
                Create
              </button>
            </div>

            <div style={UI.controlsRow2}>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Kundenname (Pflicht)"
                style={UI.input}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon (optional)"
                style={UI.input}
              />
            </div>

            <div style={UI.controlsRow3}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail (optional)"
                style={UI.input}
              />
              <div>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Interne Notiz (nur intern sichtbar)"
                  style={UI.textarea}
                />
                <div style={UI.hint}>Nur intern sichtbar.</div>
              </div>
            </div>

            {error && <div style={UI.error}>{error}</div>}
            {okMsg && <div style={UI.ok}>{okMsg}</div>}
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
                  <div style={UI.blockTop}>
                    <div style={UI.blockTime}>{b.startLabel}</div>
                    <div style={UI.blockService}>{b.service_name || "Service"}</div>
                    {b.customer_name ? <div style={UI.blockName}>{b.customer_name}</div> : null}
                    {b.detail ? <div style={UI.blockDetail}>{b.detail}</div> : null}
                  </div>
                  <div style={UI.blockMeta}>{b.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={UI.sectionTitle}>Öffnungszeiten (Mo–So)</div>
          <div style={UI.bhWrap}>
            <div style={UI.bhHeaderRow}>
              <div>Tag</div>
              <div>Open</div>
              <div>Close</div>
              <div style={{ justifySelf: "end" }}>Status</div>
            </div>

            {WEEKDAYS.map((d) => {
              const row = bh.find((x) => x.weekday === d.k) || { open_time: "", close_time: "" };
              const isOpen = !!(row.open_time && row.close_time);
              return (
                <div key={d.k} style={UI.bhRow}>
                  <div style={{ color: "#CBD5E1", fontSize: 13 }}>{d.short}</div>

                  <input
                    type="time"
                    value={row.open_time}
                    onChange={(e) => setBHField(d.k, "open_time", e.target.value)}
                    style={UI.input}
                  />

                  <input
                    type="time"
                    value={row.close_time}
                    onChange={(e) => setBHField(d.k, "close_time", e.target.value)}
                    style={UI.input}
                  />

                  <div style={UI.bhTag(isOpen)}>{isOpen ? "Open" : "Zu"}</div>
                </div>
              );
            })}

            <div style={UI.bhFooter}>
              <div style={{ fontSize: 12, color: "#93A4BF" }}>
                Leere Zeiten = geschlossen. Buchungen außerhalb werden serverseitig blockiert.
              </div>
              <button onClick={saveBusinessHours} style={UI.button} disabled={bhSaving}>
                {bhSaving ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
