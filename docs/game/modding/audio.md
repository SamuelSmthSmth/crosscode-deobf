# Audio modding

> **Scope:** sound effects, WebAudio positioning, sound groups, focus/pause
> behavior, and the BGM stack. The low-level sources are
> `deobf/clean/impact.base.sound.js`, `impact.base.system.web-audio.js`,
> `impact.feature.bgm.bgm.js`, and the working
> `assets/mods/positional-audio/` implementation.

## At a glance

| Goal | Surface | Important contract |
|---|---|---|
| Play a normal effect | `ig.Sound` / `sound.play(loop, params?)` | Returns an `ig.SoundHandle` or `null` if disabled/not loaded |
| Play at an entity | `ig.SoundHelper.playAtEntity(...)` | Uses map position relative to `ig.game.soundPos` |
| Pin to a point | `handle.setFixPosition(pos, range?, rangeType?)` | Position is `{x, y, z}`; z is flattened into listener plane |
| Follow an entity | `handle.setEntityPosition(entity, align, offset?, range?, rangeType?)` | Entity position is refreshed during handle updates |
| Tune attenuation | `ig.SOUND_RANGE_TYPE` | `CIRULAR` (engine spelling), `HORIZONTAL`, `VERTICAL` |
| Play/replace music | `ig.bgm.play(track, volume, mode)` | BGM uses a stack and `ig.BGM_SWITCH_MODE` fades |
| Add a custom option | `sc.OPTIONS_DEFINITION` + `sc.options.set/get` | Register a unique prefix and persist through the option model |

## Backend selection

The engine selects WebAudio when the browser supports `AudioContext`, the
`options.useWebAudio` setting is not false, and `IG_FORCE_HTML5_AUDIO` is not
set. Otherwise it uses the HTML5 Audio backend. Desktop NW.js forces WebAudio
in the cleaned implementation for the relevant runtime versions.

Both backends expose `ig.Sound`, but their internals differ:

- **WebAudio:** decoded `AudioBuffer` → `BufferSource` → `GainNode` → sound
  bus. Positioned handles insert a `PannerNode` between the source and bus.
- **HTML5 Audio:** a pool of up to `ig.Sound.channels` (currently 4) audio
  elements per path. Positional methods exist on the base handle but the HTML5
  backend does not provide WebAudio panning.

Always feature-detect `ig.soundManager.hasWebAudio` before using PannerNode or
WebAudio-only node fields. A mod should remain a no-op or use a non-spatial
fallback when HTML5 Audio is active.

## Sound effects

### Normal playback

```ts
sound.play(loop?: boolean, params?: {
  offset?: number;
  startTime?: number;
  speed?: number;
  fadeDuration?: number;
}): ig.SoundHandle | null;
handle.stop(): void;
handle.pause(hardStop?: boolean): void;
```

The exact `ig.Sound` constructor is selected by the backend. Content generally
provides a cached sound resource rather than constructing a new sound for every
play. `ig.SoundWebAudio` supports playback speed, offset, start time, fade
transitions, and a small random `variance` configured on the sound.

### Sound groups and channel pressure

Every sound has a group, defaulting to its asset path. The sound manager queues
requests per group. On update it keeps looping requests and selects the closest
non-looping positioned request; other currently playing non-looping requests in
the group are stopped. This prevents a dense effect from creating unlimited
voices.

Use a distinct group only when simultaneous instances are intentional. Do not
solve a missing sound by calling `play()` repeatedly each frame: that creates
requests, competes with the group solver, and can sound like a stuck loop.

## Positional audio

### The verified helper call

The helper’s cleaned parameter names are misleading because it forwards them to
`sound.play(loop, params)`. Use this semantic call shape:

```ts
ig.SoundHelper.playAtEntity(
  sound: ig.Sound,
  entity: ig.Entity,
  loop?: boolean,
  params?: SoundPlayParams,
  range?: number,
  rangeType?: SoundRangeType
): ig.SoundHandle | undefined;
```

