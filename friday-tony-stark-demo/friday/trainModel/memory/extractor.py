from __future__ import annotations

import re

from .schemas import ExtractedSignal


class MemoryExtractor:
    """
    Rule-based extractor for user preferences and habits.
    """

    NAME_PATTERNS = [
        re.compile(r"(?i)\bgoi toi la\s+([a-zA-Z0-9_ ]{2,32})"),
        re.compile(r"(?i)\bten toi la\s+([a-zA-Z0-9_ ]{2,32})"),
    ]
    LANGUAGE_PATTERNS = [
        (re.compile(r"(?i)\b(tieng viet|vietnamese)\b"), "vi"),
        (re.compile(r"(?i)\b(tieng anh|english)\b"), "en"),
    ]
    RESPONSE_LENGTH_PATTERNS = [
        (re.compile(r"(?i)\b(tra loi ngan|ngan gon)\b"), "short"),
        (re.compile(r"(?i)\b(tra loi chi tiet|dai hon)\b"), "long"),
    ]
    TONE_PATTERNS = [
        (re.compile(r"(?i)\b(trang trong|formal)\b"), "formal"),
        (re.compile(r"(?i)\b(than thien|tu nhien|casual)\b"), "casual"),
    ]
    INTEREST_PATTERN = re.compile(r"(?i)\btoi thich\s+([a-zA-Z0-9_ ,]{2,80})")
    HABIT_PATTERN = re.compile(r"(?i)\bthuong\s+([a-zA-Z0-9_ ,]{2,80})")

    def extract(self, user_message: str, assistant_message: str = "") -> ExtractedSignal:
        text = f"{user_message}\n{assistant_message}".strip()
        signal = ExtractedSignal(confidence=0.0)
        confidence_hits = 0

        for pattern in self.NAME_PATTERNS:
            match = pattern.search(text)
            if match:
                candidate = match.group(1).strip()
                if candidate:
                    signal.preferred_name = candidate
                    confidence_hits += 1
                    break

        if re.search(r"(?i)\bxung ho", text):
            signal.addressing_style = "custom"
            confidence_hits += 1

        for pattern, language in self.LANGUAGE_PATTERNS:
            if pattern.search(text):
                signal.preferred_language = language
                confidence_hits += 1
                break

        for pattern, response_length in self.RESPONSE_LENGTH_PATTERNS:
            if pattern.search(text):
                signal.preferred_response_length = response_length
                confidence_hits += 1
                break

        for pattern, tone in self.TONE_PATTERNS:
            if pattern.search(text):
                signal.preferred_tone = tone
                confidence_hits += 1
                break

        for match in self.INTEREST_PATTERN.finditer(text):
            values = [item.strip() for item in match.group(1).split(",")]
            signal.interests.extend([item for item in values if item])
            confidence_hits += 1

        for match in self.HABIT_PATTERN.finditer(text):
            habit = match.group(1).strip()
            if habit:
                signal.habits.append(habit)
                confidence_hits += 1

        if signal.preferred_name:
            signal.notes.append(f"preferred_name:{signal.preferred_name}")
        if signal.preferred_language:
            signal.notes.append(f"preferred_language:{signal.preferred_language}")
        if signal.preferred_response_length:
            signal.notes.append(f"preferred_response_length:{signal.preferred_response_length}")
        if signal.preferred_tone:
            signal.notes.append(f"preferred_tone:{signal.preferred_tone}")

        signal.confidence = min(1.0, confidence_hits / 6.0)
        return signal

