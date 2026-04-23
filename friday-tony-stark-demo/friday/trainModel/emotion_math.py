from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

from ..core.constants import DEFAULT_ALPHA, DEFAULT_EPSILON, DEFAULT_USER_STYLE_LAMBDA, DEFAULT_W1, DEFAULT_W2, DEFAULT_W3
from ..core.math import binary_cross_entropy as shared_binary_cross_entropy
from ..core.math import entropy as shared_entropy
from ..core.math import fuse_state, sigmoid as shared_sigmoid, smooth_session_mood as shared_smooth_session_mood, update_user_style

DEFAULT_EMOTION_LABELS: tuple[str, ...] = (
    "joy",
    "sadness",
    "anger",
    "frustration",
    "fear",
    "anxiety",
    "neutral",
)

EMOTION_KEYWORDS: dict[str, tuple[str, ...]] = {
    "joy": ("happy", "great", "good", "nice", "vui", "ok", "awesome", "excellent"),
    "sadness": ("sad", "down", "tired", "buon", "met", "cry"),
    "anger": ("angry", "furious", "hate", "dien", "cay"),
    "frustration": ("frustrated", "stuck", "fail", "broken", "loi"),
    "fear": ("afraid", "scared", "danger", "so", "nguy"),
    "anxiety": ("anxious", "worried", "stress", "panic", "lo lang"),
    "neutral": ("hello", "hi", "check", "open", "status", "xem"),
}


def sigmoid(x: float) -> float:
    return shared_sigmoid(x)


def clamp_probability(value: float, epsilon: float = DEFAULT_EPSILON) -> float:
    return max(epsilon, min(1.0 - epsilon, float(value)))


def normalize_labels(labels: Iterable[str] | None = None) -> list[str]:
    normalized = [str(label).strip().lower() for label in (labels or DEFAULT_EMOTION_LABELS) if str(label).strip()]
    return normalized or list(DEFAULT_EMOTION_LABELS)


def ensure_probability_vector(
    values: dict[str, float] | None,
    labels: Iterable[str] | None = None,
    *,
    default_value: float = 0.0,
) -> dict[str, float]:
    label_list = normalize_labels(labels)
    payload = values or {}
    return {label: clamp_probability(float(payload.get(label, default_value))) for label in label_list}


def parse_multi_label_targets(
    target: dict[str, float] | list[str] | tuple[str, ...] | None,
    labels: Iterable[str] | None = None,
) -> dict[str, float]:
    label_list = normalize_labels(labels)
    if isinstance(target, dict):
        return {label: 1.0 if float(target.get(label, 0.0)) >= 0.5 else 0.0 for label in label_list}
    active = {str(item).strip().lower() for item in (target or []) if str(item).strip()}
    return {label: 1.0 if label in active else 0.0 for label in label_list}


def binary_cross_entropy(
    probabilities: dict[str, float],
    targets: dict[str, float],
    *,
    epsilon: float = DEFAULT_EPSILON,
) -> float:
    return shared_binary_cross_entropy(probabilities, targets, epsilon=epsilon)


def compute_entropy(probabilities: dict[str, float], *, epsilon: float = DEFAULT_EPSILON) -> float:
    return shared_entropy(probabilities, epsilon=epsilon)


def smooth_session_mood(
    previous_mood: dict[str, float] | None,
    current_emotion: dict[str, float],
    *,
    alpha: float = DEFAULT_ALPHA,
    labels: Iterable[str] | None = None,
) -> dict[str, float]:
    label_list = normalize_labels(labels or current_emotion.keys())
    current = ensure_probability_vector(current_emotion, label_list)
    previous = ensure_probability_vector(previous_mood or {}, label_list)
    return ensure_probability_vector(shared_smooth_session_mood(previous, current, alpha=alpha), label_list)


def update_user_style_memory(
    previous_embedding: list[float] | None,
    current_embedding: list[float],
    *,
    retention: float = DEFAULT_USER_STYLE_LAMBDA,
) -> list[float]:
    return update_user_style(previous_embedding, current_embedding, retention_lambda=retention)


def project_embedding_to_emotion_space(
    embedding: list[float] | None,
    labels: Iterable[str] | None = None,
) -> dict[str, float]:
    label_list = normalize_labels(labels)
    if not embedding:
        return {label: 0.0 for label in label_list}
    sized = _pad_vector(embedding, len(label_list))
    return {label: clamp_probability(sigmoid(sized[index])) for index, label in enumerate(label_list)}


