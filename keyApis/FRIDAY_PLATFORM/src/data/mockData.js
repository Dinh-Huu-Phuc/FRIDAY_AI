export const mockUsage = {
  dailyLimit: 1000000,
  usedToday: 184500,
  requestsToday: 428,
  resetTime: "00:00 UTC",
  rateLimitPerMinute: 120,
  tokens7d: [
    { label: "Mon", value: 90000 },
    { label: "Tue", value: 132000 },
    { label: "Wed", value: 118000 },
    { label: "Thu", value: 184500 },
    { label: "Fri", value: 150000 },
    { label: "Sat", value: 82000 },
    { label: "Sun", value: 98000 }
  ],
  requests7d: [
    { label: "Mon", value: 210 },
    { label: "Tue", value: 320 },
    { label: "Wed", value: 280 },
    { label: "Thu", value: 428 },
    { label: "Fri", value: 360 },
    { label: "Sat", value: 170 },
    { label: "Sun", value: 190 }
  ],
  topKeys: [
    { name: "Dashboard Gateway", tokens: 72000 },
    { name: "RAG Worker", tokens: 48000 },
    { name: "Agent Console", tokens: 35500 }
  ]
};

export const mockStorage = {
  totalStorageUsed: 824000000,
  sessionMemorySize: 168000000,
  userMemorySize: 98000000,
  embeddingStorageEstimate: 342000000,
  cachedPromptStorage: 59000000,
  tokenUsageAccumulated: 9380000,
  averageTokensPerRequest: 612,
  growth: [
    { label: "Mon", value: 520 },
    { label: "Tue", value: 610 },
    { label: "Wed", value: 690 },
    { label: "Thu", value: 824 }
  ],
  consumption: [
    { key: "RAG Worker", storage: "342 MB", tokens: 48000, requests: 96 },
    { key: "Agent Console", storage: "198 MB", tokens: 35500, requests: 142 }
  ]
};

export const mockActivity = {
  items: [
    { id: 1, event: "Login success", actor: "system", severity: "success", createdAt: new Date().toISOString() },
    { id: 2, event: "Created API key", actor: "current user", severity: "default", createdAt: new Date().toISOString() },
    { id: 3, event: "Quota warning", actor: "gateway", severity: "warning", createdAt: new Date().toISOString() }
  ]
};
