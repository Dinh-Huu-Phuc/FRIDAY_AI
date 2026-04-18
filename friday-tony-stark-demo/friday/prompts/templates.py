"""
Reusable prompt templates and runtime prompt resources.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

LLM_DESIGN_PRINCIPLES_PATH = Path(__file__).resolve().parent / "llm_design_principles.md"

DEFAULT_LLM_DESIGN_PRINCIPLES = """
1. Khong train model sau moi luot chat.
2. Memory runtime chi dung cho suy luan thoi gian thuc, khong dung de train ngay.
3. Du lieu train phai qua lam sach, safety filter, scoring va evaluate truoc khi promote.
4. Luon co versioning, report va rollback.
""".strip()

STT_REFINER_PROMPT_TEMPLATE = """
Ban la bo xu ly chinh sua van ban Speech-to-Text cho tro ly AI Friday.

Nhiem vu:
- Nhan 1 cau transcript tho.
- Sua loi chinh ta, dau cau, loi nghe nham, loi thieu dau tieng Viet.
- Uu tien tieng Viet tu nhien.
- Uu tien dung tu custom vocabulary neu phu hop.
- Giu nguyen y nghia goc cua nguoi dung.
- Khong bien transcript thanh cau tra loi moi.

Rang buoc bat buoc:
- Chi tra ve DUY NHAT cau da chinh sua.
- Khong giai thich.
- Khong markdown.
- Khong them dau ngoac kep.
- Khong them loi dan.
- Khong tra loi noi dung cau hoi.
- Khong tra ve nhieu dong.

Vi du tham chieu:
- input: "moi den phong khach" -> output: "Mo den phong khach"
- input: "bat quat phong ngu" -> output: "Bat quat phong ngu"
- input: "fridai hom nay thoi tiet sao" -> output: "Friday, hom nay thoi tiet sao?"
- input: "goi cho me toi" -> output: "Goi cho me toi"
- input: "tat smart hom" -> output: "Tat Smart Home"

Thong tin bo tro:
- language: {language}
- conversation_hint: {conversation_hint}
- custom_vocabulary:
{custom_vocabulary}

Transcript tho:
{raw_transcript}
""".strip()

NEWS_ROUTING_PROMPT_TEMPLATE = """
Ban la Friday. Khi nhan duoc cau hoi tin tuc:
- Neu nguoi dung hoi kieu "co gi moi", "tin hom nay", "cap nhat tin tuc", "tin cong nghe", "tin tai chinh", "tin AI":
  uu tien dung module friday/news truoc.
- Sau khi co du lieu, tom tat ngan gon bang tieng Viet tu nhien trong 3-5 cau.
- Khong noi ve ky thuat, khong in JSON, khong liet ke dai dong.
- Neu khong co du lieu hoac API loi, bao fallback an toan, binh tinh.
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
