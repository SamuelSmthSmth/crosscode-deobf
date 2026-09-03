# CrossCode agent reference — hooks, spaces & guardrails

> **Purpose:** the shortest reliable path from a modding goal to the correct
> engine surface. This page is normative for terminology and injection order;
> subsystem pages add detail. Source of truth: `deobf/clean/` and the live mod
> examples under `assets/mods/`.

## 60-second routing table

| Goal | Start here | Injection point | Space / phase |
|---|---|---|---|
| Run logic before physics | `ig.GameAddon` | `onPreUpdate`, `preUpdateOrder` | simulation |
| Run logic after entities/camera | `ig.GameAddon` | `onPostUpdate`, `postUpdateOrder` | simulation; camera is 100 |
| Prepare an offscreen world pass | `ig.GameAddon` | `onPreDraw`, `preDrawOrder` | renderer context may be redirected |
| Draw with the world before post-layer sprites | `ig.GameAddon` | `onMidDraw`, `midDrawOrder` | logical/map space; zoom active |
| Composite an effect under the HUD | `ig.GameAddon` | `onPostDraw`, order 200–499 | physical screen pixels after reset |
| Draw above the HUD for diagnostics | `ig.GameAddon` | `onPostDraw`, order >500 | physical screen pixels |
| Follow or redirect the camera | `ig.Camera` API | `pushTarget` / `replaceTarget` | map pixels; camera owns `screen` |
| Read/write persistent options | `sc.OptionModel` | `sc.OPTIONS_DEFINITION`, `sc.options` | model/storage state |
| Save subsystem state | `ig.GameAddon` / model | `onStorageSave` / `onStorageLoad` where provided | serialized state |
| Add a data-driven command | step registry | `ig.EVENT_STEP` or `ig.ACTION_STEP` | event/action context |
| Add a renderer-side effect | existing renderer or addon | prefer addon; inject only when draw-local state is required | Canvas2D |
| Add positional audio | sound helper/handle | `playAtEntity` / `setEntityPosition` | map position relative to `ig.game.soundPos` |

## Hook order cheat sheet

`ig.Game` sorts each hook list numerically. The lists are independent: a
`preDrawOrder` value is not compared with a `postDrawOrder` value.

| Lifecycle | Hook | Known engine/mod anchors | Practical use |
|---|---|---:|---|
| Update | `onPreUpdate` | control 5; NPC runners 100 | input/control before or after other update work |
| Update | `onPostUpdate` | camera 100; rumble 110; combat 500; arena 700 | react after simulation, update camera/state |
| Draw | `onPreDraw` | light 0; screen blur 1000; tilt-shift 999 | build shadows or redirect the render context |
| Draw | `onMidDraw` | light 0; weather 100; environment particles 101 | composite world effects between world layers |
| Draw | `onPostDraw` | screen blur 200; tilt-shift 250; wet-floor 300; GUI 500; dev overlay 600 | post-process world, then HUD, then diagnostics |
| Deferred | `onDeferredUpdate` | light, ambient-nights patterns | timers/handles that should run outside normal entity update |
| Level | `onLevelLoadStart` → `onLevelLoaded` | camera, loadables, weather | clear/rebuild map-dependent caches |

**Ordering rule:** choose an unused value deliberately and document what the
addon must be above and below. Values shown for mods are repository examples,
not a universal reserved-number registry.

## Canonical coordinate vocabulary

Use these names consistently:

| Term | Definition | Typical values / API |
|---|---|---|
| **Map space** | World/game coordinates in map pixels, including entity `x/y/z`. | `entity.coll.pos`, camera targets, physics |
| **Logical canvas space** | The game’s designed canvas coordinate system. Camera zoom is expressed around this viewport. | `ig.system.width/height` (normally 568×320) |
| **Physical/backing space** | Canvas bitmap pixels. Full-screen buffers and `realWidth/realHeight` live here. | `ig.system.realWidth/realHeight`, `contextWidth/Height` |
| **CSS viewport space** | Browser/window pixels outside the backing canvas. | `screenWidth/Height`, DOM layout |
| **Screen space** | Use only for coordinates after map-to-screen conversion; qualify whether they are logical or physical. | `getScreenFromMapPos`; post-draw pixels after transform reset |

Do not call backing pixels “logical screen space.” Do not call map pixels
“screen space.” If a page means a physical canvas pixel, say **physical
screen/backing pixel**; if it means the camera viewport, say **logical canvas**.

### Transform rule

The world renderer and `midDraw` run while the camera zoom transform is active.
A post-draw addon still receives the shared context, so a physical full-screen
pass must isolate and clear that transform:

```ts
function drawPhysicalOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.resetTransform();
  // Use ig.system.realWidth / realHeight here.
  ctx.restore();
}
```

For a world-anchored effect, keep the camera transform and convert map points
with the engine API instead of reconstructing the camera math:

```ts
ig.system.getScreenFromMapPos(out, mapX, mapY): Vec2;
ig.system.getMapFromScreenPos(out, logicalX, logicalY): Vec2;
```

## Typed pseudo-signatures

These are documentation signatures, not a replacement for runtime inspection.
Optional arguments and exact enum members vary by subsystem.

