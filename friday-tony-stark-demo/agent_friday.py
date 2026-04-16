"""
FRIDAY - Voice Agent (MCP-powered)
==================================
Iron Man-style voice assistant that controls RGB lighting, runs diagnostics,
scans the network, and triggers dramatic boot sequences via an MCP server
running on the Windows host.

MCP Server URL is auto-resolved from WSL to Windows host IP.

Run:
  uv run agent_friday.py dev      - LiveKit Cloud mode
  uv run agent_friday.py console  - text-only console mode
"""

import logging
import os
import subprocess
from datetime import datetime

from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.llm import mcp
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import deepgram, google as lk_google, openai as lk_openai, sarvam, silero

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

STT_PROVIDER = "deepgram"
LLM_PROVIDER = "gemini"
TTS_PROVIDER = "openai"

GEMINI_LLM_MODEL = "gemini-2.5-flash"
OPENAI_LLM_MODEL = "gpt-4o"

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

## Loi chao luc khoi dong

Khi phien bat dau, hay chao theo gio he thong hien tai:
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

- Khi nguoi dung hoi thoi tiet, du bao, mua nang, nhiet do, do am, hay gio theo dia diem,
  uu tien goi tool `get_weather`.
- Tool `get_weather` co the hieu ten thanh pho Viet Nam theo kieu co dau, khong dau, viet tat hoac ten quen dung.
- Neu chua co dia diem cu the, hay hoi lai ngan gon dia diem can xem thoi tiet.
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

logger = logging.getLogger("friday-agent")
logger.setLevel(logging.INFO)


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
    except Exception:
        pass

    return "127.0.0.1"


def _mcp_server_url() -> str:
    # host_ip = _get_windows_host_ip()
    # url = f"http://{host_ip}:{MCP_SERVER_PORT}/sse"
    # url = f"https://ongoing-colleague-samba-pioneer.trycloudflare.com/sse"
    url = f"http://127.0.0.1:{MCP_SERVER_PORT}/sse"
    logger.info("MCP Server URL: %s", url)
    return url


# ---------------------------------------------------------------------------
# Build provider instances
# ---------------------------------------------------------------------------

def _build_stt():
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

    def __init__(self, stt, llm, tts) -> None:
        super().__init__(
            instructions=f"{SYSTEM_PROMPT}\n\n{SEARCH_RULES}",
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
        greeting = _build_startup_greeting()
        await self.session.generate_reply(
            instructions=(
                "Chào người dùng dùng nguyên văn câu sau, không thêm bớt ý nào khác: "
                f"'{greeting}'"
            )
        )
        return
        await self.session.generate_reply(
            instructions=(
                "Chào người dùng đúng nguyên văn như sau: "
                "'Sếp còn thức khuya à? Tối nay mình xử lý gì đây?' "
                "Giữ tông điệu hữu ích, điềm tĩnh và hơi khô hài nhẹ."
            )
        )


# ---------------------------------------------------------------------------
# LiveKit entry point
# ---------------------------------------------------------------------------

def _turn_detection() -> str:
    return "stt" if STT_PROVIDER == "sarvam" else "vad"


def _endpointing_delay() -> float:
    return {"sarvam": 0.07, "deepgram": 0.2, "whisper": 0.3}.get(STT_PROVIDER, 0.1)


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

    session = AgentSession(
        turn_detection=_turn_detection(),
        min_endpointing_delay=_endpointing_delay(),
    )

    await session.start(
        agent=FridayAgent(stt=stt, llm=llm, tts=tts),
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
