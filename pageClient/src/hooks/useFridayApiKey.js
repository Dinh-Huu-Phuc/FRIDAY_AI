"use client"

import { useCallback, useEffect, useState } from "react"
import * as fridayApiKeyService from "@/services/fridayApiKeyService"

export function useFridayApiKey() {
  const [keyStatus, setKeyStatus] = useState(null)
  const [savedKeys, setSavedKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshSavedKeys = useCallback(async () => {
    try {
      const payload = await fridayApiKeyService.listKeys()
      const items = payload.items || []
      setSavedKeys(items)
      return items
    } catch {
      setSavedKeys([])
      return []
    }
  }, [])

  const refreshKeyStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [payload] = await Promise.all([
        fridayApiKeyService.getConnectedKeyStatus(),
        refreshSavedKeys(),
      ])
      setKeyStatus(payload.connected ? payload.key : null)
      return payload.connected ? payload.key : null
    } catch (requestError) {
      setKeyStatus(null)
      setError(requestError.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [refreshSavedKeys])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshKeyStatus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [refreshKeyStatus])

  const connectKey = useCallback(async (apiKey) => {
    setError(null)
    const payload = await fridayApiKeyService.verifyAndSaveKey(apiKey)
    setKeyStatus(payload.key || payload)
    await refreshSavedKeys()
    return payload.key || payload
  }, [refreshSavedKeys])

  const disconnectKey = useCallback(async () => {
    setError(null)
    await fridayApiKeyService.disconnectKey()
    setKeyStatus(null)
  }, [])

  return {
    keyStatus,
    savedKeys,
    loading,
    error,
    connected: Boolean(keyStatus),
    connectKey,
    disconnectKey,
    refreshKeyStatus,
    refreshSavedKeys,
  }
}
