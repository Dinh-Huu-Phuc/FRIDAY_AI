from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from .cleaner import DataCleaner
from .collector import ConversationCollector
from .config import TrainModelConfig, build_default_config
from .conversation_store import ConversationDatasetStore
from .dataset_builder import DatasetBuildResult, DatasetBuilder
from .emotion_math import EmotionHeuristicModel, build_utterance_embedding
from .evaluator import CandidateEvaluator
from .memory import MemoryManager
from .safety_filter import SafetyFilter
from .scorer import SampleScorer
from .schemas import EmotionRuntimeState, EvaluationReport, ScoredSample, TrainingReport
from .trainer import Trainer
from .versioning import VersionManager


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(slots=True)
class PipelineResult:
    status: str
    started_at: str
    finished_at: str
    summary: dict[str, Any]
    training_report: dict[str, Any] | None = None
    evaluation_report: dict[str, Any] | None = None
    dataset_version: str | None = None
    model_version: str | None = None
    promoted: bool = False
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "summary": self.summary,
            "training_report": self.training_report,
            "evaluation_report": self.evaluation_report,
            "dataset_version": self.dataset_version,
            "model_version": self.model_version,
            "promoted": self.promoted,
            "error": self.error,
        }


def run_training_pipeline(
    config: TrainModelConfig | None = None,
    manual_trigger_reason: str | None = None,
) -> dict[str, Any]:
    """
    Full long-term training flow:
    ensure dirs -> collect -> clean -> safety -> score -> build dataset -> train -> evaluate -> versioning.
    """

    cfg = config or build_default_config()
    cfg.ensure_directories()

    started_at = _now_iso()
    collector = ConversationCollector(cfg)
    cleaner = DataCleaner(cfg)
    safety_filter = SafetyFilter(cfg)
    scorer = SampleScorer(cfg)
    dataset_builder = DatasetBuilder(cfg)
    trainer = Trainer(cfg)
    evaluator = CandidateEvaluator(cfg)
    version_manager = VersionManager(cfg)
    store = ConversationDatasetStore(cfg)

    try:
        source_dataset_result = dataset_builder.build_from_sources(export_xlsx=False)
        raw_samples = collector.collect()
        raw_dump_path = collector.dump_raw_samples(raw_samples)

        cleaned_samples = []
        for sample in raw_samples:
            cleaned = cleaner.clean_sample(sample)
            if cleaned is not None:
                cleaned_samples.append(cleaned)
        cleaned_path = store.write_stage_samples(stage="cleaned", samples=cleaned_samples, filename_prefix="cleaned")

        scored_samples: list[ScoredSample] = []
        rejected_samples = []
        for sample in cleaned_samples:
            safety_result = safety_filter.filter_sample(sample)
            scored = scorer.score(sample, safety_result=safety_result)
            scored_samples.append(scored)
            if scored.keep:
                continue
            rejected_samples.append(scored.sample)

        candidate_samples = [item.sample for item in scored_samples if item.keep]
        candidate_path = store.write_stage_samples(
            stage="candidate",
            samples=candidate_samples,
            filename_prefix="candidates",
        )
        rejected_path = store.write_stage_samples(
            stage="rejected",
            samples=rejected_samples,
            filename_prefix="rejected",
        )

        if len(candidate_samples) < cfg.minimum_samples_to_train:
            result = PipelineResult(
                status="skipped",
                started_at=started_at,
                finished_at=_now_iso(),
                summary={
                    "reason": "Not enough candidate samples for batch training.",
                    "manual_trigger_reason": manual_trigger_reason,
                    "raw_samples": len(raw_samples),
                    "cleaned_samples": len(cleaned_samples),
                    "candidate_samples": len(candidate_samples),
                    "rejected_samples": len(rejected_samples),
                    "minimum_samples_to_train": cfg.minimum_samples_to_train,
                    "raw_dump_path": str(raw_dump_path),
                    "cleaned_path": str(cleaned_path),
                    "candidate_path": str(candidate_path),
                    "rejected_path": str(rejected_path),
                    "source_dataset_result": source_dataset_result,
                },
            )
            _write_pipeline_report(cfg, result)
            return result.to_dict()

        dataset_result: DatasetBuildResult = dataset_builder.build(scored_samples)

        dataset_version = version_manager.create_dataset_version(
            manifest_path=dataset_result.manifest_path,
            train_path=dataset_result.train_path,
            valid_path=dataset_result.valid_path,
            test_path=dataset_result.test_path,
            total_samples=dataset_result.kept_count,
            train_count=dataset_result.train_size,
            valid_count=dataset_result.valid_size,
            test_count=dataset_result.test_size,
        )

        training_report: TrainingReport = trainer.run(
            dataset_version=dataset_version.version,
            train_path=dataset_result.train_path,
            valid_path=dataset_result.valid_path,
            test_path=dataset_result.test_path,
        )

        active_model = version_manager.get_active_model()
        current_score = None
        if active_model is not None:
            current_score = evaluator.load_score_from_report(active_model.evaluate_report_path)

        evaluation_report: EvaluationReport = evaluator.evaluate(
            candidate_report=training_report,
            current_score=current_score,
        )

        model_version = version_manager.create_model_version(
            training_report=training_report,
            evaluation_report=evaluation_report,
        )

        promoted = False
        if evaluation_report.promote_recommended:
            promoted_model = version_manager.promote_model(model_version.version)
            promoted = promoted_model is not None and promoted_model.active

        result = PipelineResult(
            status="completed",
            started_at=started_at,
            finished_at=_now_iso(),
            summary={
                "manual_trigger_reason": manual_trigger_reason,
                "raw_samples": len(raw_samples),
                "cleaned_samples": len(cleaned_samples),
                "candidate_samples": len(candidate_samples),
                "rejected_samples": len(rejected_samples),
                "dataset_train_size": dataset_result.train_size,
                "dataset_valid_size": dataset_result.valid_size,
                "dataset_test_size": dataset_result.test_size,
                "raw_dump_path": str(raw_dump_path),
                "cleaned_path": str(cleaned_path),
                "candidate_path": str(candidate_path),
                "rejected_path": str(rejected_path),
                "curated_candidates_path": dataset_result.curated_candidates_path,
                "source_dataset_result": source_dataset_result,
            },
            training_report=training_report.to_dict(),
            evaluation_report=evaluation_report.to_dict(),
            dataset_version=dataset_version.version,
            model_version=model_version.version,
            promoted=promoted,
        )
        _write_pipeline_report(cfg, result)
        return result.to_dict()

    except Exception as exc:
        result = PipelineResult(
            status="failed",
            started_at=started_at,
            finished_at=_now_iso(),
            summary={"manual_trigger_reason": manual_trigger_reason},
            error=str(exc),
        )
        _write_pipeline_report(cfg, result)
        return result.to_dict()


