from __future__ import annotations

from fastapi import APIRouter

from friday.src.schemas.runtime.responses import RuntimeStateResponse, RuntimeStatusResponse
from friday.src.services.runtime.service import get_state, get_status


router = APIRouter()


@router.get("/state", response_model=RuntimeStateResponse)
def runtime_state() -> RuntimeStateResponse:
    return get_state()


@router.get("/status", response_model=RuntimeStatusResponse)
def runtime_status() -> RuntimeStatusResponse:
    return get_status()
