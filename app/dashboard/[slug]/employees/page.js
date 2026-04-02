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
    <div style={{ padding: 20 }}>
      <h2>Mitarbeiter</h2>

      {/* ADD */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={addEmployee}>Hinzufügen</button>
      </div>

      {/* LIST */}
      {employees.map((e) => (
        <div
          key={e.id}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ width: 150 }}>{e.name}</div>
          <div style={{ width: 100 }}>
            {e.active ? "Active" : "Inactive"}
          </div>

          <button onClick={() => toggleEmployee(e)}>
            {e.active ? "Deactivate" : "Activate"}
          </button>

          <button onClick={() => deleteEmployee(e.id)}>
            Löschen
          </button>
        </div>
      ))}
    </div>
  );
}
