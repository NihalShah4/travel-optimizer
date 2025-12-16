from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple
import requests


OSRM_BASE_URL = "https://router.project-osrm.org"


@dataclass(frozen=True)
class RouteResult:
    distance_km: float
    duration_min: float
    mode: str


def route_driving(
    start: Tuple[float, float],
    end: Tuple[float, float],
    timeout_s: int = 12,
) -> RouteResult:
    """
    Calls OSRM public demo server to compute driving route.
    start/end are (lat, lon).
    Returns distance (km) and duration (minutes).
    """
    start_lat, start_lon = start
    end_lat, end_lon = end

    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/"
        f"{start_lon},{start_lat};{end_lon},{end_lat}"
    )
    params = {"overview": "false"}

    resp = requests.get(url, params=params, timeout=timeout_s)
    resp.raise_for_status()

    data = resp.json()
    routes = data.get("routes") or []
    if not routes:
        raise ValueError("OSRM returned no routes")

    r0 = routes[0]
    distance_m = float(r0["distance"])
    duration_s = float(r0["duration"])

    return RouteResult(
        distance_km=round(distance_m / 1000.0, 1),
        duration_min=round(duration_s / 60.0, 1),
        mode="driving_osrm",
    )
