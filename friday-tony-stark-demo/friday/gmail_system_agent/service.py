from __future__ import annotations

import asyncio
import base64
import html
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"
PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PACKAGE_DIR.parents[1]
DEFAULT_CREDENTIALS_PATH = PACKAGE_DIR / "json" / "credentials.json"
DEFAULT_TOKEN_PATH = PACKAGE_DIR / "json" / "token.json"
DEFAULT_LOG_DIR = PROJECT_DIR / "friday" / "log" / "save_read_gmail"


@dataclass(slots=True)
class GmailMessageSummary:
    message_id: str
    thread_id: str
    sender: str
    subject: str
    date: str
    snippet: str
    body_preview: str
    already_reported: bool = False


@dataclass(slots=True)
class GmailCheckResult:
    ok: bool
    message: str = ""
    unread_count: int = 0
    reported_count: int = 0
    skipped_count: int = 0
    messages: list[GmailMessageSummary] = field(default_factory=list)
    log_path: str = ""
    error: str | None = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _credentials_path() -> Path:
    return Path(os.getenv("FRIDAY_GMAIL_CREDENTIALS_PATH", str(DEFAULT_CREDENTIALS_PATH))).expanduser()


def _token_path() -> Path:
    return Path(os.getenv("FRIDAY_GMAIL_TOKEN_PATH", str(DEFAULT_TOKEN_PATH))).expanduser()


def _log_dir() -> Path:
    return Path(os.getenv("FRIDAY_GMAIL_LOG_DIR", str(DEFAULT_LOG_DIR))).expanduser()


def _max_results() -> int:
    try:
        return max(1, min(25, int(os.getenv("FRIDAY_GMAIL_MAX_RESULTS", "8"))))
    except ValueError:
        return 8


def _query() -> str:
    return os.getenv("FRIDAY_GMAIL_UNREAD_QUERY", "is:unread newer_than:14d").strip() or "is:unread"


def _strip_html(value: str) -> str:
    text = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", value)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def _decode_body_data(data: str) -> str:
    if not data:
        return ""
    padding = "=" * (-len(data) % 4)
    try:
        return base64.urlsafe_b64decode(data + padding).decode("utf-8", errors="replace")
    except Exception:
        return ""


def _walk_parts(payload: dict[str, Any]) -> list[dict[str, Any]]:
    parts: list[dict[str, Any]] = []
    stack = [payload]
    while stack:
        part = stack.pop(0)
        parts.append(part)
        stack.extend(part.get("parts") or [])
    return parts


def _extract_body(payload: dict[str, Any]) -> str:
    plain_chunks: list[str] = []
    html_chunks: list[str] = []

    for part in _walk_parts(payload):
        mime_type = str(part.get("mimeType") or "").lower()
        body_data = str((part.get("body") or {}).get("data") or "")
        decoded = _decode_body_data(body_data)
        if not decoded:
            continue
        if mime_type == "text/plain":
            plain_chunks.append(decoded)
        elif mime_type == "text/html":
            html_chunks.append(_strip_html(decoded))

    body = "\n".join(chunk.strip() for chunk in plain_chunks if chunk.strip())
    if not body:
        body = "\n".join(chunk.strip() for chunk in html_chunks if chunk.strip())
    return re.sub(r"\s+", " ", body).strip()


def _headers(payload: dict[str, Any]) -> dict[str, str]:
    values: dict[str, str] = {}
    for item in payload.get("headers") or []:
        name = str(item.get("name") or "").lower()
        value = str(item.get("value") or "").strip()
        if name:
            values[name] = value
    return values


def _load_locally_reported_ids(log_dir: Path) -> set[str]:
    if not log_dir.exists():
        return set()

    ids: set[str] = set()
    for path in log_dir.glob("read_gmail_*.jsonl"):
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                payload = json.loads(line)
                message_id = str(payload.get("message_id") or "")
                if message_id:
                    ids.add(message_id)
        except Exception:
            continue
    return ids


def _save_log(messages: list[GmailMessageSummary], log_dir: Path) -> str:
    log_dir.mkdir(parents=True, exist_ok=True)
    path = log_dir / f"read_gmail_{datetime.now().date().isoformat()}.jsonl"
    with path.open("a", encoding="utf-8") as handle:
        for message in messages:
            handle.write(
                json.dumps(
                    {
                        "read_at": _now_iso(),
                        "message_id": message.message_id,
                        "thread_id": message.thread_id,
                        "from": message.sender,
                        "subject": message.subject,
                        "date": message.date,
                        "snippet": message.snippet,
                        "body_preview": message.body_preview,
                        "scope": GMAIL_READONLY_SCOPE,
                        "marked_as_read": False,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
    return str(path)


def _build_gmail_service():
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError as exc:
        raise RuntimeError(
            "Google Gmail client libraries are not installed. Run `uv sync` or install "
            "google-api-python-client google-auth-httplib2 google-auth-oauthlib."
        ) from exc

    credentials_path = _credentials_path()
    token_path = _token_path()

    if not credentials_path.exists():
        raise RuntimeError(f"Gmail credentials file not found: {credentials_path}")

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), [GMAIL_READONLY_SCOPE])

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), [GMAIL_READONLY_SCOPE])
            creds = flow.run_local_server(port=0)

        token_path.parent.mkdir(parents=True, exist_ok=True)
        token_path.write_text(creds.to_json(), encoding="utf-8")

    return build("gmail", "v1", credentials=creds)


