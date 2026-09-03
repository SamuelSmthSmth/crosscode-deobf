# DOC 5 — Camera: how CrossCode positions, moves & frames content

> Source: `deobf/clean/impact.feature.camera.camera.js` (489 lines),
> `impact.feature.camera.camera-steps.js` (645 lines),
> `impact.feature.camera.plug-in.js`, plus the downstream consumers:
> `impact.base.system.js` (zoom transform), `impact.base.game.js` (draw loop),
> `impact.base.renderer.js` (culling), `game.feature.player.entities.player.js`
> (player camera handle), `game.feature.npc.entities.npc-entity.js` (NPC focus).
> Companion to `docs/RESEARCH-1-architecture-rendu-audio.md`.
>
> Normative vocabulary, hook ordering, and implementation guardrails live in
> the [agent reference](game/agent-reference.md); this file is the detailed
> camera investigation.

---

## 1. The camera is a game addon, not a renderer

`ig.Camera` (`ig.camera`) extends `ig.GameAddon` and does all of its work in
**`onPostUpdate`** (`postUpdateOrder: 100`) — after all entities update, before
`draw()` runs. The camera never draws anything itself; it computes three
outputs that everything else reads:

```
ig.game.screen.x / .y      → world viewport origin (map coords)
ig.game.soundPos.x / .y    → audio listening center (map coords)
ig.system.zoom + zoomFocus → the Canvas2D translate/scale transform
```

So "how the game renders content and objects" is really: **the camera computes
a viewport; maps, entities, and effects all read that viewport and draw
themselves relative to it.**

## 2. The camera stack

The camera holds a **stack of targets** (`ig.camera.targets`). The topmost
(last) target wins; pushing/popping drives every camera move in the game.

### 2.1 Target types (`ig.Camera.*Target`)

| Target | Behavior |
|---|---|
| `PosTarget` | Fixed map position — cutscene locks, NPC focus |
| `EntityTarget` | Follows one entity. X/Y snap: `Math.round(coll.pos.x) + size.x/2` (pixel-snapped, no subpixel jitter). **Z is smoothed** via `smoothZ` when the entity jumps or is z-pushed — vertical camera motion eases (`_currentZ += Δ × tick × 7`, snap when \|Δ\| ≤ 1) while horizontal motion snaps |
| `MultiEntityTarget` | Averages positions of several entities (party follow). With `keepFirstTarget`, the average is clamped to **±200 x / ±100 y of the first entity** so followers can't drag the camera away. Z comes from the first entity + `cameraZFocus`; floating entities contribute averaged z offset |

Both entity targets subtract `Constants.BALL_HEIGHT` from y — a constant
vertical framing offset reserving headroom above actors (for the ball).

### 2.2 `TargetHandle` — offsets, zoom offsets, smoothing

Each stack entry is a `TargetHandle` wrapping a target plus:

- `offset` — positional offset **smoothed exponentially** each frame:
  `current = (current × 23 + target) / 24` — this is the camera "lag" feel.
- `zoomOffset` — a *separate* offset applied only to the zoom focus point, so
  the camera center and the zoom center can diverge.
- `setOffset(x, y, duration, zoomOffsetX, zoomOffsetY, immediate)` — animates
  offsets with `EASE_IN_OUT` over `duration`, or snaps when `immediate`.
- `setZoom(zoom, duration, keyspline)` — animated zoom; `getZoom()` interpolates
  `oldZoom → targetZoom` through the optional `KEY_SPLINES` function.
- `keepZoomFocusAligned` — flag that changes bounds behavior (§4.2). The
  player's handle sets it true.
- `setZoomFocus()` on the handle is a no-op stub.
- Lifecycle: `onEventEndDetach` / `onActionEndDetach` call
  `removeTarget(this, "FAST")` — unnamed handles auto-remove when their
  event/action ends.

### 2.3 Controlling movement: push / pop / replace

```js
ig.camera.pushTarget(handle, speed, transition, name)
ig.camera.popTarget(speed, transition)
ig.camera.replaceTarget(oldHandle, newHandle, speed, transition)
ig.camera.removeNamedTarget(name, speed, transition)
```

