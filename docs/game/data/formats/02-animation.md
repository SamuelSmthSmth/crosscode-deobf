# ANIMATION format (`assets/data/animations/**/*.json`)

> **Status**: core · 266 files. Three DOCTYPEs:
> `MULTI_DIR_ANIMATION` (245 — standard 8-direction sprites),
> `MULTI_ENTITY_ANIMATION` (20 — multi-part bosses/entities),
> `SIMPLE_ANIMATION` (1). Loaded by `ig.Animation`/`ig.animation`
> (`impact.base.animation`, see [engine: rendering](../../engine/impact/03-rendering.md)).

## Common structure

```json
{
  "DOCTYPE": "MULTI_DIR_ANIMATION",
  "namedSheets": { "<sheetName>": { "src": "media/entity/npc/emilie.png", "xCount": 16, "offX": 0, "offY": 0, "width": 32, "height": 40 } },
  "shapeType": "Y_FLAT",
  "offset": { "x": 0, "y": -4, "z": 0 },
  "SUB": [ { "sheet": "walk", "dirs": "8", "flipX": [0,0,0,0,0,1,1,1], "tileOffsets": [0,16,3], "frames": ["1","1","2","3","0"], "time": 0.1, "repeat": true } ]
}
```

## Field reference

### Top level

| Field | Type | Meaning |
|---|---|---|
| `DOCTYPE` | string | `MULTI_DIR_ANIMATION` / `MULTI_ENTITY_ANIMATION` / `SIMPLE_ANIMATION` |
| `namedSheets` | object | Named sprite sheets: name → sheet descriptor |
| `baseSize` | object (MULTI_ENTITY) | `{x, y, z}` — total entity size the parts compose |
| `parts` | object (MULTI_ENTITY) | Named parts, each with its own anims (see below) |
| `anims` | object (SIMPLE) | Single-sheet animation map |
| `sheet` | string | Sheet name used by the animation(s) |
| `shapeType` | string | Hit-shape projection: `Y_FLAT` (flat), `BOX`… |
| `offset` | object | `{x, y, z}` sprite draw offset |
| `guiSprites` | boolean | Animation used for GUI rendering |
| `renderMode` | string | Render mode override |

### Sheet descriptor (`namedSheets.<name>`)

| Field | Type | Meaning |
|---|---|---|
| `src` | string | Image path relative to `assets/` (e.g. `media/entity/npc/emilie.png`) |
| `xCount` | number | Frames per row in the sheet |
| `offX` / `offY` | number | Pixel offset of the sheet inside the image |
| `width` / `height` | number | Frame size in pixels |

### Animation entry (`SUB[]` / `anims.<name>` / `parts.<name>.anims.<name>`)

| Field | Type | Meaning |
|---|---|---|
| `sheet` | string | Which named sheet this animation reads |
| `dirs` | string/number | Direction count (`"8"`, `"4"`, `"1"`) |
| `flipX` | array | Per-direction horizontal mirroring (0/1) — 8 directions with 4 real frames |
| `tileOffsets` | array | Frame index offsets per direction |
| `frames` | array | Frame sequence (string indices into the sheet; `"0"`-based) |
| `framesSpriteOffset` | array | Per-frame draw offsets |
| `framesAngle` | array | Per-frame rotation (radians) |
| `anchorOffsetX/Y/Z` | array | Per-direction anchor offsets (parts) |
| `dirOffsets` | array | Per-direction draw offsets |
| `time` | number | Seconds per frame (0.1 = 10 fps) |
| `repeat` | boolean | Loop or play once |
| `wallY` | number | Wall-attach height (part visuals) |

### MULTI_ENTITY_ANIMATION parts

Bosses are assembled from named parts (`head`, `body`, `armSand`…), each a
full animation block:

```json
"parts": {
  "head": {
    "collType": "VIRTUAL",
    "size": { "x": 56, "y": 40, "z": 48 },
    "pos": { "x": 22, "y": 16, "z": 60 },
    "anims": { "SUB": [ { "sheet": "head", "frames": ["1","1","2","3","0"], "time": 0.1, "repeat": true, "shapeType": "Y_FLAT", "wallY": 0 } ] }
  }
}
```

Each part has its own collision type (`VIRTUAL` = non-solid), size,
position relative to the entity centre, and animation list.

## Lookup rules

- Character/enemy JSONs reference animations by dotted path, e.g.
  `"anims": "enemies.dice-mage"` → `assets/data/animations/enemies/dice-mage.json`;
  `"anims": "lea-base.lea-idle"` → `assets/data/animations/lea-base/lea-idle.json`.
- Walking animations are selected via `walkConfigs` in the character/enemy
  file ([ENEMY format](01-enemy.md)); other animations are referenced by
  name from scripts (`SHOW_ANIMATION`, `SHOW_EXTERN_ANIM` — see
  [ACTION_STEP reference](06-action-steps.md)).
- The sprite frames are packed into the image with `xCount` frames per row,
  starting at `(offX, offY)`; frame `"3"` = column 3 of row 0.

## Engine consumers

- `ig.Animation`/`ig.AnimationSheet` (`impact.base.animation`,
  [rendering](../../engine/impact/03-rendering.md)) builds drawable
  animations from these files; `ig.AnimationManager`/`ig.animation`
  caches them by path.
- Game layer: `sc.CharacterEntity`/`sc.EnemyEntity` drive them via
  `walkAnims` + action steps.