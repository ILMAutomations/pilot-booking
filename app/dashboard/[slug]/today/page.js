"use client";

import { useEffect, useMemo, useState } from "react";

export default function TodayPage({ params }) {
  const { slug } = params;

  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");
  const [error, setError] = useState("");

  const serviceNameById = useMemo(() => {
    const m = new Map();
    for (const s of services) m.set(s.id, s.name);
    return m;
  }, [services]);

  async function loadServices() {
    const res = await fetch(`/api/s/${slug}/services`, { cache: "no-store" });
    const data = await res.json();
    const list = data.services || [];
    setServices(list);
    if (list.length > 0) setServiceId(list[0].id);
  }

  async function loadToday() {
    const res = await fetch(`/api/s/${slug}/dashboard/today`, { cache: "no-store" });
    const data = await res.json();
    setAppointments(data.rows || []);
    setLoading(false);
  }

  async function createAppointment(e) {
    e.preventDefault();
    setError("");

    if (!serviceId) {
      setError("Bitte Service auswählen.");
      return;
    }
    if (!start) {
      setError("Bitte Startzeit auswählen.");
      return;
    }

    const res = await fetch(`/api/s/${slug}/appointments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        start_at: new Date(start).toISOString(),
        service_id: serviceId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Create failed");
      return;
    }

    setStart("");
    await loadToday();
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadServices();
      await loadToday();
    })();
  }, []);

  const styles = {
    page: { fontFamily: "system-ui", padding: 24, background: "#0b0f14", minHeight: "100vh", color: "#e8eef5" },
    card: { maxWidth: 980, margin: "0 auto", background: "#111824", border: "1px solid #1f2a3a", borderRadius: 14, padding: 18 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    badge: { fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "#162235", border: "1px solid #24344c" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" },
    label: { fontSize: 12, opacity: 0.8, marginBottom: 6 },
    input: { width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid #24344c", background: "#0f1622", color: "#e8eef5" },
    button: { padding: "10px 14px", borderRadius: 10, border: "1px solid #2b3d59", background: "#162235", color: "#e8eef5", cursor: "pointer" },
    table: { width: "100%", marginTop: 16, borderTop: "1px solid #1f2a3a" },
    row: { display: "grid", gridTemplateColumns: "160px 1.4fr 1fr 110px", gap: 10, padding: "10px 0", borderBottom: "1px solid #1f2a3a" },
    th: { fontSize: 12, opacity: 0.75 },
    td: { fontSize: 14 },
    err: { marginTop: 10, color: "#ffb4b4", fontSize: 13 }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Dashboard Today</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Salon: <span style={{ fontWeight: 600 }}>{slug}</span></div>
          </div>
          <div style={styles.badge}>Pilot</div>
        </div>

        <form onSubmit={createAppointment}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Create Appointment</div>

          <div style={styles.grid}>
            <div>
              <div style={styles.label}>Service</div>
              <select style={styles.input} value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={styles.label}>Start</div>
              <input style={styles.input} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
            </div>

            <button style={styles.button} type="submit">Create</button>
          </div>

          {error ? <div style={styles.err}>{error}</div> : null}
        </form>

        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600 }}>Today</div>

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>
        ) : (
          <div style={styles.table}>
            <div style={{ ...styles.row, paddingTop: 12, paddingBottom: 12 }}>
              <div style={styles.th}>Start</div>
              <div style={styles.th}>Service</div>
              <div style={styles.th}>Customer</div>
              <div style={styles.th}>Status</div>
            </div>

            {appointments.map((a) => {
              const serviceName = a.service_name || serviceNameById.get(a.service_id) || a.service_id;
              const customerName = a.customer_name || ""; // only if your API provides it later; otherwise blank
              return (
                <div key={a.id} style={styles.row}>
                  <div style={styles.td}>{new Date(a.start_at).toLocaleString()}</div>
                  <div style={styles.td}>{serviceName}</div>
                  <div style={styles.td}>{customerName}</div>
                  <div style={styles.td}>{a.status}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
