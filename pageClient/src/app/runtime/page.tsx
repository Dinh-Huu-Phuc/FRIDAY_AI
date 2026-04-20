"use client"

import { useCallback, useEffect, useState } from "react"

import { RuntimeStateCard } from "@/components/runtime/runtime-state-card"
import { PageShell } from "@/components/layout/page-shell"
import { getRuntimeState } from "@/lib/runtime-api"
import { resolveBackendStatus } from "@/lib/api"
import type { RuntimeState } from "@/lib/types"

export default function RuntimePage() {
  const [runtime, setRuntime] = useState<RuntimeState | null>(null)
  const [source, setSource] = useState<"api" | "mock">("mock")
  const [loading, setLoading] = useState(true)

  const loadRuntime = useCallback(async () => {
    setLoading(true)
    const result = await getRuntimeState()
    setRuntime(result.data)
    setSource(result.source)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRuntime()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadRuntime])

  if (loading || !runtime) {
    return (
      <PageShell
        title="Runtime State"
        description="Inspect the live runtime context used by the FIRDAY agent."
        backendStatus={resolveBackendStatus("mock")}
        safetyMode="strict"
        busy
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-sm text-zinc-400">
          Loading runtime state...
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Runtime State"
      description="Inspect the live runtime context used by the FIRDAY agent."
      backendStatus={resolveBackendStatus(source)}
      safetyMode={runtime.safetyMode}
    >
      <RuntimeStateCard runtime={runtime} />
    </PageShell>
  )
}
