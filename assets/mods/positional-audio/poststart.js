"use strict";
// ===========================================================================
// Positional Audio v1.0.0 — full 2.5D spatial audio for ALL sounds.
//
// The engine already implements positional audio (PannerNode, distance
// attenuation, stereo panning) but only applies it to sounds that last >= 1
// second or loop. This mod opens the gate so EVERY positioned sound — short
// combat hits, item pickups, UI clicks — is attenuated and panned relative to
// the camera's listening center (ig.game.soundPos).
//
// Optional falloff modes (Options > Mods):
//   Engine   — the game's own EASE_SOUND spline (default)
//   Power    — clamp(1 - dist/range, 0, 1)^1.5 as in the original plan
// ===========================================================================

(function () {
    var MOD_PREFIX = 'posaud-';

    function boot() {
        if (!window.ig || !ig.SoundHandleWebAudio || !ig.soundManager || !ig.soundManager.hasWebAudio) {
            // WebAudio backend not active (HTML5 fallback) — nothing to do.
            if (window.ig && window.ig.soundManager && !window.ig.soundManager.hasWebAudio) {
                console.warn('[Positional Audio] WebAudio backend inactive; mod idle.');
                return;
            }
            setTimeout(boot, 100);
            return;
        }
        if (window.__positionalAudioBooted) return;
        window.__positionalAudioBooted = true;

        // ---- Options (Options > Mods tab) --------------------------------
        var OPT = sc.OPTIONS_DEFINITION;
        var CAT = sc.OPTION_CATEGORY;
        if (window.sc && OPT && CAT) {
            if (CAT.MODS === undefined) CAT.MODS = 8;
            OPT[MOD_PREFIX + 'enabled'] = { type: 'CHECKBOX', init: true, cat: CAT.MODS };
            OPT[MOD_PREFIX + 'short-sounds'] = { type: 'CHECKBOX', init: true, cat: CAT.MODS };
            OPT[MOD_PREFIX + 'power-curve'] = { type: 'CHECKBOX', init: false, cat: CAT.MODS };
        }
        if (window.sc && sc.options && sc.options.values) {
            sc.options.values[MOD_PREFIX + 'enabled'] = sc.options.values[MOD_PREFIX + 'enabled'] !== undefined
                ? sc.options.values[MOD_PREFIX + 'enabled'] : true;
            sc.options.values[MOD_PREFIX + 'short-sounds'] = sc.options.values[MOD_PREFIX + 'short-sounds'] !== undefined
                ? sc.options.values[MOD_PREFIX + 'short-sounds'] : true;
            sc.options.values[MOD_PREFIX + 'power-curve'] = sc.options.values[MOD_PREFIX + 'power-curve'] !== undefined
                ? sc.options.values[MOD_PREFIX + 'power-curve'] : false;
        }
        function opt(key, fallback) {
            if (window.sc && sc.options && sc.options.values && sc.options.values[MOD_PREFIX + key] !== undefined) {
                return sc.options.values[MOD_PREFIX + key];
            }
            return fallback;
        }

        // ---- 1. Spatialize short sounds --------------------------------
        ig.SoundHandleWebAudio.inject({
            init: function (buffer, offset, startTime, loop, volume, speed, fadeDuration) {
                this.parent(buffer, offset, startTime, loop, volume, speed, fadeDuration);
                if (opt('short-sounds', true)) this._doPanning = true;
            }
        });

        // ---- 2. Optional power-curve falloff: clamp(1 - d/range,0,1)^1.5 --
        ig.SoundHandleWebAudio.inject({
            _setPosition: function () {
                if (!opt('power-curve', false)) { this.parent(); return; }
                if (!this.pos) return;
                this._updateEntityPos();
                if (!this._nodePosition) return;
                var scratch = { x: 0, y: 0 };
                scratch.x = this.pos.point.x - (window.ig.game ? ig.game.soundPos.x : 0);
                scratch.y = this.pos.point.y - (window.ig.game ? ig.game.soundPos.y : 0);
                if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] === ig.SOUND_RANGE_TYPE.HORIZONTAL) scratch.x = 0;
                else if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] === ig.SOUND_RANGE_TYPE.VERTICAL) scratch.y = 0;
                var dist = Math.sqrt(scratch.x * scratch.x + scratch.y * scratch.y);
                var t = Math.max(0, Math.min(1, 1 - dist / this.pos.range));
                var gain = Math.pow(t, 1.5);
                var d = gain * this.pos.range;
                if (dist > 0) { scratch.x = scratch.x / dist * d; scratch.y = scratch.y / dist * d; }
                else { scratch.x = scratch.y = 0; }
                this._nodePosition.setPosition(scratch.x, scratch.y, -0.1 * this.pos.range);
            }
        });

        console.log('[Positional Audio] v1.0.0 — short-sound spatialization active.');
    }

    boot();
})();
