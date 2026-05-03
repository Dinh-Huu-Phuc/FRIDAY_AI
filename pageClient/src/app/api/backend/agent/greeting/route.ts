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

function buildFallbackGreetingPayload() {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const location = "Da Lat, Vietnam"
  const label =
    hour >= 5 && hour < 11
      ? "bu\u1ed5i s\u00e1ng"
      : hour >= 11 && hour < 13
        ? "bu\u1ed5i tr\u01b0a"
        : hour >= 13 && hour < 18
          ? "bu\u1ed5i chi\u1ec1u"
          : hour >= 18 && hour < 22
            ? "bu\u1ed5i t\u1ed1i"
            : "bu\u1ed5i \u0111\u00eam"

  return {
    message:
      `Ch\u00e0o ${label}, s\u1ebfp. ` +
      `B\u00e2y gi\u1edd l\u00e0 ${hour.toString().padStart(2, "0")} gi\u1edd ${minute.toString().padStart(2, "0")}. ` +
      `M\u00ecnh \u0111ang s\u1eb5n s\u00e0ng \u0111\u1ed3ng h\u00e0nh cho phi\u00ean l\u00e0m vi\u1ec7c n\u00e0y, ` +
      `v\u1edbi ng\u1eef c\u1ea3nh v\u1ecb tr\u00ed hi\u1ec7n t\u1ea1i l\u00e0 ${location}. ` +
      "S\u1ebfp c\u00f3 c\u1ea7n m\u00ecnh b\u00e1o nhanh daily briefing kh\u00f4ng?",
    generated_at: now.toISOString(),
    location,
    weather_summary: null,
    source: "mock" as const,
  }
}

export async function GET(request: NextRequest) {
  const backendBaseUrl = resolveBackendBaseUrl(request)

  try {
    const response = await fetch(`${backendBaseUrl}${API_PREFIX}/agent/greeting`, {
      method: "GET",
      cache: "no-store",
    })

    if (response.ok) {
      const payload = await response.json()
      return NextResponse.json(payload, { status: 200 })
    }
  } catch {
    // Fall back below.
  }

  return NextResponse.json(buildFallbackGreetingPayload(), { status: 200 })
}
