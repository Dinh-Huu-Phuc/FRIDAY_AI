"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, Shield, Wifi, WifiOff, Wand2 } from "lucide-react"

import { useBackendConnection } from "@/hooks/use-backend-connection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { probeBackendConnection } from "@/lib/api"
import { getConnectionGreeting } from "@/lib/api/runtime"
import { clearConnectionGreetingState, setConnectionGreetingState } from "@/lib/session/connection-greeting-store"
import type { BackendStatus, SafetyMode } from "@/lib/types"
import { badgeTone, cn, statusTone, titleCase } from "@/lib/utils"

interface QuickActions {
  onObserve?: () => void
  onPlan?: () => void
}

interface AppHeaderProps extends QuickActions {
  title: string
  description?: string
  backendStatus: BackendStatus
  safetyMode: SafetyMode
  busy?: boolean
  showConnectionToggle?: boolean
}

export function AppHeader({
  title,
  description,
  backendStatus,
  safetyMode,
  busy,
  showConnectionToggle = true,
  onObserve,
  onPlan,
}: AppHeaderProps) {
  const router = useRouter()
  const { isConnected, connect, disconnect } = useBackendConnection()
  const [connectionBusy, setConnectionBusy] = useState(false)

  const goToComputer = (action: string) => {
    router.push(`/computer?action=${action}`)
  }

  async function handleConnectionToggle() {
    if (isConnected) {
      disconnect()
      clearConnectionGreetingState()
      return
    }

    setConnectionBusy(true)
    try {
      const canConnect = await probeBackendConnection()

      if (canConnect) {
        connect()
        const greetingResult = await getConnectionGreeting()
        setConnectionGreetingState(greetingResult.data)
      }
    } finally {
      setConnectionBusy(false)
    }
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
            {showConnectionToggle ? (
              <Button
                variant={isConnected ? "destructive" : "default"}
                disabled={connectionBusy}
                onClick={handleConnectionToggle}
              >
                {isConnected ? <WifiOff /> : <Wifi />}
                {connectionBusy ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
