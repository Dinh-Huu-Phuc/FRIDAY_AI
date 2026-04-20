"""Request models for the computer module."""

from __future__ import annotations

from pydantic import BaseModel

from friday.app.computer.schemas.entities import ComputerAction, RuntimeContextSnapshot, SafetyMode, ScreenObservation


class ObserveRequest(BaseModel):
    goal: str | None = None
    compress_image: bool = True


class PlanRequest(BaseModel):
    goal: str
    observation: ScreenObservation | None = None
    runtime_context: RuntimeContextSnapshot | None = None


class ExecuteRequest(BaseModel):
    action: ComputerAction
    safety_mode: SafetyMode | None = None


class RunRequest(BaseModel):
    goal: str
    safety_mode: SafetyMode | None = None
    observation: ScreenObservation | None = None
