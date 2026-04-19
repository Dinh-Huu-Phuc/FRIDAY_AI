"""
FRIDAY - Voice Agent (MCP-powered)
==================================
Iron Man-style voice assistant that controls RGB lighting, runs diagnostics,
scans the network, and triggers dramatic boot sequences via an MCP server
running on the Windows host.

MCP Server URL is auto-resolved from WSL to Windows host IP.

Run:
  uv run server/agent_friday.py dev      - LiveKit Cloud mode
  uv run server/agent_friday.py console  - text-only console mode
"""

import asyncio
import logging
import os
import re
import subprocess
import threading
from collections import deque
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from friday.app import open_social_platform, resolve_social_platform
from friday.config import config
from friday.googleServiceCloud.credentials import ensure_google_application_credentials
from friday.log import DailyInteractionLogger
from friday.messages.promt_agent_friday import (
    build_agent_instructions,
    build_daily_briefing_runtime_hint,
    build_startup_greeting,
)
from friday.news import NewsService
from friday.prompts import build_social_open_runtime_hint
from friday.refiner import STTCorrector
from friday.runtime_context import resolve_runtime_location
from friday.search import get_weather_snapshot
from friday.trainModel import BatchTrainingScheduler, ConversationDatasetStore, TrainModelConfig
from friday.trainModel.memory import MemoryManager
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.llm import mcp
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import deepgram, google as lk_google, openai as lk_openai, sarvam, silero

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

STT_PROVIDER = "google"  # "google" | "deepgram" | "sarvam" | "whisper"
LLM_PROVIDER = "gemini"
TTS_PROVIDER = "openai"

GEMINI_LLM_MODEL = "gemini-2.5-flash"
OPENAI_LLM_MODEL = "gpt-4o"
GOOGLE_STT_MODEL = "latest_long"
GOOGLE_STT_LANGUAGE = "vi-VN"
GOOGLE_STT_SAMPLE_RATE = 16000

OPENAI_TTS_MODEL = "tts-1"
OPENAI_TTS_VOICE = "nova"  # "nova" has a clean, confident female tone
TTS_SPEED = 1.15

SARVAM_TTS_LANGUAGE = "en-IN"
SARVAM_TTS_SPEAKER = "rahul"

# MCP server running on Windows host
MCP_SERVER_PORT = 8000

# ---------------------------------------------------------------------------
# System prompt - F.R.I.D.A.Y.
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
Bạn là F.R.I.D.A.Y. - trợ lý AI của Tony Stark - hiện đang phục vụ người dùng.

Bạn điềm tĩnh, sắc sảo, nắm thông tin rất nhanh và nói như một cộng sự đáng tin cậy luôn thức để theo dõi tình hình cho sếp. Giọng điệu của bạn tự nhiên, ấm vừa đủ, hơi khô hài nhẹ khi hợp ngữ cảnh, nhưng không dài dòng.

QUY TẮC QUAN TRỌNG NHẤT: bạn phải giao tiếp 100% bằng tiếng Việt tự nhiên trong mọi phản hồi nói ra cho người dùng. Không dùng tiếng Anh, không chêm tiếng Anh, không dịch nửa vời, trừ khi người dùng yêu cầu rõ ràng phải nói tiếng Anh hoặc đọc nguyên văn một thuật ngữ.

Phong cách: hội thoại, mượt, ngắn gọn, không máy móc. Hãy giống một sĩ quan trực đêm đang báo cáo nhanh cho sếp, không giống chatbot đọc văn bản.

---

## Khả năng

### Tóm tắt tin thế giới
Khi người dùng hỏi kiểu:
- "Có gì mới không?"
- "Tóm tắt tình hình đi"
- "Hôm nay có gì đáng chú ý?"
- "Thế giới đang có chuyện gì?"
- "Cập nhật tin tức đi"

