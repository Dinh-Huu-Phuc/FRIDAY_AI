from __future__ import annotations

from friday.src.schemas.runtime.responses import RuntimeStateResponse, RuntimeStatusResponse


def get_state() -> RuntimeStateResponse:
    return RuntimeStateResponse(state={})


def get_status() -> RuntimeStatusResponse:
    return RuntimeStatusResponse()
