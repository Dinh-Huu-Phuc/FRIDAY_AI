"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RuntimeState } from "@/lib/types"
import { compactPath, titleCase } from "@/lib/utils"

interface RuntimeStateCardProps {
  runtime: RuntimeState
}

export function RuntimeStateCard({ runtime }: RuntimeStateCardProps) {
  const rows = [
    ["Current Goal", runtime.currentGoal || "No active goal"],
    ["Current Plan", runtime.currentPlan.join(" → ") || "No plan available"],
    ["Active Window", runtime.activeWindowTitle || "Unavailable"],
    ["Last Screenshot Path", compactPath(runtime.lastScreenshotPath, 70)],
    ["Screen Width", String(runtime.screenWidth || 0)],
    ["Screen Height", String(runtime.screenHeight || 0)],
    ["Safety Mode", titleCase(runtime.safetyMode)],
  ]

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>Runtime State</CardTitle>
        <CardDescription>
          Structured state for the current FIRDAY computer-control session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-[#0f1419] p-4"
            >
              <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {label}
              </p>
              <p className="text-sm leading-6 text-zinc-200">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1419] p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Last Action
          </p>
          <pre className="overflow-x-auto text-xs leading-6 text-zinc-300">
            {JSON.stringify(runtime.lastAction ?? {}, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
