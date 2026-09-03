# impact.feature.map-content — map content entities

> **Status**: core · Modules: `impact.feature.map-content.entities.door`,
> `impact.feature.map-content.entities.glowing-ground`,
> `impact.feature.map-content.entities.hidden-block`,
> `impact.feature.map-content.entities.note`, `impact.feature.map-content.entities.prop`,
> `impact.feature.map-content.entities.scalable-prop`,
> `impact.feature.map-content.entities.stair-door`,
> `impact.feature.map-content.entities.teleport-ground`,
> `impact.feature.map-content.map-content-steps`, `impact.feature.map-content.map-style`,
> `impact.feature.map-content.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `entities.door` | `ig.ENTITY.Door`, `ig.DoorMat`, `ig.DOOR_TYPE` (`DEFAULT`, …), `ig.DOOR_OPEN_SOUND` | Doorways that transition between maps (fade + walk-in), incl. door mats |
| `entities.glowing-ground` | `ig.ENTITY.GlowingGround` | Decorative glowing floor tiles (lights on floor) |
| `entities.hidden-block` | `ig.ENTITY.HiddenBlock`, `ig.ENTITY.HiddenSkyBlock` | Invisible walls/sky barriers revealed by effects (bombs, waves…) |
| `entities.note` | `ig.ENTITY.Note` | Readable notes pinned to the world (quest/lore text) |
| `entities.prop` | `ig.ENTITY.Prop` (+ `staticNavBlock`), `ig.PropSheet`, `ig.PROP_INTERACT_CLASS`, `ig.LANG_CONTEXT.Prop` | Interactable furniture/props driven by prop sheets |
| `entities.scalable-prop` | `ig.ENTITY.ScalableProp`, `ig.ScalePropSheet` | Props whose sprite scales with the sheet (tall objects) |
| `entities.stair-door` | `ig.ENTITY.TeleportStairs` | Staircases that teleport between elevation levels |
| `entities.teleport-ground` | `ig.ENTITY.TeleportGround` | Ground trigger tiles that teleport the player |
| `map-content-steps` | EVENT_STEP: `OPEN_DOOR`, `CLOSE_DOOR`; ACTION_STEP: `ENTER_DOOR`; EVENT_STEP: `NUDGE_PROP` | Scripted door/prop interactions |
| `map-style` | `ig.MapStyle` (addon `ig.mapStyle`), `ig.MAP_STYLES`, `ig.MapStyle.registerStyle` | Per-level style lookup (`level.attributes.mapStyle`), fallback "default" |
| `plug-in` | — | Entry point + editor registration |

## At a glance

| Task | Entity / step | Data boundary |
|---|---|---|
| Add a map transition | `ig.ENTITY.Door` + `OPEN_DOOR`/`ENTER_DOOR` | Map entity settings + destination |
| Add a prop | `ig.ENTITY.Prop` / `ScalableProp` | `PROP` sheet reference |
| Add a teleport tile | `TeleportGround` / `TeleportStairs` | Map placement and level data |
| Add a conditional barrier | `HiddenBlock` / `HiddenSkyBlock` | Variable/element-driven state |
| Change visual style | `ig.MapStyle.registerStyle` | Map `mapStyle` attribute |

```ts
ig.MapStyle.registerStyle(name: string, style: MapStyleDefinition): void;
entity.open?(): void;
entity.close?(): void;
```

## Guardrails

- Do not change a prop’s visual size without checking its collision and nav
  blocking; those are separate gameplay contracts.
- Do not use a door/teleporter as a generic coordinate warp when destination,
  fade, level, and save/checkpoint semantics matter.
- Keep conditional map content tied to `ig.vars`/event state, not draw-time
  visibility hacks.
- Re-test map transitions, z-levels, navigation, and save/reload after edits.

## Behavior

- **Doors** (`ig.ENTITY.Door`) are the standard map-transition entity:
  type controls fade style and spawn point handling; `ENTER_DOOR`/`OPEN_DOOR`
  drive them from cutscenes. See [map format](../../../data/formats/05-map.md)
  for how doors are declared in map JSON.
- **Props** read their definition from prop sheets (interact icon, prompt,
  static nav blocking — `Prop.staticNavBlock`). `NUDGE_PROP` pushes them
  from event scripts.
- **HiddenBlock/HiddenSkyBlock** block until a scripted reveal (used for
  breakable walls, boss-fight barriers).
- **MapStyle** lets one tileset set look different per level style
  (e.g. day/night color variants) — queried by rendering code as
  `ig.mapStyle.get(key)`.