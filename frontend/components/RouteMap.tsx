"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type Stop = { city: string; country: string; lat: number; lon: number };

// Fix default marker icons in Next
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export default function RouteMap({ stops }: { stops: Stop[] }) {
  const points = (stops || []).map((s) => [s.lat, s.lon] as [number, number]);

  const center: [number, number] =
    points.length > 0 ? points[0] : [20.5937, 78.9629]; // fallback (India)

  return (
    <div style={{ height: 340, width: "100%" }}>
      <MapContainer center={center} zoom={points.length > 1 ? 4 : 2} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stops.map((s, idx) => (
          <Marker key={`${s.city}-${idx}`} position={[s.lat, s.lon]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{s.city}</div>
                <div className="text-slate-600">{s.country}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {points.length >= 2 ? <Polyline positions={points} /> : null}
      </MapContainer>
    </div>
  );
}
