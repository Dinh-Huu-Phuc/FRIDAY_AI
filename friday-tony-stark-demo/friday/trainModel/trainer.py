from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol

from .config import TrainModelConfig
from .schemas import TrainingExample, TrainingReport


def _utc_now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


class TrainerBackend(Protocol):
    name: str

    def train(
        self,
        train_examples: list[TrainingExample],
        valid_examples: list[TrainingExample],
        test_examples: list[TrainingExample],
        checkpoint_dir: Path,
        config: TrainModelConfig,
    ) -> dict[str, float]:
        ...


@dataclass(slots=True)
class MockSFTBackend:
    """
    Deterministic backend stub for production pipeline wiring.
    It creates concrete artifacts and metrics without requiring heavy training stack.
    """

    name: str = "mock_sft_backend"

    def train(
        self,
        train_examples: list[TrainingExample],
        valid_examples: list[TrainingExample],
        test_examples: list[TrainingExample],
        checkpoint_dir: Path,
        config: TrainModelConfig,
    ) -> dict[str, float]:
        quality_values = [float(item.metadata.get("quality_score", 0.5)) for item in train_examples]
        quality_mean = sum(quality_values) / max(len(quality_values), 1)
        pass_rate = min(1.0, max(0.0, 0.55 + quality_mean * 0.4))

        train_loss = max(0.08, 1.15 - quality_mean * 0.9)
        valid_loss = max(0.10, train_loss + 0.03)
        test_loss = max(0.10, valid_loss + 0.02)

        artifact_payload = {
            "backend": self.name,
            "train_examples": len(train_examples),
            "valid_examples": len(valid_examples),
            "test_examples": len(test_examples),
            "quality_mean": quality_mean,
        }
        (checkpoint_dir / "model_artifact.json").write_text(
            json.dumps(artifact_payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        return {
            "train_loss": round(train_loss, 6),
            "valid_loss": round(valid_loss, 6),
            "test_loss": round(test_loss, 6),
            "quality_mean": round(quality_mean, 6),
            "pass_rate": round(pass_rate, 6),
        }


class Trainer:
    """
    Training orchestrator with replaceable backend.
    """

    def __init__(self, config: TrainModelConfig, backend: TrainerBackend | None = None) -> None:
        self.config = config
        self.backend = backend or MockSFTBackend()

    def run(
        self,
        *,
        dataset_version: str,
        train_path: str,
        valid_path: str,
        test_path: str,
    ) -> TrainingReport:
        started_at = _utc_now_ts()
        run_id = f"train_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        checkpoint_dir = self.config.checkpoints_dir / run_id
        checkpoint_dir.mkdir(parents=True, exist_ok=True)

        train_examples = self._load_examples(Path(train_path))
        valid_examples = self._load_examples(Path(valid_path))
        test_examples = self._load_examples(Path(test_path))
        if not train_examples:
            raise ValueError("Training dataset is empty. Abort training run.")

        metrics = self.backend.train(
            train_examples=train_examples,
            valid_examples=valid_examples,
            test_examples=test_examples,
            checkpoint_dir=checkpoint_dir,
            config=self.config,
        )
        finished_at = _utc_now_ts()

        report = TrainingReport(
            run_id=run_id,
            started_at=started_at,
            finished_at=finished_at,
            backend_name=self.backend.name,
            dataset_version=dataset_version,
            train_path=train_path,
            valid_path=valid_path,
            test_path=test_path,
            checkpoint_dir=str(checkpoint_dir),
            total_train_samples=len(train_examples),
            total_valid_samples=len(valid_examples),
            total_test_samples=len(test_examples),
            metrics=metrics,
            notes=[
                "Training backend can be replaced by local SFT, LoRA, or external service.",
                "Current backend is deterministic stub for integration-safe deployment.",
            ],
        )
        self._write_report(report)
        return report

    def _load_examples(self, path: Path) -> list[TrainingExample]:
        if not path.exists():
            return []
        examples: list[TrainingExample] = []
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line:
                continue
            payload = json.loads(line)
            examples.append(
                TrainingExample(
                    system=str(payload.get("system", "")),
                    instruction=str(payload.get("instruction", "")),
                    output=str(payload.get("output", "")),
                    metadata=dict(payload.get("metadata", {})),
                )
            )
        return examples

    def _write_report(self, report: TrainingReport) -> None:
        self.config.ensure_directories()
        report_path = self.config.reports_dir / f"training_{report.run_id}.json"
        report_path.write_text(json.dumps(report.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")

