from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


def now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


@dataclass(slots=True)
class UserPreference:
    preferred_name: str | None = None
    addressing_style: str | None = None
    preferred_language: str | None = None
    preferred_response_length: str | None = None
    preferred_tone: str | None = None
    updated_at: float = field(default_factory=now_ts)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class SessionTurn:
    user_message: str
    assistant_message: str
    timestamp: float = field(default_factory=now_ts)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class SessionMemory:
    session_id: str
    user_id: str | None = None
    turns: list[SessionTurn] = field(default_factory=list)
    summary: str = ""
    created_at: float = field(default_factory=now_ts)
    last_updated: float = field(default_factory=now_ts)

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["turns"] = [turn.to_dict() for turn in self.turns]
        return payload


@dataclass(slots=True)
class UserMemory:
    user_id: str
    preference: UserPreference = field(default_factory=UserPreference)
    interests: list[str] = field(default_factory=list)
    habits: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    created_at: float = field(default_factory=now_ts)
    last_updated: float = field(default_factory=now_ts)

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["preference"] = self.preference.to_dict()
        return payload


@dataclass(slots=True)
class ExtractedSignal:
    preferred_name: str | None = None
    addressing_style: str | None = None
    preferred_language: str | None = None
    preferred_response_length: str | None = None
    preferred_tone: str | None = None
    interests: list[str] = field(default_factory=list)
    habits: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    confidence: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

