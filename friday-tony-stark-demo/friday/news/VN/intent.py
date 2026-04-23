from __future__ import annotations

import re
import unicodedata

from .constants import (
    COUNTRY_ALIAS_TO_CODE,
    DEFAULT_NEWS_COUNTRY,
    DEFAULT_NEWS_LANGUAGE,
    DEFAULT_NEWS_LIMIT,
    LANGUAGE_ALIAS_TO_CODE,
    MAX_NEWS_LIMIT,
    NEWS_INTENT_KEYWORDS,
    TOPIC_ALIAS_TO_API_CATEGORY,
)
from .schemas import NewsQuery


def _normalize_for_match(text: str) -> str:
    base = str(text or "").lower().strip()
    normalized = unicodedata.normalize("NFD", base)
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def is_news_query(text: str) -> bool:
    normalized = _normalize_for_match(text)
    if not normalized:
        return False

    if any(keyword in normalized for keyword in NEWS_INTENT_KEYWORDS):
        return True

    has_topic = any(alias in normalized for alias in TOPIC_ALIAS_TO_API_CATEGORY)
    has_news_word = any(word in normalized for word in ("tin", "news", "ban tin", "thoi su"))
    has_update_phrase = any(
        phrase in normalized
        for phrase in (
            "co gi",
            "hom nay",
            "dang chu y",
            "cap nhat",
            "tom tat",
            "moi nhat",
        )
    )
    return has_topic and (has_news_word or has_update_phrase)


def looks_like_daily_news_request(text: str) -> bool:
    normalized = _normalize_for_match(text)
    if not normalized:
        return False
    has_news_word = any(word in normalized for word in ("tin", "news", "ban tin", "thoi su"))
    has_update_phrase = any(
        phrase in normalized
        for phrase in (
            "co gi",
            "hom nay",
            "dang chu y",
            "cap nhat",
            "tom tat",
            "moi nhat",
            "trong nuoc",
            "viet nam",
        )
    )
    return has_news_word and has_update_phrase


def _detect_topic(normalized_text: str) -> str | None:
    for alias, topic in TOPIC_ALIAS_TO_API_CATEGORY.items():
        if alias in normalized_text:
            return topic
    return None


def _detect_country(normalized_text: str) -> str | None:
    for alias, country_code in COUNTRY_ALIAS_TO_CODE.items():
        if alias in normalized_text:
            return country_code
    return None


def _detect_language(normalized_text: str, default_language: str) -> str:
    for alias, lang_code in LANGUAGE_ALIAS_TO_CODE.items():
        if alias in normalized_text:
            return lang_code
    return default_language


def _detect_limit(normalized_text: str, default_limit: int) -> int:
    match = re.search(r"\b(\d{1,2})\s*(tin|bai|news|muc)\b", normalized_text)
    if not match:
        return default_limit
    value = int(match.group(1))
    return min(max(value, 1), MAX_NEWS_LIMIT)


def extract_news_filters(
    text: str,
    *,
    default_language: str = DEFAULT_NEWS_LANGUAGE,
    default_country: str = DEFAULT_NEWS_COUNTRY,
    default_limit: int = DEFAULT_NEWS_LIMIT,
) -> NewsQuery:
    normalized = _normalize_for_match(text)
    topic = _detect_topic(normalized)
    country = _detect_country(normalized) or default_country
    language = _detect_language(normalized, default_language)
    limit = _detect_limit(normalized, default_limit)

    return NewsQuery(
        topic=topic,
        country=country,
        language=language,
        limit=limit,
        page=None,
        text_query=None,
    )
