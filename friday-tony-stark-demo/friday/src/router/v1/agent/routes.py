from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel, Field

from friday.app.agent_console.schemas import ConsoleChatRequest
from friday.app.agent_console.tts_service import synthesize_console_speech
from friday.src.router.v1.agent.workspace_routes import router as workspace_router
from friday.src.services.agent.service import chat, console, greeting


router = APIRouter()
router.include_router(workspace_router)


class AgentTtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    provider: str = "auto"


@router.post("/chat")
async def agent_chat(payload: ConsoleChatRequest) -> dict:
    return await chat(payload)


@router.get("/console")
async def agent_console() -> dict:
    return console()


@router.get("/greeting")
async def agent_greeting() -> dict:
    return await greeting()


@router.post("/tts")
async def agent_tts(payload: AgentTtsRequest) -> Response:
    audio = await synthesize_console_speech(payload.text, provider=payload.provider)
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Cache-Control": "no-store"},
    )
