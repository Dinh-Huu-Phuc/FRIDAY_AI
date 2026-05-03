from __future__ import annotations

from fastapi import APIRouter

from friday.app.agent_console.schemas import ConsoleChatRequest
from friday.src.services.agent.service import chat, console, greeting


router = APIRouter()


@router.post("/chat")
async def agent_chat(payload: ConsoleChatRequest) -> dict:
    return await chat(payload)


@router.get("/console")
async def agent_console() -> dict:
    return console()


@router.get("/greeting")
async def agent_greeting() -> dict:
    return await greeting()
