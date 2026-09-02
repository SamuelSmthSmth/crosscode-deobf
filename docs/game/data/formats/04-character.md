# CHARACTER & PLAYER format (`assets/data/characters/`, `assets/data/players/`)

> **Status**: stub (pending).

## Scope

- `characters/` — NPC/entity JSONs: attributes, script (EVENT_STEP list),
  interact prompts, animation references, quest hooks.
- `players/` — party member/player definitions (apollo, buggy, emilie,
  glasses, lea…): stats, anims, walk configs, party roles.
- `characters/main/lea.json` is the playable hero definition.

## To document

- Field reference: `attributes` (hp/mp/attack…), `anims`,
  `walkConfigs`, `script`, `interact`, `quests`, `particleGroups`,
  `voice`, `hitSound`…
- How `sc.CharacterEntity` + `sc.PlayerEntity` consume the file
  ([game: player](../../engine/game/01-player.md),
  [game: npc](../../engine/game/03-npc.md)).
- Menu/battle character data (`char-templates`, `game.feature.character`).

## Related

- Animations: [ANIMATION format](02-animation.md).
- Enemies share the attribute/walk-config shape:
  [ENEMY format](01-enemy.md).