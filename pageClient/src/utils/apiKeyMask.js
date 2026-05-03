export function maskApiKey(value) {
  if (!value) return "friday_sk_...hidden"
  if (value.includes("...")) return value
  return `${value.slice(0, 14)}...${value.slice(-4)}`
}

export function normalizeKeyMetadata(data) {
  const quota = data.quota || {}
  return {
    keyId: data.key_id || data.id || data.keyId,
    id: data.id || data.key_id || data.keyId,
    name: data.name || "FRIDAY API Key",
    preview: data.preview || data.key_prefix || maskApiKey(data.api_key || ""),
    scopes: data.scopes || [],
    status: data.status || "active",
    environment: data.environment || "local",
    createdAt: data.created_at || data.createdAt || null,
    lastUsedAt: data.last_used_at || data.lastUsedAt || null,
    ownerUserId: data.owner_user_id || data.ownerUserId || null,
    dailyLimit: quota.daily_limit || data.daily_limit || data.token_limit_daily || null,
    usedToday: quota.used_today || data.used_today || data.token_used_today || 0,
    remaining: quota.remaining || data.remaining || null,
    resetAt: quota.reset_at || data.reset_at || null
  }
}

export function normalizeKeyList(data) {
  const items = Array.isArray(data) ? data : data.items || data.data || []
  return items.map(normalizeKeyMetadata)
}
