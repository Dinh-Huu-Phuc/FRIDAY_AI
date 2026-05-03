import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const DEFAULT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001"
const API_PREFIX = "/api/v1"

function resolveBackendBaseUrl(request: NextRequest) {
  const headerValue = request.headers.get("x-backend-base-url")?.trim()
  const candidate = headerValue || DEFAULT_BACKEND_BASE_URL
  return candidate.replace(/\/$/, "")
}

async function readPayload(request: NextRequest) {
  try {
    return (await request.json()) as {
      text?: string
      provider?: "auto" | "openai" | "sarvam" | "google" | "deepgram"
    }
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const backendBaseUrl = resolveBackendBaseUrl(request)
  const payload = await readPayload(request)
  const text = String(payload.text ?? "").trim()
  const provider = payload.provider ?? "auto"

  if (!text) {
    return NextResponse.json({ ok: false, message: "TTS text must not be empty." }, { status: 400 })
  }

  try {
    const response = await fetch(`${backendBaseUrl}${API_PREFIX}/agent/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, provider }),
      cache: "no-store",
    })

    if (!response.ok) {
      const message = await response.text()
      return NextResponse.json({ ok: false, message }, { status: response.status })
    }

    const audio = await response.arrayBuffer()
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "audio/wav",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to reach backend TTS.",
      },
      { status: 502 }
    )
  }
}
