# FRIDAY Spatial Interaction Engine

The Spatial Interaction Engine is FRIDAY's standalone spatial-control capability. It uses webcam frames, OpenCV, and MediaPipe hand landmarks to classify basic gestures and stream realtime events to pageClient over WebSocket.

## Architecture

- MCP/Agent tools only activate, disable, query, or change spatial mode through the Spatial API. They do not process camera frames or run vision code.
- FastAPI owns camera access, MediaPipe tracking, gesture sessions, and `/api/v1/spatial/ws`.
- Shared spatial capability code lives under `friday/app/spatial`.
- REST adapter code lives under `friday/src/router/v1/spatial`, `friday/src/services/spatial`, and `friday/src/schemas/spatial`.
- pageClient renders the `/spatial` UI, GestureHUD, hand cursor, and Three.js demo scene.

## API

- `POST /api/v1/spatial/start`
- `POST /api/v1/spatial/stop`
- `GET /api/v1/spatial/status`
- `WS /api/v1/spatial/ws`

If the session is not started, the WebSocket emits idle `spatial.gesture` events. Stopping the session releases the webcam.

## Event

```json
{
  "type": "spatial.gesture",
  "session_id": "spatial_local_001",
  "mode": "hand_tracking",
  "gesture": "pinch",
  "hand": "right",
  "confidence": 0.91,
  "position": { "x": 0.52, "y": 0.38, "z": -0.12 },
  "fingers": {
    "thumb": true,
    "index": true,
    "middle": false,
    "ring": false,
    "pinky": false
  },
  "timestamp": 1714800000
}
```
