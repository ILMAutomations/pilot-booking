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
    <div style={{padding:40}}>

      <h2>Customers</h2>

      <div style={{marginTop:20}}>

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
                padding:12,
                borderBottom:"1px solid rgba(255,255,255,0.08)"
              }}
            >

              <div style={{fontWeight:700}}>
                {c.customer_name}
              </div>

              <div style={{fontSize:13, opacity:0.7}}>
                {c.customer_phone || "—"}
              </div>

              <div style={{fontSize:12, opacity:0.6}}>
                Last visit: {date}
              </div>

            </div>
          );
        })}

      </div>

      <div style={{marginTop:30}}>
        <Link href={`/dashboard/${slug}/today`}>
          ← Back to Dashboard
        </Link>
      </div>

    </div>
  );
}
