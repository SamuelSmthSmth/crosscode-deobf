# Repository Map — every top-level folder & file

> This is the game installation root. Everything except the nw.js runtime,
> GOG shell files and the git tree is "the game". Mods (`assets/mods/`,
> `assets/mod-data/`, `ccloader/`) are listed for orientation only — they are
> documented separately later.

## Top-level folders

| Path | What it is | Documented in |
|---|---|---|
| `deobf/` | **The deobfuscated engine source** — the primary documentation target | [engine/README.md](engine/README.md) |
| `assets/` | Everything the game loads at runtime: data JSON, media, compiled JS | [data/README.md](../data/README.md), [media/README.md](../media/README.md) |
| `ccloader/` | CCLoader mod-loader shell (`package.json → main`). **Mod infrastructure — excluded for now** | — |
| `lib/` | nw.js shared libraries (libEGL, libffmpeg, libnode, libnw, Vulkan swiftshader…) | repository-map only |
| `locales/` | Chromium locale .pak files (UI strings of the *browser shell*, not game text) | repository-map only |
| `nw/` + `nwjc`, `chromedriver`, `chrome_crashpad_handler`, `minidump_stackwalk` | nw.js runtime binaries | repository-map only |
| `_Redist/`, `__redist/` | GOG redistributable components (VC++ runtime etc.) | repository-map only |
| `.git/`, `.freebuff/` | VCS & tooling | — |

## deobf/ — the engine treasure trove

| Entry | Content |
|---|---|
| `clean/` | **569 cleaned modules**: `impact.base.*` (34), `impact.feature.*` (120), `game.feature.*` (415), 5 top-level `game.*`. The canonical source for all engine docs |
| `extract/` | Raw (still minified) extractions of the same modules — the reference for LCS verification |
| `decrossfuscator/` | Tooling used to clean: `deobf.js`, `forwardmap.js`, `compmap.js`, `mergemap.js`, `rosetta.js`, `mod-lint.js`, `matchers/`, `lib/`, `released-maps/`, plus `mods/` (clean-room mod reference) |
| `reference/` | Extra reference material |
| `PROGRESS.md` | **The cleaning ledger**: per-module annotations with key classes *and* the verification story (token-LCS ≥ 0.929, `node --check`) |
| `verify-lcs.js`, `verify-chunks.js`, `lookup-name.js`, `clean-combat-action-steps.js` | Verification helpers (`node verify-lcs.js <name>` compares clean vs extract) |
| `RENDERING-2.5D-NOTES.md` | Notes on the 2.5D/z-axis rendering, light, parallax |
| `.options-data.inc` | Extract bookkeeping |

## assets/ — runtime data

| Folder | Content | Verified count |
|---|---|---|
| `js/` | `game.compiled.js` (minified, **the original**), `game.compiled.pretty.js`, `cheats.json` | 3 files |
| `game/page/` | `game-base.js`, `game-base.css`, `img/` — the HTML shell page | — |
| `data/` | All game JSON: maps, characters, enemies, animations, effects, areas… | 2,200+ JSON, 808 with DOCTYPE |
| `media/` | Sprites, tile maps, faces, fonts, GUI art, parallax, sound, BGM, tutorials, concept art | 13 top-level folders, ~700 MB (BGM 238 MB, sound 122 MB, maps 197 MB in data) |
| `impact/` | `page/` + `webworker/` — ImpactJS runtime HTML/assets (worker for image decoding) | — |
| `extension/` | DLC/post-game content folders (fish-gear, manlea, ninja-skin, scorpion-robo, snowman-tank, flying-hedgehag, post-game) | — |
| `modules/` | Bundled greenworks (Steam) variants: 0.4.0 / 0.5.3 / 0.13.0 / nw-0.35 | — |
| `node-webkit.html` | Legacy shell page artifact | — |
| `mods/`, `mod-data/` | Installed mods + CCModManager data. **Excluded for now** | — |

## Root files

| File | What it is |
|---|---|
| `package.json` | nw.js app manifest: `main: ccloader/index.html`, window 1136×640, chromium-args |
| `resources.pak` | nw.js runtime resources (Chromium's own, not the game's PAK) |
| `icudtl.dat`, `nw_100_percent.pak`, `nw_200_percent.pak`, `v8_context_snapshot.bin`, `webcache.zip` | Chromium runtime files / cached web data |
| `steam_appid.txt` | Steam App ID file (Steam DRM integration) |
| `goggame-*.info`, `goggame-*.hashdb` | GOG Galaxy DRM manifests |
| `Launch CrossCode.lnk`, `credits.html`, `EULA.txt`, `favicon.png` | Shell/legal/credit files |
| `engine-manifest.json` | Module manifest extracted from `game.compiled.js` (name, requires, byte offset) |
| `engine-summary.json` | Totals: 569 modules, 154 impact / 415 game |
| `engine-tree.txt` | Human-readable module dependency tree |
| `analyze-engine.js`, `extract-modules.js`, `extract-module.js` | Tools used to slice `game.compiled.js` into the extracts |
| `mods.json` | Mod list metadata (CCModManager) |
| `docs/` | **The research docs** — indexed in [research-notes.md](research-notes.md) |
| `log.txt`, `biglog.txt`, `debug.log` | Runtime captures used during research |
| `night_mode_plan.md`, `night_mode_research.js` | Scratch material from the ambient-nights mod experiments |
| `RENDERING-RESEARCH.md`, `ENGINE-NOTES.md`, `Visuals_to_check.md` | Root-level research notes — see research-notes.md |

## Where is the actual game content?

- Scripts/engine → `assets/js/game.compiled.js` (minified) ⇄ `deobf/clean/` (cleaned docs-grade copy).
- Maps → `assets/data/maps/**/*.json` (structure + entities) + `assets/media/map/*.png` (tiles + baked layers).
- Audio → `assets/media/sound/**` (SFX) + `assets/media/bgm/**` (music).
- Text/localization → `assets/data/lang/**` and `assets/data/characters/**` name/desc fields.