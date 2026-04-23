type BackendConnectionListener = () => void

let backendConnected = false

const listeners = new Set<BackendConnectionListener>()

export function getBackendConnectionState() {
  return backendConnected
}

export function setBackendConnectionState(nextState: boolean) {
  if (backendConnected === nextState) {
    return
  }

  backendConnected = nextState
  listeners.forEach((listener) => listener())
}

export function subscribeToBackendConnection(listener: BackendConnectionListener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
