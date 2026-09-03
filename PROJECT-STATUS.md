# PROJECT STATUS — Handoff File

> **Read this first when resuming work.** Written 2026-09-02, updated
> 2026-09-03. This is a CrossCode (GOG, nw.js/Chromium) install being used
> as a modding + engine-documentation workspace. An Obsidian vault lives
> at `docs/.obsidian`.

---

## TL;DR — where things stand

| Workstream | Status |
|---|---|
| 1. Engine deobfuscation (`deobf/clean/`) | ✅ **DONE — 569/569 modules** |
| 2. Research docs (`docs/RESEARCH-*.md`, root notes) | ✅ **DONE** |
| 3. Mods | 🟡 Several shipped and enabled; more built but inactive |
| 4. Documentation library (`docs/game/`) | ✅ **DONE — all 95 pages core, no stubs** |

**The documentation library is complete as of 2026-09-03**: all 18
`game.*` engine pages, all 14 data-format pages (+ formats index), all 9
data catalogs, the media section (index + folder guide + audio guide)
and the mods index. Nothing is deferred.

---

## 1. Engine deobfuscation — DONE

- `assets/js/game.compiled.js` (28,819 lines, minified) is the whole game:
  ImpactJS (`ig.*`) + CrossCode (`sc.*`). Beautified copy:
  `assets/js/game.compiled.pretty.js` (regenerable, **not tracked** in git).
- `deobf/clean/` = **569 hand-cleaned, fully-named modules** (154 `impact.*`
  + 415 `game.*`), behavior-identical to the original (verified by token-LCS
  ≥ 0.929 against `deobf/extract/` + `node --check`).
- `deobf/PROGRESS.md` = the cleaning ledger, module-by-module, with key
  classes per module. **This is the primary index into the cleaned source.**
- Tooling in `deobf/`: `verify-lcs.js <module>` (clean vs extract),
  `verify-chunks.js`, `lookup-name.js <query>` (name dictionary search),
  `decrossfuscator/` (reference tooling), `reference/` (old-version name maps).
- Game is **v1.4.2-3**; only local variables were minified (no global rename
  tokens), which is why the whole thing was cleanable by hand.
- **Ground rule: never modify `assets/js/game.compiled.js` or
  `game.compiled.pretty.js`.** Work only in sidecar files.

## 2. Research docs — DONE

- `docs/RESEARCH-1..7`: architecture/rendering/audio (FR), per-feature
  implementation strategy (FR), risks & limits (FR), tools & references (FR),
  camera (EN), other-languages TS/C++ (EN), lighting WASM (EN).
- Root notes: `RENDERING-RESEARCH.md`, `ENGINE-NOTES.md`,
  `Visuals_to_check.md`, `night_mode_plan.md`,
  `deobf/RENDERING-2.5D-NOTES.md`.
- All are indexed/cross-linked from `docs/game/research-notes.md`.

## 3. Mods

**Enabled** (`mods.json`): `simplify`, `ccloader-version-display`,
`dev-overlay`, `lighting-wasm`, `real-shadows`, `wet-floor-reflection`.

**Built by us, tracked in git** (in `assets/mods/`, each with `ccmod.json` +
`poststart.js`/`preload.js`):
- `ambient-nights/` — day/night + weather mod (v1.5.0 line; ⚠️ **crashes on
  load**: `ig.game.addons.push is not a function` at `poststart.js:259` —
  known issue, unfixed)
- `tilt-shift/` — rewritten tilt-shift camera mod (working; has options menu)
- `photo-mode/` — photo mode mod
- `lighting-wasm/` — WASM-accelerated lighting (C++ in `src/lighting.cpp`,
  worker in `worker/`, built via `build/build.sh`, dist in `dist/`)
- `real-shadows/`, `wet-floor-reflection/`, `dev-overlay/`, `positional-audio/`
  — lighting/visual experiments (positional-audio implements goal #5 from
  Visuals_to_check.md)
- `night-mode.zip` — WIP legacy night-mode (superseded by ambient-nights)

**Built but NOT tracked in git and NOT enabled** (still on disk, ignored by
`.gitignore`): `fps-unlock/`, `widescreen-mod/`, plus many third-party mods.

**Gotchas:**
- Only `.ccmod` files and **extracted folders** are loaded — `.zip` files
  (`night-mode.zip`, `tilt-shift-mod.zip`) are inert.
- `el-tweaks` music-remix throws `Cannot read property 'title' of undefined`.
- `.gitignore` whitelists specific paths (root is `/*` ignore); to track a new
  mod you must add a `!assets/mods/<name>/` line.
- Mods must hook via `cc.*` / `sc.*` / `ig.*` + `Class.inject({...})` /
  addons — never raw obfuscated names.

## 4. Documentation library (`docs/game/`) — DONE (2026-09-03)

