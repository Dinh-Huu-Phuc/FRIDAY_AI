"use client"

import { useSyncExternalStore } from "react"

import {
  getBackendConnectionState,
  setBackendConnectionState,
  subscribeToBackendConnection,
} from "@/lib/api/backend-connection-store"

export function useBackendConnection() {
  const isConnected = useSyncExternalStore(
    subscribeToBackendConnection,
    getBackendConnectionState,
    () => false
  )

  return {
    isConnected,
    connect: () => setBackendConnectionState(true),
    disconnect: () => setBackendConnectionState(false),
  }
}
