# DOC 4 — Existing tools, prior art & references

> **Prior-art/research document.** The canonical integration contract is
> the [agent reference](game/agent-reference.md); this page records examples
> and historical implementation options.
>
> Everything that can be reused directly for the 5 items of
> `Visuals_to_check.md`, in this repo or in the CrossCode ecosystem.

---

## 1. Mods already installed in this repo (`assets/mods/`) — direct prior art

| Mod | What it proves / provides | Reusable for |
|---|---|---|
| **tilt-shift** v1.2.0 | Diorama blur between world and HUD via GameAddon (orders 250/501), **complete adaptive pattern** (adaptive quality target 45 FPS, failsafe 24 FPS, `updateEvery`, `scale 0.5`, diagnostics overlay, hotkeys, presets), options in Options > Video | Items 1, 3, 4: the adaptive pattern + option structure to copy |
| **visual-overhaul** v1.0.0 | Per-phase colour grading (fillRect), **rain ripples via banded drawImage** (without getImageData), **puddle reflections via vertical flip**, parallax via `ig.MAP.Background` inject, OBJECT_SLIDER options with custom labels | Items 2 (reflections/refraction proven), 4 (parallax inject), 1 (grading) |
| **ambient-nights** v1.6.0 | Full day/night cycle on the native systems (clock in `onDeferredUpdate`, darkness overlaid on `ig.light.lightMapDarkness`, weather via `ig.weather.setWeather(new ig.WeatherInstance(name))`, re-application after each `onLevelLoaded`, `ambience-*` options, DOM forecast UI) | Items 1 (sun phase), 2 (rain), 5 (night ambience); the go-to structure of a clean visual mod |
| **photo-mode** v1.0.0 | Freeze the world + free camera, "works with tilt-shift + ambient-nights" | Item 4 (composition), visual tests |
| **widescreen-mod** v2.0.0 | `preload` (changes `IG_WIDTH` before boot) + `poststart` (runtime resize), Video options | Item 4 (the foreground must survive the width change) |
| **fps-unlock** v1.0.0 | rAF vs setInterval, frame-skip, Display Rate options | Performance budget (DOC 3) |
| **timewalker** v0.3.1 (CCTimeWalker) | Time control (plugin) | Night-mode prior art (item 1/5) |
| **night-mode.zip** | Earlier iteration: hijacks `ig.Game.prototype.draw`, clock advanced in draw, Node regex patches (`refactor.js`, `injectHooks.js`) | **The anti-method** — do not follow (DOC 3 §3.3) |
| cc-remastered-melodies, Boki_Colors, cc-menu-ui-replacement, nax-ccuilib, modifier-api, input-api, item-api, extension-asset-preloader… | Example ecosystem (UI lib, APIs) | General references |

## 2. Engine hooks to reuse (verified in `deobf/clean/`)

| Need | Native hook | Reference file |
|---|---|---|
| Fullscreen effect between world and HUD | `ig.GameAddon` + `preDrawOrder/midDrawOrder/postDrawOrder` | `impact.base.game.js` (`ig.GameAddon`), tilt-shift, visual-overhaul |
| Copy the frame for post-processing | `ig.screenBlur` (private buffer, orders 1000/200) | `impact.feature.screen-blur.screen-blur.js` |
| Zoom (radial) blur | `ig.ZoomBlurHandle` + `ig.BLUR_ZOOM_CONFIG` | same file |
| Fullscreen tint | `fillRect` in `onMidDraw`/`onPostDraw` with `ctx.resetTransform()` | visual-overhaul `_drawColorGrading` |
| Band distortion | banded `drawImage` | visual-overhaul `_drawRainRipples` |
| Flip reflection | `transform(1,0,0,-1,0,H)` + `drawImage` | visual-overhaul `_drawPuddleReflections` |
| Modified parallax | inject `ig.MAP.Background` (`setScreenPos`) | visual-overhaul `injectParallax` |
| Night darkness | overlay on `ig.light.lightMapDarkness` after the weather | ambient-nights |
| Forced weather | `ig.weather.setWeather(new ig.WeatherInstance(name), immediately)` | ambient-nights |
| Oriented particle effect | JSON `data/effects/*.json` + `ig.EffectSheet.spawnOnTarget` | `data/effects/speedlines.json` |
| Positional audio | `ig.SoundHelper.playAtEntity` / `handle.setEntityPosition` | `impact.base.sound.js` (already wired) |
| BGM cross-fade | `ig.bgm.play/push/pop/inbetween` + `ig.BGM_SWITCH_MODE` | `impact.feature.bgm.bgm.js` |
| Per-map ambience | `ig.MAP_SOUNDS[key]` (overridable before load) | `impact.feature.map-sounds.map-sounds.js` |
| Persistent options | `sc.OPTIONS_DEFINITION['my-mod-…']` + `sc.options` | ambient-nights, visual-overhaul |
| Offscreen buffer | `ig.system.createImageBuffer(w, h, draw)` | `impact.base.system.js` |
| Pre-computed image filters | `ig.Image.getFiltered(name, operator, config)` via worker | `impact.base.image.js` |

