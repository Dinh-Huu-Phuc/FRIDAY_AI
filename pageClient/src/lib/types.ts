export type BackendConnectionStatus = "connected" | "degraded" | "offline" | "mock"
export type SafetyMode = "strict" | "moderate" | "off"
export type ActionStatus = "success" | "blocked" | "failed" | "pending"
export type LogLevel = "debug" | "info" | "warn" | "error"
export type MessageRole = "user" | "assistant" | "system"
export type ChatChannel = "text" | "voice"
export type ActionType =
  | "click"
  | "double_click"
  | "right_click"
  | "type"
  | "press"
  | "hotkey"
  | "scroll"
  | "drag"
  | "shell"
  | "observe"

export interface RuntimeState {
  currentGoal: string
  currentPlan: string[]
  lastAction?: Partial<ComputerAction> | null
  activeWindowTitle: string
  lastScreenshotPath: string
  screenWidth: number
  screenHeight: number
  safetyMode: SafetyMode
}

export interface ComputerObservation {
  screenshotPath: string
  compressedScreenshotPath?: string | null
  previewUrl?: string | null
  activeWindowTitle: string
  screenWidth: number
  screenHeight: number
  observedAt: string
  notes: string[]
}

export interface ComputerAction {
  type: ActionType
  description: string
  target?: string | null
  x?: number | null
  y?: number | null
  endX?: number | null
  endY?: number | null
  button?: string
  text?: string | null
  key?: string | null
  keys?: string[]
  amount?: number | null
  command?: string | null
  timeout?: number
  rationale?: string
}

export interface SafetyCheck {
  allowed: boolean
  riskLevel: "low" | "medium" | "high" | "critical"
  reason: string
}

export interface PlanResult {
  ok: boolean
  goal: string
  action: ComputerAction
  reasoning: string
  runtimeContext: RuntimeState
  message: string
  riskLevel?: SafetyCheck["riskLevel"]
}

export interface ExecuteResult {
  ok: boolean
  action: ComputerAction
  executed: boolean
  safety: SafetyCheck
  result: Record<string, unknown>
  runtimeContext: RuntimeState
  message: string
}

export interface RunCycleResult {
  ok: boolean
  goal: string
  observation: ComputerObservation
  action: ComputerAction
  planningReasoning: string
  execution: ExecuteResult
  runtimeContext: RuntimeState
  message: string
}

export interface ActionHistoryItem {
  id: string
  timestamp: string
  status: ActionStatus
  action: ComputerAction
  message: string
  riskLevel: SafetyCheck["riskLevel"]
  details?: Record<string, unknown>
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  source: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  channel?: ChatChannel
  status?: "sent" | "received" | "pending" | "error"
}

export interface BackendStatus {
  status: BackendConnectionStatus
  label: string
  detail: string
  source: "api" | "mock"
}

export interface DashboardSnapshot {
  agentStatus: "ready" | "busy" | "idle" | "error"
  backendStatus: BackendStatus
  runtimeState: RuntimeState
  latestObservation?: ComputerObservation | null
  latestPlan?: PlanResult | null
  latestExecution?: ExecuteResult | null
  recentActions: ActionHistoryItem[]
  recentLogs: LogEntry[]
}

export interface ConsoleSnapshot {
  messages: ChatMessage[]
  runtimeState: RuntimeState
  latestPlan?: PlanResult | null
  latestExecution?: ExecuteResult | null
  backendStatus: BackendStatus
}

export interface ConnectionGreeting {
  message: string
  generatedAt: string
  location: string
  weatherSummary?: string | null
  source: "api" | "mock"
}

export interface ComputerSnapshot {
  runtimeState: RuntimeState
  latestObservation?: ComputerObservation | null
  latestPlan?: PlanResult | null
  latestExecution?: ExecuteResult | null
  actionHistory: ActionHistoryItem[]
  backendStatus: BackendStatus
}

export interface SettingsState {
  backendBaseUrl: string
  autoRefresh: boolean
  refreshIntervalMs: number
  showSafetyMode: boolean
  screenshotPolling: boolean
}

export interface ApiResult<T> {
  ok: boolean
  data: T
  source: "api" | "mock"
  status: number
  error?: string
}
