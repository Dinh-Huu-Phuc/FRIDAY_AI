export function maskApiKey(value) {
  if (!value) return "friday_sk_...hidden"
  if (value.includes("...")) return value
  return `${value.slice(0, 14)}...${value.slice(-4)}`
}

export function normalizeKeyMetadata(data) {
  const quota = data.quota || {}
  return {
    keyId: data.key_id || data.id || data.keyId,
    preview: data.preview || data.key_prefix || maskApiKey(data.api_key || ""),
    scopes: data.scopes || [],
    status: data.status || "active",
    dailyLimit: quota.daily_limit || data.daily_limit || data.token_limit_daily || null,
    usedToday: quota.used_today || data.used_today || data.token_used_today || 0,
    remaining: quota.remaining || data.remaining || null,
    resetAt: quota.reset_at || data.reset_at || null
  }
}
