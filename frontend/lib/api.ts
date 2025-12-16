// frontend/lib/api.ts
export type Pace = "relaxed" | "balanced" | "packed";

export type PlanRequest = {
  from_country: string;
  to_country: string;
  budget_usd: number;
  start_date: string;
  end_date: string;
  interests: string[];
  pace: Pace;
  country_chain?: string[];
};

export type MapPoint = { city: string; lat: number; lon: number };

export type RouteLeg = {
  from_city: string;
  to_city: string;
  distance_km: number;
  duration_min: number;
  mode: string;
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
};

export type PlanResponse = {
  cities: string[];
  route: RouteLeg[];
  itinerary: { day: number; city: string; bullets: string[] }[];
  cost_breakdown: { travel: number; stay: number; food: number; activities: number; total: number };
  estimated_total: number;
  routing_mode: string;
  map_points: MapPoint[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export async function fetchCountries(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/countries`);
  if (!res.ok) throw new Error("Failed to load countries");
  const data = await res.json();
  return data.countries || [];
}

export async function generatePlan(payload: PlanRequest): Promise<PlanResponse> {
  const res = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to generate plan");
  }
  return res.json();
}
