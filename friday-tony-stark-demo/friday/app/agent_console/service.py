from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from friday.app.agent_console.schemas import ConsoleChatRequest, ConsoleMessage, ConsoleState
from friday.app.computer.router.routes import observe_computer, plan_computer, run_computer_cycle
from friday.app.computer.schemas.requests import ObserveRequest, PlanRequest, RunRequest
from friday.log import DailyInteractionLogger
from friday.runtime_context import get_computer_runtime_context
from friday.trainModel import ConversationDatasetStore, TrainModelConfig


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class AgentConsoleService:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._module_dir = Path(__file__).resolve().parent
        self._log_dir = self._module_dir.parents[2] / "log" / "saveLog" / "agent_console"
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._state_path = self._log_dir / "console_state.json"
        self._turn_log_path = self._log_dir / "conversation_turns.jsonl"
        self._logger = DailyInteractionLogger(save_dir=self._log_dir)
        self._dataset_store = ConversationDatasetStore(TrainModelConfig())

    def get_snapshot(self, session_id: str = "browser-console") -> dict[str, Any]:
        with self._lock:
            state = self._load_state(session_id=session_id)
            return self._build_snapshot_payload(state)

    def send_message(self, request: ConsoleChatRequest) -> dict[str, Any]:
        normalized_message = request.message.strip()
        if not normalized_message:
            raise ValueError("Message must not be empty.")

        with self._lock:
            state = self._load_state(session_id=request.session_id)

            user_message = ConsoleMessage(
                id=f"user-{uuid.uuid4().hex[:10]}",
                role="user",
                content=normalized_message,
                channel=request.channel,
                status="sent",
            )
            state.messages.append(user_message)

            reply = self._build_reply(normalized_message)

            assistant_message = ConsoleMessage(
                id=f"assistant-{uuid.uuid4().hex[:10]}",
                role="assistant",
                content=str(reply["assistant_message"]),
                channel=request.channel,
                status="received",
            )
            state.messages.append(assistant_message)
            state.latest_plan = reply.get("latest_plan")
            state.latest_execution = reply.get("latest_execution")
            state.updated_at = _now_iso()
            state.messages = state.messages[-80:]

            self._save_state(state)
            self._append_turn_log(
                session_id=request.session_id,
                channel=request.channel,
                user_message=user_message,
                assistant_message=assistant_message,
                latest_plan=state.latest_plan,
                latest_execution=state.latest_execution,
            )
            self._append_training_turn(
                session_id=request.session_id,
                channel=request.channel,
                user_message=user_message.content,
                assistant_message=assistant_message.content,
            )

            return self._build_snapshot_payload(
                state,
                runtime_override=reply.get("runtime_state"),
            )

    def send_assistant_reply(
        self,
        request: ConsoleChatRequest,
        *,
        assistant_content: str,
        runtime_override: dict[str, Any] | None = None,
        latest_plan: dict[str, Any] | None = None,
        latest_execution: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        normalized_message = request.message.strip()
        if not normalized_message:
            raise ValueError("Message must not be empty.")

        with self._lock:
            state = self._load_state(session_id=request.session_id)

            user_message = ConsoleMessage(
                id=f"user-{uuid.uuid4().hex[:10]}",
                role="user",
                content=normalized_message,
                channel=request.channel,
                status="sent",
            )
            assistant_message = ConsoleMessage(
                id=f"assistant-{uuid.uuid4().hex[:10]}",
                role="assistant",
                content=assistant_content,
                channel=request.channel,
                status="received",
            )

            state.messages.append(user_message)
            state.messages.append(assistant_message)
            state.latest_plan = latest_plan
            state.latest_execution = latest_execution
            state.updated_at = _now_iso()
            state.messages = state.messages[-80:]

            self._save_state(state)
            self._append_turn_log(
                session_id=request.session_id,
                channel=request.channel,
                user_message=user_message,
                assistant_message=assistant_message,
                latest_plan=state.latest_plan,
                latest_execution=state.latest_execution,
            )
            self._append_training_turn(
                session_id=request.session_id,
                channel=request.channel,
                user_message=user_message.content,
                assistant_message=assistant_message.content,
            )

            return self._build_snapshot_payload(
                state,
                runtime_override=runtime_override,
            )

    def _load_state(self, *, session_id: str) -> ConsoleState:
        if self._state_path.exists():
            try:
                payload = json.loads(self._state_path.read_text(encoding="utf-8"))
                state = ConsoleState.model_validate(payload)
                if state.session_id == session_id:
                    return state
            except json.JSONDecodeError:
                pass

        return ConsoleState(
            session_id=session_id,
            messages=[
                ConsoleMessage(
                    id="console-bootstrap",
                    role="assistant",
                    content=(
                        "FIRDAY console online. Type or talk to me here. "
                        "This browser console syncs every turn into backend logs "
                        "and into trainModel raw storage for future retraining."
                    ),
                    channel="text",
                    status="received",
                )
            ],
        )

    def _save_state(self, state: ConsoleState) -> None:
        self._state_path.write_text(
            state.model_dump_json(indent=2),
            encoding="utf-8",
        )

    def _build_reply(self, user_message: str) -> dict[str, Any]:
        lowered = user_message.lower()

        if any(token in lowered for token in ("run cycle", "chu ky", "mot chu ky", "cycle")):
            run_response = run_computer_cycle(RunRequest(goal=user_message))
            runtime_state = self._runtime_payload(run_response.runtime_context.model_dump())
            latest_plan = self._plan_payload_from_run(run_response.model_dump(by_alias=True, mode="json"))
            latest_execution = self._execution_payload(
                run_response.execution.model_dump(by_alias=True, mode="json")
            )
            return {
                "assistant_message": (
                    f"Da chay xong mot chu ky an toan. "
                    f"Hanh dong hien tai la {run_response.action.action_type}. "
                    f"{run_response.execution.message}"
                ),
                "runtime_state": runtime_state,
                "latest_plan": latest_plan,
                "latest_execution": latest_execution,
            }

        if any(token in lowered for token in ("plan", "ke hoach", "next step", "buoc tiep")):
            plan_response = plan_computer(PlanRequest(goal=user_message))
            runtime_state = self._runtime_payload(plan_response.runtime_context.model_dump())
            latest_plan = self._plan_payload(plan_response.model_dump(by_alias=True, mode="json"))
            return {
                "assistant_message": (
                    f"Toi da lap xong buoc tiep theo. "
                    f"Hanh dong de xuat la {plan_response.action.action_type}: "
                    f"{plan_response.action.description}"
                ),
                "runtime_state": runtime_state,
                "latest_plan": latest_plan,
                "latest_execution": None,
            }

        if any(token in lowered for token in ("observe", "quan sat", "screen", "man hinh", "inspect")):
            observe_response = observe_computer(ObserveRequest(goal=user_message, compress_image=True))
            observation = observe_response.observation
            notes = ", ".join(observation.notes[:2]) if observation.notes else "khong co canh bao nao"
            return {
                "assistant_message": (
                    f"Toi vua quan sat xong man hinh. "
                    f"Cua so hien tai la {observation.active_window_title or 'chua xac dinh'}, "
                    f"va ghi nhan {notes}."
                ),
                "runtime_state": self._runtime_payload(
                    observe_response.runtime_context.model_dump()
                ),
                "latest_plan": None,
                "latest_execution": None,
            }

        runtime_state = self._runtime_payload(get_computer_runtime_context())
        active_window = runtime_state["activeWindowTitle"] or "chua co cua so hoat dong"
        current_goal = runtime_state["currentGoal"] or "chua co muc tieu nao dang duoc dat"

        return {
            "assistant_message": (
                f"Da nhan lenh, sep. "
                f"Hien toi dang theo doi {active_window} va muc tieu hien tai la {current_goal}. "
                "Neu sep muon, toi co the quan sat man hinh, lap buoc tiep theo, "
                "hoac chay mot chu ky ngay."
            ),
            "runtime_state": runtime_state,
            "latest_plan": None,
            "latest_execution": None,
        }

    def _runtime_payload(self, runtime_context: dict[str, Any]) -> dict[str, Any]:
        return {
            "currentGoal": str(runtime_context.get("current_goal") or ""),
            "currentPlan": list(runtime_context.get("current_plan") or []),
            "lastAction": runtime_context.get("last_action"),
            "activeWindowTitle": str(runtime_context.get("active_window_title") or ""),
            "lastScreenshotPath": str(runtime_context.get("last_screenshot_path") or ""),
            "screenWidth": int(runtime_context.get("screen_width") or 0),
            "screenHeight": int(runtime_context.get("screen_height") or 0),
            "safetyMode": str(runtime_context.get("safety_mode") or "strict"),
        }

    def _plan_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        runtime_context = payload.get("runtime_context") or {}
        return {
            "ok": bool(payload.get("ok", True)),
            "goal": str(payload.get("goal") or ""),
            "action": self._action_payload(payload.get("action") or {}),
            "reasoning": str(payload.get("reasoning") or ""),
            "runtimeContext": self._runtime_payload(runtime_context),
            "message": str(payload.get("message") or ""),
            "riskLevel": None,
        }

    def _plan_payload_from_run(self, payload: dict[str, Any]) -> dict[str, Any]:
        runtime_context = payload.get("runtime_context") or {}
        execution = payload.get("execution") or {}
        safety = execution.get("safety") or {}
        return {
            "ok": bool(payload.get("ok", True)),
            "goal": str(payload.get("goal") or ""),
            "action": self._action_payload(payload.get("action") or {}),
            "reasoning": str(payload.get("planning_reasoning") or ""),
            "runtimeContext": self._runtime_payload(runtime_context),
            "message": str(payload.get("message") or ""),
            "riskLevel": safety.get("risk_level"),
        }

    def _execution_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        runtime_context = payload.get("runtime_context") or {}
        safety = payload.get("safety") or {}
        return {
            "ok": bool(payload.get("ok", True)),
            "action": self._action_payload(payload.get("action") or {}),
            "executed": bool(payload.get("executed", False)),
            "safety": {
                "allowed": bool(safety.get("allowed", False)),
                "riskLevel": safety.get("risk_level"),
                "reason": str(safety.get("reason") or ""),
            },
            "result": payload.get("result") or {},
            "runtimeContext": self._runtime_payload(runtime_context),
            "message": str(payload.get("message") or ""),
        }

    def _action_payload(self, action: dict[str, Any]) -> dict[str, Any]:
        return {
            "type": action.get("type"),
            "description": action.get("description"),
            "target": action.get("target"),
            "x": action.get("x"),
            "y": action.get("y"),
            "endX": action.get("end_x"),
            "endY": action.get("end_y"),
            "button": action.get("button"),
            "text": action.get("text"),
            "key": action.get("key"),
            "keys": action.get("keys") or [],
            "amount": action.get("amount"),
            "command": action.get("command"),
            "timeout": action.get("timeout"),
            "rationale": action.get("rationale"),
        }

    def _append_turn_log(
        self,
        *,
        session_id: str,
        channel: str,
        user_message: ConsoleMessage,
        assistant_message: ConsoleMessage,
        latest_plan: dict[str, Any] | None,
        latest_execution: dict[str, Any] | None,
    ) -> None:
        payload = {
            "session_id": session_id,
            "timestamp": _now_iso(),
            "channel": channel,
            "user_message": user_message.model_dump(mode="json"),
            "assistant_message": assistant_message.model_dump(mode="json"),
            "latest_plan": latest_plan,
            "latest_execution": latest_execution,
        }
        with self._turn_log_path.open("a", encoding="utf-8") as file_obj:
            file_obj.write(json.dumps(payload, ensure_ascii=False) + "\n")

        self._logger.record_custom_event(
            event_type="browser_console_turn",
            payload=payload,
        )

    def _append_training_turn(
        self,
        *,
        session_id: str,
        channel: str,
        user_message: str,
        assistant_message: str,
    ) -> None:
        self._dataset_store.append_raw_turn(
            session_id=session_id,
            user_id=None,
            user_message=user_message,
            assistant_message=assistant_message,
            source="browser_console",
            refined_input=user_message,
            metadata={
                "channel": channel,
                "stored_from": "agent_console_api",
            },
        )

    def _build_snapshot_payload(
        self,
        state: ConsoleState,
        *,
        runtime_override: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        runtime_state = runtime_override or self._runtime_payload(get_computer_runtime_context())
        return {
            "messages": [message.model_dump(mode="json") for message in state.messages],
            "runtimeState": runtime_state,
            "latestPlan": state.latest_plan,
            "latestExecution": state.latest_execution,
            "backendStatus": {
                "status": "connected",
                "label": "Connected",
                "detail": "Browser console is syncing to backend logs and training storage.",
                "source": "api",
            },
        }


_SERVICE: AgentConsoleService | None = None
_SERVICE_LOCK = threading.Lock()


def get_agent_console_service() -> AgentConsoleService:
    global _SERVICE
    with _SERVICE_LOCK:
        if _SERVICE is None:
            _SERVICE = AgentConsoleService()
        return _SERVICE