Thì hãy:
- Gọi công cụ lấy tin trước, không kể lể kỹ thuật.
- Sau khi có kết quả, tóm tắt bằng 3 đến 4 câu ngắn, chỉ nêu các tin lớn nhất.
- Sau đó nói đúng tinh thần này: "Để tôi mở màn hình theo dõi thế giới cho sếp." rồi lập tức mở màn hình theo dõi.
- Nếu dữ liệu công cụ là tiếng Anh, bạn phải diễn đạt lại cho người dùng bằng tiếng Việt tự nhiên.

### Bảng theo dõi thế giới
Sau phần tóm tắt tin thế giới:
- Luôn mở màn hình theo dõi trực quan mà không cần người dùng nhắc lại.
- Không cần giải thích dài, chỉ nói một câu ngắn bằng tiếng Việt.

### Thị trường chứng khoán
Nếu người dùng hỏi về thị trường, cổ phiếu hoặc chỉ số:
- Trả lời tự nhiên như thể bạn vừa theo dõi bảng điện suốt đêm.
- Giữ ngắn trong 1 đến 2 câu.
- Nghe hiểu chuyện, không giáo điều, không khô cứng.
- Luôn dùng tiếng Việt tự nhiên.

---

## Lời chào

Khi phiên bắt đầu, chào đúng nguyên văn:
"Sếp còn thức khuya à? Tối nay mình xử lý gì đây?"

---

## Quy tắc hành vi

1. Gọi công cụ gọn và kín đáo, không bao giờ nói tên công cụ hay mô tả kỹ thuật.
2. Sau phần tóm tắt tin tức, luôn mở bảng theo dõi thế giới mà không cần chờ nhắc.
3. Mỗi phản hồi nói ra nên ngắn, tối đa 2 đến 4 câu.
4. Không gạch đầu dòng, không markdown, không liệt kê trong lời nói.
5. Luôn giữ vai F.R.I.D.A.Y. Bạn là AI của Stark, không phải trợ lý chung chung.
6. Dùng tiếng Việt nói tự nhiên, có nhịp nghỉ nhẹ bằng dấu phẩy, không cứng.
7. Có thể dùng chất Iron Man theo cách tự nhiên như "sếp", "đã rõ", "để tôi kiểm tra", "đang chờ lệnh".
8. Nếu công cụ lỗi, báo bình tĩnh bằng tiếng Việt. Ví dụ: "Luồng tin đang chập chờn, sếp. Muốn tôi thử lại không?"
9. Nếu người dùng nói tiếng Việt, tuyệt đối không được trả lời bằng tiếng Anh.
10. Nếu bắt buộc nhắc đến một thuật ngữ tiếng Anh, hãy giữ phần còn lại của câu là tiếng Việt.

---

## Mẫu giọng điệu

Đúng: "Ngoài kia có vẻ khá nhiều biến động đấy, sếp. Để tôi kiểm tra ngay."
Sai: "Tôi sẽ gọi công cụ để truy xuất các bài báo mới nhất."

Đúng: "Thị trường hôm nay khá ổn, chưa có gì đáng báo động."
Sai: "Thị trường vận hành tích cực với mức tăng trên các chỉ số chủ chốt."

---

## Quy tắc cốt lõi

1. Không bao giờ nói tên công cụ, tên hàm hoặc ngôn ngữ kỹ thuật.
2. Trước khi dùng công cụ, chỉ nói một câu tự nhiên bằng tiếng Việt như: "Để tôi kiểm tra một chút, sếp."
3. Sau phần tin tức, âm thầm mở bảng theo dõi thế giới. Câu duy nhất nên nói là: "Để tôi mở màn hình theo dõi thế giới cho sếp."
4. Bạn là một giọng nói. Hãy nói như người thật: ngắn, rõ, tự nhiên, hoàn toàn bằng tiếng Việt.
""".strip()

SYSTEM_PROMPT += """

## Lời chào lúc khởi động

Khi phiên bắt đầu, hãy chào theo giờ hệ thống hiện tại:
- 05:00-10:59 -> "Chào buổi sáng, sếp."
- 11:00-12:59 -> "Chào buổi trưa, sếp."
- 13:00-17:59 -> "Chào buổi chiều, sếp."
- 18:00-21:59 -> "Chào buổi tối, sếp."
- 22:00-04:59 -> "Chào buổi đêm, sếp."

