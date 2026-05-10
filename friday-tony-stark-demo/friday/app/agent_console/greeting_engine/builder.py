from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from friday.runtime_context import RuntimeLocation

from .periods import resolve_day_period
from .suggestions import get_lifestyle_suggestion, get_meal_suggestion, get_schedule_question
from .weather import WeatherContext


@dataclass(frozen=True, slots=True)
class GreetingPayload:
    message: str
    weather_summary: str | None


def build_greeting_payload(
    *,
    now: datetime,
    location: RuntimeLocation,
    weather: WeatherContext,
) -> GreetingPayload:
    period = resolve_day_period(now.time())
    schedule_question = get_schedule_question(period.name)
    lifestyle_suggestion = get_lifestyle_suggestion(period.name, weather.mood)
    meal_suggestion = get_meal_suggestion(period.name)

    parts = [
        f"Chào {period.label}, sếp.",
        f"Bây giờ là {now.hour:02d} giờ {now.minute:02d}.",
        f"Em đang sẵn sàng đồng hành cho phiên làm việc này, với ngữ cảnh vị trí hiện tại là {location.display_name}.",
    ]

    if weather.summary:
        parts.append(weather.summary)
    else:
        parts.append("Em chưa lấy được thời tiết chi tiết lúc này, nên mình sẽ dùng nhịp làm việc an toàn và linh hoạt hơn.")

    parts.extend([schedule_question, lifestyle_suggestion, meal_suggestion])

    return GreetingPayload(
        message=" ".join(parts),
        weather_summary=weather.summary,
    )
