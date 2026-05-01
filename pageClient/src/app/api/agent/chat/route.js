import { NextResponse } from "next/server"
import { createMockChatReply, createMockConsoleSnapshot } from "@/lib/mock-data"
import { backendConfig, backendRequest } from "@/api/backendClient"

const ACCESS_COOKIE = "friday_access_token"
const CONNECTED_KEY_COOKIE = "friday_connected_key"
const FREE_USAGE_COOKIE = "friday_free_usage"
const FREE_LIMIT = 10

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function readFreeUsage(request) {
  const fallback = { date: todayKey(), used: 0 }
  const raw = request.cookies.get(FREE_USAGE_COOKIE)?.value
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw)
    if (parsed.date !== fallback.date) return fallback
    return { date: fallback.date, used: Number(parsed.used || 0) }
  } catch {
    return fallback
  }
}

function setFreeUsage(response, usage) {
  response.cookies.set(FREE_USAGE_COOKIE, JSON.stringify(usage), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 2,
  })
}

function buildFallbackConsoleSnapshot(message, channel) {
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

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const message = String(body.message || "").trim()
  const channel = body.channel || "text"

  if (!message) {
    return NextResponse.json({ message: "Message is required." }, { status: 400 })
  }

  const connectedKey = request.cookies.get(CONNECTED_KEY_COOKIE)?.value
  const hasConnectedKey = Boolean(connectedKey)
  const freeUsage = readFreeUsage(request)

  if (!hasConnectedKey && freeUsage.used >= FREE_LIMIT) {
    return NextResponse.json(
      {
        message:
          "Daily free limit reached. Connect a FRIDAY API Key to continue.",
        code: "FREE_LIMIT_REACHED",
        freeLimit: FREE_LIMIT,
        used: freeUsage.used,
      },
      { status: 429 }
    )
  }

  let snapshot
  try {
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    snapshot = await backendRequest(backendConfig.paths.agentChat, {
      method: "POST",
      token,
      body: { message, channel },
    })
  } catch {
    snapshot = buildFallbackConsoleSnapshot(message, channel)
  }

  const response = NextResponse.json(snapshot)
  if (!hasConnectedKey) {
    setFreeUsage(response, {
      date: freeUsage.date,
      used: Math.min(freeUsage.used + 1, FREE_LIMIT),
    })
  }
  return response
}
