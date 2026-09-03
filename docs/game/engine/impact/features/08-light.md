# impact.feature.light — the light map

> **Status**: core · Modules: `impact.feature.light.light`,
> `impact.feature.light.light-map`, `impact.feature.light.light-steps`,
> `impact.feature.light.entities.cond-light`, `impact.feature.light.plug-in`.
> Deep-dive: `docs/RESEARCH-7-lighting-wasm.md`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `light.light` | `ig.Light` (GameAddon, `ig.light`), `LightHandle` (light sources), `DarknessHandle`, `ScreenFlashHandle`, `GlowColor`, `CondLights`, `LIGHT_SIZE`/`LIGHT_METRIC` | The composite light map: darkness overlay + additive light sources, drawn at `midDraw` (under HUD) |
| `light.light-map` | `ig.MAP.Light` (layer) | Per-map static shadow provider layer (light-blocking tiles) |
| `light.light-steps` | ACTION_STEP: `ADD_DARKNESS`, `CLEAR_DARKNESS` | Scripted darkness fades |
| `light.entities.cond-light` | `ig.ENTITY.ConditionalLight` | Map-placed light that turns on/off with conditions (variables) |
| `light.plug-in` | — | Entry point + editor registration |

## At a glance

| Task | API / object | Phase |
|---|---|---|
| Add temporary darkness | `DarknessHandle` / `ADD_DARKNESS` | Light map prepass + mid-draw composite |
| Add a world light | `LightHandle` / conditional-light entity | Light map, map space |
| Flash the screen | `ScreenFlashHandle` | Light composite |
| Supply occlusion | `ig.MAP.Light` / shadow provider | `onPreDraw` shadow pass |
| Drive a day/night tint | `ig.light` darkness state | Update state outside draw; composite in light phase |

```ts
ig.light.addDarkness?(handle: DarknessHandle): void;
ig.light.addLight?(handle: LightHandle): void;
new LightHandle(pos: Vec3, size: number, color: GlowColor): LightHandle;
```

## Guardrails

- Do not mutate darkness/light handles from a draw callback; update their
  timers/intensity in update or deferred-update code.
- Do not treat a light as a generic alpha rectangle: occlusion and additive
  light are composed through the light map.
- Keep map-dependent shadow providers valid across level changes and follow
  `ig.system.realWidth/realHeight` for any custom backing buffer.
- Composite custom light effects at a documented order so weather, blur, and
  HUD layering remain predictable.

## Behavior

- `ig.Light` renders into the midDraw phase: a **darkness overlay** whose
  intensity is controlled by `DarknessHandle`s, light sources (`LightHandle`s:
  position, size, color, falloff via `LIGHT_SIZE`/`LIGHT_METRIC`) punched in
  additively, plus `ScreenFlashHandle` for flashes.
- Glow colors (`GlowColor`) animate warmth/time — used for day/night cycles,
  lanterns, element glows, boss arenas ("The Void").
- `CondLights` batches conditional lights so only active ones composit.
- `ig.MAP.Light` layers provide occlusion/shadow shapes per map.

## Day/night & mods

- The **ambient-nights** mod drives night darkness by pushing
  `ig.light.lightMapDarkness` (see RESEARCH-4 prior-art table) — the engine
  hook is `ig.light` addon methods (`setLightMapDarkness`-family).
- Weather interplay: [09-weather.md](09-weather.md) (fog dims light).
- Relative-light effects on sprites: `ig.ENTITY.Effect` FX (fx-light),
  [02-effect.md](02-effect.md).