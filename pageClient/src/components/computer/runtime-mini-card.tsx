"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RuntimeState } from "@/lib/types"
import { compactPath, titleCase } from "@/lib/utils"

interface RuntimeMiniCardProps {
  runtime: RuntimeState
}

export function RuntimeMiniCard({ runtime }: RuntimeMiniCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>Runtime Snapshot</CardTitle>
        <CardDescription>
          Current context the computer agent is using.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row label="Goal" value={runtime.currentGoal || "No active goal"} />
        <Row label="Safety Mode" value={titleCase(runtime.safetyMode)} />
        <Row label="Active Window" value={runtime.activeWindowTitle || "Unavailable"} />
        <Row label="Last Screenshot" value={compactPath(runtime.lastScreenshotPath)} />
        <Row label="Resolution" value={`${runtime.screenWidth} × ${runtime.screenHeight}`} />
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1419] p-3">
      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="text-zinc-200">{value}</p>
    </div>
  )
}
