# impact.feature.video — video playback

> **Status**: core · Modules: `impact.feature.video.video`,
> `impact.feature.video.video-gui`, `impact.feature.video.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `video.video` | `ig.Video` (addon) | WebM video loading/playback with sound (NWF `<video>` or shim) |
| `video.video-gui` | `ig.VideoGui`, `ig.VideoPlayerGui` | GUI hosting the video player + skip prompt |
| `video.plug-in` | — | Entry point + editor registration |

## Behavior

- Plays fullscreen webm videos (intro logo sequences, the game's opening
  cinematic) with audio; supports skip via the interact key.
- `ig.VideoPlayerGui` is the on-screen player element; `ig.VideoGui`
  manages the sequence (fade in → play → await end/skip → fade out).
- Playback is hooked into the boot flow between loading and the title
  screen; videos are referenced from `game.config` boot settings.