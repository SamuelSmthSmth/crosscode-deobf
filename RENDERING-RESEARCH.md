# Rendering, Resolution & Frame-Rate — Research Notes

> **Deep-dive research note.** Use the [agent reference](docs/game/agent-reference.md)
> for current hook order, coordinate-space terminology, and renderer guardrails.
> This note preserves the detailed rendering investigation and widescreen design
> history.

> Reverse-engineered from the deobfuscated engine reference in `deobf/clean/`.
> CrossCode is ImpactJS (`ig.*`) + CrossCode layer (`sc.*`), running in
> nw.js (Chromium) on a single HTML5 `<canvas>` with a 2D context. There is no
> WebGL and no separate render thread — everything is drawn with Canvas2D.

These notes are written to support two planned mods (**widescreen** and
**FPS unlock / lock**) and to catalog other mod opportunities now that most of
the `impact.*` engine and part of the `game.feature.combat.*` layer are named.

---

## 1. The boot chain (who sets resolution & fps)

The page (`assets/impact/page/php/game.config.php`) emits a set of `window`
globals, then `game.compiled.js` boots and calls `window.startCrossCode`.

```
game.config.php (PHP, ?sd / ?scale / ?fps query params)
  IG_WIDTH   = 568  (or 480 with ?sd)
  IG_HEIGHT  = 320
  IG_GAME_SCALE = 2   (1 = "blurry", 2 = "sharp" pixel-doubled)
  IG_GAME_FPS   = 60  (or ?fps=N)
```

`game.main` → `window.startCrossCode` (`deobf/clean/game.main.js`):

```js
ig.main("#canvas", "#game", sc.CrossCode,
        window.IG_GAME_FPS || 60,
        window.IG_WIDTH, window.IG_HEIGHT,
        window.IG_GAME_SCALE, sc.StartLoader)
```

`ig.main` (`deobf/clean/impact.base.impact.js`) constructs the engine singletons:

```js
ig.system = new ig.System("#canvas", "#game", fps, width, height, scale);
```

So the **single source of truth** for internal resolution and frame rate is
`ig.system`, built once from `IG_WIDTH` / `IG_HEIGHT` / `IG_GAME_FPS` /
`IG_GAME_SCALE`.

---

## 2. Canvas & resolution model

All state lives on `ig.system` (`deobf/clean/impact.base.system.js`). There are
**three distinct sizes** — this is the most important thing to understand:

| Field | Meaning |
|---|---|
| `ig.system.width` / `.height` | **Logical canvas resolution** = 568×320. This is how many map pixels are visible and what all game logic/HUD layout measures against. |
| `ig.system.contextWidth` / `.contextHeight` | The actual canvas backing store = `width * scale` (1136×640 at scale 2). |
| `ig.system.screenWidth` / `.screenHeight` | The **CSS on-screen size** (`canvas.style.width/height`), set by the window scaling options. |
| `ig.system.scale` | Integer pixel-doubling factor (2 = sharp mode). |
| `ig.system.contextScale` | Used instead when image smoothing is on (scale=1 → contextScale=2). |

`ig.system.resize(width, height, scale)` recomputes all of the above and
resizes the canvas element. `ig.system.setCanvasSize(width, height, hideBorder)`
only changes the **CSS** size (`screenWidth/screenHeight` + the `borderHidden`
class) — it never touches the logical resolution.

The window scaling is handled in `sc.OptionModel._setDisplaySize`
(`deobf/clean/game.feature.model.options-model.js`) from the `display-type`
option:

- `ORIGINAL` → CSS size = `IG_WIDTH × IG_HEIGHT`
- `SCALE_X2` → CSS size = `IG_WIDTH*2 × IG_HEIGHT*2`
- `FIT` → fit into window preserving aspect, `stretch = true`, "borderHidden"
- `STRETCH` → fill window, `stretch = true`

