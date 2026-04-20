"use client"

import { useRouter } from "next/navigation"
import { Eye, Play, Shield, Square, Wand2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BackendStatus, SafetyMode } from "@/lib/types"
import { badgeTone, cn, statusTone, titleCase } from "@/lib/utils"

interface QuickActions {
  onObserve?: () => void
  onPlan?: () => void
  onRun?: () => void
  onStop?: () => void
}

interface AppHeaderProps extends QuickActions {
  title: string
  description?: string
  backendStatus: BackendStatus
  safetyMode: SafetyMode
  busy?: boolean
  showStop?: boolean
}

export function AppHeader({
  title,
  description,
  backendStatus,
  safetyMode,
  busy,
  showStop = true,
  onObserve,
  onPlan,
  onRun,
  onStop,
}: AppHeaderProps) {
  const router = useRouter()

  const goToComputer = (action: string) => {
    router.push(`/computer?action=${action}`)
  }

  return (
    <header className="border-b border-white/10 bg-[#0f1318]/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-zinc-400">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "border px-2.5 py-1 text-xs font-medium",
                badgeTone(statusTone(backendStatus.status))
              )}
            >
              {backendStatus.label}
            </Badge>
            <Badge
              className={cn(
                "border px-2.5 py-1 text-xs font-medium",
                badgeTone(statusTone(safetyMode))
              )}
            >
              <Shield className="mr-1 size-3.5" />
              {titleCase(safetyMode)}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={onObserve ?? (() => goToComputer("observe"))}
            >
              <Eye />
              Observe
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={onPlan ?? (() => goToComputer("plan"))}
            >
              <Wand2 />
              Plan
            </Button>
            <Button disabled={busy} onClick={onRun ?? (() => goToComputer("run"))}>
              <Play />
              Run
            </Button>
            {showStop ? (
              <Button
                variant="destructive"
                disabled={!onStop || busy}
                onClick={onStop}
              >
                <Square />
                Stop
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
