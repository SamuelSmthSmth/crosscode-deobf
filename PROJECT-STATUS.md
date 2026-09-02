# PROJECT STATUS — Handoff File

> **Read this first when resuming work.** Written 2026-09-02.
> Git state at time of writing: branch `dev`, working tree **clean**,
> HEAD = `3e279dd` "Documentation part 1" (21 commits, repo initialized 2026-08-21).
> This is a CrossCode (GOG, nw.js/Chromium) install being used as a modding +
> engine-documentation workspace. An Obsidian vault lives at `docs/.obsidian`.

---

## TL;DR — where things stand

| Workstream | Status |
|---|---|
| 1. Engine deobfuscation (`deobf/clean/`) | ✅ **DONE — 569/569 modules** |
| 2. Research docs (`docs/RESEARCH-*.md`, root notes) | ✅ **DONE** (French docs 1–4, English 5–7) |
| 3. Mods | 🟡 Several shipped and enabled; more built but inactive |
| 4. Documentation library (`docs/game/`) | 🔴 **IN PROGRESS — this is the active work** |

**The active task is the `docs/game/` documentation library.** "Documentation
part 1" (commit `3e279dd`, 2026-09-02) built the library skeleton and the
engine pages for the `impact.*` layer. **Documentation part 2** = fill in the
remaining stub pages (see the checklist below).

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
- Root notes: `RENDERING-RESEARCH.md` (resolution/FPS/widescreen),
  `ENGINE-NOTES.md` (general engine notes + conventions),
  `Visuals_to_check.md` (the 5 visual/audio goals that drove research:
  god rays, water refraction, motion blur, parallax+DoF, positional audio),
  `night_mode_plan.md` (Night Mode mod spec),
  `deobf/RENDERING-2.5D-NOTES.md` (2.5D/light/parallax).
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
`.gitignore`): `fps-unlock/` (preload.js sets FPS), `widescreen-mod/`
(preload.js sets `IG_WIDTH` — see RENDERING-RESEARCH.md §4/§5 for the
approach), plus many third-party mods (`el-tweaks`, `cc-menu-ui-replacement`,
`water-fx`, `timewalker`, etc.).

**Gotchas:**
- Only `.ccmod` files and **extracted folders** are loaded — `.zip` files
  (`night-mode.zip`, `tilt-shift-mod.zip`) are inert.
- `el-tweaks` music-remix throws `Cannot read property 'title' of undefined`.
- `.gitignore` whitelists specific paths (root is `/*` ignore); to track a new
  mod you must add a `!assets/mods/<name>/` line.
- Mods must hook via `cc.*` / `sc.*` / `ig.*` + `Class.inject({...})` /
  addons — never raw obfuscated names.

## 4. Documentation library (`docs/game/`) — THE ACTIVE WORK

A structured, cross-linked reference: engine source, data JSON formats,
media layout, repository map. Pages are marked `core` (complete) or `stub`
(pending) in their header AND in the index tables. Obsidian vault.

### ✅ Done (Documentation part 1, commit `3e279dd`)

- **Hub**: `README.md`, `overview.md`, `repository-map.md`,
  `research-notes.md`, `glossary.md` — all `core`.
- **Engine — impact.base.\***: `engine/impact/01-core.md` … `08-global-settings.md` — `core`.
- **Engine — impact.feature.\***: `engine/impact/features/README.md` + all 30
  subsystem pages (01-gui … 30-base) — `core`.
- **Data**: `data/README.md` (folder guide + DOCTYPE taxonomy) — `core`.
  Formats `01-enemy.md` + `02-animation.md` — `core`.

### 🔴 Remaining (Documentation part 2+, in recommended order)

**A. Engine — game.\* pages (biggest chunk).** `engine/game/README.md` plans
**18 pages** (01-player … 18-timers; group table with module counts already
written). Stub files exist for **01–11 only** (player, combat, npc, party,
menu, gui, msg, quest, skills, inventory, trade). Create **12-arena,
13-achievements, 14-puzzle, 15-model, 16-map-content, 17-interact,
18-timers**, then fill all 18 from `deobf/clean/game.feature.*` +
`deobf/PROGRESS.md`. Each page: module table, key `sc.*` classes, behavior,
hooks, ACTION_STEP/EVENT_STEP registrations, cross-links (pattern:
`engine/game/01-player.md` stub → fill it in).

**B. Data format pages.** 12 stub files exist: `data/formats/03-effect.md` …
`14-database.md`. Fill each field-by-field from real files in `assets/data/`,
with examples + pointers to consuming engine code. (Heads-up: `data/README.md`
folder table names some pages `11-settings`, `10-terrain` — reconcile with
`formats/README.md` if the filenames differ.)

**C. Data catalogs.** 9 stub files: `data/catalogs/01-areas.md` …
`09-lang.md` — per-folder content surveys (file → one-line contents tables).

**D. Media pages.** `docs/game/media/` does not exist yet: `README.md` +
folder guide + audio guide (media is ~700 MB: BGM 238 MB, sound 122 MB,
maps 197 MB; see `repository-map.md`).

**E. Mods documentation.** Deliberately deferred — `docs/game/README.md` says
"pending a decision". Decide whether to document `assets/mods/`, `mod-data/`,
`ccloader/`, `mods.json` and un-exclude them from the library.

### When each part lands

- Update the page header status (`stub` → `core`) and the index tables in
  `docs/game/README.md`, `engine/README.md`, `data/README.md`.
- Commit as "Documentation part N".
- Style: prose + module tables; class names authoritative (match
  `deobf/clean/` exactly); every claim cites a module or data file; cross-link
  engine ↔ data ↔ media.

---

## How to continue (next concrete step)

1. Start **Documentation part 2**: fill `docs/game/engine/game/01-player.md`
   (14 modules: `player.entities.player`, `player.player-model`,
   `player.player-steps`, `player.player-level`, `player.player-skin`,
   `player.crosshair-steps`, …). Source: read the cleaned files in
   `deobf/clean/game.feature.player.*` and their entries in
   `deobf/PROGRESS.md`.
2. Work through 02-combat … 18-timers the same way (combat is the biggest:
   45 modules).
3. Create the missing 12–18 stubs first so the index matches the plan, then
   fill in order.
4. Update status tables, commit.

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

- Repo: public-ish local git, branch `dev`, `origin/dev` exists (do not push
  without being asked). 21 commits, all authored 2026-08-21 → 2026-09-02.
- `.freebuff/` holds tooling metadata; `log.txt` / `biglog.txt` / `debug.log`
  are game/mod crash logs (useful when debugging mod load failures).
- Node v26.7.0 available; `npx js-beautify` used on demand.
- The game boots via `package.json` main = `ccloader/index.html` (CCLoader
  v2.25.10). Resolution/FPS globals come from
  `assets/impact/page/php/game.config.php` (`IG_WIDTH=568`, `IG_HEIGHT=320`,
  `IG_GAME_SCALE=2`, `IG_GAME_FPS=60`).