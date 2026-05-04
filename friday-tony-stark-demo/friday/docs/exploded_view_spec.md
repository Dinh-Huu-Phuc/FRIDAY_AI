# Exploded View Spec

Exploded view is the planned 3D model interaction layer for Spatial Control. The MVP ships the data shape and frontend scaffold, while the realtime demo uses a single cube.

## Model Parts

`pageClient/public/models/spatial/demo/demo-parts.json` describes model parts:

- `modelId`: frontend model identifier.
- `parts`: list of controllable model pieces.
- `meshName`: mesh name in a future GLTF scene.
- `explodeDirection`: normalized direction vector.
- `explodeDistance`: distance multiplier for the exploded animation.

## Roadmap

- Load GLTF assets by `modelId`.
- Map `two_hand_expand` to exploded-view progress.
- Map `rotate` to object rotation.
- Allow MCP tools to request `load_spatial_model`, `trigger_exploded_view`, and `reset_spatial_scene` through runtime/API commands without touching camera logic.
