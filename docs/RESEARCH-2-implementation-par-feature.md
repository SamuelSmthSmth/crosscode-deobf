# DOC 2 — Feature-by-feature implementation (mod first, inject otherwise)

> **Strategy/research document.** Use the canonical [agent reference](game/agent-reference.md)
> for current hook order, coordinate vocabulary, typed signatures, and guardrails.
>
> Walks through the 5 items of `Visuals_to_check.md` in order. For each: the
> actual engine state (verified in `deobf/clean/`), recommended strategy,
> code skeleton anchored in the real hooks, and priority.
>
> **Golden rule** (validated by tilt-shift / visual-overhaul / ambient-nights):
> CCLoader `poststart` mod + `ig.GameAddon` (preDraw/midDraw/postDraw) >
> `Class.inject` on a prototype > hijacking `ig.Game.prototype.draw` (to be
> avoided — night-mode.zip did it and it's fragile).

---

## Item 1 — Volumetric god rays & canopy noise

### What the plan says vs reality
| Plan (shader) | Engine reality |
|---|---|
| Binary occlusion mask offscreen (solid tiles black, sky/water white) | There is **no occlusion pass**; the "solid vs sky" info exists in the collision layers (`ig.CollisionMap`) and the `first` layer tiles |
| Radial blur toward the sun in screen space | Canvas2D: no affordable per-pixel pass; but `globalCompositeOperation='lighter'` + gradients = convincing additive rays |
| Simplex noise 2 octaves × `u_Time × 0.2` | Canvas2D: pre-generated noise texture (once, not per frame) + `drawImage` with time offset; world-anchored UVs via `ig.game.screen.x/y` (exactly the proposed offset, already available) |

### Recommended strategy (pseudo god rays, additive-only)
1. **Occlusion mask approximated without getImageData**: pre-render, on each
   map change (hook `onLevelLoaded`), a low-resolution mask of the **opaque
   `first` layer tiles** (opaque tile = mask pixel). Cache per map — zero
   per-frame cost. Opaque tiles are known via `ig.TileInfo` / the collision
   layer (`ig.CollisionMap`).
2. **Rays**: on a low-resolution offscreen buffer (÷4), draw from the sun's
   screen position N additive triangular beams
   (`globalCompositeOperation='lighter'`, radial gradient, low alpha) that
   stop at the mask (test by coarse mask sampling, not per-pixel).
3. **Canopy noise**: pre-generated noise texture (2 octaves, once at boot),
   drawn in `lighter` with modulated `globalAlpha`, offset by
   `(ig.game.screen.x, ig.game.screen.y)` — **the world anchor proposed in the
   plan is exactly the native `ig.game.screen` offset**.
4. **Attachment phase**: `onMidDraw` **before** `ig.light` (midDrawOrder < 100)
   so the rays are darkened by the light like the world, or
   `midDrawOrder > 100` for "atmospheric" rays on top.
   Recommended: after the light (order 150+, like VisualOverhaul) so light
   rays stay visible at night too.

### Out of reach
- Real per-pixel canopy occlusion (would require reading the frame:
  `getImageData` per frame = pipeline stall, forbidden in practice).
- "True" radial blur: replaced by N additive copies offset toward the sun
  (zoom-blur technique of `ig.ZoomBlurHandle`, already in the engine).

### Verdict: PARTIAL — convincing additive pseudo god rays, no true occlusion.

---

## Item 2 — Translucent water, refraction, reflections

### What the plan says vs reality
| Plan | Reality |
|---|---|
| Water shader that samples the riverbed | Water tiles are ordinary animated tiles (`hasAnimatedTiles`, `drawAnimated`) on a layer; "the bed" = the layer below, already drawn before |
| Wave normal map → UV displacement | Canvas2D: displacement by horizontal strips (proven: `_drawRainRipples` of visual-overhaul does exactly this, without getImageData) |
| Planar reflections of cliffs/trees above the waterline, vertical flip, depth-based alpha | Feasible in **physical screen space**: vertical flip of a strip above the waterline, low alpha — **technically identical to `_drawPuddleReflections` of visual-overhaul** (vertical flip + low alpha), but restricted to the water strip |

### Recommended strategy
1. **Identify the water strip**: either by a known "water" tile layer
   (hook `onLevelLoaded`, scan the layer for animated water tiles via
   `ig.TileInfo.getAnimTiles`), or by marking water rectangles per map (mod
   data). Pre-compute the screen rectangles each frame from the layer `scroll`
   (parallax included: `layer.scroll`).
2. **Depth (tint)**: for each water rectangle, `source-over` a vertical
   gradient (light near the banks → deep navy) with
   `globalCompositeOperation='source-atop'` limited to the rectangle — no need
   to know the actual depth: a per-map parameterized gradient suffices
   visually.
3. **Refraction**: reuse visual-overhaul's ripple strips technique
   **restricted to the water rectangles** (instead of the whole screen):
   horizontal bands, sinusoidal offset. That's the desired "normal map"
   refraction, without a shader.
4. **Planar reflections**: for each water rectangle, copy the strip above the
   waterline (height H), draw it **flipped** into the water with
   `globalAlpha ≈ 0.15–0.25`, optionally through the same ripple (draw the
   reflection into the buffer, then ripple the buffer).
   Exactly `_drawPuddleReflections` but bounded to the water strip.
5. **Attachment phase**: `onPostDraw` **before** the HUD (order ~245 like
   VisualOverhaul) — water must reflect the finished world but stay below the
   HUD.

### Verdict: PARTIAL→GOOD — each of the three sub-effects has a proven precedent in visual-overhaul; the difficulty is identifying the water areas per map (mod data).

---

## Item 3 — Directional velocity motion blur

### What the plan says vs reality
| Plan | Reality |
|---|---|
| Track `vel` of each entity in `impact.base.entity.js` | `coll.vel` (Vec3) **already exists** on every entity, updated by physics (`ig.CollEntry`); `coll.accelDir` + `relativeVel` too |
| Pass blur parameters to the sprite draw call | No per-draw-call blur parameter — but the engine already has the **speedlines** mechanism: JSON effects (`data/effects/speedlines.json`) spawned on target (`speedlinesWalk/Dash/Jump`), triggered by `onMoveEffect` (step/dash/jump) |
| Directional smear along the movement angle | Canvas2D: multi-`drawImage` of the sprite offset along `vel`, decreasing alphas — or reuse the `lighterOverlay` slot |

### Recommended strategy
1. **Don't reinvent**: the engine already has (a) per-entity velocity
   (`coll.vel`, Vec3, physics-updated), (b) the movement trigger
   (`onMoveEffect` step/dash/jump on `sc.ActorEntity`), (c) a data-driven
   speedlines effect (`data/effects/speedlines.json`, `OFFSET_PARTICLE_CIRCLE`
   particles with stretched `pScale`, `moveDist`, `keySpline`).
2. **Approach A (data, simplest)**: add oriented variants to the speedlines
   JSON (particles stretched along the movement angle via
   `useTargetAngle: true`, anisotropic `pScale`) — zero engine code.
3. **Approach B (true smear)**: a `postUpdate` addon that, for each visible
   entity with `|vel| > threshold`, stacks N copies of the sprite offset along
   `-vel.normalized × k` with decreasing alphas. Done cleanly via an
   `onPostDraw` addon (order < 245) that redraws the sprite — but the cleanest
   is to inject `ig.Sprite.prototype.draw` to add the copies **at the actual
   draw time** (correct coordinate space guaranteed).
4. **Threshold**: `|vel|` in px/s; Lea's dash ≈ max speed; typical threshold
   300–500 px/s. Only blur `sc.PlayerEntity` + projectiles at first.

### Verdict: GOOD — velocity + triggers + data-driven effect exist; Approach A (JSON) is nearly free, Approach B is a clean inject.

---

## Item 4 — Foreground parallax (distance > 1) & bokeh

### What the plan says vs reality
| Plan | Reality |
|---|---|
| Insert a layer with parallax factor > 1.0 | `distance` is designed 0..1 (1 = fixed background, 0 = glued to the camera). **`distance > 1` is not planned** but the `scroll = screenX × distance` formula is linear: `distance = 1.25` would give a layer scrolling **faster** than the camera (foreground). Check edge effects (repeat, culling). |
| 2 px bokeh on that layer | `ctx.filter = 'blur(2px)'` on the layer — but layers are pre-rendered in **chunks** (`preRenderedChunks`); blurring the chunks at pre-render (once) is nearly free |

### Recommended strategy
1. **Foreground layer**: duplicate an existing foliage layer (or add one to the
   map via the Weltmeister editor), put it in the `"last"` bucket, and inject
   `ig.MAP.Background.prototype.setScreenPos` to multiply `screenX` by a factor
   > 1 **for that layer only** (mark the layer by a conventional name, e.g.
   `fg_` prefix). That's exactly what visual-overhaul does with
   `ig.MAP.Background.inject`.
   ⚠️ `distance > 1` scrolls **faster than the camera** — verify the culling
   (`preRenderChunk` computes the visible columns from `scroll`, should follow)
   and the repeat.
2. **Bokeh**: blur that layer's chunks **at pre-render**
   (`preRenderChunk`: apply `ctx.filter='blur(2px)'` while rendering the chunk
   — cost once per chunk, not per frame). Per-frame alternative:
   `ctx.filter` at the layer draw — more expensive, avoid.
3. **Attachment**: nothing to do — `setScreenPos` is called for all layers at
   the start of `ig.Game.draw`, the inject suffices.

### Verdict: GOOD — a clean inject on `setScreenPos` + pre-render chunk blur. The factor > 1 is out of spec but the formula supports it; validate visually (culling/repeat).

---

## Item 5 — Positional 2.5D audio

### What ALREADY exists (verified)
- **PannerNode** per positional sound: `equalpower`, `linear`,
  `refDistance = 0.1 × range`, `maxDistance = range` (default 1600 px).
- Position refreshed **every frame** from the entity (`getAlignedPos`) and
  relative to `ig.game.soundPos` — **the listening center already follows the
  camera** (camera lines 93-94: `ig.game.soundPos.x/y = soundPosVec`).
- Attenuation: `EASE_SOUND` spline over `(dist − near)/far`,
  `near = 0.1 × range`, `far = 0.9 × range`.
- Panning: derived from relative x (equalpower), z = `−0.1 × range`.
- Standard helper `ig.SoundHelper.playAtEntity` used everywhere (NPC footsteps
  range 700, items, puzzle, combat).
- **Gating**: `_doPanning = (duration ≥ 1 s) || loop` — short sounds are NOT
  spatialized.

### Recommended strategy (the "positional-audio" mod)
1. **Widen the gating** (tiny inject, the heart of the mod):
   ```js
   ig.SoundHandleWebAudio.inject({
       init: function (buffer, offset, startTime, loop, volume, speed, fadeDuration) {
           this.parent(buffer, offset, startTime, loop, volume, speed, fadeDuration);
           this._doPanning = true;   // spatialized as soon as a position is provided
       }
   });
   ```
   Cost: one more PannerNode per short sound — negligible (equalpower).
2. **Power-1.5 attenuation** (optional, faithful to the plan): inject
   `_setPosition` to replace the `EASE_SOUND` spline with
   `clamp(1 − dist/MaxRange, 0, 1)^1.5` — or keep `EASE_SOUND` (visually very
   close). Recommended: keep `EASE_SOUND`, expose a slider.
3. **Scope**: already-positioned sounds (footsteps, items, puzzle) benefit
   immediately; for combat hits (played via `sound.play()` then
   `setFixPosition(soundPos)` in `combat.js`), the position is already
   provided — they will be spatialized as soon as the gating opens.
4. **"Power-1.5 attenuation" option**: inject `_setPosition` to replace the
   spline with the plan's formula (behind an option).
5. **Per-type range option**: expose `range` (default 1600); footsteps already
   use 700.

### Verdict: ALREADY ~80% — a ~10-line inject opens spatialization to short sounds; the rest is tuning.

---

## Recommended prioritization

| Order | Item | Reason |
|---|---|---|
| 1 | **5 — 2.5D audio** | ~10-line inject, immediate benefit, near-zero risk |
| 2 | **3 — Motion blur** | Approach A (speedlines JSON) nearly free; Approach B (sprite inject) clean |
| 3 | **4 — Foreground parallax + bokeh** | `setScreenPos` inject + pre-render blur; validate visually |
| 4 | **2 — Water** | three proven techniques, but requires per-map water-area data (data work) |
| 5 | **1 — God rays** | the most uncertain (no true occlusion); start with the low-resolution mask |