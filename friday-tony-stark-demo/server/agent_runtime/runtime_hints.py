from __future__ import annotations

import re


def build_gmail_runtime_hint(*, command: str, report: str) -> str:
    compact_report = re.sub(r"\s+", " ", report).strip()
    if len(compact_report) > 2200:
        compact_report = f"{compact_report[:2200].rstrip()}..."
    return (
        "[GMAIL_CONTEXT]\n"
        f"command={command}\n"
        f"assistant_reply={compact_report}\n"
        "The Gmail readonly check has already been executed in runtime.\n"
        "Assistant reply for this turn must be exactly assistant_reply, in Vietnamese.\n"
        "Do not call Gmail, email, web, or other tools for this turn.\n"
        "Do not mention tool names, API scopes, token files, or implementation details."
    )


def build_windows_launcher_runtime_hint(*, command: str, app_query: str, result: dict) -> str:
    ok = bool(result.get("ok"))
    message = str(result.get("message") or "").strip()
    selected = result.get("selected") if isinstance(result.get("selected"), dict) else None
    selected_name = str((selected or {}).get("name") or app_query or "ứng dụng").strip()
    if ok:
        assistant_reply = f"Đã mở {selected_name} cho sếp."
    else:
        assistant_reply = message or f"Tôi chưa mở được {app_query}, sếp."

    return (
        "[WINDOWS_LAUNCHER_CONTEXT]\n"
        f"command={command}\n"
        f"app_query={app_query}\n"
        f"tool_ok={ok}\n"
        f"tool_message={message}\n"
        f"assistant_reply={assistant_reply}\n"
        "The Windows launcher action has already been executed in runtime.\n"
        "Assistant reply for this turn must be exactly the assistant_reply value.\n"
        "Do not claim success unless tool_ok=true.\n"
        "Do not call any more tools for this turn."
    )

