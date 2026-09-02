# impact.feature.screen-blur — post-draw blur

> **Status**: core · Modules: `impact.feature.screen-blur.screen-blur`,
> `impact.feature.screen-blur.screen-blur-steps`, `impact.feature.screen-blur.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `screen-blur.screen-blur` | `ig.ScreenBlur` (addon), `ig.ZoomBlurHandle`, `ig.BLUR_ZOOM_CONFIG` | Post-draw fullscreen blur (static & zoom-radial) with handles |
| `screen-blur.screen-blur-steps` | EVENT_STEP: `SET_SCREEN_BLUR`, `CLEAR_SCREEN_BLUR`, `SET_ZOOM_BLUR`, `FADE_OUT_ZOOM_BLUR`; ACTION_STEP: `SET_ZOOM_BLUR`, `FADE_OUT_ZOOM_BLUR` | Scripted blur effects |
| `screen-blur.plug-in` | — | Entry point + editor registration |

## Behavior

- `ig.ScreenBlur` applies a post-draw shader pass over the world (before
  the HUD): uniform blur for dialog/menu depth-of-field, and **zoom blur**
  (radial blur centred on a point, `ig.BLUR_ZOOM_CONFIG`) for speed lines
  and charge-ups.
- Each blur is a handle that eases in/out; `FADE_OUT_ZOOM_BLUR` decays a
  zoom blur while it is held (dash trails, burst attacks).
- Composes with the visual stack:
  light ([08-light.md](08-light.md)) → weather ([09-weather.md](09-weather.md))
  → blur → overlay ([26-overlay.md](26-overlay.md)).