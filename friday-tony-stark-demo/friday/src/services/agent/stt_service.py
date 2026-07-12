from __future__ import annotations

import os
from dataclasses import dataclass

import httpx

from friday.config import config
from friday.refiner import STTCorrector


SUPPORTED_AUDIO_TYPES = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "mp4",
}


@dataclass(slots=True)
class SpeechTranscriptionResult:
    raw_text: str
    refined_text: str
    provider: str
    model: str
    language: str
    confidence: float | None = None
    refiner_provider: str | None = None
    refiner_fallback_used: bool = False
    refiner_error: str | None = None

    def to_dict(self) -> dict[str, str | float | bool | None]:
        return {
            "raw_text": self.raw_text,
            "refined_text": self.refined_text,
            "provider": self.provider,
            "model": self.model,
            "language": self.language,
            "confidence": self.confidence,
            "refiner_provider": self.refiner_provider,
            "refiner_fallback_used": self.refiner_fallback_used,
            "refiner_error": self.refiner_error,
        }


class SpeechTranscriptionError(RuntimeError):
    pass


def _resolve_audio_filename(content_type: str) -> str:
    media_type = content_type.split(";", 1)[0].strip().lower()
    extension = SUPPORTED_AUDIO_TYPES.get(media_type, "webm")
    return f"friday-core-input.{extension}"


def _resolve_openai_api_key() -> str:
    return os.getenv("OPENAI_API_KEY") or os.getenv("FRIDAY_LLM_API_KEY") or config.OPENAI_API_KEY


def _build_corrector() -> STTCorrector:
    return STTCorrector(
        enabled=config.STT_REFINER_ENABLED,
        provider_name=config.STT_REFINER_PROVIDER,
        groq_api_key=config.GROQ_API_KEY,
        groq_model=config.GROQ_MODEL,
        openai_api_key=_resolve_openai_api_key(),
        timeout_seconds=config.STT_REFINER_TIMEOUT,
    )


def _apply_intent_aliases(text: str) -> str:
    normalized = " ".join(str(text or "").strip().split())
    aliases = {"firday": "FRIDAY", "fridai": "FRIDAY"}
    return aliases.get(normalized.lower(), normalized)


async def transcribe_core_audio(
    audio_bytes: bytes,
    *,
    content_type: str,
    language: str = "en",
) -> SpeechTranscriptionResult:
    if not audio_bytes:
        raise SpeechTranscriptionError("Audio payload is empty.")

    api_key = _resolve_openai_api_key()
    if not api_key:
        raise SpeechTranscriptionError("OPENAI_API_KEY or FRIDAY_LLM_API_KEY is required for backend STT.")

    base_url = os.getenv("FRIDAY_STT_BASE_URL", os.getenv("FRIDAY_LLM_BASE_URL", "https://api.openai.com/v1")).rstrip("/")
    model = os.getenv("FRIDAY_STT_MODEL", "gpt-4o-mini-transcribe")
    timeout_seconds = float(os.getenv("FRIDAY_STT_TIMEOUT", "45"))
    filename = _resolve_audio_filename(content_type)

    files = {
        "file": (filename, audio_bytes, content_type.split(";", 1)[0].strip() or "audio/webm"),
    }
    data = {
        "model": model,
        "language": language,
    }

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            f"{base_url}/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            data=data,
            files=files,
        )

    if response.status_code >= 400:
        raise SpeechTranscriptionError(f"STT provider failed with status {response.status_code}: {response.text[:300]}")

    payload = response.json()
    raw_text = str(payload.get("text") or "").strip()
    raw_text = _apply_intent_aliases(raw_text)

    if not raw_text:
        raise SpeechTranscriptionError("STT provider returned an empty transcript.")

    correction = _build_corrector().correct(
        raw_text,
        language="en-US",
        conversation_hint="Core AI dashboard voice command. Prefer a concise English command or query.",
        extra_keywords=[
            "today's news",
            "news in Vietnam",
            "world news",
            "weather in Da Lat",
            "observe the screen",
            "daily briefing",
        ],
        extra_aliases={
            "firday": "FRIDAY",
            "fridai": "FRIDAY",
        },
    )

    return SpeechTranscriptionResult(
        raw_text=raw_text,
        refined_text=correction.refined_text or raw_text,
        provider="openai-compatible",
        model=model,
        language=language,
        confidence=None,
        refiner_provider=correction.provider,
        refiner_fallback_used=correction.fallback_used,
        refiner_error=correction.error,
    )
