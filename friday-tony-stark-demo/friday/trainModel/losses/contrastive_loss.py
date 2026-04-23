from __future__ import annotations

from collections.abc import Sequence

from ...core.math import contrastive_loss


def contrastive_metric_loss(a: Sequence[float], b: Sequence[float], y: int, margin: float = 0.2) -> float:
    return contrastive_loss(a, b, y, margin=margin)
