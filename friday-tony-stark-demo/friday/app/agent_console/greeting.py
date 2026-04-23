from __future__ import annotations

from datetime import datetime

from friday.app.agent_console.schemas import ConsoleGreetingResponse
from friday.runtime_context import resolve_runtime_location
from friday.search import get_weather_snapshot


def _time_of_day_label(hour: int) -> str:
    if 5 <= hour < 11:
        return "bu\u1ed5i s\u00e1ng"
    if 11 <= hour < 13:
        return "bu\u1ed5i tr\u01b0a"
    if 13 <= hour < 18:
        return "bu\u1ed5i chi\u1ec1u"
    if 18 <= hour < 22:
        return "bu\u1ed5i t\u1ed1i"
    return "bu\u1ed5i \u0111\u00eam"


async def build_console_greeting() -> ConsoleGreetingResponse:
    now = datetime.now()
    location = resolve_runtime_location()
    weather_summary: str | None = None

    try:
        snapshot = await get_weather_snapshot(city=location.city, country=location.country)
    except Exception:
        snapshot = {"ok": False}

    if bool(snapshot.get("ok")):
        location_text = str(snapshot.get("location_text") or location.display_name)
        description = str(snapshot.get("description") or "th\u1eddi ti\u1ebft ch\u01b0a r\u00f5")
        temp = str(snapshot.get("temp") or "ch\u01b0a r\u00f5")
        weather_summary = (
            f"Th\u1eddi ti\u1ebft hi\u1ec7n t\u1ea1i \u1edf {location_text}: "
            f"{description}, {temp} \u0111\u1ed9 C."
        )

    greeting = (
        f"Ch\u00e0o {_time_of_day_label(now.hour)}, s\u1ebfp. "
        f"B\u00e2y gi\u1edd l\u00e0 {now.hour:02d} gi\u1edd {now.minute:02d}. "
        f"M\u00ecnh \u0111ang s\u1eb5n s\u00e0ng \u0111\u1ed3ng h\u00e0nh cho phi\u00ean l\u00e0m vi\u1ec7c n\u00e0y, "
        f"v\u1edbi ng\u1eef c\u1ea3nh v\u1ecb tr\u00ed hi\u1ec7n t\u1ea1i l\u00e0 {location.display_name}. "
    )

    if weather_summary:
        greeting = f"{greeting}{weather_summary} "

    greeting = f"{greeting}S\u1ebfp c\u00f3 c\u1ea7n m\u00ecnh b\u00e1o nhanh daily briefing kh\u00f4ng?"

    return ConsoleGreetingResponse(
        message=greeting,
        location=location.display_name,
        weather_summary=weather_summary,
        source="api",
    )
