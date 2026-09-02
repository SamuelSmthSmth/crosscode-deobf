# impact.feature.bgm — BGM (music) management

> **Status**: core · Modules: `impact.feature.bgm.bgm`,
> `impact.feature.bgm.bgm-steps`, `impact.feature.bgm.plug-in`.
> Looping/cross-fade low-level: `impact.base.sound.js` `ig.Music`
> ([../05-audio.md](../05-audio.md)). Game layer: `game.feature.bgm.playlist`,
> `game.feature.bgm.volume-map`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `bgm.bgm` | `ig.BGM_SWITCH_MODE`, `ig.BgmTrack`, `ig.BgmTrackSet`, `ig.Bgm` (GameAddon, `ig.bgm`) | Track stack: play/pause/resume/push/pop, per-type track sets (field/battle), fades, save persistence |
| `bgm.bgm-steps` | EVENT_STEP: `PLAY_BGM`, `PAUSE_BGM`, `RESUME_BGM`, `PUSH_BGM`, `POP_BGM`, `IN_BETWEEN_BGM`, `SET_DEFAULT_BGM`, `RESUME_DEFAULT_BGM` | Scripted music changes |
| `bgm.plug-in` | — | Entry point + volume-map attribute registration |

## Behavior

- `ig.bgm.play(track, volume, mode)` with
  `ig.BGM_SWITCH_MODE` = fade durations IMMEDIATELY → VERY_SLOW (0–5 s) —
  the native cross-fade (RESEARCH-1 §4.3: seamless loops via double
  pre-scheduled `BufferGain` + separate intro section).
- Track **sets**: map of context → track list (normal/battle/…);
  `pushDefaultTrackType("battle")` during combat then `resumeDefault` —
  this is the field↔battle music switch.
- "The Void" (fade-to-silence) = `ig.bgm.pause("SLOW")`; "Nightfall OST" =
  `ig.bgm.play(nightTrack, vol, "SLOW")`.
- Per-map playlists defined in `game.feature.bgm.playlist`
  (`sc.BgmPlaylist`: track defs, switch songs, multi-audio) consuming
  `assets/media/bgm/**`; `game.feature.bgm.volume-map` provides global
  per-SFX volume overrides.

## Data touchpoints

- Track files: `assets/media/bgm/` (mus + ogg per track, e.g. `evo-lab/`).
- Volume curve data: `volume-map` module (game layer).