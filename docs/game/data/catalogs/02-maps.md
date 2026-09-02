# Catalog — maps

> **Status**: core · 240+ map JSONs in `assets/data/maps/`, grouped in
> per-area folders plus test/template maps at the top level. Schema:
> [MAP format](../formats/05-map.md).

## Per-area folders (counts)

| Folder | Maps | Notes |
|---|---|---|
| `rookie-harbor/` | 29 | Harbor maps incl. `north`, `south`, `west`, `east`, inns, `teleporter`, `special/` |
| `autumn/` | 27 | Autumn Rise incl. `guild/` interiors |
| `autumn-fall/` | 13 | Autumn's Fall + path maps |
| `bergen/` | 20 | City maps |
| `bergen-trail/` | 29 | Trail + monastery maps |
| `arid/` | 15 | Arid outskirts |
| `arid-dng/` | 11 | Arid dungeon |
| `heat/` | 22 | Vermillion Wasteland |
| `heat-dng/` | 10 | Heat dungeon |
| `heat-village/` | 6 | Vermillion village |
| `jungle/` | 13 | Jungle outskirts |
| `jungle-city/` | 7 | Jungle compound |
| `cold-dng/` | 7 | Cold dungeon |
| `shock-dng/` | 11 | Shockwave dungeon |
| `wave-dng/` | 4 | Wave dungeon |
| `tree-dng/` | 10 | DLC tree dungeon |
| `final-dng/` | 10 | Final dungeon |
| `rhombus-dng/` | 29 | The tower below the Square |
| `rhombus-sqr/` | 22 | Rhombus Square + interiors |
| `cargo-ship/` | 22 | Chapter-2 ship maps |
| `hideout/` | 8 | The hideout |
| `dreams/` | 29 | Dream-sequence maps (flashbacks, boss dreams) |
| `flashback/` | 11 | Flashback maps |
| `arena/` | 9 | Arena challenge maps |
| `bmt/` | 11 | BMT (battle/training) maps |
| `beach/` | 1 | DLC beach |
| `evo-village/` | 2 | DLC village |
| `forest/` | 21 | Forest area |
| `minigames/`, `path-finding/`, `puzzle-ideas/`, `templates/`, `wm-preview/` | 1–3 | Dev/test maps |

## Top-level test maps

`auto-script-test.json`, `battle-test.json`, `boss-test.json`,
`bounce-test-flo.json`, `cave-cliff-test.json`, `cliff-mod.json`,
`cube-test.json`, `damage-test.json`, `d-link-test.json`, … — engine
feature-test maps (physics, light, weather, enemies). Useful when
experimenting with a single mechanic.

> Each map's `attributes` names its `area`, `mapStyle`, `bgm`, `weather`
> and `map-sounds` (see [MAP format](../formats/05-map.md)).