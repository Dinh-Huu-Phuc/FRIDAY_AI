import {
  createMockChatReply,
  createMockComputerSnapshot,
  createMockConsoleSnapshot,
  createMockDashboardSnapshot,
  createMockLogs,
  createMockRuntimeState,
  createMockSettings,
} from "@/lib/mock-data"
import { requestJson, resolveBackendStatus } from "@/lib/api"
import type {
  ActionHistoryItem,
  ApiResult,
  ChatChannel,
  ComputerSnapshot,
  ConnectionGreeting,
  ConsoleSnapshot,
  DashboardSnapshot,
  LogEntry,
  RuntimeState,
  SettingsState,
} from "@/lib/types"

const SETTINGS_STORAGE_KEY = "firday.dashboard.settings"

interface BackendConnectionGreetingPayload {
  message: string
  generated_at: string
  location: string
  weather_summary?: string | null
  source: "api" | "mock"
}

function resolveGreetingLabel(hour: number) {
  if (hour >= 5 && hour < 11) return "bu\u1ed5i s\u00e1ng"
  if (hour >= 11 && hour < 13) return "bu\u1ed5i tr\u01b0a"
  if (hour >= 13 && hour < 18) return "bu\u1ed5i chi\u1ec1u"
  if (hour >= 18 && hour < 22) return "bu\u1ed5i t\u1ed1i"
  return "bu\u1ed5i \u0111\u00eam"
}

function createFallbackConnectionGreeting(): ConnectionGreeting {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const location = "Da Lat, Vietnam"

  return {
    message:
      `Ch\u00e0o ${resolveGreetingLabel(hour)}, s\u1ebfp. ` +
      `B\u00e2y gi\u1edd l\u00e0 ${hour.toString().padStart(2, "0")} gi\u1edd ${minute.toString().padStart(2, "0")}. ` +
      `M\u00ecnh \u0111ang s\u1eb5n s\u00e0ng \u0111\u1ed3ng h\u00e0nh cho phi\u00ean l\u00e0m vi\u1ec7c n\u00e0y, ` +
      `v\u1edbi ng\u1eef c\u1ea3nh v\u1ecb tr\u00ed hi\u1ec7n t\u1ea1i l\u00e0 ${location}. ` +
      "S\u1ebfp c\u00f3 c\u1ea7n m\u00ecnh b\u00e1o nhanh daily briefing kh\u00f4ng?",
    generatedAt: now.toISOString(),
    location,
    weatherSummary: null,
    source: "mock",
  }
}

export async function getDashboardSnapshot() {
  const result = await requestJson<DashboardSnapshot>({
    path: "/runtime/dashboard",
    fallback: () => createMockDashboardSnapshot("mock"),
  })

  return {
    ...result,
    data: {
      ...result.data,
      backendStatus: resolveBackendStatus(result.source),
    },
  }
}

export async function getConsoleSnapshot() {
  const result = await requestJson<ConsoleSnapshot>({
    path: "/agent/console",
    fallback: () => createMockConsoleSnapshot("mock"),
  })

  return {
    ...result,
    data: {
      ...result.data,
      backendStatus: resolveBackendStatus(result.source),
    },
  }
}

export async function getConnectionGreeting(): Promise<ApiResult<ConnectionGreeting>> {
  const result = await requestJson<BackendConnectionGreetingPayload>({
    path: "/agent/greeting",
    fallback: () => {
      const fallback = createFallbackConnectionGreeting()
      return {
        message: fallback.message,
        generated_at: fallback.generatedAt,
        location: fallback.location,
        weather_summary: fallback.weatherSummary,
        source: fallback.source,
      }
    },
  })

  return {
    ...result,
    data: {
      message: result.data.message,
      generatedAt: result.data.generated_at,
      location: result.data.location,
      weatherSummary: result.data.weather_summary ?? null,
      source: result.data.source,
    },
  }
}

export async function getRuntimeState() {
  return requestJson<RuntimeState>({
    path: "/runtime/state",
    fallback: () => createMockRuntimeState(),
  })
}

export async function getLogs() {
  return requestJson<LogEntry[]>({
    path: "/runtime/logs",
    fallback: () => createMockLogs(),
  })
}

export async function getRecentActions() {
  const fallback = createMockComputerSnapshot("mock").actionHistory
  return requestJson<ActionHistoryItem[]>({
    path: "/runtime/actions",
    fallback,
  })
}

export async function getComputerSnapshot() {
  const result = await requestJson<ComputerSnapshot>({
    path: "/computer/state",
    fallback: () => createMockComputerSnapshot("mock"),
  })

  return {
    ...result,
    data: {
      ...result.data,
      backendStatus: resolveBackendStatus(result.source),
    },
  }
}

export async function sendAgentMessage(
  message: string,
  channel: ChatChannel = "text"
): Promise<ApiResult<ConsoleSnapshot>> {
  const fallbackSnapshot = createMockConsoleSnapshot("mock")

  return requestJson<ConsoleSnapshot>({
    path: "/agent/chat",
    method: "POST",
    body: { message, channel },
    fallback: () => ({
      ...fallbackSnapshot,
      messages: [
        ...fallbackSnapshot.messages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
          channel,
          status: "sent",
        },
        createMockChatReply(message, channel),
      ],
      backendStatus: resolveBackendStatus("mock"),
    }),
  })
}

export function loadSettings(): SettingsState {
  if (typeof window === "undefined") {
    return createMockSettings()
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      return createMockSettings()
    }
    return {
      ...createMockSettings(),
      ...(JSON.parse(raw) as Partial<SettingsState>),
    }
  } catch {
    return createMockSettings()
  }
}

export function saveSettings(settings: SettingsState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  window.localStorage.setItem("firday.api-base-url", settings.backendBaseUrl)
}
