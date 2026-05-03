"use client"

import { useCallback, useEffect, useState } from "react"
import { Clock3, ListChecks, Logs, MonitorPlay } from "lucide-react"

import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { SummaryGrid } from "@/components/dashboard/summary-grid"
import { PageShell } from "@/components/layout/page-shell"
import { Badge } from "@/components/ui/badge"
import { useBackendConnection } from "@/hooks/use-backend-connection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveBackendStatus } from "@/lib/api"
import { getDashboardSnapshot } from "@/lib/api/runtime"
import type { DashboardSnapshot } from "@/lib/types"
import { badgeTone, cn, compactPath, formatTimestamp, riskTone, statusTone, titleCase } from "@/lib/utils"

export default function DashboardPage() {
  const { isConnected } = useBackendConnection()
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    const result = await getDashboardSnapshot()
    setSnapshot(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSnapshot()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isConnected, loadSnapshot])

  if (loading || !snapshot) {
    return (
      <PageShell
        title="Dashboard"
        description="Overall system visibility for FIRDAY and the computer control agent."
        backendStatus={{ status: "mock", label: "Loading", detail: "Fetching dashboard snapshot...", source: "mock" }}
        safetyMode="strict"
        busy
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-sm text-zinc-400">
          Loading dashboard snapshot...
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Dashboard"
      description="Overall system visibility for FIRDAY and the computer control agent."
      backendStatus={resolveBackendStatus(snapshot.backendStatus.source)}
      safetyMode={snapshot.runtimeState.safetyMode}
    >
      <div className="space-y-6">
        <DashboardHero />

        <SummaryGrid snapshot={snapshot} />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Recent Actions</CardTitle>
              <CardDescription>Latest execution outcomes in chronological order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.recentActions.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0f1419] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {titleCase(item.action.type)} - {item.action.description}
                    </p>
                    <p className="text-xs text-zinc-500">{formatTimestamp(item.timestamp)}</p>
                    <p className="text-sm text-zinc-400">{item.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn("border", badgeTone(statusTone(item.status)))}>
                      {titleCase(item.status)}
                    </Badge>
                    <Badge className={cn("border", badgeTone(riskTone(item.riskLevel)))}>
                      {titleCase(item.riskLevel)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Latest Screenshot Preview</CardTitle>
                <CardDescription>Most recent observation returned by the backend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1419]">
                  {snapshot.latestObservation?.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={snapshot.latestObservation.previewUrl}
                      alt="Latest observation"
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-sm text-zinc-500">
                      No screenshot available
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniStat
                    icon={MonitorPlay}
                    label="Window"
                    value={snapshot.latestObservation?.activeWindowTitle || "Unavailable"}
                  />
                  <MiniStat
                    icon={Clock3}
                    label="Updated"
                    value={formatTimestamp(snapshot.latestObservation?.observedAt)}
                  />
                  <MiniStat
                    icon={ListChecks}
                    label="Path"
                    value={compactPath(snapshot.latestObservation?.screenshotPath)}
                  />
                  <MiniStat
                    icon={Logs}
                    label="Notes"
                    value={String(snapshot.latestObservation?.notes.length ?? 0)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
                <CardDescription>Latest backend and agent events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {snapshot.recentLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/10 bg-[#0f1419] p-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                      <span>{log.source}</span>
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <p className="text-sm text-zinc-200">{log.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1419] p-3">
      <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <p className="text-sm text-zinc-200">{value}</p>
    </div>
  )
}
