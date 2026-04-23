from __future__ import annotations

import re

from .schemas import ExtractedSignal


class MemoryExtractor:
    """Rule-based extractor for stable user, project, and task signals."""

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

    INTEREST_PATTERN = re.compile(r"(?i)\btoi thich\s+([^.!\n]{2,120})")
    HABIT_PATTERN = re.compile(r"(?i)\bthuong\s+([^.!\n]{2,120})")
    PROJECT_PATTERNS = [
        re.compile(r"(?i)\bproject hien tai(?: cua toi)?(?: la| dang la|:)?\s+([^.!\n]{3,160})"),
        re.compile(r"(?i)\brepo hien tai(?: cua toi)?(?: la| dang la|:)?\s+([^.!\n]{3,160})"),
        re.compile(r"(?i)\btoi dang lam(?: viec)? tren\s+([^.!\n]{3,160})"),
        re.compile(r"(?i)\btoi dang lam project\s+([^.!\n]{3,160})"),
    ]
    ACTIVE_TASK_PATTERNS = [
        re.compile(r"(?i)\bviec dang do(?: la| gom|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\buu tien hom nay(?: la|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bcan lam tiep(?: la|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\btoi dang sua\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\btoi dang them\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\btoi dang trien khai\s+([^.!\n]{4,160})"),
    ]
    PAUSED_TASK_PATTERNS = [
        re.compile(r"(?i)\btam dung\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bde sau\s+([^.!\n]{4,160})"),
    ]
    BLOCKER_PATTERNS = [
        re.compile(r"(?i)\bblocker(?: la|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bmac o\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bbi ket o\s+([^.!\n]{4,160})"),
    ]
    NEXT_STEP_PATTERNS = [
        re.compile(r"(?i)\bbuoc tiep theo(?: la|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bnen lam tiep(?: la|:)?\s+([^.!\n]{4,160})"),
    ]
    DECISION_PATTERNS = [
        re.compile(r"(?i)\bquyet dinh(?: la|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bchot(?: la|:)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\buu tien(?: se)?\s+([^.!\n]{4,160})"),
        re.compile(r"(?i)\bkhong can\s+([^.!\n]{4,160})"),
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