- **`speed`** is seconds (number) or a string from `ig.Camera.SPEED_OPTIONS`:

  | Speed | Factor | | Speed | Factor |
  |---|---|---|---|---|
  | `IMMEDIATELY` | 1e-6 | | `FASTER` | 0.0375 |
  | `FASTESTEST` | 0.0175 | | `FAST` | 0.05 |
  | `FASTEST` | 0.025 | | `NORMAL` | 0.1 |
  | `SLOW` | 0.15 | | `SLOWER` | 0.2 |
  | `SLOWEST` | 0.3 | | `SLOWESTEST` | 0.5 |
  | `SLOWEST_DREAM` | 1.0 | | | |

  String speeds are **distance-based**: duration =
  `sqrt(distance_to_target + 32) × factor`. Example: a 100px move at NORMAL
  → `sqrt(132) × 0.1 ≈ 1.15 s`. Farther moves take longer; the +32 is a floor
  so tiny moves still animate. `SLOWEST_DREAM` is for dream sequences.
- **`transition`** is a `KEY_SPLINES` function (default `EASE_IN_OUT`).
- **Named targets** (`name` arg) persist across events until explicitly removed
  or until level load (`onLevelLoadStart` drops all named targets and re-reads
  the map's `cameraInBounds` attribute).
- `pushTarget`/`popTarget` with duration 0 (speed 0/undefined) call
  `_applyFinalState()` — an instant snap with no interpolation.
- `replaceTarget` splices in place; if the replaced handle was the active
  (top) target, `retarget()` re-times the transition from the saved last pos.
- `_saveLastPos()` snapshots current pos/zoom/zoomPos before every move so
  transitions always lerp from where the camera actually is.

## 3. Viewport computation each frame (`onPostUpdate`)

```
for each target: target.update()
_time += actualTick
progress = _time / _duration → _transitionFunction(progress)
_currentZoom = top target's getZoom()   (spline-interpolated mid-transition)
ig.system.setZoom(_currentZoom)
newPos = _getNewPos(posVec, soundPosVec, zoomPosVec)
  transitioning? → lerp _lastPos → newPos into _currentPos / soundPos / zoomPos
                   and _limitPos(_currentPos, _currentZoomPos)   (bounds, §4)
  done?          → snap _currentPos/_currentZoomPos to the computed values
ig.game.screen.x = _currentPos.x − ig.system.width / 2
ig.game.screen.y = _currentPos.y − ig.system.height / 2
ig.game.soundPos = soundPosVec
ig.system.setZoomFocus(zoomPos − screen)      (clamped to [0, width]×[0, height])
```

Note the subtlety in `_getNewPos`: `soundPos` is filled from the camera pos
**before** bounds clamping, and `zoomPos` is overwritten to the clamped pos
**unless** `keepZoomFocusAligned` is set — in which case the zoom focus keeps
its offset-derived value and the position clamp uses unscaled half-widths (§4.2).

## 4. Bounds & framing

### 4.1 `cameraInBounds` + `_limitPos`

The map attribute `cameraInBounds` (set in Weltmeister, registered in
`camera.plug-in.js`, read at `onLevelLoadStart`) enables clamping:

```
pos.x ∈ [width/2/boundScale,  mapSize.x − width/2/boundScale]
pos.y ∈ [height/2/boundScale, mapSize.y − height/2/boundScale]
```

`_limitPos(pos, zoomPos, adjustZoomPos)` also runs a **second-stage zoom-focus
correction** during transitions: when the position clamp moves the camera, it
computes the zoom focus's relative position (`zoomRatioX/Y`), the zoomed
viewport overflow (`widthDiff = screenWidth − screenWidth/zoom`), and shifts
`zoomPos` by the minimum of (overflow, focus shift) — so the zoomed-in focus
point stays on screen even at map edges.

Maps **smaller than the viewport** clamp both edges to the same value → the
map is effectively centered (relevant for widescreen on tiny maps).

### 4.2 `keepZoomFocusAligned`

With `boundScale = keepZoomFocusAligned ? 1 : ig.system.zoom`:
- Default (`boundScale = zoom`): when zoomed in, the camera may approach edges
  more closely (`width/2/zoom < width/2`) — the clamp tracks the zoomed view.
- `keepZoomFocusAligned = true` (the **player's** handle): the clamp ignores
  zoom (`boundScale = 1`), and the zoom focus keeps its offset value — the
  player stays framed consistently even while zoomed.

### 4.3 Zoom transform & coordinate spaces

`startZoomedDraw()` applies, on the shared 2D context:

```
ctx.translate(zoomFocus.x, zoomFocus.y); ctx.scale(zoom, zoom);
ctx.translate(−zoomFocus.x, −zoomFocus.y)
```

`ig.system` provides the two-way mapping everything else uses:

```
getScreenFromMapPos(out, mapX, mapY):  (map − screen − zoomFocus) × zoom + zoomFocus
getMapFromScreenPos(out, x, y):        exact inverse
getZoomMinOffset(out):                 (width − width/zoom) × (zoomFocus.x/width)
```

While zoomed (`zoom ≠ 1`), `smoothPositioning` flips to `false`, so
`getDrawPos` switches from fractional scaling to integer snapping
(`round(pos) × scale`) — crisp pixels while zoomed.

**Practical rule for mods**: anything drawn between `startZoomedDraw` /
`endZoomedDraw` (maps, entities, midDraw addons) is in *map/logical space* and
inherits the zoom transform. A `postDraw` addon starts with the shared render
context; call `ctx.save(); ctx.resetTransform(); … ctx.restore()` before drawing
a physical full-screen/backing-space pass.

## 5. Event & action camera steps (`camera-steps.js`)

Cutscenes and combat drive the camera through event/action steps, all building
`TargetHandle`s:

| Step | Kind | What it does |
|---|---|---|
| `SET_CAMERA_TARGET` | event | Focus an entity: offsetX/Y, zoom, speed, transition, `wait`/`waitSkip`, optional persistent `name`, `lockZ` (ignore entity z movement) |
| `SET_CAMERA_POS` | event | Focus a fixed map position |
| `SET_CAMERA_BETWEEN` | event | Focus the average of two entities (`MultiEntityTarget`) |
| `RESET_CAMERA` (event) | event | Remove the named target, or **all** event-attached handles |
| `UNDO_CAMERA` (event) | event | Remove only the **first** event-attached handle |
| `SET_CAMERA_ZOOM` | event | Animate zoom on the active handle |
| `FOCUS_CAMERA` | action | Combat focus (below) |
| `RESET_CAMERA` / `SET_CAMERA_ZOOM` (action) | action | Same, scoped to `action.actionAttached` |

`wait: true` makes the step block until
`getTimeUntilTargetReached() ≤ waitSkip` — cutscenes wait for the camera to
arrive (with a skippable slack).

### 5.1 `FOCUS_CAMERA` (combat)

- `target`: `SELF` (the acting combatant) or `TARGET` (`action.getTarget(true)`).
- `focusType`: `SELF` (plain EntityTarget), `BETWEEN_TARGET`
  (`MultiEntityTarget([action, target])` — frame both), or
  `KEEP_TARGET_IN_SCREEN` (`MultiEntityTarget([target, action], keepFirstTarget)`
  — target primary, actor clamped ±200/±100 of it).
- **Enemy attacks always keep the player framed**: if an enemy action focuses a
  party member, the target is forced back to `ig.game.playerEntity`.
- `keepPlayerOffset`: blends the player's own camera `offset`/`zoomOffset` by
  the given weight (immediate) and sets `keepZoomFocusAligned = true` — combat
  focus stays anchored to the player's normal framing.
- The handle is attached to the action (`addActionAttached`) so it detaches on
  action end (`removeTarget(…, "FAST")`).

### 5.2 Who pushes the camera in practice

- **Player**: `_updateCameraHandle` (`game.feature.player.entities.player.js`
  ~line 470) builds `EntityTarget(this)` — or
  `MultiEntityTarget([this, ...cameraTargets], keepFirstTarget)` when extra
  follow targets exist — sets `keepZoomFocusAligned = true`, applies
  `sc.PLAYER_ZOOM` (default 1) if ≠ 1, then `pushTarget`/`replaceTarget` with
  `EASE_IN_OUT`. `onPlayerPlaced` pops **all** targets and re-pushes.
- **Charge zoom**: `showChargeEffect(level)` does
  `cameraHandle.setZoom(PLAYER_ZOOM + level×0.5/3, 0.5, KEY_SPLINES.JUMPY)`;
  at level ≥ 2 it also adds `ig.screenBlur.addZoom(new ig.ZoomBlurHandle(
  "LIGHT"/"MEDIUM", 0.2, 0, 0.3))` — zoom + zoom-blur combined.
  (`clearCharge` restores zoom with `KEY_SPLINES.EAST_IN_OUT` — a typo in the
  original compiled code; the undefined spline degrades to linear.)
- **NPC interaction**: pushes `PosTarget` at the NPC's center with speed
  `"FAST"`, then `sc.model.enterCutscene()` (`npc-entity.js` ~line 766).
- **Puzzle entities** (bomb, bounce-switch, compressor, ball-changer): push
  their own handles `"FAST"` for local focus, pop on completion.
- **Cutscene steps** (`SET_CAMERA_TARGET/POS/BETWEEN/ZOOM/RESET/UNDO`) as above.

## 6. How the viewport is consumed by rendering

The camera outputs feed `ig.Renderer2d` (`impact.base.renderer.js`):

1. `prepareDraw(shownEntities)` — computes the visible viewport from
   `getZoomMinOffset() + ig.game.screen`, culls entities with **48px x / 32px y
   margins**, calls `entity.updateSprites()`, fills pooled `SpriteDrawSlot`s.
   Each cube sprite splits into a **wall slot** and/or a **ground slot**
   (`wallY` decides the split point).
2. Slots sort by `yIndex` (painter's order) then `spriteIdx`.
3. `drawLayers()` walks z-levels: `"first"` maps → per z-level, level maps +
   `drawEntities(level)` → `"last"` maps. `drawEntities` runs an **overlap
   stack solver**: rear cubes defer and draw before front cubes when they
   overlap in x (skippable via `noOverlapSolving` — needed for translucent fx).
4. `SpriteDrawSlot.draw(zMin, zMax)` applies z-clipping (`cutAtZ`), `gfxCut`
   trims, wall/ground split, transforms, and per-sprite overlays:
   `overlay` (tinted copy via `ig.ImageModFragment` in a shared 1024×1024
   atlas) and `lighterOverlay` (additive fragment) — hit flash, element tints.
5. Drop shadows: `alpha × 0.5 × sprite.alpha`, shrinking with z-height.
6. `drawPostLayerSprites()` draws the `"postlight"` bucket + GUI-sprites.

**Implication**: there is no per-object shader stage. To add per-object
rendering effects you either (a) inject `SpriteDrawSlot.draw` / `ig.Sprite`,
(b) add/modify a map layer, or (c) draw in an addon phase.

## 7. Mod-relevant summary

1. **Draw over the world, under the HUD**: `postDrawOrder` in (200, 500).
2. **Draw under the light composite** (be darkened with the world):
   `midDrawOrder < 100` (ig.light's midDraw composite is the reference).
3. **Track a world object on screen under zoom**:
   `ig.system.getScreenFromMapPos(out, mapX, mapY − z)`.
4. **New camera behavior** (follow mode, shake): push a custom
   `TargetHandle` wrapping a custom target object implementing
   `getPos(out)` (and rely on `setZoom` for zoom) — no need to touch
   `ig.Camera`. **Camera shake** (not built in): temporary handle whose
   `getPos` adds decaying noise; pop it when the decay finishes.
5. **Frame two entities** (dialogues): `SET_CAMERA_BETWEEN` event step or
   `MultiEntityTarget` with `keepFirstTarget`.
6. **Persistent camera override**: use a *named* target — survives event end,
   dropped on level load.
7. **Instant vs animated**: speed `0`/`IMMEDIATELY` snaps via
   `_applyFinalState`; string speeds are distance-based (farther = slower).
8. **Physical full-screen effects in postDraw must `resetTransform()`** — the
   zoom transform is still applied when the addon runs.
