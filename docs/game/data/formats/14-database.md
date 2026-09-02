# DATABASE format (`assets/data/database.json`)

> **Status**: core · Boot-time game database (4 MB) loaded by `ig.Database`
> (`ig.database`, [23-database](../../engine/impact/features/23-database.md)).
> Holds the metadata tables the game layer reads at startup — including
> the achievement definitions consumed by `sc.TrophyManager`
> ([achievements](../../engine/game/13-achievements.md)).

## File anatomy

Top-level keys (all tables keyed by string id):

| Table | Content | Consumer |
|---|---|---|
| `achievements` | Trophy definitions: `{track, name, nameCond, description, conds…}` — `track: true` + a `nameCond` stat condition per trophy | `sc.TrophyManager` |
| `areas` | Per-area display metadata (name, map links) | map menu / fast travel |
| `chapters` | Chapter metadata (chapter select, NG+) | `sc.MenuModel` / NG+ |
| `commonEvents` | Common-event definitions | `sc.CommonEvents` |
| `drops` | Drop tables | combat drops |
| `enemies` | Enemy metadata/annotations | enemy display / hunting log |
| `leawords` | Lea's language dictionary ("leawords") | lore/dialogue |
| `lore` | Lore entry definitions | `sc.LoreModel` |
| `names` | Name lookup tables | dialogue/portraits |
| `quests` | Static quest definitions | `sc.QuestModel` |
| `questHubs` | Quest-hub definitions | quest-hub menu |
| `shops` / `traders` | Shop stock + trader definitions | shop/trade menus |
| `toggle-sets` | Toggle-item set definitions (skins) | `sc.PlayerSkinLibrary` |
| `databaseVersions` | Schema version bookkeeping | boot |

## Example entry

```json
"achievements": {
  "story-01": {
    "track": true,
    "name": { "en_US": "Chapter 1 Complete", "de_DE": "Kapitel 1 vollständig", "langUid": 13135 },
    "nameCond": "trophies.triggered.story-01",
    "description": { "en_US": "Completed Chapter 1.", … }
  }
}
```

## Registration model

- The engine `ig.Database` maps **name → editor type** for the Weltmeister
  editor (`ig.database.register(name, editor, displayName)`); the game
  layer registers editors for quests, enemies, achievements, etc. from
  each feature's `plug-in` module.
- Achievement trophies are unlocked by stat conditions (`nameCond` /
  stat-map checks via `sc.StatsModel`, see
  [achievements](../../engine/game/13-achievements.md)).

## Related

- Engine: [impact.feature.database](../../engine/impact/features/23-database.md)
- Consumers: [achievements](../../engine/game/13-achievements.md),
  [quest](../../engine/game/08-quest.md), [trade](../../engine/game/11-trade.md),
  [menu](../../engine/game/05-menu.md)