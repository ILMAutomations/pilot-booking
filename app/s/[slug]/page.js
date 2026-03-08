"use client";

import { useEffect, useState } from "react";

function formatSalonName(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

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

  const salonName = formatSalonName(slug);

  useEffect(() => {
    fetch(`/api/s/${slug}/services`)
      .then(res => res.json())
      .then(data => setServices(data.services || []));
  }, [slug]);

  async function loadSlots(serviceId, date) {

    const res = await fetch(
      `/api/s/${slug}/availability?service_id=${serviceId}&date=${date}`
    );

    const data = await res.json();

    setSlots(data.slots || []);
  }

  async function book() {

    const start_at = `${date}T${selectedSlot}:00`;

    const res = await fetch(`/api/s/${slug}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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

      alert(data.error || "Diese Uhrzeit wurde gerade vergeben. Bitte wähle eine andere.");

      setSelectedSlot(null);

      loadSlots(selectedService.id, date);
    }
  }

  if (success) {
    return (
      <div style={{padding:30,maxWidth:520,margin:"auto",textAlign:"center"}}>

        <h1 style={{marginBottom:20}}>✅ Termin erfolgreich gebucht</h1>

        <div style={{fontSize:18,fontWeight:600}}>
          {success.service}
        </div>

        <div style={{marginTop:10,fontSize:16}}>
          {success.date}
        </div>

        <div style={{fontSize:16}}>
          {success.time}
        </div>

        <p style={{marginTop:20}}>
          Wir freuen uns auf deinen Besuch.
        </p>

      </div>
    );
  }

  return (
    <div style={{padding:24,maxWidth:540,margin:"auto"}}>

      {/* SALON HEADER */}

      <div style={{marginBottom:30,textAlign:"center"}}>

        <h1 style={{marginBottom:4}}>
          {salonName}
        </h1>

        <div style={{fontSize:14,opacity:0.7}}>
          Online Terminbuchung
        </div>

      </div>

      {/* SERVICE STEP */}

      {!selectedService && (
        <>

          <h2 style={{marginBottom:16}}>Service auswählen</h2>

          {services.map(service => (

            <div
              key={service.id}
              style={{
                border:"1px solid #ddd",
                borderRadius:10,
                padding:16,
                marginBottom:12
              }}
            >

              <div style={{fontWeight:600,fontSize:16}}>
                {service.name}
              </div>

              <div style={{fontSize:14,opacity:0.7,marginTop:4}}>
                {service.duration_min} Minuten
              </div>

              <button
                onClick={()=>setSelectedService(service)}
                style={{
                  marginTop:12,
                  width:"100%",
                  padding:12,
                  minHeight:44,
                  borderRadius:8,
                  border:"none",
                  background:"#111",
                  color:"#fff",
                  fontSize:15
                }}
              >
                Termin wählen
              </button>

            </div>

          ))}

        </>
      )}

      {/* DATE STEP */}

      {selectedService && !date && (
        <>

          <button
            onClick={()=>setSelectedService(null)}
            style={{marginBottom:12}}
          >
            ← Zurück
          </button>

          <h2>Datum wählen</h2>

          <input
            type="date"
            style={{
              padding:14,
              fontSize:16,
              width:"100%",
              marginTop:10
            }}
            onChange={(e)=>{

              const d = e.target.value;

              setDate(d);

              loadSlots(selectedService.id, d);

            }}
          />

        </>
      )}

      {/* SLOT STEP */}

      {date && !selectedSlot && (
        <>

          <button
            onClick={()=>{
              setDate("");
              setSlots([]);
            }}
            style={{marginBottom:12}}
          >
            ← Zurück
          </button>

          <h2>Uhrzeit wählen</h2>

          {slots.length === 0 && (
            <p>Keine Termine verfügbar.</p>
          )}

          <div
            style={{
              display:"grid",
              gridTemplateColumns:"repeat(3,1fr)",
              gap:12,
              marginTop:16
            }}
          >

            {slots.map(slot => (

              <button
                key={slot}
                onClick={()=>setSelectedSlot(slot)}
                style={{
                  padding:14,
                  minHeight:44,
                  fontSize:16,
                  borderRadius:8,
                  border:"1px solid #ddd",
                  background:"#fff"
                }}
              >
                {slot}
              </button>

            ))}

          </div>

        </>
      )}

      {/* CUSTOMER STEP */}

      {selectedSlot && (
        <>

          <button
            onClick={()=>setSelectedSlot(null)}
            style={{marginBottom:12}}
          >
            ← Uhrzeit ändern
          </button>

          <h2 style={{marginTop:10}}>Deine Daten</h2>

          <input
            placeholder="Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            style={{
              width:"100%",
              padding:14,
              marginBottom:12
            }}
          />

          <input
            placeholder="Telefon"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
            style={{
              width:"100%",
              padding:14,
              marginBottom:12
            }}
          />

          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            style={{
              width:"100%",
              padding:14,
              marginBottom:16
            }}
          />

          <button
            onClick={book}
            style={{
              width:"100%",
              padding:16,
              fontSize:16,
              minHeight:44,
              borderRadius:8,
              border:"none",
              background:"#111",
              color:"#fff"
            }}
          >
            Termin buchen
          </button>

        </>
      )}

    </div>
  );
}
