export const backendConfig = {
  baseUrl: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001",
  paths: {
    register: process.env.BACKEND_REGISTER_PATH || "/api/v1/auth/register",
    login: process.env.BACKEND_LOGIN_PATH || "/api/v1/auth/login",
    me: process.env.BACKEND_ME_PATH || "/api/v1/auth/me",
    logout: process.env.BACKEND_LOGOUT_PATH || "/api/v1/auth/logout",
    refresh: process.env.BACKEND_REFRESH_PATH || "/api/v1/auth/refresh",
    apiKeys: process.env.BACKEND_API_KEYS_PATH || "/api/v1/api-keys",
    verifyKey: process.env.BACKEND_API_KEY_VERIFY_PATH || "/api/v1/api-keys/verify",
    agentChat: process.env.BACKEND_AGENT_CHAT_PATH || "/api/v1/agent/chat"
  }
}

export async function backendRequest(path, { method = "GET", token, body, headers = {}, includeResponse = false } = {}) {
  const response = await fetch(`${backendConfig.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({ message: response.statusText }))
  if (!response.ok) {
    const error = new Error(data.detail || data.message || "Backend request failed.")
    error.status = response.status
    error.data = data
    throw error
  }
  if (includeResponse) {
    return { data, response }
  }
  return data
}

export function jsonError(error, fallbackStatus = 500) {
  return Response.json(
    { ok: false, message: error.message || "Request failed.", code: error.code || undefined, details: error.data || null },
    { status: error.status || fallbackStatus }
  )
}
