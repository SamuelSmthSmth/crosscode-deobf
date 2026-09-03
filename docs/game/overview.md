# Overview — CrossCode from 10,000 meters

> Source: `deobf/clean/game.main.js`, `deobf/clean/impact.base.*`,
> `package.json`, `assets/data/changelog.json`. Companion to
> [repository-map.md](repository-map.md).

## What this game is, technically

- **CrossCode** (Radical Fish Games), latest release **1.4.2** (changelog:
  `assets/data/changelog.json`). A 16-bit-styled 2D action-RPG with 2.5D
  walking (z-axis movement over a pseudo-3D view).
- **Shell**: the current main workspace runs nw.js **v0.115.0 / Chromium 152**
  on native Linux. The stock GOG/`CrossCode (Copy)` runtime remains nw.js
  0.35.5 / Chromium 71. Both are browser-window shells; verify the target folder
  before relying on runtime-specific APIs (see `package.json` and the
  [runtime notes](../RESEARCH-6-other-languages-typescript-cpp.md)).
- **Engine**: a heavily modified **ImpactJS** clone — modules registered with
  `ig.module(...).requires(...).defines(...)` and instantiated as
  `ig.Class.extend(...)`. The `ig.*` namespace is the engine; `sc.*`
  (StarCross) is the game layer.
- **Rendering**: exactly **one Canvas2D context**, logical resolution
  **568×320**, backing store normally `1136×640 @ scale 2` (widescreen mods
  can change the logical width). No WebGL, no shaders
  (see [research-note 1](../RESEARCH-1-architecture-rendu-audio.md) and
  [glossary](glossary.md)).
- **Game data**: everything content-ish lives in JSON in `assets/data/`
  (the only exceptions are binary media files and the audio). Entities,
  maps, characters, enemies, animations, effects, quests, items, shops,
  dialogues… all data-driven.

## The three code layers

| Layer | Modules | Namespace | Role |
|---|---|---|---|
| `impact.base.*` | 34 | `ig.*` | Core engine: system/game loop, entities, physics, rendering, maps, input, audio, events, loader |
| `impact.feature.*` | 120 | `ig.*` | Engine subsystems: GUI, effects, light, weather, camera, storage, BGM, navigation, terrain… |
| `game.feature.*` | 415 | `sc.*` | The actual game: player, combat, puzzles, menus, quests, NPCs, arenas, achievements… |

Plus 5 top-level `game.*` modules (`game.main`, `game.loader`, `game.config`,
`game.constants`, `game.beta`, `game.features`). Full split:
`deobf/engine-summary.json` (569 total, 154 impact / 415 game) and the tree in
`deobf/engine-tree.txt`.

## Boot sequence

1. nw.js loads `package.json → main: ccloader/index.html` (the CCLoader mod loader; see the [mods reference](mods/README.md)) which ultimately loads
   `assets/game/page/game-base.js` + `assets/js/game.compiled.js`.
2. `ig.Impact` (`impact.base.impact.js`) boots: DOM ready → load assets →
   instantiate `ig.system`, `ig.input`, `ig.soundManager`, the background
   loader (`impact.base.loader.js`).
3. `game.main.js` (`sc.CrossCode = ig.Game.extend`) wires the input bindings,
   the GUI stack, and starts `sc.StartLoader` — the loading screen
   (`game.loader.js`).

## The frame loop (where everything hangs)

```
ig.System.runFrame
  ├─ frame-skip gate → ig.Timer.step()
  ├─ sc.CrossCode.run()
  │    ├─ update(): addons.preUpdate → physics → events → addons.postUpdate
  │    └─ draw():
  │         1. setScreenPos() on all layers (scroll + parallax)
  │         2. addons.preDraw      (ig.screenBlur @1000 → redirects context)
  │         3. startZoomedDraw()   (camera zoom transform)
  │         4. renderer.prepareDraw → drawLayers → drawPostLayerSprites
  │         5. addons.midDraw      (ig.light, weather, visual mods)
  │         6. endZoomedDraw()
  │         7. addons.postDraw     (HUD @500, effects @<500)
  └─ finalDraw()
```

Detail: `docs/RESEARCH-1-architecture-rendu-audio.md` (exact line refs),
`docs/RESEARCH-5-camera.md` (viewport computation).

## Resolution & coordinate spaces (the four that matter)

Use the canonical names and conversion rules in the [agent reference](agent-reference.md#canonical-coordinate-vocabulary).

| Space | Size | Used by |
|---|---|---|
| Logical | 568×320 (`ig.system.width/height`) | culling, HUD layout, mouse mapping |
| Physical/backing | 1136×640 (`contextWidth = width × scale`) | full-screen effects |
| CSS/screen | window size (`screenWidth/Height`) | input remapping |
| Map | map pixels, e.g. `mapWidth×16` | entities, camera, physics |

Camera outputs: `ig.game.screen` (viewport origin), `ig.game.soundPos`
(audio listening point), `ig.system.zoom + zoomFocus` (transform). Full
derivation in [engine/impact/01-core.md](engine/impact/01-core.md) and
`docs/RESEARCH-5-camera.md`.

## Data routing — how a JSON file becomes gameplay

1. `assets/data/<type>/<name>.json` is loaded by a subsystem
   (e.g. enemies by `game.feature.combat.model.enemy-*`, characters by
   `game.feature.character.character`).
2. Most files carry a `DOCTYPE` discriminator (see
   [data/README.md](data/README.md) for the taxonomy of 808 files).
3. Map JSONs (`assets/data/maps/**`, 918 files) reference tile sheets in
   `assets/media/map/` by name and instantiate entities whose `type` is
   resolved by subsystem plug-ins (`ig.ENTITY.*` registries).

## Repository hygiene

- `deobf/clean/` is the **documentation-grade source**; never edit
  `assets/js/game.compiled.js` (rules in `deobf/PROGRESS.md`).
- **Source of truth** for verification: PROGRESS.md asserts every cleaned module
  is behavior-identical to `deobf/extract/` via token-LCS ≥ 0.929.