from __future__ import annotations

import re

from .constants import LANGUAGE_ALIASES
from .schemas import LanguageDetectionResult

_PERSISTENT_PATTERNS = (
    re.compile(r"\bfrom now on\b", re.IGNORECASE),
    re.compile(r"\balways answer\b", re.IGNORECASE),
    re.compile(r"\btu gio\b", re.IGNORECASE),
    re.compile(r"\bluon tra loi\b", re.IGNORECASE),
)

_SWITCH_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bswitch to english\b", re.IGNORECASE), "en"),
    (re.compile(r"\banswer in english\b", re.IGNORECASE), "en"),
    (re.compile(r"\bn[oó]i ti[eế]ng anh\b", re.IGNORECASE), "en"),
    (re.compile(r"\btr[aả] l[oờ]i b[aằ]ng ti[eế]ng anh\b", re.IGNORECASE), "en"),
    (re.compile(r"\banswer in vietnamese\b", re.IGNORECASE), "vi"),
    (re.compile(r"\bn[oó]i ti[eế]ng vi[eệ]t\b", re.IGNORECASE), "vi"),
    (re.compile(r"\btr[aả] l[oờ]i b[aằ]ng ti[eế]ng vi[eệ]t\b", re.IGNORECASE), "vi"),
]


def detect_language_switch(user_text: str) -> LanguageDetectionResult:
    text = user_text.strip()
    if not text:
        return LanguageDetectionResult(should_switch=False)

    lowered = text.lower()
    persistent = any(pattern.search(text) for pattern in _PERSISTENT_PATTERNS)

    for token, target in LANGUAGE_ALIASES.items():
        if token in lowered and any(word in lowered for word in ("switch", "answer", "nói", "noi", "trả lời", "tra loi")):
            return LanguageDetectionResult(should_switch=True, language=target, persistent=persistent)

    for pattern, lang in _SWITCH_PATTERNS:
        if pattern.search(text):
            return LanguageDetectionResult(should_switch=True, language=lang, persistent=persistent)

    return LanguageDetectionResult(should_switch=False)
