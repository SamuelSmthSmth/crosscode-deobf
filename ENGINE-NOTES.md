# CrossCode Engine Reverse-Engineering — Working Notes

> Handoff document for AI agents. Read this before continuing any work here.
> Last updated: 2026-08-20.

---

## 1. What this project is

This directory is a **CrossCode** install (nw.js / Chromium desktop app). The game is
an HTML5/JavaScript title built on the **ImpactJS** engine (`ig.*`) with CrossCode's
own game layer (`sc.*`). It is modded using **CCLoader v2.25.10**.

**The goal of this project:** deobfuscate and fully understand the entire game engine
so every line of code is readable, then (eventually) have a clean, well-named reference
of the whole game.

---

## 2. The core file under study

- `assets/js/game.compiled.js`
  - **28,819 lines / ~4.7 MB**, no source map.
  - The entire game: ImpactJS base + engine features + CrossCode game, all inlined.
  - Uses ImpactJS's module system: `ig.module("name").requires(...).defines(function(){...})`.

**How the obfuscation works** (3 layers, in increasing difficulty):

1. **Minification** — whitespace stripped, every local variable renamed to `a`/`b`/`c`/…
   Trivially reversible with a beautifier.
2. **ImpactJS 1.18a base** (`ig.version = "1.18a"`) — open-source and publicly readable
   upstream, so this slice maps 1:1 back to real names.
3. **CrossCode `sc.*` layer** — module-scoped identifiers and many property names were
   renamed to short/random tokens. It is **deterministic per game version** (same build →
   same names). Simplify ships a partial rename map for exactly this version.

**Important:** the compiled bundle registers modules with **double-quoted** names
(e.g. `ig.module("impact.base.worker").defines(...)`), not single quotes. Keep this in
mind when writing regexes against it.

---

## 3. Key files & paths

| Path | Purpose |
|---|---|
| `assets/js/game.compiled.js` | Original compiled bundle — **DO NOT MODIFY** (the game needs it intact) |
| `assets/js/game.compiled.pretty.js` | Beautified copy (179,829 lines) — safe to read/edit |
| `assets/js/cheats.json` | Cheat definitions |
| `assets/data/` | Game JSON databases (areas, maps, enemies, players, save-presets, etc.) |
| `assets/extension/` | 7 official extensions (post-game, manlea, ninja-skin, fish-gear, etc.) |
| `assets/modules/` | greenworks (Steam integration) builds for different nw.js versions |
| `assets/impact/` | Engine page assets + webworker (`image-tasks.js`) |
| `ccloader/` | CCLoader v2.25.10 mod framework |
| `assets/mods/simplify/` | Simplify v2.14.3 — the modding library |
| `assets/mods/` | All installed mods (`.ccmod` files + extracted folders) |
| `assets/impact/page/php/` | Build config: `game.debug.php` loads unminified sources; `game.release.php` loads `game.compiled.js` |

