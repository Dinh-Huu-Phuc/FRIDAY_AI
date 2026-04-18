from __future__ import annotations

import re

from .config import TrainModelConfig
from .schemas import ConversationSample


class DataCleaner:
    """
    Normalize text and mask basic sensitive information patterns.
    """

    EMAIL_PATTERN = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")
    PHONE_PATTERN = re.compile(r"\b(?:\+?\d{1,3})?[-.\s]?(?:\d[-.\s]?){8,12}\b")
    ID_CARD_PATTERN = re.compile(r"\b\d{9,12}\b")
    TOKEN_PATTERN = re.compile(r"\bsk-[a-zA-Z0-9]{16,}\b")
    KEY_VALUE_SECRET_PATTERN = re.compile(
        r"(?i)\b(api[_-]?key|access[_-]?token|secret|password)\b\s*[:=]\s*([^\s,;]+)"
    )

    def __init__(self, config: TrainModelConfig) -> None:
        self.config = config

    def clean_sample(self, sample: ConversationSample) -> ConversationSample | None:
        user_message = self._normalize_text(sample.user_message)
        assistant_message = self._normalize_text(sample.assistant_message)

        user_message = self._mask_sensitive(user_message)
        assistant_message = self._mask_sensitive(assistant_message)

        if len(user_message) < self.config.min_question_chars:
            return None
        if len(assistant_message) < self.config.min_answer_chars:
            return None

        cleaned_metadata = dict(sample.metadata)
        cleaned_metadata["cleaned"] = True

        return ConversationSample(
            session_id=sample.session_id,
            user_id=sample.user_id,
            timestamp=sample.timestamp,
            user_message=user_message,
            assistant_message=assistant_message,
            source=sample.source,
            refined_input=sample.refined_input,
            feedback_score=sample.feedback_score,
            resolved=sample.resolved,
            safety_status=sample.safety_status,
            quality_score=sample.quality_score,
            dataset_status="cleaned",
            metadata=cleaned_metadata,
        )

    def _normalize_text(self, text: str) -> str:
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        lines = [self._squash_spaces(line) for line in normalized.split("\n")]
        lines = [line for line in lines if line]
        return "\n".join(lines).strip()

    def _squash_spaces(self, line: str) -> str:
        return re.sub(r"[ \t]+", " ", line).strip()

    def _mask_sensitive(self, text: str) -> str:
        text = self.EMAIL_PATTERN.sub("[REDACTED_EMAIL]", text)
        text = self.PHONE_PATTERN.sub("[REDACTED_PHONE]", text)
        text = self.ID_CARD_PATTERN.sub("[REDACTED_ID]", text)
        text = self.TOKEN_PATTERN.sub("[REDACTED_TOKEN]", text)
        text = self.KEY_VALUE_SECRET_PATTERN.sub(r"\1=[REDACTED_SECRET]", text)
        return text
