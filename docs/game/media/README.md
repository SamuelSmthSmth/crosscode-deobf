# Media — index

> **Status**: core · Everything under `assets/media/` (~700 MB). For
> loader, buffer, and coordinate guardrails, see the [agent reference](../agent-reference.md).
> The collection includes BGM, sound effects, entity sprites, map tilesets,
> faces, fonts, GUI art,
> parallax layers and cutscene art. Referenced by the data JSONs through
> relative paths (e.g. `"media/entity/effects/ball.png"` in effect
> files, `"media/map/rookie-harbor.png"` as tileset keys).

## Folder guide

| Folder | Size | Contents |
|---|---|---|
| `bgm/` | 238 MB | 118 music tracks (OGG) — see [audio guide](audio-guide.md) |
| `sound/` | 122 MB | 1,174 SFX files in 15 themed folders — see [audio guide](audio-guide.md) |
| `entity/` | 15 MB | Sprite sheets for balls, effects, enemy, npc, objects, pets, player, map-gui + `shadow.png` |
| `map/` | 13 MB | Tilesets per area (`rookie-harbor.png`, `bergen.png`…) + `baked/` pre-rendered composite layers |
| `parallax/` | 9.2 MB | Full-screen parallax images (logo, countdown, cutscene backdrops) — consumed by `data/parallax/*.json` |
| `face/` | 2.8 MB | Dialogue portrait images (`sc.AbstractFace`) |
| `gui/` | 1.6 MB | GUI art (boxes, icons, cursors, HUD frames) |
| `concept/` | 756 KB | Concept art (title screens, DLC art) |
| `pics/` | 412 KB | Miscellaneous pictures |
| `font/` | 328 KB | Fonts + icon glyph sheets (multi-font system, `game.feature.font`) |
| `tutorials/` | 264 KB | Tutorial images |
| `env/` | 40 KB | Environment art |

## How media is referenced

- **Data JSONs** point at media paths: animation sheets, effect sheets,
  prop `fix.gfx`, character `animSheet`/`img`, parallax `gfx`, BGM
  `media/bgm/*.ogg` (map `attributes.bgm` keys resolve to tracks via
  `game.feature.bgm.playlist`).
- **`ig.Image`/`ig.AnimationSheet`/`ig.Sound`** load these at boot or on
  demand through `ig.Loader` ([01-core](../engine/impact/01-core.md));
  `ig.GuiImage` (`impact.feature.gui`) loads GUI art.

## Pages

- [Folder guide](folder-guide.md) — the full tree with notes per folder.
- [Audio guide](audio-guide.md) — BGM + SFX layout, formats, volume maps.

## Related

- [repository-map.md](../repository-map.md) (media is git-ignored/unpacked)
- Data formats that reference media:
  [ANIMATION](../data/formats/02-animation.md),
  [EFFECT](../data/formats/03-effect.md),
  [CHARACTER](../data/formats/04-character.md),
  [MAP](../data/formats/05-map.md)