"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  FREE_LIMIT,
  incrementFreeUsage,
  readFreeUsage,
  writeFreeUsage,
} from "@/utils/usageLimitUtils"

export function useFreeUsageLimit() {
  const [usage, setUsage] = useState(() => ({
    used: 0,
    limit: FREE_LIMIT,
    date: "",
  }))

  const reload = useCallback(() => {
    setUsage(readFreeUsage())
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const recordFreeUse = useCallback(() => {
    const nextUsage = incrementFreeUsage()
    setUsage(nextUsage)
    return nextUsage
  }, [])

  const resetFreeUsage = useCallback(() => {
    const nextUsage = writeFreeUsage(0)
    setUsage(nextUsage)
    return nextUsage
  }, [])

  const remaining = useMemo(
    () => Math.max(usage.limit - usage.used, 0),
    [usage.limit, usage.used]
  )

  return {
    freeUsedToday: usage.used,
    freeLimit: usage.limit,
    remainingFree: remaining,
    resetDate: usage.date,
    isFreeLimitReached: remaining <= 0,
    recordFreeUse,
    resetFreeUsage,
    reload,
  }
}
