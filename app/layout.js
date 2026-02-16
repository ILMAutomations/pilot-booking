export const metadata = {
  title: "Pilot Booking",
  description: "Pilot Booking API"
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "system-ui" }}>
        {children}
      </body>
    </html>
  );
}
