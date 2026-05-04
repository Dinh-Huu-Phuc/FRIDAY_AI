# Spatial Gesture Spec

The MVP gesture engine classifies one primary hand per frame.

## Gestures

- `open_palm`: most fingers are extended. Default action: `cancel_or_stop`.
- `pinch`: thumb tip and index tip are close. Default action: `select_or_grab`.
- `grab`: most fingers are folded. Default action: `hold_object`.
- `swipe_left`: future motion gesture. Default action: `previous_panel`.
- `swipe_right`: future motion gesture. Default action: `next_panel`.
- `rotate`: future pose/motion gesture. Default action: `rotate_object`.
- `two_hand_expand`: future two-hand gesture. Default action: `explode_model`.
- `reset`: future explicit reset gesture. Default action: `reset_scene`.

## Notes

Coordinates are normalized to `0..1` for `x` and `y`. Depth `z` is passed through from MediaPipe landmarks. Confidence is heuristic in the MVP and will improve as more temporal smoothing is added.
