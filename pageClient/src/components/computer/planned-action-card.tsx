"use client"

import type { LucideIcon } from "lucide-react"
import { AlertTriangle, Crosshair, FileCode2, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlanResult } from "@/lib/types"
import { badgeTone, cn, riskTone, titleCase } from "@/lib/utils"

interface PlannedActionCardProps {
  plan?: PlanResult | null
}

export function PlannedActionCard({ plan }: PlannedActionCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>Planned Action</CardTitle>
        <CardDescription>
          Structured next step returned by the planner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!plan ? (
          <EmptyState text="No planning result yet. Trigger Plan or Run Cycle to populate this card." />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border", badgeTone(riskTone(plan.riskLevel)))}>
                <Shield className="mr-1 size-3.5" />
                {titleCase(plan.riskLevel ?? "low")} Risk
              </Badge>
              <Badge className="border border-white/10 bg-white/5 text-zinc-300">
                {titleCase(plan.action.type)}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Action Type" value={titleCase(plan.action.type)} icon={FileCode2} />
              <Field label="Target" value={plan.action.target || "Not specified"} />
              <Field label="Coordinates" value={formatCoordinates(plan.action)} icon={Crosshair} />
              <Field label="Command" value={plan.action.command || "Not applicable"} />
            </div>

            <Field label="Reason" value={plan.reasoning || plan.action.rationale || "No reasoning provided"} icon={AlertTriangle} block />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  icon: Icon,
  block,
}: {
  label: string
  value: string
  icon?: LucideIcon
  block?: boolean
}) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-[#0f1419] p-3", block && "sm:col-span-2")}>
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
        {Icon ? <Icon className="size-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className="text-sm leading-6 text-zinc-200">{value}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-sm text-zinc-400">{text}</p>
}

function formatCoordinates(action: PlanResult["action"]) {
  if (action.x == null || action.y == null) {
    return "Not specified"
  }
  if (action.endX != null && action.endY != null) {
    return `(${action.x}, ${action.y}) → (${action.endX}, ${action.endY})`
  }
  return `(${action.x}, ${action.y})`
}
