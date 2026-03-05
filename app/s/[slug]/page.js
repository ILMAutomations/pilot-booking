"use client";

import { useEffect, useState } from "react";

export default function BookingPage({ params }) {

  const slug = params.slug;

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [success, setSuccess] = useState(null);

  // load services
  useEffect(() => {
    fetch(`/api/s/${slug}/services`)
      .then(res => res.json())
      .then(data => {
        setServices(data.services || []);
      });
  }, [slug]);

  // load availability
  async function loadSlots(serviceId, date) {
    const res = await fetch(
      `/api/s/${slug}/availability?service_id=${serviceId}&date=${date}`
    );
    const data = await res.json();
    setSlots(data.slots || []);
  }

  // booking
  async function book() {

    const start_at = `${date}T${selectedSlot}:00`;

    const res = await fetch(`/api/s/${slug}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: selectedService.id,
        start_at,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null
      })
    });

    const data = await res.json();

    if (data.ok) {
      setSuccess({
        service: selectedService.name,
        date,
        time: selectedSlot
      });
    } else {
      alert(data.error || "Buchung fehlgeschlagen");
    }
  }

  if (success) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Termin bestätigt</h1>
        <p>{success.service}</p>
        <p>{success.date}</p>
        <p>{success.time}</p>
        <p>Wir freuen uns auf deinen Besuch.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>

      <h1 style={{ marginBottom: 20 }}>{slug}</h1>

      {!selectedService && (
        <>
          <h2>Service auswählen</h2>

          {services.map(service => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              style={{
                display: "block",
                width: "100%",
                padding: 16,
                marginBottom: 10,
                fontSize: 16
              }}
            >
              {service.name} ({service.duration_min} min)
            </button>
          ))}
        </>
      )}

      {selectedService && !date && (
        <>
          <h2>Datum wählen</h2>

          <input
            type="date"
            onChange={(e) => {
              const d = e.target.value;
              setDate(d);
              loadSlots(selectedService.id, d);
            }}
          />
        </>
      )}

      {date && !selectedSlot && (
        <>
          <h2>Uhrzeit wählen</h2>

          {slots.length === 0 && <p>Keine Termine verfügbar.</p>}

          {slots.map(slot => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              style={{
                padding: 14,
                margin: 6,
                fontSize: 16
              }}
            >
              {slot}
            </button>
          ))}
        </>
      )}

      {selectedSlot && (
        <>
          <h2>Deine Daten</h2>

          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", marginBottom: 10 }}
          />

          <input
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ display: "block", marginBottom: 10 }}
          />

          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", marginBottom: 10 }}
          />

          <button onClick={book} style={{ padding: 16 }}>
            Termin buchen
          </button>
        </>
      )}

    </div>
  );
}
