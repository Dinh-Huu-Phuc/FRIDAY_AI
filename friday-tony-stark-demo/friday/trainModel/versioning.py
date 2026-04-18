from __future__ import annotations

import json
import shutil
import threading
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import TrainModelConfig
from .schemas import DatasetVersionMetadata, EvaluationReport, ModelVersionMetadata, TrainingReport


def _now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


class VersionManager:
    """
    Manage dataset and model versions with JSON registry.
    """

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config
        self.registry_path = self.config.versions_dir / "version_registry.json"
        self._lock = threading.RLock()
        self.config.ensure_directories()

    def create_dataset_version(
        self,
        *,
        manifest_path: str,
        train_path: str,
        valid_path: str,
        test_path: str,
        total_samples: int,
        train_count: int,
        valid_count: int,
        test_count: int,
    ) -> DatasetVersionMetadata:
        with self._lock:
            registry = self._load_registry()
            dataset_version = f"dataset_v{self._next_version_number(registry['datasets'], prefix='dataset_v')}"

            metadata = DatasetVersionMetadata(
                version=dataset_version,
                created_at=_now_ts(),
                source_manifest_path=manifest_path,
                train_path=train_path,
                valid_path=valid_path,
                test_path=test_path,
                total_samples=total_samples,
                train_count=train_count,
                valid_count=valid_count,
                test_count=test_count,
                status="curated",
                notes=["Created by dataset builder."],
            )
            registry["datasets"].append(asdict(metadata))
            self._save_registry(registry)
            return metadata

    def list_dataset_versions(self) -> list[DatasetVersionMetadata]:
        with self._lock:
            registry = self._load_registry()
            return [DatasetVersionMetadata(**item) for item in registry["datasets"]]

    def get_latest_dataset(self) -> DatasetVersionMetadata | None:
        datasets = self.list_dataset_versions()
        if not datasets:
            return None
        datasets_sorted = sorted(datasets, key=lambda item: item.created_at)
        return datasets_sorted[-1]

    def archive_dataset(self, version: str) -> DatasetVersionMetadata | None:
        with self._lock:
            registry = self._load_registry()
            target = next((item for item in registry["datasets"] if item.get("version") == version), None)
            if target is None:
                return None
            target["status"] = "archived"
            if "notes" not in target or not isinstance(target["notes"], list):
                target["notes"] = []
            target["notes"].append(f"Archived at {_now_ts()}")
            self._save_registry(registry)
            return DatasetVersionMetadata(**target)

    def create_model_version(
        self,
        *,
        training_report: TrainingReport,
        evaluation_report: EvaluationReport,
    ) -> ModelVersionMetadata:
        with self._lock:
            registry = self._load_registry()
            model_version = f"model_v{self._next_version_number(registry['models'], prefix='model_v')}"
            model_dir = self.config.versions_dir / model_version
            model_dir.mkdir(parents=True, exist_ok=True)

            checkpoint_source = Path(training_report.checkpoint_dir)
            checkpoint_target = model_dir / "checkpoint"
            if checkpoint_target.exists():
                shutil.rmtree(checkpoint_target)
            if checkpoint_source.exists():
                shutil.copytree(checkpoint_source, checkpoint_target)
            else:
                checkpoint_target.mkdir(parents=True, exist_ok=True)

            train_report_path = self.config.reports_dir / f"training_{training_report.run_id}.json"
            eval_report_path = self.config.reports_dir / f"evaluation_{training_report.run_id}.json"

            metadata = ModelVersionMetadata(
                version=model_version,
                created_at=_now_ts(),
                dataset_version=training_report.dataset_version,
                train_report_path=str(train_report_path),
                evaluate_report_path=str(eval_report_path),
                checkpoint_dir=str(checkpoint_target),
                status="archived",
                active=False,
                notes=[f"evaluation_candidate_score={evaluation_report.candidate_score:.4f}"],
            )
            registry["models"].append(asdict(metadata))
            self._save_registry(registry)
            return metadata

    def get_active_model(self) -> ModelVersionMetadata | None:
        with self._lock:
            registry = self._load_registry()
            active_version = registry.get("active_model_version")
            if not active_version:
                return None
            for item in registry["models"]:
                if item.get("version") == active_version:
                    return ModelVersionMetadata(**item)
            return None

    def list_model_versions(self) -> list[ModelVersionMetadata]:
        with self._lock:
            registry = self._load_registry()
            return [ModelVersionMetadata(**item) for item in registry["models"]]

    def promote_model(self, version: str) -> ModelVersionMetadata | None:
        with self._lock:
            registry = self._load_registry()
            target: dict[str, Any] | None = None
            for model in registry["models"]:
                if model.get("version") == version:
                    model["active"] = True
                    model["status"] = "active"
                    model["promoted_at"] = _now_ts()
                    target = model
                else:
                    if model.get("active"):
                        model["archived_at"] = _now_ts()
                    model["active"] = False
                    model["status"] = "archived"
            if target is None:
                return None
            registry["active_model_version"] = version
            self._save_registry(registry)
            return ModelVersionMetadata(**target)

    def rollback_model(self, target_version: str | None = None) -> ModelVersionMetadata | None:
        with self._lock:
            registry = self._load_registry()
            models = registry["models"]
            if not models:
                return None

            if target_version:
                return self.promote_model(target_version)

            active_version = registry.get("active_model_version")
            sorted_models = sorted(models, key=lambda item: float(item.get("created_at", 0.0)))
            if not active_version:
                return self.promote_model(sorted_models[-1]["version"])
            active_idx = next(
                (idx for idx, item in enumerate(sorted_models) if item.get("version") == active_version),
                None,
            )
            if active_idx is None or active_idx == 0:
                return None
            return self.promote_model(sorted_models[active_idx - 1]["version"])

    def _next_version_number(self, items: list[dict[str, Any]], *, prefix: str) -> int:
        max_number = 0
        for item in items:
            version_name = str(item.get("version", ""))
            if version_name.startswith(prefix):
                suffix = version_name.replace(prefix, "", 1)
                if suffix.isdigit():
                    max_number = max(max_number, int(suffix))
        return max_number + 1

    def _load_registry(self) -> dict[str, Any]:
        if not self.registry_path.exists():
            return {
                "active_model_version": None,
                "datasets": [],
                "models": [],
            }
        try:
            payload = json.loads(self.registry_path.read_text(encoding="utf-8"))
            if not isinstance(payload, dict):
                return {"active_model_version": None, "datasets": [], "models": []}
            payload.setdefault("active_model_version", None)
            payload.setdefault("datasets", [])
            payload.setdefault("models", [])
            return payload
        except json.JSONDecodeError:
            return {"active_model_version": None, "datasets": [], "models": []}

    def _save_registry(self, payload: dict[str, Any]) -> None:
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path = self.registry_path.with_suffix(".json.bak")
        if self.registry_path.exists():
            shutil.copy2(self.registry_path, backup_path)
        temp_path = self.registry_path.with_suffix(".json.tmp")
        temp_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        temp_path.replace(self.registry_path)

