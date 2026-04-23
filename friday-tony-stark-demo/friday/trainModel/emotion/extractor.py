from __future__ import annotations

from ..emotion_math import build_utterance_embedding


def extract_emotion_features(text: str, *, dimensions: int = 8) -> list[float]:
    return build_utterance_embedding(text, dimensions=dimensions)
