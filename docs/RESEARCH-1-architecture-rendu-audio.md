# DOC 1 — Internal architecture: rendering & audio (deobf reference)

> **Historical/deep-dive research document.** For canonical hook names,
> coordinate terminology, typed signatures, and non-negotiable constraints, use
> [`docs/game/agent-reference.md`](game/agent-reference.md). Verify claims
> against `deobf/clean/` when targeting a new runtime.
>
> Source: `deobf/clean/` (569 modules, 100 % cleaned, LCS ≥ 0.929 vs extract).
> Complements `RENDERING-RESEARCH.md` (resolution/FPS) and
> `deobf/RENDERING-2.5D-NOTES.md` (2.5D, lighting, parallax). This doc covers
> **rendering AND audio** from the point of view of the 5 features of
> `Visuals_to_check.md`.

---

## 1. Fundamental truth: Canvas2D only

CrossCode = ImpactJS (`ig.*`) + CrossCode layer (`sc.*`), running in nw.js
(Chromium). **A single 2D `<canvas>`, no WebGL, no shaders.**

Consequence for `Visuals_to_check.md`: every item talks about "fragment
shader", "normal map", "Gaussian kernel in the fragment shader". **There
is no shader.** Everything must be reimplemented as Canvas2D operations:
`globalCompositeOperation`, `globalAlpha`, banded `drawImage`, `ctx.filter`
(SVG CSS filters, supported by Chromium/nw.js), offscreen buffers. Feasible,
but with a radically different performance budget (DOC 3).

## 2. Rendering pipeline (exact order, `ig.Game.draw`, line 718)

```
runFrame (ig.System, impact.base.system.js)
  gate frameSkip → ig.Timer.step() → tick (clamped maxStep = 1/30)
  delegate.run() = sc.CrossCode.run()
    update() : addons.preUpdate → physics → events → addons.postUpdate
    draw()   :
      1. setScreenPos on every layer               (scroll + parallax)
      2. addons.preDraw (sorted)                   ← ig.screenBlur (1000) redirects the context
      3. ig.system.startZoomedDraw()               (camera zoom)
      4. renderer.prepareDraw(shownEntities)       (viewport cull + updateSprites + slots)
         renderer.drawLayers()                     ("first" → levels → "last")
      5. addons.midDraw (sorted)                   ← light composite, weather, VisualOverhaul (150)
      6. renderer.drawPostLayerSprites()           ("postlight" + GUI-sprites)
      7. ig.system.endZoomedDraw()
      8. addons.postDraw (sorted)                  ← HUD (ig.gui 500), tilt-shift (250), overhaul (245)
    finalDraw() : dark veil if the window is unfocused
```

**Effective orders observed** (ascending sort within each phase):
- preDraw: `ig.screenBlur` (1000) redirects `ig.system.context` to its buffer.
- midDraw: `ig.light` (light composite), weather, `VisualOverhaul` (150).
- postDraw: `ig.screenBlur` (200, recomposes), `VisualOverhaul` (245),
  **tilt-shift (250)**, `ig.gui` (500, HUD — always sharp on top).

**Anchoring points for a mod**: an `ig.GameAddon` with `preDrawOrder` /
`midDrawOrder` / `postDrawOrder` inserts exactly where it wants. The HUD
(`postDrawOrder` 500) always stays sharp above the world effects — that's the
architecture tilt-shift and visual-overhaul already exploit.

## 3. Resolution & coordinates (reminder from RENDERING-RESEARCH.md)

- `ig.system.width/height` = **logical** resolution (568×320) — culling, HUD,
  mouse are measured against this.
- `contextWidth/Height` = `realWidth/Height` = **physical/backing space** =
  `width × scale`
  (1136×640 at scale 2). Fullscreen effects use `realWidth`.
- `screenWidth/Height` = CSS size; mouse remapped by
  `mouse.x *= ig.system.width / ig.system.screenWidth`.
- **Mod rule**: drawing in *physical* space (`realWidth`) requires
  `ctx.save(); ctx.resetTransform(); … ctx.restore()` — that's what
  visual-overhaul does. Drawing in **logical canvas space** lets the camera
  zoom apply (often what you want for a world-anchored effect).

## 4. Audio: complete architecture (`impact.base.sound.js`, 1393 lines)

### 4.1 WebAudio graph (already in place)

```
BufferSource → GainNode (ig.WebAudioBufferGain)
   → [PannerNode if positional]  (equalpower, distanceModel linear)
   → volumes.sound (GainNode)  ─┐
   → volumes.music (GainNode)  ─┤→ [DynamicsCompressor −6 dB, ratio 20:1] → master → destination
```

`ig.soundManager.volumes = { master, music, sound }`: three separate GainNodes
**already wired**. `setMasterVolume / setMusicVolume / setSoundVolume` are
called by the options (`volume-master`, `volume-music`, `volume-sound`).

### 4.2 Positional audio: ALREADY IMPLEMENTED (key discovery for item 5)

`ig.SoundHandleWebAudio` already implements 2.5D audio:

- `setEntityPosition(entity, align, offset, range, rangeType)` /
  `setFixPosition(pos, range)` — position refreshed **every frame**
  (`_updateEntityPos` via `entity.getAlignedPos(align)`, `ig.ENTITY_ALIGN`).