## 3. CrossCode ecosystem (outside the repo)

- **CCDirectLink** (GitHub): community modding hub — CCLoader,
  CCModManager (installed here as `.ccmod`), `nax-ccuilib` (UI) libraries,
  `modifier-api`, `input-api`, `item-api`, `extension-asset-preloader`.
- **Packaging convention**: folder with `ccmod.json` (id, version,
  dependencies, and one of the fields `preload` / `postload` / `prestart` /
  `poststart` / `plugin` / `main`) + assets under `assets/`. Distribution:
  folder in `assets/mods/` or a `.ccmod` package (zip).
- **CCLoader load order** (verified in `ccloader/js/`):
  `_loadPlugins` → `_executePreload` → game (until postload) →
  `_executePostload` → `_waitForGame` → `_executeMain` (= `main` + `poststart`)
  → `modsLoaded`. **`poststart` runs after the game is interactive** — that's
  why ambient-nights/visual-overhaul attach their addons directly into
  `ig.game.addons` (sorted) instead of `ig.addGameAddon`.
- **Weltmeister**: built-in map editor (`window.wm`) — for adding the
  foreground layers (item 4) and marking the water areas (item 2).

## 4. Plan ↔ tools correspondence (operational summary)

| Plan item | Native tool to reuse | Existing mod to extend/copy |
|---|---|---|
| 1. God rays + canopy noise | `ig.light` (shadow providers, `lightMapDarkness`), `globalCompositeOperation='lighter'`, pre-generated noise texture | ambient-nights (phase/time), tilt-shift (adaptive) |
| 2. Water (tint, refraction, reflections) | `drawAnimated` (animated tiles), offscreen buffers, strips | visual-overhaul (ripples + puddle reflections) |
| 3. Directional motion blur | `coll.vel`, `onMoveEffect`, JSON effects (`speedlines.json`) | — (new, data-driven first) |
| 4. Foreground parallax + bokeh | `ig.MAP.Background.setScreenPos` (distance), pre-rendered chunks | visual-overhaul (parallax inject), widescreen-mod |
| 5. 2.5D audio | native PannerNode, `ig.SoundHelper.playAtEntity`, `ig.game.soundPos` (camera) | — (tiny inject); ambient-nights for the night ambience |

## 5. Internal references (read in order)

1. `RENDERING-RESEARCH.md` — boot, resolution, FPS, widescreen, mouse.
2. `deobf/RENDERING-2.5D-NOTES.md` — 2.5D, cube sprites, lighting, parallax,
   camera, dream-fx, weather (the most detailed on rendering).
3. `docs/RESEARCH-1-architecture-rendu-audio.md` — pipeline + audio (this doc 1).
4. `docs/RESEARCH-2-implementation-par-feature.md` — per-item strategy.
5. `docs/RESEARCH-3-risques-et-limites.md` — performance & pitfalls.
6. `deobf/PROGRESS.md` — deobfuscation status (569/569, LCS ≥ 0.929).
7. `night_mode_plan.md` — night-mode master plan (product context).
8. `ENGINE-NOTES.md`, `engine-summary.json`, `engine-tree.txt` — inventory.

## 6. Prototypes still suggested (not documentation blockers)

The reference library is complete; the following are implementation ideas for
future mods, not missing documentation pages.


1. **"positional-audio" mod** (item 5): ~30 lines, inject of the
   `_doPanning` gating + options. The first concrete deliverable.
2. **"motion-fx" mod** (item 3): velocity-oriented speedlines JSON variant,
   then inject `ig.Sprite.prototype.draw` for the smear.
3. **"foreground-parallax" prototype** (item 4): inject `setScreenPos` +
   chunk blur, on a test map.
4. **"water-fx" prototype** (item 2): reuse the visual-overhaul techniques
   restricted to a test map's water areas.
5. **"god-rays" prototype** (item 1): low-resolution mask + additive beams,
   driven by the ambient-nights phase.
6. **Final merge**: a single "visual-fx" mod with sub-modules (options),
   reusing ambient-nights/tilt-shift rather than duplicating them.