import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { createMockChatReply, createMockConsoleSnapshot } from "@/lib/mock-data"
import type { ChatChannel, ConsoleSnapshot } from "@/lib/types"

const DEFAULT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

function resolveBackendBaseUrl(request: NextRequest) {
  const headerValue = request.headers.get("x-backend-base-url")?.trim()
  const candidate = headerValue || DEFAULT_BACKEND_BASE_URL
  return candidate.replace(/\/$/, "")
}

async function readPayload(request: NextRequest) {
  try {
    return (await request.json()) as {
      message?: string
      channel?: ChatChannel
    }
  } catch {
    return {}
  }
}

function buildFallbackConsoleSnapshot(message: string, channel: ChatChannel): ConsoleSnapshot {
  const fallbackSnapshot = createMockConsoleSnapshot("mock")

  return {
    ...fallbackSnapshot,
    messages: [
      ...fallbackSnapshot.messages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        channel,
        status: "sent",
      },
      createMockChatReply(message, channel),
    ],
  }
}

export async function POST(request: NextRequest) {
  const backendBaseUrl = resolveBackendBaseUrl(request)
  const payload = await readPayload(request)
  const message = String(payload.message ?? "").trim()
  const channel = payload.channel ?? "text"

  try {
    const response = await fetch(`${backendBaseUrl}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, channel }),
      cache: "no-store",
    })

    if (response.ok) {
      const responsePayload = await response.json()
      return NextResponse.json(responsePayload, { status: 200 })
    }
  } catch {
    // Fall back below.
  }

  return NextResponse.json(buildFallbackConsoleSnapshot(message, channel), {
    status: 200,
  })
}
