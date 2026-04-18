"""
Google web search helper powered by Gemini + Google Search grounding.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Tuple

from google import genai
from google.genai import types
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)


def _extract_sources(response: types.GenerateContentResponse, limit: int = 5) -> List[Tuple[str, str]]:
    """Trích xuất các nguồn web đã được kiểm chứng từ phản hồi của Gemini."""
    data = response.to_json_dict()
    candidates = data.get("candidates", [])
    if not candidates:
        return []

    grounding = candidates[0].get("groundingMetadata", {})
    chunks = grounding.get("groundingChunks", [])

    sources: List[Tuple[str, str]] = []
    seen_urls = set()
    for chunk in chunks:
        web = chunk.get("web", {})
        title = (web.get("title") or "").strip()
        url = (web.get("uri") or "").strip()
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        sources.append((title or "Nguồn tham khảo", url))
        if len(sources) >= limit:
            break
    return sources


def _format_search_error(exc: Exception) -> str:
    """Convert provider/network errors into short Vietnamese diagnostics."""
    message = " ".join(str(part).strip() for part in exc.args if str(part).strip()) or str(exc).strip()
    lower = message.lower()

    if (
        "10013" in lower
        or "forbidden by its access permissions" in lower
        or "socket" in lower and "forbidden" in lower
    ):
        return (
            "Tôi chưa thể tìm kiếm web vì tiến trình hiện tại đang bị chặn kết nối mạng ra ngoài. "
            "Sếp kiểm tra giúp tôi Windows Firewall, antivirus, proxy/VPN, hoặc quyền mạng của Python/uv."
        )

    if (
        "timed out" in lower
        or "timeout" in lower
        or "deadline exceeded" in lower
    ):
        return "Tôi chưa thể tìm kiếm web vì kết nối ra ngoài đang quá chậm hoặc bị timeout."

    if (
        "getaddrinfo failed" in lower
        or "name or service not known" in lower
        or "temporary failure in name resolution" in lower
        or "nodename nor servname provided" in lower
    ):
        return "Tôi chưa thể tìm kiếm web vì máy hiện không phân giải được DNS hoặc chưa ra internet."

    if (
        "api key" in lower
        or "unauthenticated" in lower
        or "permission_denied" in lower
        or "permission denied" in lower
        or "401" in lower
        or "403" in lower
    ):
        return "Tôi chưa thể tìm kiếm web vì khóa API hoặc quyền truy cập Google Search chưa hợp lệ."

    return f"Tôi chưa thể tìm kiếm web lúc này: {message}"


def google_web_search(query: str, max_sources: int = 5) -> str:
    """
    Tìm kiếm web bằng Gemini Google Search grounding và trả về báo cáo ngắn gọn.
    Yêu cầu GOOGLE_API_KEY trong file .env.
    """
    query = (query or "").strip()
    if not query:
        return "Bạn chưa cung cấp nội dung cần tìm kiếm."

    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if not api_key:
        return "Thiếu GOOGLE_API_KEY trong tệp .env nên tôi chưa thể tìm kiếm web."

    model = os.getenv("GOOGLE_SEARCH_MODEL", "gemini-2.0-flash").strip() or "gemini-2.0-flash"
    client = genai.Client(api_key=api_key)

    prompt = (
        "Bạn là trợ lý tìm kiếm web thông minh. "
        "Hãy trả lời bằng tiếng Việt, ngắn gọn, trung thực, không biết thì nói không biết. "
        "Tóm tắt kết quả tìm kiếm cho truy vấn sau trong khoảng 4-8 câu.\n\n"
        f"Truy vấn: {query}"
    )

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                tools=[types.Tool(google_search=types.GoogleSearch())],
            ),
        )
    except Exception as exc:
        return _format_search_error(exc)

    summary = (response.text or "").strip()
    if not summary:
        summary = "Tôi đã tìm kiếm xong nhưng chưa trích xuất được tóm tắt rõ ràng."

    sources = _extract_sources(response, limit=max_sources)
    if not sources:
        return summary

    lines = [summary, "", "### Nguồn tham khảo:"]
    for idx, (title, url) in enumerate(sources, 1):
        lines.append(f"{idx}. {title} - {url}")
    return "\n".join(lines)
