"""Intent matching for FRIDAY's background power state."""

from __future__ import annotations

import os
import re
from enum import Enum


class PowerIntent(str, Enum):
    NONE = "none"
    SLEEP = "sleep"
    WAKE = "wake"


def _normalize(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()
    return re.sub(r"\bwakeup\b", "wake up", normalized)


def _matches_phrase(message: str, phrase: str) -> bool:
    normalized_message = _normalize(message)
    normalized_phrase = _normalize(phrase)
    return bool(normalized_phrase) and normalized_message == normalized_phrase


def detect_power_intent(message: str) -> PowerIntent:
    if _matches_phrase(message, os.getenv("FRIDAY_SLEEP_PHRASE", "friday sleep")):
        return PowerIntent.SLEEP
    if _matches_phrase(message, os.getenv("FRIDAY_WAKE_PHRASE", "friday wake up")):
        return PowerIntent.WAKE
    return PowerIntent.NONE
