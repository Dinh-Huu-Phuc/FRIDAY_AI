export const authApi = {
  register: (payload) => fetchJson("/api/friday-platform/auth/register", "POST", payload),
  login: (payload) => fetchJson("/api/friday-platform/auth/login", "POST", payload),
  me: () => fetchJson("/api/friday-platform/auth/me"),
  logout: () => fetchJson("/api/friday-platform/auth/logout", "POST"),
  refresh: () => fetchJson("/api/friday-platform/auth/refresh", "POST")
};

async function fetchJson(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.detail || "Auth request failed");
  return data;
}
