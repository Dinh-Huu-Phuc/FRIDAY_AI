from __future__ import annotations

import re
from typing import Any

from friday.runtime_context import build_runtime_context_snapshot

from ..config import TrainModelConfig, build_default_config
from ..emotion_math import build_utterance_embedding, compute_entropy
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
            "session_emotion_vector": session_memory.current_emotion_vector,
            "session_mood": session_memory.session_mood,
            "session_entropy": session_memory.last_entropy,
            "recent_turns": [
                {
                    "user_message": turn.user_message,
                    "assistant_message": turn.assistant_message,
                    "timestamp": turn.timestamp,
                }
                for turn in session_memory.turns[-5:]
            ],
            "user_preference": user_memory.preference.to_dict() if user_memory else {},
            "project_memory": user_memory.project_memory.to_dict() if user_memory else {},
            "task_memory": user_memory.task_memory.to_dict() if user_memory else {},
            "user_style_embedding": user_memory.style_embedding if user_memory else [],
            "user_style_projection": user_memory.style_projection if user_memory else {},
            "user_interests": user_memory.interests if user_memory else [],
            "user_habits": user_memory.habits if user_memory else [],
            "user_notes": user_memory.notes[-10:] if user_memory else [],
            "runtime_context": build_runtime_context_snapshot(),
        }

    def build_instruction_prefix(self, session_id: str, user_id: str | None = None) -> str:
        context = self.load_memory_for_response(session_id, user_id)
        pref = context["user_preference"]
        project = context["project_memory"]
        tasks = context["task_memory"]
        runtime_context = context["runtime_context"]
        has_stable_memory = False

        lines = ["[WORKING_CONTEXT]"]
        lines.append("- assistant_role: Friday, technical personal assistant")
        lines.append(f"- device_model: {runtime_context['device_model']}")
        lines.append(
            f"- effective_location: {runtime_context['location_display']} "
            f"(source={runtime_context['location_source']})"
        )
        lines.append(
            "- weather_rule: always mention the location in weather and daily briefing replies; "
            "if fresh weather data is unavailable, say so clearly"
        )
        lines.append(
            "- fixed_focus: prioritize memory, task tracking, project analysis, planning, and daily briefing"
        )
        lines.append("")
        lines.append("[USER_MEMORY]")
        if pref.get("preferred_name"):
            lines.append(f"- preferred_name: {pref['preferred_name']}")
            has_stable_memory = True
        if pref.get("addressing_style"):
            lines.append(f"- addressing_style: {pref['addressing_style']}")
            has_stable_memory = True
        if pref.get("preferred_language"):
            lines.append(f"- preferred_language: {pref['preferred_language']}")
            has_stable_memory = True
        if pref.get("preferred_response_length"):
            lines.append(f"- preferred_response_length: {pref['preferred_response_length']}")
            has_stable_memory = True
        if pref.get("preferred_tone"):
            lines.append(f"- preferred_tone: {pref['preferred_tone']}")
            has_stable_memory = True

        if context["user_interests"]:
            lines.append("- interests: " + ", ".join(context["user_interests"][-8:]))
            has_stable_memory = True
        if context["user_habits"]:
            lines.append("- habits: " + ", ".join(context["user_habits"][-8:]))
            has_stable_memory = True
        if context["user_notes"]:
            lines.append("- useful_notes: " + " | ".join(context["user_notes"][-6:]))
            has_stable_memory = True

        lines.append("")
        lines.append("[PROJECT_MEMORY]")
        if project.get("active_projects"):
            lines.append("- active_projects: " + " | ".join(project["active_projects"][-6:]))
            has_stable_memory = True
        if project.get("technical_decisions"):
            lines.append("- technical_decisions: " + " | ".join(project["technical_decisions"][-6:]))
            has_stable_memory = True
        if project.get("project_notes"):
            lines.append("- project_notes: " + " | ".join(project["project_notes"][-6:]))
            has_stable_memory = True

        lines.append("")
        lines.append("[TASK_MEMORY]")
        if tasks.get("active_tasks"):
            lines.append("- active_tasks: " + " | ".join(tasks["active_tasks"][-8:]))
            has_stable_memory = True
        if tasks.get("paused_tasks"):
            lines.append("- paused_tasks: " + " | ".join(tasks["paused_tasks"][-6:]))
            has_stable_memory = True
        if tasks.get("blockers"):
            lines.append("- blockers: " + " | ".join(tasks["blockers"][-6:]))
            has_stable_memory = True
        if tasks.get("next_steps"):
            lines.append("- suggested_next_steps: " + " | ".join(tasks["next_steps"][-6:]))
            has_stable_memory = True

        lines.append("")
        lines.append("[SESSION_MEMORY]")
        if context["session_summary"]:
            lines.append(f"- recent_session_summary: {context['session_summary']}")
            has_stable_memory = True
        if context["session_mood"]:
            mood_summary = ", ".join(
                f"{label}={score:.2f}"
                for label, score in sorted(context["session_mood"].items(), key=lambda item: item[1], reverse=True)[:3]
            )
            lines.append(f"- session_mood: {mood_summary}")
            has_stable_memory = True
        if context["session_entropy"] is not None:
            lines.append(f"- emotion_entropy: {float(context['session_entropy']):.4f}")
            has_stable_memory = True
        if context["user_style_projection"]:
            style_summary = ", ".join(
                f"{label}={score:.2f}"
                for label, score in sorted(context["user_style_projection"].items(), key=lambda item: item[1], reverse=True)[:3]
            )
            lines.append(f"- long_term_style_projection: {style_summary}")
            has_stable_memory = True

        if not has_stable_memory:
            lines.append("- no_stable_memory_detected_yet")
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
        active_metadata = dict(metadata or {})
        if "utterance_embedding" not in active_metadata:
            active_metadata["utterance_embedding"] = build_utterance_embedding(
                safe_user_message,
                dimensions=self.config.emotion_embedding_dimensions,
            )
        if isinstance(active_metadata.get("emotion_vector"), dict) and "emotion_entropy" not in active_metadata:
            active_metadata["emotion_entropy"] = compute_entropy(
                {str(key): float(value) for key, value in dict(active_metadata["emotion_vector"]).items()},
                epsilon=self.config.emotion_entropy_epsilon,
            )
        session_memory = self.session_service.append_turn(
            session_id=session_id,
            user_id=user_id,
            user_message=safe_user_message,
            assistant_message=safe_assistant_message,
            metadata=active_metadata,
        )

        if user_id:
            signal = self.extractor.extract(safe_user_message, safe_assistant_message)
            if signal.confidence >= 0.2:
                self.user_service.update_from_signal(user_id, signal)
            embedding = active_metadata.get("utterance_embedding")
            if isinstance(embedding, list) and embedding:
                self.user_service.update_style_memory(user_id, [float(item) for item in embedding])
            if len(session_memory.turns) >= 6:
                self.user_service.merge_session_memory(user_id, session_memory)

    def load_emotion_context(self, session_id: str, user_id: str | None = None) -> dict[str, Any]:
        session_memory = self.session_service.load(session_id)
        user_memory = self.user_service.load(user_id) if user_id else None
        return {
            "session_emotion_vector": dict(session_memory.current_emotion_vector),
            "session_mood": dict(session_memory.session_mood),
            "session_entropy": session_memory.last_entropy,
            "last_utterance_embedding": list(session_memory.last_utterance_embedding),
            "user_style_embedding": list(user_memory.style_embedding) if user_memory else [],
            "user_style_projection": dict(user_memory.style_projection) if user_memory else {},
        }

    def update_emotion_state(
        self,
        *,
        session_id: str,
        user_id: str | None,
        user_message: str,
        emotion_vector: dict[str, float],
        utterance_embedding: list[float] | None = None,
        entropy: float | None = None,
    ) -> dict[str, Any]:
        embedding = utterance_embedding or build_utterance_embedding(
            user_message,
            dimensions=self.config.emotion_embedding_dimensions,
        )
        entropy_value = entropy
        if entropy_value is None:
            entropy_value = compute_entropy(emotion_vector, epsilon=self.config.emotion_entropy_epsilon)

        session_memory = self.session_service.update_emotion_state(
            session_id,
            emotion_vector=emotion_vector,
            entropy=entropy_value,
            utterance_embedding=embedding,
        )
        user_memory = self.user_service.update_style_memory(user_id, embedding) if user_id else None
        return {
            "session_emotion_vector": dict(session_memory.current_emotion_vector),
            "session_mood": dict(session_memory.session_mood),
            "session_entropy": session_memory.last_entropy,
            "user_style_embedding": list(user_memory.style_embedding) if user_memory else [],
            "user_style_projection": dict(user_memory.style_projection) if user_memory else {},
            "utterance_embedding": list(embedding),
        }

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
