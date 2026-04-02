"use client";

import { useEffect, useState } from "react";
import UI from "@/lib/ui";

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
  <div style={UI.page}>
    <div style={UI.shell}>
      
      <h2 style={UI.title}>Mitarbeiter</h2>

      {/* Add Employee */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          style={UI.input}
        />
        <button onClick={addEmployee} style={UI.btn(true)}>
          Hinzufügen
        </button>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{e.name}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {e.active ? "Active" : "Inactive"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => toggleEmployee(e)}
                style={UI.miniBtn}
              >
                {e.active ? "Deactivate" : "Activate"}
              </button>

              <button
                onClick={() => deleteEmployee(e.id)}
                style={{ ...UI.miniBtn, borderColor: "rgba(255,0,0,0.4)" }}
              >
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  </div>
)
}
