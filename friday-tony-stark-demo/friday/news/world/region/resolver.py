from __future__ import annotations

import re
import unicodedata

from ...VN.constants import TOPIC_ALIAS_TO_API_CATEGORY

WORLD_SCOPE_ALIASES: tuple[str, ...] = (
    "thế giới",
    "the gioi",
    "quốc tế",
    "quoc te",
    "toàn cầu",
    "toan cau",
    "global",
    "world",
    "international",
)

COUNTRY_ALIAS_TO_WORLD_QUERY: dict[str, str] = {
    "mỹ": "United States",
    "my": "United States",
    "hoa kỳ": "United States",
    "hoa ky": "United States",
    "us": "United States",
    "anh": "United Kingdom",
    "uk": "United Kingdom",
    "nhật": "Japan",
    "nhật bản": "Japan",
    "nhat ban": "Japan",
    "japan": "Japan",
    "hàn quốc": "South Korea",
    "han quoc": "South Korea",
    "korea": "South Korea",
    "trung quốc": "China",
    "trung quoc": "China",
    "china": "China",
    "singapore": "Singapore",
    "thái lan": "Thailand",
    "thai lan": "Thailand",
    "thailand": "Thailand",
    "ukraine": "Ukraine",
    "nga": "Russia",
    "russia": "Russia",
}

TOPIC_TO_WORLD_QUERY: dict[str, str] = {
    "world": '"world" OR global OR international OR geopolitics',
    "business": 'economy OR inflation OR markets OR earnings OR "central bank"',
    "technology": 'technology OR "artificial intelligence" OR AI OR semiconductor OR software',
    "science": 'science OR space OR climate OR research',
    "sports": 'sports OR football OR olympics OR tournament',
    "entertainment": 'entertainment OR film OR music OR celebrity',
    "health": 'health OR medicine OR hospital OR vaccine',
    "politics": 'politics OR government OR election OR diplomacy',
}

DEFAULT_WORLD_QUERY = '"world" OR global OR international OR geopolitics'
WORLD_NEWS_SIGNAL_WORDS: tuple[str, ...] = (
    "tin",
    "news",
    "ban tin",
    "thoi su",
    "hom nay",
    "co gi",
    "cap nhat",
    "moi nhat",
)


def _normalize_for_match(text: str) -> str:
    base = str(text or "").lower().strip()
    normalized = unicodedata.normalize("NFD", base)
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def _contains_alias(text: str, alias: str) -> bool:
    pattern = rf"(?<!\w){re.escape(alias)}(?!\w)"
    return re.search(pattern, text) is not None


def is_world_news_query(text: str) -> bool:
    normalized = _normalize_for_match(text)
    if not normalized:
        return False
    if any(_contains_alias(normalized, _normalize_for_match(item)) for item in WORLD_SCOPE_ALIASES):
        return True
    return any(_contains_alias(normalized, alias) for alias in COUNTRY_ALIAS_TO_WORLD_QUERY)


def looks_like_world_news_request(text: str) -> bool:
    normalized = _normalize_for_match(text)
    if not normalized:
        return False
    if not is_world_news_query(normalized):
        return False
    return any(_contains_alias(normalized, signal) for signal in WORLD_NEWS_SIGNAL_WORDS)


def detect_news_scope(
    text: str,
    *,
    country_code: str | None = None,
    topic: str | None = None,
) -> str:
    normalized = _normalize_for_match(text)
    normalized_country = str(country_code or "").strip().lower()
    normalized_topic = str(topic or "").strip().lower()
    if normalized_topic == "world":
        return "world"
    if normalized_country == "world":
        return "world"
    if normalized_country and normalized_country not in {"vn"}:
        return "world"
    if not normalized:
        return "vn"
    if is_world_news_query(normalized):
        return "world"
    return "vn"


def _detect_country_focus(normalized_text: str) -> str | None:
    for alias, world_query in COUNTRY_ALIAS_TO_WORLD_QUERY.items():
        if _contains_alias(normalized_text, alias):
            return world_query
    return None


def resolve_world_topic(user_text: str, fallback_topic: str | None = None) -> str:
    normalized = _normalize_for_match(user_text)
    for alias, topic in TOPIC_ALIAS_TO_API_CATEGORY.items():
        if topic == "world":
            continue
        if _contains_alias(normalized, alias):
            return topic
    return fallback_topic or "world"


def build_world_query_text(*, user_text: str, topic: str | None = None) -> str:
    normalized = _normalize_for_match(user_text)
    resolved_topic = resolve_world_topic(user_text, fallback_topic=topic)
    topic_query = TOPIC_TO_WORLD_QUERY.get(resolved_topic or "", DEFAULT_WORLD_QUERY)
    country_focus = _detect_country_focus(normalized)
    if country_focus:
        return f'("{country_focus}") AND ({topic_query})'
    return topic_query
