from __future__ import annotations

import math
import re

from .config import TrainModelConfig
from .emotion_math import compute_entropy, ensure_probability_vector, fuse_emotion_state, project_embedding_to_emotion_space
from .schemas import ConversationSample, SafetyResult, ScoredSample


class SampleScorer:
    """
    Score each cleaned sample from 0.0 to 1.0 and decide keep/drop.
    """

    STOPWORDS = {
        "the",
        "a",
        "an",
        "to",
        "is",
        "are",
        "la",
        "va",
        "cho",
        "cua",
        "toi",
        "ban",
        "anh",
        "chi",
        "em",
    }

    GENERIC_PATTERNS = [
        re.compile(r"(?i)\btoi khong biet\b"),
        re.compile(r"(?i)\bi don't know\b"),
        re.compile(r"(?i)\bxin loi, toi khong the\b"),
        re.compile(r"(?i)\bkhong co thong tin\b"),
    ]

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config

    def score(self, sample: ConversationSample, safety_result: SafetyResult | None = None) -> ScoredSample:
        if safety_result is not None and not safety_result.safe:
            sample.safety_status = "unsafe"
            sample.quality_score = 0.0
            sample.dataset_status = "rejected"
            return ScoredSample(
                sample=sample,
                quality_score=0.0,
                keep=False,
                score_breakdown={"safety_penalty": 1.0},
                drop_reasons=[f"unsafe:{safety_result.reason}"],
            )

        question_score = self._question_clarity_score(sample.user_message)
        relevance_score = self._relevance_score(sample.user_message, sample.assistant_message)
        answer_length_score = self._answer_length_score(sample.user_message, sample.assistant_message)
        feedback_score = self._feedback_signal(sample.feedback_score, sample.resolved)
        generic_penalty = self._generic_penalty(sample.assistant_message)
        emotion_vector = self._emotion_vector_from_metadata(sample.metadata)
        entropy = self.compute_entropy(emotion_vector)
        emotion_confidence_score = self._emotion_confidence_score(entropy)
        session_mood = self._session_mood_from_metadata(sample.metadata, emotion_vector)
        fused_state = self.fuse_emotion_state(
            current_emotion=emotion_vector,
            session_mood=session_mood,
            user_style_embedding=self._user_style_embedding_from_metadata(sample.metadata),
            user_style_projection=self._user_style_projection_from_metadata(sample.metadata),
        )

        weighted = (
            0.25 * question_score
            + 0.35 * relevance_score
            + 0.20 * answer_length_score
            + 0.20 * feedback_score
            + 0.05 * emotion_confidence_score
            - generic_penalty
        )
        quality_score = max(0.0, min(1.0, weighted))

        keep = quality_score >= self.config.keep_score_threshold
        sample.safety_status = "safe"
        sample.quality_score = quality_score
        sample.dataset_status = "candidate" if keep else "rejected"
        reasons: list[str] = []
        if not keep:
            reasons.append(
                f"quality_score_below_threshold:{quality_score:.3f}<{self.config.keep_score_threshold:.3f}"
            )
        if generic_penalty > 0:
            reasons.append("generic_response_penalty")

        return ScoredSample(
            sample=sample,
            quality_score=quality_score,
            keep=keep,
            score_breakdown={
                "question_clarity": question_score,
                "relevance": relevance_score,
                "answer_length": answer_length_score,
                "feedback_signal": feedback_score,
                "generic_penalty": generic_penalty,
                "emotion_confidence": emotion_confidence_score,
                "emotion_entropy": entropy,
            },
            drop_reasons=reasons,
            emotion_vector=emotion_vector,
            session_mood=session_mood,
            fused_state=fused_state,
            entropy=entropy,
        )

    def compute_entropy(self, emotion_vector: dict[str, float]) -> float:
        return compute_entropy(emotion_vector, epsilon=self.config.emotion_entropy_epsilon)

    def fuse_emotion_state(
        self,
        *,
        current_emotion: dict[str, float],
        session_mood: dict[str, float],
        user_style_embedding: list[float] | None = None,
        user_style_projection: dict[str, float] | None = None,
    ) -> dict[str, float]:
        projection = user_style_projection or project_embedding_to_emotion_space(
            user_style_embedding or [],
            labels=self.config.emotion_labels,
        )
        return fuse_emotion_state(
            current_emotion=current_emotion,
            session_mood=session_mood,
            user_style_projection=projection,
            weight_current=self.config.emotion_fusion_weight_current,
            weight_session=self.config.emotion_fusion_weight_session,
            weight_user=self.config.emotion_fusion_weight_user,
            labels=self.config.emotion_labels,
        )

    def select_response_tone(self, fused_state: dict[str, float], entropy: float) -> str:
        if entropy >= self.config.emotion_high_entropy_threshold:
            return "tentative"
        strongest_label = max(fused_state.items(), key=lambda item: item[1])[0] if fused_state else "neutral"
        if strongest_label in {"anger", "frustration"}:
            return "calm_supportive"
        if strongest_label in {"sadness", "fear", "anxiety"}:
            return "gentle_supportive"
        if strongest_label == "joy":
            return "warm_positive"
        return "neutral"

    def _question_clarity_score(self, question: str) -> float:
        q = question.strip()
        if len(q) < self.config.min_question_chars:
            return 0.0
        if len(q) > 1200:
            return 0.4
        has_punctuation = any(token in q for token in ("?", ".", "!", ":"))
        score = 0.55 + 0.25 * math.tanh(len(q) / 80.0)
        if has_punctuation:
            score += 0.1
        return max(0.0, min(1.0, score))

    def _relevance_score(self, question: str, answer: str) -> float:
        q_tokens = self._tokenize(question)
        a_tokens = self._tokenize(answer)
        if not q_tokens or not a_tokens:
            return 0.0
        overlap = len(q_tokens & a_tokens)
        ratio = overlap / max(len(q_tokens), 1)
        return max(0.0, min(1.0, 0.2 + ratio))

    def _answer_length_score(self, question: str, answer: str) -> float:
        q_len = len(question.strip())
        a_len = len(answer.strip())
        if a_len < self.config.min_answer_chars:
            return 0.0

        ratio = a_len / max(q_len, 1)
        if 0.6 <= ratio <= 5.0:
            return 1.0
        if 0.3 <= ratio < 0.6:
            return 0.7
        if 5.0 < ratio <= 8.0:
            return 0.65
        return 0.4

    def _feedback_signal(self, feedback_score: float | None, resolved: bool | None) -> float:
        score = 0.5
        if feedback_score is not None:
            normalized = max(0.0, min(1.0, float(feedback_score)))
            score = 0.7 * score + 0.3 * normalized
        if resolved is True:
            score += 0.2
        if resolved is False:
            score -= 0.2
        return max(0.0, min(1.0, score))

    def _generic_penalty(self, answer: str) -> float:
        for pattern in self.GENERIC_PATTERNS:
            if pattern.search(answer):
                return 0.25
        return 0.0

    def _emotion_confidence_score(self, entropy: float) -> float:
        threshold = max(self.config.emotion_high_entropy_threshold, 1e-6)
        return max(0.0, min(1.0, 1.0 - entropy / (threshold * 1.5)))

    def _emotion_vector_from_metadata(self, metadata: dict[str, object]) -> dict[str, float]:
        if not isinstance(metadata, dict):
            return {label: 0.0 for label in self.config.emotion_labels}
        raw = metadata.get("emotion_vector")
        if not isinstance(raw, dict):
            return {label: 0.0 for label in self.config.emotion_labels}
        return ensure_probability_vector(
            {str(key): float(value) for key, value in raw.items()},
            self.config.emotion_labels,
        )

    def _session_mood_from_metadata(
        self,
        metadata: dict[str, object],
        emotion_vector: dict[str, float],
    ) -> dict[str, float]:
        if isinstance(metadata, dict) and isinstance(metadata.get("session_mood"), dict):
            return ensure_probability_vector(
                {str(key): float(value) for key, value in dict(metadata["session_mood"]).items()},
                self.config.emotion_labels,
            )
        return emotion_vector

    def _user_style_embedding_from_metadata(self, metadata: dict[str, object]) -> list[float]:
        if not isinstance(metadata, dict):
            return []
        raw = metadata.get("user_style_embedding")
        if not isinstance(raw, list):
            return []
        return [float(item) for item in raw]

    def _user_style_projection_from_metadata(self, metadata: dict[str, object]) -> dict[str, float]:
        if not isinstance(metadata, dict):
            return {}
        raw = metadata.get("user_style_projection")
        if not isinstance(raw, dict):
            return {}
        return ensure_probability_vector(
            {str(key): float(value) for key, value in raw.items()},
            self.config.emotion_labels,
        )

    def _tokenize(self, text: str) -> set[str]:
        tokens = re.findall(r"[a-zA-Z0-9_]{2,}", text.lower())
        return {token for token in tokens if token not in self.STOPWORDS}
