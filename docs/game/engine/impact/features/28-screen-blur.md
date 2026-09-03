# impact.feature.screen-blur — post-draw blur

> **Status**: core · Modules: `impact.feature.screen-blur.screen-blur`,
> `impact.feature.screen-blur.screen-blur-steps`, `impact.feature.screen-blur.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `screen-blur.screen-blur` | `ig.ScreenBlur` (addon), `ig.ZoomBlurHandle`, `ig.BLUR_ZOOM_CONFIG` | Post-draw fullscreen blur (static & zoom-radial) with handles |
| `screen-blur.screen-blur-steps` | EVENT_STEP: `SET_SCREEN_BLUR`, `CLEAR_SCREEN_BLUR`, `SET_ZOOM_BLUR`, `FADE_OUT_ZOOM_BLUR`; ACTION_STEP: `SET_ZOOM_BLUR`, `FADE_OUT_ZOOM_BLUR` | Scripted blur effects |
| `screen-blur.plug-in` | — | Entry point + editor registration |

## At a glance

| Task | API / step | Order / space |
|---|---|---|
| Add uniform blur | `SET_SCREEN_BLUR` / `ig.ScreenBlur` | Buffer swap, post-draw composite |
| Add radial blur | `ig.ZoomBlurHandle` / `SET_ZOOM_BLUR` | Logical focus with zoom transform |
| Fade radial blur | `FADE_OUT_ZOOM_BLUR` | Handle lifetime |
| Keep HUD sharp | Composite before `ig.gui` | Post-draw order below 500 |

```ts
ig.screenBlur.addZoom(handle: ig.ZoomBlurHandle): void;
handle.setFadeOut(time: number): void;
```

## Guardrails

- Do not assume the current context is the original canvas: this addon
  redirects it during `onPreDraw` and restores/composites later.
- Do not copy a frame without documenting whether the source includes prior
  post-processing (order determines the effect chain).
- Keep blur buffers resize-aware and avoid full-resolution filter passes every
  frame unless measured.
- Never let a blur composite cover the HUD accidentally; choose an order below
  `ig.gui` (500) or explicitly document the intentional exception.

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