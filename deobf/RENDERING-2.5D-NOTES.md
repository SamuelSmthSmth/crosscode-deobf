# Lighting, Parallax & 2.5D Rendering — Research Notes

> Reverse-engineered from the deobfuscated engine reference in `deobf/clean/`.
> CrossCode uses ImpactJS (`ig.*` / `sc.*`) on a single HTML5 Canvas2D context
> — no WebGL, no render thread, everything is drawn with Canvas2D.

These notes explain the lighting, parallax, and 2.5D rendering architecture to
support mods that want to extend or hook into these systems (e.g., new weather
types, custom light behaviours, pallet-swap light maps, stacked parallax
backgrounds, screen-space effects).

---

## 1. The 2.5D rendering model

CrossCode's world is rendered as **tile-map layers + z-level-sorted entities**
on a single Canvas2D element. There is no actual 3D engine — the third
dimension (z-axis) is purely a rendering convention that simulates height.

### 1.1 Coordinates & cube sprites

Entities have a collision box in 3D — `coll.pos` (x, y, z) and `coll.size`
(width, depth, height). Every entity produces one or more `ig.CubeSprite`
(`deobf/clean/impact.base.sprite.js`) — a pooled draw descriptor holding
position, size, image source rect, shadow, overlays, transform, and flags that
control how it slices into wall/ground faces:

| Field | Meaning |
|---|---|
| `pos` (x,y,z) | Base position in world space |
| `size` (x,y,z) | Width × depth × height of the bounding box |
| `wallY` | How much of the Y height is "wall face" (the rest is ground) |
| `aboveZ` | 0..1; 0 = cube sits on ground, 1 = full wall |
| `mergeTop` | When true, the "wall" face spans the full z range |
| `shapeType` | How sprite size maps to coll size: `Y_FLAT` (wall stretched), `Z_FLAT` (flat ground decal), `YZ_EXPAND` (default — fill both faces) |
| `gfxCut` | Pixel trim (top/bottom/left/right) from the image |

**One entity → two sprite slots.** The renderer splits a cube into a *ground
face* (drawn at `zMin` level) and a *wall face* (drawn above). `wallY` controls
where the split occurs; `aboveZ` pushes the wall face upward for objects that
stick out above ground (e.g. sprout plants, pipes).

### 1.2 Z-levels & the draw pipeline

Maps are organised into **named level buckets** in `ig.game.levels`:

```
"first" layer  → background tile-maps drawn before any entity
 level 0 .. N  → main entity-draw levels (height-sorted from -1)
"last" layer   → foreground tile-maps drawn after all entities
"light" layer  → light-colour tile-maps (rendered into the light canvas)
"postlight"    → overlays drawn after the light composite
```

The draw order (from `ig.Game.draw`, `impact.base.game.js`):

```
1. setScreenPos on every visible map layer  (screen scrolling)
2. addons.preDraw.*  →  ig.light.onPreDraw()  (light shadow pass)
3. system.startZoomedDraw()  (translate + scale for camera zoom)
4. drawLayers:
   - draw "first" maps
   - for level = -1 .. maxLevel:
       - draw level-N maps
       - renderer.drawEntities(level)  → entity sprites at this z
   - draw "last" maps
5. addons.midDraw.*  →  ig.light.onMidDraw()  (light composite + glows)
6. renderer.drawPostLayerSprites()  → "postlight" maps + GUI-sprites
7. system.endZoomedDraw()
8. addons.postDraw.*  → ig.gui.hooks  (HUD, menus, overlays)
```

### 1.3 Entity sprite slot sorting

`ig.Renderer2d.prepareDraw` (`deobf/clean/impact.base.renderer.js`) collects
every visible entity's sprites into flat arrays of `SpriteDrawSlot` (wall and
ground), then sorts by **yIndex** (painters order = opposite of what appears
in front):

```
wall slot:  yIndex = pos.y + wYOffset + size.y - wallY
ground slot: yIndex = pos.y + wYOffset + EPSILON
```

The `drawEntities` pass walks z-levels and draws each slot, handling overlap
with a **stack solver**: when two slots overlap in x and one is "behind" the
other in z, the rear slot is deferred and drawn first, then the front slot is
drawn over it. `noOverlapSolving` on a sprite skips this — needed for semi-
transparent effects.

### 1.4 Drawing a sprite

`SpriteDrawSlot.draw(zMin, zMax)` clips the sprite at level boundaries:

- **z-clip**: `cutAtZ` = how much of the top of a wall sprite overlaps the next
  level — that portion is trimmed off so walls don't poke through floors above.
- **gfxCut**: pixel-crop margins specified in the animation data.
- **wall/ground split**: `wallY < size.y` determines the face split;
  `cutTop`/`cutBottom` trim accordingly.
- The final image is drawn with `Canvas2D.drawImage` at `(drawX, drawY)`,
  possibly after a `ctx.translate + ctx.rotate + ctx.scale` block for rotated
  or scaled sprites.

### 1.5 Drop shadows

Every entity has `coll.shadow.size` (diameter in pixels). The shadow is drawn
as an 8-tile sprite-sheet (32 px tiles for small shadows; a scaled 224 px disc
for large ones). Shadows offset downward from `shadow.z` by z-height,
shrink with height, and draw at `alpha * 0.5 * sprite.alpha`. `STATIC_SIZE`
type shadows don't shrink with height (used for low objects).

### 1.6 Colour overlays

Two overlay slots per sprite: `overlay` (multiply via `ImageModFragment`) and
`lighterOverlay` (additive composite). These are used for hit-flash (white),
element tints (burn=red, chill=blue), and dream-fx colour washes.

---

## 2. The lighting system

`ig.Light` (the `ig.light` addon, `deobf/clean/impact.feature.light.light.js`)
implements a full Canvas-based 2D light/shadow system using image compositing.

### 2.1 Architecture

```
off-screen canvas ("light canvas")
   ↓
step 1 — SHADOW PASS (onPreDraw):
   1. Clear light canvas
   2. For each shadowProvider: drawShadows() → fills the canvas with
      opacity blocks (weather clouds, fog overlay, rain particles)
   3. Composite "destination-out" for condLights drawLight (subtract
      light from shadow — e.g. conditional lights near switches)
   4. Draw "light" tile-maps (ig.renderer.drawLight() → light-map
      layer) — these are map layers tinted as light colours, drawn
      as additive "lighter" on the light canvas
   5. Draw darkness handles (`#000008` fill at darkness intensity)
   6. Composite "destination-out" for light handles (subtract from
      shadow — e.g. player lantern, entity glow)

step 2 — COMPOSITE PASS (onMidDraw):
   7. Draw shadow-provider *glows* (e.g. weather sun/moon glow)
   8. Draw conditional-light *glows*
   9. drawImage(lightCanvas) → "source-over" composites the shadow
      map onto the main canvas
  10. Draw light-handle *glows* ("lighter" composite)
  11. Draw screen flashes ("source-over" coloured fillRect)
```

The final effect:
- Shadow providers "block out" areas (fog = uniform grey, clouds = grey
  with clear spots, rain = semi-transparent streaks).
- Lights are **subtracted** from the shadow canvas (`destination-out`).
- The shadow canvas is then **multiplied** onto the world (effectively
  darkening everything), and lights appear as brighter spots because the
  shadow canvas is transparent there.

### 2.2 Light handles (`ig.LightHandle`)

A light attached to an entity. Draws a sprite from `media/map/lightmap.png`
at the entity's screen position with a fade-in/out alpha.

| Size enum | Sprite rect (w×h) |
|---|---|
| `XXXXL` | 384 × 384 |
| `XXXL` | 256 × 256 |
| `XXL` | 192 × 192 |
| `XL` | 128 × 128 |
| `L` | 64 × 64 |
| `M` | 48 × 48 |
| `S` | 32 × 32 |
| `XS` | 32 × 32 |
| `NONE` | (invisible) |

The glow pass (`draw(0.2, 1)`) re-draws the same light at lower alpha (×0.2)
using the next size up (size+1) as a halo on the main canvas.

### 2.3 Darkness handles (`ig.DarknessHandle`)

Screen-wide darkness: a `#000008` fill at `1 - darknessIntensity` opacity drawn
on the light canvas. Multiple handles are combined by `Math.min` (the darkest
wins). Support both temporary (tied to an entity/action) and permanent (map
light-map) darkness.

### 2.4 Conditional lights (`ig.CondLights`)

Lights gated behind a `VarCondition` (e.g., a switch that turns on a lamp).
Fade in/out over 0.2 seconds. One condition can own multiple lights + glows.

### 2.5 Shadow providers (weather & map effects)

Shadow providers implement `drawShadows()` on the light canvas. They are
ordered by `shadowOrder`:

| Provider | `drawShadows` effect | File |
|---|---|---|
| `ig.LightMap` | `light`-layer tile-maps | `impact.feature.light.light-map.js` |
| `ig.Clouds` | Noise-pattern cloud coverage (clears holes in shadow) | `impact.feature.weather.clouds.js` |
| `ig.Fog` | Uniform fog overlay (grey fill) | `impact.feature.weather.fog.js` |
| `ig.Rain` | Semi-transparent rain streaks | `impact.feature.weather.rain.js` |

`lightMapDarkness` (default 0.6) and `lightMapBrightness` (default 1) are
global brightness knobs that multiply the shadow pass intensity.

### 2.6 Screen flashes

`ig.ScreenFlashHandle` draws a full-screen colour fill (e.g., white for
lightning flash, red for damage) with fade-in/hold/fade-out on the main
canvas during `onMidDraw`.

### 2.7 Glow colours

`ig.GlowColor` caches a colourised lightmap: it fills a canvas with the glow
colour and uses the original lightmap as a `destination-in` alpha mask. Used
by `mainGlowColor` (the global glow tint — changes with weather/time-of-day).

---

## 3. The parallax system

There are **two separate parallax systems**: map-level background scrolling
and GUI-level cutscene parallax.

### 3.1 Map parallax — `ig.MAP.Background` & `MovingParallax`

(`deobf/clean/impact.base.background-map.js`)

Map layers have built-in parallax scrolling properties set in the map editor:

- **`distance`** (0..1): How much the layer scrolls relative to the camera.
  1 = static (background), 0 = locked to camera (foreground).
- **`repeat`**: Whether the layer tiles infinitely (most backgrounds repeat
  because they're smaller than the visible area).
- **`moveSpeed`**: Auto-scroll velocity (px/s) — used by `MovingParallax` for
  independently scrolling cloud/sky layers.

The scrolling is computed in `ig.Map.setScreenPos(screenX, screenY)`:
```
scroll.x = screenX * distance + moveSpeed.x * timer
scroll.y = screenY * distance + moveSpeed.y * timer
```

Animated tiles (water, lava) update from `ig.game.backgroundAnimTimer` in
a separate `drawAnimated` pass that replaces the tile images based on
the current animation frame.

### 3.2 Cutscene parallax — `ig.Parallax` & `ig.ParallaxGui`

(`deobf/clean/impact.feature.parallax.parallax.js`)

High-level cutscene system loaded from `data/parallax/*.json`. Each JSON
defines **entries** (named image/colour layers with alignment, source
rects, animation, sound, pivot points) and a **sequence** (a timeline of
transitions between states with wait times, goto/label jumps, and splines).

`ig.Parallax` (a `JsonLoadable`) converts the JSON into:
- `gfx`: `ig.Image` instances (loaded from the paths in the JSON).
- `gui`: per-entry GUI data (position, alignment, transitions, anims, sounds).
- `timeLine`: a flat array of `{ time, gui, preState, state }` entries plus
  `{ time, label/skipLabel/sound/goto/end }` control entries.

`ig.ParallaxGui` (a `SequenceGui`) plays this timeline by stepping through it
frame by frame: it transitions each entry through its named states using the
specified `KEY_SPLINES` (LINEAR, EASE_IN, EASE_OUT, EASE_IN_OUT). States
define `offsetX/Y`, `alpha`, `angle`, `scaleX/Y`.

### 3.3 Parallax event steps

`impact.feature.parallax.parallax-steps.js` provides four `EVENT_STEP` types:

| Step | What it does |
|---|---|
| `SET_PARALLAX_POS` | Set the position of a named map layer |
| `SET_PARALLAX_SPEED` | Set auto-scroll speed of a `MovingParallax` |
| `SET_PARALLAX_REPEAT` | Toggle tile repeat on a background layer |
| `SET_PARALLAX_ANIMATION` | Start/hide a `ParallaxGui` |

---

## 4. The camera & zoom

(`deobf/clean/impact.feature.camera.camera.js`)

`ig.camera` is a game addon that operates during `onPostUpdate` (after all
entities update, before `draw`). It maintains a **stack** of
`ig.Camera.TargetHandle`s; the topmost active target drives the screen
position.

### 4.1 Target types

| Target | Behaviour |
|---|---|
| `PosTarget` | Fixed position — used for cutscene camera locks |
| `EntityTarget` | Follows an entity (player/focus) with **z-smoothing** (exponential ease toward entity z + `cameraZFocus`, faster during jumps) |
| `MultiEntityTarget` | Averages position over several entities (party follow), optionally clamped near the first entity (±200 X, ±100 Y) |

### 4.2 Position interpolation

TargetHandles have an **offset** (smoothed exponentially: each frame,
`current = (current * 23 + target) / 24`) and a **zoom offset** (same
smoothing). The active camera position is:

```
rawPos = target.getPos() + offset
zoomFocus = rawPos + zoomOffset
```

Camera transitions (pushing/popping/retargeting) interpolate the position
and zoom over a duration computed from distance × speed factor.

### 4.3 Zoom

`TargetHandle.setZoom(zoom, duration, spline)` sets an animated zoom.
`ig.system.setZoom(z)` changes the Canvas2D transform (translate + scale)
in `startZoomedDraw`. Zoom is a float > 1; default is 1 (no zoom). The
renderer's viewport culling adapts to zoom: `viewport = screen + zoomOffset`.

### 4.4 Bounds clamping

When map `cameraInBounds` is true, the camera stays inside `[0, mapSize]`.
During transitions, `_limitPos` adjusts the zoom focus to stay on-screen
while the camera position is at the edge.

---

## 5. Dream-fx & screen effects

(`deobf/clean/impact.feature.dream-fx.*`)

The dream-fx subsystem is a set of post-processing effects rendered during
`onMidDraw` / `onPostDraw`:

- **Colour wash**: A full-screen colour with sinusoidal alpha animation
  (used for dream-sequence sepia/bloom/colour grading).
- **Vignette**: Dark edges drawn as sprites.
- **Bloom**: "Lighter" composite of blurred screen regions.

These layer on top of the world but below the GUI, controlled by event
steps (`SET_DREAM_FX`, `CLEAR_DREAM_FX`).

---

## 6. Weather visual layer

(`deobf/clean/impact.feature.weather.*`)

The weather system has three visual components that act as **light shadow
providers** (see section 2.5 above) plus particle spawners:

| Component | Visual | File |
|---|---|---|
| Cloud cover | Noise-textured alpha mask (shadow canvas) | `weather.clouds.js` |
| Fog | Uniform grey alpha layer (shadow canvas) | `weather.fog.js` |
| Rain streaks | Semi-transparent directional streaks (shadow canvas) + `RainDropEntity` particles | `weather.rain.js` |
| Weather instance | Ties the above together: `start/newPhase/end` fades, `ig.WEATHER_TYPES` data table | `weather.weather.js` |

Weather particles are spawned by `ig.WeatherInstance.spawnParticles(…)` and
managed separately from the shadow passes — they are normal entities drawn by
the renderer alongside everything else.

---

## 7. Key files referenced

| Concern | Cleaned file |
|---|---|
| Renderer (slots, sorting, draw) | `deobf/clean/impact.base.renderer.js` |
| Cube sprites (2.5D box model) | `deobf/clean/impact.base.sprite.js` |
| Lighting addon + handles | `deobf/clean/impact.feature.light.light.js` |
| Light-map layer | `deobf/clean/impact.feature.light.light-map.js` |
| Conditional lights | `deobf/clean/impact.feature.light.entities.cond-light.js` |
| Weather (clouds, fog, rain) | `deobf/clean/impact.feature.weather.*.js` |
| Camera (targets, zoom, bounds) | `deobf/clean/impact.feature.camera.camera.js` |
| Background maps (parallax scrolling) | `deobf/clean/impact.base.background-map.js` |
| Cutscene parallax (timelines) | `deobf/clean/impact.feature.parallax.parallax.js` |
| Parallax event steps | `deobf/clean/impact.feature.parallax.parallax-steps.js` |
| Dream-FX (screen filters) | `deobf/clean/impact.feature.dream-fx.*.js` |
| Screen blur (blur effect) | `deobf/clean/impact.feature.screen-blur.*.js` |
| Map draw loop + addons | `deobf/clean/impact.base.game.js` |
| Animation + sprite setup | `deobf/clean/impact.base.animation.js` |