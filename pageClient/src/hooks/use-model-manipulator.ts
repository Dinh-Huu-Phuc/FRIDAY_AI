"use client"

import { useMemo } from "react"

import type { SpatialGestureEvent } from "@/lib/spatial-types"

export function useModelManipulator(event: SpatialGestureEvent | null) {
  return useMemo(() => {
    const gesture = event?.gesture ?? "idle"
    return {
      selected: gesture === "pinch",
      holding: gesture === "grab",
      resetSignal: gesture === "open_palm" ? event?.timestamp ?? 0 : 0,
      position: event?.position ?? { x: 0.5, y: 0.5, z: 0 },
    }
  }, [event])
}
