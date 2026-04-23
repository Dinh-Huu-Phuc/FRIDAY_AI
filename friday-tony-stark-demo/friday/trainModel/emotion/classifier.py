from __future__ import annotations

from ..emotion_math import EmotionHeuristicModel, normalize_labels


def classify_emotion_multilabel(text: str, labels: list[str] | None = None) -> dict[str, float]:
    label_list = normalize_labels(labels)
    model = EmotionHeuristicModel(labels=label_list)
    return model.predict_probabilities(text)
