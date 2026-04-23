from __future__ import annotations

from ..emotion_math import fuse_emotion_state


def fuse_emotion_runtime_state(
    current_emotion: dict[str, float],
    session_mood: dict[str, float],
    user_style_projection: dict[str, float],
) -> dict[str, float]:
    return fuse_emotion_state(current_emotion, session_mood, user_style_projection)
