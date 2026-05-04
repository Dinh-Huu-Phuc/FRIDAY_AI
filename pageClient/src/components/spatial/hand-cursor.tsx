"use client"

import type { SpatialGestureEvent } from "@/lib/spatial-types"

export function HandCursor({ event }: { event: SpatialGestureEvent | null }) {
  const x = `${(event?.position.x ?? 0.5) * 100}%`
  const y = `${(event?.position.y ?? 0.5) * 100}%`
  const active = event?.gesture === "pinch" || event?.gesture === "grab"

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className={`absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
          active ? "border-emerald-300 bg-emerald-300/20" : "border-sky-300 bg-sky-300/10"
        }`}
        style={{ left: x, top: y }}
      />
    </div>
  )
}
