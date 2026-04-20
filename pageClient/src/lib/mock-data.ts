import type {
  ActionHistoryItem,
  BackendStatus,
  ChatMessage,
  ComputerAction,
  ComputerObservation,
  ComputerSnapshot,
  ConsoleSnapshot,
  DashboardSnapshot,
  ExecuteResult,
  LogEntry,
  PlanResult,
  RuntimeState,
  SettingsState,
} from "@/lib/types"

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function screenshotPlaceholder(label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <rect width="1200" height="720" fill="#0b0d10"/>
      <rect x="48" y="48" width="1104" height="624" rx="22" fill="#11151a" stroke="#232931"/>
      <rect x="96" y="96" width="1008" height="76" rx="16" fill="#151a20"/>
      <rect x="96" y="212" width="360" height="364" rx="18" fill="#171d24"/>
      <rect x="496" y="212" width="608" height="168" rx="18" fill="#171d24"/>
      <rect x="496" y="408" width="608" height="168" rx="18" fill="#171d24"/>
      <circle cx="128" cy="134" r="8" fill="#4ade80"/>
      <text x="96" y="642" fill="#96a0ae" font-family="monospace" font-size="24">${label}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function deriveRiskLevel(action?: Partial<ComputerAction> | null) {
  const type = action?.type ?? "observe"
  if (type === "shell") return "medium" as const
  if (type === "drag") return "medium" as const
  return "low" as const
}

export function createMockRuntimeState(): RuntimeState {
  return {
    currentGoal: "Open the editor, inspect the current screen, and decide the safest next step.",
    currentPlan: [
      "Observe the current desktop state",
      "Plan exactly one action",
      "Validate safety before execution",
    ],
    lastAction: {
      type: "click",
      description: "Click Visual Studio Code window",
      x: 388,
      y: 192,
      rationale: "The editor was already visible on screen.",
    },
    activeWindowTitle: "Visual Studio Code - FIRDAY Workspace",
    lastScreenshotPath: "C:\\Temp\\friday\\computer\\screen_20260420T221901.png",
    screenWidth: 1920,
    screenHeight: 1080,
    safetyMode: "strict",
  }
}

export function createMockObservation(): ComputerObservation {
  return {
    screenshotPath: "C:\\Temp\\friday\\computer\\screen_20260420T221901.png",
    compressedScreenshotPath: "C:\\Temp\\friday\\computer\\screen_20260420T221901_compressed.jpg",
    previewUrl: screenshotPlaceholder("Latest observation preview"),
    activeWindowTitle: "Visual Studio Code - FIRDAY Workspace",
    screenWidth: 1920,
    screenHeight: 1080,
    observedAt: isoMinutesAgo(2),
    notes: [
      "VS Code is focused",
      "Terminal panel is visible",
      "No destructive prompts detected",
    ],
  }
}

export function createMockPlannedAction(goal?: string): PlanResult {
  const normalizedGoal = goal?.toLowerCase() ?? ""
  let action: ComputerAction = {
    type: "observe",
    description: "Capture a fresh screenshot before acting.",
    rationale: "The goal is still ambiguous, so observation is safest.",
  }

  if (normalizedGoal.includes("type")) {
    action = {
      type: "type",
      description: "Type the requested text into the active input.",
      text: "Run diagnostics for the latest build",
      rationale: "The goal explicitly requests entering text.",
    }
  } else if (normalizedGoal.includes("scroll")) {
    action = {
      type: "scroll",
      description: "Scroll down to reveal the next visible section.",
      amount: -520,
      rationale: "The current task likely needs more content from the page.",
    }
  } else if (normalizedGoal.includes("terminal") || normalizedGoal.includes("shell")) {
    action = {
      type: "shell",
      description: "Run a validated terminal command.",
      command: "git status",
      timeout: 20,
      rationale: "The goal explicitly mentions terminal work.",
    }
  } else if (normalizedGoal.includes("click") || normalizedGoal.includes("open")) {
    action = {
      type: "click",
      description: "Click the visible editor tab.",
      x: 384,
      y: 186,
      target: "Editor tab",
      rationale: "The requested task appears reachable by a single click.",
    }
  }

  const runtimeState = createMockRuntimeState()
  return {
    ok: true,
    goal:
      goal ??
      "Inspect the editor and take one safe action toward the current task.",
    action,
    reasoning:
      "The planner selected a single low-risk step based on the visible screen context and current runtime state.",
    runtimeContext: runtimeState,
    message: "Planned one safe next action.",
    riskLevel: deriveRiskLevel(action),
  }
}

export function createMockExecution(action?: ComputerAction): ExecuteResult {
  const resolvedAction = action ?? createMockPlannedAction().action
  const riskLevel = deriveRiskLevel(resolvedAction)
  return {
    ok: true,
    action: resolvedAction,
    executed: resolvedAction.type !== "observe",
    safety: {
      allowed: true,
      riskLevel,
      reason:
        riskLevel === "medium"
          ? "Action is allowed but should still be monitored."
          : "Action fits the current strict safety policy.",
    },
    result: {
      status: resolvedAction.type === "observe" ? "noop" : "completed",
      latencyMs: 212,
    },
    runtimeContext: {
      ...createMockRuntimeState(),
      lastAction: resolvedAction,
    },
    message: resolvedAction.type === "observe" ? "Observation does not execute input." : "Action executed successfully.",
  }
}

export function createMockActionHistory(): ActionHistoryItem[] {
  return [
    {
      id: "action-1",
      timestamp: isoMinutesAgo(1),
      status: "success",
      action: {
        type: "click",
        description: "Focused the editor tab",
        target: "Editor tab",
        x: 384,
        y: 186,
      },
      message: "Editor was focused and ready.",
      riskLevel: "low",
      details: { window: "Visual Studio Code - FIRDAY Workspace" },
    },
    {
      id: "action-2",
      timestamp: isoMinutesAgo(3),
      status: "success",
      action: {
        type: "observe",
        description: "Captured a new screenshot",
      },
      message: "Observation stored for planning.",
      riskLevel: "low",
      details: { screenshotPath: createMockObservation().screenshotPath },
    },
    {
      id: "action-3",
      timestamp: isoMinutesAgo(7),
      status: "blocked",
      action: {
        type: "shell",
        description: "Attempted to run a shell command",
        command: "Remove-Item -Recurse temp",
      },
      message: "Shell command blocked by strict safety policy.",
      riskLevel: "high",
      details: { blockedReason: "Recursive deletion is blocked." },
    },
    {
      id: "action-4",
      timestamp: isoMinutesAgo(11),
      status: "failed",
      action: {
        type: "drag",
        description: "Tried to drag a selection in the editor",
        x: 622,
        y: 442,
        endX: 712,
        endY: 442,
      },
      message: "Pointer target moved before action completed.",
      riskLevel: "medium",
      details: { retries: 1 },
    },
  ]
}

export function createMockLogs(): LogEntry[] {
  return [
    {
      id: "log-1",
      timestamp: isoMinutesAgo(1),
      level: "info",
      message: "Computer agent completed a single-cycle run in 212ms.",
      source: "computer.service",
    },
    {
      id: "log-2",
      timestamp: isoMinutesAgo(2),
      level: "warn",
      message: "Shell command blocked because safety mode is strict.",
      source: "computer.safety",
    },
    {
      id: "log-3",
      timestamp: isoMinutesAgo(5),
      level: "info",
      message: "Runtime context refreshed from backend snapshot.",
      source: "runtime.api",
    },
    {
      id: "log-4",
      timestamp: isoMinutesAgo(9),
      level: "debug",
      message: "Planner selected a click action after observation update.",
      source: "computer.planner",
    },
    {
      id: "log-5",
      timestamp: isoMinutesAgo(13),
      level: "error",
      message: "Previous drag action failed due to stale coordinates.",
      source: "computer.executor",
    },
  ]
}

export function createMockMessages(): ChatMessage[] {
  return [
    {
      id: "msg-1",
      role: "assistant",
      content: "FIRDAY dashboard online. Backend is reachable, and computer safety mode is strict.",
      timestamp: isoMinutesAgo(20),
      status: "received",
    },
    {
      id: "msg-2",
      role: "user",
      content: "Observe the current screen and tell me the safest next step.",
      timestamp: isoMinutesAgo(14),
      status: "sent",
    },
    {
      id: "msg-3",
      role: "assistant",
      content: "Observation complete. VS Code is focused, terminal is visible, and the safest next step is a single click on the active editor tab.",
      timestamp: isoMinutesAgo(13),
      status: "received",
    },
    {
      id: "msg-4",
      role: "user",
      content: "Run one cycle for the current task.",
      timestamp: isoMinutesAgo(2),
      status: "sent",
    },
    {
      id: "msg-5",
      role: "assistant",
      content: "Cycle complete. One click action executed successfully and runtime context has been updated.",
      timestamp: isoMinutesAgo(1),
      status: "received",
    },
  ]
}

export function createMockBackendStatus(
  source: "api" | "mock" = "mock"
): BackendStatus {
  return {
    status: source === "api" ? "connected" : "mock",
    label: source === "api" ? "Connected" : "Mock Data",
    detail:
      source === "api"
        ? "Live backend responses are active."
        : "Backend unavailable. UI is rendering safe fallback data.",
    source,
  }
}

export function createMockDashboardSnapshot(
  source: "api" | "mock" = "mock"
): DashboardSnapshot {
  return {
    agentStatus: "ready",
    backendStatus: createMockBackendStatus(source),
    runtimeState: createMockRuntimeState(),
    latestObservation: createMockObservation(),
    latestPlan: createMockPlannedAction(),
    latestExecution: createMockExecution(),
    recentActions: createMockActionHistory(),
    recentLogs: createMockLogs(),
  }
}

export function createMockConsoleSnapshot(
  source: "api" | "mock" = "mock"
): ConsoleSnapshot {
  return {
    messages: createMockMessages(),
    runtimeState: createMockRuntimeState(),
    latestPlan: createMockPlannedAction(),
    latestExecution: createMockExecution(),
    backendStatus: createMockBackendStatus(source),
  }
}

export function createMockComputerSnapshot(
  source: "api" | "mock" = "mock"
): ComputerSnapshot {
  return {
    runtimeState: createMockRuntimeState(),
    latestObservation: createMockObservation(),
    latestPlan: createMockPlannedAction(),
    latestExecution: createMockExecution(),
    actionHistory: createMockActionHistory(),
    backendStatus: createMockBackendStatus(source),
  }
}

export function createMockSettings(): SettingsState {
  return {
    backendBaseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    autoRefresh: true,
    refreshIntervalMs: 8000,
    showSafetyMode: true,
    screenshotPolling: true,
  }
}

export function createMockChatReply(input: string): ChatMessage {
  return {
    id: `reply-${Date.now()}`,
    role: "assistant",
    content: `Received command: "${input}". FIRDAY would observe the screen, plan one safe step, validate it, and report the result here.`,
    timestamp: new Date().toISOString(),
    status: "received",
  }
}
