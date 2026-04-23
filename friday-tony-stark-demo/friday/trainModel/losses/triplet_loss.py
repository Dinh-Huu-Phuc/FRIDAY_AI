from __future__ import annotations

from collections.abc import Sequence

from ...core.math import triplet_loss


def triplet_metric_loss(
    anchor: Sequence[float],
    positive: Sequence[float],
    negative: Sequence[float],
    margin: float = 0.2,
) -> float:
    return triplet_loss(anchor, positive, negative, margin=margin)
