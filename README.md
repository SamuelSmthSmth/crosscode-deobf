# CrossCode Engine Deobfuscation Project

A complete, hand-cleaned, readable reference of the **CrossCode** game engine
(v1.4.2-3), reverse-engineered from the shipped compiled bundle, plus the
developer tooling built from it: a **symbol map** for demangling stack traces
and (planned) a **`@types/crosscode`** TypeScript definitions package.

> **What this is:** modding / interoperability tooling and reference material.
> It does **not** contain the game itself, its assets, or its original compiled
> source. CrossCode and all game code are © **Radical Fish Games** — see
> [LICENSE.md](LICENSE.md).

---

## The deobfuscation work

`assets/js/game.compiled.js` is the entire game in one 4.7 MB, 28,819-line
minified bundle (ImpactJS base + engine features + CrossCode game, 569 modules).
This project reverses it **without touching the original**:

| Artifact | Description |
|---|---|
| `deobf/clean/` | **569 hand-cleaned, fully-named module files** — the main deliverable. Every single-letter local restored to a meaningful name, JSDoc on every method, original logic kept byte-for-byte (verified behavior-identical). |
| `deobf/extract/` | 569 raw module bodies extracted from the compiled bundle (beautified only). |
| `deobf/reference/` | decrossfuscator name dictionaries (`1.0.3-4.map`, `nhc.map`, `0.7.0.map`) — used as a canonical readable-name dictionary. |
| `deobf/decrossfuscator/` | [20kdc/decrossfuscator](https://github.com/20kdc/decrossfuscator) (CC0) tooling clone. |
| `deobf/PROGRESS.md` | Live per-module completion checklist (569/569 ✅). |
| `engine-tree.txt` | Full hierarchical module tree + dependency fan-in analysis. |
| `engine-manifest.json` | All 569 modules: `{name, requires[], offset}`. |
| `ENGINE-NOTES.md` | Handoff notes for AI agents / future work on this project. |
| `deobf/RENDERING-2.5D-NOTES.md` | Deep-dive writeup of the Canvas2D 2.5D rendering model (cube sprites, z-levels, light/shadow, parallax, camera). |

**Key finding:** this build is v1.4.2-3 and was already deobfuscated by Radical
Fish at the *property/class* level — only **local variables** are minified to
`a`/`b`/`c`/… So `impact.*` and `game.*` class/method/property names are intact;
the work is renaming locals + documenting, which is why the cleaned code stays
behavior-identical and verifiable.

---

## Developer tooling

### `symbol-map.json` — demangle minified stack traces

The minifier reuses short tokens (`a`, `b`, `c`, …) in every scope, so a crash
in `game.compiled.js` produces useless names. `symbol-map.json` translates them
back to the clean names from `deobf/clean/`:

```jsonc
{
  "game": "CrossCode 1.4.2-3",
  "modules": {
    "impact.base.timer": {
      "a": { "target": 5, "weight": 5, "now": 2, "actualTick": 2 },
      "b": { "compensate": 2, "duration": 2, "mode": 2 }
    }
  }
}
```

`modules[moduleName][minifiedName]` → `{ readableName: occurrenceCount }`,
sorted by count. The same token is reused across scopes, so the top entry is
the best guess for any given occurrence. Tools like CCLoader can use this map
to pretty-print readable stack traces for mod crashes.

Regenerate with:

```bash
node build-symbol-map.js          # all 569 modules → symbol-map.json
node build-symbol-map.js <module> # just one module (debug)
```

The generator aligns each raw extract with its cleaned counterpart via chunked
LCS traceback and only records *unambiguous* single-token identifier swaps, so
the map is noise-free.

### Name dictionary lookup

```bash
node deobf/lookup-name.js <query>   # search decrossfuscator maps, both directions
```

### Verification (the cleaned code is behavior-identical, checked)

```bash
node deobf/verify-lcs.js <module>...    # token-stream LCS ratio (≥ 0.9 required)
node deobf/verify-chunks.js <module>    # chunked LCS for the big modules
```

### Engine structure scripts

```bash
node extract-modules.js   # engine-manifest.json + engine-summary.json
node analyze-engine.js    # engine-tree.txt + console summary
node extract-module.js <module> [--all] # extract module bodies to deobf/extract/
```

---

## Using this to write mods

The cleaned reference is documentation-first: read `deobf/clean/<module>.js` to
understand any subsystem. Key entry points:

- `deobf/clean/game.main.js` — `sc.CrossCode` (the game class), startup flow
- `deobf/clean/game.feature.model.*` — `sc.GameModel`, `sc.OptionModel`
- `deobf/clean/game.feature.player.entities.player.js` — the player entity
- `deobf/clean/impact.feature.gui.gui.js` — the whole GUI system (`ig.GuiHook`, `ig.GuiElementBase`)
- `deobf/clean/impact.feature.light.light.js` — the light/shadow system
- `deobf/clean/impact.feature.base.action-steps.js` / `event-steps.js` — all step classes

Mods hook the engine through `ig.Class.inject({...})` and the `sc.*`/`ig.*` API
surface; the `assets/mods/simplify/` mod (v2.14.3) provides a runtime `cc.*`
compat alias tree on top of it.

---

## Status & roadmap

- ✅ Phase 0 — beautify + extract: 569 modules, manifest, tree
- ✅ Phase 1 — restore names: **569/569 modules cleaned** (`impact.*` 154/154, `game.*` 415/415)
- ✅ Phase 3 (partial) — tooling: `symbol-map.json` + generator
- 🔜 `@types/crosscode` TypeScript definitions package (generated from `deobf/clean/`)
- 🔜 Position-level source map (requires the local `assets/js/game.compiled.js`)
- 🔜 Community writeups (engine architecture, `ig.GameAddon` draw order)

---

## Legal

CrossCode and its engine are the intellectual property of **Radical Fish Games**
(published by Deck13). This repository contains only reverse-engineered
reference material and tooling produced for interoperability, modding support,
and education. It is not affiliated with or endorsed by Radical Fish Games.

See [LICENSE.md](LICENSE.md) for the full terms of the tooling vs. reference
material.
