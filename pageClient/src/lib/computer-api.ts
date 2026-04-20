import {
  createMockExecution,
  createMockObservation,
  createMockPlannedAction,
} from "@/lib/mock-data"
import { requestJson } from "@/lib/api"
import type {
  ComputerAction,
  ComputerObservation,
  ExecuteResult,
  PlanResult,
  RunCycleResult,
  RuntimeState,
  SafetyMode,
} from "@/lib/types"

export async function observeComputer(goal?: string) {
  return requestJson<{
    ok: boolean
    observation: ComputerObservation
    runtimeContext: RuntimeState
    message: string
  }>({
    path: "/computer/observe",
    method: "POST",
    body: { goal, compress_image: true },
    fallback: () => ({
      ok: true,
      observation: createMockObservation(),
      runtimeContext: createMockPlannedAction(goal).runtimeContext,
      message: "Observation loaded from mock data.",
    }),
  })
}

export async function planComputer(
  goal: string,
  observation?: ComputerObservation,
  runtimeContext?: RuntimeState
) {
  return requestJson<PlanResult>({
    path: "/computer/plan",
    method: "POST",
    body: {
      goal,
      observation: observation
        ? {
            screenshot_path: observation.screenshotPath,
            compressed_screenshot_path: observation.compressedScreenshotPath,
            active_window_title: observation.activeWindowTitle,
            screen_width: observation.screenWidth,
            screen_height: observation.screenHeight,
            observed_at: observation.observedAt,
            notes: observation.notes,
          }
        : undefined,
      runtime_context: runtimeContext
        ? {
            current_goal: runtimeContext.currentGoal,
            current_plan: runtimeContext.currentPlan,
            last_action: runtimeContext.lastAction,
            active_window_title: runtimeContext.activeWindowTitle,
            last_screenshot_path: runtimeContext.lastScreenshotPath,
            screen_width: runtimeContext.screenWidth,
            screen_height: runtimeContext.screenHeight,
            safety_mode: runtimeContext.safetyMode,
          }
        : undefined,
    },
    fallback: () => createMockPlannedAction(goal),
  })
}

export async function executeComputer(action: ComputerAction, safetyMode?: SafetyMode) {
  return requestJson<ExecuteResult>({
    path: "/computer/execute",
    method: "POST",
    body: {
      action: {
        type: action.type,
        description: action.description,
        target: action.target,
        x: action.x,
        y: action.y,
        end_x: action.endX,
        end_y: action.endY,
        button: action.button,
        text: action.text,
        key: action.key,
        keys: action.keys,
        amount: action.amount,
        command: action.command,
        timeout: action.timeout,
        rationale: action.rationale,
      },
      safety_mode: safetyMode,
    },
    fallback: () => createMockExecution(action),
  })
}

export async function runComputerCycle(goal: string, safetyMode?: SafetyMode) {
  return requestJson<RunCycleResult>({
    path: "/computer/run",
    method: "POST",
    body: {
      goal,
      safety_mode: safetyMode,
    },
    fallback: () => {
      const observation = createMockObservation()
      const plan = createMockPlannedAction(goal)
      const execution = createMockExecution(plan.action)
      return {
        ok: true,
        goal,
        observation,
        action: plan.action,
        planningReasoning: plan.reasoning,
        execution,
        runtimeContext: execution.runtimeContext,
        message: "Completed one computer control cycle with mock data.",
      }
    },
  })
}
