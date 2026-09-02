# game.feature.player — the player

> **Status**: stub (pending).

## Modules (14)

`player.crosshair-steps`, `player.entities.crosshair`, `player.entities.player-base`,
`player.entities.player`, `player.entities.player-pet`, `player.item-consumption`,
`player.modifiers`, `player.player-config`, `player.player-level`,
`player.player-level-notifier`, `player.player-model`, `player.player-skin`,
`player.player-steps`, `player.plug-in`

## To document

- `sc.PlayerEntity`: movement (8-dir + dodge + jump), combat input wiring
  (combat engine), `PlayerBase`/`PlayerPet`.
- Player model: stats, level curve, modifiers, item consumption.
- Skins (`player-skin`), crosshair, camera & light hooks.
- Player ACTION_STEPs (`player.player-steps`).

## Related

- [combat](02-combat.md) · [engine: camera](../../engine/impact/features/10-camera.md) ·
  [CHARACTER format](../../data/formats/04-character.md)