# backend/app/services/city_catalog.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import random


# Curated v1 catalog: expand as you like.
# Keep country names EXACTLY as the frontend sends (ex: "United States", not "USA").
COUNTRY_CITIES: Dict[str, List[str]] = {
    "United States": ["New York", "Boston", "Washington DC", "Chicago", "Miami", "Los Angeles", "San Francisco"],
    "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary"],
    "Mexico": ["Mexico City", "Guadalajara", "Cancun"],
    "United Kingdom": ["London", "Edinburgh", "Manchester", "Bath"],
    "Ireland": ["Dublin", "Galway", "Cork"],
    "France": ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux", "Strasbourg"],
    "Italy": ["Rome", "Florence", "Venice", "Milan", "Naples", "Bologna"],
    "Spain": ["Barcelona", "Madrid", "Valencia", "Seville", "Granada"],
    "Portugal": ["Lisbon", "Porto", "Faro"],
    "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
    "Netherlands": ["Amsterdam", "Rotterdam", "Utrecht"],
    "Belgium": ["Brussels", "Bruges", "Antwerp"],
    "Switzerland": ["Zurich", "Geneva", "Lucerne"],
    "Austria": ["Vienna", "Salzburg", "Innsbruck"],
    "Greece": ["Athens", "Thessaloniki", "Santorini"],
    "Turkey": ["Istanbul", "Cappadocia", "Izmir"],
    "India": ["Delhi", "Mumbai", "Bengaluru", "Jaipur", "Goa"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi"],
    "Singapore": ["Singapore"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket"],
    "Japan": ["Tokyo", "Kyoto", "Osaka"],
    "South Korea": ["Seoul", "Busan"],
    "Australia": ["Sydney", "Melbourne", "Brisbane"],
    "New Zealand": ["Auckland", "Queenstown", "Wellington"],
}


# Optional “bridge” logic to avoid weird jumps.
# If someone goes Spain -> Italy, it's realistic to pass through France.
# If Germany -> Austria, no bridge needed.
COUNTRY_BRIDGES: Dict[Tuple[str, str], List[str]] = {
    ("Spain", "Italy"): ["France"],
    ("Portugal", "Italy"): ["Spain", "France"],
    ("United Kingdom", "Italy"): ["France"],
    ("United Kingdom", "Greece"): ["Italy"],
    ("Germany", "Greece"): ["Austria", "Italy"],
    ("France", "Greece"): ["Italy"],
    ("India", "United States"): ["United States"],  # keeps it sane; effectively "US cities only"
}

@dataclass(frozen=True)
class CitySelection:
    start_city: str
    end_city: str
    candidates: List[str]          # includes start + end + mid cities (deduped)
    bridge_countries: List[str]    # what we used in between


def _unique_keep_order(items: List[str]) -> List[str]:
    seen = set()
    out: List[str] = []
    for x in items:
        k = x.strip().lower()
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(x.strip())
    return out


def get_country_cities(country: str) -> List[str]:
    return COUNTRY_CITIES.get(country.strip(), [])


def choose_city_pair(
    from_country: str,
    to_country: str,
    rng: Optional[random.Random] = None,
) -> Tuple[str, str]:
    """
    Picks a reasonable start and end city for the countries.
    Defaults to first city if randomness not available.
    """
    rng = rng or random.Random()

    from_list = get_country_cities(from_country)
    to_list = get_country_cities(to_country)

    if not from_list:
        raise ValueError(f"No cities configured for from_country='{from_country}'")
    if not to_list:
        raise ValueError(f"No cities configured for to_country='{to_country}'")

    start = rng.choice(from_list)
    end = rng.choice(to_list)

    # If same country, make sure start != end when possible
    if from_country.strip().lower() == to_country.strip().lower():
        if len(from_list) > 1:
            attempts = 0
            while end == start and attempts < 10:
                end = rng.choice(to_list)
                attempts += 1

    return start, end


def build_city_candidates(
    from_country: str,
    to_country: str,
    max_cities: int,
    rng: Optional[random.Random] = None,
) -> CitySelection:
    """
    Creates a candidate city list:
    - start city from from_country
    - end city from to_country
    - mid cities sampled from from/to + bridge countries
    Deduped and capped by max_cities.
    """
    rng = rng or random.Random()

    bridge = COUNTRY_BRIDGES.get((from_country, to_country), [])
    # If reverse pair exists, use it too
    if not bridge:
        bridge = COUNTRY_BRIDGES.get((to_country, from_country), [])

    countries_pool = [from_country] + bridge + [to_country]

    start_city, end_city = choose_city_pair(from_country, to_country, rng=rng)

    pool: List[str] = []
    for c in countries_pool:
        pool.extend(get_country_cities(c))

    pool = _unique_keep_order(pool)

    # Ensure start/end present
    base = [start_city, end_city]
    remaining = [c for c in pool if c not in base]

    # pick mid cities
    target = max(2, int(max_cities))  # at least start/end
    target = min(target, len(base) + len(remaining))

    mid_needed = max(0, target - len(base))
    mid = rng.sample(remaining, k=mid_needed) if mid_needed <= len(remaining) else remaining

    candidates = _unique_keep_order([start_city] + mid + [end_city])

    return CitySelection(
        start_city=start_city,
        end_city=end_city,
        candidates=candidates,
        bridge_countries=bridge,
    )
