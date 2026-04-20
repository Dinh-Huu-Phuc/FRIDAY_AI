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
  ChatMessage,
  ComputerSnapshot,
  ConsoleSnapshot,
  DashboardSnapshot,
  LogEntry,
  RuntimeState,
  SettingsState,
} from "@/lib/types"

const SETTINGS_STORAGE_KEY = "firday.dashboard.settings"

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
  message: string
): Promise<ApiResult<{ messages: ChatMessage[] }>> {
  return requestJson<{ messages: ChatMessage[] }>({
    path: "/agent/chat",
    method: "POST",
    body: { message },
    fallback: () => ({
      messages: [
        ...createMockConsoleSnapshot("mock").messages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
          status: "sent",
        },
        createMockChatReply(message),
      ],
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
