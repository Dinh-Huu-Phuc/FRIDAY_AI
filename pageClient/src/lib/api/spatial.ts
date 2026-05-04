import type { SpatialSessionState } from "@/lib/spatial-types"

const API_PROXY_PREFIX = "/api/backend/spatial"
const DEFAULT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001"

async function requestSpatial<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_PROXY_PREFIX}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload?.detail || payload?.message || `Spatial request failed with status ${response.status}`
    throw new Error(message)
  }
  return payload as T
}

export function startSpatialSession(mode = "hand_tracking") {
  return requestSpatial<SpatialSessionState>("/start", {
    method: "POST",
    body: JSON.stringify({ mode }),
  })
}

export function stopSpatialSession() {
  return requestSpatial<SpatialSessionState>("/stop", { method: "POST" })
}

export function getSpatialStatus() {
  return requestSpatial<SpatialSessionState>("/status")
}

export function spatialWebSocketUrl() {
  const baseUrl = DEFAULT_BACKEND_BASE_URL.replace(/\/$/, "")
  const url = new URL("/api/v1/spatial/ws", baseUrl)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  return url.toString()
}
