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
    error.data = payload
    throw error
  }
  return payload
}

export function searchWindowsApps(query, limit = 8) {
  return request("/api/backend/launcher/apps/search", {
    method: "POST",
    body: JSON.stringify({ query, limit }),
  })
}

export function openWindowsApp({ query, appId, path, minScore = 0.55 }) {
  return request("/api/backend/launcher/apps/open", {
    method: "POST",
    body: JSON.stringify({
      query,
      app_id: appId,
      path,
      min_score: minScore,
    }),
  })
}
