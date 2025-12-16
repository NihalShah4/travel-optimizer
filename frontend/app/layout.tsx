import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Travel Optimizer",
  description: "Build a smart route and a realistic budget plan in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
