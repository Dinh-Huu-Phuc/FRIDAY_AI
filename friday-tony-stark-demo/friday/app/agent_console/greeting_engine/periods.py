from __future__ import annotations

from dataclasses import dataclass
from datetime import time
from typing import Literal

DayPeriodName = Literal["morning", "noon", "afternoon", "evening", "night"]


@dataclass(frozen=True, slots=True)
class DayPeriod:
    name: DayPeriodName
    label: str


def resolve_day_period(current_time: time) -> DayPeriod:
    hour = current_time.hour
    minute = current_time.minute
    total_minutes = hour * 60 + minute

    if 5 * 60 <= total_minutes <= 11 * 60 + 59:
        return DayPeriod(name="morning", label="buổi sáng")
    if 12 * 60 <= total_minutes <= 13 * 60 + 30:
        return DayPeriod(name="noon", label="buổi trưa")
    if 13 * 60 + 31 <= total_minutes <= 17 * 60 + 59:
        return DayPeriod(name="afternoon", label="buổi chiều")
    if 18 * 60 <= total_minutes <= 23 * 60 + 59:
        return DayPeriod(name="evening", label="buổi tối")
    return DayPeriod(name="night", label="buổi đêm")