def _write_pipeline_report(config: TrainModelConfig, result: PipelineResult) -> None:
    config.ensure_directories()
    filename = f"pipeline_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    report_path = config.reports_dir / filename
    report_path.write_text(json.dumps(result.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")


def run_emotion_inference_pipeline(
    *,
    user_text: str,
    session_id: str,
    user_id: str | None = None,
    config: TrainModelConfig | None = None,
    memory_manager: MemoryManager | None = None,
) -> dict[str, Any]:
    cfg = config or build_default_config()
    manager = memory_manager or MemoryManager(cfg)
    scorer = SampleScorer(cfg)
    safety_filter = SafetyFilter(cfg)
    heuristic_model = EmotionHeuristicModel(labels=list(cfg.emotion_labels))

    utterance_embedding = build_utterance_embedding(
        user_text,
        dimensions=cfg.emotion_embedding_dimensions,
    )
    emotion_vector = heuristic_model.predict_probabilities(user_text)
    emotion_context = manager.update_emotion_state(
        session_id=session_id,
        user_id=user_id,
        user_message=user_text,
        emotion_vector=emotion_vector,
        utterance_embedding=utterance_embedding,
    )
    session_mood = dict(emotion_context.get("session_mood", {}))
    user_style_projection = dict(emotion_context.get("user_style_projection", {}))
    fused_state = scorer.fuse_emotion_state(
        current_emotion=emotion_vector,
        session_mood=session_mood,
        user_style_embedding=list(emotion_context.get("user_style_embedding", [])),
        user_style_projection=user_style_projection,
    )
    entropy = scorer.compute_entropy(emotion_vector)
    policy = safety_filter.apply_emotion_uncertainty_policy(entropy=entropy)
    tone = scorer.select_response_tone(fused_state, entropy)

    state = EmotionRuntimeState(
        user_text=user_text,
        utterance_embedding=utterance_embedding,
        emotion_vector=emotion_vector,
        session_mood=session_mood,
        user_style_embedding=list(emotion_context.get("user_style_embedding", [])),
        user_style_projection=user_style_projection,
        fused_state=fused_state,
        entropy=entropy,
        response_tone=tone,
        cautious_language=bool(policy["cautious_language"]),
        suggested_prefix=str(policy["suggested_prefix"]),
        high_risk_override=bool(policy["high_risk_override"]),
    )
    return state.to_dict()
