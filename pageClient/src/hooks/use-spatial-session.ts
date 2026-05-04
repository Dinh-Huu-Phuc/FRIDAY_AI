"use client"

import { useCallback, useEffect, useState } from "react"

import { getSpatialStatus, startSpatialSession, stopSpatialSession } from "@/lib/api/spatial"
import type { SpatialSessionState } from "@/lib/spatial-types"

export function useSpatialSession() {
  const [state, setState] = useState<SpatialSessionState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const next = await getSpatialStatus()
      setState(next)
      setError(null)
      return next
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to read spatial status.")
      return null
    }
  }, [])

  const start = useCallback(async () => {
    setLoading(true)
    try {
      const next = await startSpatialSession()
      setState(next)
      setError(null)
      return next
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start spatial mode.")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const stop = useCallback(async () => {
    setLoading(true)
    try {
      const next = await stopSpatialSession()
      setState(next)
      setError(null)
      return next
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to stop spatial mode.")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  return { state, loading, error, refresh, start, stop }
}
