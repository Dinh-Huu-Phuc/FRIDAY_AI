"use client"

import type { SpatialGestureEvent } from "@/lib/spatial-types"

function formatNumber(value: number) {
  return value.toFixed(2)
}

export function GestureHUD({
  connected,
  event,
  error,
}: {
  connected: boolean
  event: SpatialGestureEvent | null
  error?: string | null
}) {
  const fingers = event?.fingers

  return (
    <section className="border border-white/10 bg-[#10151d] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">Gesture HUD</h2>
        <span className={connected ? "text-xs text-emerald-300" : "text-xs text-zinc-500"}>
          {connected ? "connected" : "offline"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-300">
        <div className="flex justify-between">
          <span className="text-zinc-500">Gesture</span>
          <span className="font-medium text-zinc-50">{event?.gesture ?? "idle"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Hand</span>
          <span>{event?.hand ?? "unknown"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Confidence</span>
          <span>{formatNumber(event?.confidence ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Position</span>
          <span>
            {formatNumber(event?.position.x ?? 0.5)}, {formatNumber(event?.position.y ?? 0.5)},{" "}
            {formatNumber(event?.position.z ?? 0)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[11px] text-zinc-400">
        {(["thumb", "index", "middle", "ring", "pinky"] as const).map((finger) => (
          <div key={finger} className="border border-white/10 bg-white/[0.03] px-2 py-2">
            <div className={fingers?.[finger] ? "text-emerald-300" : "text-zinc-600"}>
              {fingers?.[finger] ? "on" : "off"}
            </div>
            <div>{finger}</div>
          </div>
        ))}
      </div>

      {error ? <p className="mt-4 text-xs text-amber-300">{error}</p> : null}
    </section>
  )
}
