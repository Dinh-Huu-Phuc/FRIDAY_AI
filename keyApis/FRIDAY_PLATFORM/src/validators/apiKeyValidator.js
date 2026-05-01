const allowedScopes = new Set(["agent:chat", "agent:tts", "memory:read", "memory:write", "storage:read", "rag:query", "runtime:read"]);

export function validateAllowedOrigins(origins) {
  if (!origins) return true;
  return origins.split("\n").every((origin) => !origin.trim() || origin.trim().startsWith("http"));
}

export function validateScopes(scopes) {
  return Array.isArray(scopes) && scopes.every((scope) => allowedScopes.has(scope));
}

export function validateDailyLimit(value) {
  return Number(value) > 0;
}

export function validateCreateApiKeyForm(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = "Key name is required.";
  if (!validateDailyLimit(values.token_limit_daily)) errors.token_limit_daily = "Daily token limit must be positive.";
  if (!validateAllowedOrigins(values.allowed_origins)) errors.allowed_origins = "Origins must be valid http(s) URLs.";
  if (!validateScopes(values.scopes)) errors.scopes = "Invalid permission selected.";
  return { ok: Object.keys(errors).length === 0, errors };
}
