# DOC 3 — Struggles, risks, performance budget & pitfalls

> **Performance/research document.** The canonical implementation rules are
> consolidated in the [agent reference](game/agent-reference.md), especially
> the Canvas2D and buffer guardrails below.
>
> What the `Visuals_to_check.md` plan underestimates, what can break, and the
> real performance budget on Canvas2D. Based on the verified architecture
> (DOC 1) and the repo's existing mods.

---

## 1. Risk #1: Canvas2D performance

### 1.1 Per-frame budget (60 FPS ⇒ 16.6 ms, of which the game already uses some)

The game itself (culling, slots, sorting, drawEntities, lighting, weather)
already consumes part of the budget. The existing mods give the orders of
magnitude:

| Operation | Relative cost (measured/estimated on this engine) | Note |
|---|---|---|
| Fullscreen `fillRect` (tint) | ~1× | negligible — visual-overhaul does it every frame |
| Fullscreen `drawImage` (buffer copy) | ~2-3× | tilt-shift and screen-blur do it every frame |
| Banded `drawImage` (~100-200 bands) | ~10-20× | visual-overhaul rain-ripples: enabled on BALANCED+ only |
| `ctx.filter='blur()'` fullscreen **per frame** | 30-100× | **must be avoided per frame** — tilt-shift avoids it (restricted passes, `updateEvery: 3`, `scale: 0.5`) |
| Fullscreen `getImageData` | GPU→CPU pipeline stall | **forbidden in a loop**; the engine only uses it in its image worker |

### 1.2 The "adaptive quality" pattern is mandatory
Tilt-shift formalized it and it's the lesson to take away:
- `adaptiveQualityEnabled`: raise/lower quality based on target FPS (45) with
  hysteresis (`adaptiveFpsBuffer`, 1 s cooldown, FPS smoothing 0.2).
- `failsafe`: if FPS < 24 for 45 frames → disable the effect, only re-enable
  above 34 FPS for 90 frames.
- `updateEvery: 3`: recompute the heavy effect 1 frame out of 3.
- `scale: 0.5`: compute the effect at half resolution.
- Auto-disable in combat (`autoDisableCombat`) and menus.

**Every feature of items 1-4 must integrate this pattern from the start**,
otherwise it degrades the game in combat (the worst time to lose FPS).

### 1.3 Physical resolution = 1136×640 (scale 2) — and it changes
With the widescreen mod, `ig.system.width` can go up (720-853): all mod buffers
must follow `ig.system.resize` (fixed buffers break). Tilt-shift manages
`lastW/lastH` + `dirty`; do the same.

---

## 2. Item-specific struggles

### Item 1 — God rays
- **No true occlusion**: the low-resolution mask won't see fine canopies like
  a shader. Expect an "atmosphere" rendering, not "physically correct".
- **Sun position**: there is no sun in the game; it must be derived from the
  time of day (ambient-nights exposes `currentPhase` and the hour). The sun
  vector must be consistent with the night mod's position, otherwise the
  effect looks wrong.
- **World-anchored noise**: offset by `ig.game.screen` OK, but if the layer
  has parallax (`distance < 1`), the anchor must use the layer's scroll
  (`layer.scroll`), not raw `ig.game.screen`.
- **Cost of N beams**: each beam = 1 path + gradient. Limit to 6-10 beams,
  ÷4 buffer.

### Item 2 — Water
- **Identifying the water areas = the real work**. Three options:
  scan animated water tiles (`ig.TileInfo.getAnimTiles`) at
  `onLevelLoaded` (automatic but heuristic); per-map rectangle in mod data
  (reliable, manual work); layer naming convention.
- **Parallax**: water rectangles must follow `layer.scroll` (parallax
  included), otherwise the reflection "slides" relative to the water.
- **Reflections**: the flipped reflection captures the WHOLE frame above the
  water, including the HUD if the attachment is too late — attach `onPostDraw`
  before `ig.gui` (order < 500), and ideally before tilt-shift (250) to avoid
  reflecting the blur.
- **Animated tiles**: animated water is redrawn by `drawAnimated` after the
  chunks — the tint/refraction must be applied **after** `drawAnimated`
  (therefore in postDraw, not midDraw).

### Item 3 — Motion blur
- **Velocity vs trigger**: `coll.vel` is noisy (friction, bounces);
  the `onMoveEffect` trigger (step/dash/jump) is more reliable but binary.
  Hybrid: trigger to arm, `coll.vel` for the direction.
- **The smear must draw in the right space**: inject `ig.Sprite.draw`
  (logical canvas space, zoom applied) — drawing from a postDraw addon in
  physical/backing space would require redoing the camera transform.
- **Cost**: N copies per fast entity. Limit to N=3-4, only fast entities
  (threshold 300-500 px/s), and only main sprites (not shadows).
- **Interaction with the stack solver**: the added copies must use
  `noOverlapSolving` to avoid disturbing the depth sorting.

### Item 4 — Foreground parallax
- **`distance > 1` is out of spec**: the formula supports it but the chunk
  culling (`preRenderChunk`: visible columns computed from `scroll`) and the
  `repeat` must be validated at 1.25×. If the culling breaks, inject the
  column computation too.
