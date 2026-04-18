from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone

from .config import TrainModelConfig
from .conversation_store import ConversationDatasetStore
from .pipeline import run_training_pipeline

logger = logging.getLogger("friday-train-scheduler")


@dataclass(slots=True)
class SchedulerState:
    running: bool = False
    last_trigger_reason: str | None = None
    last_run_started_at: str | None = None
    last_run_status: str | None = None


class BatchTrainingScheduler:
    """
    Auto scheduler for training pipeline.
    Trigger by:
    - daily UTC time
    - pending raw conversation threshold
    """

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config
        self.state = SchedulerState()
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._run_lock = threading.Lock()
        self._last_daily_run_date: str | None = None
        self._store = ConversationDatasetStore(config)
        self._hour_utc, self._minute_utc = self._parse_daily_time(config.auto_train_daily_time_utc)

    def start(self) -> None:
        if not self.config.auto_train_enabled:
            logger.info("Batch scheduler disabled by config.")
            return
        if self._thread is not None and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, name="batch-training-scheduler", daemon=True)
        self._thread.start()
        self.state.running = True
        logger.info(
            "Batch scheduler started: interval=%ss daily_utc=%02d:%02d threshold=%s",
            self.config.auto_train_check_interval_seconds,
            self._hour_utc,
            self._minute_utc,
            self.config.auto_train_min_pending_samples,
        )

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self.state.running = False
        logger.info("Batch scheduler stopped.")

    def run_now(self, reason: str = "manual_trigger") -> dict:
        with self._run_lock:
            self.state.last_trigger_reason = reason
            self.state.last_run_started_at = datetime.now(timezone.utc).isoformat()
            result = run_training_pipeline(self.config, manual_trigger_reason=reason)
            self.state.last_run_status = str(result.get("status"))
            return result

    def _loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                reason = self._check_trigger_reason()
                if reason:
                    logger.info("Batch scheduler trigger: %s", reason)
                    self.run_now(reason=reason)
            except Exception as exc:
                logger.warning("Batch scheduler loop warning: %s", exc)
            self._stop_event.wait(timeout=max(15, self.config.auto_train_check_interval_seconds))

    def _check_trigger_reason(self) -> str | None:
        now = datetime.now(timezone.utc)
        today = now.strftime("%Y-%m-%d")

        if (
            now.hour > self._hour_utc
            or (now.hour == self._hour_utc and now.minute >= self._minute_utc)
        ) and self._last_daily_run_date != today:
            self._last_daily_run_date = today
            return f"daily_schedule_{today}_{self._hour_utc:02d}{self._minute_utc:02d}Z"

        pending = self._store.count_pending_raw_records()
        if pending >= self.config.auto_train_min_pending_samples:
            return f"pending_raw_threshold_{pending}"

        return None

    def _parse_daily_time(self, text: str) -> tuple[int, int]:
        raw = (text or "").strip()
        if ":" not in raw:
            return 2, 0
        hour_str, minute_str = raw.split(":", maxsplit=1)
        try:
            hour = max(0, min(23, int(hour_str)))
            minute = max(0, min(59, int(minute_str)))
            return hour, minute
        except ValueError:
            return 2, 0

