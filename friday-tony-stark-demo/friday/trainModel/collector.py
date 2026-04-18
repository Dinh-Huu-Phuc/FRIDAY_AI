from __future__ import annotations

import json
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

from .config import TrainModelConfig
from .schemas import ConversationSample


@dataclass(slots=True)
class CollectorStats:
    files_scanned: int = 0
    raw_records: int = 0
    valid_samples: int = 0
    skipped_records: int = 0


class ConversationCollector:
    """
    Collect and normalize conversation logs from JSON/JSONL files.

    Sample log input accepted by collector (jsonl):
    {"session_id":"s1","timestamp":"2026-04-18T13:00:00+07:00","user_message":"Xin chao","assistant_message":"Chao ban","source":"agent_runtime","refined_input":"Xin chao","feedback_score":1.0,"resolved":true,"safety_status":"unknown","quality_score":null,"dataset_status":"raw","metadata":{"channel":"voice"}}
    """

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config
        self.stats = CollectorStats()

    def collect(self) -> list[ConversationSample]:
        samples: list[ConversationSample] = []
        search_roots = [self.config.log_source_dir, self.config.raw_logs_dir]
        visited_files: set[Path] = set()

        for root_dir in search_roots:
            for path in self._iter_log_files(root_dir):
                if path in visited_files:
                    continue
                visited_files.add(path)
                self.stats.files_scanned += 1
                try:
                    samples.extend(self._read_file(path))
                except Exception:
                    self.stats.skipped_records += 1
        self.stats.valid_samples = len(samples)
        return samples

    def dump_raw_samples(self, samples: list[ConversationSample]) -> Path:
        self.config.ensure_directories()
        output_path = self.config.raw_logs_dir / "raw_samples_snapshot.jsonl"
        with output_path.open("w", encoding="utf-8") as file_obj:
            for sample in samples:
                file_obj.write(json.dumps(sample.to_dict(), ensure_ascii=False) + "\n")
        return output_path

    def _iter_log_files(self, root_dir: Path) -> Iterable[Path]:
        if not root_dir.exists():
            return []
        return sorted(path for path in root_dir.rglob("*") if path.suffix.lower() in {".json", ".jsonl"})

    def _read_file(self, path: Path) -> list[ConversationSample]:
        if path.suffix.lower() == ".jsonl":
            return self._read_jsonl(path)

        if path.suffix.lower() == ".json":
            return self._read_json(path)

        return []

    def _read_jsonl(self, path: Path) -> list[ConversationSample]:
        samples: list[ConversationSample] = []
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line:
                continue
            self.stats.raw_records += 1
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                self.stats.skipped_records += 1
                continue
            normalized = self._normalize_direct_record(record)
            if normalized is None:
                self.stats.skipped_records += 1
                continue
            samples.append(normalized)
        return samples

    def _read_json(self, path: Path) -> list[ConversationSample]:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            self.stats.skipped_records += 1
            return []

        if isinstance(payload, dict) and isinstance(payload.get("events"), list):
            return self._extract_from_daily_event_file(payload)

        if isinstance(payload, list):
            return self._extract_from_record_list(payload)

        if isinstance(payload, dict):
            normalized = self._normalize_direct_record(payload)
            if normalized is not None:
                return [normalized]
            self.stats.skipped_records += 1
            return []

        self.stats.skipped_records += 1
        return []

    def _extract_from_record_list(self, records: list[Any]) -> list[ConversationSample]:
        samples: list[ConversationSample] = []
        if not records:
            return samples

        if isinstance(records[0], dict) and "event_type" in records[0]:
            wrapped = {"events": records}
            return self._extract_from_daily_event_file(wrapped)

        for record in records:
            self.stats.raw_records += 1
            if not isinstance(record, dict):
                self.stats.skipped_records += 1
                continue
            normalized = self._normalize_direct_record(record)
            if normalized is None:
                self.stats.skipped_records += 1
                continue
            samples.append(normalized)
        return samples

    def _extract_from_daily_event_file(self, payload: dict[str, Any]) -> list[ConversationSample]:
        events = payload.get("events", [])
        sorted_events = sorted(
            [event for event in events if isinstance(event, dict)],
            key=lambda event: float(event.get("created_at", 0.0)),
        )
        pending_user_messages: dict[str, deque[dict[str, Any]]] = defaultdict(deque)
        samples: list[ConversationSample] = []

        for event in sorted_events:
            self.stats.raw_records += 1
            session_id = str(event.get("session_id") or "unknown_session")
            event_type = str(event.get("event_type") or "")
            event_payload = event.get("payload", {})

            if event_type != "conversation_item_added":
                continue

            if not isinstance(event_payload, dict):
                self.stats.skipped_records += 1
                continue

            item = event_payload.get("item", {})
            if not isinstance(item, dict):
                self.stats.skipped_records += 1
                continue

            role = str(item.get("role") or "")
            message_text = str(item.get("text") or "").strip()
            created_at = self._parse_timestamp(item.get("created_at") or event.get("created_at"))

            if not message_text:
                self.stats.skipped_records += 1
                continue

            if role == "user":
                pending_user_messages[session_id].append(
                    {
                        "text": message_text,
                        "timestamp": created_at,
                        "user_id": event_payload.get("user_id"),
                        "metadata": {"source_file_date": payload.get("date")},
                    }
                )
                continue

            if role == "assistant" and pending_user_messages[session_id]:
                user_turn = pending_user_messages[session_id].popleft()
                sample = ConversationSample(
                    session_id=session_id,
                    user_id=self._safe_str_or_none(user_turn.get("user_id")),
                    timestamp=float(created_at),
                    user_message=str(user_turn.get("text", "")),
                    assistant_message=message_text,
                    source="daily_event_log",
                    refined_input=None,
                    safety_status="unknown",
                    quality_score=None,
                    dataset_status="raw",
                    metadata={"source_file_date": payload.get("date")},
                )
                if sample.is_valid():
                    samples.append(sample)
                else:
                    self.stats.skipped_records += 1
                continue

        return samples

    def _normalize_direct_record(self, record: dict[str, Any]) -> ConversationSample | None:
        session_id = self._safe_str(record.get("session_id") or record.get("session") or "unknown_session")
        user_id = self._safe_str_or_none(record.get("user_id"))
        timestamp = self._parse_timestamp(
            record.get("timestamp") or record.get("created_at") or record.get("time")
        )

        user_message = self._safe_str(
            record.get("user_message") or record.get("instruction") or record.get("question")
        )
        assistant_message = self._safe_str(
            record.get("assistant_message") or record.get("output") or record.get("answer")
        )

        feedback_score = self._parse_optional_float(record.get("feedback_score"))
        resolved = self._parse_optional_bool(record.get("resolved"))
        source = self._safe_str(record.get("source") or "unknown")
        refined_input = self._safe_str_or_none(record.get("refined_input"))
        safety_status = self._safe_str(record.get("safety_status") or "unknown")
        quality_score = self._parse_optional_float(record.get("quality_score"))
        dataset_status = self._safe_str(record.get("dataset_status") or "raw")

        metadata = record.get("metadata", {})
        if not isinstance(metadata, dict):
            metadata = {"metadata_text": str(metadata)}

        sample = ConversationSample(
            session_id=session_id,
            user_id=user_id,
            timestamp=timestamp,
            user_message=user_message,
            assistant_message=assistant_message,
            source=source,
            refined_input=refined_input,
            feedback_score=feedback_score,
            resolved=resolved,
            safety_status=safety_status,
            quality_score=quality_score,
            dataset_status=dataset_status,
            metadata=metadata,
        )
        return sample if sample.is_valid() else None

    def _parse_timestamp(self, value: Any) -> float:
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            cleaned = value.strip()
            if not cleaned:
                return datetime.utcnow().timestamp()
            try:
                return float(cleaned)
            except ValueError:
                iso_value = cleaned.replace("Z", "+00:00")
                try:
                    return datetime.fromisoformat(iso_value).timestamp()
                except ValueError:
                    return datetime.utcnow().timestamp()
        return datetime.utcnow().timestamp()

    def _parse_optional_float(self, value: Any) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _parse_optional_bool(self, value: Any) -> bool | None:
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        lowered = str(value).strip().lower()
        if lowered in {"true", "1", "yes", "y"}:
            return True
        if lowered in {"false", "0", "no", "n"}:
            return False
        return None

    def _safe_str(self, value: Any) -> str:
        return str(value or "").strip()

    def _safe_str_or_none(self, value: Any) -> str | None:
        text = self._safe_str(value)
        return text if text else None

