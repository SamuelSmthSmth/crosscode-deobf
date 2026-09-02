# game.feature.combat — combat engine

> **Status**: stub (pending).

## Modules (45)

`combat.combat`, `combat.combat-action-steps`, `combat.combat-assault`,
`combat.combat-charge`, `combat.combat-event-steps`, `combat.combat-force`,
`combat.combat-poi`, `combat.combat-shield`, `combat.combat-stun`,
`combat.combat-sweep`, `combat.combat-target-event`, `combat.enemy-steps`,
`combat.entities.ball`, `combat.entities.burst-spawner`,
`combat.entities.combatant`, `combat.entities.combatant-marble`,
`combat.entities.combat-proxy`, `combat.entities.drop`,
`combat.entities.enemy`, `combat.entities.enemy-spawner` + more

## To document

- `sc.Combatant`/`sc.EnemyEntity`/`sc.Ball`: HP, guard, element modes,
  melee/ball combat, drops.
- Combat mechanics: charge, assault, sweep, stun, force, POI targeting,
  shields.
- Enemy AI consumption of `assets/data/enemies/*`
  ([ENEMY](../../data/formats/01-enemy.md)) and effects
  ([EFFECT](../../data/formats/03-effect.md)).
- The big game-layer step libraries: `combat-action-steps`, `enemy-steps`,
  `combat-event-steps`.

## Related

- [player](01-player.md) · [impact.feature.effect](../../engine/impact/features/02-effect.md)