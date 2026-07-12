from __future__ import annotations

import re

from .schemas import ExtractedSignal


class MemoryExtractor:
    """Rule-based extractor for stable user, project, and task signals."""

    NAME_PATTERNS = [
        re.compile(r"(?i)\bcall me\s+([a-zA-Z0-9_ ]{2,32})"),
        re.compile(r"(?i)\bmy name is\s+([a-zA-Z0-9_ ]{2,32})"),
    ]
    LANGUAGE_PATTERNS = [
        (re.compile(r"(?i)\benglish\b"), "en"),
    ]
    RESPONSE_LENGTH_PATTERNS = [
        (re.compile(r"(?i)\b(short|concise) (answers?|responses?)\b"), "short"),
        (re.compile(r"(?i)\b(detailed|longer) (answers?|responses?)\b"), "long"),
    ]
    TONE_PATTERNS = [
        (re.compile(r"(?i)\bformal\b"), "formal"),
        (re.compile(r"(?i)\b(friendly|natural|casual)\b"), "casual"),
    ]

    INTEREST_PATTERN = re.compile(r"(?i)\bi (?:like|am interested in)\s+([^.!\n]{2,120})")
    HABIT_PATTERN = re.compile(r"(?i)\bi (?:usually|often)\s+([^.!\n]{2,120})")
    PROJECT_PATTERNS = [
        re.compile(r"(?i)\bmy current (?:project|repository|repo)(?: is|:)?\s+([^.!\n]{3,160})"),
        re.compile(r"(?i)\bi am working on\s+([^.!\n]{3,160})"),
    ]
    ACTIVE_TASK_PATTERNS = [
        re.compile(r"(?i)\bunfinished work(?: is| includes|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\btoday'?s priority(?: is|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bi am (?:fixing|adding|implementing)\s+([^.!\n]{4,160})"),
    ]
    PAUSED_TASK_PATTERNS = [
        re.compile(r"(?i)\b(?:pause|defer|leave for later)\s+([^.!\n]{4,160})"),
    ]
    BLOCKER_PATTERNS = [
        re.compile(r"(?i)\b(?:the )?blocker(?: is|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bi am stuck (?:on|at)\s+([^.!\n]{4,160})"),
    ]
    NEXT_STEP_PATTERNS = [
        re.compile(r"(?i)\b(?:the )?next step(?: is|:)?\s+([^.!\n]{4,160})"),
    ]
    DECISION_PATTERNS = [
        re.compile(r"(?i)\b(?:the )?decision(?: is|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bwe decided to\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bprioritize\s+([^.!\n]{4,160})"),
    ]

    def extract(self, user_message: str, assistant_message: str = "") -> ExtractedSignal:
        del assistant_message
        text = str(user_message or "").strip()
        signal = ExtractedSignal(confidence=0.0)
        confidence_hits = 0

        for pattern in self.NAME_PATTERNS:
            match = pattern.search(text)
            if match:
                candidate = self._clean(match.group(1))
                if candidate:
                    signal.preferred_name = candidate
                    confidence_hits += 1
                    break

        if re.search(r"(?i)\baddress me as\b", text):
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

        if self._extend_csv_matches(signal.interests, self.INTEREST_PATTERN, text):
            confidence_hits += 1
        if self._extend_single_matches(signal.habits, [self.HABIT_PATTERN], text):
            confidence_hits += 1
        if self._extend_single_matches(signal.active_projects, self.PROJECT_PATTERNS, text):
            confidence_hits += 1
        if self._extend_single_matches(signal.active_tasks, self.ACTIVE_TASK_PATTERNS, text):
            confidence_hits += 1
        if self._extend_single_matches(signal.paused_tasks, self.PAUSED_TASK_PATTERNS, text):
            confidence_hits += 1
        if self._extend_single_matches(signal.blockers, self.BLOCKER_PATTERNS, text):
            confidence_hits += 1
        if self._extend_single_matches(signal.next_steps, self.NEXT_STEP_PATTERNS, text):
            confidence_hits += 1
        if self._extend_single_matches(signal.technical_decisions, self.DECISION_PATTERNS, text):
            confidence_hits += 1

        if signal.active_projects:
            signal.project_notes.extend(f"project_focus:{item}" for item in signal.active_projects)
        if signal.technical_decisions:
            signal.notes.extend(f"decision:{item}" for item in signal.technical_decisions)
        if signal.active_tasks:
            signal.notes.extend(f"active_task:{item}" for item in signal.active_tasks)
        if signal.blockers:
            signal.notes.extend(f"blocker:{item}" for item in signal.blockers)
        if signal.next_steps:
            signal.notes.extend(f"next_step:{item}" for item in signal.next_steps)
        if signal.preferred_name:
            signal.notes.append(f"preferred_name:{signal.preferred_name}")
        if signal.preferred_language:
            signal.notes.append(f"preferred_language:{signal.preferred_language}")
        if signal.preferred_response_length:
            signal.notes.append(f"preferred_response_length:{signal.preferred_response_length}")
        if signal.preferred_tone:
            signal.notes.append(f"preferred_tone:{signal.preferred_tone}")

        signal.confidence = min(1.0, confidence_hits / 8.0)
        return signal

    def _extend_csv_matches(self, target: list[str], pattern: re.Pattern[str], text: str) -> bool:
        added = False
        for match in pattern.finditer(text):
            values = [self._clean(item) for item in match.group(1).split(",")]
            for value in values:
                if value:
                    target.append(value)
                    added = True
        return added

    def _extend_single_matches(
        self,
        target: list[str],
        patterns: list[re.Pattern[str]],
        text: str,
    ) -> bool:
        added = False
        for pattern in patterns:
            for match in pattern.finditer(text):
                value = self._clean(match.group(1))
                if value:
                    target.append(value)
                    added = True
        return added

    def _clean(self, value: str) -> str:
        cleaned = str(value or "").strip(" .,:;!-")
        if len(cleaned) < 2:
            return ""
        return cleaned
