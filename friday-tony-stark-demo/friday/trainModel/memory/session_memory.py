from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ..config import TrainModelConfig
from ..emotion_math import smooth_session_mood
from .schemas import SessionMemory, SessionTurn
from .store import MemoryStore


def _now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


class SessionMemoryService:
    """
    Manage short-term memory for each active session.
    """

    def __init__(self, config: TrainModelConfig, store: MemoryStore) -> None:
        self.config = config
        self.store = store

    def load(self, session_id: str) -> SessionMemory:
        payload = self.store.get_session_payload(session_id)
        if payload is None:
            return SessionMemory(session_id=session_id)

        turns = [
            SessionTurn(
                user_message=str(item.get("user_message", "")),
                assistant_message=str(item.get("assistant_message", "")),
                timestamp=float(item.get("timestamp", _now_ts())),
                metadata=dict(item.get("metadata", {})),
            )
            for item in payload.get("turns", [])
            if isinstance(item, dict)
        ]

        return SessionMemory(
            session_id=session_id,
            user_id=payload.get("user_id"),
            turns=turns,
            summary=str(payload.get("summary", "")),
            current_emotion_vector=dict(payload.get("current_emotion_vector", {})),
            session_mood=dict(payload.get("session_mood", {})),
            last_entropy=(
                float(payload["last_entropy"]) if payload.get("last_entropy") is not None else None
            ),
            last_utterance_embedding=[float(item) for item in payload.get("last_utterance_embedding", [])],
            created_at=float(payload.get("created_at", _now_ts())),
            last_updated=float(payload.get("last_updated", _now_ts())),
        )

    def append_turn(
        self,
        session_id: str,
        user_id: str | None,
        user_message: str,
        assistant_message: str,
        metadata: dict[str, Any] | None = None,
    ) -> SessionMemory:
        memory = self.load(session_id)
        memory.user_id = user_id or memory.user_id
        memory.turns.append(
            SessionTurn(
                user_message=self._truncate(user_message),
                assistant_message=self._truncate(assistant_message),
                metadata=dict(metadata or {}),
            )
        )
        if len(memory.turns) > self.config.memory_session_turn_limit:
            memory.turns = memory.turns[-self.config.memory_session_turn_limit :]

        active_metadata = dict(metadata or {})
        emotion_vector = active_metadata.get("emotion_vector")
        if isinstance(emotion_vector, dict):
            memory.current_emotion_vector = {str(key): float(value) for key, value in emotion_vector.items()}
            memory.session_mood = smooth_session_mood(
                memory.session_mood,
                memory.current_emotion_vector,
                alpha=self.config.emotion_session_alpha,
                labels=self.config.emotion_labels,
            )

        entropy_value = active_metadata.get("emotion_entropy")
        if entropy_value is not None:
            memory.last_entropy = float(entropy_value)

        embedding = active_metadata.get("utterance_embedding")
        if isinstance(embedding, list):
            memory.last_utterance_embedding = [float(item) for item in embedding]

        memory.summary = self._build_summary(memory)
        memory.last_updated = _now_ts()
        self.store.save_session_payload(session_id, memory.to_dict())
        return memory

    def update_emotion_state(
        self,
        session_id: str,
        *,
        emotion_vector: dict[str, float],
        entropy: float | None = None,
        utterance_embedding: list[float] | None = None,
    ) -> SessionMemory:
        memory = self.load(session_id)
        memory.current_emotion_vector = {str(key): float(value) for key, value in emotion_vector.items()}
        memory.session_mood = smooth_session_mood(
            memory.session_mood,
            memory.current_emotion_vector,
            alpha=self.config.emotion_session_alpha,
            labels=self.config.emotion_labels,
        )
        if entropy is not None:
            memory.last_entropy = float(entropy)
        if utterance_embedding is not None:
            memory.last_utterance_embedding = [float(item) for item in utterance_embedding]
        memory.last_updated = _now_ts()
        self.store.save_session_payload(session_id, memory.to_dict())
        return memory

    def clear(self, session_id: str) -> None:
        self.store.delete_session_payload(session_id)

    def prune_expired_sessions(self) -> list[str]:
        now = _now_ts()
        threshold = self.config.memory_session_ttl_seconds
        sessions = self.store.list_sessions()
        deleted: list[str] = []
        for session_id, payload in sessions.items():
            last_updated = float(payload.get("last_updated", 0.0))
            if last_updated and now - last_updated > threshold:
                self.store.delete_session_payload(session_id)
                deleted.append(session_id)
        return deleted

    def _truncate(self, text: str) -> str:
        cleaned = str(text or "").strip()
        if len(cleaned) <= self.config.memory_max_text_chars:
            return cleaned
        return cleaned[: self.config.memory_max_text_chars]

    def _build_summary(self, memory: SessionMemory) -> str:
        if not memory.turns:
            return ""
        recent_turns = memory.turns[-5:]
        snippets = []
        for turn in recent_turns:
            snippets.append(f"U:{turn.user_message[:90]} | A:{turn.assistant_message[:90]}")
        return " || ".join(snippets)
