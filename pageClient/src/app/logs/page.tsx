"use client"

import { useCallback, useEffect, useState } from "react"

import { PageShell } from "@/components/layout/page-shell"
import { useBackendConnection } from "@/hooks/use-backend-connection"
import { LogsPanel } from "@/components/logs/logs-panel"
import { getLogs } from "@/lib/api/runtime"
import { resolveBackendStatus } from "@/lib/api"
import type { LogEntry } from "@/lib/types"

export default function LogsPage() {
  const { isConnected } = useBackendConnection()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [source, setSource] = useState<"api" | "mock">("mock")
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    const result = await getLogs()
    setLogs(result.data)
    setSource(result.source)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isConnected, loadLogs])

  return (
    <PageShell
      title="Logs"
      description="Terminal-style stream of recent backend and agent events."
      backendStatus={resolveBackendStatus(source)}
      safetyMode="strict"
      busy={loading}
    >
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-sm text-zinc-400">
          Loading logs...
        </div>
      ) : (
        <LogsPanel logs={logs} />
      )}
    </PageShell>
  )
}
