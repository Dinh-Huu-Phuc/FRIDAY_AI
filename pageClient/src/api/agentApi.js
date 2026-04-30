async function readJson(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export async function sendAgentChat(payload) {
  const response = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  })
  const data = await readJson(response)
  if (!response.ok) {
    const error = new Error(data.detail || data.message || "Agent request failed.")
    error.status = response.status
    error.code = data.code
    throw error
  }
  return data
}
