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
    cache: "no-store",
  })
  const payload = await readJson(response)
  if (!response.ok) {
    const message = payload.detail || payload.message || `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.code = payload.code
    throw error
  }
  return payload
}

export function verifyFridayApiKey(apiKey) {
  return request("/api/friday-key/verify", {
    method: "POST",
    body: JSON.stringify({ api_key: apiKey }),
  })
}

export function getFridayApiKeyStatus() {
  return request("/api/friday-key/status")
}

export function listFridayApiKeys() {
  return request("/api/friday-key/list")
}

export function disconnectFridayApiKey() {
  return request("/api/friday-key/disconnect", { method: "POST" })
}
