"use client"

import { Play, Square } from "lucide-react"

import type { SpatialSessionState } from "@/lib/spatial-types"

export function SpatialToolbar({
  state,
  loading,
  onStart,
  onStop,
}: {
  state: SpatialSessionState | null
  loading: boolean
  onStart: () => void
  onStop: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-[#10151d] px-4 py-3">
      <div>
        <p className="text-xs uppercase text-zinc-500">Spatial mode</p>
        <p className="text-sm text-zinc-100">{state?.enabled ? state.mode : "disabled"}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={loading || state?.enabled}
          className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="size-4" />
          Start
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={loading || !state?.enabled}
          className="inline-flex items-center gap-2 border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Square className="size-4" />
          Stop
        </button>
      </div>
    </div>
  )
}