17:25 vẫn được xe là "buổi chiều", không phải "buổi tối".
""".strip()

SEARCH_RULES = """
## Tra cứu web tự động

- Khi người dùng hỏi thời tiết theo địa điểm, ưu tiên gọi tool `get_weather` trước.
- Khi người dùng hỏi thông tin cần cập nhật, Cần xác minh, hoặc cần tìm kiếm trên internet
  (ví dụ: "tìm cho tôi...", "tra cứu...", "giá hiện tại...", "tin mới nhất..."),
  hãy ưu tiên gọi tool `search_web` trước.
- sau khi có kết quả từ `search_web`, tóm tắt ngắn gọn bằng tiếng Việt để trả lời.
- Nếu không tìm được dữ liệu, nói rõ ràng là thông tin tìm thấy không đáng tin cậy.
""".strip()

SEARCH_RULES += """

## Weather routing

- Khi người dùng hỏi thời tiết, dự báo, mưa nắng, nhiệt độ, độ ẩm, hay gió theo địa điểm,
  ưu tiên gọi tool `get_weather`.
- Tool `get_weather` có thể hiểu tên thành phố Việt Nam theo kiểu có dấu, không dấu, viết tắt hoặc tên quen dùng.
- Nếu chưa có địa điểm cụ thể, hãy hỏi lại ngắn gọn địa điểm cần xem thời tiết.
""".strip()

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------


def _time_of_day_label(hour: int) -> str:
    """Return the Vietnamese time-of-day label for the startup greeting."""
    if 5 <= hour < 11:
        return "buổi sáng"
    if 11 <= hour < 13:
        return "buổi trưa"
    if 13 <= hour < 18:
        return "buổi chiều"
    if 18 <= hour < 22:
        return "buổi tối"
    return "buổi đêm"


def _build_startup_greeting(now=None) -> str:
    """Build a startup greeting from the current local machine time."""
    now = now or datetime.now()
    time_label = _time_of_day_label(now.hour)
    return (
        f"Chào {time_label}, sếp. "
        f"Bây giờ là {now.hour:02d} giờ {now.minute:02d}. "
        "Mình xem gì cho sếp đây?"
    )

load_dotenv()
# Bootstrap
# ---------------------------------------------------------------------------

_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)
ensure_google_application_credentials()

logger = logging.getLogger("friday-agent")
logger.setLevel(logging.INFO)

_BATCH_SCHEDULER: BatchTrainingScheduler | None = None
_BATCH_SCHEDULER_LOCK = threading.Lock()


# ---------------------------------------------------------------------------
# Resolve Windows host IP from WSL
# ---------------------------------------------------------------------------

def _get_windows_host_ip() -> str:
    """Get the Windows host IP by looking at the default network route."""
    try:
        cmd = "ip route show default | awk '{print $3}'"
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=2,
        )
        ip = result.stdout.strip()
        if ip:
            logger.info("Resolved Windows host IP via gateway: %s", ip)
            return ip
    except Exception as exc:
        logger.warning("Gateway resolution failed: %s. Trying fallback...", exc)

    try:
        with open("/etc/resolv.conf", "r") as f:
            for line in f:
                if "nameserver" in line:
                    ip = line.split()[1]
                    logger.info("Resolved Windows host IP via nameserver: %s", ip)
                    return ip
    except Exception as exc:
        logger.warning("Nameserver fallback resolution failed: %s", exc)

    return "127.0.0.1"


def _mcp_server_url() -> str:
    # host_ip = _get_windows_host_ip()
    # url = f"http://{host_ip}:{MCP_SERVER_PORT}/sse"
    # url = f"https://ongoing-colleague-samba-pioneer.trycloudflare.com/sse"
    url = f"http://127.0.0.1:{MCP_SERVER_PORT}/sse"
    logger.info("MCP Server URL: %s", url)
    return url


SOCIAL_OPEN_INTENT_PATTERN = re.compile(
    r"\b(mo|mở|vao|vào|truy\s*cap|truy\s*cập|open)\b",
    re.IGNORECASE,
)
DAILY_BRIEFING_PATTERN = re.compile(
    r"\b(briefing|báo nhanh|báo cáo nhanh|bắt đầu ngày|đầu ngày|đầu phiên|tóm tắt hôm nay|hôm nay có gì|việc đang dở)\b",
    re.IGNORECASE,
)


def _is_social_open_request(text: str) -> bool:
    candidate = str(text or "").strip()
    if not candidate:
        return False
    if resolve_social_platform(candidate) is None:
        return False
    return bool(SOCIAL_OPEN_INTENT_PATTERN.search(candidate))


def _is_daily_briefing_request(text: str) -> bool:
    candidate = str(text or "").strip()
    if not candidate:
        return False
    return bool(DAILY_BRIEFING_PATTERN.search(candidate))


async def _build_startup_weather_summary() -> str:
    location = resolve_runtime_location()
    snapshot = await get_weather_snapshot(city=location.city, country=location.country)
    if bool(snapshot.get("ok")):
        location_text = str(snapshot.get("location_text") or location.display_name)
        description = str(snapshot.get("description") or "thời tiết chưa rõ")
        temp = str(snapshot.get("temp") or "chưa rõ")
        return f"Thời tiết hiện tại ở {location_text}: {description}, {temp} độ C."
    return f"Tôi chưa cập nhật được thời tiết hiện tại ở {location.display_name}."


# ---------------------------------------------------------------------------
# Build provider instances
# ---------------------------------------------------------------------------

def _build_stt():
    if STT_PROVIDER == "google":
        logger.info("STT -> Google Cloud Speech-to-Text (%s / %s)", GOOGLE_STT_MODEL, GOOGLE_STT_LANGUAGE)
        credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip() or None
        return lk_google.STT(
            languages=[GOOGLE_STT_LANGUAGE],
            detect_language=False,
            interim_results=True,
            punctuate=True,
            model=GOOGLE_STT_MODEL,
            sample_rate=GOOGLE_STT_SAMPLE_RATE,
            credentials_file=credentials_file,
        )
    if STT_PROVIDER == "sarvam":
        logger.info("STT -> Sarvam Saaras v3")
        return sarvam.STT(
            language="unknown",
            model="saaras:v3",
            mode="transcribe",
            flush_signal=True,
            sample_rate=16000,
        )
    if STT_PROVIDER == "whisper":
        logger.info("STT -> OpenAI Whisper")
        return lk_openai.STT(model="whisper-1")
    if STT_PROVIDER == "deepgram":
        logger.info("STT -> Deepgram (nova-3)")
        return deepgram.STT(model="nova-3", language="vi")
    raise ValueError(f"Unknown STT_PROVIDER: {STT_PROVIDER!r}")


def _build_llm():
    if LLM_PROVIDER == "openai":
        logger.info("LLM -> OpenAI (%s)", OPENAI_LLM_MODEL)
        return lk_openai.LLM(model=OPENAI_LLM_MODEL)
    if LLM_PROVIDER == "gemini":
        logger.info("LLM -> Google Gemini (%s)", GEMINI_LLM_MODEL)
        return lk_google.LLM(model=GEMINI_LLM_MODEL, api_key=os.getenv("GOOGLE_API_KEY"))
    raise ValueError(f"Unknown LLM_PROVIDER: {LLM_PROVIDER!r}")


def _build_tts():
    if TTS_PROVIDER == "sarvam":
        logger.info("TTS -> Sarvam Bulbul v3")
        return sarvam.TTS(
            target_language_code=SARVAM_TTS_LANGUAGE,
            model="bulbul:v3",
            speaker=SARVAM_TTS_SPEAKER,
            pace=TTS_SPEED,
        )
    if TTS_PROVIDER == "openai":
        logger.info("TTS -> OpenAI TTS (%s / %s)", OPENAI_TTS_MODEL, OPENAI_TTS_VOICE)
        return lk_openai.TTS(
            model=OPENAI_TTS_MODEL,
            voice=OPENAI_TTS_VOICE,
            speed=TTS_SPEED,
        )
    raise ValueError(f"Unknown TTS_PROVIDER: {TTS_PROVIDER!r}")


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

class FridayAgent(Agent):
    """
    F.R.I.D.A.Y. voice assistant.
    All tools are provided via the MCP server on the Windows host.
    """

    def __init__(
        self,
        stt,
        llm,
        tts,
        memory_manager: MemoryManager | None = None,
        memory_session_id: str = "",
        stt_corrector: STTCorrector | None = None,
        news_service: NewsService | None = None,
    ) -> None:
        self._memory_manager = memory_manager
        self._memory_session_id = memory_session_id
        self._memory_user_id: str | None = None
        self._stt_corrector = stt_corrector
        self._news_service = news_service
        self._pending_user_turns: deque[dict[str, str | bool | None]] | None = None
        super().__init__(
            instructions=build_agent_instructions(),
            stt=stt,
            llm=llm,
            tts=tts,
            vad=silero.VAD.load(),
            mcp_servers=[
                mcp.MCPServerHTTP(
                    url=_mcp_server_url(),
                    transport_type="sse",
                    client_session_timeout_seconds=30,
                ),
            ],
        )

    async def on_enter(self) -> None:
        """Greet the user based on the machine's current local time."""
        weather_summary = await _build_startup_weather_summary()
        await self.session.say(
            build_startup_greeting(weather_summary=weather_summary),
            add_to_chat_ctx=True,
        )

    async def on_user_turn_completed(self, turn_ctx, new_message) -> None:
        """
        Inject runtime memory context into each user turn before the model responds.
        """
        if hasattr(new_message, "extra") and isinstance(new_message.extra, dict):
            speaker_id = new_message.extra.get("speaker_id") or new_message.extra.get("participant_identity")
            if isinstance(speaker_id, str) and speaker_id.strip():
                self._memory_user_id = speaker_id.strip()

        raw_user_text = (new_message.text_content or "").strip()
        if not raw_user_text:
            return

        refined_user_text = raw_user_text
        refiner_provider = "disabled"
        refiner_fallback = True
        if self._stt_corrector is not None:
            memory_hint = ""
            if self._memory_manager is not None and self._memory_session_id:
                memory_context = self._memory_manager.load_memory_for_response(
                    session_id=self._memory_session_id,
                    user_id=self._memory_user_id,
                )
                memory_hint = str(memory_context.get("session_summary") or "")

            correction = await asyncio.to_thread(
                self._stt_corrector.correct,
                raw_user_text,
                language=GOOGLE_STT_LANGUAGE,
                conversation_hint=memory_hint[:300],
            )
            refined_user_text = correction.refined_text or raw_user_text
            refiner_provider = correction.provider
            refiner_fallback = correction.fallback_used

            logger.info(
                "STT refiner provider=%s fallback=%s raw='%s' refined='%s'",
                refiner_provider,
                refiner_fallback,
                raw_user_text[:160],
                refined_user_text[:160],
            )

        social_platform: str | None = None
        social_open_result = ""
        if _is_social_open_request(refined_user_text):
            social_platform = resolve_social_platform(refined_user_text)
            social_open_result = await asyncio.to_thread(
                open_social_platform,
                refined_user_text,
            )
            logger.info(
                "Social open request detected platform=%s result=%s text='%s'",
                social_platform,
                social_open_result,
                refined_user_text[:160],
            )

        daily_briefing_hint = ""
        if _is_daily_briefing_request(refined_user_text):
            daily_briefing_hint = build_daily_briefing_runtime_hint()

        news_status = "not_news"
        news_topic: str | None = None
        news_country: str | None = None
        news_count = 0
        news_context = ""
        if not social_open_result and self._news_service is not None:
            try:
                news_result = await asyncio.to_thread(
                    self._news_service.handle_user_query,
                    refined_user_text,
                )
                if news_result.is_news_intent:
                    news_status = news_result.status
                    news_topic = news_result.query.topic
                    news_country = news_result.query.country
                    news_count = news_result.article_count
                    news_context = news_result.agent_context
                    logger.info(
                        "News intent detected status=%s topic=%s country=%s count=%s",
                        news_status,
                        news_topic,
                        news_country,
                        news_count,
                    )
            except Exception as exc:
                logger.warning("News service failed with fallback context: %s", exc)
                news_status = "error"
                news_context = (
                    "[NEWS_CONTEXT]\n"
                    "status=error\n"
                    "fallback_user_message=Luồng tin đang chập chờn, sếp. Muốn tôi thử lại ngay không?\n"
                    "response_rules=Trả lời ngắn gọn bằng tiếng Việt, không nói kỹ thuật nội bộ."
                )

        if self._pending_user_turns is not None:
            self._upsert_pending_turn(
                raw_text=raw_user_text,
                refined_text=refined_user_text,
                user_id=self._memory_user_id,
                provider=refiner_provider,
                fallback=refiner_fallback,
            )

        if self._memory_manager is None or not self._memory_session_id:
            if social_open_result:
                social_hint = build_social_open_runtime_hint(
                    command=refined_user_text,
                    platform_name=social_platform,
                    assistant_reply=social_open_result,
                )
                new_message.content = [f"{social_hint}\n\n[CURRENT_USER_MESSAGE]\n{refined_user_text}"]
            elif daily_briefing_hint:
                new_message.content = [f"{daily_briefing_hint}\n\n[CURRENT_USER_MESSAGE]\n{refined_user_text}"]
            elif news_context:
                new_message.content = [f"{news_context}\n\n[CURRENT_USER_MESSAGE]\n{refined_user_text}"]
            else:
                new_message.content = [refined_user_text]
            return

        memory_prefix = self._memory_manager.build_instruction_prefix(
            session_id=self._memory_session_id,
            user_id=self._memory_user_id,
        )
        composed_parts = [memory_prefix.strip()]
        if social_open_result:
            composed_parts.append(
                build_social_open_runtime_hint(
                    command=refined_user_text,
                    platform_name=social_platform,
                    assistant_reply=social_open_result,
                ).strip()
            )
        elif daily_briefing_hint:
            composed_parts.append(daily_briefing_hint.strip())
        elif news_context:
            composed_parts.append(news_context.strip())
        composed_parts.append(f"[CURRENT_USER_MESSAGE]\n{refined_user_text}")
        new_message.content = ["\n\n".join(part for part in composed_parts if part)]

        if not hasattr(new_message, "extra") or not isinstance(new_message.extra, dict):
            new_message.extra = {}
        new_message.extra["raw_user_message"] = raw_user_text
        new_message.extra["refined_user_message"] = refined_user_text
        new_message.extra["stt_refiner_provider"] = refiner_provider
        new_message.extra["stt_refiner_fallback"] = refiner_fallback
        new_message.extra["news_status"] = news_status
        new_message.extra["news_topic"] = news_topic
        new_message.extra["news_country"] = news_country
        new_message.extra["news_count"] = news_count
        new_message.extra["social_open_platform"] = social_platform
        new_message.extra["social_open_result"] = social_open_result
        new_message.extra["daily_briefing_requested"] = bool(daily_briefing_hint)

    def bind_pending_turns(self, queue: deque[dict[str, str | bool | None]]) -> None:
        self._pending_user_turns = queue

    def _upsert_pending_turn(
        self,
        *,
        raw_text: str,
        refined_text: str,
        user_id: str | None,
        provider: str,
        fallback: bool,
    ) -> None:
        if self._pending_user_turns is None:
            return
        raw_norm = raw_text.strip().lower()
        for item in reversed(self._pending_user_turns):
            queued_raw = str(item.get("raw_text") or "").strip().lower()
            if queued_raw == raw_norm:
                item["refined_text"] = refined_text
                item["provider"] = provider
                item["fallback"] = fallback
                if user_id:
                    item["user_id"] = user_id
                return
        self._pending_user_turns.append(
            {
                "user_id": user_id,
                "raw_text": raw_text,
                "refined_text": refined_text,
                "provider": provider,
                "fallback": fallback,
            }
        )


