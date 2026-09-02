# CrossCode — Game Documentation Library

> A structured, cross-linked reference for the **entire game**: engine source
> (`deobf/clean/`, 569 modules), every data JSON format (`assets/data/`), the
> media layout (`assets/media/`) and the repository itself.
>
> Language: English. Status of each page is marked `core` (complete)
> or `stub` (pending). Last verified: 2026-09-02.

---

## Library map

| Section | Page | Status |
|---|---|---|
| 📌 Hub | [Repository map](repository-map.md) — every folder/file at repo root | core |
| 📌 Hub | [Overview](overview.md) — what CrossCode is, tech stack, boot, coordinates | core |
| 📌 Hub | [Research notes index](research-notes.md) — the pre-existing docs, linked | core |
| 📌 Hub | [Glossary](glossary.md) — ImpactJS/CrossCode terms | core |
| ⚙️ Engine | [Engine index](engine/README.md) — layering, module counts, link table | core |
| ⚙️ Engine | [impact.* — base](engine/impact/01-core.md) … [08-global-settings](engine/impact/08-global-settings.md) | core |
| ⚙️ Engine | [impact.feature.* — 30 subsystem docs](engine/impact/features/README.md) | core |
| ⚙️ Engine | [game.* — 415-module layer](engine/game/README.md) | core |
| 💾 Data | [Data index + DOCTYPE taxonomy](data/README.md) | core |
| 💾 Data | [ENEMY format](data/formats/01-enemy.md) · [ANIMATION format](data/formats/02-animation.md) | core |
| 💾 Data | [Formats index](data/formats/README.md) — 14 format pages (enemy, animation, effect, character, map, steps, event, prop, area, items, skilltree, lang, misc, database) | core |
| 💾 Data | [Catalogs index](data/catalogs/README.md) — 9 folder surveys (areas, maps, enemies, characters, animations, effects, props, arena, lang) | core |
| 🎨 Media | [Media index](media/README.md) + [folder guide](media/folder-guide.md) + [audio guide](media/audio-guide.md) | core |
| 🧩 Mods | [Mods index](mods/README.md) — CCLoader, mods.json, tracked + third-party mods | core |

## How to read this library

1. **Start with [overview.md](overview.md)** — what the game *is* technically.
2. **Engine pages** document each subsystem of `deobf/clean/`: the module table
   lists every module a page covers with its key classes and one-line
   responsibility, then the prose explains behavior, hooks and registered
   event/action steps.
3. **Data format pages** document a JSON `DOCTYPE` field-by-field, with real
   examples from `assets/data/` and pointers to the engine code that consumes
   the format.
4. **Cross-links** connect engine ↔ data ↔ media: e.g. the ENEMY format page
   links to the combat engine docs, and vice-versa.

## Source of truth

- **Engine code**: `deobf/clean/` — 569 hand-cleaned modules
  (154 `impact.*` + 415 `game.*`), verified behavior-identical to the minified
  `assets/js/game.compiled.js` (see `deobf/PROGRESS.md`, token-LCS ≥ 0.929).
- **Game data**: `assets/data/` — 2,200+ JSON files (808 carry a `DOCTYPE`).
- **Media**: `assets/media/` — sprite sheets, maps, audio, fonts.
- **Legacy research**: `docs/RESEARCH-*.md` and the root notes — linked from
  [research-notes.md](research-notes.md); they remain authoritative where they
  cover a topic in more depth (rendering pipeline, camera, audio internals).

## Out of scope

- Binary runtimes (`nw/`, `lib/`, `locales/*.pak`, `resources.pak`) — one-line
  mentions in the repository map only.
- Mod internals are covered at a high level in [mods/](mods/README.md);
  per-mod code walkthroughs can be added there as needed.