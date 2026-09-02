# game.feature.npc — NPCs

> **Status**: stub (pending).

## Modules (8)

`npc.entities.npc-entity`, `npc.entities.npc-runner-entity`,
`npc.entities.npc-waypoint`, `npc.entities.sc-actor`, `npc.gui.npc-display-gui`,
`npc.npc-runners`, `npc.npc-steps`, `npc.plug-in`

## To document

- `sc.NpcEntity` / `sc.SCActor`: scripted actors with waypoint runners,
  face direction, idle animations, interaction prompts.
- `sc.NpcRunner`/`NpcRunnerEntity`: autonomous walking loops.
- NPC ACTION_STEPs (`npc-steps`).
- NPC data in `assets/data/characters/npc/*`
  ([CHARACTER format](../../data/formats/04-character.md)).

## Related

- [party](04-party.md) · [msg](07-msg.md) · [interact](17-interact.md)