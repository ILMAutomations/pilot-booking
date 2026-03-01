"use client";

import { useEffect, useState } from "react";

export default function TodayCreateSection({
  slug,
  services,
  onCreated,
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const isValid =
    customerName.trim() !== "" &&
    serviceId !== "" &&
    startAt !== "";

  async function handleCreate() {
    if (!isValid) return;

    setLoading(true);

    const res = await fetch(`/api/s/${slug}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName,
        customer_phone: phone,
        customer_email: email,
        internal_note: internalNote,
        service_id: serviceId,
        start_at: startAt,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Technischer Fehler.");
      return;
    }

    setSuccess("Termin erstellt.");
    setCustomerName("");
    setPhone("");
    setEmail("");
    setInternalNote("");
    setServiceId("");
    setStartAt("");

    onCreated?.();

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 12 }}>Termin erstellen</h3>

      <input
        placeholder="Kundenname *"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Telefon"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <textarea
        placeholder="Interne Notiz (nur intern sichtbar)"
        value={internalNote}
        onChange={(e) => setInternalNote(e.target.value)}
        style={{ ...inputStyle, height: 70 }}
      />

      <select
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        style={inputStyle}
      >
        <option value="">Service auswählen *</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} – ({s.duration_min} Min)
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        value={startAt}
        onChange={(e) => setStartAt(e.target.value)}
        style={{
          ...inputStyle,
          color: "#fff",
          border: "1px solid #fff",
          background: "#111",
        }}
      />

      <button
        disabled={!isValid || loading}
        onClick={handleCreate}
        style={{
          marginTop: 12,
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: !isValid ? "#444" : "#2563eb",
          color: "#fff",
          cursor: !isValid ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Speichert..." : "Termin erstellen"}
      </button>

      {success && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            background: "#065f46",
            color: "#fff",
          }}
        >
          {success}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #555",
  background: "#1f2937",
  color: "#fff",
};
