"use client";

import { useEffect, useState } from "react";

export default function EmployeesPage({ params }) {
  const { slug } = params;

  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [hoursMap, setHoursMap] = useState({});

  async function loadEmployeesWithHours() {
    const res = await fetch(`/api/employees?slug=${slug}`);
    const data = await res.json();

    setEmployees(data || []);

    // 🔥 hours laden für jeden employee
    const map = {};

    for (const emp of data || []) {
      const r = await fetch(`/api/employee-hours?employee_id=${emp.id}`);
      const h = await r.json();
      map[emp.id] = h;
    }

    setHoursMap(map);
  }

  async function addEmployee() {
    if (!name) return;

    await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });

    setName("");
    loadEmployeesWithHours();
  }

  async function deleteEmployee(id) {
    await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });

    loadEmployeesWithHours();
  }

  async function toggleEmployee(emp) {
    await fetch(`/api/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        active: !emp.active,
      }),
    });

    loadEmployeesWithHours();
  }

  async function saveHours(employeeId, weekday, data) {
    await fetch("/api/employee-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        weekday,
        ...data,
      }),
    });

    // 🔥 reload hours sofort
    loadEmployeesWithHours();
  }

  useEffect(() => {
    loadEmployeesWithHours();
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
        {employees.map((emp) => (
          <div
            key={emp.id}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {emp.active ? "Active" : "Inactive"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => toggleEmployee(emp)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "#fff",
                  }}
                >
                  {emp.active ? "Deactivate" : "Activate"}
                </button>

                <button
                  onClick={() => deleteEmployee(emp.id)}
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

            {/* WORKING HOURS */}
            <div>
              {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d, i) => {
                const day = (hoursMap[emp.id] || []).find(
                  (h) => h.weekday === i + 1
                );

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 6,
                      marginBottom: 6,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ width: 30 }}>{d}</span>

                    <input
                      type="checkbox"
                      checked={!!day?.is_active}
                      onChange={(ev) =>
                        saveHours(emp.id, i + 1, {
                          is_active: ev.target.checked,
                          start_time: day?.start_time || "10:00",
                          end_time: day?.end_time || "18:00",
                        })
                      }
                    />

                    <input
                      type="time"
                      value={day?.start_time || "10:00"}
                      onChange={(ev) =>
                        saveHours(emp.id, i + 1, {
                          is_active: true,
                          start_time: ev.target.value,
                          end_time: day?.end_time || "18:00",
                        })
                      }
                    />

                    <input
                      type="time"
                      value={day?.end_time || "18:00"}
                      onChange={(ev) =>
                        saveHours(emp.id, i + 1, {
                          is_active: true,
                          start_time: day?.start_time || "10:00",
                          end_time: ev.target.value,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
