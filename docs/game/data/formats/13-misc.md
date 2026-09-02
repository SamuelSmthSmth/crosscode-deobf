# MISC data formats (`global-settings.json`, `terrain.json`, `tile-infos.json`, `changelog.json`, `credits/`, `arena/`, `save-presets/`, `parallax/`)

> **Status**: core · The smaller/boot-time data files without a dedicated
> page. Each has its own shape; this page documents them all.

## `global-settings.json` — per-entity default config

```json
{ "ItemDestruct": { "AutumnPlant1": {} },
  "ENTITY": { "ItemDestruct": { "AutumnPlantA": { "desType": "AutumnPlantA",
      "items": [ {"id": "91", "prob": 0.5}, {"id": "92", "prob": 0.2} ],
      "_globalSettingKey": "AutumnPlantA" } } } }
```

| Key | Meaning |
|---|---|
| `ENTITY.<Type>` | Default attribute overrides merged onto entities of that type at spawn (shadow, weight, collType…) |
| `ItemDestruct` | Item-dropping destructible settings: per-type `{items: [{id, prob}], …}` loot tables ([puzzle](../../engine/game/14-puzzle.md)) |

Consumed by `ig.GlobalSettings` (SingleLoadable) —
[08-global-settings](../../engine/impact/08-global-settings.md).

## `terrain.json` — per-tile terrain ids

Keyed by tileset PNG path → flat array of per-tile terrain ids
(one entry per tile index; ids per `ig.TERRAIN` in `game.config` —
NORMAL=1, METAL, GRASS, WATER, ICE, QUICKSAND, SPIDERWEB, HOLE…).
Consumed by `ig.Terrain`
([15-terrain](../../engine/impact/features/15-terrain.md)).

## `tile-infos.json` — per-tile metadata

Keyed by tileset PNG path → `{settings, autoTiles}` — solidity /
one-way / slope / animation metadata per tile, plus terrain auto-tiling
rules (variations + joined tiles for the terrain patterns). Consumed by
`ig.TileInfoList`/`ig.TileInfo`
([04-maps](../../engine/impact/04-maps.md)).

## `changelog.json` — version history

```json
{ "changelog": [ { "name": "3rd Anniversary Gift", "version": "1.4.2",
                   "date": "21.09.2021", "fixes": [ … ], "features": [ … ] } ] }
```

Consumed by `sc.Version`/the changelog menu (`version.gui.changelog-gui`).

## `credits/*.json` — credits sections

One file per credits block (backers, beta-tester, radicalfish-core,
npc-dialogs, end…). Consumed by `sc.CreditsManager` +
`credits.gui.credits-gui` ([credits](../../engine/game/05-menu.md)-adjacent).

## `arena/*.json` — arena cups

```json
{ "core": { "type": "SOLO_CUP", "name": {…localized…}, "info": {…}, "creator": {…} },
  "rounds": [ … ] }
```

Cup type: `SOLO_CUP`, `TEAM_CUP`…; `rounds` = wave lists, enemies,
bonuses, challenges. Consumed by `sc.CupAsset`/`sc.Arena`
([arena](../../engine/game/12-arena.md)).

## `save-presets/*.json` — new-game presets

```json
{ "title": {…}, "sub": {…}, "savefile": { … full save state … } }
```

Title-screen \"Continue at…\" checkpoint slots
(`sc.SavePreset`, `game.feature.save-preset`).

## `parallax/*.json` — parallax layers

```json
{ "cancelSkip": true, "blockSkip": true,
  "entries": [ { "name": "three", "gfx": "media/parallax/countdown/final-countdown.png",
                 "src": {"x": 0, "y": 0, "w": 64, "h": 64},
                 "align": {"x": "CENTER", "y": "CENTER"} } ] }
```

Full-screen parallax/animated sequences (logo, countdown, cutscene
backdrops). Consumed by `ig.Parallax`
([14-parallax](../../engine/impact/features/14-parallax.md)).

## Related

- Boot files & loadables: [01-core](../../engine/impact/01-core.md)
- Arena cups: [arena](../../engine/game/12-arena.md)