export const FREE_LIMIT = 10

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function readFreeUsage() {
  if (typeof window === "undefined") {
    return { date: todayKey(), used: 0, limit: FREE_LIMIT }
  }
  const date = todayKey()
  const raw = window.localStorage.getItem("friday.freeUsage")
  let parsed = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  if (!parsed || parsed.date !== date) {
    return { date, used: 0, limit: FREE_LIMIT }
  }
  return { date, used: Number(parsed.used || 0), limit: FREE_LIMIT }
}

export function writeFreeUsage(used) {
  const next = { date: todayKey(), used, limit: FREE_LIMIT }
  if (typeof window !== "undefined") {
    window.localStorage.setItem("friday.freeUsage", JSON.stringify(next))
  }
  return next
}

export function incrementFreeUsage() {
  const current = readFreeUsage()
  return writeFreeUsage(Math.min(FREE_LIMIT, current.used + 1))
}
