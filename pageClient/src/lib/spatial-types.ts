export type SpatialPosition = {
  x: number
  y: number
  z: number
}

export type FingerState = {
  thumb: boolean
  index: boolean
  middle: boolean
  ring: boolean
  pinky: boolean
}

export type SpatialGestureEvent = {
  type: "spatial.gesture"
  session_id: string
  mode: string
  gesture: string
  hand: string
  confidence: number
  position: SpatialPosition
  fingers: FingerState
  timestamp: number
}

export type SpatialSessionState = {
  session_id: string
  enabled: boolean
  mode: string
  camera_index: number
  fps: number
  last_gesture?: string | null
  last_error?: string | null
}
