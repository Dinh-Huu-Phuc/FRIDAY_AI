"""Observation service for the computer module."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from friday.app.computer.config.settings import ComputerSettings
from friday.app.computer.exceptions import ComputerObservationError
from friday.app.computer.schemas.entities import ScreenObservation
from friday.app.computer.schemas.requests import ObserveRequest
from friday.tools.computer import vision


class ComputerObserver:
    def __init__(self, *, settings: ComputerSettings) -> None:
        self.settings = settings

    def observe(self, request: ObserveRequest | None = None) -> ScreenObservation:
        active_request = request or ObserveRequest()
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        screenshot_dir = Path(self.settings.screenshot_dir).expanduser().resolve()
        screenshot_dir.mkdir(parents=True, exist_ok=True)
        raw_path = screenshot_dir / f"screen_{timestamp}.png"

        try:
            capture = vision.capture_screen(raw_path)
            compressed_path: str | None = None
            if active_request.compress_image:
                compressed_path = vision.compress_image(
                    raw_path,
                    quality=self.settings.image_quality,
                    max_width=self.settings.max_image_width,
                    max_height=self.settings.max_image_height,
                )
        except Exception as exc:
            raise ComputerObservationError(f"Failed to observe the screen: {exc}") from exc

        notes: list[str] = []
        if capture.get("active_window_title"):
            notes.append(f"Active window: {capture['active_window_title']}")
        if active_request.goal:
            notes.append(f"Goal: {active_request.goal}")

        return ScreenObservation(
            screenshot_path=str(capture["path"]),
            compressed_screenshot_path=compressed_path,
            active_window_title=str(capture.get("active_window_title") or ""),
            screen_width=int(capture["screen_width"]),
            screen_height=int(capture["screen_height"]),
            notes=notes,
        )