Example:

```js
var handle = ig.SoundHelper.playAtEntity(
    mySound,
    entity,
    false,
    { speed: 1.0, fadeDuration: 0.1 },
    700,
    ig.SOUND_RANGE_TYPE.CIRULAR
);
```

The helper calls `entity.coll` and attaches the returned handle to the entity’s
aligned center. It is therefore not safe to pass an arbitrary object that only
has `{x,y}`; use `setFixPosition` for a point.

```ts
handle.setFixPosition(
  pos: {x: number, y: number, z?: number},
  range?: number,
  rangeType?: SoundRangeType
): void;
handle.setEntityPosition(
  entity: ig.Entity,
  align: EntityAlign,
  offset?: Vec3,
  range?: number,
  rangeType?: SoundRangeType
): void;
```

The default range is `1600`. A point’s audio plane is `(x, y - z)`. An entity’s
aligned position is converted to the same two-dimensional plane and refreshed
while the handle is alive. If the entity is killed, the handle’s detach callback
stops it.

### Listener and attenuation math

`ig.Camera` updates `ig.game.soundPos` from the camera’s sound position. The
WebAudio handle subtracts this listener center from the sound point. For a
circular range it uses the vector length; horizontal and vertical range types
zero one component before calculating distance. The engine then applies its
`KEY_SPLINES.EASE_SOUND` curve between a near distance (`range * 0.1`) and a
far distance (`range * 0.9`), with the PannerNode’s `maxDistance` set to range.

The PannerNode uses:

```js
panningModel = 'equalpower';
distanceModel = 'linear';
refDistance = range * 0.1;
maxDistance = range;
```

The existing `positional-audio` mod sets `_doPanning = true` for short sounds,
which the native handle otherwise disables when a non-looping sample is under
one second. Its optional power curve replaces the engine’s easing with
`clamp(1 - distance / range, 0, 1) ** 1.5`.

### Why short sounds are special

The engine only updates panning for handles whose duration is at least one
second or that loop. This is a deliberate cost/voice optimization. The mod
opens that gate, but it increases per-handle position work and can expose more
PannerNode overhead during combat. Make short-sound spatialization configurable
and test dense hit effects before enabling it by default.

## WebAudio graph and ownership

The sound manager creates three buses:

```text
sound effects → sound GainNode ┐
music tracks  → music GainNode ├→ (optional compressor) → master GainNode → destination
                              ┘
```

The wrapper exposes `connectSound`, `disconnectSound`, `connectMusic`, and
`disconnectMusic`. A positioned effect is:

```text
BufferSource → GainNode → PannerNode → sound bus
```

A non-positioned effect skips the PannerNode. A `BufferSource` is one-shot; do
not attempt to restart a stopped source. The engine creates a fresh
`WebAudioBufferGain` when a handle is played again after a pause/stop.

```ts
ig.soundManager.connectSound(node: AudioNodeWrapper): void;
ig.soundManager.disconnectSound(node: AudioNodeWrapper): void;
ig.soundManager.setSoundVolume(volume: number): void;
ig.soundManager.setMusicVolume(volume: number): void;
ig.soundManager.setMasterVolume(volume: number): void;
```

The implementation squares volume values at handle/node boundaries. Treat
volume as a normalized user-facing value in `[0, 1]`; do not compensate by
multiplying arbitrary gain values above one without measuring clipping.

## Lifecycle, pause, and focus

`ig.SoundManager.update()` resumes a suspended AudioContext, solves sound-group
requests, and removes completed handles. `ig.SoundManager.reset()` stops active
handles and clears its sound stack.

Window focus is coordinated through `ig.system.setWindowFocus`:

- losing focus calls `ig.music.onWindowFocusLost()` and
  `ig.soundManager.onWindowFocusLost()`;
