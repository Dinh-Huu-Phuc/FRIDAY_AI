"use client"

import { useCallback, useEffect, useState } from "react"
import * as fridayApiKeyService from "@/services/fridayApiKeyService"

export function useFridayApiKey() {
  const [keyStatus, setKeyStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshKeyStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await fridayApiKeyService.getConnectedKeyStatus()
      setKeyStatus(payload.connected ? payload.key : null)
      return payload.connected ? payload.key : null
    } catch (requestError) {
      setKeyStatus(null)
      setError(requestError.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshKeyStatus()
  }, [refreshKeyStatus])

  const connectKey = useCallback(async (apiKey) => {
    setError(null)
    const payload = await fridayApiKeyService.verifyAndSaveKey(apiKey)
    setKeyStatus(payload.key || payload)
    return payload.key || payload
  }, [])

  const disconnectKey = useCallback(async () => {
    setError(null)
    await fridayApiKeyService.disconnectKey()
    setKeyStatus(null)
  }, [])

  return {
    keyStatus,
    loading,
    error,
    connected: Boolean(keyStatus),
    connectKey,
    disconnectKey,
    refreshKeyStatus,
  }
}