`_setDisplaySize` measures against `baseWidth = window.IG_WIDTH` /
`baseHeight = window.IG_HEIGHT`, so **if `IG_WIDTH` is changed before boot,
the window scaling math follows automatically**.

### Mouse coordinate mapping
`impact.base.input.js` converts raw mouse coords to logical coords with
`mouse.x *= ig.system.width / ig.system.screenWidth` (and the same for height),
so mouse aim already adapts to any CSS size / aspect ratio.

---

## 3. Frame-by-frame render pipeline

The loop is `ig.System.run` → `runFrame` (`impact.base.system.js`); the actual
world draw is `ig.Game.draw` (`deobf/clean/impact.base.game.js`):

```
runFrame():
  frameCounter++
  if frameCounter % ig.system.frameSkip == 0:
      ig.Timer.step()                       // advance global clock (clamped)
      ig.system.rawTick = actualTick = min(maxStep, clock.tick()) * totalTimeFactor
      ig.system.tick = actualTick * timeFactor
      <audio timeOffset sync>
      ig.system.delegate.run()              // = sc.CrossCode.run → update + draw
```

`ig.Game.draw()` (the delegate's `draw`):

```
for each map layer: setScreenPos(screen.x, screen.y)
addons.preDraw.*.onPreDraw()
ig.system.startZoomedDraw()                 // translate/scale for camera zoom
renderer.prepareDraw(shownEntities)         // cull + build sprite slots
renderer.drawLayers()                       // maps "first" → levels → "last"
addons.midDraw.*.onMidDraw()                // light map, weather, etc.
renderer.drawPostLayerSprites()             // gui-sprites + debug overlays
ig.system.endZoomedDraw()
addons.postDraw.*.onPostDraw()              // **the GUI is drawn here**
```

`ig.Renderer2d` (`deobf/clean/impact.base.renderer.js`) is a sprite-batching
drawer:

1. `prepareDraw` culls entities against a viewport computed from
   `ig.game.screen` + `ig.system.width/height/zoom`, calls each entity's
   `updateSprites()`, and fills reusable `SpriteDrawSlot`s (split into `wall` /
   `ground` cube faces).
2. Slots are depth-sorted by `yIndex` (painters order), then `drawEntities`
   walks z-levels and emits canvas draw calls (shadows, sprites, "lighter"
   fragments).
3. The GUI is **not** part of the renderer — it is drawn afterward.

### The GUI pass
`ig.Gui` / `ig.GuiHook` / `ig.GuiRenderer` (`deobf/clean/impact.feature.gui.gui.js`)
is a separate scene graph. Each `GuiElementBase` builds a flat list of pooled
draw commands in its `updateDrawables(renderer)`; the renderer replays them in
the `postDraw` addon phase, on the **same 2D canvas** on top of the world.

Alignment is resolved from `ig.system.width/height`:

```
resolveAlignX: LEFT → pos.x,  RIGHT → parentW - size.x - pos.x,
               X_CENTER → parentW/2 - size.x/2 + pos.x
```

so HUD elements anchored `X_RIGHT` / `X_CENTER` re-flow automatically when the
logical width changes. This is why a wider internal resolution mostly "just
works" for the HUD.

---

## 4. Widescreen / ultrawide mod

Because the codebase measures almost everything against `ig.system.width` /
`ig.system.height` (camera, renderer culling, map/background map, weather,
fog, rain, light, env-particles, GUI alignment, mouse), **changing the logical
width is sufficient for a wider view**. There is no hardcoded `568` anywhere in
the compiled game code (only in the PHP page config).

### Approach A — change `IG_WIDTH` before boot (cleanest)
A CCLoader `preload`/`prestart` mod sets:

```js
window.IG_WIDTH = 720;      // 320 * 2.25 = 20:9-ish
// or 768 (2.4:1), 853 (2.66:1), etc. Keep IG_HEIGHT = 320.
```

`startCrossCode` then boots with the new width, and `_setDisplaySize` derives
the CSS size from `IG_WIDTH`, so FIT/STRETCH scaling stays correct.

### Approach B — resize at runtime (postload)
After boot you can patch the live system, then re-run the display sizing:

```js
ig.system.resize(window.IG_WIDTH_NEW, ig.system.height, ig.system.scale);
sc.options._setDisplaySize();   // recompute CSS size + screenWidth/screenHeight
```

### What to verify / known gotchas
- **Camera bounds** are width-adaptive (`impact.feature.camera.camera.js`
  `_limitPos` clamps to `ig.game.size.x - ig.system.width/2`), but tiny maps
  narrower than the new view will show edge padding.
- **Letterboxing during cutscenes** is horizontal (top/bottom bars) and spans
  full width, so it survives a wider view; check `sc.OverlayGui` /
  `screen-blur` / `dream-fx` for any fixed-pixel art that assumes 16:9.
- **Fixed-art HUD/menu backgrounds** (title screen, menus, dialog boxes) are
  centered via `X_CENTER`/`Y_CENTER`, but their background images were authored
  for 568×320 — they won't tile to the new width, so menus will look like a
  centered 16:9 panel with empty side space. A full widescreen mod also needs
  stretch/repeat treatment for menu backgrounds.
- **Effect "full screen" fills** (`ig.system.context.fillRect(0,0,width,height)`
  in light/screen-blur, plus `ig.Image.drawFullScreen`-style helpers) already
  use `ig.system.width/height`, so they fill the new width for free.

---

## 5. FPS unlock / lock mod

The frame-rate behavior is entirely in `impact.base.system.js`:

```js
startRunLoop():
  if (fps >= 60 && requestAnimationFrame)
      requestAnimationFrame(run)         // vsync / display-refresh bound
  else
      intervalId = setInterval(run, 1000 / fps)   // fixed rate below 60
```

- `ig.system.fps` is set from `IG_GAME_FPS` (default 60).
- `frameSkip` (default 1) gates work: only every `frameSkip`-th frame does the
  tick + draw.
- `ig.Timer.maxStep = 1/30` (`impact.base.timer.js`) clamps the **per-frame
  logic delta**, not the render rate — it's a "spiral of death" guard.
- Game speed is delta-time: `ig.system.tick = actualTick * timeFactor`, so
  changing FPS changes smoothness, **not** game speed. Game speed is
  `timeFactor` / `totalTimeFactor` / `ig.Timer.timeScale` / `skipMode`.

### Lock to 30 (or any sub-60 rate)
`fps < 60` → `setInterval(1000/fps)`, and `runFrame` no longer self-schedules
rAF. Simplest:

```js
// preload (before startCrossCode)
window.IG_GAME_FPS = 30;

// or postload (at runtime):
ig.system.stopRunLoop();
ig.system.fps = 30;
ig.system.startRunLoop();
```

### "Unlock" to 120/144
At `fps >= 60` the game **already** uses `requestAnimationFrame`, so the render
rate follows the display's refresh / nw.js vsync. The `fps` number itself does
not cap the rAF path. Practical implications:

- Set `window.IG_GAME_FPS = 120` (keeps the rAF branch). This alone changes
  nothing on a 60 Hz panel but signals intent and avoids the setInterval path.
- Real uncapping on a high-refresh display is a **nw.js / Chromium vsync**
  concern, not a game-logic concern: launch flags such as
  `--disable-frame-rate-limit` / `--disable-gpu-vsync` (or running nw.js with
  vsync off) are what let rAF exceed 60. CrossCode's desktop build (GOG/Steam)
  has no in-game vsync toggle, so the mod may need to inject/alter nw.js
  command-line flags via the launcher rather than the JS.
- Because logic is delta-time and `maxStep` is 1/30, running at 120/144 Hz is
  safe: per-frame `tick` simply becomes ~8.3 / ~6.9 ms.

### Notes on audio & frame-skip
`runFrame` re-syncs WebAudio's `timeOffset` every frame from `rawTick`, so
changing frame rate does not drift audio. `ig.system.skipMode` multiplies both
`tick` and `actualTick` by 8 (a debug/speedrun fast-forward) — unrelated to FPS.

---

## 6. Other mod opportunities (from what's now deobfuscated)

A quick catalog of seams exposed by the cleaned reference. All of these are
`sc.*`/`ig.*` hooks reachable with `Class.inject` / addons, same as the
existing `ambient-nights` / `tilt-shift` / `photo-mode` mods.

**Rendering / presentation**
- Widescreen / ultrawide (this doc).
- FPS lock / unlock (this doc).
- Camera FOV / zoom curve — `impact.feature.camera.camera.js` (`ig.Camera`,
  `PosTarget`, `EntityTarget`, zoom splines).
- Screen filters — `impact.feature.screen-blur`, `impact.feature.dream-fx`,
  `impact.feature.overlay`, `impact.feature.parallax` (retro CRT, tilt-shift,
  bloom, parallax depth).
- Slow-motion control — `impact.feature.slow-motion` (`ig.slowMotion.add/clear`).

**World / atmosphere**
- Weather & time-of-day — `impact.feature.weather.*`, `impact.feature.light.*`
  (already partly covered by `ambient-nights`; new variants like aurora,
  sandstorm, blood-moon are feasible).
- Terrain auto-tiling rules — `impact.feature.terrain`.
- Particles — `impact.feature.env-particles` (custom ambient particles).

**Combat (`game.feature.combat.*`, now ~2/3 named)**
- Damage/stat rebalance — `combat-params` (`sc.CombatParams`, modifiers,
  element factors, `applyDamage`).
- Status effects — `combat-status` (burn/chill/jolt/mark; new statuses).
- Enemy scaling & reactions — `enemy-level-scaling`, `enemy-type`,
  `enemy-reaction`, `enemy-tracker` (spawn/aggro/AI tuning).
- Ball/projectile behavior — `ball-behavior`, `entities.ball`, `entities.stone`
  (steering, homing, bounce, multi-hit).
- PvP rules — `pvp` (round points, damage factor, KO handling).

**UI / HUD (`game.feature.gui.*`, `game.feature.menu.*`)**
- HUD layout/visibility toggles — `hud.*`, `status-bar`, `hp-bar-boss`,
  `right-hud` (minimal/immersive HUD, custom boss bars).
- Menu skinning — `menu.gui.*`, `gui.base.*`.

**QoL / gameplay**
- Item drop rates & rarities — `entities.item-drop`, `inventory`.
- Enemy annotation / AI knowledge gating — `model.enemy-annotation`
  (`sc.EnemyAnno`, the "does the party AI understand this enemy" roll).
- Respawn / spawner rules — `entities.enemy-spawner`, `respawn-blocker`.

---

## 7. Source files referenced

| Concern | Cleaned reference file |
|---|---|
| Boot + singletons | `deobf/clean/impact.base.impact.js`, `game.main.js` |
| Main loop, canvas, resize, FPS | `deobf/clean/impact.base.system.js` |
| Clock & delta clamp | `deobf/clean/impact.base.timer.js` |
| World draw loop | `deobf/clean/impact.base.game.js` (`.draw()`) |
| Sprite renderer | `deobf/clean/impact.base.renderer.js` |
| GUI scene graph | `deobf/clean/impact.feature.gui.gui.js` |
| Camera / bounds | `deobf/clean/impact.feature.camera.camera.js` |
| Display-type scaling | `deobf/clean/game.feature.model.options-model.js` (`_setDisplaySize`) |
| Mouse coord scaling | `deobf/clean/impact.base.input.js` |
| Page config (resolution/fps) | `assets/impact/page/php/game.config.php` |