# ---------------------------------------------------------------------------
# LiveKit entry point
# ---------------------------------------------------------------------------

def _turn_detection() -> str:
    return "stt" if STT_PROVIDER == "sarvam" else "vad"


def _endpointing_delay() -> float:
    return {"sarvam": 0.07, "deepgram": 0.2, "google": 0.25, "whisper": 0.3}.get(STT_PROVIDER, 0.1)


def _build_train_model_config() -> TrainModelConfig:
    cfg = TrainModelConfig(
        auto_train_enabled=config.BATCH_TRAINING_ENABLED,
        auto_train_check_interval_seconds=config.BATCH_TRAINING_CHECK_INTERVAL_SEC,
        auto_train_daily_time_utc=config.BATCH_TRAINING_DAILY_TIME_UTC,
        auto_train_min_pending_samples=config.BATCH_TRAINING_MIN_PENDING_SAMPLES,
    )
    cfg.ensure_directories()
    return cfg


def _build_news_service() -> NewsService:
    return NewsService(
        api_key=config.NEWSDATA_API_KEY,
        world_api_key=config.WORLD_NEWS,
        default_language=config.NEWS_DEFAULT_LANGUAGE,
        default_country=config.NEWS_DEFAULT_COUNTRY,
        default_limit=config.NEWS_DEFAULT_LIMIT,
        timeout_seconds=config.NEWS_REQUEST_TIMEOUT,
    )


