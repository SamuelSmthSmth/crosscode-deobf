# impact.base — Core engine (System, Game, Loader, Timer, Vars, boot)

> **Status**: core · Source: `deobf/clean/impact.base.system.js`,
> `impact.base.game.js`, `impact.base.loader.js`, `impact.base.timer.js`,
> `impact.base.utils.js`, `impact.base.vars.js`, `impact.base.dom.js`,
> `impact.base.extension.js`, `impact.base.steps.js`, `impact.base.action.js`,
> `impact.base.impact.js`, `impact.base.game-state.js`, `impact.base.lang.js`.
> Deep-dive companions: `docs/RESEARCH-1-architecture-rendu-audio.md`,
> `docs/RESEARCH-5-camera.md`, `RENDERING-RESEARCH.md`.

## Modules & classes

| Module | Key classes / objects | Responsibility |
|---|---|---|
| `impact.base.system` | `ig.System` | Window/canvas, logical resolution, zoom transform, frame loop (`runFrame`), input remapping, `getScreenFromMapPos` etc. |
| `impact.base.game` | `ig.Game`, `ig.GameAddon`, `ig.TeleportPosition` | Level loading/teleporting, entity lifecycle, addon hook phases, collision/trace helpers |
| `impact.base.loader` | `ig.Loader`, `ig.SingleLoadable`, `ig.JsonLoadable`, `ig.JsonTemplate`, `ig.Cacheable`, `ig.LoadCollector` | Asset loading pipeline; JSON file loading/validation/caching |
| `impact.base.timer` | `ig.Timer`, `ig.WeightTimer` | Delta-time stepping, weighted timers |
| `impact.base.utils` | `ig.UniformRNG`, math/gfx helpers, `Vec2/Vec3` scratch pools | Utilities, seeded RNG |
| `impact.base.vars` | `ig.Vars`, `ig.VarCondition`, `ig.VarPathResolver` | Global variable store (`ig.vars`), conditions, path resolution; save keyed state |
| `impact.base.dom` | `ig.dom` (object) | jQuery-style DOM helpers, DOMParser cache |
| `impact.base.extension` | `ig.ExtensionManager` (`ig.extensions`) | Engine extension lifecycle hooks (`bind`/`unbind`) |
| `impact.base.steps` | `ig.StepBase`, `ig.StepHelpers` | Base class for all step objects (event + action) |
| `impact.base.action` | `ig.Action`, `ig.ActionStepBase` (`= ig.StepBase`), `ig.ACTION_STEP` registry | Scripted action steps: targeting helpers `getVarName/getVec2/getVec3/getFace` |
| `impact.base.event` | `ig.Event`, `ig.EventCall`, `ig.EventManager`, `ig.EventRunType`, `ig.EventStepBase`, `ig.EVENT_STEP` registry, `ig.ENTITY_FETCH_MAP` | Cutscene/data-event runtime, step execution, entity lookups |
| `impact.base.game-state` | `ig.GameState` | Serializable game-state snapshots (level, vars, entities) |
| `impact.base.lang` | `ig.LangLabel` | Localized text labels (`{langUid}`-style), bakeVars, origin file tracking |
| `impact.base.impact` | — (boot glue) | `ig.module/requires/defines`, `Class`, global init order |

## At a glance

| Need | API / class | Contract |
|---|---|---|
| Add lifecycle logic | `ig.GameAddon` | Set a numeric order and implement only the needed callback |
| Schedule simulation work | `onPreUpdate` / `onPostUpdate` | Mutate state here, never in draw callbacks |
| Schedule rendering work | `onPreDraw` / `onMidDraw` / `onPostDraw` | Preserve/restore the shared Canvas2D context |
| Load JSON | `ig.JsonLoadable` / `ig.JsonTemplate` | Keep format-specific parsing in the owning subsystem |
| Read game state | `ig.vars`, models, `ig.game` | Respect save/load ownership and transient `tmp.*` state |

```ts
ig.GameAddon = ig.Class.extend({
  preUpdateOrder: number;
  postUpdateOrder: number;
  preDrawOrder: number;
  midDrawOrder: number;
  postDrawOrder: number;
  onPreUpdate?(): void;
  onPostUpdate?(): void;
  onPreDraw?(): void;
  onMidDraw?(): void;
  onPostDraw?(): void;
});
```

## Guardrails

- Never mutate simulation state from `onPreDraw`, `onMidDraw`, or `onPostDraw`.
- Never assume addon registration order is stable without setting and sorting
  the relevant numeric order.
- Never use fixed canvas dimensions for a full-screen effect; follow
  `ig.system.realWidth/realHeight` after resize.
- Never persist transient `tmp.*` variables as if they were durable quest or
  player state.

## The frame loop (`ig.System`, runFrame)

