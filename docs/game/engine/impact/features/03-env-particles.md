# impact.feature.env-particles — ambient environment particles

> **Status**: core · Modules: `impact.feature.env-particles.env-particles`,
> `impact.feature.env-particles.env-particles-steps`,
> `impact.feature.env-particles.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `env-particles.env-particles` | `ig.EnvParticles` (GameAddon) | Ambient floaters per map: leaves, dust, snow, embers, pollen — count/spawn area/target tile zones |
| `env-particles.env-particles-steps` | EVENT/ACTION_STEP: set/clear env particle configs | Map scripting swaps particle ambience |
| `env-particles.plug-in` | — | Entry point + editor registration |

## Behavior

- Map attribute-driven: maps can declare env-particle **zones** (spawn
  rectangles) and **types**; `ig.EnvParticles` spawns drifting particles in
  those zones each frame (pooled; see sprite pooling in
  [03-rendering.md](../03-rendering.md)).
- Particle types come from style/zone config — visually simple additive
  pixels (no textures needed), tinted by `ig.MapStyle`-ish values where the
  feature plugs into map style keys.
- Steps let events add/remove/change ambient particles mid-map (used by
  dungeons to turn dust into embers, etc.).

## Touchpoints

- Used alongside **weather** ([09-weather.md](09-weather.md)) for rain/snow
  ambience; visual mods (ambient-nights) hook here for night fireflies-type
  effects.