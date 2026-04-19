"""Runtime context helpers for FRIDAY's personal-assistant behavior."""

from __future__ import annotations

import os
from dataclasses import dataclass

DEVICE_MODEL = "ASUS TUF Gaming F15 FX506LI"
DEFAULT_LOCATION_CITY = "Da Lat"
DEFAULT_LOCATION_COUNTRY = "Vietnam"

LOCATION_CITY_ENV_CANDIDATES = (
    "FRIDAY_MACHINE_LOCATION",
    "FRIDAY_CURRENT_LOCATION",
    "FRIDAY_LOCATION_CITY",
)
LOCATION_COUNTRY_ENV_CANDIDATES = (
    "FRIDAY_MACHINE_COUNTRY",
    "FRIDAY_LOCATION_COUNTRY",
)


def _first_non_empty_env(names: tuple[str, ...]) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return ""


@dataclass(slots=True, frozen=True)
class RuntimeLocation:
    city: str
    country: str
    source: str

    @property
    def display_name(self) -> str:
        if self.country:
            return f"{self.city}, {self.country}"
        return self.city


def resolve_runtime_location() -> RuntimeLocation:
    city = _first_non_empty_env(LOCATION_CITY_ENV_CANDIDATES)
    country = _first_non_empty_env(LOCATION_COUNTRY_ENV_CANDIDATES)
    if city:
        return RuntimeLocation(
            city=city,
            country=country or DEFAULT_LOCATION_COUNTRY,
            source="environment",
        )
    return RuntimeLocation(
        city=DEFAULT_LOCATION_CITY,
        country=DEFAULT_LOCATION_COUNTRY,
        source="default",
    )


def build_runtime_context_snapshot() -> dict[str, str]:
    location = resolve_runtime_location()
    return {
        "assistant_name": "Friday",
        "device_model": DEVICE_MODEL,
        "location_city": location.city,
        "location_country": location.country,
        "location_display": location.display_name,
        "location_source": location.source,
    }
