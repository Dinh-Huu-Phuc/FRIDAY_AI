from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Iterable


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
    "joy": ("happy", "great", "good", "nice", "vui", "ổn", "ok", "awesome", "excellent"),
    "sadness": ("sad", "down", "tired", "buồn", "mệt", "thất vọng", "cry"),
    "anger": ("angry", "furious", "hate", "điên", "bực", "cay", "ức"),
    "frustration": ("frustrated", "stuck", "fail", "broken", "khó chịu", "bực", "lỗi", "không được"),
    "fear": ("afraid", "scared", "danger", "sợ", "nguy", "lo"),
    "anxiety": ("anxious", "worried", "stress", "panic", "áp lực", "lo lắng", "căng"),
    "neutral": ("hello", "hi", "check", "open", "status", "xem", "mở", "kiểm tra"),
}


def sigmoid(x: float) -> float:
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def clamp_probability(value: float, epsilon: float = 1e-12) -> float:
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
    epsilon: float = 1e-12,
) -> float:
    losses: list[float] = []
    for label, probability in probabilities.items():
        target = float(targets.get(label, 0.0))
        prob = clamp_probability(probability, epsilon)
        losses.append(-(target * math.log(prob) + (1.0 - target) * math.log(1.0 - prob)))
    return sum(losses) / max(len(losses), 1)


def compute_entropy(probabilities: dict[str, float], *, epsilon: float = 1e-12) -> float:
    return -sum(clamp_probability(value, epsilon) * math.log(clamp_probability(value, epsilon)) for value in probabilities.values())


def smooth_session_mood(
    previous_mood: dict[str, float] | None,
    current_emotion: dict[str, float],
    *,
    alpha: float,
    labels: Iterable[str] | None = None,
) -> dict[str, float]:
    label_list = normalize_labels(labels or current_emotion.keys())
    current = ensure_probability_vector(current_emotion, label_list)
    if not previous_mood:
        return current
    previous = ensure_probability_vector(previous_mood, label_list)
    return {
        label: clamp_probability(alpha * previous[label] + (1.0 - alpha) * current[label])
        for label in label_list
    }


def update_user_style_memory(
    previous_embedding: list[float] | None,
    current_embedding: list[float],
    *,
    retention: float,
) -> list[float]:
    if not current_embedding:
        return list(previous_embedding or [])
    if not previous_embedding:
        return [float(item) for item in current_embedding]

    size = max(len(previous_embedding), len(current_embedding))
    previous = _pad_vector(previous_embedding, size)
    current = _pad_vector(current_embedding, size)
    return [retention * prev + (1.0 - retention) * cur for prev, cur in zip(previous, current)]


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
    weight_current: float,
    weight_session: float,
    weight_user: float,
    labels: Iterable[str] | None = None,
) -> dict[str, float]:
    label_list = normalize_labels(labels or current_emotion.keys())
    current = ensure_probability_vector(current_emotion, label_list)
    session = ensure_probability_vector(session_mood, label_list)
    style = ensure_probability_vector(user_style_projection, label_list)
    total = weight_current + weight_session + weight_user
    if total <= 0:
        weight_current, weight_session, weight_user = 0.5, 0.3, 0.2
        total = 1.0
    return {
        label: clamp_probability(
            (weight_current * current[label] + weight_session * session[label] + weight_user * style[label]) / total
        )
        for label in label_list
    }


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
    total_tp = 0
    total_fp = 0
    total_fn = 0
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
    micro_f1 = _f1(micro_precision, micro_recall)
    return {
        "binary_cross_entropy": sum(bce_values) / max(len(bce_values), 1),
        "precision": macro_precision,
        "recall": macro_recall,
        "f1": macro_f1,
        "macro_f1": macro_f1,
        "micro_f1": micro_f1,
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

        exclamations = lowered.count("!")
        if "frustration" in logits:
            logits["frustration"] += min(1.0, exclamations * 0.15)
        if "anger" in logits:
            logits["anger"] += min(0.8, exclamations * 0.10)
        if "neutral" in logits and any(word in lowered for word in ("?", "please", "giúp", "help", "mở", "open")):
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
