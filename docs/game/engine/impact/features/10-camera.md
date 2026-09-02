# impact.feature.camera — the camera

> **Status**: core · Modules: `impact.feature.camera.camera`,
> `impact.feature.camera.camera-steps`, `impact.feature.camera.plug-in`.
> **The complete reference is `docs/RESEARCH-5-camera.md`** — this page is
> the condensed map.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `camera.camera` | `ig.Camera` (`ig.camera`, GameAddon, `postUpdateOrder: 100`), `PosTarget`, `EntityTarget`, `MultiEntityTarget`, `TargetHandle` | Computes `game.screen`, `game.soundPos`, `system.zoom`+`zoomFocus` every frame |
| `camera.camera-steps` | Steps: `SET_CAMERA_TARGET`, `SET_CAMERA_POS`, `SET_CAMERA_BETWEEN`, `SET_CAMERA_ZOOM`, `RESET_CAMERA`, `UNDO_CAMERA` (event); `FOCUS_CAMERA` (+reset/zoom, action) | Cutscene/combat camera moves |
| `camera.plug-in` | — | Entry point + `cameraInBounds` map attribute registration |

## How it works (condensed)

- **Target stack**: topmost target wins. `TargetHandle` wraps a target +
  `offset` (smoothed `(cur×23+target)/24` — the camera lag) + `zoomOffset` +
  animated `zoom` (KEY_SPLINES).
- Speeds via `pushTarget(handle, speed, transition)`: numeric seconds, or
  strings (`IMMEDIATELY` 1e-6 → `SLOWEST_DREAM` 1.0); string speeds are
  distance-based: `duration = sqrt(dist + 32) × factor`.
- Bounds: map attribute `cameraInBounds` clamps pos to
  `[size/2/boundScale, mapSize − size/2/boundScale]`; the player's handle
  sets `keepZoomFocusAligned` so zoom never shifts the player framing.
- Outputs: `screen = pos − logicalSize/2`; `soundPos` (audio center) is set
  from the *camera*, not the player — that's why NPC voices pan correctly
  ([05-audio.md](../05-audio.md)); `zoomFocus` clamped to the viewport.
- Pixel-perfect: horizontal snap (`Math.round`), z is eased (`smoothZ`),
  `smoothPositioning` off while zoomed.

## Who drives it

- Player: `_updateCameraHandle` pushes EntityTarget each frame (or
  MultiEntityTarget for follow targets), `sc.PLAYER_ZOOM`, charge zoom +
  zoom-blur on level ≥ 2 charge.
- Cutscenes: the event steps above, with `wait` to block until arrival.
- Combat: `FOCUS_CAMERA` (SELF/TARGET/BETWEEN_TARGET/KEEP_TARGET_IN_SCREEN);
  enemy attacks always keep the player framed.
- Puzzle entities (bomb, bounce-switch, compressor…) push local handles
  `"FAST"` around their puzzles.

## Mod pattern

Custom camera behaviors = push a `TargetHandle` over a custom target object
implementing `getPos(out)` (shake, follow modes); named handles persist
across events but drop on level load. Full details in RESEARCH-5 §7.