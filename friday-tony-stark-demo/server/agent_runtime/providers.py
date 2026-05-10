from __future__ import annotations

import os

from livekit.plugins import deepgram, google as lk_google, openai as lk_openai, sarvam

from server.agent_runtime.bootstrap import logger


STT_PROVIDER = "google"  # "google" | "deepgram" | "sarvam" | "whisper"
LLM_PROVIDER = "gemini"
TTS_PROVIDER = "openai"

GEMINI_LLM_MODEL = "gemini-2.5-flash"
OPENAI_LLM_MODEL = "gpt-4o"
GOOGLE_STT_MODEL = "latest_long"
GOOGLE_STT_LANGUAGE = "vi-VN"
GOOGLE_STT_SAMPLE_RATE = 16000

OPENAI_TTS_MODEL = "tts-1"
OPENAI_TTS_VOICE = "nova"  # "nova" has a clean, confident female tone
TTS_SPEED = 1.15

SARVAM_TTS_LANGUAGE = "en-IN"
SARVAM_TTS_SPEAKER = "rahul"


def build_stt():
    if STT_PROVIDER == "google":
        logger.info("STT -> Google Cloud Speech-to-Text (%s / %s)", GOOGLE_STT_MODEL, GOOGLE_STT_LANGUAGE)
        credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip() or None
        return lk_google.STT(
            languages=[GOOGLE_STT_LANGUAGE],
            detect_language=False,
            interim_results=True,
            punctuate=True,
            model=GOOGLE_STT_MODEL,
            sample_rate=GOOGLE_STT_SAMPLE_RATE,
            credentials_file=credentials_file,
        )
    if STT_PROVIDER == "sarvam":
        logger.info("STT -> Sarvam Saaras v3")
        return sarvam.STT(
            language="unknown",
            model="saaras:v3",
            mode="transcribe",
            flush_signal=True,
            sample_rate=16000,
        )
    if STT_PROVIDER == "whisper":
        logger.info("STT -> OpenAI Whisper")
        return lk_openai.STT(model="whisper-1")
    if STT_PROVIDER == "deepgram":
        logger.info("STT -> Deepgram (nova-3)")
        return deepgram.STT(model="nova-3", language="vi")
    raise ValueError(f"Unknown STT_PROVIDER: {STT_PROVIDER!r}")


def build_llm():
    if LLM_PROVIDER == "openai":
        logger.info("LLM -> OpenAI (%s)", OPENAI_LLM_MODEL)
        return lk_openai.LLM(model=OPENAI_LLM_MODEL)
    if LLM_PROVIDER == "gemini":
        logger.info("LLM -> Google Gemini (%s)", GEMINI_LLM_MODEL)
        return lk_google.LLM(model=GEMINI_LLM_MODEL, api_key=os.getenv("GOOGLE_API_KEY"))
    raise ValueError(f"Unknown LLM_PROVIDER: {LLM_PROVIDER!r}")


def build_tts():
    if TTS_PROVIDER == "sarvam":
        logger.info("TTS -> Sarvam Bulbul v3")
        return sarvam.TTS(
            target_language_code=SARVAM_TTS_LANGUAGE,
            model="bulbul:v3",
            speaker=SARVAM_TTS_SPEAKER,
            pace=TTS_SPEED,
        )
    if TTS_PROVIDER == "openai":
        logger.info("TTS -> OpenAI TTS (%s / %s)", OPENAI_TTS_MODEL, OPENAI_TTS_VOICE)
        return lk_openai.TTS(
            model=OPENAI_TTS_MODEL,
            voice=OPENAI_TTS_VOICE,
            speed=TTS_SPEED,
        )
    raise ValueError(f"Unknown TTS_PROVIDER: {TTS_PROVIDER!r}")


def turn_detection() -> str:
    return "stt" if STT_PROVIDER == "sarvam" else "vad"


def endpointing_delay() -> float:
    return {"sarvam": 0.07, "deepgram": 0.2, "google": 0.25, "whisper": 0.3}.get(STT_PROVIDER, 0.1)
