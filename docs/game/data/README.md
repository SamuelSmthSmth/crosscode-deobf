# Game data — index & format taxonomy

> Source: `assets/data/` — 2,200+ JSON files across ~20 folders; 808 files
> carry a `DOCTYPE` field that declares their format. Each format has a page
> in [formats/](formats/README.md) and each data folder has a content catalog
> in [catalogs/](catalogs/README.md).

## Folder guide

| Folder / file | Contents | Format page | Catalog |
|---|---|---|---|
| `animations/` | 266 animation definitions (player, NPC, enemies, bosses, pets, props) | [02-animation](formats/02-animation.md) | [catalogs/05-animations](catalogs/05-animations.md) |
| `areas/` | Per-area metadata: name, description, maps, bgm, weather, influences | [09-area](formats/09-area.md) | [catalogs/01-areas](catalogs/01-areas.md) |
| `arena/` | Arena challenge definitions (wave lists, bonuses, enemies) | [13-misc](formats/13-misc.md) | [catalogs/08-arena](catalogs/08-arena.md) |
| `characters/` | Character/player JSONs: attributes, scripts, anims, quests | [04-character](formats/04-character.md) | [catalogs/04-characters](catalogs/04-characters.md) |
| `changelog.json` | Version changelog (latest: 1.4.2 "3rd Anniversary Gift") | [13-misc](formats/13-misc.md) | — |
| `credits/` | Credits screen data | [13-misc](formats/13-misc.md) | — |
| `database.json` | Boot database (editor types, achievements metadata) | [14-database](formats/14-database.md) | — |
| `effects/` | 600+ combat/FX effects (`EFFECT` DOCTYPE) | [03-effect](formats/03-effect.md) | [catalogs/06-effects](catalogs/06-effects.md) |
| `enemies/` | 229 enemy definitions (stats, AI states, actions) | [01-enemy](formats/01-enemy.md) | [catalogs/03-enemies](catalogs/03-enemies.md) |
| `events/` | Shared event-sheet snippets | [07-event-sheet](formats/07-event-sheet.md) | [catalogs/07-events](catalogs/07-events.md) |
| `global-settings.json` | Default game options/settings | [11-settings](formats/11-settings.md) | — |
| `item-database.json` | Item definitions (equipment, consumables, materials) | [10-item-database](formats/10-item-database.md) | — |
| `lang/` | Localized strings (`sc/` = default English) | [12-lang](formats/12-lang.md) | [catalogs/09-lang](catalogs/09-lang.md) |
| `maps/` | 240+ map JSONs (levels, entity layers, event sheets) | [05-map](formats/05-map.md) | [catalogs/02-maps](catalogs/02-maps.md) |
| `parallax/` | Parallax layer definitions per map | [05-map](formats/05-map.md) | — |
| `players/` | Party member/player definitions (apollo, buggy, emilie, glasses…) | [04-character](formats/04-character.md) | [catalogs/04-characters](catalogs/04-characters.md) |
| `props/` | Interactable prop sheets | [08-prop](formats/08-prop.md) | [catalogs/07-props](catalogs/07-props.md) |
| `save-presets/` | New-game preset saves | [11-settings](formats/11-settings.md) | — |
| `scale-props/` | Scalable prop sheets | [08-prop](formats/08-prop.md) | — |
| `skilltree.json` | Skill tree (nodes, prerequisites, costs) | [11-skilltree](formats/11-skilltree.md) | — |
| `terrain.json` | Tileset → per-tile terrain ids | [10-terrain](formats/10-terrain.md) | — |
| `tile-infos.json` | Per-tile metadata (collision, effects) | [10-terrain](formats/10-terrain.md) | — |

## DOCTYPE taxonomy

The 808 DOCTYPE-carrying files break down as (counts from a full scan):

| DOCTYPE | Count | Used by |
|---|---|---|
| `ENEMY` | 229 | `enemies/*` — see [01-enemy](formats/01-enemy.md) |
| `MULTI_DIR_ANIMATION` | 245 | `animations/*` — see [02-animation](formats/02-animation.md) |
| `MULTI_ENTITY_ANIMATION` | 20 | `animations/boss/*` — see [02-animation](formats/02-animation.md) |
| `SIMPLE_ANIMATION` | 1 | `animations/` |
| `EFFECT` | 600+ | `effects/*` — see [03-effect](formats/03-effect.md) |
| others | rest | characters/players/maps carry their own type fields |

> Counts were produced by `node` scans over `assets/data`; re-run
> `tools/` scripts or the commands in [research-notes.md](../research-notes.md)
> to refresh them.

## Cross-links

- Engine consumers: `game.feature.combat` (enemies), `game.feature.player`
  (characters), `ig.EFFECT`/`impact.feature.effect` (effects),
  `impact.base.map` (maps), `ig.animation` (animations) — see
  [engine index](../engine/README.md).
- Data is loaded at boot by `game.loader` / `ig.Loader` (`assets/js/`) —
  paths in JSON are relative to `assets/`.