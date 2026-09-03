# impact.feature.map-sounds — per-map ambient sounds

> **Status**: core · Modules: `impact.feature.map-sounds.map-sounds`,
> `impact.feature.map-sounds.map-sounds-steps`, `impact.feature.map-sounds.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `map-sounds.map-sounds` | `ig.MapSounds` (addon), `ig.MapSoundEntry`, `ig.MAP_SOUNDS` (~50 named presets) | Looping ambient sound layers per map, with per-entry volume/fade |
| `map-sounds.map-sounds-steps` | EVENT_STEP: `SET_MAP_SOUNDS` | Scripted ambience changes |
| `map-sounds.plug-in` | — | Entry point + editor registration |

## At a glance

| Task | API / data | Lifetime |
|---|---|---|
| Select map ambience | `attributes.map-sounds` / `mapSound` | Map load |
| Override ambience | `SET_MAP_SOUNDS` | Event lifetime or until replaced |
| Define a preset | `ig.MAP_SOUNDS[key]` | Registry/configuration |
| Mix a layer | `ig.MapSoundEntry` | Loop, volume, fade, stop policy |

```ts
ig.mapSounds.setMapSounds?(name: string, transition?: number): void;
```

## Guardrails

- Keep map sounds separate from BGM: ambience belongs on the sound path and
  should not replace the music track stack.
- Cross-fade or stop old entries on map changes; do not accumulate looping
  sources across transitions.
- Verify every preset path under `assets/media/sound/` and test quiet maps,
  combat, and save/load transitions.
- If overriding `ig.MAP_SOUNDS`, do it before the target map resolves its
  ambience and preserve unrelated presets.

## Behavior

- Maps declare an ambience key (`mapSound` attribute in map JSON, see
  [map format](../../../data/formats/05-map.md)); the addon cross-references
  `ig.MAP_SOUNDS` presets (ROOKIE_HARBOR_OCEAN, JUNGLE, RAID_BOSS_AMBIENCE,
  HEAT_AREA_WIND, FINAL_DUNGEON_OUTSIDE_WINDY, ~50 total) which map to the
  looped `.ogg`/`.mp3` files in `assets/media/sound/ambience`.
- `ig.MapSoundEntry` bundles the sound, volume, fade-in time and whether it
  stops on map change; entering a map cross-fades old↔new ambience.
- `SET_MAP_SOUNDS` overrides ambience from scripts (boss fight shifts,
  interior/exterior transitions).
- Distinct from **BGM** ([12-bgm.md](12-bgm.md)): BGM is the music track
  system; map-sounds are the non-musical environmental loops.