- sound handles are pushed into a pause stack, and hard-stop behavior may remove
  them from active tracking;
- regaining focus pops/resumes the stack and restarts music nodes as needed.

A mod that creates its own nodes must listen to the same focus/lifecycle boundary
or explicitly stop/disconnect its nodes. Do not leave a raw oscillator or
BufferSource running after a map/menu transition.

## Background music

`ig.bgm` wraps `ig.music` with named cached tracks and a stack:

```ts
ig.bgm.loadTrack(name: string): ig.BgmTrack;
ig.bgm.loadTrackSet(name: string): ig.BgmTrackSet;
ig.bgm.play(track: ig.BgmTrack, volume: number, mode?: BgmSwitchMode): void;
ig.bgm.push(track: ig.BgmTrack, volume: number, mode?: BgmSwitchMode): void;
ig.bgm.pop(mode?: BgmSwitchMode): void;
ig.bgm.clear(mode?: BgmSwitchMode): void;
ig.bgm.inbetween(track: ig.BgmTrack, volume: number, mode?: BgmSwitchMode): void;
ig.bgm.pause(mode?: BgmSwitchMode): void;
ig.bgm.resume(mode?: BgmSwitchMode): void;
```

Available switch modes include `IMMEDIATELY`, `FAST_OUT`, `MEDIUM_OUT`,
`SLOW_OUT`, `VERY_SLOW_OUT`, `FAST`, `MEDIUM`, `SLOW`, and `VERY_SLOW`.
A mode is a `{fadeOut, fadeIn}` pair in seconds.

The default stack contains track types such as `field`; combat or another
subsystem can push a type. Calling `play`/`push` overloads the default. Calling
`pop` returns toward the default depth. Map attributes can replace the default
track set at `onLevelLoadStart`, and the default resumes two deferred frames
after `onLevelLoaded` unless blocked.

Tracks support intro segments and loop-end offsets. WebAudio tracks schedule
current and next nodes ahead of time; HTML5 tracks alternate two audio channels.
Do not manually call `track.play()` on a track owned by `ig.bgm` while it is on
the stack, or the BGM state and fade timers will diverge.

## Adding custom audio safely

1. Put the asset under the mod’s asset root and resolve it through the mod’s
   installed directory, not a repository-only path.
2. Use the game’s cached sound/resource loader; do not decode a new buffer for
   every event.
3. Choose a group and decide whether the event is positional before playback.
4. Keep the returned handle if the sound loops or must be stopped on cleanup.
5. Check `ig.Sound.enabled` and `ig.soundManager.hasWebAudio` before accessing
   backend-specific features.
6. Exercise map transitions, pause/focus, HTML5 fallback, and dense group spam.

## Guardrails

- Never assume WebAudio is active; `ig.Sound` may be the HTML5 backend.
- Never use a raw `AudioContext` destination for a mod sound; connect into the
  engine’s sound or music bus so volume/focus behavior remains coherent.
- Never create a PannerNode for every frame; create one per live handle and
  update its position only while the handle is active.
- Never play a one-shot every update tick; debounce events and use sound groups.
- Never forget to stop looping handles when their entity/map is removed.
- Never call `setEntityPosition` with a killed entity and expect it to remain
  valid.
- Never treat `range` as a CSS or physical-screen distance; it is map-plane
  distance relative to `ig.game.soundPos`.
- Never mutate `ig.bgm.trackStack` directly; use `play`, `push`, `pop`, or
  `resumeDefault`.
- Never hand a BGM `ig.BgmTrack` to `ig.SoundHelper`; effects and tracks have
  different ownership/lifecycle models.

## Related

- [Positional-audio recipe](recipes/positional-audio.md)
- [Engine audio reference](../engine/impact/05-audio.md)
- [BGM reference](../engine/impact/features/12-bgm.md)
- [Agent reference](../agent-reference.md)
- [Modding index](README.md)
