from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


def _default_module_dir() -> Path:
    return Path(__file__).resolve().parent


@dataclass(slots=True)
class TrainModelConfig:
    """
    Central configuration for long-term training pipeline and runtime memory.
    """

    module_dir: Path = field(default_factory=_default_module_dir)
    log_source_dir: Path | None = None
    storage_dir: Path | None = None

    raw_logs_dir: Path | None = None
    cleaned_dir: Path | None = None
    candidates_dir: Path | None = None
    curated_dir: Path | None = None
    datasets_dir: Path | None = None
    archived_dir: Path | None = None
    checkpoints_dir: Path | None = None
    reports_dir: Path | None = None
    versions_dir: Path | None = None
    memory_store_dir: Path | None = None

    min_question_chars: int = 3
    min_answer_chars: int = 8
    keep_score_threshold: float = 0.55
    train_split_ratio: float = 0.8
    valid_split_ratio: float = 0.1
    test_split_ratio: float = 0.1
    random_seed: int = 42
    minimum_samples_to_train: int = 20

    evaluation_min_candidate_score: float = 0.60
    evaluation_min_pass_rate: float = 0.70
    evaluation_required_improvement: float = 0.01

    training_system_prompt: str = (
        "Ban la tro ly AI F.R.I.D.A.Y. cua Tony Stark. "
        "Tra loi dung trong boi canh cau hoi, ro rang, huu ich, ngan gon khi can."
    )

    memory_session_turn_limit: int = 30
    memory_user_interest_limit: int = 40
    memory_user_habit_limit: int = 30
    memory_user_note_limit: int = 50
    memory_project_item_limit: int = 40
    memory_task_item_limit: int = 40
    memory_max_text_chars: int = 1200
    memory_session_ttl_seconds: int = 7 * 24 * 3600
    emotion_labels: tuple[str, ...] = (
        "joy",
        "sadness",
        "anger",
        "frustration",
        "fear",
        "anxiety",
        "neutral",
    )
    emotion_session_alpha: float = 0.8
    emotion_user_style_lambda: float = 0.9
    emotion_fusion_weight_current: float = 0.5
    emotion_fusion_weight_session: float = 0.3
    emotion_fusion_weight_user: float = 0.2
    emotion_entropy_epsilon: float = 1e-12
    emotion_high_entropy_threshold: float = 1.4
    emotion_embedding_dimensions: int = 8

    auto_train_enabled: bool = True
    auto_train_check_interval_seconds: int = 300
    auto_train_daily_time_utc: str = "02:00"
    auto_train_min_pending_samples: int = 50

    def __post_init__(self) -> None:
        if self.log_source_dir is None:
            self.log_source_dir = self.module_dir.parent / "log" / "saveLog"

        if self.storage_dir is None:
            self.storage_dir = self.module_dir / "storage"

        if self.raw_logs_dir is None:
            self.raw_logs_dir = self.storage_dir / "raw_logs"

        if self.cleaned_dir is None:
            self.cleaned_dir = self.storage_dir / "cleaned"

        if self.candidates_dir is None:
            self.candidates_dir = self.storage_dir / "candidates"

        if self.curated_dir is None:
            self.curated_dir = self.storage_dir / "curated"

        if self.datasets_dir is None:
            self.datasets_dir = self.storage_dir / "datasets"

        if self.archived_dir is None:
            self.archived_dir = self.storage_dir / "archived"

        if self.checkpoints_dir is None:
            self.checkpoints_dir = self.storage_dir / "checkpoints"

        if self.reports_dir is None:
            self.reports_dir = self.storage_dir / "reports"

        if self.versions_dir is None:
            self.versions_dir = self.storage_dir / "versions"

        if self.memory_store_dir is None:
            self.memory_store_dir = self.storage_dir / "memory_store"

        self._normalize_split_ratios()
        self._normalize_emotion_defaults()

    def _normalize_split_ratios(self) -> None:
        total = self.train_split_ratio + self.valid_split_ratio + self.test_split_ratio
        if total <= 0:
            self.train_split_ratio = 0.8
            self.valid_split_ratio = 0.1
            self.test_split_ratio = 0.1
            return
        self.train_split_ratio = self.train_split_ratio / total
        self.valid_split_ratio = self.valid_split_ratio / total
        self.test_split_ratio = self.test_split_ratio / total

    def _normalize_emotion_defaults(self) -> None:
        if not self.emotion_labels:
            self.emotion_labels = (
                "joy",
                "sadness",
                "anger",
                "frustration",
                "fear",
                "anxiety",
                "neutral",
            )
        total = (
            self.emotion_fusion_weight_current
            + self.emotion_fusion_weight_session
            + self.emotion_fusion_weight_user
        )
        if total <= 0:
            self.emotion_fusion_weight_current = 0.5
            self.emotion_fusion_weight_session = 0.3
            self.emotion_fusion_weight_user = 0.2
            return
        self.emotion_fusion_weight_current /= total
        self.emotion_fusion_weight_session /= total
        self.emotion_fusion_weight_user /= total

    def ensure_directories(self) -> None:
        required_dirs = (
            self.storage_dir,
            self.raw_logs_dir,
            self.cleaned_dir,
            self.candidates_dir,
            self.curated_dir,
            self.datasets_dir,
            self.archived_dir,
            self.checkpoints_dir,
            self.reports_dir,
            self.versions_dir,
            self.memory_store_dir,
        )
        for directory in required_dirs:
            directory.mkdir(parents=True, exist_ok=True)


def build_default_config() -> TrainModelConfig:
    config = TrainModelConfig()
    config.ensure_directories()
    return config