def fuse_emotion_state(
    current_emotion: dict[str, float],
    session_mood: dict[str, float],
    user_style_projection: dict[str, float],
    *,
    weight_current: float = DEFAULT_W1,
    weight_session: float = DEFAULT_W2,
    weight_user: float = DEFAULT_W3,
    labels: Iterable[str] | None = None,
) -> dict[str, float]:
    label_list = normalize_labels(labels or current_emotion.keys())
    return ensure_probability_vector(
        fuse_state(
            ensure_probability_vector(current_emotion, label_list),
            ensure_probability_vector(session_mood, label_list),
            ensure_probability_vector(user_style_projection, label_list),
            w1=weight_current,
            w2=weight_session,
            w3=weight_user,
        ),
        label_list,
    )


def compute_multi_label_metrics(
    predictions: list[dict[str, float]],
    targets: list[dict[str, float]],
    *,
    labels: Iterable[str] | None = None,
    threshold: float = 0.5,
) -> dict[str, float]:
    label_list = normalize_labels(labels)
    if not predictions or not targets:
        return {
            "binary_cross_entropy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1": 0.0,
            "macro_f1": 0.0,
            "micro_f1": 0.0,
        }
    precision_sum = 0.0
    recall_sum = 0.0
    f1_sum = 0.0
    total_tp = total_fp = total_fn = 0
    bce_values: list[float] = []
    for label in label_list:
        tp = fp = fn = 0
        for prediction, target in zip(predictions, targets):
            pred_value = 1 if float(prediction.get(label, 0.0)) >= threshold else 0
            target_value = 1 if float(target.get(label, 0.0)) >= 0.5 else 0
            if pred_value == 1 and target_value == 1:
                tp += 1
            elif pred_value == 1 and target_value == 0:
                fp += 1
            elif pred_value == 0 and target_value == 1:
                fn += 1
        precision = tp / max(tp + fp, 1)
        recall = tp / max(tp + fn, 1)
        f1 = _f1(precision, recall)
        precision_sum += precision
        recall_sum += recall
        f1_sum += f1
        total_tp += tp
        total_fp += fp
        total_fn += fn
    for prediction, target in zip(predictions, targets):
        bce_values.append(binary_cross_entropy(prediction, target))
    macro_precision = precision_sum / max(len(label_list), 1)
    macro_recall = recall_sum / max(len(label_list), 1)
    macro_f1 = f1_sum / max(len(label_list), 1)
    micro_precision = total_tp / max(total_tp + total_fp, 1)
    micro_recall = total_tp / max(total_tp + total_fn, 1)
    return {
        "binary_cross_entropy": sum(bce_values) / max(len(bce_values), 1),
        "precision": macro_precision,
        "recall": macro_recall,
        "f1": macro_f1,
        "macro_f1": macro_f1,
        "micro_f1": _f1(micro_precision, micro_recall),
    }


def build_utterance_embedding(text: str, *, dimensions: int = 8) -> list[float]:
    cleaned = str(text or "").strip().lower()
    if not cleaned:
        return [0.0] * max(dimensions, 1)
    tokens = re.findall(r"\w+", cleaned)
    dims = max(dimensions, 1)
    buckets = [0.0] * dims
    for index, token in enumerate(tokens):
        bucket = index % dims
        score = (sum(ord(char) for char in token) % 97) / 97.0
        buckets[bucket] += score
    scale = max(len(tokens), 1)
    return [value / scale for value in buckets]


@dataclass(slots=True)
class EmotionHeuristicModel:
    labels: list[str]

    def predict_probabilities(self, text: str) -> dict[str, float]:
        lowered = str(text or "").lower()
        logits = {label: -1.2 for label in self.labels}
        for label in self.labels:
            hits = sum(1 for keyword in EMOTION_KEYWORDS.get(label, ()) if keyword in lowered)
            logits[label] += hits * 1.0
        if "neutral" in logits and any(word in lowered for word in ("?", "please", "help", "open")):
            logits["neutral"] += 0.5
        probabilities = {label: sigmoid(logit) for label, logit in logits.items()}
        if all(probability < 0.5 for probability in probabilities.values()) and "neutral" in probabilities:
            probabilities["neutral"] = max(probabilities["neutral"], 0.6)
        return ensure_probability_vector(probabilities, self.labels)


def _pad_vector(values: list[float], size: int) -> list[float]:
    if len(values) >= size:
        return [float(item) for item in values[:size]]
    return [float(item) for item in values] + [0.0] * (size - len(values))


def _f1(precision: float, recall: float) -> float:
    if precision + recall <= 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)
