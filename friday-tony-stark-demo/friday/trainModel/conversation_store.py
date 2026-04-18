from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import TrainModelConfig
from .schemas import ConversationSample


def _now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


@dataclass(slots=True)
class StoreStats:
    appended_raw: int = 0
    appended_candidates: int = 0
    appended_curated: int = 0


class ConversationDatasetStore:
    """
    Persist conversation records through raw/cleaned/candidate/curated stages.
    """

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config
        self.config.ensure_directories()
        self.stats = StoreStats()

    def append_raw_turn(
        self,
        *,
        session_id: str,
        user_id: str | None,
        user_message: str,
        assistant_message: str,
        source: str,
        refined_input: str | None,
        feedback_score: float | None = None,
        resolved: bool | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Path:
        sample = ConversationSample(
            session_id=session_id,
            user_id=user_id,
            timestamp=_now_ts(),
            user_message=user_message,
            assistant_message=assistant_message,
            source=source,
            refined_input=refined_input,
            feedback_score=feedback_score,
            resolved=resolved,
            safety_status="unknown",
            quality_score=None,
            dataset_status="raw",
            metadata=dict(metadata or {}),
        )
        path = self.config.raw_logs_dir / "conversation_raw.jsonl"
        self._append_jsonl(path, sample.to_dict())
        self.stats.appended_raw += 1
        return path

    def write_stage_samples(
        self,
        *,
        stage: str,
        samples: list[ConversationSample],
        filename_prefix: str,
    ) -> Path:
        target_dir = self._stage_directory(stage)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        output_path = target_dir / f"{filename_prefix}_{timestamp}.jsonl"
        with output_path.open("w", encoding="utf-8") as file_obj:
            for sample in samples:
                payload = sample.to_dict()
                payload["dataset_status"] = stage
                file_obj.write(json.dumps(payload, ensure_ascii=False) + "\n")
        if stage == "candidate":
            self.stats.appended_candidates += len(samples)
        if stage == "curated":
            self.stats.appended_curated += len(samples)
        return output_path

    def count_pending_raw_records(self) -> int:
        path = self.config.raw_logs_dir / "conversation_raw.jsonl"
        if not path.exists():
            return 0
        return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())

    def archive_dataset_file(self, dataset_path: str | Path, *, reason: str = "archived") -> Path:
        source = Path(dataset_path)
        if not source.exists():
            raise FileNotFoundError(f"Dataset path not found: {source}")
        self.config.archived_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        target = self.config.archived_dir / f"{source.stem}_{reason}_{stamp}{source.suffix}"
        target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
        return target

    def _append_jsonl(self, path: Path, payload: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as file_obj:
            file_obj.write(json.dumps(payload, ensure_ascii=False) + "\n")

    def _stage_directory(self, stage: str) -> Path:
        mapping = {
            "cleaned": self.config.cleaned_dir,
            "candidate": self.config.candidates_dir,
            "curated": self.config.curated_dir,
            "rejected": self.config.candidates_dir,
            "archived": self.config.archived_dir,
        }
        target_dir = mapping.get(stage, self.config.candidates_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir

