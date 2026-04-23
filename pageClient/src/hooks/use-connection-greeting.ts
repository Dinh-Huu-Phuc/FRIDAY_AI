"use client"

import { useSyncExternalStore } from "react"

import {
  clearConnectionGreetingState,
  getConnectionGreetingState,
  setConnectionGreetingState,
  subscribeToConnectionGreeting,
} from "@/lib/session/connection-greeting-store"
import type { ConnectionGreeting } from "@/lib/types"

export function useConnectionGreeting() {
  const greeting = useSyncExternalStore(
    subscribeToConnectionGreeting,
    getConnectionGreetingState,
    () => null
  )

  return {
    greeting,
    setGreeting: (nextGreeting: ConnectionGreeting | null) =>
      setConnectionGreetingState(nextGreeting),
    clearGreeting: () => clearConnectionGreetingState(),
  }
}
