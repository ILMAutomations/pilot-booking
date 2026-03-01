"use client";

import { useEffect, useMemo, useState } from "react";

export default function Page({ params }) {
  const slug = params?.slug;

  const [data, setData] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

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

  async function load() {
    if (!slug) return;

    setError("");

    const res = await fetch(`/api/s/${slug}/dashboard/today`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || json?.error) {
      setError(json?.error || "Technischer Fehler.");
      return;
    }

    setData(json);

    const sRes = await fetch(`/api/s/${slug}/services`);
    const sJson = await sRes.json().catch(() => ({}));
    setServices(Array.isArray(sJson?.services) ? sJson.services : []);
  }

  useEffect(() => {
    load();
  }, [slug]);

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

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      alert(json?.error || "Fehler.");
      return;
    }

    setSuccess("Termin erstellt.");
    setCustomerName("");
    setPhone("");
    setEmail("");
    setInternalNote("");
    setServiceId("");
    setStartAt("");

    load();

    setTimeout(() => setSuccess(""), 3000);
  }

  if (!slug) return null;

  return (
    <div style={{ padding: 24, color: "#fff", background: "#0b1220", minHeight: "100vh" }}>
      <h2>Today – {slug}</h2>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* ===== CREATE SECTION ===== */}
      <div style={{ marginTop: 20, maxWidth: 500 }}>
        <h3>Termin erstellen</h3>

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
          placeholder="Interne Notiz"
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
            border: "1px solid #fff",
            background: "#111",
            color: "#fff",
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
              marginTop: 10,
              padding: 8,
              borderRadius: 6,
              background: "#065f46",
            }}
          >
            {success}
          </div>
        )}
      </div>

      {/* ===== LIST ===== */}
      <div style={{ marginTop: 40 }}>
        <h3>Heutige Termine</h3>

        {Array.isArray(data?.rows) && data.rows.length === 0 && (
          <div>Keine Termine</div>
        )}

        {Array.isArray(data?.rows) &&
          data.rows.map((r) => (
            <div
              key={r.id}
              style={{
                marginTop: 10,
                padding: 10,
                background: "#1f2937",
                borderRadius: 8,
              }}
            >
              <div><strong>{r.service_name}</strong></div>
              <div>{r.customer_name}</div>
              <div>{new Date(r.start_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          ))}
      </div>
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
