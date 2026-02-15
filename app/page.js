export default function Page() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Pilot Booking</h1>
      <p>API endpoints:</p>
      <ul>
        <li>/api/health</li>
        <li>POST /api/s/[slug]/appointments</li>
        <li>GET /api/s/[slug]/dashboard/today</li>
      </ul>
    </main>
  );
}
