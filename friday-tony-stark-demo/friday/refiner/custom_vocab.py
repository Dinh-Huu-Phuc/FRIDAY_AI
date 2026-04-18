from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable


@dataclass(slots=True)
class VocabularyProfile:
    keywords: list[str] = field(default_factory=list)
    alias_map: dict[str, str] = field(default_factory=dict)


def default_vocabulary_profile() -> VocabularyProfile:
    keywords = [
        "Friday",
        "F.R.I.D.A.Y.",
        "Jarvis",
        "Tony Stark",
        "Smart Home",
        "phong khach",
        "phong ngu",
        "phong bep",
        "phong tam",
        "nha xe",
        "nhiet do",
        "do am",
        "dong cua",
        "mo cua",
        "bat den",
        "tat den",
        "bat quat",
        "tat quat",
    ]
    alias_map = {
        "fridai": "Friday",
        "fri day": "Friday",
        "f r i d a y": "Friday",
        "gia viet": "Jarvis",
        "giac vi": "Jarvis",
        "smarthome": "Smart Home",
        "smart hom": "Smart Home",
        "smart homee": "Smart Home",
        "toney stark": "Tony Stark",
        "toni stark": "Tony Stark",
        "phong nguu": "phong ngu",
        "phong khac": "phong khach",
        "phong bepj": "phong bep",
        "nhiet doo": "nhiet do",
        "goi cho me toi": "Goi cho me toi",
        "moi den phong khach": "Mo den phong khach",
        "bat quat phong ngu": "Bat quat phong ngu",
        "tat smart hom": "Tat Smart Home",
    }
    return VocabularyProfile(keywords=keywords, alias_map=alias_map)


def merge_vocabulary(
    base: VocabularyProfile,
    extra_keywords: Iterable[str] | None = None,
    extra_aliases: dict[str, str] | None = None,
) -> VocabularyProfile:
    keywords = list(base.keywords)
    alias_map = dict(base.alias_map)

    if extra_keywords:
        for item in extra_keywords:
            word = str(item).strip()
            if word and word not in keywords:
                keywords.append(word)

    if extra_aliases:
        for key, value in extra_aliases.items():
            alias_key = str(key).strip().lower()
            alias_value = str(value).strip()
            if alias_key and alias_value:
                alias_map[alias_key] = alias_value

    return VocabularyProfile(keywords=keywords, alias_map=alias_map)


def build_vocabulary_context_text(profile: VocabularyProfile) -> str:
    lines = ["- keywords:"]
    for keyword in profile.keywords:
        lines.append(f"  - {keyword}")

    lines.append("- alias_map:")
    if profile.alias_map:
        for wrong, correct in profile.alias_map.items():
            lines.append(f"  - {wrong} -> {correct}")
    else:
        lines.append("  - none")
    return "\n".join(lines)


def normalize_with_aliases(text: str, profile: VocabularyProfile) -> str:
    normalized = text
    for wrong, correct in profile.alias_map.items():
        pattern = re.compile(rf"(?i)\b{re.escape(wrong)}\b")
        normalized = pattern.sub(correct, normalized)
    return normalize_identifier_tokens(normalized)


def normalize_identifier_tokens(text: str) -> str:
    """
    Normalize simple ID/token-like strings in transcript so downstream prompt is stable.
    """
    cleaned = str(text or "")
    cleaned = re.sub(r"\b([A-Za-z])\s*-\s*(\d+)\b", r"\1\2", cleaned)
    cleaned = re.sub(r"\b(id|ma)\s*[:=]\s*([A-Za-z0-9_-]{3,})\b", r"\1 \2", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(token|secret|apikey)\s*[:=]\s*([A-Za-z0-9._-]{6,})\b", r"\1 \2", cleaned, flags=re.IGNORECASE)
    return cleaned
