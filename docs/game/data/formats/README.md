# Data formats — index

> **Status**: core · One page per JSON format under `assets/data/`.
> Pages document the real field structure of live files, with examples
> and pointers to the engine code that consumes each format. The folder
> → format mapping lives in [data/README.md](../README.md). Use the [agent
> reference](../../agent-reference.md) for terminology and data guardrails.

## Format workflow

1. Identify the owning loader and exact `DOCTYPE` (if present).
2. Copy the shape of a nearby live file; do not infer optional fields from a
   different template or entity type.
3. Preserve ids, localized objects, enum spelling, and path roots relative to
   `assets/`.
4. Validate through the consuming subsystem and test a representative map,
   menu, event, or save depending on the format.

| # | Format | Files | DOCTYPE | Engine consumer |
|---|---|---|---|---|
| 01 | [ENEMY](01-enemy.md) | `enemies/*.json` (229) | `ENEMY` | `game.feature.combat` ([combat](../../engine/game/02-combat.md)) |
| 02 | [ANIMATION](02-animation.md) | `animations/**/*.json` (266) | `MULTI_DIR_ANIMATION` / `MULTI_ENTITY_ANIMATION` / `SIMPLE_ANIMATION` | `ig.AnimationSheet` |
| 03 | [EFFECT](03-effect.md) | `effects/**/*.json` (600+) | `EFFECT` | `impact.feature.effect` ([02-effect](../../engine/impact/features/02-effect.md)) |
| 04 | [CHARACTER & PLAYER](04-character.md) | `characters/**`, `players/*.json` | — (template types) | `game.feature.character` |
| 05 | [MAP](05-map.md) | `maps/**/*.json` (240+) | `MAP` | `ig.Map` ([04-maps](../../engine/impact/04-maps.md)) |
| 06 | [ACTION_STEP](06-action-steps.md) | (registry, not a file) | — | `ig.Action` ([07-events](../../engine/impact/07-events.md)) |
| 07 | [EVENT SHEET](07-event-sheet.md) | embedded in maps + `events/*.json` | `EVENTS` | `ig.EventSheet` ([04-event-sheet](../../engine/impact/features/04-event-sheet.md)) |
| 08 | [PROP](08-prop.md) | `props/*.json`, `scale-props/*.json` | `PROP_SHEET` | `ig.ENTITY.Prop` ([17-map-content](../../engine/impact/features/17-map-content.md)) |
| 09 | [AREA](09-area.md) | `areas/*.json` | `AREAS_MAP` | `sc.AreaLoadable` / `menu.map-area` |
| 10 | [ITEM DATABASE](10-item-database.md) | `item-database.json` | — | `game.feature.inventory` ([inventory](../../engine/game/10-inventory.md)) |
| 11 | [SKILLTREE](11-skilltree.md) | `skilltree.json` | `SKILLTREE` | `game.feature.skills` ([skills](../../engine/game/09-skills.md)) |
| 12 | [LANG](12-lang.md) | `lang/*/<category>.<locale>.json` | `STATIC-LANG-FILE` | `ig.LangLabel` ([01-core](../../engine/impact/01-core.md)) |
| 13 | [MISC](13-misc.md) | `global-settings.json`, `terrain.json`, `tile-infos.json`, `changelog.json`, `credits/`, `arena/`, `save-presets/`, `parallax/` | various | `ig.GlobalSettings`, `ig.Terrain`, `ig.TileInfoList`, `sc.Arena`, … |
| 14 | [DATABASE](14-database.md) | `database.json` | — | `ig.Database` ([23-database](../../engine/impact/features/23-database.md)) |

> Reconcile note: `data/README.md`'s folder table refers to some of these
> by older names (`11-settings`, `10-terrain`); the canonical page numbers
> are the ones above. `global-settings.json`, `terrain.json` and
> `tile-infos.json` are covered under [13-misc](13-misc.md).