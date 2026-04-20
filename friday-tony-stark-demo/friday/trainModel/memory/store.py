from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

from ..config import TrainModelConfig


class MemoryStore:
    """
    Lightweight JSON store for session and user memory.
    """

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config
        self.config.ensure_directories()
        self.sessions_path = self.config.memory_store_dir / "sessions.json"
        self.users_path = self.config.memory_store_dir / "users.json"
        self._lock = threading.Lock()
        self._ensure_store_files()

    def get_session_payload(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read_json(self.sessions_path)
            return payload.get(session_id)

    def save_session_payload(self, session_id: str, data: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read_json(self.sessions_path)
            payload[session_id] = data
            self._write_json(self.sessions_path, payload)

    def delete_session_payload(self, session_id: str) -> None:
        with self._lock:
            payload = self._read_json(self.sessions_path)
            if session_id in payload:
                del payload[session_id]
                self._write_json(self.sessions_path, payload)

    def list_sessions(self) -> dict[str, dict[str, Any]]:
        with self._lock:
            payload = self._read_json(self.sessions_path)
            return {key: value for key, value in payload.items() if isinstance(value, dict)}

    def get_user_payload(self, user_id: str) -> dict[str, Any] | None:
        with self._lock:
            payload = self._read_json(self.users_path)
            return payload.get(user_id)

    def save_user_payload(self, user_id: str, data: dict[str, Any]) -> None:
        with self._lock:
            payload = self._read_json(self.users_path)
            payload[user_id] = data
            self._write_json(self.users_path, payload)

    def delete_user_payload(self, user_id: str) -> None:
        with self._lock:
            payload = self._read_json(self.users_path)
            if user_id in payload:
                del payload[user_id]
                self._write_json(self.users_path, payload)

    def save_emotion_snapshot(
        self,
        *,
        owner: str,
        owner_id: str,
        data: dict[str, Any],
    ) -> None:
        if owner == "session":
            self.save_session_payload(owner_id, data)
            return
        if owner == "user":
            self.save_user_payload(owner_id, data)

    def _ensure_store_files(self) -> None:
        if not self.sessions_path.exists():
            self._write_json(self.sessions_path, {})
        if not self.users_path.exists():
            self._write_json(self.users_path, {})

    def _read_json(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            return {}
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(payload, dict):
                return payload
            return {}
        except json.JSONDecodeError:
            return {}

    def _write_json(self, path: Path, payload: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = path.with_suffix(".tmp")
        temp_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        temp_path.replace(path)
