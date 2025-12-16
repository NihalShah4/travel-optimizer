# backend/app/services/geo.py
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class GeoRouteResult:
    distance_km: float
    duration_min: float
    mode: str


LatLon = Tuple[float, float]


def haversine_km(a: LatLon, b: LatLon) -> float:
    lat1, lon1 = a
    lat2, lon2 = b
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    x = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(x))


def minutes_to_hm(mins: float) -> str:
    m = max(0, int(round(mins)))
    h = m // 60
    mm = m % 60
    return f"{h}h {mm}m" if h else f"{mm}m"


def estimate_duration_min(
    distance_km: float,
    pace: str,
    mode: str,
    flight_overhead_min: float,
    border_overhead_min: float,
) -> float:
    """
    Modes:
      - stay: 0
      - estimated_geo: driving-ish
      - flight: faster but overhead
    """
    if mode == "stay":
        return 0.0

    pace = (pace or "balanced").lower().strip()
    # ground speeds (km/h)
    ground_speed = {"relaxed": 70.0, "balanced": 90.0, "packed": 110.0}.get(pace, 90.0)

    # flight speeds (km/h)
    flight_speed = {"relaxed": 650.0, "balanced": 750.0, "packed": 850.0}.get(pace, 750.0)

    if mode == "flight":
        hours = distance_km / max(flight_speed, 1.0)
        mins = hours * 60.0
        mins += flight_overhead_min + border_overhead_min
        return mins

    # estimated_geo
    hours = distance_km / max(ground_speed, 1.0)
    mins = hours * 60.0
    mins *= 1.10  # buffer
    mins += border_overhead_min
    return mins


def route_estimate(
    a: LatLon,
    b: LatLon,
    pace: str = "balanced",
    flight_threshold_km: float = 1500.0,
    flight_overhead_min: float = 120.0,   # airport/security + transfer
    border_overhead_min: float = 30.0,    # immigration/border friction
    same_place_min_overhead: float = 0.0,
) -> GeoRouteResult:
    dist = haversine_km(a, b)

    # Same exact coordinate -> stay
    if dist < 1e-6:
        return GeoRouteResult(distance_km=0.0, duration_min=same_place_min_overhead, mode="stay")

    mode = "flight" if dist >= flight_threshold_km else "estimated_geo"
    dur_min = estimate_duration_min(
        distance_km=dist,
        pace=pace,
        mode=mode,
        flight_overhead_min=flight_overhead_min,
        border_overhead_min=border_overhead_min,
    )

    return GeoRouteResult(
        distance_km=round(dist, 1),
        duration_min=round(dur_min, 1),
        mode=mode,
    )