- `play()` creates a **PannerNode**: `panningModel="equalpower"`,
  `distanceModel="linear"`, `refDistance = 0.1 × range`,
  `maxDistance = range` (default **1600 px**).
- Position refreshed each frame from `pos.point − ig.game.soundPos`.
- **Attenuation**: `EASE_SOUND` spline over `(dist − near)/far` with
  `near = 0.1 × range`, `far = 0.9 × range` — close to linear attenuation,
  not exactly the power 1.5 of Visuals_to_check (cosmetic difference).
- **Panning**: `PannerNode.setPosition(x, y, −0.1 × range)` in equalpower —
  stereo pan is derived from the x position relative to the listening center.
- **Listening reference frame**: `ig.game.soundPos` is updated by the camera
  (`impact.feature.camera.camera.js` lines 93-94) — the "listening center"
  already follows the camera, not the player.
- **Crucial gating**: `_doPanning = (duration ≥ 1 s) || loop`. Short sounds
  (< 1 s) are NOT spatialized — that's the real bottleneck for item 5 (combat
  hits < 1 s are not spatialized).
- `ig.SOUND_RANGE_TYPE`: CIRCULAR / HORIZONTAL / VERTICAL — anisotropic range
  possible (useful: attenuate only along horizontal distance).
- `ig.SoundHelper.playAtEntity(sound, entity, params, loop, range, rangeType)`
  is the standard helper, **already used everywhere** (NPC footsteps range 700,
  item drops, puzzle, combat).

**Conclusion for item 5**: attenuation + panning already exist. What's missing:
1. spatialize short sounds (< 1 s) — widen the `_doPanning` gating;
2. optionally adjust the curve (power 1.5 vs the `EASE_SOUND` spline);
3. nothing to do for the reference frame: `ig.game.soundPos` already follows
   the camera (camera lines 93-94).

### 4.3 Music (BGM)

- `ig.Music`: track stack with **native cross-fade** (`_transitionType`
  0/1/2, `_intervalStep` every 16 ms, `_fadeInTime`/`_setFadeOut`).
- `ig.TrackWebAudio`: seamless loop via double `BufferGain`
  (currentNode/nextNode pre-scheduled at exact context times) + separate intro
  (`introPath`/`introEnd`). The night-mode BGM cross-fade is therefore
  **native**: `ig.bgm.play(track, volume, mode)` with `ig.BGM_SWITCH_MODE`
  (fadeOut/fadeIn from 0 to 5 s: IMMEDIATELY → VERY_SLOW).
- `ig.Bgm` (addon): track stack + per-type track sets (field/battle…),
  `pushDefaultTrackType("battle")` during combat then `resumeDefault`,
  save persistence (`onStorageSave`). "The Void" mode (fade to 0) =
  `ig.bgm.pause("SLOW")` ; "Nightfall OST" = `ig.bgm.play(nightTrack, vol,
  "SLOW")`. Everything is native.

### 4.4 Map ambience

`ig.mapSounds` (`impact.feature.map-sounds.js`): per-map ambience loop
(`ig.MAP_SOUNDS.*`, e.g. CARGO_SHIP_OUTSIDE with random seagulls). A night mod
can inject night variants by overriding `ig.MAP_SOUNDS[key]` before the map
loads (segments: owls at night).

## 5. Available Canvas2D toolbox (without shaders)

| Canvas2D tool | Use for the 5 items |
|---|---|
| `globalCompositeOperation` (`lighter`, `destination-out`, `source-atop`…) | additive god rays, lantern (hole in the darkness), glows |
| `globalAlpha` | attenuation, fades |
| `ctx.filter = 'blur(Npx) brightness() contrast() saturate()'` (SVG filters, Chromium) | bokeh foreground, approximate motion blur, tilt-shift (already exploited) |
| Banded/sliced `drawImage` | distortion, reflections, ripple (proven by visual-overhaul) |
| Offscreen buffers (`ig.system.createImageBuffer`, mod buffers) | multi-pass: occlusion mask, reflections |
| `globalCompositeOperation='destination-out'` | "punching a hole" in the darkness for the lantern (proven by night-mode) |
| `getImageData` | avoid in a loop (stalls the pipeline) — the engine only uses it in the image worker (`ig.Image.worker`) |

## 6. Feasibility verdict per item (details in DOC 2)

| # | Item | Feasibility | Path |
|---|---|---|---|
| 1 | God rays + canopy noise | **Partial** | pseudo: approximated occlusion mask + world-anchored additive rays; no per-pixel occlusion without costly getImageData |
| 2 | Translucent water, refraction, reflections | **Partial→Good** | planar reflections by flip (proven by puddle-reflections); refraction by ripple strips (proven); depth by layer tint |
| 3 | Directional velocity motion blur | **Good** | `coll.vel` exists; smear = multi-drawImage along the velocity vector, or reuse the native speedlines effect |
| 4 | Foreground parallax + bokeh | **Good** | `distance > 1` doesn't exist natively (distance ≤ 1) → inject `setScreenPos`; bokeh = `ctx.filter` blur on the layer |
| 5 | Positional 2.5D audio | **Already ~80%** | PannerNode + attenuation + panning exist; widen `_doPanning` gating (sounds ≥ 1 s); `ig.game.soundPos` already follows the camera |