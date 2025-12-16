from __future__ import annotations

import json
from pathlib import Path
from typing import List


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "country_cities.json"


def get_candidate_cities(country: str, limit: int = 5) -> List[str]:
    """
    Simple v1: return top cities for a country from a local JSON map.
    Later we can replace this with Wikivoyage API without changing routes.py.
    """
    country = (country or "").strip()
    if not country:
        return []

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing data file: {DATA_PATH}")

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    cities = data.get(country, [])

    cleaned: List[str] = []
    seen = set()
    for c in cities:
        c = str(c).strip()
        if c and c not in seen:
            cleaned.append(c)
            seen.add(c)

    return cleaned[: max(1, int(limit))]