```
runFrame
 ├─ frame-skip gate → ig.Timer.step() (tick clamped to maxStep = 1/30)
 ├─ delegate.run() → sc.CrossCode.run()   (set by ig.Impact)
 │    ├─ update(): addons.preUpdate → physics → events → addons.postUpdate
 │    └─ draw():
 │         1. layer setScreenPos() (scroll + parallax)
 │         2. addons.preDraw  (sorted; ig.screenBlur @1000 redirects context)
 │         3. startZoomedDraw()  (zoom transform)
 │         4. renderer.prepareDraw/updateSprites → drawLayers → postLayer
 │         5. addons.midDraw (ig.light, weather, visual mods)
 │         6. endZoomedDraw()
 │         7. addons.postDraw (HUD @500 above world effects)
 └─ finalDraw() (dim veil when window unfocused)
```

`ig.Game` exposes the loop hooks as methods: `update()`, `draw()`, plus the
addon phases. **Addons** (`ig.GameAddon`) are how everything extra plugs in:
`preDrawOrder/midDrawOrder/postDrawOrder` (number), `preUpdateOrder/
postUpdateOrder`. Registered via `ig.game.addons`. **Order 500 = HUD** — the
canonical "above world, below nothing" slot.

## Key `ig.Game` surface

- Level handling: `loadLevel(levelData)`, `currentMap`, `previousMap`,
  `mapName`, teleport helpers (`ig.TeleportPosition`), `mapRenderingBlocked`.
- Entity lifecycle: `spawnEntity`, `sortEntities`, `show/kill` flags,
  `shownEntities`, `IG_ENTITY_KILL_CALL`.
- World queries: collision traces (`trace`, `traceHole`), water/height checks.
- GUI-sprite bucket + `drawPostLayerSprites` ("postlight" draw bucket).
- `ig.game.screen` / `ig.game.soundPos` — viewport + audio center (camera sets
  these, everything reads them). See
  [features/10-camera.md](features/10-camera.md).

## Coordinate spaces (from RESEARCH-1 §3, verified)

| Space | Size | Used by |
|---|---|---|
| Logical | `ig.system.width/height` = 568×320 | culling, HUD, mouse |
| Physical/backing | `contextWidth = width × scale` (normally 1136×640 @2) | full-screen effects |
| CSS screen | `screenWidth/Height` | input remap via `mouse.x *= width/screenWidth` |
| Map | map pixels | entities/camera/physics |

While zoomed, `ig.system` provides `getScreenFromMapPos` (map→screen),
`getMapFromScreenPos` (inverse), `getZoomMinOffset` (viewport shrink). Rule:
midDraw content is in map space and inherits zoom; postDraw content is in
screen space and needs `ctx.resetTransform()` to touch physical pixels.

## Vars — the global state dictionary

`ig.vars` (`ig.Vars`) is the cross-cutting key-value store (quest flags,
toggles, counters — e.g. `"tmp.roof1"`, `"item.448.toggled"` in map/event
JSON). Persisted with saves (the storage feature, [features/11-storage.md](features/11-storage.md),
saves `ig.vars` wholesale). Conditions in events/enemies use `ig.VarCondition`
("`type: CONDITION`"-ish objects) evaluated via `ig.VarPathResolver` — dotted
paths with `!` negation prefixes. `ig.vars` is also where HUD/model read
state back.

## Loader & JSON templates

- `ig.Loader` — load priority queue, progress events; the startup loading
  screen is `sc.StartLoader` (`game.feature` layer).
- `ig.SingleLoadable` — base for one-shot loadables `ig.GlobalSettings`,
  `ig.TileInfoList` (see [08-global-settings.md](08-global-settings.md)).
- `ig.JsonLoadable` — base for JSON-backed assets (`ig.AnimationSheet`).
- `ig.JsonTemplate` + `ig.Cacheable` — the generic "parse JSON file → typed
  template" machinery used by characters/enemies (game layer) with
  `_wm`-schema validation.

## Events & steps runtime (summary)

`ig.Event`/`ig.EventCall` run `EVENT_STEP` lists (see
[07-events.md](07-events.md)); `ig.Action` runs `ACTION_STEP` lists
(combat AI, scripted actions). Both build on `ig.StepBase`. The full
step class registries are split across base (this page's modules),
engine feature layer ([features/30-base.md](features/30-base.md)) and the
game layer (`game.feature.base.*`, combat, player…).

## Timer details

- `ig.Timer.step()` computes `tick`, clamped to `maxStep = 1/30` (slow-motion
  aware; see [features/25-slow-motion.md](features/25-slow-motion.md)).
- `ig.WeightTimer` — probability-weighted timer selection (used by enemy AI
  choice weighting, e.g. `frequency: "NORMAL"/"RARE"` in
  [ENEMY format](../../data/formats/01-enemy.md)).