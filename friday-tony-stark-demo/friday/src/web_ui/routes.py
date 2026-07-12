from __future__ import annotations

import asyncio
import os
from pathlib import Path

from fastapi import APIRouter, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from friday.app.agent_console.schemas import ConsoleChatRequest
from friday.app.agent_console.service import get_agent_console_service
from friday.app.power import PowerIntent, detect_power_intent, get_power_state
from friday.src.services.agent.service import build_startup_briefing, chat, greeting


STATIC_DIR = Path(__file__).resolve().parent / "static"
FAVICON_PATH = Path(__file__).resolve().parents[2] / "assets" / "img" / "favicon.ico"
UI_SESSION_ID = "python-ui"
MAX_CHAT_MESSAGE_LENGTH = 8_000

router = APIRouter(tags=["web-ui"])


def _fast_startup_enabled() -> bool:
    return os.getenv("FRIDAY_START_MODE", "fast").strip().lower() == "fast"


async def _send_background_briefing(websocket: WebSocket, service) -> None:
    briefing = await build_startup_briefing()
    if get_power_state().sleeping:
        return
    snapshot = service.add_assistant_message(session_id=UI_SESSION_ID, content=briefing)
    await websocket.send_json({"type": "snapshot", "payload": snapshot})


def mount_web_ui_static(app: FastAPI) -> None:
    app.mount("/ui/static", StaticFiles(directory=STATIC_DIR), name="friday-ui-static")


@router.get("/ui", response_class=HTMLResponse)
async def friday_ui() -> str:
    return """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FRIDAY Local Core</title>
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="stylesheet" href="/ui/static/styles.css" />
  </head>
  <body>
    <main class="app-shell" data-core-state="disconnected">
      <section class="history-dock" id="history-dock" aria-label="Conversation history">
        <div class="history-head">
          <span>Conversation</span>
          <div class="history-actions">
            <button id="toggle-history" class="icon-button" type="button" aria-label="Hide history">Hide</button>
            <button id="clear-chat" class="icon-button" type="button" aria-label="Clear chat">Clear</button>
          </div>
        </div>
        <div id="messages" class="conversation-stack" aria-live="polite"></div>
      </section>

      <button id="connection-indicator" class="connection-indicator" type="button" aria-label="Connection details">
        <span class="connection-dot"></span>
        <span id="transport">offline</span>
      </button>
      <section id="connection-popover" class="connection-popover" hidden>
        <dl>
          <div><dt>Core service</dt><dd id="core-service-status">checking</dd></div>
          <div><dt>WebSocket</dt><dd id="websocket-status">offline</dd></div>
          <div><dt>Voice</dt><dd id="voice-status">waiting</dd></div>
        </dl>
      </section>

      <section class="core-stage" aria-label="FRIDAY AI core">
        <div id="core-orb" class="core-orb" aria-hidden="true">
          <span class="orb-shell"></span>
          <span class="orb-glass"></span>
          <span class="orb-core"></span>
          <span class="orb-wave orb-wave-a"></span>
          <span class="orb-wave orb-wave-b"></span>
          <span class="orb-reflection"></span>
        </div>
        <p class="core-kicker">FRIDAY LOCAL CORE</p>
        <p id="status" class="core-status">Connecting to local core...</p>
      </section>

      <form id="chat-form" class="prompt-input" aria-label="Prompt FRIDAY">
        <button id="mic-button" class="prompt-action" type="button" aria-label="Start voice input">Mic</button>
        <textarea id="message-input" rows="1" autocomplete="off" placeholder="Talk or type to FRIDAY..."></textarea>
        <button class="prompt-send" type="submit">Send</button>
      </form>

      <button id="settings-toggle" class="settings-toggle" type="button" aria-label="Open settings">Settings</button>
      <aside id="settings-panel" class="settings-panel" hidden>
        <div class="settings-head">
          <span>Core Appearance</span>
          <button id="settings-close" class="icon-button" type="button">Close</button>
        </div>
        <label>Primary RGB color <input id="primary-color" type="color" /></label>
        <label>Secondary RGB color <input id="secondary-color" type="color" /></label>
        <label>Glow intensity <input id="glow-intensity" type="range" min="0.4" max="1.8" step="0.05" /></label>
        <label>Pulse speed <input id="pulse-speed" type="range" min="0.6" max="2.4" step="0.05" /></label>
        <label>Orb size <input id="orb-size" type="range" min="180" max="360" step="4" /></label>
        <label class="switch-row"><input id="voice-reactive" type="checkbox" /> Voice reactive effect</label>
        <label class="switch-row"><input id="reduce-motion" type="checkbox" /> Reduce motion</label>
        <label class="switch-row"><input id="voice-enabled" type="checkbox" /> Voice reply</label>
      </aside>
    </main>
    <script src="/ui/static/app.js"></script>
  </body>
</html>
"""


