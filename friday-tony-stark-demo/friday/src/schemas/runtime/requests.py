from __future__ import annotations

from pydantic import BaseModel


class RuntimeStateUpdateRequest(BaseModel):
    key: str
    value: str
