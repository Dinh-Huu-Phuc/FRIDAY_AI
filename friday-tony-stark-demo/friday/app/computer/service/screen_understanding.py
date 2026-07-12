"""On-demand, local-only understanding of the user's current screen."""

from __future__ import annotations

import asyncio
import base64
import json
import os
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from friday.app.computer.router.routes import observe_computer
from friday.app.computer.schemas.requests import ObserveRequest


_SCREEN_QUESTION_PATTERNS = (
    r"\bwhat (?:am i|are we) looking at\b",
    r"\bwhat (?:is|is there|do you see)(?: currently)? on (?:my|the|this) screen\b",
    r"\bwhat do you see (?:on|in) (?:my|the|this) screen\b",
    r"\b(?:describe|analy[sz]e|understand|read|inspect) (?:my|the|this) screen\b",
    r"\bcan you see (?:my|the|this) screen\b",
    r"\bdo you know what i(?:'m| am) (?:looking at|viewing)\b",
)


def is_screen_understanding_request(message: str) -> bool:
    """Return whether a user explicitly asked FRIDAY to inspect the screen."""
    normalized = " ".join(message.lower().strip().split())
    return any(re.search(pattern, normalized) for pattern in _SCREEN_QUESTION_PATTERNS)


def _ollama_endpoint() -> str:
    base_url = os.getenv("FRIDAY_VISION_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    if base_url not in {"http://127.0.0.1:11434", "http://localhost:11434"}:
        raise ValueError("FRIDAY_VISION_BASE_URL must point to the local Ollama server")
    return f"{base_url}/api/chat"


def _analyze_screen_sync(question: str) -> str:
    observation = observe_computer(
        ObserveRequest(goal=question, compress_image=True)
    ).observation
    image_path = Path(
        observation.compressed_screenshot_path or observation.screenshot_path
    ).resolve()
    image_data = base64.b64encode(image_path.read_bytes()).decode("ascii")
    active_window = observation.active_window_title.strip() or "unknown"
    prompt = (
        "Answer the user's question concisely in English using only visible evidence in "
        "this screenshot. Describe the main application or page and prominent objects. "
        "Do not identify people, repeat secrets, or invent unreadable details. State any "
        f"uncertainty. Active window: {active_window}. User question: {question}"
    )
    payload = json.dumps(
        {
            "model": os.getenv("FRIDAY_VISION_MODEL", "gemma3:4b"),
            "stream": False,
            "messages": [
                {"role": "user", "content": prompt, "images": [image_data]},
            ],
        }
    ).encode("utf-8")
    request = Request(
        _ollama_endpoint(),
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=120) as response:
        result = json.loads(response.read().decode("utf-8"))
    answer = str(result.get("message", {}).get("content", "")).strip()
    return answer or "I captured the screen, but the local vision model returned no description."


async def understand_current_screen(question: str) -> str:
    """Capture and inspect the current screen using only a local vision server."""
    try:
        return await asyncio.to_thread(_analyze_screen_sync, question)
    except (ConnectionError, HTTPError, URLError):
        model = os.getenv("FRIDAY_VISION_MODEL", "gemma3:4b")
        return (
            "Local screen vision is not available yet. Start Ollama and install the model "
            f"configured by FRIDAY_VISION_MODEL (currently {model})."
        )
    except Exception as exc:
        return f"I could not analyze the current screen ({type(exc).__name__})."
