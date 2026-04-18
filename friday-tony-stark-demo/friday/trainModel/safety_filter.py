from __future__ import annotations

import re
from dataclasses import dataclass

from .schemas import ConversationSample, SafetyResult


@dataclass(slots=True)
class SafetyRule:
    name: str
    pattern: re.Pattern[str]
    reason: str
    severity: str


class SafetyFilter:
    """
    Rule-based filter that blocks low-quality or unsafe records before scoring.
    """

    def __init__(self) -> None:
        self.error_rules = [
            SafetyRule(
                name="traceback",
                pattern=re.compile(r"(?i)\b(traceback|exception|stack\s*trace)\b"),
                reason="Assistant output indicates runtime error.",
                severity="high",
            ),
            SafetyRule(
                name="hard_refusal",
                pattern=re.compile(r"(?i)\b(i cannot help|toi khong the giup|cannot comply)\b"),
                reason="Assistant output is refusal-only and not useful for training.",
                severity="medium",
            ),
            SafetyRule(
                name="toxic",
                pattern=re.compile(r"(?i)\b(hate|kill|self-harm|terror)\b"),
                reason="Potentially harmful content detected.",
                severity="critical",
            ),
        ]
        self.private_data_spam_pattern = re.compile(r"\[REDACTED_(?:EMAIL|PHONE|ID|TOKEN|SECRET)\]")
        self.gibberish_pattern = re.compile(r"(.)\1{8,}")

    def filter_sample(self, sample: ConversationSample) -> SafetyResult:
        user_text = sample.user_message.strip()
        assistant_text = sample.assistant_message.strip()
        combined_text = f"{user_text}\n{assistant_text}"

        if not user_text or not assistant_text:
            return SafetyResult(
                safe=False,
                reason="Empty user or assistant message.",
                severity="high",
                violations=["empty_content"],
            )

        if self.gibberish_pattern.search(combined_text):
            return SafetyResult(
                safe=False,
                reason="Repeated-character gibberish detected.",
                severity="high",
                violations=["gibberish"],
            )

        redacted_hits = len(self.private_data_spam_pattern.findall(combined_text))
        if redacted_hits >= 4:
            return SafetyResult(
                safe=False,
                reason="Too much sensitive content in a single sample.",
                severity="high",
                violations=["excessive_sensitive_data"],
            )

        for rule in self.error_rules:
            if rule.pattern.search(combined_text):
                return SafetyResult(
                    safe=False,
                    reason=rule.reason,
                    severity=rule.severity,
                    violations=[rule.name],
                )

        if self._looks_like_spam(user_text, assistant_text):
            return SafetyResult(
                safe=False,
                reason="Likely spam or meaningless content.",
                severity="medium",
                violations=["spam_like"],
            )

        return SafetyResult(safe=True, reason="Sample passed rule-based safety checks.", severity="low")

    def _looks_like_spam(self, user_text: str, assistant_text: str) -> bool:
        user_tokens = user_text.lower().split()
        assistant_tokens = assistant_text.lower().split()
        if len(user_tokens) <= 2 and len(assistant_tokens) <= 2:
            return True

        repeated_user_tokens = len(user_tokens) - len(set(user_tokens))
        repeated_assistant_tokens = len(assistant_tokens) - len(set(assistant_tokens))
        return repeated_user_tokens > len(user_tokens) * 0.7 or repeated_assistant_tokens > len(
            assistant_tokens
        ) * 0.7

