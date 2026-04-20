"""Screen capture and screen metadata helpers."""

from __future__ import annotations

import ctypes
from pathlib import Path
from typing import Any


def _get_image_grab():
    try:
        from PIL import ImageGrab
    except Exception as exc:
        raise RuntimeError(
            "Pillow ImageGrab is required for screenshots. Install it with `uv add pillow`."
        ) from exc
    return ImageGrab


def get_active_window_title() -> str:
    try:
        user32 = ctypes.windll.user32
        handle = user32.GetForegroundWindow()
        if not handle:
            return ""
        length = user32.GetWindowTextLengthW(handle)
        if length <= 0:
            return ""
        buffer = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(handle, buffer, length + 1)
        return buffer.value.strip()
    except Exception:
        return ""


def get_screen_size() -> dict[str, int]:
    try:
        from friday.tools.computer import get_pyautogui

        pyautogui = get_pyautogui()
        width, height = pyautogui.size()
        return {"width": int(width), "height": int(height)}
    except Exception:
        image = _get_image_grab().grab(all_screens=True)
        width, height = image.size
        return {"width": int(width), "height": int(height)}


def capture_screen(output_path: str | Path) -> dict[str, Any]:
    target_path = Path(output_path).expanduser().resolve()
    target_path.parent.mkdir(parents=True, exist_ok=True)
    image = _get_image_grab().grab(all_screens=True)
    image.save(target_path)
    width, height = image.size
    return {
        "path": str(target_path),
        "screen_width": int(width),
        "screen_height": int(height),
        "active_window_title": get_active_window_title(),
    }


def compress_image(
    source_path: str | Path,
    target_path: str | Path | None = None,
    *,
    quality: int = 70,
    max_width: int = 1600,
    max_height: int = 900,
) -> str:
    from PIL import Image

    source = Path(source_path).expanduser().resolve()
    destination = (
        Path(target_path).expanduser().resolve()
        if target_path is not None
        else source.with_name(f"{source.stem}_compressed.jpg")
    )
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = image.convert("RGB")
        image.thumbnail((int(max_width), int(max_height)))
        image.save(destination, format="JPEG", quality=int(quality), optimize=True)
    return str(destination)
