# impact.feature.overlay — blocking overlays

> **Status**: core · Modules: `impact.feature.overlay.overlay`,
> `impact.feature.overlay.overlay-steps`, `impact.feature.overlay.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `overlay.overlay` | `ig.Overlay` (addon), `ig.OverlayGui`, `ig.OverlayCornerGui`, `ig.AlphaTransitionHandler`, `ig.OVERLAY_CORNER`, `ig.perf.overlay` | Full-screen color overlays with alpha transitions, corner variants, perf tracking |
| `overlay.overlay-steps` | EVENT_STEP: `SET_OVERLAY`, `SET_OVERLAY_CORNER`; ACTION_STEP: `SET_OVERLAY_CORNER` | Scripted overlay fades (flash, dim, wipe) |
| `overlay.plug-in` | — | Entry point + editor registration |

## Behavior

- `ig.Overlay.setOverlay(color, alpha, transition)` paints a fullscreen
  rectangle over the world (under/over GUI per layer) with eased alpha;
  `ig.AlphaTransitionHandler` drives the fade in/out.
- Corner overlays (`ig.OVERLAY_CORNER`, `ig.OverlayCornerGui`) mask
  individual screen corners — used for wipe-style transitions shared with
  dream-fx ([18-dream-fx.md](18-dream-fx.md)).
- Every fade in the game (loading screens, cutscene dims, boss intro
  flashes, damage-screen red flashes) goes through this addon; `ig.perf.overlay`
  exposes frame-time stats for debugging.
- The GUI layer (`game.feature.overlay.gui.*`) wraps it for modal dialogs.