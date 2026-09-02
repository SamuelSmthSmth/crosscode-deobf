# CHARACTER & PLAYER format (`assets/data/characters/`, `assets/data/players/`)

> **Status**: core · NPC/entity JSONs in `characters/<area>/` and party
> member/player definitions in `players/`. Two shapes exist: **template
> references** (`jsonINSTANCE: "NPCBasic"`) for background NPCs, and
> **full animation-sheet characters** for named characters/creatures.
> Players add combat data on top. Loaded through `game.feature.character`
> (`sc.Character`, `char-templates`).

## 1. Template reference (background NPC)

```json
{ "jsonINSTANCE": "NPCBasic", "name": {"en_US": "Tara", "de_DE": "Tara", "langUid": 1},
  "img": "media/entity/npc/rookie-harbor.png", "x": 288, "y": 240, "face": "maleNormalHair1" }
```

(from `characters/rookie-harbor/man-shop.json`)

| Field | Meaning |
|---|---|
| `jsonINSTANCE` | Editor template type (`NPCBasic`; `general`-style files omit it and carry a full definition instead) |
| `name` | Localized name object (`en_US`, `de_DE`, `fr_FR`, `ja_JP`, `ko_KR`, `zh_CN`, `zh_TW`, `langUid`) |
| `img` | Sprite sheet path (relative to `assets/`) |
| `x`/`y` | Tile position in the sheet |
| `face` | Face/expression index for dialogue portraits |
| `gender`, `sitX/sitY`, `sit2X/sit2Y`, `offlineX/offlineY`, `runSrc/runX/runY` | Optional per-character extras (pose offsets, run animation overrides) |

The NPCBasic variant is resolved to a full character at runtime by the
`NPCBasic` jsonTemplate registration (`game.feature.character.char-templates`).

## 2. Full animation-sheet character

```json
{ "name": "Lea", "size": {"x": 14, "y": 16},
  "animSheet": "media/entity/characters/lea.png", "walkAnimSet": "lea",
  "walkAnims": { … }, "shadow": {"x": 0, "y": 0},
  "configs": { … }, "face": { … } }
```

(from `characters/main/lea.json`)

| Field | Meaning |
|---|---|
| `name` | Character id (used by `sc.Character` lookups) |
| `size` | Collision box `{x, y}` in pixels |
| `animSheet` | Sprite sheet path |
| `walkAnimSet` | Which walk-animation set the character uses (defines the 8-dir walk frames) |
| `walkAnims` | Per-action animation configs (walk/run/idle variants) |
| `shadow` | Shadow offset/scale (`shadowScaleY` in some files) |
| `configs` | Per-state actor configs (normal/battle/aiming…, see `sc.ActorConfig`) |
| `face` | Portrait face definition for dialogue |
| `realname` | Optional real name (party members) |
| `floatHeight`/`floatVariance` | Floating entities (ghosts, hoverbots) |
| `collType`, `zGravityFactor`, `relativeVel`, `terrain`, `soundType` | Physics/movement extras |

## 3. Player / party-member definition (`players/*.json`)

```json
{ "character": "lea", "sheet": "media/entity/characters/lea.png", "headIdx": 0,
  "class": "SPHEROMANCER", "stats": { … }, "combatStyle": "BALANCED",
  "walkAnims": { … }, "autoequip": { … }, "DOCTYPE": "PLAYER",
  "proxies": { … }, "actions": { … }, "skillRanking": { … } }
```

(from `players/lea.json`; same shape for apollo, buggy, emilie, …)

| Field | Meaning |
|---|---|
| `character` | Backing character id (`characters/main/*`) |
| `class` | Combat class (SPHEROMANCER, TRIBELADER, HEXACAST, QUADROGUARD, PENTAFIST…) |
| `stats` | Base stat values (level-1 params) |
| `combatStyle` | AI/combat style for party members |
| `walkAnims` | Walk animation config |
| `autoequip` | Autoequip preferences (which item slots to fill first) |
| `proxies` | Combat proxy setup (ball/melee hitboxes) |
| `actions` | Player action definitions (`sc.PlayerAction` per element) |
| `skillRanking` | Auto-skill preference order (CP budget picks) |

Consumed by `sc.PlayerConfig` ([player](../../engine/game/01-player.md)),
`sc.PartyMemberModel` ([party](../../engine/game/04-party.md)) and
`sc.NpcEntity` ([npc](../../engine/game/03-npc.md)).

## Related

- Animations: [ANIMATION format](02-animation.md)
- Enemies share the attribute/walk-config shape:
  [ENEMY format](01-enemy.md)
- Engine: [player](../../engine/game/01-player.md),
  [npc](../../engine/game/03-npc.md), `game.feature.character`