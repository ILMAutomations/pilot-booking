"use client";

import { useEffect, useState } from "react";

export default function TodayPage({ params }) {
  const { slug } = params;

  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");

  async function loadServices() {
    const res = await fetch(`/api/s/${slug}/services`);
    const data = await res.json();
    setServices(data.services || []);
    if ((data.services || []).length > 0) {
      setServiceId(data.services[0].id);
    }
  }

  async function loadAppointments() {
    const res = await fetch(`/api/s/${slug}/dashboard/today`);
    const data = await res.json();
    setAppointments(data.rows || []);
  }

  async function createAppointment(e) {
    e.preventDefault();

    if (!serviceId) {
      alert("Select a service");
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
      const err = await res.json();
      alert(err.error || "Create failed");
      return;
    }

    setStart("");
    loadAppointments();
  }

  useEffect(() => {
    loadServices();
    loadAppointments();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Dashboard – {slug}</h1>

      <h2>Create Appointment</h2>

      <form onSubmit={createAppointment}>
        <div>
          <label>Service:</label><br />
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Start:</label><br />
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>

        <button style={{ marginTop: 10 }} type="submit">
          Create
        </button>
      </form>

      <h2 style={{ marginTop: 30 }}>Today's Appointments</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Start</th>
            <th>Service</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.start_at).toLocaleString()}</td>
              <td>{a.service_name || a.service_id}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
