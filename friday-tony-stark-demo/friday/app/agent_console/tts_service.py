from __future__ import annotations

import os
from functools import lru_cache

from friday.googleServiceCloud.credentials import ensure_google_application_credentials
from livekit.plugins import deepgram, google as lk_google, openai as lk_openai, sarvam

DEFAULT_TTS_PROVIDER = os.getenv("PAGECLIENT_TTS_PROVIDER", os.getenv("TTS_PROVIDER", "openai")).strip().lower()
DEFAULT_TTS_SPEED = float(os.getenv("PAGECLIENT_TTS_SPEED", os.getenv("TTS_SPEED", "1.15")))


def _resolve_provider(provider: str) -> str:
    selected = (provider or "auto").strip().lower()
    if selected == "auto":
        selected = DEFAULT_TTS_PROVIDER or "openai"
    return selected


@lru_cache(maxsize=8)
def _build_tts(provider: str):
    selected = _resolve_provider(provider)

    if selected == "deepgram":
        return deepgram.TTS(
            model=os.getenv("DEEPGRAM_TTS_MODEL", "aura-2-andromeda-en"),
            sample_rate=int(os.getenv("DEEPGRAM_TTS_SAMPLE_RATE", "24000")),
            api_key=os.getenv("DEEPGRAM_API_KEY") or None,
        )

    if selected == "google":
        credentials_file = ensure_google_application_credentials()
        return lk_google.TTS(
            language=os.getenv("GOOGLE_TTS_LANGUAGE", "vi-VN"),
            voice_name=os.getenv("GOOGLE_TTS_VOICE_NAME", "vi-VN-Wavenet-A"),
            sample_rate=int(os.getenv("GOOGLE_TTS_SAMPLE_RATE", "24000")),
            speaking_rate=float(os.getenv("GOOGLE_TTS_SPEAKING_RATE", str(DEFAULT_TTS_SPEED))),
            credentials_file=credentials_file,
        )

    if selected == "sarvam":
        return sarvam.TTS(
            target_language_code=os.getenv("SARVAM_TTS_LANGUAGE", "vi-IN"),
            model=os.getenv("SARVAM_TTS_MODEL", "bulbul:v3"),
            speaker=os.getenv("SARVAM_TTS_SPEAKER", "anushka"),
            pace=DEFAULT_TTS_SPEED,
            api_key=os.getenv("SARVAM_API_KEY") or None,
        )

    if selected == "openai":
        return lk_openai.TTS(
            model=os.getenv("OPENAI_TTS_MODEL", "tts-1"),
            voice=os.getenv("OPENAI_TTS_VOICE", "nova"),
            speed=DEFAULT_TTS_SPEED,
            api_key=os.getenv("OPENAI_API_KEY") or None,
            response_format=os.getenv("OPENAI_TTS_RESPONSE_FORMAT", "pcm"),
        )

    raise ValueError(f"Unsupported TTS provider: {provider!r}")


async def synthesize_console_speech(text: str, *, provider: str = "auto") -> bytes:
    normalized_text = text.strip()
    if not normalized_text:
        raise ValueError("TTS text must not be empty.")

    tts = _build_tts(provider)
    audio_frame = await tts.synthesize(normalized_text).collect()
    return audio_frame.to_wav_bytes()

