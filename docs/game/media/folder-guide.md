# Media — folder guide

> **Status**: core · The full `assets/media/` tree with notes per folder.
> All paths are relative to `assets/` in the data JSONs.

## `bgm/` — music (238 MB, 118 files)

Flat folder of OGG tracks: `mu<Name>.ogg` / `mu<Name>-i.ogg` (loop and
intro-loop variants), plus jingles (`ability-got.ogg`, `lolfanfare.ogg`,
`disco-*.ogg`) and the `evo-lab/` DLC subfolder. Map/area → track
resolution happens in `game.feature.bgm.playlist`
([audio guide](audio-guide.md)).

## `sound/` — sound effects (122 MB, 1,174 files)

Themed subfolders:

| Folder | Contents |
|---|---|
| `arena/` | Arena crowd, coins, medals, round sounds |
| `background/` | Ambient loops per area (harbor, forest, dungeon…) |
| `battle/` | Combat SFX: hits, guards, throws, element balls |
| `boss/` | Boss-specific sounds |
| `designer/` | Editor/settings sounds |
| `drops/` | Item/EXP/coin drop pickups |
| `environment/` | Map ambience (water, wind, machines) |
| `hud/` | Menu/HUD blips and toasts |
| `menu/` | Menu navigation sounds |
| `misc/` | Misc UI sounds |
| `move/` | Footsteps, jumps, dashes, landings |
| `puzzle/` | Puzzle element sounds (switches, platforms, steam…) |
| `scenes/` | Cutscene sounds |
| `upgrade/` | Level-up / circuit sounds |
| `va/` | Voice-acting clips |

## `entity/` — sprite sheets (15 MB)

| Folder | Contents |
|---|---|
| `balls/` | Ball projectile sheets (per element + special) |
| `effects/` | Effect particle sheets (referenced by `EFFECT` ANIMS) |
| `enemy/` | Enemy sprites (per enemy id) |
| `npc/` | NPC sprites (per area/character) |
| `objects/` | Object sprites (cars, machines, destructibles) |
| `pets/` | Pet sprites |
| `player/` | Player/party-member sprites |
| `map-gui/` | In-map GUI art (interact icons, AR boxes) |
| `style/` | Style art |
| `shadow.png` | The universal drop shadow |

## `map/` — tilesets & baked layers (13 MB)

- Per-area tilesets: `rookie-harbor.png`, `autumn-outside.png`,
  `bergen.png`, `bergen-trail.png`, `arid*.png`, `cold-dng.png`… — the
  keys of `terrain.json` / `tile-infos.json` and the `tilesetName` of
  map layers ([MAP format](../data/formats/05-map.md)).
- `baked/` — pre-rendered composite images of huge static layers
  (see [04-maps](../engine/impact/04-maps.md)).
- `parallax/` subfolder: tileset-style parallax strips.

## `face/` — dialogue portraits (2.8 MB)

Portrait images used by `sc.AbstractFace` and the dialogue GUI
([msg](../engine/game/07-msg.md)); character files reference faces by
name via their `face` field.

## `gui/` — GUI art (1.6 MB)

Boxes, buttons, icons, cursors, HUD frames loaded via `ig.GuiImage`
([01-gui](../engine/impact/features/01-gui.md)).

## `font/` — fonts (328 KB)

The multi-font icon sheets of `sc.FontSystem`
([font subsystem](../engine/game/06-gui.md)): letter/number glyphs,
color overlays, gamepad glyphs and icon sets.

## `parallax/` — full-screen parallax images (9.2 MB)

Cutscene/logo/countdown backdrops, consumed by `assets/data/parallax/*.json`
([13-misc](../data/formats/13-misc.md)).

## `concept/`, `pics/`, `tutorials/`, `env/`

Concept art (title/DLC art), misc pictures, tutorial images and small
environment art used by screens/menus.

## Related

- [README.md](README.md) (index) · [audio guide](audio-guide.md)
- [repository-map.md](../repository-map.md)