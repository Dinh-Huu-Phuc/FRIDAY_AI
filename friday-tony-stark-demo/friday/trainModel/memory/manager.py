from __future__ import annotations

import re
from typing import Any

from ..config import TrainModelConfig, build_default_config
from .extractor import MemoryExtractor
from .session_memory import SessionMemoryService
from .store import MemoryStore
from .user_memory import UserMemoryService


class MemoryManager:
    """
    Runtime memory manager for short-term session memory and long-term user memory.
    """

    EMAIL_PATTERN = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")
    PHONE_PATTERN = re.compile(r"\b(?:\+?\d{1,3})?[-.\s]?(?:\d[-.\s]?){8,12}\b")
    ID_PATTERN = re.compile(r"\b\d{9,12}\b")

    def __init__(self, config: TrainModelConfig | None = None) -> None:
        self.config = config or build_default_config()
        self.store = MemoryStore(self.config)
        self.session_service = SessionMemoryService(self.config, self.store)
        self.user_service = UserMemoryService(self.config, self.store)
        self.extractor = MemoryExtractor()

    def load_memory_for_response(self, session_id: str, user_id: str | None = None) -> dict[str, Any]:
        session_memory = self.session_service.load(session_id)
        user_memory = self.user_service.load(user_id) if user_id else None

        return {
            "session_id": session_id,
            "user_id": user_id,
            "session_summary": session_memory.summary,
            "recent_turns": [
                {
                    "user_message": turn.user_message,
                    "assistant_message": turn.assistant_message,
                    "timestamp": turn.timestamp,
                }
                for turn in session_memory.turns[-5:]
            ],
            "user_preference": user_memory.preference.to_dict() if user_memory else {},
            "user_interests": user_memory.interests if user_memory else [],
            "user_habits": user_memory.habits if user_memory else [],
            "user_notes": user_memory.notes[-10:] if user_memory else [],
        }

    def build_instruction_prefix(self, session_id: str, user_id: str | None = None) -> str:
        context = self.load_memory_for_response(session_id, user_id)
        pref = context["user_preference"]

        lines = ["[MEMORY_CONTEXT]"]
        if pref.get("preferred_name"):
            lines.append(f"- preferred_name: {pref['preferred_name']}")
        if pref.get("addressing_style"):
            lines.append(f"- addressing_style: {pref['addressing_style']}")
        if pref.get("preferred_language"):
            lines.append(f"- preferred_language: {pref['preferred_language']}")
        if pref.get("preferred_response_length"):
            lines.append(f"- preferred_response_length: {pref['preferred_response_length']}")
        if pref.get("preferred_tone"):
            lines.append(f"- preferred_tone: {pref['preferred_tone']}")

        if context["user_interests"]:
            lines.append("- interests: " + ", ".join(context["user_interests"][-8:]))
        if context["user_habits"]:
            lines.append("- habits: " + ", ".join(context["user_habits"][-8:]))
        if context["session_summary"]:
            lines.append(f"- recent_session_summary: {context['session_summary']}")

        if len(lines) == 1:
            lines.append("- no_preference_detected")
        return "\n".join(lines)

    def update_memory_after_response(
        self,
        session_id: str,
        user_id: str | None,
        user_message: str,
        assistant_message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        safe_user_message = self._sanitize_for_memory(user_message)
        safe_assistant_message = self._sanitize_for_memory(assistant_message)
        session_memory = self.session_service.append_turn(
            session_id=session_id,
            user_id=user_id,
            user_message=safe_user_message,
            assistant_message=safe_assistant_message,
            metadata=metadata or {},
        )

        if user_id:
            signal = self.extractor.extract(safe_user_message, safe_assistant_message)
            if signal.confidence >= 0.2:
                self.user_service.update_from_signal(user_id, signal)
            if len(session_memory.turns) >= 6:
                self.user_service.merge_session_memory(user_id, session_memory)

    def merge_session_to_user(self, session_id: str, user_id: str) -> None:
        session_memory = self.session_service.load(session_id)
        self.user_service.merge_session_memory(user_id, session_memory)

    def forget_user_data(self, user_id: str) -> None:
        self.user_service.forget_user(user_id)

    def prune_expired_sessions(self) -> list[str]:
        return self.session_service.prune_expired_sessions()

    def _sanitize_for_memory(self, text: str) -> str:
        value = str(text or "").strip()
        value = self.EMAIL_PATTERN.sub("[REDACTED_EMAIL]", value)
        value = self.PHONE_PATTERN.sub("[REDACTED_PHONE]", value)
        value = self.ID_PATTERN.sub("[REDACTED_ID]", value)
        if len(value) > self.config.memory_max_text_chars:
            return value[: self.config.memory_max_text_chars]
        return value

