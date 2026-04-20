"use client"

import {
  Activity,
  Bot,
  FolderKanban,
  Monitor,
  Shield,
  TerminalSquare,
} from "lucide-react"

import { StatusCard } from "@/components/dashboard/status-card"
import type { DashboardSnapshot } from "@/lib/types"

interface SummaryGridProps {
  snapshot: DashboardSnapshot
}

export function SummaryGrid({ snapshot }: SummaryGridProps) {
  const runtime = snapshot.runtimeState

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatusCard
        title="Agent Status"
        value={snapshot.agentStatus}
        description="Current assistant availability and readiness."
        icon={Bot}
      />
      <StatusCard
        title="Backend Status"
        value={snapshot.backendStatus.label}
        description={snapshot.backendStatus.detail}
        icon={Activity}
      />
      <StatusCard
        title="Current Goal"
        value={runtime.currentGoal || "No active goal"}
        description="Most recent high-level task assigned to the computer agent."
        icon={FolderKanban}
        tone="info"
      />
      <StatusCard
        title="Active Window"
        value={runtime.activeWindowTitle || "Unavailable"}
        description="Window title captured from the latest observation cycle."
        icon={Monitor}
      />
      <StatusCard
        title="Last Action"
        value={runtime.lastAction?.type || "None"}
        description={runtime.lastAction?.description || "No action has been executed yet."}
        icon={TerminalSquare}
      />
      <StatusCard
        title="Safety Mode"
        value={runtime.safetyMode}
        description="Applied during planning and shell-command validation."
        icon={Shield}
      />
    </div>
  )
}
