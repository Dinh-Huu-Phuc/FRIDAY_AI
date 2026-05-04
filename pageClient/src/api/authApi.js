async function readJson(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "same-origin",
    cache: "no-store",
  })
  const payload = await readJson(response)
  if (!response.ok) {
    const message = payload.detail || payload.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return payload
}

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function me() {
  return request("/api/auth/me")
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" })
}

export function refresh() {
  return request("/api/auth/refresh", { method: "POST" })
}
