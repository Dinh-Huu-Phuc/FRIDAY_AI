export const activityApi = {
  list: () => fetchJson("/api/friday-platform/activity")
};

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Activity request failed");
  return data;
}
