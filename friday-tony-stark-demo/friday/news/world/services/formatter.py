from __future__ import annotations

from ...VN.formatter import build_articles_digest, normalize_articles
from ...schemas import NewsArticle, NewsQuery


def build_world_agent_news_context(
    *,
    query: NewsQuery,
    articles: list[NewsArticle],
    status: str,
    fallback_message: str = "",
) -> str:
    topic = query.topic or "world"
    digest = build_articles_digest(articles)

    if status != "ok":
        safe_fallback = fallback_message or "Hiện chưa lấy được luồng tin thế giới phù hợp."
        return (
            "[NEWS_CONTEXT]\n"
            f"status={status}\n"
            "scope=world\n"
            f"topic={topic}\n"
            f"search_query={query.text_query or ''}\n"
            "article_count=0\n"
            f"fallback_user_message={safe_fallback}\n"
            "response_rules=Trả lời ngắn gọn bằng tiếng Việt, nêu rõ đây là tin thế giới, không nói kỹ thuật nội bộ."
        )

    return (
        "[NEWS_CONTEXT]\n"
        "status=ok\n"
        "scope=world\n"
        f"topic={topic}\n"
        f"search_query={query.text_query or ''}\n"
        f"article_count={len(articles)}\n"
        "response_rules=Tóm tắt 3 đến 5 câu ngắn bằng tiếng Việt tự nhiên, nêu rõ đây là tin thế giới, diễn đạt lại nội dung tiếng Anh nếu cần, không trả raw JSON.\n"
        "articles_digest=\n"
        f"{digest}"
    )


def build_world_news_fallback_message(*, reason: str) -> str:
    if reason == "missing_world_api_key":
        return "Luồng tin thế giới chưa được cấu hình đầy đủ, sếp. Muốn tôi thử lại sau khi cập nhật WORLD_NEWS không?"
    if reason in {"network_error", "timeout", "io_error"}:
        return "Kết nối tới nguồn tin thế giới đang chập chờn, sếp. Tôi sẽ thử lại ngay khi đường truyền ổn định hơn."
    if reason == "no_data":
        return "Hiện chưa có bài tin thế giới phù hợp với yêu cầu này, sếp."
    return "Hiện tôi chưa lấy được luồng tin thế giới phù hợp, sếp."
