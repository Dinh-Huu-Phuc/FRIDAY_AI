"""
Weather search helper powered by OpenWeatherMap.
"""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
from .city_name import resolve_vietnam_city

load_dotenv()

GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/direct"
CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"


def _get_api_key() -> str:
    return (
        os.getenv("WEATHERMAP_API_KEY", "").strip()
        or os.getenv("OPENWEATHERMAP_API_KEY", "").strip()
    )


def _is_vietnam_country(country: str) -> bool:
    normalized = _normalize_text(country)
    return normalized in {"", "vn", "vietnam", "viet nam"}


def _normalize_text(value: str) -> str:
    return (value or "").strip().casefold()


def _pick_best_location(results: list[dict[str, Any]], city: str, country: str) -> dict[str, Any]:
    if not results:
        return {}

    wanted_city = _normalize_text(city)
    wanted_country = _normalize_text(country)

    def score(item: dict[str, Any]) -> tuple[int, int]:
        name = _normalize_text(str(item.get("name", "")))
        state = _normalize_text(str(item.get("state", "")))
        country_code = _normalize_text(str(item.get("country", "")))
        local_names = item.get("local_names") or {}
        aliases = [_normalize_text(str(v)) for v in local_names.values()]

        city_score = 0
        if wanted_city and (name == wanted_city or wanted_city in aliases):
            city_score = 3
        elif wanted_city and wanted_city in name:
            city_score = 2

        country_score = 0
        if not wanted_country:
            country_score = 1
        elif wanted_country in {state, country_code}:
            country_score = 3
        elif wanted_country and wanted_country in " ".join([state, country_code] + aliases):
            country_score = 2

        return (city_score, country_score)

    return max(results, key=score)


def _format_location(place: dict[str, Any], fallback_city: str, fallback_country: str) -> str:
    parts = [place.get("name") or fallback_city]
    state = place.get("state")
    country = place.get("country") or fallback_country

    if state:
        parts.append(state)
    if country:
        parts.append(country)

    return ", ".join(str(part).strip() for part in parts if str(part).strip())


def _format_number(value: Any, digits: int = 1) -> str:
    if value is None:
        return "chưa rõ"
    number = round(float(value), digits)
    if digits == 0 or number.is_integer():
        return str(int(number))
    return f"{number:.{digits}f}"


def _to_local_time(unix_ts: int, timezone_offset_seconds: int) -> str:
    tz = timezone(timedelta(seconds=timezone_offset_seconds))
    return datetime.fromtimestamp(unix_ts, tz=tz).strftime("%H:%M")


def _build_forecast_summary(forecast_items: list[dict[str, Any]], timezone_offset_seconds: int) -> str:
    if not forecast_items:
        return "Tôi chưa lấy được dữ liệu dự báo ngắn hạn."

    snippets: list[str] = []
    for item in forecast_items[:3]:
        weather = (item.get("weather") or [{}])[0]
        main = item.get("main") or {}
        pop = item.get("pop")
        rain_text = ""
        if pop is not None and float(pop) >= 0.2:
            rain_text = f", khả năng mưa {round(float(pop) * 100)}%"

        snippets.append(
            f"{_to_local_time(int(item.get('dt', 0)), timezone_offset_seconds)}: "
            f"{weather.get('description', 'thời tiết chưa rõ')}, "
            f"{_format_number(main.get('temp'))}°C{rain_text}"
        )

    return "; ".join(snippets)


def _format_weather_error(exc: Exception) -> str:
    message = " ".join(str(part).strip() for part in exc.args if str(part).strip()) or str(exc).strip()
    lower = message.lower()

    if "401" in lower or "403" in lower or "invalid api key" in lower:
        return "Tôi chưa thể tra thời tiết vì WEATHERMAP_API_KEY hiện không hợp lệ hoặc chưa được cấp quyền."

    if "timed out" in lower or "timeout" in lower:
        return "Tôi chưa thể tra thời tiết vì kết nối tới dịch vụ thời tiết đang bị timeout."

    if (
        "10013" in lower
        or "forbidden by its access permissions" in lower
        or "socket" in lower and "forbidden" in lower
    ):
        return "Tôi chưa thể tra thời tiết vì tiến trình hiện tại đang bị chặn kết nối mạng ra ngoài."

    if (
        "getaddrinfo failed" in lower
        or "temporary failure in name resolution" in lower
        or "name or service not known" in lower
    ):
        return "Tôi chưa thể tra thời tiết vì máy hiện không phân giải được DNS hoặc chưa ra internet."

    return f"Tôi chưa lấy được dữ liệu thời tiết lúc này: {message}"


