# Mods — index

> **Status**: core · CrossCode mods run through **CCLoader**
> (`assets/impact/` hook, `ccloader/` is the CCLoader app shell; boot via
> `package.json` main = `ccloader/index.html`, CCLoader v2.25.10). Mods
> live in `assets/mods/` and are enabled in `mods.json`. They hook the
> engine through `cc.*` / `sc.*` / `ig.*` + `Class.inject({...})` /
> `ig.GameAddon` — never raw obfuscated names.

## How loading works

- **Enabled mods** are listed in `mods.json` (an array of mod ids). Only
  mods in that list are loaded — presence in `assets/mods/` is not enough.
- **Packaging**: both `.ccmod` zips and **extracted folders** load;
  bare `.zip` files (e.g. `night-mode.zip`, `tilt-shift-mod.zip`) are
  **inert**.
- **Manifest**: each mod has `ccmod.json` (`id`, `version`, `title`,
  `description`, `dependencies`, optional `prestart`/`poststart`/
  `preload` script entries). Scripts hook the game at boot.
- **`assets/mod-data/`** holds loader-side assets (`CCModManager`,
  `cc-vim`); `ccloader/` is the CCLoader app itself.
- `.gitignore` whitelists specific mod paths (root is `/*` ignore); to
  track a new mod, add `!assets/mods/<name>/` — this is why many mods on
  disk are untracked.

## Our mods (tracked in git, in `assets/mods/`)

| Mod | Version | Status | What it does |
|---|---|---|---|
| `ambient-nights/` | 1.6.0 | ⚠️ crashes on load | Vanilla-plus day/night + dynamic weather, rebuilt on the engine light-map/weather systems. Known issue: `ig.game.addons.push is not a function` at `poststart.js:259` (unfixed) |
| `tilt-shift/` | 1.2.0 | ✅ working | 2.5D diorama blur between world and HUD via GameAddon draw hooks; settings in Options > Video |
| `photo-mode/` | 1.0.0 | ✅ working | Freeze world + free camera (F12; WASD pan, Q/E zoom, R reset) |
| `lighting-wasm/` | 0.1.0 | ✅ works w/ JS fallback | C++→WASM lighting compute in a Web Worker mirroring `ig.Worker`; radial-light + night-composite kernels |
| `real-shadows/` | 1.0.0 | ✅ working | Projected silhouette shadows replacing blob shadows (player, NPCs, party, pets, combatants) |
| `wet-floor-reflection/` | 0.1.0 | ✅ working | Screen-space reflections for rainy floors (Basin Keep): lit-frame capture + mirror with rain ripples |
| `dev-overlay/` | 1.2.0 | ✅ working | F3 HUD + diagnostic visuals (telemetry, zebra stripes, depth wireframes, water masks) + [6] dev cheat |
| `positional-audio/` | 1.0.0 | built, not enabled | 2.5D positional audio (distance + stereo panning) via WebAudio PannerNode — implements goal #5 of `Visuals_to_check.md` |
| `night-mode.zip` | WIP | inert zip | Legacy night-mode, superseded by ambient-nights |

## Enabled mods (`mods.json`)

`simplify` (v2.14.3, CCLoader compat/library), `ccloader-version-display`
(v1.1.3), `dev-overlay`, `lighting-wasm`, `real-shadows`,
`wet-floor-reflection`. The others are built but not enabled.

## Third-party mods on disk (untracked, mostly `.ccmod`)

`arcane-lab`, `Boki_Colors`, `cc-alybox`, `cc-combo-weapons`,
`cc-fancy-crash`, `cc-menu-ui-replacement`, `ccmodmanager`, `cheats`,
`element-hair`, `el-tweaks` (⚠️ music-remix throws
`Cannot read property 'title' of undefined`), `extendable-severed-heads`,
`fps-unlock`, `input-api`, `item-api`, `jetpack`, `junolea`,
`load-from-pause`, `lub-dungeon-skip`, `modifier-api`, `Named-Saves`,
`nax-ccuilib`, `player-clone`, `qt-restart-from-pause`, `timewalker`,
`tips-and-tricks`, `visual-overhaul`, `water-fx`, `widescreen-mod`,
`xenons-playable-classes`, `yoshi-open-circuits` — plus `cc-quickinfo-exp`,
`cc-remastered-melodies`, `cc-spacebar-dialogue`, `cc-staircase-effect-fix`,
`extension-asset-preloader`, `cc-quickinfo-exp`. `fps-unlock/` and
`widescreen-mod/` are preload-based (see `RENDERING-RESEARCH.md` §4/§5).

## Related

- [repository-map.md](../repository-map.md) (asset layout)
- [overview.md](../overview.md) (boot flow: CCLoader → game)
- Engine hooks used by mods: [game.* pages](../engine/game/README.md),
  [impact.feature.* pages](../engine/impact/features/README.md)