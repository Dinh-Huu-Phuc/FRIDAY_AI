import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const DEFAULT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

function resolveBackendBaseUrl(request: NextRequest) {
  const headerValue = request.headers.get("x-backend-base-url")?.trim()
  const candidate = headerValue || DEFAULT_BACKEND_BASE_URL
  return candidate.replace(/\/$/, "")
}

function buildTargetUrl(request: NextRequest, path: string[]) {
  const backendBaseUrl = resolveBackendBaseUrl(request)
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(`${backendBaseUrl}/${path.join("/")}`)
  targetUrl.search = incomingUrl.search
  return targetUrl
}

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetUrl = buildTargetUrl(request, path)

  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  const accept = request.headers.get("accept")

  if (contentType) {
    headers.set("content-type", contentType)
  }

  if (accept) {
    headers.set("accept", accept)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text()
  }

  try {
    const response = await fetch(targetUrl, init)
    const responseHeaders = new Headers()
    const responseContentType = response.headers.get("content-type")

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType)
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Backend proxy request failed.",
      },
      { status: 502 }
    )
  }
}

export { proxyRequest as GET }
export { proxyRequest as POST }
export { proxyRequest as PUT }
export { proxyRequest as PATCH }
export { proxyRequest as DELETE }
export { proxyRequest as HEAD }
export { proxyRequest as OPTIONS }
