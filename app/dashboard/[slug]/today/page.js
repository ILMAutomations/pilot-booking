"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISOFromDatetimeLocal(v) {
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

const UI = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070B14 0%, #0B1220 55%, #070B14 100%)",
    color: "#E5E7EB",
    padding: "48px 20px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },

  shell: { maxWidth: 1100, margin: "0 auto" },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  title: { fontSize: 24, fontWeight: 700, margin: 0 },

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
  },

  controlsRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr auto",
    gap: 10,
    alignItems: "center",
  },

  select: {
    height: 42,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(35,48,68,0.9)",
    background: "rgba(2,6,23,0.55)",
    color: "#E5E7EB",
  },

  datetime: {
    height: 42,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(30,41,59,0.85)",
    color: "#FFFFFF",
    boxShadow: "0 0 0 1px rgba(148,163,184,0.15)",
    outline: "none",
  },

  button: {
    height: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.45)",
    background: "rgba(59,130,246,0.16)",
    color: "#DBEAFE",
    fontWeight: 600,
    cursor: "pointer",
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

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");
  const [error, setError] = useState("");

  async function loadServices() {
    if (!slug) return;
    const res = await fetch(`/api/s/${slug}/services`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setServices(Array.isArray(data.services) ? data.services : []);
  }

  useEffect(() => {
    loadServices();
  }, [slug]);

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

      const startISO = toISOFromDatetimeLocal(start);
      const endISO = new Date(
        new Date(startISO).getTime() + duration * 60000
      ).toISOString();

      const res = await fetch(`/api/s/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, start_at: startISO, end_at: endISO }),
      });

      if (res.status === 409) {
        setError("Zeit ist bereits belegt. Bitte andere Uhrzeit wählen.");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.code === "OUTSIDE_HOURS") {
          setError("Außerhalb der Öffnungszeiten. Bitte andere Uhrzeit wählen.");
          return;
        }
        setError("Technischer Fehler. Bitte erneut versuchen.");
        return;
      }

    } catch {
      setError("Technischer Fehler. Bitte erneut versuchen.");
    }
  }

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
          <div style={UI.controlsCard}>
            <div style={UI.controlsRow}>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={UI.select}
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
                style={UI.datetime}
              />

              <button onClick={createAppointment} style={UI.button}>
                Create
              </button>
            </div>

            {error && <div style={UI.error}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