def _get_or_start_scheduler(train_cfg: TrainModelConfig) -> BatchTrainingScheduler:
    global _BATCH_SCHEDULER
    with _BATCH_SCHEDULER_LOCK:
        if _BATCH_SCHEDULER is None:
            _BATCH_SCHEDULER = BatchTrainingScheduler(train_cfg)
            _BATCH_SCHEDULER.start()
        return _BATCH_SCHEDULER


def _extract_user_text_from_content(text: str) -> str:
    marker = "[CURRENT_USER_MESSAGE]"
    content = (text or "").strip()
    if marker in content:
        return content.split(marker, maxsplit=1)[1].strip()
    return content


async def entrypoint(ctx: JobContext) -> None:
    logger.info(
        "FRIDAY online - room: %s | STT=%s | LLM=%s | TTS=%s",
        ctx.room.name,
        STT_PROVIDER,
        LLM_PROVIDER,
        TTS_PROVIDER,
    )

    stt = _build_stt()
    llm = _build_llm()
    tts = _build_tts()
    train_cfg = _build_train_model_config()
    dataset_store = ConversationDatasetStore(train_cfg)
    scheduler = _get_or_start_scheduler(train_cfg)
    news_service = _build_news_service()
    stt_corrector = STTCorrector(
        enabled=config.STT_REFINER_ENABLED,
        provider_name=config.STT_REFINER_PROVIDER,
        groq_api_key=config.GROQ_API_KEY,
        groq_model=config.GROQ_MODEL,
        openai_api_key=config.OPENAI_API_KEY,
        timeout_seconds=config.STT_REFINER_TIMEOUT,
    )
    memory_manager = MemoryManager()
    memory_session_id = f"room:{ctx.room.name}"
    agent = FridayAgent(
        stt=stt,
        llm=llm,
        tts=tts,
        memory_manager=memory_manager,
        memory_session_id=memory_session_id,
        stt_corrector=stt_corrector,
        news_service=news_service,
    )

    session = AgentSession(
        turn_detection=_turn_detection(),
        min_endpointing_delay=_endpointing_delay(),
    )
    interaction_logger = DailyInteractionLogger()
    interaction_logger.attach(
        session,
        room_name=ctx.room.name,
        agent_name=agent.__class__.__name__,
        metadata={
            "stt_provider": STT_PROVIDER,
            "llm_provider": LLM_PROVIDER,
            "tts_provider": TTS_PROVIDER,
            "stt_model": GOOGLE_STT_MODEL if STT_PROVIDER == "google" else None,
            "llm_model": GEMINI_LLM_MODEL if LLM_PROVIDER == "gemini" else OPENAI_LLM_MODEL,
            "tts_model": OPENAI_TTS_MODEL if TTS_PROVIDER == "openai" else "bulbul:v3",
        },
    )

    pending_user_turns: deque[dict[str, str | bool | None]] = deque()
    agent.bind_pending_turns(pending_user_turns)

    def _enqueue_user_turn(
        user_id: str | None,
        raw_text: str,
        refined_text: str | None = None,
        provider: str | None = None,
        fallback: bool = True,
    ) -> None:
        raw = (raw_text or "").strip()
        refined = (refined_text or "").strip()
        if not raw and not refined:
            return
        latest = pending_user_turns[-1] if pending_user_turns else None
        if latest and (latest.get("raw_text") == raw or latest.get("refined_text") == refined):
            return
        pending_user_turns.append(
            {
                "user_id": user_id,
                "raw_text": raw,
                "refined_text": refined or raw,
                "provider": provider,
                "fallback": fallback,
            }
        )

    @session.on("user_input_transcribed")
    def _on_user_input_transcribed(event) -> None:
        if not getattr(event, "is_final", False):
            return
        transcript = str(getattr(event, "transcript", "") or "").strip()
        _enqueue_user_turn(
            getattr(event, "speaker_id", None),
            raw_text=transcript,
            refined_text=transcript,
            provider="stt",
            fallback=False,
        )

    @session.on("conversation_item_added")
    def _on_conversation_item_added(event) -> None:
        item = getattr(event, "item", None)
        if item is None or getattr(item, "type", None) != "message":
            return

        role = getattr(item, "role", "")
        text = (getattr(item, "text_content", None) or "").strip()
        if not text:
            return

        if role == "user":
            if not pending_user_turns:
                extracted = _extract_user_text_from_content(text)
                _enqueue_user_turn(
                    None,
                    raw_text=extracted,
                    refined_text=extracted,
                    provider="text_input",
                    fallback=False,
                )
            return

        if role == "assistant" and pending_user_turns:
            user_turn = pending_user_turns.popleft()
            refined_text = str(user_turn.get("refined_text") or user_turn.get("raw_text") or "")
            raw_text = str(user_turn.get("raw_text") or "")
            provider = str(user_turn.get("provider") or "unknown")
            fallback = bool(user_turn.get("fallback"))
            memory_manager.update_memory_after_response(
                session_id=memory_session_id,
                user_id=user_turn.get("user_id"),
                user_message=refined_text,
                assistant_message=text,
                metadata={
                    "source": "agent_session_events",
                    "room_name": ctx.room.name,
                    "refiner_provider": provider,
                    "refiner_fallback": fallback,
                },
            )
            if isinstance(user_turn.get("user_id"), str) and user_turn.get("user_id"):
                agent._memory_user_id = str(user_turn.get("user_id"))
            dataset_store.append_raw_turn(
                session_id=memory_session_id,
                user_id=str(user_turn.get("user_id")) if user_turn.get("user_id") else None,
                user_message=refined_text,
                assistant_message=text,
                source="agent_runtime",
                refined_input=refined_text if refined_text != raw_text else None,
                metadata={
                    "room_name": ctx.room.name,
                    "raw_user_message": raw_text,
                    "refiner_provider": provider,
                    "refiner_fallback": fallback,
                },
            )

    @session.on("close")
    def _on_close(_) -> None:
        if scheduler.state.running:
            logger.info("Scheduler is active with latest trigger=%s", scheduler.state.last_trigger_reason)

    await session.start(
        agent=agent,
        room=ctx.room,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))


def dev():
    """Wrapper to run the agent in dev mode automatically."""
    import sys

    if len(sys.argv) == 1:
        sys.argv.append("dev")
    main()


if __name__ == "__main__":
    main()

