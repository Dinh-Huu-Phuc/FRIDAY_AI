export const storageApi = {
  get: () => fetchJson("/api/friday-platform/storage")
};

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Storage request failed");
  return data;
}
