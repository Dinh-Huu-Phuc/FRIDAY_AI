"use client"

import { useCallback, useEffect, useState } from "react"
import * as authService from "@/services/authService"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshMe = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await authService.getCurrentUser()
      setUser(payload.user || payload)
      return payload.user || payload
    } catch (requestError) {
      setUser(null)
      setError(requestError.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const login = useCallback(async (payload) => {
    setError(null)
    const response = await authService.login(payload)
    setUser(response.user || null)
    return response
  }, [])

  const register = useCallback(async (payload) => {
    setError(null)
    const response = await authService.register(payload)
    if (response.access_token || response.user) {
      setUser(response.user || null)
    }
    return response
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    await authService.logout()
    setUser(null)
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshMe,
  }
}
