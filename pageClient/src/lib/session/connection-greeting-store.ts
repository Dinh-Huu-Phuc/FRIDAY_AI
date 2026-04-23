import type { ConnectionGreeting } from "@/lib/types"

type ConnectionGreetingListener = () => void

let currentGreeting: ConnectionGreeting | null = null

const listeners = new Set<ConnectionGreetingListener>()

export function getConnectionGreetingState() {
  return currentGreeting
}

export function setConnectionGreetingState(nextGreeting: ConnectionGreeting | null) {
  currentGreeting = nextGreeting
  listeners.forEach((listener) => listener())
}

export function clearConnectionGreetingState() {
  setConnectionGreetingState(null)
}

export function subscribeToConnectionGreeting(listener: ConnectionGreetingListener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
