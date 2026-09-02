# PROP format (`assets/data/props/`, `assets/data/scale-props/`)

> **Status**: core · Prop sheets define the interactable/static world
> objects placed in maps as `Prop`/`ScalableProp` entities. Consumed by
> `ig.ENTITY.Prop`/`ig.ENTITY.ScalableProp` via `ig.PropSheet`/
> `ig.ScalePropSheet` ([17-map-content](../../engine/impact/features/17-map-content.md)).

## File anatomy

```json
{
  "DOCTYPE": "PROP_SHEET",
  "props": [
    { "name": "block1", "size": {"x": 24, "y": 24, "z": 36},
      "collType": "BLOCK",
      "fix": { "gfx": "media/map/arid.png", "x": 448, "y": 304, "w": 24, "h": 64, "flipX": false } },
    { "name": "barrierH", "size": {"x": 32, "y": 8, "z": 16}, "collType": "BLOCK",
      "fix": { "gfx": "media/map/arid.png", "x": 464, "y": 280, "w": 32, "h": 24, "flipX": false } }
  ]
}
```

(from `props/arid.json`; `scale-props/*` share the shape)

## Fields (per prop entry)

| Field | Meaning |
|---|---|
| `name` | Prop id — referenced by map entity `propType`/`propConfig` `{sheet, name}` |
| `size` | Collision/physics box `{x, y, z}` (z = height) |
| `collType` | `BLOCK` / `NONE` / slope variants — tile collision behaviour |
| `fix` | Static sprite rect: `gfx` (sheet path), `x`/`y` (source rect in sheet), `w`/`h`, `flipX` |
| `anim` / `animSheet` | Animated variants (props with looping animations) |
| `staticNavBlocked` | Whether the prop blocks the navigation graph (party pathing) |
| `zOffset` / `displayOffset` | Draw offset relative to the collision box |
| `interact` | Optional interaction prompt (`sc.PropInteract`, see [map-content](../../engine/game/16-map-content.md)) |

## Engine consumption

- `ig.ENTITY.Prop` instantiates a prop from its sheet entry: collision box
  from `size`/`collType`, sprite from `fix` (or animation). Nudging
  (editor drag) and conditional animations are engine features
  ([17-map-content](../../engine/impact/features/17-map-content.md)).
- `ig.ENTITY.ScalableProp` uses `scale-props/` sheets: the sprite scales
  with a `size` attribute (walls, rails, water bodies) via
  `ig.ScalePropSheet`.
- Map placement: `Prop` entities reference `propType: {sheet, name}`;
  `ScalableProp` entities reference `propConfig: {sheet, name, ends}`
  with a pixel `size` (see [MAP format](05-map.md)).

## Related

- Engine: [impact.feature.map-content](../../engine/impact/features/17-map-content.md),
  [map-content (game)](../../engine/game/16-map-content.md)
- Map entities: [MAP format](05-map.md)