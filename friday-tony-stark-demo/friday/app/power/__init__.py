"""Runtime sleep and wake controls."""

from friday.app.power.intents import PowerIntent, detect_power_intent
from friday.app.power.service import (
    PowerCommandResult,
    PowerSnapshot,
    get_power_state,
    handle_power_message,
    initialize_power_state,
    set_power_state,
)
from friday.app.power.window_manager import (
    WindowActionResult,
    WindowSleepManager,
    minimize_application_windows,
    restore_application_windows,
)

__all__ = [
    "PowerCommandResult",
    "PowerIntent",
    "PowerSnapshot",
    "detect_power_intent",
    "get_power_state",
    "handle_power_message",
    "initialize_power_state",
    "set_power_state",
    "WindowActionResult",
    "WindowSleepManager",
    "minimize_application_windows",
    "restore_application_windows",
]
