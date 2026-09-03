# impact.feature.weather — weather system

> **Status**: core · Modules: `impact.feature.weather.weather`,
> `impact.feature.weather.clouds`, `impact.feature.weather.fog`,
> `impact.feature.weather.rain`, `impact.feature.weather.weather-steps`,
> `impact.feature.weather.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `weather.weather` | `ig.WEATHER_TYPES` (data), `ig.WeatherInstance`, `ig.Weather` (GameAddon, `ig.weather`) | Weather definitions + instance state machine (start/stop, blends) |
| `weather.clouds` | `ig.Clouds` | Drifting cloud shadow overlay (`shadowProvider` in the light map) |
| `weather.fog` | `ig.Fog` | Fog density overlay — dims light distance |
| `weather.rain` | `ig.RAIN_STRENGTH`, `ig.Rain`, `ig.RainDropEntity` | Rain intensity levels + droplet entities + splash particles |
| `weather.weather-steps` | EVENT_STEP: `SET_WEATHER`, `RESTORE_WEATHER_PARTICLES` | Scripted weather changes |
| `weather.plug-in` | — | Entry point + editor registration |

## At a glance

| Task | API / step | Lifetime |
|---|---|---|
| Apply a preset | `ig.weather.setWeather(instance, transition)` | Map/scene state |
| Define a component bundle | `new ig.WeatherInstance(name)` | Rain, fog, clouds, tint and blend state |
| Change weather from data | map/area `weather` attribute | Resolved during level load |
| Change weather from a script | `SET_WEATHER` | Event-step context |
| Restore particles | `RESTORE_WEATHER_PARTICLES` | Event-step context |

```ts
ig.weather.setWeather(
  weather: ig.WeatherInstance,
  transition?: number | WeatherTransition
): void;
```

## Guardrails

- Do not replace weather state every frame; set a target preset and let the
  instance blend it.
- Do not draw fog as an unrelated opaque overlay when the intended behavior is
  light-map integration; preserve the weather/light composition order.
- Reapply map-dependent weather after `onLevelLoaded`, not only at boot.
- Keep particle density and update cost bounded in dense combat scenes.

## Behavior

- `ig.WeatherInstance` bundles weather components (rain strength, fog
  density, clouds, ambient light tint…) with **blend-in/out times**;
  `ig.weather.setWeather(instance, transition)` swaps ambience smoothly.
- `ig.WEATHER_TYPES` enumerates presets (RAIN, SNOW, FOG, DUST, SUN…) used
  by map attributes and events.
- Clouds/fog are **light-map shadow providers** — they darken via the light
  composite ([08-light.md](08-light.md)), not via alpha rectangles.
- Map × weather links live in `assets/data/areas/*.json` (`weather` keys)
  and map JSONs — covered in [AREA format](../../../data/formats/09-area.md).

## Mods

- **ambient-nights** builds its storm/forecast system on
  `ig.weather.setWeather(new ig.WeatherInstance(name))` (RESEARCH-4).