from __future__ import annotations

from functools import lru_cache
from pathlib import Path

LLM_DESIGN_PRINCIPLES_PATH = Path(__file__).resolve().parent / "llm_design_principles.md"

DEFAULT_LLM_DESIGN_PRINCIPLES = """
1. Never train a model after every chat turn.
2. Runtime memory supports live reasoning and must not update model weights directly.
3. Training data must pass cleaning, safety filtering, scoring, and evaluation before promotion.
4. Every model lifecycle must support versioning, reports, and rollback.
""".strip()

STT_REFINER_PROMPT_TEMPLATE = """
You correct Speech-to-Text transcripts for the FRIDAY assistant.

Correct spelling, punctuation, misheard words, and casing while preserving the user's original meaning. Prefer natural English and use the custom vocabulary when relevant. Do not answer the request.

Return exactly one corrected sentence with no explanation, markdown, quotation marks, preamble, or additional lines.

Context:
- language: {language}
- conversation_hint: {conversation_hint}
- custom_vocabulary:
{custom_vocabulary}

Raw transcript:
{raw_transcript}
""".strip()

NEWS_ROUTING_PROMPT_TEMPLATE = """
When the user asks for current, daily, technology, finance, AI, or breaking news, use the internal news pipeline first. Summarize available results in three-to-five concise English sentences. Never expose raw JSON or implementation details. If live data fails, provide a calm and honest fallback.
""".strip()

SOCIAL_ROUTING_PROMPT_TEMPLATE = """
When the user asks to open a social platform, use open_social_platform_homepage with the original command. Support Facebook, YouTube, Instagram, TikTok, X/Twitter, LinkedIn, Pinterest, Reddit, Telegram, and Discord. Return the operation result without adding tool names or technical explanation.
""".strip()

FACEBOOK_PAGE_ROUTING_PROMPT_TEMPLATE = """
Use check_facebook_messages for Facebook Page or Messenger message requests and check_facebook_notifications for notifications, comments, interactions, or feed events. Summarize results in concise natural English without naming tools. If no synchronized data exists, state that the Facebook Page webhook must be configured.
""".strip()

SOCIAL_OPEN_RUNTIME_HINT_TEMPLATE = """
[SOCIAL_OPEN_CONTEXT]
- The request is a social-platform open command.
- Resolved platform: {platform_name}
- The browser action has already completed.
- Reply with exactly: "{assistant_reply}"
- Do not add text or call more tools.
""".strip()


@lru_cache(maxsize=1)
def get_llm_design_principles_text() -> str:
    return _load_text_file_with_fallback(
        file_path=LLM_DESIGN_PRINCIPLES_PATH,
        fallback_text=DEFAULT_LLM_DESIGN_PRINCIPLES,
    )


def build_stt_refiner_prompt(
    *, raw_transcript: str, language: str = "en-US", conversation_hint: str = "", custom_vocabulary: str = ""
) -> str:
    return STT_REFINER_PROMPT_TEMPLATE.format(
        language=language.strip() or "en-US",
        conversation_hint=conversation_hint.strip() or "none",
        custom_vocabulary=custom_vocabulary.strip() or "- none",
        raw_transcript=raw_transcript.strip() or "(empty)",
    )


def get_news_routing_prompt() -> str:
    return NEWS_ROUTING_PROMPT_TEMPLATE


def get_social_routing_prompt() -> str:
    return SOCIAL_ROUTING_PROMPT_TEMPLATE


def get_facebook_page_routing_prompt() -> str:
    return FACEBOOK_PAGE_ROUTING_PROMPT_TEMPLATE


def build_social_open_runtime_hint(*, command: str, platform_name: str | None, assistant_reply: str) -> str:
    _ = command
    return SOCIAL_OPEN_RUNTIME_HINT_TEMPLATE.format(
        platform_name=(platform_name or "unknown").strip() or "unknown",
        assistant_reply=assistant_reply.strip(),
    )


def _load_text_file_with_fallback(*, file_path: Path, fallback_text: str) -> str:
    try:
        content = file_path.read_text(encoding="utf-8").strip()
        return content or fallback_text
    except (OSError, UnicodeDecodeError):
        return fallback_text


def register(mcp):
    @mcp.prompt()
    def summarize(text: str) -> str:
        """Prompt to summarize a block of text."""
        return f"Summarize the following text concisely in natural English:\n\n{text}"

    @mcp.prompt()
    def explain_code(code: str, language: str = "Python") -> str:
        """Prompt to explain a block of code."""
        return f"Explain this {language} code in clear English, step by step:\n\n```{language.lower()}\n{code}\n```"
