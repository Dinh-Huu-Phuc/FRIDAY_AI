from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


def now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


@dataclass(slots=True)
class ConversationSample:
    session_id: str
    timestamp: float
    user_message: str
    assistant_message: str
    user_id: str | None = None
    source: str = "unknown"
    refined_input: str | None = None
    feedback_score: float | None = None
    resolved: bool | None = None
    safety_status: str = "unknown"
    quality_score: float | None = None
    dataset_status: str = "raw"
    metadata: dict[str, Any] = field(default_factory=dict)

    def is_valid(self) -> bool:
        return bool(
            self.session_id.strip()
            and self.user_message.strip()
            and self.assistant_message.strip()
            and self.timestamp > 0
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class SafetyResult:
    safe: bool
    reason: str
    severity: str
    violations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class ScoredSample:
    sample: ConversationSample
    quality_score: float
    keep: bool
    score_breakdown: dict[str, float] = field(default_factory=dict)
    drop_reasons: list[str] = field(default_factory=list)
    emotion_vector: dict[str, float] = field(default_factory=dict)
    session_mood: dict[str, float] = field(default_factory=dict)
    fused_state: dict[str, float] = field(default_factory=dict)
    entropy: float | None = None

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["sample"] = self.sample.to_dict()
        return payload


@dataclass(slots=True)
class TrainingExample:
    system: str
    instruction: str
    output: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class TrainingReport:
    run_id: str
    started_at: float
    finished_at: float
    backend_name: str
    dataset_version: str
    train_path: str
    valid_path: str
    test_path: str
    checkpoint_dir: str
    total_train_samples: int
    total_valid_samples: int
    total_test_samples: int
    metrics: dict[str, float]
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class EvaluationReport:
    candidate_score: float
    current_score: float
    improvement: float
    promote_recommended: bool
    reasons: list[str]
    pass_rate: float
    regression_checks: dict[str, bool]
    evaluated_at: float = field(default_factory=now_ts)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class DatasetVersionMetadata:
    version: str
    created_at: float
    source_manifest_path: str
    train_path: str
    valid_path: str
    test_path: str
    total_samples: int
    train_count: int
    valid_count: int
    test_count: int
    status: str
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class ModelVersionMetadata:
    version: str
    created_at: float
    dataset_version: str
    train_report_path: str
    evaluate_report_path: str
    checkpoint_dir: str
    status: str
    active: bool
    promoted_at: float | None = None
    archived_at: float | None = None
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class MemoryEntry:
    entry_id: str
    user_id: str | None
    session_id: str | None
    key: str
    value: str
    created_at: float = field(default_factory=now_ts)
    updated_at: float = field(default_factory=now_ts)
    source: str = "runtime"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class EmotionRuntimeState:
    user_text: str
    utterance_embedding: list[float] = field(default_factory=list)
    emotion_vector: dict[str, float] = field(default_factory=dict)
    session_mood: dict[str, float] = field(default_factory=dict)
    user_style_embedding: list[float] = field(default_factory=list)
    user_style_projection: dict[str, float] = field(default_factory=dict)
    fused_state: dict[str, float] = field(default_factory=dict)
    entropy: float = 0.0
    response_tone: str = "neutral"
    cautious_language: bool = False
    suggested_prefix: str = ""
    high_risk_override: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
