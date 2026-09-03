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

## At a glance

| Task | API / step | Notes |
|---|---|---|
| Follow an entity | `new EntityTarget(entity)` + `pushTarget` | Target position is map space; the camera owns viewport output |
| Focus a point | `SET_CAMERA_POS` or `PosTarget` | Use for cutscenes and scripted framing |
| Frame two actors | `SET_CAMERA_BETWEEN` / `MultiEntityTarget` | `keepFirstTarget` prevents the secondary actor dragging framing away |
| Animate zoom | `TargetHandle.setZoom(zoom, duration, spline)` | Zoom focus is separate from target position |
| Remove a temporary focus | `popTarget` / `removeNamedTarget` | Event/action-attached handles clean themselves up |
| Read camera outputs | `ig.game.screen`, `ig.game.soundPos`, `ig.system.zoom` | `screen` is a map-space viewport origin |

```ts
ig.camera.pushTarget(handle: TargetHandle, speed?: number | CameraSpeed,
  transition?: KeySpline, name?: string): void;
ig.camera.popTarget(speed?: number | CameraSpeed,
  transition?: KeySpline): void;
handle.setOffset(x: number, y: number, duration?: number,
  zoomOffsetX?: number, zoomOffsetY?: number, immediate?: boolean): void;
handle.setZoom(zoom: number, duration?: number, transition?: KeySpline): void;
```

## Guardrails

- Do not write `ig.game.screen` from ordinary gameplay code to implement a
  follow camera; push/replace a target so bounds, zoom, sound position, and
  cleanup remain coherent.
- Do not confuse `ig.game.screen` (map-space viewport origin) with logical
  canvas coordinates or physical backing pixels.
- Do not leave unnamed event/action handles attached after their owner ends;
  use the attachment lifecycle or a named handle with explicit removal.
- Do not bypass camera bounds during map transitions unless the effect is
  intentionally a photo-mode-style override.

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