from __future__ import annotations

from collections.abc import Sequence

from ...core.math import mean_squared_error


def regress_emotion_scores(y_true: Sequence[float], y_pred: Sequence[float]) -> float:
    return mean_squared_error(y_true, y_pred)
