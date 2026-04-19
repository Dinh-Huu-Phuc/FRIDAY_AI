from __future__ import annotations

from datetime import datetime, timezone

from ..config import TrainModelConfig
from .schemas import ExtractedSignal, ProjectMemory, SessionMemory, TaskMemory, UserMemory, UserPreference
from .store import MemoryStore


def _now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


class UserMemoryService:
    """
    Manage long-term memory per user.
    """

    def __init__(self, config: TrainModelConfig, store: MemoryStore) -> None:
        self.config = config
        self.store = store

    def load(self, user_id: str) -> UserMemory:
        payload = self.store.get_user_payload(user_id)
        if payload is None:
            return UserMemory(user_id=user_id)

        pref_payload = payload.get("preference", {})
        project_payload = payload.get("project_memory", {})
        task_payload = payload.get("task_memory", {})
        preference = UserPreference(
            preferred_name=pref_payload.get("preferred_name"),
            addressing_style=pref_payload.get("addressing_style"),
            preferred_language=pref_payload.get("preferred_language"),
            preferred_response_length=pref_payload.get("preferred_response_length"),
            preferred_tone=pref_payload.get("preferred_tone"),
            updated_at=float(pref_payload.get("updated_at", _now_ts())),
        )
        return UserMemory(
            user_id=user_id,
            preference=preference,
            project_memory=ProjectMemory(
                active_projects=[str(item) for item in project_payload.get("active_projects", [])],
                project_notes=[str(item) for item in project_payload.get("project_notes", [])],
                technical_decisions=[str(item) for item in project_payload.get("technical_decisions", [])],
            ),
            task_memory=TaskMemory(
                active_tasks=[str(item) for item in task_payload.get("active_tasks", [])],
                paused_tasks=[str(item) for item in task_payload.get("paused_tasks", [])],
                blockers=[str(item) for item in task_payload.get("blockers", [])],
                next_steps=[str(item) for item in task_payload.get("next_steps", [])],
            ),
            interests=[str(item) for item in payload.get("interests", [])],
            habits=[str(item) for item in payload.get("habits", [])],
            notes=[str(item) for item in payload.get("notes", [])],
            created_at=float(payload.get("created_at", _now_ts())),
            last_updated=float(payload.get("last_updated", _now_ts())),
        )

    def save(self, memory: UserMemory) -> None:
        memory.interests = self._dedupe_and_limit(memory.interests, self.config.memory_user_interest_limit)
        memory.habits = self._dedupe_and_limit(memory.habits, self.config.memory_user_habit_limit)
        memory.notes = self._dedupe_and_limit(memory.notes, self.config.memory_user_note_limit)
        memory.project_memory.active_projects = self._dedupe_and_limit(
            memory.project_memory.active_projects,
            self.config.memory_project_item_limit,
        )
        memory.project_memory.project_notes = self._dedupe_and_limit(
            memory.project_memory.project_notes,
            self.config.memory_project_item_limit,
        )
        memory.project_memory.technical_decisions = self._dedupe_and_limit(
            memory.project_memory.technical_decisions,
            self.config.memory_project_item_limit,
        )
        memory.task_memory.active_tasks = self._dedupe_and_limit(
            memory.task_memory.active_tasks,
            self.config.memory_task_item_limit,
        )
        memory.task_memory.paused_tasks = self._dedupe_and_limit(
            memory.task_memory.paused_tasks,
            self.config.memory_task_item_limit,
        )
        memory.task_memory.blockers = self._dedupe_and_limit(
            memory.task_memory.blockers,
            self.config.memory_task_item_limit,
        )
        memory.task_memory.next_steps = self._dedupe_and_limit(
            memory.task_memory.next_steps,
            self.config.memory_task_item_limit,
        )
        memory.last_updated = _now_ts()
        self.store.save_user_payload(memory.user_id, memory.to_dict())

    def update_from_signal(self, user_id: str, signal: ExtractedSignal) -> UserMemory:
        memory = self.load(user_id)
        if signal.preferred_name:
            memory.preference.preferred_name = signal.preferred_name
        if signal.addressing_style:
            memory.preference.addressing_style = signal.addressing_style
        if signal.preferred_language:
            memory.preference.preferred_language = signal.preferred_language
        if signal.preferred_response_length:
            memory.preference.preferred_response_length = signal.preferred_response_length
        if signal.preferred_tone:
            memory.preference.preferred_tone = signal.preferred_tone

        memory.preference.updated_at = _now_ts()
        memory.interests.extend(signal.interests)
        memory.habits.extend(signal.habits)
        memory.notes.extend(signal.notes)
        memory.project_memory.active_projects.extend(signal.active_projects)
        memory.project_memory.project_notes.extend(signal.project_notes)
        memory.project_memory.technical_decisions.extend(signal.technical_decisions)
        memory.task_memory.active_tasks.extend(signal.active_tasks)
        memory.task_memory.paused_tasks.extend(signal.paused_tasks)
        memory.task_memory.blockers.extend(signal.blockers)
        memory.task_memory.next_steps.extend(signal.next_steps)
        self.save(memory)
        return memory

    def merge_session_memory(self, user_id: str, session_memory: SessionMemory) -> UserMemory:
        memory = self.load(user_id)
        if session_memory.summary:
            memory.notes.append(f"session_summary:{session_memory.summary}")
        for turn in session_memory.turns[-8:]:
            metadata = turn.metadata or {}
            active_project = str(metadata.get("active_project") or "").strip()
            if active_project:
                memory.project_memory.active_projects.append(active_project)
            for field_name, target in (
                ("technical_decision", memory.project_memory.technical_decisions),
                ("project_note", memory.project_memory.project_notes),
                ("active_task", memory.task_memory.active_tasks),
                ("paused_task", memory.task_memory.paused_tasks),
                ("blocker", memory.task_memory.blockers),
                ("next_step", memory.task_memory.next_steps),
            ):
                value = str(metadata.get(field_name) or "").strip()
                if value:
                    target.append(value)
        self.save(memory)
        return memory

    def forget_user(self, user_id: str) -> None:
        self.store.delete_user_payload(user_id)

    def _dedupe_and_limit(self, values: list[str], limit: int) -> list[str]:
        cleaned: list[str] = []
        seen = set()
        for value in values:
            item = value.strip()
            if not item:
                continue
            lower = item.lower()
            if lower in seen:
                continue
            cleaned.append(item)
            seen.add(lower)
        if len(cleaned) <= limit:
            return cleaned
        return cleaned[-limit:]
