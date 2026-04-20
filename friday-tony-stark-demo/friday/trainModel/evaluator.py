from __future__ import annotations

import json
from pathlib import Path

from .config import TrainModelConfig
from .schemas import EvaluationReport, TrainingReport


class CandidateEvaluator:
    """
    Compare candidate model quality against current active model.
    """

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config

    def evaluate(
        self,
        candidate_report: TrainingReport,
        current_score: float | None = None,
    ) -> EvaluationReport:
        metrics = candidate_report.metrics
        pass_rate = float(metrics.get("pass_rate", 0.0))
        quality_mean = float(metrics.get("quality_mean", 0.0))
        valid_loss = float(metrics.get("valid_loss", 9.99))
        test_loss = float(metrics.get("test_loss", 9.99))
        macro_f1 = float(metrics.get("macro_f1", metrics.get("f1", 0.0)))
        micro_f1 = float(metrics.get("micro_f1", 0.0))

        candidate_score = self._candidate_score(pass_rate, quality_mean, valid_loss, test_loss, macro_f1, micro_f1)
        baseline_score = float(current_score if current_score is not None else 0.0)
        improvement = candidate_score - baseline_score

        regression_checks = {
            "pass_rate_ok": pass_rate >= self.config.evaluation_min_pass_rate,
            "valid_loss_ok": valid_loss <= 1.2,
            "test_loss_ok": test_loss <= 1.3,
            "macro_f1_ok": macro_f1 >= 0.45,
            "micro_f1_ok": micro_f1 >= 0.45,
            "candidate_score_ok": candidate_score >= self.config.evaluation_min_candidate_score,
            "improvement_ok": (
                improvement >= self.config.evaluation_required_improvement
                if current_score is not None
                else True
            ),
        }

        promote_recommended = all(regression_checks.values())
        reasons = self._build_reasons(
            promote_recommended=promote_recommended,
            candidate_score=candidate_score,
            baseline_score=baseline_score,
            improvement=improvement,
            regression_checks=regression_checks,
        )

        report = EvaluationReport(
            candidate_score=round(candidate_score, 6),
            current_score=round(baseline_score, 6),
            improvement=round(improvement, 6),
            promote_recommended=promote_recommended,
            reasons=reasons,
            pass_rate=round(pass_rate, 6),
            regression_checks=regression_checks,
        )
        self._write_report(candidate_report.run_id, report)
        return report

    def load_score_from_report(self, report_path: str | Path) -> float | None:
        path = Path(report_path)
        if not path.exists():
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            return float(payload.get("candidate_score"))
        except Exception:
            return None

    def _candidate_score(
        self,
        pass_rate: float,
        quality_mean: float,
        valid_loss: float,
        test_loss: float,
        macro_f1: float,
        micro_f1: float,
    ) -> float:
        base = 0.20 + 0.35 * pass_rate + 0.25 * quality_mean + 0.12 * macro_f1 + 0.08 * micro_f1
        loss_penalty = min(0.35, max(0.0, (valid_loss - 0.25) * 0.18))
        test_penalty = min(0.30, max(0.0, (test_loss - 0.25) * 0.15))
        score = base - loss_penalty - test_penalty
        return max(0.0, min(1.0, score))

    def _build_reasons(
        self,
        *,
        promote_recommended: bool,
        candidate_score: float,
        baseline_score: float,
        improvement: float,
        regression_checks: dict[str, bool],
    ) -> list[str]:
        reasons: list[str] = []
        if promote_recommended:
            reasons.append(
                f"Candidate passed checks. score={candidate_score:.4f}, current={baseline_score:.4f}, improvement={improvement:.4f}"
            )
            return reasons

        for check_name, check_ok in regression_checks.items():
            if not check_ok:
                reasons.append(f"Failed check: {check_name}")
        reasons.append(
            f"Candidate score={candidate_score:.4f}, current score={baseline_score:.4f}, improvement={improvement:.4f}"
        )
        return reasons

    def _write_report(self, run_id: str, report: EvaluationReport) -> None:
        self.config.ensure_directories()
        report_path = self.config.reports_dir / f"evaluation_{run_id}.json"
        report_path.write_text(json.dumps(report.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