def check_unread_gmail(*, include_locally_reported: bool = False) -> GmailCheckResult:
    log_dir = _log_dir()

    try:
        service = _build_gmail_service()
        response = (
            service.users()
            .messages()
            .list(userId="me", q=_query(), maxResults=_max_results())
            .execute()
        )
        raw_messages = response.get("messages") or []
        locally_reported = _load_locally_reported_ids(log_dir)
        messages: list[GmailMessageSummary] = []
        skipped_count = 0

        for item in raw_messages:
            message_id = str(item.get("id") or "")
            if not message_id:
                continue

            already_reported = message_id in locally_reported
            if already_reported and not include_locally_reported:
                skipped_count += 1
                continue

            message = (
                service.users()
                .messages()
                .get(userId="me", id=message_id, format="full")
                .execute()
            )
            payload = message.get("payload") or {}
            headers = _headers(payload)
            body = _extract_body(payload)
            snippet = str(message.get("snippet") or "").strip()
            preview_source = body or snippet
            body_preview = preview_source[:900].strip()

            messages.append(
                GmailMessageSummary(
                    message_id=message_id,
                    thread_id=str(message.get("threadId") or ""),
                    sender=headers.get("from", "(unknown sender)"),
                    subject=headers.get("subject", "(no subject)"),
                    date=headers.get("date", ""),
                    snippet=snippet,
                    body_preview=body_preview,
                    already_reported=already_reported,
                )
            )

        log_path = _save_log([message for message in messages if not message.already_reported], log_dir) if messages else ""

        return GmailCheckResult(
            ok=True,
            unread_count=len(raw_messages),
            reported_count=len(messages),
            skipped_count=skipped_count,
            messages=messages,
            log_path=log_path,
        )
    except Exception as exc:
        return GmailCheckResult(
            ok=False,
            message="Tôi chưa thể đọc Gmail lúc này.",
            error=f"{type(exc).__name__}: {exc}",
        )


def format_gmail_report(result: GmailCheckResult) -> str:
    opening = "Vâng thưa sếp. Sếp chờ em chút, em đang check Gmail và sẽ báo cáo ngay."

    if not result.ok:
        return f"{opening}\n\n{result.message} Chi tiết kỹ thuật: {result.error}"

    if result.unread_count == 0:
        return f"{opening}\n\nSếp hiện không có email chưa đọc nào trong Gmail."

    if result.reported_count == 0:
        return (
            f"{opening}\n\nSếp có {result.unread_count} email chưa đọc, "
            "nhưng các email đó FRIDAY đã báo cáo trước đó rồi."
        )

    lines = [
        opening,
        "",
        f"Sếp có {result.unread_count} email chưa đọc. Em báo cáo {result.reported_count} email mới chưa từng đọc cho sếp:",
    ]

    for index, message in enumerate(result.messages, start=1):
        preview = message.body_preview or message.snippet or "(không có nội dung xem trước)"
        preview = preview[:420].strip()
        lines.extend(
            [
                "",
                f"{index}. Từ: {message.sender}",
                f"   Chủ đề: {message.subject}",
                f"   Nội dung chính: {preview}",
            ]
        )

    if result.log_path:
        lines.extend(["", f"Em đã lưu log Gmail đã đọc tại: {result.log_path}"])

    return "\n".join(lines)
async def check_unread_gmail_with_timeout(
    *,
    include_locally_reported: bool = False,
    timeout_seconds: float | None = None,
) -> GmailCheckResult:
    if timeout_seconds is None:
        try:
            timeout_seconds = float(os.getenv("FRIDAY_GMAIL_TIMEOUT_SECONDS", "20"))
        except ValueError:
            timeout_seconds = 20.0

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(check_unread_gmail, include_locally_reported=include_locally_reported),
            timeout=max(1.0, timeout_seconds),
        )
    except asyncio.TimeoutError:
        return GmailCheckResult(
            ok=False,
            message="Gmail API phản hồi quá lâu nên em đã dừng phiên check để tránh làm kẹt Core AI.",
            error=f"Timeout after {timeout_seconds:.1f}s",
        )


def format_gmail_report(result: GmailCheckResult) -> str:
    opening = "Vâng thưa sếp. Sếp chờ em chút, em đang check Gmail và sẽ báo cáo ngay."

    if not result.ok:
        return f"{opening}\n\n{result.message} Chi tiết kỹ thuật: {result.error}"

    if result.unread_count == 0:
        return f"{opening}\n\nSếp hiện không có email chưa đọc nào trong Gmail."

    if result.reported_count == 0:
        return (
            f"{opening}\n\nSếp có {result.unread_count} email chưa đọc, "
            "nhưng các email đó FRIDAY đã báo cáo trước đó rồi."
        )

    lines = [
        opening,
        "",
        f"Sếp có {result.unread_count} email chưa đọc. Em báo cáo {result.reported_count} email mới chưa từng đọc cho sếp:",
    ]

    for index, message in enumerate(result.messages, start=1):
        preview = message.body_preview or message.snippet or "(không có nội dung xem trước)"
        preview = preview[:420].strip()
        lines.extend(
            [
                "",
                f"{index}. Từ: {message.sender}",
                f"   Chủ đề: {message.subject}",
                f"   Nội dung chính: {preview}",
            ]
        )

    if result.log_path:
        lines.extend(["", f"Em đã lưu log Gmail đã đọc tại: {result.log_path}"])

    return "\n".join(lines)
