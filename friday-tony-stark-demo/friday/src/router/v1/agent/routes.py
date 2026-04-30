from __future__ import annotations

from fastapi import APIRouter

from friday.app.agent_console.schemas import ConsoleChatRequest
from friday.src.services.agent.service import chat, greeting


router = APIRouter()


@router.post("/chat")
async def agent_chat(payload: ConsoleChatRequest) -> dict:
    return await chat(payload)


@router.get("/greeting")
async def agent_greeting() -> dict:
    return await greeting()
