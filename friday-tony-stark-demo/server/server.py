"""
Friday MCP Server entry point.
Run with: python server/server.py
"""

import json

from mcp.server.fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse, Response

from friday.app.facebook.exceptions import (
    FacebookConfigurationError,
    FacebookWebhookSignatureError,
    FacebookWebhookVerificationError,
)
from friday.app.facebook.router.routes import receive_messenger_webhook, verify_webhook_subscription
from friday.app.facebook.schemas.requests import ReceiveWebhookRequest, VerifyWebhookRequest
from friday.config import config
from friday.prompts import register_all_prompts
from friday.resources import register_all_resources
from friday.tools import register_all_tools

# Create the MCP server instance.
mcp = FastMCP(
    name=config.SERVER_NAME,
    instructions=(
        "Ban la Friday, mot tro ly AI phong cach Tony Stark. "
        "Ban co quyen truy cap vao cac cong cu de ho tro nguoi dung. "
        "Hay phan hoi ngan gon, chinh xac, huu ich va uu tien tieng Viet."
    ),
)

# Register tools, prompts, and resources.
register_all_tools(mcp)
register_all_prompts(mcp)
register_all_resources(mcp)


@mcp.custom_route("/facebook/webhook", methods=["GET"], name="facebook-webhook-verify")
async def facebook_webhook_verify(request: Request) -> Response:
    try:
        response = verify_webhook_subscription(
            VerifyWebhookRequest(
                mode=request.query_params.get("hub.mode", ""),
                verify_token=request.query_params.get("hub.verify_token", ""),
                challenge=request.query_params.get("hub.challenge", ""),
            )
        )
    except FacebookWebhookVerificationError as exc:
        return PlainTextResponse(str(exc), status_code=403)
    except FacebookConfigurationError as exc:
        return PlainTextResponse(str(exc), status_code=500)

    return PlainTextResponse(response.challenge, status_code=200)


@mcp.custom_route("/facebook/webhook", methods=["POST"], name="facebook-webhook-ingest")
async def facebook_webhook_ingest(request: Request) -> Response:
    try:
        raw_body = (await request.body()).decode("utf-8")
        payload = json.loads(raw_body or "{}")
        signature = request.headers.get("x-hub-signature-256")
        response = receive_messenger_webhook(
            ReceiveWebhookRequest(
                payload=payload,
                signature=signature,
                raw_body=raw_body,
            )
        )
    except json.JSONDecodeError:
        return JSONResponse({"ok": False, "message": "Invalid JSON payload."}, status_code=400)
    except FacebookWebhookSignatureError as exc:
        return JSONResponse({"ok": False, "message": str(exc)}, status_code=403)
    except FacebookWebhookVerificationError as exc:
        return JSONResponse({"ok": False, "message": str(exc)}, status_code=400)
    except FacebookConfigurationError as exc:
        return JSONResponse({"ok": False, "message": str(exc)}, status_code=500)

    return JSONResponse(
        {
            "ok": response.accepted,
            "stored_event_count": response.stored_event_count,
            "stored_message_count": response.stored_message_count,
            "stored_notification_count": response.stored_notification_count,
            "message": response.message,
        },
        status_code=200,
    )


def main() -> None:
    mcp.run(transport="sse")


if __name__ == "__main__":
    main()
