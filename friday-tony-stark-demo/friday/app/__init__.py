"""Social application packages and runtime helpers for FRIDAY."""

from friday.app.registry import SOCIAL_PLATFORM_REGISTRY, resolve_social_platform
from friday.app.runtime import open_social_platform

__all__ = [
    "SOCIAL_PLATFORM_REGISTRY",
    "open_social_platform",
    "resolve_social_platform",
]
