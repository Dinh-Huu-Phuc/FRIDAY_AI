"use client"

import { useCallback, useState } from "react"
import * as agentChatService from "@/services/agentChatService"

export function useAgentChat() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const send = useCallback(async (message, channel = "text") => {
    setLoading(true)
    setError(null)
    try {
      return await agentChatService.sendMessage(message, channel)
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error }
}
