export const usageApi = {
  get: () => fetchJson("/api/friday-platform/usage")
};

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Usage request failed");
  return data;
}