async def get_weather_report(city: str, country: str = "Vietnam") -> str:
    """
    Fetch current weather and short-term forecast using OpenWeatherMap.
    """
    city = (city or "").strip()
    country = (country or "").strip()
    if not city:
        return "Bạn chưa cung cấp tên thành phố để tra cứu thời tiết."

    api_key = _get_api_key()
    if not api_key:
        return "Thiếu WEATHERMAP_API_KEY trong tệp .env nên tôi chưa thể tra thời tiết."

    query = city if not country else f"{city},{country}"
    place: dict[str, Any] | None = None
    lat = None
    lon = None

    if _is_vietnam_country(country):
        local_city = resolve_vietnam_city(city)
        if local_city:
            place = {
                "name": local_city.get("display_name") or local_city.get("name") or city,
                "state": local_city.get("state") or "",
                "country": local_city.get("country") or "VN",
            }
            lat = local_city.get("lat")
            lon = local_city.get("lon")

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            if lat is None or lon is None:
                geo_response = await client.get(
                    GEOCODE_URL,
                    params={"q": query, "limit": 5, "appid": api_key},
                )
                geo_response.raise_for_status()
                geo_results = geo_response.json() or []

                if not geo_results and country:
                    geo_response = await client.get(
                        GEOCODE_URL,
                        params={"q": city, "limit": 5, "appid": api_key},
                    )
                    geo_response.raise_for_status()
                    geo_results = geo_response.json() or []

                if not geo_results:
                    return f"Tôi chưa tìm thấy địa điểm '{city}' để tra thời tiết."

                geocoded_place = _pick_best_location(geo_results, city=city, country=country)
                lat = geocoded_place.get("lat")
                lon = geocoded_place.get("lon")
                if lat is None or lon is None:
                    return f"Tôi đã tìm thấy '{city}' nhưng chưa lấy được toạ độ để tra thời tiết."

                place = geocoded_place

            current_task = client.get(
                CURRENT_WEATHER_URL,
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": api_key,
                    "units": "metric",
                    "lang": "vi",
                },
            )
            forecast_task = client.get(
                FORECAST_URL,
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": api_key,
                    "units": "metric",
                    "lang": "vi",
                    "cnt": 3,
                },
            )
            current_response, forecast_response = await asyncio.gather(current_task, forecast_task)
            current_response.raise_for_status()
            forecast_response.raise_for_status()
    except Exception as exc:
        return _format_weather_error(exc)

    current_data = current_response.json() or {}
    forecast_data = forecast_response.json() or {}

    current_main = current_data.get("main") or {}
    current_weather = (current_data.get("weather") or [{}])[0]
    current_wind = current_data.get("wind") or {}
    location_text = _format_location(place or {}, fallback_city=city, fallback_country=country)
    timezone_offset = int(current_data.get("timezone") or forecast_data.get("city", {}).get("timezone") or 0)

    temp = _format_number(current_main.get("temp"))
    feels_like = _format_number(current_main.get("feels_like"))
    humidity = _format_number(current_main.get("humidity"), digits=0)
    wind_kmh = _format_number(float(current_wind.get("speed", 0)) * 3.6)
    description = current_weather.get("description", "thời tiết chưa xác định")

    forecast_items = forecast_data.get("list") or []
    forecast_summary = _build_forecast_summary(forecast_items, timezone_offset)

    return (
        f"Thời tiết hiện tại ở {location_text}: {description}, {temp}°C, "
        f"cảm giác như {feels_like}°C, độ ẩm {humidity}%, gió khoảng {wind_kmh} km/h. "
        f"Dự báo 9 giờ tới: {forecast_summary}."
    )
