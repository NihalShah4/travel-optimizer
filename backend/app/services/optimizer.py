# backend/app/optimizer.py
from __future__ import annotations

from typing import List

from app.schemas import PlanRequest, PlanResponse, RouteLeg, ItineraryDay, CostBreakdown, MapPoint
from app.services.city_data import canonical_country, pick_hub_city
from app.services.geo import route_estimate


def _clean_chain(chain: List[str]) -> List[str]:
    out: List[str] = []
    for c in chain:
        cc = canonical_country(c)
        if not cc:
            continue
        if not out or out[-1] != cc:
            out.append(cc)
    return out


def build_plan(req: PlanRequest) -> PlanResponse:
    # Determine chain
    chain = req.country_chain if req.country_chain else [req.from_country, req.to_country]
    chain = _clean_chain(chain)

    # Convert countries -> hub cities
    hub_cities = [pick_hub_city(c) for c in chain]

    # Cities list for UI
    cities = [c.name for c in hub_cities]

    # Build route legs
    legs: List[RouteLeg] = []
    for i in range(len(hub_cities) - 1):
        a = hub_cities[i]
        b = hub_cities[i + 1]
        r = route_estimate(
            (a.lat, a.lon),
            (b.lat, b.lon),
            pace=req.pace,
            flight_threshold_km=1500.0,
            flight_overhead_min=120.0,
            border_overhead_min=30.0,
            same_place_min_overhead=0.0,
        )
        legs.append(
            RouteLeg(
                from_city=a.name,
                to_city=b.name,
                distance_km=r.distance_km,
                duration_min=r.duration_min,
                mode=r.mode,
                from_lat=a.lat,
                from_lon=a.lon,
                to_lat=b.lat,
                to_lon=b.lon,
                
            )
        )

    # Routing mode (headline)
    routing_mode = "mixed"
    if legs:
        modes = {l.mode for l in legs}
        if len(modes) == 1:
            routing_mode = next(iter(modes))
    else:
        routing_mode = "stay"

    # Simple cost model (you can tune later)
    # Keep deterministic and stable.
    total_days = max(1, (len(req.start_date) and len(req.end_date) and 8) or 8)  # UI already shows trip length
    travel_cost = 0.0
    for l in legs:
        if l.mode == "flight":
            travel_cost += 220.0
        elif l.mode == "estimated_geo":
            travel_cost += max(40.0, l.distance_km * 0.15)

    stay = max(0.0, req.budget_usd * 0.36)
    food = max(0.0, req.budget_usd * 0.13)
    activities = max(0.0, req.budget_usd * 0.03)
    travel = min(req.budget_usd * 0.20, travel_cost)
    total = min(req.budget_usd, travel + stay + food + activities)

    cost = CostBreakdown(
        travel=round(travel, 0),
        stay=round(stay, 0),
        food=round(food, 0),
        activities=round(activities, 0),
        total=round(total, 0),
    )

    # Itinerary (simple placeholder, stable)
    itinerary: List[ItineraryDay] = []
    day = 1
    for city in cities:
        itinerary.append(
            ItineraryDay(
                day=day,
                city=city,
                bullets=[
                    "Museum or landmark",
                    "Historic center",
                    "Local food spot",
                ],
            )
        )
        day += 1

    # Map points (one per city in order)
    map_points = [MapPoint(city=c.name, lat=c.lat, lon=c.lon) for c in hub_cities]

    return PlanResponse(
        cities=cities,
        route=legs,
        itinerary=itinerary,
        cost_breakdown=cost,
        estimated_total=cost.total,
        routing_mode=routing_mode,
        map_points=map_points,
    )
