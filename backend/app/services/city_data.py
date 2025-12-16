# backend/app/services/city_data.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

LatLon = Tuple[float, float]


@dataclass(frozen=True)
class City:
    name: str
    lat: float
    lon: float


# Canonical country names used by the app
# Add more anytime, but keep keys consistent.
COUNTRY_TO_CITIES: Dict[str, List[City]] = {
    "India": [
        City("Delhi", 28.6139, 77.2090),
        City("Mumbai", 19.0760, 72.8777),
        City("Bengaluru", 12.9716, 77.5946),
        City("Kolkata", 22.5726, 88.3639),
    ],
    "United Arab Emirates": [
        City("Dubai", 25.2048, 55.2708),
        City("Abu Dhabi", 24.4539, 54.3773),
    ],
    "United States": [
        City("New York", 40.7128, -74.0060),
        City("Washington DC", 38.9072, -77.0369),
        City("Chicago", 41.8781, -87.6298),
        City("Los Angeles", 34.0522, -118.2437),
    ],
    "United Kingdom": [
        City("London", 51.5074, -0.1278),
        City("Manchester", 53.4808, -2.2426),
        City("Edinburgh", 55.9533, -3.1883),
    ],
    "France": [
        City("Paris", 48.8566, 2.3522),
        City("Lyon", 45.7640, 4.8357),
        City("Nice", 43.7102, 7.2620),
        City("Marseille", 43.2965, 5.3698),
    ],
    "Italy": [
        City("Rome", 41.9028, 12.4964),
        City("Milan", 45.4642, 9.1900),
        City("Florence", 43.7696, 11.2558),
        City("Venice", 45.4408, 12.3155),
        City("Naples", 40.8518, 14.2681),
    ],
    "Germany": [
        City("Berlin", 52.5200, 13.4050),
        City("Munich", 48.1351, 11.5820),
        City("Frankfurt", 50.1109, 8.6821),
    ],
    "Austria": [
        City("Vienna", 48.2082, 16.3738),
        City("Salzburg", 47.8095, 13.0550),
    ],
    "Spain": [
        City("Madrid", 40.4168, -3.7038),
        City("Barcelona", 41.3851, 2.1734),
        City("Seville", 37.3891, -5.9845),
    ],
    "Greece": [
        City("Athens", 37.9838, 23.7275),
        City("Thessaloniki", 40.6401, 22.9444),
    ],
}


# Aliases accepted from UI (users will type these)
ALIASES: Dict[str, str] = {
    "UAE": "United Arab Emirates",
    "United Arab Emirates": "United Arab Emirates",
    "USA": "United States",
    "US": "United States",
    "United States of America": "United States",
    "UK": "United Kingdom",
    "Great Britain": "United Kingdom",
}


def canonical_country(name: str) -> str:
    n = (name or "").strip()
    if not n:
        return n
    return ALIASES.get(n, n)


def supported_countries() -> List[str]:
    return sorted(COUNTRY_TO_CITIES.keys())


def pick_hub_city(country: str) -> City:
    c = canonical_country(country)
    cities = COUNTRY_TO_CITIES.get(c)
    if not cities:
        # Safe fallback, but should never happen if UI uses /countries
        return City(f"{c} City", 0.0, 0.0)
    return cities[0]
