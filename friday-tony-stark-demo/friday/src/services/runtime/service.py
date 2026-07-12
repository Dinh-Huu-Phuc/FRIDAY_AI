from __future__ import annotations

from friday.src.schemas.runtime.responses import RuntimeStateResponse, RuntimeStatusResponse
from friday.app.power import (
    get_power_state,
    minimize_application_windows,
    restore_application_windows,
    set_power_state,
)


def get_state() -> RuntimeStateResponse:
    return RuntimeStateResponse(state=get_power_state().to_dict())


def get_status() -> RuntimeStatusResponse:
    return RuntimeStatusResponse(status=get_power_state().state)


def sleep() -> RuntimeStateResponse:
    snapshot = set_power_state("sleeping", source="runtime_api")
    minimize_application_windows()
    return RuntimeStateResponse(state=snapshot.to_dict())


def wake() -> RuntimeStateResponse:
    restore_application_windows()
    return RuntimeStateResponse(state=set_power_state("active", source="runtime_api").to_dict())


def minimize_windows() -> dict[str, str | int | bool]:
    return minimize_application_windows().to_dict()


def restore_windows() -> dict[str, str | int | bool]:
    return restore_application_windows().to_dict()