A structured, cross-linked reference: engine source, data JSON formats,
media layout, repository map. All pages are `core`; a link checker passes
for all 95 pages (0 broken links, 0 `stub (pending)` markers).

### Engine — `impact.*` (core, part 1)

- Hub: `README.md`, `overview.md`, `repository-map.md`, `research-notes.md`,
  `glossary.md`.
- `engine/impact/01-core.md` … `08-global-settings.md` + all 30
  `impact.feature.*` subsystem pages.

### Engine — `game.*` (core, part 2, 2026-09-03)

`engine/game/README.md` group table now links 18 pages, all core:
01-player, 02-combat, 03-npc, 04-party, 05-menu, 06-gui, 07-msg,
08-quest, 09-skills, 10-inventory, 11-trade (filled from stubs) and
12-arena, 13-achievements, 14-puzzle, 15-model, 16-map-content,
17-interact, 18-timers (created new). Each page: module table (module →
key classes → responsibility), behavior, hooks/steps, cross-links —
drawn from `deobf/clean/game.feature.*` headers + `deobf/PROGRESS.md`.

### Data formats (core, part 3, 2026-09-03)

`data/formats/README.md` (new index) + 14 pages. **Corrections found vs.
the original stubs:**
- `global-settings.json` is per-entity default config + ItemDestruct loot,
  **not** "default game options" → covered in `13-misc.md`.
- `terrain.json` = per-tile terrain ids; `tile-infos.json` = per-tile
  solidity/auto-tile metadata → both in `13-misc.md`.
- AREA format is the **area-map** floor data (`AREAS_MAP`: floors, chests,
  defaultFloor), not an area→maps/BGM/weather table (that lives in map
  `attributes` + `database.json`).
- LANG lives in one `lang/sc/` pack (`<category>.<locale>.json`, 18 files);
  most game text is inline localized objects in data files, not lang files.
- Event scripts are **embedded in entity settings** (EventTrigger `event`,
  NPC `script`) — no top-level `eventSheets[]` key in map JSONs.
- Characters come in two shapes (NPCBasic template references vs. full
  animation-sheet characters); player/party definitions (`players/`) add
  class/stats/combat data.
- `item-database.json` = 676 items (EQUIP 274 / TRADE 196 / KEY 102 /
  CONS 66 / TOGGLE 38).

### Data catalogs (core, part 4, 2026-09-03)

`data/catalogs/README.md` + 9 pages (areas, maps, enemies, characters,
animations, effects, props, arena, lang) — per-folder surveys with counts
and notes from live scans (28 areas, 240+ maps, 229 enemies, 443
characters + 15 players, 266 animations, 600+ effects, 61+31 prop sheets,
14 arena cups, 18 lang files).

### Media (core, part 5, 2026-09-03)

`media/README.md` + `media/folder-guide.md` + `media/audio-guide.md`:
~700 MB layout (BGM 238 MB/118 tracks, sound 122 MB/1,174 files, entity,
map, face, gui, font, parallax, concept/pics/tutorials/env), plus the
BGM/SFX naming and playlist/volume-map mechanics.

### Mods documentation (core, part 6, 2026-09-03)

`mods/README.md` — CCLoader/mod-loading model, the tracked mods table
(ambient-nights, tilt-shift, photo-mode, lighting-wasm, real-shadows,
wet-floor-reflection, dev-overlay, positional-audio, night-mode.zip),
the enabled set (`mods.json`) and the third-party mods on disk.

## How to continue

The library is complete; future work options:
1. Any engine deep-dive (e.g. the rendering pipeline) — extend the
   relevant engine page or add a dedicated page under `docs/game/engine/`.
2. Per-mod code walkthroughs under `docs/game/mods/` as needed.
3. `@types/crosscode` TypeScript definitions package (roadmap item in
   `README.md`), generated from `deobf/clean/`.

## Key commands

```bash
git status / git log --oneline -10   # orient
node deobf/verify-lcs.js <module>    # verify a cleaned module vs extract
node deobf/lookup-name.js <query>    # name dictionary lookup
node extract-modules.js              # regenerate engine-manifest.json etc.
node analyze-engine.js               # module tree / fan-in
# source of truth: deobf/clean/<module.name>.js  +  deobf/PROGRESS.md
```

## Environment notes

- Repo: local git, branch `main` (was `dev`; merged), pushed to GitHub.
  Commits 2026-08-21 → 2026-09-03.
- `.freebuff/` holds tooling metadata; `log.txt` / `biglog.txt` /
  `debug.log` are game/mod crash logs (useful when debugging mod load
  failures).
- Node v26.7.0 available; `npx js-beautify` used on demand.
- The game boots via `package.json` main = `ccloader/index.html` (CCLoader
  v2.25.10). Resolution/FPS globals come from
  `assets/impact/page/php/game.config.php` (`IG_WIDTH=568`, `IG_HEIGHT=320`,
  `IG_GAME_SCALE=2`, `IG_GAME_FPS=60`).