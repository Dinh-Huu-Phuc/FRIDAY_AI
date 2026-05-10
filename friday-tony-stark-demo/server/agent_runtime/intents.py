from __future__ import annotations

import re

from friday.app import resolve_social_platform


SOCIAL_OPEN_INTENT_PATTERN = re.compile(
    r"\b(mo|mở|vao|vào|truy\s*cap|truy\s*cập|open)\b",
    re.IGNORECASE,
)
WINDOWS_APP_OPEN_INTENT_PATTERN = re.compile(
    r"\b(mo|mở|bat|bật|chay|chạy|open|launch|start)\b",
    re.IGNORECASE,
)
WINDOWS_APP_CLEANUP_PATTERN = re.compile(
    r"\b(friday|firday|giup\s*to|giúp\s*tớ|giup\s*toi|giúp\s*tôi|cho\s*to|cho\s*tớ|cho\s*toi|cho\s*tôi|nhe|nhé|di|đi|app|ung\s*dung|ứng\s*dụng)\b",
    re.IGNORECASE,
)
DAILY_BRIEFING_PATTERN = re.compile(
    r"\b(briefing|báo nhanh|báo cáo nhanh|bắt đầu ngày|đầu ngày|đầu phiên|tóm tắt hôm nay|hôm nay có gì|việc đang dở)\b",
    re.IGNORECASE,
)
GMAIL_CHECK_PATTERN = re.compile(
    r"\b(check\s*(email|gmail|mail)|read\s*(email|gmail|mail)|gmail|inbox|kiểm\s*tra\s*(email|gmail|mail)|kiem\s*tra\s*(email|gmail|mail)|đọc\s*(email|gmail|mail)|doc\s*(email|gmail|mail)|email\s*(chưa|chua)\s*đọc|email\s*mới|email\s*moi)\b",
    re.IGNORECASE,
)


def is_social_open_request(text: str) -> bool:
    candidate = str(text or "").strip()
    if not candidate:
        return False
    if resolve_social_platform(candidate) is None:
        return False
    return bool(SOCIAL_OPEN_INTENT_PATTERN.search(candidate))


def is_daily_briefing_request(text: str) -> bool:
    candidate = str(text or "").strip()
    if not candidate:
        return False
    return bool(DAILY_BRIEFING_PATTERN.search(candidate))


def is_gmail_check_request(text: str) -> bool:
    candidate = str(text or "").strip()
    if not candidate:
        return False
    return bool(GMAIL_CHECK_PATTERN.search(candidate))


def extract_windows_app_query(text: str) -> str:
    candidate = str(text or "").strip()
    if not candidate or not WINDOWS_APP_OPEN_INTENT_PATTERN.search(candidate):
        return ""

    without_verb = WINDOWS_APP_OPEN_INTENT_PATTERN.sub(" ", candidate, count=1)
    cleaned = WINDOWS_APP_CLEANUP_PATTERN.sub(" ", without_verb)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,.!?;:-")
    return cleaned or candidate

