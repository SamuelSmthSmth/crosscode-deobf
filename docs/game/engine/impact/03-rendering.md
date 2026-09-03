# impact.base — Rendering (Canvas2D pipeline, images, sprites, animations, fonts)

> **Status**: core · Source: `deobf/clean/impact.base.image.js`,
> `impact.base.worker.js`, `impact.base.sprite.js`, `impact.base.sprite-fx.js`,
> `impact.base.renderer.js`, `impact.base.animation.js`, `impact.base.font.js`.
> Deep-dive: `docs/RESEARCH-1-architecture-rendu-audio.md`,
> `deobf/RENDERING-2.5D-NOTES.md`.

**Fundamental truth**: exactly one Canvas2D context; no WebGL, no shaders.
Every visual effect in the game is Canvas2D operations. The renderer converts
map-space entities/maps into `SpriteDrawSlot`s and draws them in painter's
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

## At a glance

| Task | Preferred surface | Space / timing |
|---|---|---|
| Draw a world sprite | `ig.Sprite` / `SpriteDrawSlot` | Map-space input; camera zoom remains active |
| Add a tint or flash | `ig.AnimModification` / overlay fragment | Reuse the atlas; do not allocate a canvas per frame |
| Draw a world post-effect | `ig.GameAddon.onPostDraw` before GUI | Composite under order 500 and preserve transforms |
| Draw a physical full-screen effect | Offscreen buffer + `resetTransform()` | Use `realWidth/realHeight` and restore the context |
| Process expensive pixels | `ig.Worker` / filtered image path | Precompute/cache; avoid main-thread readbacks |

```ts
ig.system.createImageBuffer(width: number, height: number,
  draw?: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement;
ig.system.getScreenFromMapPos(out: Vec2, mapX: number, mapY: number): Vec2;
```

## Modding deep-dive

For addon ordering, physical/backing-pixel rules, offscreen-buffer ownership, and worker/WASM patterns, see [Rendering and lighting modding](../../modding/rendering-and-lighting.md).

## Guardrails

- Never use `getImageData`/`putImageData` in the main draw loop without a
  measured reason; the readback can stall the pipeline.
- Never call `ctx.filter = 'blur(...)'` over the full backing canvas every
  frame. Downscale, restrict the region, pre-render, or update intermittently.
- Never forget `ctx.save()`/`ctx.restore()` around composite mode, alpha,
  filter, transform, or clipping changes.
- Never assume a sprite draw is a single flat image: cube sprites may split
  into wall and ground slots and participate in the overlap solver.

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
  Linked from the [media guide](../../media/README.md).