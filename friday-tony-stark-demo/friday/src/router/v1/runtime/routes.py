from __future__ import annotations

from fastapi import APIRouter

from friday.src.schemas.runtime.responses import RuntimeStateResponse, RuntimeStatusResponse
from friday.src.services.runtime.service import (
    get_state,
    get_status,
    minimize_windows,
    restore_windows,
    sleep,
    wake,
)


router = APIRouter()


@router.get("/state", response_model=RuntimeStateResponse)
def runtime_state() -> RuntimeStateResponse:
    return get_state()


@router.get("/status", response_model=RuntimeStatusResponse)
def runtime_status() -> RuntimeStatusResponse:
    return get_status()


@router.post("/sleep", response_model=RuntimeStateResponse)
def runtime_sleep() -> RuntimeStateResponse:
    return sleep()


@router.post("/wake", response_model=RuntimeStateResponse)
def runtime_wake() -> RuntimeStateResponse:
    return wake()


@router.post("/windows/minimize")
def runtime_minimize_windows() -> dict[str, str | int | bool]:
    return minimize_windows()


@router.post("/windows/restore")
def runtime_restore_windows() -> dict[str, str | int | bool]:
    return restore_windows()
