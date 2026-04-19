"""
MCP prompts and shared prompt helpers.
"""

from friday.prompts import templates


def register_all_prompts(mcp) -> None:
    templates.register(mcp)


def get_llm_design_principles_text() -> str:
    return templates.get_llm_design_principles_text()


def build_stt_refiner_prompt(
    *,
    raw_transcript: str,
    language: str = "vi-VN",
    conversation_hint: str = "",
    custom_vocabulary: str = "",
) -> str:
    return templates.build_stt_refiner_prompt(
        raw_transcript=raw_transcript,
        language=language,
        conversation_hint=conversation_hint,
        custom_vocabulary=custom_vocabulary,
    )


def get_news_routing_prompt() -> str:
    return templates.get_news_routing_prompt()


def get_social_routing_prompt() -> str:
    return templates.get_social_routing_prompt()


def get_facebook_page_routing_prompt() -> str:
    return templates.get_facebook_page_routing_prompt()


def build_social_open_runtime_hint(
    *,
    command: str,
    platform_name: str | None,
    assistant_reply: str,
) -> str:
    return templates.build_social_open_runtime_hint(
        command=command,
        platform_name=platform_name,
        assistant_reply=assistant_reply,
    )
