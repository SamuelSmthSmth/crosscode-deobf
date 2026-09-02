# impact.base — Rendering (Canvas2D pipeline, images, sprites, animations, fonts)

> **Status**: core · Source: `deobf/clean/impact.base.image.js`,
> `impact.base.worker.js`, `impact.base.sprite.js`, `impact.base.sprite-fx.js`,
> `impact.base.renderer.js`, `impact.base.animation.js`, `impact.base.font.js`.
> Deep-dive: `docs/RESEARCH-1-architecture-rendu-audio.md`,
> `deobf/RENDERING-2.5D-NOTES.md`.

**Fundamental truth**: exactly one Canvas2D context; no WebGL, no shaders.
Every visual effect in the game is Canvas2D operations. The renderer converts
world-space entities/maps into `SpriteDrawSlot`s and draws them in painter's
order per z-level.

## Modules & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.image` | `ig.Image` (+mod fragments), `ig.ImageCanvasWrapper`, `ig.ImageAtlas`/`ig.ImageAtlasFragment`, `ig.ImagePattern`, `ig.ScreenBuffer`, `ig.TransitionColor`, `ig.DoubleColor`, `ig.SimpleColor`, `ig.SimpleCircle`, `ig.ComplexLineCircleBox` | Image loading via worker, drawImage caching, 1024×1024 shared atlas for tinted copies, color/gradient primitives, transition colors |
| `impact.base.worker` | `ig.Worker` | Decodes/processes images off the main thread (the only `getImageData` user) |
| `impact.base.sprite` | `ig.TileSheet` (+`createFromJson`), `ig.SpritePool`, `ig.CubeSprite` | Tile/entity sprite sheets; pooled sprites; the "cube" draw model (wall part + ground part split by `wallY`) |
| `impact.base.sprite-fx` | `ig.SpriteEffectBase` | Base for per-sprite modification (flash/tint overlays) |
| `impact.base.renderer` | `ig.Renderer2d`, `ig.Renderer2d.SpriteDrawSlot` | Culling, updateSprites, slot sorting (`yIndex` then `spriteIdx`), `drawLayers` with overlap-solver, z-clipping (`cutAtZ`), wall/ground splits, overlay/lighterOverlay fragments, drop shadows |
| `impact.base.animation` | `ig.Animation`, `ig.AnimationState`, `ig.AnimModification`/`ig.ColorOverlay`, `ig.AnimationSheet` (JsonLoadable), `ig.SingleDirAnimationSet`, `ig.MultiDirAnimationSet`, `ig.MultiEntityAnimation`(+Part) | Frame timing, direction handling (`dirs`, `flipX`, `tileOffsets`), animation JSON parsing — consumes the ANIMATION format ([data](../../data/formats/02-animation.md)) |
| `impact.base.font` | `ig.Font`, `ig.MultiFont`, `ig.TextCommands`, `ig.TextParser`, `ig.TextBlock` (in font.js) | Bitmap-font rendering, text commands (`<c>` colors, glyphs), multi-font systems |

## The draw pipeline (each frame)

```
renderer.prepareDraw(shownEntities)
  → compute visible viewport (zoomMinOffset + game.screen)
  → cull entities (48px x / 32px y margins)
  → entity.updateSprites() → fill pooled SpriteDrawSlots
  → cube sprites split into wall slot and/or ground slot (wallY decides)
  → sort by (yIndex, spriteIdx)
renderer.drawLayers()
  → "first" maps → per z-level: level maps + drawEntities(level) → "last" maps
  → drawEntities: overlap stack solver (rear cubes defer in front of front cubes)
renderer.drawPostLayerSprites() → "postlight" bucket + GUI sprites
```

Between `prepareDraw` and `drawLayers`, the zoom transform is applied by
`ig.System.startZoomedDraw()` (see [01-core.md](01-core.md)).

### `SpriteDrawSlot.draw(zMin, zMax)`

Applies per-slot: z-clipping, `gfxCut` trim, wall/ground split, transform,
and **overlays**: `overlay` (tinted copy via `ig.ImageModFragment` in the
shared atlas — hit flash, element tints) and `lighterOverlay` (additive
fragment, `globalCompositeOperation='lighter'`). Drop shadow: `alpha × 0.5 ×
sprite.alpha`, shrinking with z-height.

### Sprite pooling

`ig.SpritePool` reuses `ig.CubeSprite` objects across frames; slots are
pooled in the renderer (allocated once, reused). The pool is where a mod
would hook per-sprite rendering.

## Images & the shared atlas

- `ig.Image` loads via worker → `ImageCanvasWrapper`. `ig.ImageAtlas`
  allocates 1024×1024 chunks (`ImageAtlasFragment`) used for tinted/modified
  copies (flash variants of sheets) — avoids per-frame canvas allocations.
- `ig.ImagePattern` — repeating fill source for backgrounds.
- `ig.TransitionColor` — time-based color lerp (fades between two colors) —
  used by light/weather tinting and screen fades.
- `ig.ScreenBuffer` — offscreen full-screen buffer (used by screen-blur,
  tilt-shift mods).

## Animations

- JSON-driven: `namedSheets{name: {src, offX, offY, width, height, xCount}}`,
  `dirs`, `flipX`, `tileOffsets`, nested `SUB` tree of states with
  `{name, time, repeat, frames[, framesGfxOffset, framesAngle, framesSpriteOffset]}`.
  Full field reference: [ANIMATION format](../../data/formats/02-animation.md).
- `ig.AnimationSheet` (JsonLoadable) parses sheet JSON; `ig.MultiDirAnimationSet`
  (8-dir sheets like the player) vs `ig.SingleDirAnimationSet` (enemies with
  `dirs: "1"`), `ig.MultiEntityAnimation` for multi-part entities (bosses —
  antlion's parts: head/armSand/armOut/body/throat…).
- `ig.AnimModification` / `ig.ColorOverlay` — runtime palette effects on
  running animations (element tints, damage flash).

## Fonts & text

- `ig.Font` from a PNG bitmap font + metric JSON; `ig.MultiFont` merges
  multiple fonts (icon sets!) and language fallbacks; `ig.TextCommands`
  inline markup; `ig.TextParser`/`ig.TextBlock` line wrapping.
- Glyph sets in `assets/media/font/` (hall-fetica, nina, tiny, icons-*).
  Linked from the [media guide](../../media/README.md) (stub).