### Simplify's rename map (very important)
- `assets/mods/simplify/entries.json` — maps readable names → obfuscated names, with a
  `"tree"` structure and `"hash": "final"` (matches *this* game version's obfuscation).

### Decrossfuscator reference (name dictionary, added 2026-08-22)
- Cloned `https://github.com/20kdc/decrossfuscator` → `deobf/decrossfuscator/` (CC0 tooling
  that undoes Closure Compiler obfuscation on old CrossCode builds).
- Reference maps copied to `deobf/reference/`: `1.0.3-4.map`, `nhc.map`, `0.7.0.map`.
  Format: `readableName:obfuscatedToken` per line (~8,000 readable names, old bundles only).
- **Key finding: this game is v1.4.2-3 (`sc.VerionChangeLog`: major 1, minor 4, patch 2,
  hotfix 3) and is ALREADY deobfuscated by Radical Fish** — the old global rename tokens
  (`ig:ew`, `Vec2:Prb`, `squareDistance:pPb`) are absent (0 matches). Only local variables
  are minified to `a`/`b`/`c`. So the maps do **not** apply directly; they serve as a
  canonical readable-name dictionary to validate/speed up hand-cleaning.
- Lookup tool: `node deobf/lookup-name.js <query>` (searches all maps, both directions).
- **Rendering research** (2026-08-22): `deobf/RENDERING-2.5D-NOTES.md` covers the
  Canvas2D 2.5D model (cube sprites, z-levels, overlap solver), the light/shadow
  system (light canvas, shadow providers, light/darkness/flash handles), map +
  cutscene parallax, and the camera/zoom pipeline. Grounded entirely in the
  cleaned `impact.*` reference.
- `assets/mods/simplify/compat.js` — builds a safe `cc.*` alias tree at runtime
  (e.g. `cc.ig.gameMain` → `ig.game`, `cc.sc.playerModelInstance` → `sc.model`, and
  property names like `params`, `currentHp`, `teleport`, etc.).
- Mods should use `cc.*` / `sc.*` / `ig.*` + `Class.inject({...})` to hook the game,
  **not** raw obfuscated names.

---

## 4. Work completed so far (Phase 0 — DONE)

Generated a readable structure of the whole engine without touching the original:

| Artifact | Description |
|---|---|
| `assets/js/game.compiled.pretty.js` | Beautified copy: 28,819 → **179,829 lines** |
| `engine-manifest.json` | All **569 modules**: `{name, requires[], offset}` |
| `engine-tree.txt` | Full hierarchical module tree |
| `engine-summary.json` | Namespace counts |
| `extract-modules.js` | Script: extracts module manifest from `game.compiled.js` |
| `analyze-engine.js` | Script: tree + entry points + dependency fan-in analysis |
| `extract-module.js` | Script: extract one module (or `--all`) into `deobf/extract/` |
| `deobf/extract/` | Raw per-module bodies (generated by `extract-module.js`) |
| `deobf/clean/` | Hand-cleaned, fully-named reference files (the real deliverable) |
| `deobf/PROGRESS.md` | Per-module completion checklist (569 modules) |

### Commands used (reproducible)
```bash
cd assets/js
npx --yes js-beautify game.compiled.js -o game.compiled.pretty.js   # beautify
cd ../..
node extract-modules.js    # -> engine-manifest.json, engine-summary.json
node analyze-engine.js     # -> engine-tree.txt + console summary
```
Tooling: **Node v26.7.0**, `npx`/`npm` v12. `js-beautify` is fetched via `npx` on demand.

---

## 5. Engine structure discovered

**569 modules, single entry point: `game.main`.**

### Layer 1 — `impact.base.*` (34 modules) — the ImpactJS core (open source)
`loader`, `system`, `image`, `font`, `sound`, `input`, `entity`, `map`,
`collision-map`, `renderer`, `physics`, `animation`, `sprite`, `timer`, `event`,
`steps`, `action`, `actor-entity`, `game`, `game-state`, `lang`, `utils`, `vars`,
`worker`, `dom`, `background-map`, `coll-entry`, `entity-pool`, `extension`,
`global-settings`, `sprite-fx`, `tile-info`, `system.web-audio`.

### Layer 2 — `impact.feature.*` (120 modules) — engine subsystems
`gui` (huge — see fan-in below), `effect`, `light`, `weather`, `camera`, `bgm`,
`storage`, `interact`, `navigation`, `parallax`, `terrain`, `map-content`, `dream-fx`,
`env-particles`, `event-sheet`, `gamepad`, `greenworks`, `height-map`, `influencer`,
`lang-edit`, `map-image`, `map-sounds`, `nwf`, `overlay`, `rumble`, `screen-blur`,
`slow-motion`, `video`, `base`, `database`, `screen-blur`.

### Layer 3 — `game.*` (415 modules) — the CrossCode game

Top-level: `game.main` (entry), `game.loader`, `game.config`, `game.constants`,
`game.beta`, `game.features`.

`game.feature.*` subsystems (by module count):
- `menu` (105) — all menus (inventory, circuit, trade, options, pause, …)
- `gui` (55) — HUD + screens
- `combat` (45)
- `puzzle` (43)
- `arena` (15)
- `player` (14)
- `map-content` (11)
- `msg` (10), `quick-menu` (10)
- `npc` (8)
- `trade` (7)
- `interact` (6)
- `model` (5), `party` (5)
- `achievements` (4), `character` (4), `credits` (4), `game-sense` (4),
  `inventory` (4), `quest` (4), `timers` (4), `version` (4)
- `ar` (3), `auto-control` (3), `base` (3), `bgm` (3), `common-event` (3),
  `new-game` (3), `skills` (3), `tutorial` (3), `voice-acting` (3), `xeno-dialogs` (3)
- `beta` (2), `game-code` (2), `save-preset` (2)
- `control` (1), `font` (1)

### Most-depended-upon modules (the core API surface — learn these first)
```
181  impact.feature.gui.gui
119  impact.feature.gui.base.basic-gui
 88  impact.base.entity
 87  game.feature.menu.gui.menu-misc
 74  impact.base.game
 56  impact.feature.gui.base.box
 54  impact.feature.effect.effect-sheet
 53  impact.base.image
 50  impact.base.event
 46  impact.base.action
 29  game.feature.gui.base.text
 28  impact.base.actor-entity
 25  impact.base.loader
 22  game.feature.gui.base.boxes
 20  game.feature.menu.gui.list-boxes
 19  game.feature.combat.model.combat-params
 17  game.feature.menu.gui.base-menu
 16  game.config
 16  impact.feature.storage.storage
 16  impact.feature.interact.button-interact
 16  game.feature.gui.base.numbers
 16  game.feature.model.base-model
 15  game.feature.model.options-model
 14  impact.feature.interact.gui.focus-gui
 14  game.feature.gui.hud.right-hud
```

---

## 6. Plan going forward

### Phase 1 — Restore names (IN PROGRESS)

**Key finding (Phase 1 proof of concept, `impact.base.timer`):** the entire
`impact.base.*` layer is **already named** — class/method/property names are intact
(`ig.Timer.set/tick/delta`, `ig.WeightTimer`, `ig.TIMER_MODE`, …). Only *local variables*
are minified to `a`/`b`/`c`. So for the base layer, "deobfuscation" = rename locals +
add JSDoc, which is quick and low-risk. The heavy name-mangling only shows up in the
CrossCode `sc.*` / `game.*` layer.

**Progress:** the entire **`impact.*` layer is DONE — 154/154 modules**
(`impact.base.*` 34/34, `impact.feature.*` 120/120) — cleaned and living in
`deobf/clean/`. That covers the whole engine core and every subsystem: gui,
effect, light, weather, camera, bgm, storage, interact, navigation, parallax,
terrain, map-content, dream-fx, env-particles, event-sheet, gamepad, greenworks,
height-map, influencer, lang-edit, map-image, map-sounds, nwf, overlay, rumble,
screen-blur, slow-motion, video, base, database, and the two giant step files
(`action-steps`, `event-steps`). `game.*` (415) is untouched. See
`deobf/PROGRESS.md` for the live checklist.

Clean-output style (see `deobf/clean/impact.base.timer.js`): keep the exact original
logic, rename every single-letter local to a meaningful name, add a `@module`-style
header + JSDoc on every method. Do **not** rewrite or "improve" the code.

1. **ImpactJS base (`impact.base.*`)**: map to public ImpactJS 1.18a source; restore
   class/method/property names and rename `a`/`b`/`c` locals.
2. **Apply the rename map**: write a script that does find/replace across
   `game.compiled.pretty.js` using `simplify/entries.json` (obfuscated → readable).
3. **`game.*` layer**: subsystem by subsystem, starting with `game.main`,
   `game.feature.model.*`, then `combat`, `puzzle`, `menu`.

### Phase 2 — Annotated breakdown
- Split the 569 modules into per-module files, or generate a per-namespace index
  (`game.feature.combat.md`, etc.) summarizing each module's purpose.

### Phase 3 — Tooling
- Central `rename-map.json` + a repeatable deobfuscation pipeline script so renames
  are data-driven, reversible, and version-safe.

---

## 7. Ground rules / conventions

- **Never modify `assets/js/game.compiled.js`.** Always work in sidecar files.
- Renames live in a name-map (data), not hand-edits, so they're repeatable.
- `entries.json` `"hash": "final"` matches **this** game version only — do not assume
  it applies to other versions.
- Generated artifacts (`game.compiled.pretty.js`) are regenerable; prefer tracking the
  *scripts* and *name maps* over huge derived files.

---

## 8. Known issues / gotchas

- **No source map** in `game.compiled.js` — names must be reconstructed manually.
- **Obfuscation is deterministic but the shipped map is partial** — `entries.json`
  only covers a subset of the API; the rest must be inferred from usage.
- **`.zip` files in `assets/mods/` are NOT loaded** — only `.ccmod` files and extracted
  folders are picked up. (`night-mode.zip`, `tilt-shift-mod.zip` are inert.)
- **`ambient-nights` crashes on load**: `ig.game.addons.push is not a function`
  at `poststart.js:259` (pushes to a possibly-undefined `ig.game.addons`).
- **`el-tweaks` music-remix throws**: `Cannot read property 'title' of undefined`.
- **Naming hazard**: some code uses `ig.ENTITY.Npc`, other code/research uses
  `ig.ENTITY.NPC` — verify the exact compiled casing before relying on it.
- **`.gitignore`** currently ignores `/*` and `assets/*` (whitelist pattern). This file
  and the analysis scripts/JSON are whitelisted; the beautified copy is intentionally
  not tracked (too large, regenerable). Note: this folder is **not actually a git
  repository** (there is a `.gitignore` but no `.git` directory), so the whitelist only
  matters once a repo is initialized.

---

## 9. Broader project context (mods, not the focus here)

- **Night Mode mod** is the user's main modding project:
  - `night_mode_plan.md` — full spec (time engine, visuals, audio, world rules, UI).
  - `night_mode_research.js` — greps `game.compiled.js` for API anchors.
  - `assets/mods/night-mode.zip` — WIP mod (v0.1.0), several iterations inside
    (`night-mode.js`, `refactor.js`, `injectHooks.js`, `.bak`, etc.).
  - `assets/mods/ambient-nights/` — separate, more complete day/night + weather mod
    (overlaps heavily with Night Mode).
  - `assets/mods/tilt-shift-mod.zip` — tilt-shift camera mod referenced for integration.
- **Enabled mods** (`mods.json`): `simplify`, `ccloader-version-display`. Many more are
  installed but inactive (see `log.txt`).

---

## 10. Status / next step

- **Clean-output style is confirmed** (see `deobf/clean/impact.base.timer.js`).
- Layout: flat files `deobf/clean/<module.name>.js`; depth: reference (header +
  JSDoc + renamed locals).
- **`impact.*` is DONE (154/154)** — `impact.base.*` (34/34) and
  `impact.feature.*` (120/120). See `deobf/PROGRESS.md`.
- Next: `game.*` (415): `game.main` + `game.feature.model.*` first, then
  `combat`, `puzzle`, `menu`.
- Guardrail (learned the hard way, 2026-08-21): a bulk script that copied raw
  `extract/` bodies into `clean/` with a cosmetic header produced 500 fake
  "deobfuscated" files; they were removed. Only hand-cleaned code belongs in
  `deobf/clean/`.
