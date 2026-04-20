import { createMockBackendStatus } from "@/lib/mock-data"
import type { ApiResult } from "@/lib/types"

const DEFAULT_TIMEOUT_MS = 6000
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

function resolveBaseUrl() {
  if (typeof window === "undefined") {
    return API_BASE_URL.replace(/\/$/, "")
  }

  const stored = window.localStorage.getItem("firday.api-base-url")
  const candidate = stored?.trim() || API_BASE_URL
  return candidate.replace(/\/$/, "")
}

function resolveFallback<T>(fallback: T | (() => T)) {
  return typeof fallback === "function"
    ? (fallback as () => T)()
    : fallback
}

export async function requestJson<T>({
  path,
  method = "GET",
  body,
  headers,
  fallback,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  path: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  headers?: HeadersInit
  fallback: T | (() => T)
  timeoutMs?: number
}): Promise<ApiResult<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${resolveBaseUrl()}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    })

    const payload = (await response.json()) as T
    clearTimeout(timeout)

    return {
      ok: response.ok,
      data: payload,
      source: "api",
      status: response.status,
      error: response.ok ? undefined : `Request failed with status ${response.status}.`,
    }
  } catch (error) {
    clearTimeout(timeout)
    return {
      ok: false,
      data: resolveFallback(fallback),
      source: "mock",
      status: 0,
      error:
        error instanceof Error
          ? error.message
          : "Backend unavailable. Showing mock data.",
    }
  }
}

export function resolveBackendStatus(source: "api" | "mock") {
  return createMockBackendStatus(source)
}
