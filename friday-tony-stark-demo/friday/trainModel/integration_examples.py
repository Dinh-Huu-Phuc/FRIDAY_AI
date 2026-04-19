from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from .config import build_default_config
from .conversation_store import ConversationDatasetStore
from .memory import MemoryManager
from .pipeline import run_training_pipeline
from .scheduler import BatchTrainingScheduler
from friday.refiner import STTCorrector


def example_run_pipeline_daily_batch() -> dict[str, Any]:
    """
    Example: run long-term training by batch (manual, scheduler, or cron).
    """
    return run_training_pipeline(manual_trigger_reason="daily_batch")


def example_start_batch_scheduler() -> BatchTrainingScheduler:
    """
    Example: start scheduler that triggers batch pipeline by daily time or sample threshold.
    """
    config = build_default_config()
    scheduler = BatchTrainingScheduler(config)
    scheduler.start()
    return scheduler


def example_store_conversation_without_training() -> str:
    """
    Example: store conversation as raw dataset record and do NOT train immediately.
    """
    config = build_default_config()
    store = ConversationDatasetStore(config)
    path = store.append_raw_turn(
        session_id="session_demo_001",
        user_id="user_demo",
        user_message="mở đèn phòng khách",
        assistant_message="Đã rõ, tôi mở đèn phòng khách ngay.",
        source="agent_runtime",
        refined_input="Mở đèn phòng khách",
        metadata={"channel": "voice"},
    )
    return str(path)


async def example_agent_loop_with_memory(
    *,
    session_id: str,
    user_id: str | None,
    user_message: str,
    generate_reply: Callable[[str], Awaitable[str]],
    memory_manager: MemoryManager | None = None,
) -> str:
    """
    Example: direct runtime usage in agent loop.
    """
    manager = memory_manager or MemoryManager()
    memory_prefix = manager.build_instruction_prefix(session_id=session_id, user_id=user_id)
    prompt_for_model = f"{memory_prefix}\n\n[USER_MESSAGE]\n{user_message}"

    assistant_reply = await generate_reply(prompt_for_model)
    manager.update_memory_after_response(
        session_id=session_id,
        user_id=user_id,
        user_message=user_message,
        assistant_message=assistant_reply,
        metadata={"source": "agent_loop"},
    )
    return assistant_reply


def example_stt_refiner_usage() -> dict[str, Any]:
    """
    Example: run STT correction without changing agent flow.
    """
    corrector = STTCorrector(
        enabled=True,
        provider_name="groq",
        groq_api_key="",
        timeout_seconds=2.0,
    )
    result = corrector.correct(
        "fridai hôm nay thời tiết sao",
        language="vi-VN",
        conversation_hint="Ngữ cảnh trợ lý nhà thông minh",
    )
    return {
        "raw_text": result.raw_text,
        "normalized_text": result.normalized_text,
        "refined_text": result.refined_text,
        "provider": result.provider,
        "fallback_used": result.fallback_used,
    }


def example_stt_refiner_input_output_pairs() -> list[dict[str, str]]:
    """
    Example: five input/output pairs expected by the STT correction module.
    """
    return [
        {"input": "mở đèn phòng khách", "output": "Mở đèn phòng khách"},
        {"input": "bật quạt phòng ngủ", "output": "Bật quạt phòng ngủ"},
        {"input": "fridai hôm nay thời tiết sao", "output": "Friday, hôm nay thời tiết sao?"},
        {"input": "gọi cho mẹ tôi", "output": "Gọi cho mẹ tôi"},
        {"input": "tắt smart home", "output": "Tắt Smart Home"},
    ]
