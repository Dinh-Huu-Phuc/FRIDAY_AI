"""
Reusable prompt templates and runtime prompt resources.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

LLM_DESIGN_PRINCIPLES_PATH = Path(__file__).resolve().parent / "llm_design_principles.md"

DEFAULT_LLM_DESIGN_PRINCIPLES = """
1. Không train model sau mỗi lượt chat.
2. Memory runtime chỉ dùng cho suy luận thời gian thực, không dùng để train ngay.
3. Dữ liệu train phải qua làm sạch, safety filter, scoring và evaluate trước khi promote.
4. Luôn có versioning, report và rollback.
""".strip()

STT_REFINER_PROMPT_TEMPLATE = """
Bạn là bộ xử lý chỉnh sửa văn bản Speech-to-Text cho trợ lý AI Friday.

Nhiệm vụ:
- Nhận 1 câu transcript thô.
- Sửa lỗi chính tả, dấu câu, lỗi nghe nhầm, lỗi thiếu dấu tiếng Việt.
- Ưu tiên tiếng Việt tự nhiên.
- Ưu tiên dùng từ custom vocabulary nếu phù hợp.
- Giữ nguyên ý nghĩa gốc của người dùng.
- Không biến transcript thành câu trả lời mới.

Ràng buộc bắt buộc:
- Chỉ trả về DUY NHẤT câu đã chỉnh sửa.
- Không giải thích.
- Không markdown.
- Không thêm dấu ngoặc kép.
- Không thêm lời dẫn.
- Không trả lời nội dung câu hỏi.
- Không trả về nhiều dòng.

Ví dụ tham chiếu:
- input: "mở đèn phòng khách" -> output: "Mở đèn phòng khách"
- input: "bật quạt phòng ngủ" -> output: "Bật quạt phòng ngủ"
- input: "fridai hôm nay thời tiết sao" -> output: "Friday, hôm nay thời tiết sao?"
- input: "gọi cho mẹ tôi" -> output: "Gọi cho mẹ tôi"
- input: "tắt smart home" -> output: "Tắt Smart Home"

Thông tin bổ trợ:
- language: {language}
- conversation_hint: {conversation_hint}
- custom_vocabulary:
{custom_vocabulary}

Transcript thô:
{raw_transcript}
""".strip()

NEWS_ROUTING_PROMPT_TEMPLATE = """
Bạn là Friday. Khi nhận được câu hỏi tin tức:
- Nếu người dùng hỏi kiểu "có gì mới", "tin hôm nay", "cập nhật tin tức", "tin công nghệ", "tin tài chính", "tin AI":
  ưu tiên dùng module friday/news trước.
- Sau khi có dữ liệu, tóm tắt ngắn gọn bằng tiếng Việt tự nhiên trong 3-5 câu.
- Không nói về kỹ thuật, không in JSON, không liệt kê dài dòng.
- Nếu không có dữ liệu hoặc API lỗi, báo fallback an toàn, bình tĩnh.
""".strip()

SOCIAL_ROUTING_PROMPT_TEMPLATE = """
Bạn là Friday. Khi người dùng muốn mở, vào, truy cập, hoặc open một mạng xã hội:
- Ưu tiên xử lý các nền tảng: facebook, youtube, instagram, tiktok, x, twitter, linkedin, pinterest, reddit, telegram, discord.
- Phải gọi tool `open_social_platform_homepage` trước với tham số `command` là NGUYÊN VĂN câu người dùng.
- Nếu tool trả về "Tôi đã mở rồi thưa sếp." thì chỉ được trả lời đúng nguyên văn câu đó.
- Nếu tool trả về "Thưa sếp, tôi chưa xác định được mạng xã hội cần mở." thì chỉ được trả lời đúng nguyên văn câu đó.
- Không thêm lời dẫn, không giải thích thêm, không nói về tool.
""".strip()

FACEBOOK_PAGE_ROUTING_PROMPT_TEMPLATE = """
Bạn là Friday. Khi người dùng muốn kiểm tra, đọc, xem, hoặc tóm tắt tin nhắn Facebook hay Messenger của Facebook Page:
- Ưu tiên gọi tool `check_facebook_messages`.
- Nếu người dùng hỏi thông báo, bình luận, tương tác, feed event, hoặc notification của Facebook Page:
  ưu tiên gọi tool `check_facebook_notifications`.
- Sau khi tool trả kết quả, tóm tắt bằng tiếng Việt tự nhiên, ngắn gọn, không nói về tên tool.
- Nếu tool báo chưa có dữ liệu đồng bộ, nói đúng ý nghĩa đó bằng tiếng Việt tự nhiên và nhắc nhở rằng cần webhook của Facebook Page.
""".strip()

SOCIAL_OPEN_RUNTIME_HINT_TEMPLATE = """
[SOCIAL_OPEN_CONTEXT]
- The current user request is a social-open command.
- Resolved platform: {platform_name}
- The browser action has already been executed in runtime.
- Assistant reply for this turn must be exactly: "{assistant_reply}"
- Do not add any extra words before or after that exact sentence.
- Do not call any more tools for this turn.
""".strip()


@lru_cache(maxsize=1)
def get_llm_design_principles_text() -> str:
    """
    Load design principles from markdown file with safe fallback.
    """
    return _load_text_file_with_fallback(
        file_path=LLM_DESIGN_PRINCIPLES_PATH,
        fallback_text=DEFAULT_LLM_DESIGN_PRINCIPLES,
    )


def build_stt_refiner_prompt(
    *,
    raw_transcript: str,
    language: str = "vi-VN",
    conversation_hint: str = "",
    custom_vocabulary: str = "",
) -> str:
    transcript = raw_transcript.strip()
    if not transcript:
        transcript = "(empty)"

    return STT_REFINER_PROMPT_TEMPLATE.format(
        language=language.strip() or "vi-VN",
        conversation_hint=conversation_hint.strip() or "none",
        custom_vocabulary=custom_vocabulary.strip() or "- none",
        raw_transcript=transcript,
    )


def get_news_routing_prompt() -> str:
    return NEWS_ROUTING_PROMPT_TEMPLATE


def get_social_routing_prompt() -> str:
    return SOCIAL_ROUTING_PROMPT_TEMPLATE


def get_facebook_page_routing_prompt() -> str:
    return FACEBOOK_PAGE_ROUTING_PROMPT_TEMPLATE


def build_social_open_runtime_hint(
    *,
    command: str,
    platform_name: str | None,
    assistant_reply: str,
) -> str:
    _ = command
    return SOCIAL_OPEN_RUNTIME_HINT_TEMPLATE.format(
        platform_name=(platform_name or "unknown").strip() or "unknown",
        assistant_reply=assistant_reply.strip(),
    )


def _load_text_file_with_fallback(*, file_path: Path, fallback_text: str) -> str:
    try:
        if not file_path.exists():
            return fallback_text
        content = file_path.read_text(encoding="utf-8").strip()
        if not content:
            return fallback_text
        return content
    except (OSError, UnicodeDecodeError):
        return fallback_text


def register(mcp):
    @mcp.prompt()
    def summarize(text: str) -> str:
        """Prompt to summarize a block of text."""
        return f"Hãy tóm tắt ngắn gọn nội dung sau bằng tiếng Việt tự nhiên:\n\n{text}"

    @mcp.prompt()
    def explain_code(code: str, language: str = "Python") -> str:
        """Prompt to explain a block of code."""
        return (
            f"Hãy giải thích đoạn mã {language} sau bằng tiếng Việt dễ hiểu, "
            f"theo từng bước:\n\n```{language.lower()}\n{code}\n```"
        )
