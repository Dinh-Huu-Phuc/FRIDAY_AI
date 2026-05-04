"use client"

import type { SpatialGestureEvent } from "@/lib/spatial-types"

export function useGestureState(event: SpatialGestureEvent | null) {
  return {
    gesture: event?.gesture ?? "idle",
    hand: event?.hand ?? "unknown",
    confidence: event?.confidence ?? 0,
    position: event?.position ?? { x: 0.5, y: 0.5, z: 0 },
    fingers: event?.fingers ?? { thumb: false, index: false, middle: false, ring: false, pinky: false },
  }
}
