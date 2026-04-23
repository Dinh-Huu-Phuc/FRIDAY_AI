from __future__ import annotations

from collections.abc import Mapping

from ...core.math import binary_cross_entropy


def binary_cross_entropy_loss(probabilities: Mapping[str, float], targets: Mapping[str, float]) -> float:
    return binary_cross_entropy(probabilities, targets)
