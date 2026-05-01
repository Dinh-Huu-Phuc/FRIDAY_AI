export const apiKeysApi = {
  list: () => fetchJson("/api/friday-platform/keys"),
  create: (payload) => fetchJson("/api/friday-platform/keys", "POST", payload),
  rotate: (keyId) => fetchJson(`/api/friday-platform/keys/${keyId}`, "PATCH", { action: "rotate" }),
  revoke: (keyId) => fetchJson(`/api/friday-platform/keys/${keyId}`, "PATCH", { action: "revoke" }),
  delete: (keyId) => fetchJson(`/api/friday-platform/keys/${keyId}`, "DELETE")
};

async function fetchJson(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.detail || "API key request failed");
  return data;
}
