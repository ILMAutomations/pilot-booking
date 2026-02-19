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

  const DAY_START_MIN = 8 * 60;
  const DAY_END_MIN = 21 * 60;
  const PX_PER_MIN = 2;
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

      if (res.status === 409) {
        setError(
          "Dieser Zeitraum ist leider bereits vergeben. Bitte wählen Sie eine andere Uhrzeit."
        );
        return;
      }

      if (err.code === "OUTSIDE_HOURS") {
        setError(
          "Außerhalb der Öffnungszeiten. Bitte wählen Sie eine andere Uhrzeit."
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

  const blocks = rows
    .map((r) => {
      const startMin = minutesSinceMidnight(r.start_at);
      const endMin = minutesSinceMidnight(r.end_at);

      const top = (startMin - DAY_START_MIN) * PX_PER_MIN;
      const height = Math.max(24, (endMin - startMin) * PX_PER_MIN);

      return {
        ...r,
        top,
        height,
        startLabel: fmtTime(r.start_at),
      };
    })
    .filter((b) => b.top + b.height >= 0 && b.top <= timelineHeight);

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Salon: {slug}</h2>

      <div style={{ marginBottom: 20 }}>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          style={{ padding: 8, marginRight: 8 }}
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
          style={{ padding: 8, marginRight: 8 }}
        />

        <button onClick={createAppointment} style={{ padding: "8px 14px" }}>
          Create
        </button>

        {error && (
          <div style={{ marginTop: 10, color: "red" }}>{error}</div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr",
          gap: 10,
        }}
      >
        <div style={{ position: "relative", height: timelineHeight }}>
          {Array.from({
            length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1,
          }).map((_, i) => {
            const hour = 8 + i;
            const top = (hour * 60 - DAY_START_MIN) * PX_PER_MIN;
            return (
              <div
                key={hour}
                style={{
                  position: "absolute",
                  top,
                  fontSize: 12,
                  color: "#666",
                }}
              >
                {pad2(hour)}:00
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "relative",
            height: timelineHeight,
            border: "1px solid #eee",
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          {blocks.map((b) => (
            <div
              key={b.id}
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                top: b.top,
                height: b.height,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #ddd",
                padding: 10,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontWeight: 600 }}>{b.startLabel}</div>
              <div style={{ fontSize: 13 }}>
                {b.service_name || "Service"}
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {b.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
