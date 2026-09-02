# impact.feature.dream-fx — dream-sequence effects

> **Status**: core · Modules: `impact.feature.dream-fx.dream-fx`,
> `impact.feature.dream-fx.dream-fx-steps`, `impact.feature.dream-fx.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `dream-fx.dream-fx` | `ig.DreamFx` (addon), `ig.DreamAssets`, `ig.DreamCircleShadowGui`, `ig.DreamDotGui`, `ig.DreamSideGui`, `ig.OVERLAY_CORNER` | Full-screen dream-sequence visuals: vignette circle, drifting dots, side curtains |
| `dream-fx.dream-fx-steps` | EVENT_STEP: `START_DREAM_FX`, `SET_DREAM_FX_CIRCLE_SIZE`, `SET_DREAM_FX_COLORS`, `CLEAR_DREAM_FX` | Scripted dream transitions |
| `dream-fx.plug-in` | — | Entry point + editor registration |

## Behavior

- The dream FX compose a stylized "memory/dream" look: a soft vignette
  circle (whose size is tweenable — the classic CrossCode dream intro
  iris), drifting particle dots, and side bars. Colors are configurable
  (`SET_DREAM_FX_COLORS`).
- Rendering is additive over the scene (drawn after the world, before the
  HUD); the same `ig.OVERLAY_CORNER` concept is shared with the overlay
  system ([26-overlay.md](26-overlay.md)).
- Used by the dream intro, spoiler-room interludes, and shrine memory
  sequences. The circle-size step is also used for wipe-style transitions.