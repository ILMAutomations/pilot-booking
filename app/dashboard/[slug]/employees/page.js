"use client";

import { useEffect, useState } from "react";

export default function EmployeesPage({ params }) {
  const { slug } = params;

  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");

  async function loadEmployees() {
    const res = await fetch(`/api/employees?slug=${slug}`);
    const data = await res.json();
    setEmployees(data || []);
  }

  async function addEmployee() {
    if (!name) return;

    await fetch("/api/employees", {
      method: "POST",
      body: JSON.stringify({ name, slug }),
    });

    setName("");
    loadEmployees();
  }

  async function deleteEmployee(id) {
    await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });

    loadEmployees();
  }

  async function toggleEmployee(e) {
    await fetch(`/api/employees/${e.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        active: !e.active,
      }),
    });

    loadEmployees();
  }

  useEffect(() => {
    loadEmployees();
  }, []);

return (
  <div
    style={{
      minHeight: "100vh",
      background: "#0B1220",
      color: "#fff",
      padding: 20,
    }}
  >
    <h2 style={{ marginBottom: 20 }}>Mitarbeiter</h2>

    {/* Add */}
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        style={{
          padding: 10,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "#111",
          color: "#fff",
        }}
      />
      <button
        onClick={addEmployee}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: "#fff",
          color: "#000",
        }}
      >
        Hinzufügen
      </button>
    </div>

    {/* List */}
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {employees.map((e) => (
        <div
          key={e.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
          }}>
<div style={{ marginTop: 10 }}>
  {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d, i) => (
    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>

      <span style={{ width: 30 }}>{d}</span>

      <input type="checkbox" />

      <input type="time" defaultValue="10:00" />

      <input type="time" defaultValue="18:00" />

    </div>
  ))}
</div>
        
          <div>
            <div style={{ fontWeight: 600 }}>{e.name}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {e.active ? "Active" : "Inactive"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => toggleEmployee(e)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#fff",
              }}
            >
              {e.active ? "Deactivate" : "Activate"}
            </button>

            <button
              onClick={() => deleteEmployee(e.id)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,0,0,0.4)",
                background: "transparent",
                color: "#ff6b6b",
              }}
            >
              Löschen
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}
