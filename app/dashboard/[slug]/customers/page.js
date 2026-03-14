"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CustomersPage({ params }) {

  const slug = params?.slug;

  const [rows, setRows] = useState([]);

  async function loadCustomers() {

    const res = await fetch(`/api/s/${slug}/customers`, {
      cache: "no-store"
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && Array.isArray(data.rows)) {
      setRows(data.rows);
    }
  }

  useEffect(() => {
    if (slug) loadCustomers();
  }, [slug]);

  return (
  <div style={{
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070B14 0%, #0B1220 55%, #070B14 100%)",
    color: "#E5E7EB",
    padding: "48px 20px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
  }}>

    <div style={{maxWidth:1000, margin:"0 auto"}}>

      <h2 style={{fontSize:24, fontWeight:700}}>Customers</h2>

      <div style={{marginTop:30}}>

        {rows.map((c, i) => {

          const d = new Date(c.last_visit);

          const date =
            d.getDate() +
            " " +
            d.toLocaleString("default", { month: "short" });

          return (
            <div
              key={i}
              style={{
                padding:"16px",
                borderRadius:12,
                border:"1px solid rgba(255,255,255,0.08)",
                marginBottom:12,
                background:"rgba(2,6,23,0.35)"
              }}
            >

              <div style={{fontWeight:700, fontSize:15}}>
                {c.customer_name}
              </div>

              <div style={{fontSize:13, opacity:0.75}}>
                {c.customer_phone || "—"}
              </div>

              <div style={{fontSize:12, opacity:0.6, marginTop:4}}>
                Last visit: {date}
              </div>

            </div>
          );

        })}

      </div>

      <div style={{marginTop:30}}>
        <Link href={`/dashboard/${slug}/today`} style={{opacity:0.7}}>
          ← Back to Dashboard
        </Link>
      </div>

    </div>

  </div>
);
