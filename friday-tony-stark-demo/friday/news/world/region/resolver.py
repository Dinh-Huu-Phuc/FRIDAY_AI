from __future__ import annotations

import re
import unicodedata

from ...VN.constants import TOPIC_ALIAS_TO_API_CATEGORY

WORLD_SCOPE_ALIASES = ("global", "world", "international")
COUNTRY_ALIAS_TO_WORLD_QUERY = {
    "us": "United States", "usa": "United States", "united states": "United States",
    "uk": "United Kingdom", "united kingdom": "United Kingdom",
    "japan": "Japan", "south korea": "South Korea", "korea": "South Korea",
    "china": "China", "singapore": "Singapore", "thailand": "Thailand",
    "ukraine": "Ukraine", "russia": "Russia",
}
TOPIC_TO_WORLD_QUERY = {
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
WORLD_NEWS_SIGNAL_WORDS = ("news", "headlines", "briefing", "today", "update", "latest")


def _normalize_for_match(text: str) -> str:
    base = str(text or "").lower().strip()
    normalized = unicodedata.normalize("NFD", base)
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", normalized)


def _contains_alias(text: str, alias: str) -> bool:
    return re.search(rf"(?<!\w){re.escape(alias)}(?!\w)", text) is not None


def is_world_news_query(text: str) -> bool:
    normalized = _normalize_for_match(text)
    if not normalized:
        return False
    return any(_contains_alias(normalized, item) for item in WORLD_SCOPE_ALIASES) or any(
        _contains_alias(normalized, alias) for alias in COUNTRY_ALIAS_TO_WORLD_QUERY
    )


def looks_like_world_news_request(text: str) -> bool:
    normalized = _normalize_for_match(text)
    return bool(
        normalized
        and is_world_news_query(normalized)
        and any(_contains_alias(normalized, signal) for signal in WORLD_NEWS_SIGNAL_WORDS)
    )


def detect_news_scope(text: str, *, country_code: str | None = None, topic: str | None = None) -> str:
    normalized = _normalize_for_match(text)
    normalized_country = str(country_code or "").strip().lower()
    normalized_topic = str(topic or "").strip().lower()
    if normalized_topic == "world" or normalized_country == "world":
        return "world"
    if normalized_country and normalized_country != "vn":
        return "world"
    return "world" if normalized and is_world_news_query(normalized) else "vn"


def _detect_country_focus(normalized_text: str) -> str | None:
    for alias, world_query in COUNTRY_ALIAS_TO_WORLD_QUERY.items():
        if _contains_alias(normalized_text, alias):
            return world_query
    return None


def resolve_world_topic(user_text: str, fallback_topic: str | None = None) -> str:
    normalized = _normalize_for_match(user_text)
    for alias, topic in TOPIC_ALIAS_TO_API_CATEGORY.items():
        if topic != "world" and _contains_alias(normalized, alias):
            return topic
    return fallback_topic or "world"


def build_world_query_text(*, user_text: str, topic: str | None = None) -> str:
    normalized = _normalize_for_match(user_text)
    resolved_topic = resolve_world_topic(user_text, fallback_topic=topic)
    topic_query = TOPIC_TO_WORLD_QUERY.get(resolved_topic or "", DEFAULT_WORLD_QUERY)
    country_focus = _detect_country_focus(normalized)
    return f'("{country_focus}") AND ({topic_query})' if country_focus else topic_query
