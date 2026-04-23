"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ActionHistoryCard } from "@/components/computer/action-history-card"
import { CommandCard } from "@/components/computer/command-card"
import { PlannedActionCard } from "@/components/computer/planned-action-card"
import { RuntimeMiniCard } from "@/components/computer/runtime-mini-card"
import { ScreenshotCard } from "@/components/computer/screenshot-card"
import { PageShell } from "@/components/layout/page-shell"
import { useBackendConnection } from "@/hooks/use-backend-connection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveBackendStatus } from "@/lib/api"
import {
  executeComputer,
  observeComputer,
  planComputer,
  runComputerCycle,
} from "@/lib/api/computer"
import { getComputerSnapshot } from "@/lib/api/runtime"
import {
  createMockActionHistory,
} from "@/lib/mock-data"
import type { ActionHistoryItem, ComputerSnapshot, ExecuteResult, PlanResult } from "@/lib/types"

type LoadingAction = "observe" | "plan" | "execute" | "run" | null

export default function ComputerPage() {
  const { isConnected } = useBackendConnection()
  const [snapshot, setSnapshot] = useState<ComputerSnapshot | null>(null)
  const [goal, setGoal] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const consumedActionRef = useRef<string | null>(null)

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    const result = await getComputerSnapshot()
    setSnapshot(result.data)
    setGoal(result.data.runtimeState.currentGoal)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSnapshot()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isConnected, loadSnapshot])

  const actionHistory = useMemo(
    () => snapshot?.actionHistory ?? createMockActionHistory(),
    [snapshot]
  )

  const pushHistory = useCallback((execution: ExecuteResult, plan?: PlanResult) => {
    setSnapshot((current) => {
      if (!current) return current

      const newItem: ActionHistoryItem = {
        id: `history-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: execution.executed ? "success" : execution.safety.allowed ? "pending" : "blocked",
        action: execution.action,
        message: execution.message || plan?.reasoning || "Execution updated.",
        riskLevel: execution.safety.riskLevel,
        details: execution.result,
      }

      return {
        ...current,
        actionHistory: [newItem, ...current.actionHistory].slice(0, 10),
      }
    })
  }, [])

  const handleObserve = useCallback(async () => {
    setLoadingAction("observe")
    setInlineError(null)

    const result = await observeComputer(goal)
    setSnapshot((current) =>
      current
        ? {
            ...current,
            latestObservation: result.data.observation,
            runtimeState: result.data.runtimeContext,
          }
        : current
    )

    setLoadingAction(null)
  }, [goal])

  const handlePlan = useCallback(async () => {
    if (!goal.trim() || !snapshot) return

    setLoadingAction("plan")
    setInlineError(null)

    const result = await planComputer(
      goal,
      snapshot.latestObservation ?? undefined,
      snapshot.runtimeState
    )

    setSnapshot((current) =>
      current
        ? {
            ...current,
            latestPlan: result.data,
            runtimeState: result.data.runtimeContext,
          }
        : current
    )

    setLoadingAction(null)
  }, [goal, snapshot])

  const handleExecute = useCallback(async () => {
    if (!snapshot?.latestPlan?.action) {
      setInlineError("Plan an action before executing.")
      return
    }

    setLoadingAction("execute")
    setInlineError(null)

    const result = await executeComputer(
      snapshot.latestPlan.action,
      snapshot.runtimeState.safetyMode
    )

    pushHistory(result.data, snapshot.latestPlan)

    setSnapshot((current) =>
      current
        ? {
            ...current,
            latestExecution: result.data,
            runtimeState: result.data.runtimeContext,
          }
        : current
    )

    setLoadingAction(null)
  }, [pushHistory, snapshot])

  const handleRun = useCallback(async () => {
    if (!goal.trim()) return

    setLoadingAction("run")
    setInlineError(null)

    const result = await runComputerCycle(goal, snapshot?.runtimeState.safetyMode)
    pushHistory(result.data.execution)

    setSnapshot((current) =>
      current
        ? {
            ...current,
            latestObservation: result.data.observation,
            latestPlan: {
              ok: true,
              goal: result.data.goal,
              action: result.data.action,
              reasoning: result.data.planningReasoning,
              runtimeContext: result.data.runtimeContext,
              message: result.data.message,
              riskLevel: result.data.execution.safety.riskLevel,
            },
            latestExecution: result.data.execution,
            runtimeState: result.data.runtimeContext,
          }
        : current
    )

    setLoadingAction(null)
  }, [goal, pushHistory, snapshot?.runtimeState.safetyMode])

  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get("action")
    if (!action || loading || !snapshot) return
    if (consumedActionRef.current === action) return

    consumedActionRef.current = action

    const timer = window.setTimeout(() => {
      if (action === "observe") {
        void handleObserve()
        return
      }
      if (action === "plan") {
        void handlePlan()
        return
      }
      if (action === "run") {
        void handleRun()
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [handleObserve, handlePlan, handleRun, loading, snapshot])

  if (loading || !snapshot) {
    return (
      <PageShell
        title="Computer Control"
        description="Monitor and drive the computer-use loop for FIRDAY."
        backendStatus={{ status: "mock", label: "Loading", detail: "Fetching computer state...", source: "mock" }}
        safetyMode="strict"
        busy
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-sm text-zinc-400">
          Loading computer control page...
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Computer Control"
      description="Observe the screen, plan one safe next step, execute it, and monitor the result history."
      backendStatus={resolveBackendStatus(snapshot.backendStatus.source)}
      safetyMode={snapshot.runtimeState.safetyMode}
      busy={loadingAction !== null}
      onObserve={handleObserve}
      onPlan={handlePlan}
    >
      <div className="space-y-6">
        {inlineError ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {inlineError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <CommandCard
              goal={goal}
              onGoalChange={setGoal}
              onObserve={handleObserve}
              onPlan={handlePlan}
              onExecute={handleExecute}
              onRunCycle={handleRun}
              loadingAction={loadingAction}
            />
            <ScreenshotCard
              observation={snapshot.latestObservation}
              loading={loadingAction === "observe"}
            />
          </div>

          <div className="space-y-6">
            <RuntimeMiniCard runtime={snapshot.runtimeState} />
            <PlannedActionCard plan={snapshot.latestPlan} />
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Latest Execution</CardTitle>
                <CardDescription>
                  Detailed result payload from the executor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#0f1419] p-4 text-xs leading-6 text-zinc-300">
                  {JSON.stringify(snapshot.latestExecution ?? {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>

        <ActionHistoryCard history={actionHistory} />
      </div>
    </PageShell>
  )
}
