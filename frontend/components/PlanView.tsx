// frontend/components/PlanView.tsx
"use client";

import React from "react";
import type { PlanResponse } from "@/lib/api";

function fmtMoney(n: number | undefined | null) {
  if (n === undefined || n === null) return "-";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function minutesToHM(mins: number) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
}

function project(lat: number, lon: number, width: number, height: number) {
  // Equirectangular projection (simple + good enough)
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

export default function PlanView({ plan }: { plan: PlanResponse | null }) {
  if (!plan) {
    return (
      <div className="rounded-2xl border bg-white/80 p-6">
        <div className="text-sm text-slate-600">Enter your trip details and click <b>Generate plan</b>.</div>
      </div>
    );
  }

  const route = plan.route || [];
  const cities = plan.cities || [];
  const points = plan.map_points || [];

  const mapW = 860;
  const mapH = 430;

  const projected = points.map((p) => ({
    ...p,
    ...project(p.lat, p.lon, mapW, mapH),
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white/80 p-4">
          <div className="text-xs text-slate-500">Cities</div>
          <div className="mt-1 text-2xl font-semibold">{cities.length}</div>
          <div className="mt-2 text-sm text-slate-600">{cities.join(" → ")}</div>
        </div>

        <div className="rounded-2xl border bg-white/80 p-4">
          <div className="text-xs text-slate-500">Estimated total</div>
          <div className="mt-1 text-2xl font-semibold">{fmtMoney(plan.estimated_total)}</div>
          <div className="mt-2 text-sm text-slate-600">Travel, stay, food, activities</div>
        </div>

        <div className="rounded-2xl border bg-white/80 p-4">
          <div className="text-xs text-slate-500">Routing mode</div>
          <div className="mt-1 text-2xl font-semibold">{plan.routing_mode}</div>
          <div className="mt-2 text-sm text-slate-600">Auto flight for long legs + overhead for borders.</div>
        </div>
      </div>

      {/* Route */}
      <div className="rounded-2xl border bg-white/80 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Route</h3>
          <div className="text-sm text-slate-500">{route.length} legs</div>
        </div>

        <div className="mt-4 space-y-3">
          {route.map((leg, idx) => (
            <div key={idx} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold">
                    {leg.from_city} <span className="mx-2 text-slate-400">→</span> {leg.to_city}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">Mode: {leg.mode}</div>
                </div>

                <div className="text-right text-sm">
                  <div className="text-slate-500">Distance</div>
                  <div className="font-semibold">{leg.distance_km.toFixed(1)} km</div>
                  <div className="mt-2 text-slate-500">Time</div>
                  <div className="font-semibold">{minutesToHM(leg.duration_min)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl border bg-white/80 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Map</h3>
          <div className="text-sm text-slate-500">Pins + route (no paid APIs)</div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border bg-white">
          <div className="relative" style={{ width: "100%", maxWidth: mapW }}>
            {/* Basemap */}
            <img
              src="/world-map.png"
              alt="World map"
              style={{ width: "100%", height: "auto", display: "block" }}
              onError={(e) => {
                // If this triggers, your file path/name is wrong
                (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
              }}
            />

            {/* SVG overlay (pins + lines) */}
            <svg
              viewBox={`0 0 ${mapW} ${mapH}`}
              className="absolute left-0 top-0"
              style={{ width: "100%", height: "100%" }}
            >
              {/* Lines */}
              {projected.length >= 2 &&
                projected.slice(0, -1).map((p, i) => {
                  const n = projected[i + 1];
                  return (
                    <line
                      key={`l-${i}`}
                      x1={p.x}
                      y1={p.y}
                      x2={n.x}
                      y2={n.y}
                      stroke="rgb(37, 99, 235)"
                      strokeWidth="2"
                      opacity="0.9"
                    />
                  );
                })}

              {/* Pins */}
              {projected.map((p, i) => (
                <g key={`p-${i}`}>
                  <circle cx={p.x} cy={p.y} r="6" fill="rgb(16, 185, 129)" stroke="white" strokeWidth="2" />
                  <text x={p.x + 10} y={p.y - 8} fontSize="12" fill="rgb(15, 23, 42)">
                    {p.city}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          If you still don’t see a basemap: confirm <code>frontend/public/world-map.png</code> exists and restart Next dev
          server.
        </div>
      </div>
    </div>
  );
}
