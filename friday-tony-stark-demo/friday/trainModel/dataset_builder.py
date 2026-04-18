from __future__ import annotations

import json
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .config import TrainModelConfig
from .schemas import ScoredSample, TrainingExample


@dataclass(slots=True)
class DatasetBuildResult:
    curated_candidates_path: str
    train_path: str
    valid_path: str
    test_path: str
    train_size: int
    valid_size: int
    test_size: int
    dropped_count: int
    kept_count: int
    manifest_path: str

    def to_dict(self) -> dict[str, object]:
        return {
            "curated_candidates_path": self.curated_candidates_path,
            "train_path": self.train_path,
            "valid_path": self.valid_path,
            "test_path": self.test_path,
            "train_size": self.train_size,
            "valid_size": self.valid_size,
            "test_size": self.test_size,
            "dropped_count": self.dropped_count,
            "kept_count": self.kept_count,
            "manifest_path": self.manifest_path,
        }


class DatasetBuilder:
    """
    Build candidate and curated datasets with deterministic train/valid/test split.
    """

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config

    def build(self, scored_samples: list[ScoredSample]) -> DatasetBuildResult:
        kept_samples = [item for item in scored_samples if item.keep]
        dropped_count = len(scored_samples) - len(kept_samples)
        examples = [self._to_training_example(item) for item in kept_samples]

        randomizer = random.Random(self.config.random_seed)
        randomizer.shuffle(examples)

        train_examples, valid_examples, test_examples = self._split_examples(examples)

        self.config.ensure_directories()
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

        curated_candidates_path = self.config.curated_dir / f"curated_candidates_{stamp}.jsonl"
        self._write_jsonl(curated_candidates_path, examples)

        dataset_dir = self.config.datasets_dir / f"dataset_build_{stamp}"
        dataset_dir.mkdir(parents=True, exist_ok=True)

        train_path = dataset_dir / "train.jsonl"
        valid_path = dataset_dir / "valid.jsonl"
        test_path = dataset_dir / "test.jsonl"
        manifest_path = dataset_dir / "manifest.json"

        self._write_jsonl(train_path, train_examples)
        self._write_jsonl(valid_path, valid_examples)
        self._write_jsonl(test_path, test_examples)

        manifest_payload = {
            "build_time": datetime.now(timezone.utc).isoformat(),
            "kept_count": len(kept_samples),
            "dropped_count": dropped_count,
            "train_size": len(train_examples),
            "valid_size": len(valid_examples),
            "test_size": len(test_examples),
            "train_split_ratio": self.config.train_split_ratio,
            "valid_split_ratio": self.config.valid_split_ratio,
            "test_split_ratio": self.config.test_split_ratio,
            "random_seed": self.config.random_seed,
        }
        manifest_path.write_text(json.dumps(manifest_payload, indent=2, ensure_ascii=False), encoding="utf-8")

        return DatasetBuildResult(
            curated_candidates_path=str(curated_candidates_path),
            train_path=str(train_path),
            valid_path=str(valid_path),
            test_path=str(test_path),
            train_size=len(train_examples),
            valid_size=len(valid_examples),
            test_size=len(test_examples),
            dropped_count=dropped_count,
            kept_count=len(kept_samples),
            manifest_path=str(manifest_path),
        )

    def _split_examples(
        self, examples: list[TrainingExample]
    ) -> tuple[list[TrainingExample], list[TrainingExample], list[TrainingExample]]:
        total = len(examples)
        if total == 0:
            return [], [], []

        valid_size = int(total * self.config.valid_split_ratio)
        test_size = int(total * self.config.test_split_ratio)
        train_size = total - valid_size - test_size

        if total >= 3 and train_size <= 0:
            train_size = 1
            if valid_size > test_size:
                valid_size -= 1
            else:
                test_size -= 1

        if total >= 3 and valid_size == 0:
            valid_size = 1
            if train_size > 1:
                train_size -= 1
            elif test_size > 0:
                test_size -= 1

        if total >= 3 and test_size == 0:
            test_size = 1
            if train_size > 1:
                train_size -= 1
            elif valid_size > 1:
                valid_size -= 1

        train_examples = examples[:train_size]
        valid_examples = examples[train_size : train_size + valid_size]
        test_examples = examples[train_size + valid_size :]
        return train_examples, valid_examples, test_examples

    def _to_training_example(self, scored: ScoredSample) -> TrainingExample:
        sample = scored.sample
        sample.dataset_status = "curated"
        return TrainingExample(
            system=self.config.training_system_prompt,
            instruction=sample.user_message,
            output=sample.assistant_message,
            metadata={
                "session_id": sample.session_id,
                "user_id": sample.user_id,
                "timestamp": sample.timestamp,
                "source": sample.source,
                "refined_input": sample.refined_input,
                "feedback_score": sample.feedback_score,
                "resolved": sample.resolved,
                "safety_status": sample.safety_status,
                "quality_score": scored.quality_score,
                "dataset_status": sample.dataset_status,
            },
        )

    def _write_jsonl(self, path: Path, examples: list[TrainingExample]) -> None:
        with path.open("w", encoding="utf-8") as file_obj:
            for item in examples:
                file_obj.write(json.dumps(item.to_dict(), ensure_ascii=False) + "\n")

