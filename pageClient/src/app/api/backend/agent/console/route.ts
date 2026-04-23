import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { createMockConsoleSnapshot } from "@/lib/mock-data"

const DEFAULT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

function resolveBackendBaseUrl(request: NextRequest) {
  const headerValue = request.headers.get("x-backend-base-url")?.trim()
  const candidate = headerValue || DEFAULT_BACKEND_BASE_URL
  return candidate.replace(/\/$/, "")
}

export async function GET(request: NextRequest) {
  const backendBaseUrl = resolveBackendBaseUrl(request)

  try {
    const response = await fetch(`${backendBaseUrl}/agent/console`, {
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

  return NextResponse.json(createMockConsoleSnapshot("mock"), { status: 200 })
}