- **Pre-render bokeh**: blurring the chunks once = free; but the chunks are
  invalidated when animated tiles change — the blur must be applied in
  `preRenderChunk` (where the context is swapped), not on the finished chunk.
- **Interaction with the widescreen mod**: `ig.system.width` changes → the
  parallax factors in px must be recomputed (follow `ig.system.resize`).

### Item 5 — Audio
- **The `_doPanning` gating**: opening it creates a PannerNode per short
  sound. In combat, dozens of short sounds/second — measure. Mitigation:
  panner pool or finer gating (only if `soundPos` moves away from the center).
- **`soundPos` follows the camera, not the player**: in combat, the camera is
  centered — that's the right reference frame. But in exploration with an
  offset camera, a sound "at screen center" is not "on the player". A
  design decision to own (the game chose the camera).
- **Attenuation**: the `EASE_SOUND` spline is not the plan's power 1.5;
  visually equivalent. Only rewrite the curve if a listening test justifies it.
- **Compressor**: the bus already passes through a DynamicsCompressor
  (−6 dB, 20:1); opening spatialization shouldn't saturate, but check the
  levels.

---

## 3. Cross-cutting risks

### 3.1 Mod compatibility (the repo has 40+)
- **Draw orders**: tilt-shift (250), VisualOverhaul (245), ig.gui (500).
  A new effect must choose its order deliberately:
  - "world" effect (water, god rays): midDraw (150-199) or postDraw 240-249;
  - "camera" effect (foreground bokeh): postDraw 250-260 (above tilt-shift
    so it isn't re-blurred, or below it to be blurred).
- **Concurrent buffers**: screen-blur redirects `ig.system.context` in preDraw
  (order 1000) and recomposes it in postDraw (200). An effect that copies
  `ig.system.canvas` at postDraw > 200 copies the recomposed frame — intended
  or not. That's exactly what visual-overhaul (245) and tilt-shift (250) do:
  order creates the effect chain. Document the chosen order.
- **`ctx.resetTransform()` mandatory** in physical/backing space: every
  fullscreen effect must `save(); resetTransform(); …; restore()` (the camera
  zoom is active in postDraw — tilt-shift and visual-overhaul do it).
- **widescreen + buffers**: all mod buffers must follow `ig.system.resize`
  (widescreen changes `width` at boot; runtime resize also exists).

### 3.2 Saves & reproducibility
- Mod options persist via `sc.options`/`ig.storage` (ambient-nights pattern:
  `ambience-` prefix). A visual mod must follow this pattern (own prefix),
  otherwise the settings reset between sessions.
- **Never** touch game state in draw passes (draw = pure). Mods that cheat
  (night-mode.zip injects `ig.Game.prototype.draw` and advances its clock
  there) end up fragile.

### 3.3 The "night-mode.zip" trap
The `night-mode.zip` contains an earlier iteration that:
- hijacks `ig.Game.prototype.draw` (instead of an addon);
- advances its clock **in draw** (side effect in a pure pass);
- patches via regex from a Node script (`refactor.js`, `injectHooks.js`).
That's the anti-method: fragile to updates, hard to debug.
ambient-nights (v1.6.0, rebuilt "on the engine's own systems") is the good
reference: real addon, `onDeferredUpdate` for the clock, native weather API,
options in the game menu.

### 3.4 Validation
- `node --check` on each mod file (all repo mods pass).
- Mandatory manual testing: combat + dash + rain + night + menus, on the
  densest maps.
- Measure: tilt-shift's diagnostics addon (`diagnosticsOverlay`) is a good
  template for showing FPS/per-frame time.

---

## 4. Performance budget summary (rules to remember)

1. No `getImageData`/`putImageData` per frame on the main canvas.
2. No fullscreen `ctx.filter='blur()'` per frame (pre-render or restricted
   half-resolution passes instead).
3. Each fullscreen pass costs ~1-3 % of the budget: count the passes.
4. Bands/strips: ≤ ~200 bands/frame (visual-overhaul: stripH ≈ 6 physical px
   over 640 px ≈ 107 bands).
5. Every heavy effect: `updateEvery ≥ 2`, `scale ≤ 0.5`, and the tilt-shift
   adaptive pattern (45 FPS target, 24 FPS failsafe).
6. Auto-disable in combat (option, ON by default for costly effects) — combat
   is the worst load case.
7. Buffers allocated on `ig.system.resize` (widescreen), never at fixed size.

---

## 5. Design decisions to make (with the existing plan)

1. **The plan talks about shaders everywhere** → publicly own the
   "Canvas2D pseudo-effect" conversion: the rendering will be
   "impressionistic", not physically correct. That's consistent with the
   pixel-art aesthetic.
2. **God rays**: where is the sun? (proposal: derived from the ambient-nights
   phase, fixed direction per phase).
3. **Water**: which maps? (proposal: start with the tutorial/bero river maps,
   hand-authored rectangle data).
4. **Motion blur**: which entities? (proposal: Lea + projectiles + puzzle
   balls; not the NPCs).
5. **Audio**: open the gating for all short sounds, or only combat?
   (proposal: all, with an option to revert).
6. **The "master mod"**: the final plan targets a single mod. Recommendation:
   a "visual-fx" mod with enableable sub-modules (options), building on the
   existing mods (ambient-nights for the day phase, tilt-shift for the
   adaptive pattern) rather than duplicating them.