@router.get("/favicon.ico", include_in_schema=False)
async def favicon() -> FileResponse:
    return FileResponse(FAVICON_PATH, media_type="image/x-icon")


@router.websocket("/ws/chat")
async def chat_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    service = get_agent_console_service()
    snapshot = service.get_snapshot(session_id=UI_SESSION_ID)
    await websocket.send_json({
        "type": "snapshot",
        "payload": snapshot,
    })
    await websocket.send_json({"type": "power", "payload": get_power_state().to_dict()})

    messages = snapshot.get("messages") or []
    briefing_task: asyncio.Task | None = None
    if len(messages) <= 1 and not get_power_state().sleeping:
        await websocket.send_json({"type": "state", "state": "briefing"})
        if _fast_startup_enabled():
            snapshot = service.add_assistant_message(
                session_id=UI_SESSION_ID,
                content="FRIDAY is online. Live information is warming up in the background.",
            )
            await websocket.send_json({"type": "snapshot", "payload": snapshot})
            briefing_task = asyncio.create_task(_send_background_briefing(websocket, service))
        else:
            await _send_background_briefing(websocket, service)

    try:
        while True:
            payload = await websocket.receive_json()
            packet_type = str(payload.get("type", "chat")).strip() or "chat"
            message = str(payload.get("message", "")).strip()
            channel = str(payload.get("channel", "text")).strip() or "text"
            if packet_type == "clear":
                response = service.archive_and_reset_chat(
                    session_id=UI_SESSION_ID,
                    reason="manual_clear",
                )
                await websocket.send_json({"type": "cleared", "payload": response})
                continue

            if not message:
                await websocket.send_json({"type": "error", "message": "Message must not be empty."})
                continue
            if len(message) > MAX_CHAT_MESSAGE_LENGTH:
                await websocket.send_json({"type": "error", "message": "Message is too long."})
                continue

            if (
                channel == "voice"
                and get_power_state().sleeping
                and detect_power_intent(message) != PowerIntent.WAKE
            ):
                await websocket.send_json({"type": "power", "payload": get_power_state().to_dict()})
                continue

            await websocket.send_json({"type": "state", "state": "thinking"})
            response = await chat(
                ConsoleChatRequest(
                    message=message,
                    channel="voice" if channel == "voice" else "text",
                    session_id=UI_SESSION_ID,
                )
            )
            await websocket.send_json({"type": "snapshot", "payload": response})
            await websocket.send_json({"type": "power", "payload": get_power_state().to_dict()})
    except WebSocketDisconnect:
        return
    finally:
        if briefing_task and not briefing_task.done():
            briefing_task.cancel()


@router.get("/ui/greeting")
async def ui_greeting() -> dict:
    return await greeting()


@router.post("/ui/chat/clear")
async def clear_ui_chat() -> dict:
    return get_agent_console_service().archive_and_reset_chat(
        session_id=UI_SESSION_ID,
        reason="ui_closed",
    )