```ts
interface GameAddon {
  name: string;
  preUpdateOrder: number;
  postUpdateOrder: number;
  deferredUpdateOrder: number;
  preDrawOrder: number;
  midDrawOrder: number;
  postDrawOrder: number;
  onPreUpdate?(): void;
  onPostUpdate?(): void;
  onDeferredUpdate?(): void;
  onPreDraw?(): void;
  onMidDraw?(): void;
  onPostDraw?(): void;
  onLevelLoadStart?(level: unknown): void;
  onLevelLoaded?(level: unknown): void;
}

ig.camera.pushTarget(
  handle: TargetHandle,
  speed?: number | CameraSpeed,
  transition?: KeySpline,
  name?: string
): void;
ig.camera.popTarget(
  speed?: number | CameraSpeed,
  transition?: KeySpline
): void;
ig.camera.replaceTarget(
  oldHandle: TargetHandle,
  newHandle: TargetHandle,
  speed?: number | CameraSpeed,
  transition?: KeySpline
): void;

ig.system.getScreenFromMapPos(out: Vec2, mapX: number, mapY: number): Vec2;
ig.system.getMapFromScreenPos(out: Vec2, logicalX: number, logicalY: number): Vec2;
ig.system.setZoom(zoom: number): void;
ig.system.setZoomFocus(x: number, y: number): void;

ig.SoundHelper.playAtEntity(
  sound: ig.Sound,
  entity: ig.Entity,
  params?: unknown,
  loop?: boolean,
  range?: number,
  rangeType?: SoundRangeType
): ig.SoundHandle;
handle.setEntityPosition(
  entity: ig.Entity,
  align?: EntityAlign,
  offset?: Vec3,
  range?: number,
  rangeType?: SoundRangeType
): void;

ig.system.createImageBuffer(
  width: number,
  height: number,
  draw?: (ctx: CanvasRenderingContext2D) => void
): HTMLCanvasElement;

ig.storage.onStorageSave?(data: StorageData): void;
ig.storage.onStorageLoad?(data: StorageData): void;
```

### Step and data signatures

```ts
type StepData = { type: string; wait?: boolean; waitSkip?: number } & Record<string, unknown>;
type EventSheet = { name?: string; input?: Record<string, unknown>; steps: StepData[] };
type ActionScript = StepData[];

ig.EVENT_STEP[stepType].exec(call: EventCall, data: StepData): void;
ig.ACTION_STEP[stepType].exec(actor: ig.Entity, data: StepData): void;
```

Treat these as shape guides. The cleaned class definitions and each step’s
`_wm` metadata are authoritative for required fields and enum values.

## Guardrails — hard constraints

1. **Never modify** `assets/js/game.compiled.js` or generated compiled output.
2. **Never hijack `ig.Game.prototype.draw`** for a new effect when an addon hook
   can express the same ordering. Use `ig.GameAddon` and sort the affected list.
3. **Never advance simulation state in draw hooks.** Draw passes should render
   from state; clocks, timers, and model mutations belong in update hooks.
4. **Always use `ctx.save()` / `ctx.restore()` around context mutations.**
5. **Always call `ctx.resetTransform()` before a physical full-screen pass** and
   use `realWidth/realHeight`, not fixed 568×320 constants.
6. **Never call `getImageData`/`putImageData` every frame on the main canvas**
   unless profiling proves the round-trip acceptable; prefer buffers, strips,
   precomputation, or the worker pattern.
7. **Never blur a full-resolution frame every frame** with `ctx.filter`. Prefer
   pre-rendered chunks, restricted regions, half-resolution buffers, and an
   adaptive/failsafe quality mode.
8. **Never allocate canvases, arrays, or image atlases inside a hot draw loop.**
   Allocate on boot, level load, resize, or cache invalidation.
9. **Always rebuild map-sized caches on `onLevelLoadStart`/`onLevelLoaded` and
   resize-sensitive buffers on `ig.system.resize`.**
10. **Never assume a mod is loaded because its folder exists.** Check `mods.json`,
    `ccmod.json`, packaging (`.ccmod` or extracted folder), and lifecycle field.
11. **Use `ig.*`/`sc.*`/`cc.*` and `Class.inject`; do not bind new code to raw
    obfuscated tokens.**
12. **Give options a unique prefix** and route them through `sc.options` so they
    persist through the game’s storage model.
13. **Do not rely on undocumented hook order by accident.** State the numeric
    order and the intended neighboring addon in the page or mod header.
14. **Do not claim a data field is universal** when it is template-, entity-, or
    format-specific. Verify against representative live JSON and `_wm` metadata.
15. **Test the worst case:** dense combat, zoom, menus/HUD, map transitions,
    widescreen resize, paused state, and a runtime without optional WebAudio/WASM.

## Agent workflow

1. Search this page for the goal, then open the linked subsystem page.
2. Confirm the exact class and method in `deobf/clean/` before writing an inject.
3. Pick the lifecycle hook and numeric order; record the neighboring systems.
4. Identify the coordinate space and conversion boundary before drawing.
5. Reuse an existing buffer/worker/pool pattern; add adaptive quality for heavy FX.
6. Validate syntax, exercise the relevant mod harness, and perform an in-game
   smoke test if the change touches rendering, input, audio, or save state.

## Related references

- [Engine index](engine/README.md) · [game layer](engine/game/README.md)
- [Rendering](engine/impact/03-rendering.md) · [camera](engine/impact/features/10-camera.md)
- [Audio](engine/impact/05-audio.md) · [events](engine/impact/07-events.md)
- [Mods](mods/README.md) · [media](media/README.md)
- [Legacy research index](research-notes.md)
