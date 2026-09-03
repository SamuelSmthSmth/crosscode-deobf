# Recipe: positional audio for short sounds

> Extend the native WebAudio positioning gate so short one-shot effects receive
> distance attenuation and stereo panning. This is the architecture used by
> `assets/mods/positional-audio/`.

## Contract

| Item | Choice |
|---|---|
| Backend | WebAudio only; HTML5 Audio has no equivalent PannerNode path |
| Injection | `ig.SoundHandleWebAudio.init` |
| Position math | retain native `_setPosition()` unless a custom curve is enabled |
| State | one option prefix, `posaud-` in the existing mod |
| Fallback | remain idle and log when WebAudio is inactive |
| Cleanup | native handle/entity detach and sound-manager update own lifetime |

## Minimal gate-opening patch

```js
(function () {
    'use strict';
    if (window.__shortSpatialAudioInstalled) return;

    function boot() {
        if (!window.ig || !ig.SoundHandleWebAudio ||
            !ig.soundManager || !ig.soundManager.hasWebAudio) {
            if (window.ig && ig.soundManager && !ig.soundManager.hasWebAudio) return;
            setTimeout(boot, 100);
            return;
        }

        ig.SoundHandleWebAudio.inject({
            init: function (buffer, offset, startTime, loop, volume, speed, fadeDuration) {
                this.parent(buffer, offset, startTime, loop, volume, speed, fadeDuration);
                this._doPanning = true;
            }
        });

        window.__shortSpatialAudioInstalled = true;
    }
    boot();
})();
```

The native `init` sets `_doPanning` only when the sound duration is at least one
second or it loops. Setting it after `parent()` preserves all normal duration,
fade, loop, and buffer initialization while changing only the optimization gate.

## Play a positioned effect

Use the semantic helper order `sound, entity, loop, params, range, rangeType`:

```js
var handle = ig.SoundHelper.playAtEntity(
    hitSound,
    enemy,
    false,
    { speed: 1.0 },
    700,
    ig.SOUND_RANGE_TYPE.CIRULAR
);
```

For a fixed point:

```js
var handle = hitSound.play(false, { speed: 1.0 });
if (handle) {
    handle.setFixPosition({ x: 420, y: 300, z: 24 }, 900,
        ig.SOUND_RANGE_TYPE.CIRULAR);
}
```

The entity helper requires a valid `entity.coll` and follows the entity’s
aligned position. Keep the returned handle only when you need to stop, pause,
or inspect it; the sound manager tracks ordinary one-shots.

## Optional power falloff

A custom curve must replace only the distance-to-panner-position part and must
preserve range-type semantics:

```js
_setPosition: function () {
    if (!this.pos) return;
    this._updateEntityPos();
    if (!this._nodePosition) return;

    var dx = this.pos.point.x - ig.game.soundPos.x;
    var dy = this.pos.point.y - ig.game.soundPos.y;
    if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] === ig.SOUND_RANGE_TYPE.HORIZONTAL) dx = 0;
    if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] === ig.SOUND_RANGE_TYPE.VERTICAL) dy = 0;

    var distance = Math.sqrt(dx * dx + dy * dy);
    var t = Math.max(0, Math.min(1, 1 - distance / this.pos.range));
    var gain = Math.pow(t, 1.5);
    var scaled = gain * this.pos.range;
    if (distance > 0) {
        dx = dx / distance * scaled;
        dy = dy / distance * scaled;
    } else {
        dx = dy = 0;
    }
    this._nodePosition.setPosition(dx, dy, -0.1 * this.pos.range);
}
```

This example changes the PannerNode’s distance position; it does not directly
set a GainNode. The engine’s panner model derives attenuation from that position.
If a mod wants a separate volume curve, add a dedicated gain node and document
how it composes with the engine’s squared volume and distance model.

## Options and fallback

Expose short-sound spatialization and custom curves behind namespaced options:

```js
sc.OPTIONS_DEFINITION['mymod-short-sounds'] = {
    type: 'CHECKBOX', init: true, cat: sc.OPTION_CATEGORY.AUDIO
};
```

When the HTML5 backend is selected, leave the patch inactive and either use
ordinary playback or a fixed-position fallback. Do not emulate panning by
creating a second audio element at every event.

## Test matrix

- short non-looping hit at listener center, near edge, and outside range;
- looping ambience that follows a moving entity;
- circular, horizontal, and vertical range types;
- two simultaneous sounds in one group and two different groups;
- paused game, window blur/focus, and AudioContext suspension;
- killed entity before and during playback;
- HTML5 fallback / `IG_FORCE_HTML5_AUDIO`;
- sound volume `0`, master/music/sound volume changes, and map transition;
- dense combat with the feature enabled and disabled.

## Guardrails

- Never access `PannerNode` fields when `hasWebAudio` is false.
- Never patch the generic `ig.Sound` object when only WebAudio supports the
  feature; the selected backend may be HTML5.
- Never allocate a new AudioContext per sound.
- Never update a panner after its source/handle has been stopped and disconnected.
- Never remove handles from `ig.soundManager.soundHandles` manually during its
  update loop.
- Never assume the helper’s cleaned local parameter names reflect its semantic
  call order; verify its forwarding to `sound.play(loop, params)`.

## Related

- [Audio handbook](../audio.md)
- [Engine audio reference](../../engine/impact/05-audio.md)
- [Mod lifecycle](../mod-lifecycle.md)
- [Modding index](../README.md)
