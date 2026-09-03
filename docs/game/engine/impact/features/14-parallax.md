# impact.feature.parallax — parallax layers

> **Status**: core · Modules: `impact.feature.parallax.parallax`,
> `impact.feature.parallax.parallax-steps`, `impact.feature.parallax.plug-in`.
> Related: `impact.base.background-map.js` `ig.MAP.Background` /
> `ig.MAP.MovingParallax` ([../04-maps.md](../04-maps.md)).

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `parallax.parallax` | `ig.Parallax` (map layer addon) | Fullscreen parallax images: repeat/scale/scroll speed, per-layer animation |
| `parallax.parallax-steps` | EVENT_STEP: `SET_PARALLAX_POS`, `SET_PARALLAX_SPEED`, `SET_PARALLAX_REPEAT`, `SET_PARALLAX_ANIMATION` | Scripted parallax motion (cutscenes, elevators, dreams) |
| `parallax.plug-in` | — | Entry point + editor registration |

## At a glance

| Task | Data / API | Space |
|---|---|---|
| Add a layer | `assets/data/parallax/*.json` entry | Layer scroll space |
| Move a layer | `SET_PARALLAX_POS` / `SET_PARALLAX_SPEED` | Scripted update |
| Repeat a layer | `SET_PARALLAX_REPEAT` | Layer-local tiling |
| Animate a layer | `SET_PARALLAX_ANIMATION` | Cached image/animation resources |

```ts
ig.Parallax.setPos?(x: number, y: number): void;
ig.Parallax.setSpeed?(x: number, y: number): void;
```

## Guardrails

- Do not confuse a parallax layer’s scroll coordinates with map-space entity
  coordinates; use the layer’s own scroll/distance when anchoring effects.
- Keep image paths rooted at `assets/` and pre-load or cache repeated imagery.
- Validate repeat, culling, and resize behavior when using nonstandard
  foreground factors; `distance > 1` is outside the normal data convention.
- Do not apply full-screen blur per frame to every layer; pre-render chunks or
  use a restricted, downscaled pass.

## Behavior

- Parallax JSON (`assets/data/parallax/*.json`, 13 files: title, login,
  planet-far/near, ship-far, tower, cw-2, countdown, hideout, logo…;
  cat in [catalogs](../../../data/catalogs/README.md)) defines image,
  distance (<1 = background), repeat mode, speed.
- `ig.Parallax` layers render in `first` map space (before entities) and
  scroll with the camera at their distance; steps animate pos/speed/repeat
  live (the elevator/climbing sequences).
- Scene parallax images live under `assets/media/parallax/**`
  (per-scene folders: boss-1..3, countdown, credits, cw-2, end-bbq,
  expo-space, final, heat-dng…).