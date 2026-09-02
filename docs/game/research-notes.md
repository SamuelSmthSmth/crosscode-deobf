# Research Notes Index — the pre-existing docs, mapped

> These documents predate the library. They are authoritative for the topics
> they cover (they go deeper than the library pages). Mixed languages:
> RESEARCH 1–4 French, 5–7 English. Nothing was moved or edited.

## `docs/` folder

| Doc | Language | Topic | Maps to library |
|---|---|---|---|
| [RESEARCH-1 — Architecture interne: rendu & audio](../RESEARCH-1-architecture-rendu-audio.md) | FR | Canvas2D-only truth, exact draw pipeline order, resolution/coordinate spaces, full WebAudio graph, positional audio analysis | [engine/impact/01-core.md](engine/impact/01-core.md), [03-rendering.md](engine/impact/03-rendering.md), [05-audio.md](engine/impact/05-audio.md) |
| [RESEARCH-2 — Implémentation par feature](../RESEARCH-2-implementation-par-feature.md) | FR | Per-feature implementation strategy for the 5 visual goals, real engine hooks | renderer/effect pages |
| [RESEARCH-3 — Risques et limites](../RESEARCH-3-risques-et-limites.md) | FR | Performance budgets, Canvas2D pitfalls (getImageData), anti-patterns | [03-rendering.md](engine/impact/03-rendering.md) |
| [RESEARCH-4 — Outils et références](../RESEARCH-4-outils-et-references.md) | FR | Prior art: installed mods as reference implementations, engine hook table | media/README (mods later) |
| [RESEARCH-5 — Camera](../RESEARCH-5-camera.md) | EN | Camera stack, TargetHandle, bounds, zoom transform, event/action camera steps — **the camera reference** | [engine/impact/features/10-camera.md](engine/impact/features/10-camera.md) |
| [RESEARCH-6 — Other languages: TS/C++](../RESEARCH-6-other-languages-typescript-cpp.md) | EN | Porting considerations outside JS | glossary/misc |
| [RESEARCH-7 — Lighting WASM](../RESEARCH-7-lighting-wasm.md) | EN | Light system internals + WASM acceleration study | [features/08-light.md](engine/impact/features/08-light.md) |

## Root-level notes

| File | Topic |
|---|---|
| `RENDERING-RESEARCH.md` | Resolution/FPS research, rendering pipeline deep-dive |
| `ENGINE-NOTES.md` | General engine notes from the deobfuscation work |
| `Visuals_to_check.md` | The 5 visual/audio feature items that drove RESEARCH 1–4 |
| `night_mode_plan.md` | Design plan of the ambient-nights mod (night tint, weather, clock) |
| `deobf/RENDERING-2.5D-NOTES.md` | 2.5D/z-axis, light, parallax notes |

## Purpose

These are *research* (exploration, hypotheses, mod strategy); the library is
*reference* (what exists, field-by-field). When in doubt, the library cites
the module/file and the research doc that details its internals.