"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ServicesPage({ params }) {

  const slug = params?.slug;

  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  async function loadServices() {

    const res = await fetch(`/api/s/${slug}/services`, {
      cache: "no-store"
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && Array.isArray(data.services)) {
      setServices(data.services);
    }

  }

  useEffect(() => {
    if (slug) loadServices();
  }, [slug]);

  async function addService() {

    const res = await fetch(`/api/s/${slug}/services`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        price_cents: Number(price) * 100,
        duration_min: Number(duration)
      })
    });

    if (res.ok) {
      setName("");
      setPrice("");
      setDuration("");
      loadServices();
    }

  }

  async function deleteService(id) {

    if (!confirm("Service wirklich löschen?")) return;

    await fetch(`/api/s/${slug}/services/${id}`, {
      method: "DELETE"
    });

    loadServices();

  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(180deg,#070B14 0%,#0B1220 55%,#070B14 100%)",
      color:"#E5E7EB",
      padding:"48px 20px"
    }}>

      <div style={{maxWidth:900, margin:"0 auto"}}>

        <h2 style={{fontSize:24,fontWeight:700}}>
          Services
        </h2>

        <div style={{marginTop:24}}>

          {services.map(s => (

            <div key={s.id} style={{
              padding:16,
              borderRadius:12,
              border:"1px solid rgba(255,255,255,0.08)",
              marginBottom:12,
              background:"rgba(2,6,23,0.35)"
            }}>

              <div style={{fontWeight:700}}>
                {s.name}
              </div>

              <div style={{fontSize:13,opacity:0.7}}>
                {s.duration_min} min • €{(s.price_cents / 100).toFixed(2)}
              </div>

              <button
                style={{marginTop:10}}
                onClick={() => deleteService(s.id)}
              >
                Delete
              </button>

            </div>

          ))}

        </div>

        <h3 style={{marginTop:40}}>
          Add Service
        </h3>

        <div style={{display:"flex",gap:10,marginTop:12}}>

          <input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            placeholder="Price €"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />

          <input
            placeholder="Duration min"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />

          <button onClick={addService}>
            Add
          </button>

        </div>

        <div style={{marginTop:40}}>
          <Link href={`/dashboard/${slug}/today`}>
            ← Back to Dashboard
          </Link>
        </div>

      </div>

    </div>
  );

}
