import { createMockBackendStatus } from "@/lib/mock-data"
import { getBackendConnectionState } from "@/lib/api/backend-connection-store"
import type { ApiResult } from "@/lib/types"

const DEFAULT_TIMEOUT_MS = 6000
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001"
const BACKEND_PROXY_PREFIX = "/api/backend"
const BACKEND_PROBE_PATH = "/api/backend/probe"
const SUPPORTED_BACKEND_PATHS = new Set([
  "/agent/console",
  "/agent/chat",
  "/agent/greeting",
  "/computer/observe",
  "/computer/plan",
  "/computer/execute",
  "/computer/run",
])

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

function buildProxyPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${BACKEND_PROXY_PREFIX}${normalizedPath}`
}

function buildProxyHeaders(headers?: HeadersInit): HeadersInit {
  return {
    ...headers,
    "x-backend-base-url": resolveBaseUrl(),
  }
}

function supportsBackendPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return SUPPORTED_BACKEND_PATHS.has(normalizedPath)
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
  if (!getBackendConnectionState()) {
    return {
      ok: false,
      data: resolveFallback(fallback),
      source: "mock",
      status: 0,
      error: "Backend connection is disconnected. Showing mock data.",
    }
  }

  if (!supportsBackendPath(path)) {
    return {
      ok: false,
      data: resolveFallback(fallback),
      source: "mock",
      status: 0,
      error: `Backend does not expose ${path}. Showing mock data.`,
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(buildProxyPath(path), {
      method,
      headers: buildProxyHeaders({
        "Content-Type": "application/json",
        ...headers,
      }),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      clearTimeout(timeout)
      return {
        ok: false,
        data: resolveFallback(fallback),
        source: "mock",
        status: response.status,
        error: `Request failed with status ${response.status}.`,
      }
    }

    const payload = (await response.json()) as T
    clearTimeout(timeout)

    return {
      ok: true,
      data: payload,
      source: "api",
      status: response.status,
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
  if (!getBackendConnectionState()) {
    return {
      status: "offline" as const,
      label: "Disconnected",
      detail: "Client is disconnected from the backend. UI is rendering safe fallback data.",
      source: "mock" as const,
    }
  }

  return createMockBackendStatus(source)
}

export async function probeBackendConnection(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(BACKEND_PROBE_PATH, {
      method: "GET",
      headers: buildProxyHeaders(),
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeout)
    if (!response.ok) {
      return false
    }

    const payload = (await response.json()) as {
      reachable?: boolean
    }
    return Boolean(payload.reachable)
  } catch {
    clearTimeout(timeout)
    return false
  }
}
