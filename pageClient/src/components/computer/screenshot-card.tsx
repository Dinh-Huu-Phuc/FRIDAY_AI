"use client"

import type { LucideIcon } from "lucide-react"
import { ImageIcon, Monitor } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ComputerObservation } from "@/lib/types"
import { compactPath, formatTimestamp } from "@/lib/utils"

interface ScreenshotCardProps {
  observation?: ComputerObservation | null
  loading?: boolean
}

export function ScreenshotCard({ observation, loading }: ScreenshotCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>Screenshot / Observation</CardTitle>
        <CardDescription>
          The latest screen preview and metadata captured from the computer agent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1419]">
          {loading ? (
            <div className="flex aspect-video items-center justify-center text-sm text-zinc-400">
              Loading screenshot...
            </div>
          ) : observation?.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={observation.previewUrl}
              alt="Latest observation preview"
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 text-zinc-500">
              <ImageIcon className="size-10" />
              <p className="text-sm">No screenshot available yet</p>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metadata
            label="Screen Size"
            value={
              observation
                ? `${observation.screenWidth} x ${observation.screenHeight}`
                : "Unavailable"
            }
          />
          <Metadata
            label="Active Window"
            value={observation?.activeWindowTitle || "Unavailable"}
            icon={Monitor}
          />
          <Metadata
            label="Screenshot Path"
            value={compactPath(observation?.screenshotPath)}
          />
          <Metadata
            label="Last Updated"
            value={formatTimestamp(observation?.observedAt)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Metadata({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: LucideIcon
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1419] p-3">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
        {Icon ? <Icon className="size-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className="text-sm text-zinc-200">{value}</p>
    </div>
  )
}
