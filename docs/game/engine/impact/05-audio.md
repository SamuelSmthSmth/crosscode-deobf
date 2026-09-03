# impact.base — Audio (WebAudio graph, sound manager, music)

> **Status**: core · Source: `deobf/clean/impact.base.system.web-audio.js`,
> `impact.base.sound.js` (1393 lines). Deep-dive:
> `docs/RESEARCH-1-architecture-rendu-audio.md` §4 (graph, positional audio).

## Modules & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.system.web-audio` | `ig.WebAudio` (context wrapper), `ig.WebAudioBufferGain` (source+gain pair) | AudioContext bootstrap, buffer loading, loop scheduling primitives (`_primeBufferGain`) |
| `impact.base.sound` | `ig.SoundManager` (`ig.soundManager`), `ig.SoundHandleBase`, `ig.SoundDefault`, `ig.SoundWebAudio`, `ig.Music`, `ig.SoundHelper`, `ig.SOUND_RANGE_TYPE`, `ig.SOUND_TYPES` | Playback, volume buses, positional audio, the BGM music stack |

## At a glance

| Need | API / class | Contract |
|---|---|---|
| Play a world-positioned sound | `ig.SoundHelper.playAtEntity(...)` | Position is map space relative to camera-owned `ig.game.soundPos` |
| Update an existing source | `handle.setEntityPosition(...)` | Refresh position each frame for moving entities |
| Play UI audio | `ig.SoundHelper.play(sound, ...)` | No positional panner unless a position is explicitly assigned |
| Change bus volume | `ig.soundManager.setMasterVolume(...)` / music / sound | Routes through the three native gain buses |
| Change music context | `ig.bgm.play/push/pop(...)` | Use `ig.BGM_SWITCH_MODE` for transitions |

```ts
ig.SoundHelper.playAtEntity(sound: ig.Sound, entity: ig.Entity, params?: unknown,
  loop?: boolean, range?: number, rangeType?: ig.SOUND_RANGE_TYPE): ig.SoundHandle;
handle.setEntityPosition(entity: ig.Entity, align?: ig.ENTITY_ALIGN,
  offset?: Vec3, range?: number, rangeType?: ig.SOUND_RANGE_TYPE): void;
```

## Guardrails

- Do not hand-build a second audio graph for ordinary SFX; reuse the existing
  `ig.soundManager` buses and positional helpers.
- Do not assume every sound is spatialized: the native WebAudio path gates
  panning to sounds lasting at least one second or looping sounds.
- Do not update audio positions in a draw hook; update the handle/entity state
  during simulation or use the native per-frame handle refresh.
- Keep music on the music bus and effects/voices on their intended buses; do
  not bypass master volume or save-backed options.

## The signal graph (already wired)

```
BufferSource → GainNode (ig.WebAudioBufferGain)
   → [PannerNode if positional]   (equalpower, linear distance model)
   → volumes.sound (GainNode)   ─┐
   → volumes.music (GainNode)   ─┼→ [DynamicsCompressor −6 dB, ratio 20:1] → master → destination
```

- Three independent buses: `master`, `music`, `sound`; setters
  `setMasterVolume/setMusicVolume/setSoundVolume` bound to options
  (`volume-master`, `volume-music`, `volume-sound`).
- One `AudioContext` (created lazily on first user gesture / boot).

## Positional (2.5D) audio — already implemented

`ig.SoundWebAudio` / `ig.SoundHandleWebAudio`:

- `playAtEntity(sound, entity, params, loop, range, rangeType)` — the standard
  helper used across the game (NPC voices range ~700, item drops, puzzles,
  combat).
- Position refreshed **every frame** via `entity.getAlignedPos(align)` minus
  `ig.game.soundPos` (the listening center — updated by the *camera*, not the
  player; see [features/10-camera.md](features/10-camera.md)).
- PannerNode config: `panningModel='equalpower'`, `distanceModel='linear'`,
  `refDistance = 0.1 × range`, `maxDistance = range` (default 1600 px).
- Attenuation spline `EASE_SOUND` over `(dist − near)/far`,
  `near = 0.1×range`, `far = 0.9×range`.
- **Gating**: `_doPanning = duration ≥ 1 s || loop` — sounds shorter than 1 s
  are **not** spatialized (a known research finding, RESEARCH-1 §4.2).
- `ig.SOUND_RANGE_TYPE`: CIRCULAR / HORIZONTAL / VERTICAL (anisotropic ranges).

## Music (`ig.Music`)

- Track stack with native cross-fade: `_transitionType` 0/1/2,
  `_intervalStep` 16 ms, `_fadeInTime`/`_setFadeOut`.
- `ig.TrackWebAudio`: seamless loop via double `BufferGain` pre-scheduled at
  exact context times, plus separate `introPath`/`introEnd` sections.
- Switch modes `ig.BGM_SWITCH_MODE`: IMMEDIATELY → VERY_SLOW (0–5 s fades).
- The **BGM addon** (`ig.bgm`, [features/12-bgm.md](features/12-bgm.md))
  layers track sets (field/battle), per-map playlists
  (`game.feature.bgm.playlist`), and save persistence.

## SFX & helpers

- `ig.SoundHelper.playAt` (fixed world pos), `playAtEntity`, plain `play`
  (UI sounds), `playRandomPitch` helpers.
- Sound file conventions live in [media/audio-guide.md](../../media/audio-guide.md) — folders under `assets/media/sound/` (cf. `assets/data/effects`
  stepFx references).
- Map ambience loops are `ig.mapSounds` — [features/29-map-sounds.md](features/29-map-sounds.md).