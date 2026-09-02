# Catalog — effects

> **Status**: core · 600+ effect files in `assets/data/effects/`
> (44 top-level + subfolders). DOCTYPE: `EFFECT`.
> Schema: [EFFECT format](../formats/03-effect.md). Played by
> `sc.EffectEntity` / `impact.feature.effect`
> ([02-effect](../../engine/impact/features/02-effect.md)).

## Subfolders (counts)

| Folder | Files | Notes |
|---|---|---|
| `enemies/` | 53 | Per-enemy attack/hit/death effects |
| `puzzle/` | 19 | Puzzle-element effects (compressors, ferro, steam, shields…) |
| `area/` | 13 | Area ambience effects (weather, map ambience) |
| `scene/` | 10 | Cutscene/scene effects |
| `combat/` | 6 | Per-class combat effects (hexacast, pentafist, quadroguard, triblader, mode, dark) |
| `map/` | 11 | Map-placed effects (turrets, chests…) |
| `specials/` | 6 | Special effects |
| `skin-aura/`, `skin-step/`, `skins/` | 2+2+2 | Player-skin aura/step/appearance effects |

## Top-level files (44)

Per-entity effect packs (each holds several named effects):

`ball*.json` (ball bounce/kill/trail/assault per element: cold, heat,
shock, wave, special), `charge.json`, `combat.json`, `combatant.json`,
`default-hit.json`, `drops.json`, `dust.json`, `enemy.json`,
`guard.json`, `marble.json`, `npc.json`, `puzzle.json`,
`teleport.json`, `throw.json`, `trail.json`, `sweeps.json`,
`speedlines.json`, `stepFx.json`, `turret.json`, `weak.json`,
`ar.json`, `arena.json`, `cube-debris.json`, `color_blink.json`,
`color_fade.json`, `sparkle.json`-family, `test.json`, `tfree.json`…

> Each file's `EFFECTS` table is keyed by effect name; combat effects
> carry element/hit metadata that `sc.CombatParams.getDamage` consumes
> ([combat](../../engine/game/02-combat.md)).