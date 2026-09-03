# Modding API reference

> A searchable index of the most useful verified surfaces. Signatures are
> TypeScript-style documentation, not runtime typings; confirm optional
> arguments in `deobf/clean/` before shipping against another game version.

## Runtime and hooks

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
  onLevelLoadStart?(levelData: unknown): void;
  onLevelLoaded?(): void;
  onTeleport?(from: unknown, to: unknown, loadHint?: unknown): void;
  onReset?(): void;
}

ig.addGameAddon(factory: () => GameAddon): void;
Class.inject(methods: Record<string, Function>): void;
```

`ig.Game.draw()` calls pre-draw addons, applies the zoom transform, draws world
layers, calls mid-draw addons, draws post-layer sprites, restores zoom, then
calls post-draw addons. Lists are independently sorted by their matching order
property.

## Canvas and coordinate conversion

```ts
ig.system.width: number;          // logical canvas width
ig.system.height: number;         // logical canvas height
ig.system.realWidth: number;      // current backing width
ig.system.realHeight: number;     // current backing height
ig.system.contextWidth: number;
ig.system.contextHeight: number;
ig.system.scale: number;
ig.system.contextScale: number;

ig.system.getBufferContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D;
ig.system.createImageBuffer(width: number, height: number, draw: Function): HTMLCanvasElement;
ig.system.getScreenFromMapPos(out: Vec2, mapX: number, mapY: number): Vec2;
ig.system.getMapFromScreenPos(out: Vec2, logicalX: number, logicalY: number): Vec2;
ig.system.startZoomedDraw(): void;
ig.system.endZoomedDraw(): void;
```

`getScreenFromMapPos` and `getMapFromScreenPos` use logical canvas coordinates.
A physical post-draw pass should call `ctx.resetTransform()` and use current
backing dimensions. `createImageBuffer` temporarily replaces `ig.system.context`
for its callback and restores it afterward; the callback reads the context from
`ig.system.context` rather than receiving a parameter.

## Native lighting

```ts
new ig.LightHandle(
  entity: ig.Entity, size: number, fadeIn: number, fadeOut: number,
  duration: number, maxAlpha: number, glow?: boolean
): ig.LightHandle;
handle.setOffset(x: number, y: number, z: number): void;
handle.stop(): void;
handle.update(): boolean;
handle.draw(alphaMultiplier?: number, sizeOffset?: number): void;

ig.light.addLightHandle(handle: ig.LightHandle): void;
ig.light.addDarknessHandle(handle: ig.DarknessHandle): void;
ig.light.removeDarknessHandle(handle: ig.DarknessHandle): void;
ig.light.addScreenFlashHandle(handle: ig.ScreenFlashHandle): void;
ig.light.addShadowProvider(provider: ShadowProvider): void;
ig.light.removeShadowProvider(provider: ShadowProvider): void;
ig.light.addCondLight(condition, pos, lightSize, glowSize?, glowColor?): void;

new ig.DarknessHandle(useActualTick?: boolean): ig.DarknessHandle;
handle.setIntensity(intensity: number, duration: number): void;
handle.setTemporary(entity, intensity, duration, fadeIn, fadeOut): void;
```

A light size selects a rectangle in `media/map/lightmap.png`; it is not an
arbitrary radius. Native handle updates are owned by `ig.Light.onDeferredUpdate`.

## Audio

```ts
sound.play(loop?: boolean, params?: SoundPlayParams): ig.SoundHandle | null;
ig.SoundHelper.playAtEntity(sound, entity, loop?, params?, range?, rangeType?): ig.SoundHandle;
handle.setFixPosition(pos, range?, rangeType?): void;
handle.setEntityPosition(entity, align, offset?, range?, rangeType?): void;

ig.bgm.play(track, volume, mode?): void;
ig.bgm.push(track, volume, mode?): void;
ig.bgm.pop(mode?): void;
ig.bgm.clear(mode?): void;
```

`ig.SoundHelper`’s cleaned local parameter names are misleading; use the call
shape above, which matches its forwarding to `sound.play(loop, params)`. The
WebAudio backend positions a handle only when `_doPanning` is enabled; the
native optimization skips short non-looping samples under one second.

## GUI

```ts
new ig.GuiElementBase(): ig.GuiElementBase;
element.setPos(x, y): void;
element.setSize(w, h): void;
element.setPivot(x, y): void;
element.setAlign(alignX, alignY): void;
element.addChildGui(child): void;
element.removeChildGui(child): void;
element.remove(immediate?): void;
element.doStateTransition(name, immediate?, removeAfter?, callback?, delay?): void;
ig.gui.addGuiElement(element): void;
ig.gui.removeGuiElement(element): void;

new ig.ImageGui(image, offsetX?, offsetY?, width?, height?): ig.ImageGui;
new ig.ColorGui(color, width?, height?): ig.ColorGui;
```

GUI layout is logical-canvas space. `ig.GuiHook` owns the retained tree and
mouse-registration state; `ig.GuiElementBase.updateDrawables(renderer)` queues
pooled draw steps.

## Options and storage

```ts
sc.OPTIONS_DEFINITION[key: string]: OptionDefinition;
sc.options.set(key: string, value: unknown, isLocal?: boolean): void;
sc.options.get(key: string, isLocal?: boolean): unknown;
sc.options.persistOptions(): void;
ig.storage.register(listener: StorageListener): void;
listener.onStorageSave?(data: object): void;
listener.onStoragePreLoad?(data: object): void;
listener.onStoragePostLoad?(data: object): void;
listener.onStorageGlobalSave?(data: object): void;
listener.onStorageGlobalLoad?(data: object): void;
```

Late-added options require manual value seeding before a menu can read them.
Storage listeners must use a unique top-level key and tolerate missing/corrupt
fields during older-save loads.

## Worker tasks

```ts
new ig.Worker(path: string, name: string): ig.Worker;
worker.doTask(type: string, payload: object, callback: (result: object) => void): void;
WORKER[name][type](payload: object, callback?: Function): object;
```

The engine protocol uses `_type` and `_id` in worker messages and returns `_id`.
A synchronous fallback reads `WORKER[name][type]`; preserve task/result shapes
between real-worker, fallback, and accelerated implementations.

## Mod manifest

```ts
type Manifest = {
  id: string; version: string; dependencies?: Record<string, string>;
  preload?: string; postload?: string; prestart?: string; poststart?: string;
  plugin?: string; assets?: string[];
};
```

See [mod lifecycle](mod-lifecycle.md) for stage timing and package rules.

## Related

- [Agent reference](../agent-reference.md)
- [Rendering and lighting](rendering-and-lighting.md)
- [Audio](audio.md)
- [UI and menus](ui-and-menus.md)
- [Mod lifecycle](mod-lifecycle.md)
- [Troubleshooting](troubleshooting.md)
