import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const DEFAULT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

function resolveBackendBaseUrl(request: NextRequest) {
  const headerValue = request.headers.get("x-backend-base-url")?.trim()
  const candidate = headerValue || DEFAULT_BACKEND_BASE_URL
  return candidate.replace(/\/$/, "")
}

export async function GET(request: NextRequest) {
  const backendBaseUrl = resolveBackendBaseUrl(request)
  const candidateUrls = [
    `${backendBaseUrl}/computer/observe`,
    `${backendBaseUrl}/computer/plan`,
    `${backendBaseUrl}/computer/run`,
  ]

  for (const candidateUrl of candidateUrls) {
    try {
      const response = await fetch(candidateUrl, {
        method: "GET",
        cache: "no-store",
      })

      if (response.ok || response.status === 405) {
        return NextResponse.json({
          ok: true,
          reachable: true,
          probeUrl: candidateUrl,
          status: response.status,
        })
      }
    } catch {
      continue
    }
  }

  return NextResponse.json(
    {
      ok: false,
      reachable: false,
      message: "Could not reach a supported backend route.",
    },
    { status: 502 }
  )
}
