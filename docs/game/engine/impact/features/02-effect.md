# impact.feature.effect — the effect/particle system

> **Status**: core · Modules: `impact.feature.effect.effect-sheet`,
> `impact.feature.effect.effect-steps`, `impact.feature.effect.entities.effect`,
> `impact.feature.effect.entities.effect-particle`,
> `impact.feature.effect.entities.effect-previewer`,
> `impact.feature.effect.fx.fx-*` (9 files), `impact.feature.effect.plug-in`.
> Data: `assets/data/effects/` (158 EFFECT files) — see
> [EFFECT format](../../../data/formats/03-effect.md).

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `effect.effect-sheet` | `ig.EffectSheet` (JSON template) | Parses EFFECT JSON files into runnable effect defs |
| `effect.entities.effect` | `ig.ENTITY.Effect` | The runner entity: spawns particles/FX, drives the sheet's steps |
| `effect.entities.effect-particle` | `ig.EffectParticle`/particle runners | Instanced particles: pos/vel/alpha/rotation interpolation |
| `effect.entities.effect-previewer` | `ig.EffectPreviewer` | Editor preview of effect sheets |
| `effect.fx.fx-basic` | `ig.FxBasic` | Primitive draw helpers (rect/circle/line primitives) |
| `effect.fx.fx-box` | `ig.FxBox` | Box/directional FX (wipes, beams) |
| `effect.fx.fx-circle` | `ig.FxCircle` (expanding circle FX — impacts/explosions) | |
| `effect.fx.fx-color` | `ig.FxColor` | Solid color FX (flashes, fills) |
| `effect.fx.fx-homing` | `ig.FxHoming` | Homing projectile FX |
| `effect.fx.fx-light` | `ig.FxLight` | Additive light FX (glows) |
| `effect.fx.fx-line` | `ig.FxLine` / line FX (lasers, sweeps) | |
| `effect.fx.fx-rhombus` | `ig.FxRhombus` | Rhombus-shaped FX (CrossCode signature shapes) |
| `effect.fx.fx-wipe` | `ig.FxWipe` | Wipe/transition FX |
| `effect.effect-steps` | `ig.EffectStepBase` + step types | Effect sheet step execution (time runs, particle emitters) |
| `effect.plug-in` | — | Registers `ig.effect*` addon bits + editor |

## How an EFFECT sheet drives FX

`assets/data/effects/<name>.json` (DOCTYPE `EFFECT`, 158 files) defines:

- sheet structure (`time`, steps: spawn particles, move, fade, colorize…),
- particle emitters (`ParticleState`/`ParticleHandle`-style configs: count,
  lifetime, spread, velocity jitter),
- attached FX (the `fx.*` primitives above: circles, lines, rhombi…).

`ig.ENTITY.Effect` runs a sheet at a map position/z, spawning
`ig.EffectParticle` entities; combat HUD/statuses, item usage, environment
(leaf puffs, dust) all route through here.

## Consumers (game layer)

- Combat: hit FX (`default-hit`, `combat.json`), charge, sweeps, trails,
  drops, marble/dust FX (`assets/data/effects/combat/`, `…/enemies/`)
- Player: step FX, skin auras (`skin-aura`, `skin-step`, `skins/`) — consumed
  by `game.feature.player.player-skin`
- Puzzles/scenes: `puzzle.json`, `scene/`, `specials/`
- Effect **files index**: [catalogs/06-effects.md](../../../data/catalogs/06-effects.md) (stub)