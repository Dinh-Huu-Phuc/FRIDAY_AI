"""High-level runtime entrypoints for social website open commands."""

from __future__ import annotations

from friday.app.common.browser import BrowserManager
from friday.app.common.messages import UNKNOWN_PLATFORM_MESSAGE
from friday.app.registry import get_platform_service, resolve_social_platform


def open_social_platform(
    command: str,
    *,
    browser_manager: BrowserManager | None = None,
) -> str:
    platform_name = resolve_social_platform(command)
    if platform_name is None:
        return UNKNOWN_PLATFORM_MESSAGE

    service = get_platform_service(platform_name, browser_manager=browser_manager)
    response = service.open_platform_homepage()
    return response.message
