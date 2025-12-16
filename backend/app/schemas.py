# backend/app/schemas.py
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Literal, Optional


Pace = Literal["relaxed", "balanced", "packed"]


class PlanRequest(BaseModel):
    from_country: str
    to_country: str
    budget_usd: float = Field(ge=0)
    start_date: str
    end_date: str
    interests: List[str] = []
    pace: Pace = "balanced"

    # New: explicit chain (optional)
    country_chain: Optional[List[str]] = None


class RouteLeg(BaseModel):
    from_city: str
    to_city: str
    distance_km: float
    duration_min: float
    mode: str

    from_lat: float
    from_lon: float
    to_lat: float
    to_lon: float


class ItineraryDay(BaseModel):
    day: int
    city: str
    bullets: List[str]


class CostBreakdown(BaseModel):
    travel: float
    stay: float
    food: float
    activities: float
    total: float


class MapPoint(BaseModel):
    city: str
    lat: float
    lon: float


class PlanResponse(BaseModel):
    cities: List[str]
    route: List[RouteLeg]
    itinerary: List[ItineraryDay]
    cost_breakdown: CostBreakdown
    estimated_total: float
    routing_mode: str

    map_points: List[MapPoint] = []
