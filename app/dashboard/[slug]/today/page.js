"use client";

import { useEffect, useState } from "react";

export default function TodayPage({ params }) {
  const { slug } = params;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function loadAppointments() {
    const res = await fetch(`/api/s/${slug}/dashboard/today`);
    const data = await res.json();
    setAppointments(data.rows || []);
    setLoading(false);
  }

  async function createAppointment(e) {
    e.preventDefault();

    await fetch(`/api/s/${slug}/appointments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        start_at: new Date(start).toISOString(),
        end_at: new Date(end).toISOString(),
        notes: "Manual dashboard booking"
      })
    });

    setStart("");
    setEnd("");
    loadAppointments();
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  return (
    <main style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1>Dashboard – {slug}</h1>

      <h2>Create Appointment</h2>
      <form onSubmit={createAppointment}>
        <div>
          <label>Start:</label><br />
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>

        <div>
          <label>End:</label><br />
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>

        <button type="submit" style={{ marginTop: 10 }}>
          Create
        </button>
      </form>

      <h2 style={{ marginTop: 40 }}>Today's Appointments</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{new Date(a.start_at).toLocaleString()}</td>
                <td>{new Date(a.end_at).toLocaleString()}</td>
                <td>{a.status}</td>
                <td>{a.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
