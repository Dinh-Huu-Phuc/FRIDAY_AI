from __future__ import annotations


def calibrate_emotion_scores(scores: dict[str, float], *, temperature: float = 1.0) -> dict[str, float]:
    if temperature <= 0:
        temperature = 1.0
    calibrated = {key: max(0.0, min(1.0, float(value) / temperature)) for key, value in scores.items()}
    total = sum(calibrated.values())
    if total <= 0:
        return calibrated
    return {key: value / total for key, value in calibrated.items()}
