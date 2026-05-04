"use client"

import { useEffect, useState } from "react"

import { spatialWebSocketUrl } from "@/lib/api/spatial"
import type { SpatialGestureEvent } from "@/lib/spatial-types"

export function useSpatialSocket() {
  const [connected, setConnected] = useState(false)
  const [event, setEvent] = useState<SpatialGestureEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const socket = new WebSocket(spatialWebSocketUrl())

    socket.onopen = () => {
      setConnected(true)
      setError(null)
    }
    socket.onmessage = (message) => {
      try {
        setEvent(JSON.parse(message.data) as SpatialGestureEvent)
      } catch {
        setError("Received malformed spatial event.")
      }
    }
    socket.onerror = () => {
      setError("Spatial WebSocket connection failed.")
    }
    socket.onclose = () => {
      setConnected(false)
    }

    return () => socket.close()
  }, [])

  return { connected, event, error }
}
