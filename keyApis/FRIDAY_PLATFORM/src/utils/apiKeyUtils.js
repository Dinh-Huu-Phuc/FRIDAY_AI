export function maskApiKey(record) {
  const preview = record.preview || record.key_prefix || record.keyPrefix || "";
  if (!preview) return "friday_sk_...hidden";
  if (preview.includes("...")) return preview;
  return `${preview.slice(0, 14)}...${preview.slice(-4)}`;
}

export function normalizeCreateKeyResponse(data) {
  const secret = data.secret || data.api_key || data.key || "";
  const record = data.record || data.metadata || data.api_key_metadata || {};
  return {
    secret,
    record: normalizeApiKeyRecord(record)
  };
}

export function normalizeApiKeyList(data) {
  const items = Array.isArray(data) ? data : data.items || data.data || [];
  return items.map(normalizeApiKeyRecord);
}

export function normalizeApiKeyRecord(record) {
  return {
    id: record.id,
    name: record.name || "Unnamed key",
    preview: record.preview || maskApiKey(record),
    status: record.status || "active",
    environment: record.environment || "local",
    scopes: record.scopes || [],
    createdAt: record.created_at || record.createdAt || null,
    lastUsedAt: record.last_used_at || record.lastUsedAt || null,
    createdBy: record.created_by || record.owner_user_id || "current user",
    dailyTokenLimit: record.token_limit_daily || record.dailyTokenLimit || null,
    usedToday: record.token_used_today || record.usedToday || 0
  };
}
