export const platformNavigation = [
  { id: "overview", label: "Overview", public: true },
  { id: "api-keys", label: "API Keys", protected: true },
  { id: "usage", label: "Usage & Quota", protected: true },
  { id: "storage", label: "Storage & Memory", protected: true },
  { id: "activity", label: "Activity Logs", protected: true },
  { id: "docs", label: "Developer Docs", public: true }
];

export const protectedTabs = new Set(platformNavigation.filter((item) => item.protected).map((item) => item.id));

export const tabCopy = {
  overview: ["Overview", "Public gateway overview, security model, and integration path."],
  "api-keys": ["API Keys", "Create, rotate, revoke, and audit FRIDAY internal keys."],
  usage: ["Usage & Quota", "Track daily tokens, requests, reset time, and top consumers."],
  storage: ["Storage & Memory", "Inspect memory, embeddings, cached prompt, and growth analytics."],
  activity: ["Activity Logs", "Review security events and gateway operations."],
  docs: ["Developer Docs", "Integration patterns for FRIDAY internal gateway keys."]
};
