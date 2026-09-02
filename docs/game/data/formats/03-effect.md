# EFFECT format (`assets/data/effects/**/*.json`)

> **Status**: stub (pending).

## Scope

- 600+ files, one per effect; DOCTYPE: `EFFECT`.
- Effects are the data-driven FX used by combat, items and environment:
  particle bursts, projectiles, elemental hits, heals, screen FX
  (rumble via `EFFECT_ENTRY.RUMBLE`, light via `EFFECT_ENTRY.LIGHT`…).

## To document

- Full field reference: `baseElement`, `targetAlignment`, `hitType`,
  `damageFactor`, `hitStun`, `hurtbox`/`hitbox` setup, `parts[]`/FX
  entries (`EFFECT_ENTRY.*`: PARTICLE, SPAWN, RUMBLE, CLEAR_RUMBLE,
  LIGHT, …).
- How `sc.EffectEntity` (`game.feature.effect`) instantiates and plays an
  effect.
- Element interaction (weakness/absorption), combo system (elemental
  burst), and `assets/data/effects/` folder layout.

## Related

- Engine: [impact.feature.effect](../../engine/impact/features/02-effect.md).
- Animations: [ANIMATION format](02-animation.md) (effect sprites).