/**
 * lighting-kernels.js
 * ===================
 * Pure-JS reference implementations of the lighting kernels, mirroring
 * src/lighting.cpp exactly. Used three ways:
 *
 *   1. In-page synchronous fallback when the runtime has no `Worker`
 *      (registered as global WORKER_LIGHT_REF, consumed by lighting-worker.js).
 *   2. A correctness cross-check in hw/test-wasm.js against the compiled WASM.
 *   3. A working path before the Emscripten build exists (dist/LightingWasm.js).
 *
 * Because it is kept 1:1 with the C++ source, the only permitted differences
 * are numeric precision (Float64 vs Float32; float light map vs rounded uint8).
 */
(function (global, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        global.WORKER_LIGHT_REF = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function num(v, d) {
        return (typeof v === 'number' && isFinite(v)) ? v : d;
    }

    function clampByte(v) {
        return v < 0 ? 0 : (v > 255 ? 255 : Math.round(v));
    }

    /**
     * Build the additive radial light map (Float32, so sums can exceed 255 the
     * same way the WASM uint8 map can saturate).
     */
    function buildLightMap(w, h, lights) {
        var map = new Float32Array(w * h * 4);
        for (var li = 0; li < lights.length; li++) {
            var L = lights[li];
            var cx = num(L.cx, 0);
            var cy = num(L.cy, 0);
            var radius = num(L.radius, 1);
            var intensity = num(L.intensity, 1);
            var r = L.r !== undefined ? L.r : 255;
            var g = L.g !== undefined ? L.g : 255;
            var b = L.b !== undefined ? L.b : 255;
            var falloff = L.falloff !== undefined ? L.falloff : 1.5;
            if (radius <= 0) continue;
            var invR = 1 / radius;
            var rn = r / 255, gn = g / 255, bn = b / 255;
            for (var y = 0; y < h; y++) {
                var dy = y - cy;
                var row = y * w * 4;
                for (var x = 0; x < w; x++) {
                    var dx = x - cx;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    var t = 1 - dist * invR;
                    var atten = t > 0 ? Math.pow(t, falloff) : 0;
                    var amp = atten * intensity;
                    var i = row + x * 4;
                    map[i] += amp * rn * 255;
                    map[i + 1] += amp * gn * 255;
                    map[i + 2] += amp * bn * 255;
                }
            }
        }
        return map;
    }

    /**
     * APPLY — the composite task. Mirrors lighting_apply (single copy-in/copy-out).
     */
    function apply(src, w, h, params) {
        params = params || {};
        var lights = params.radialLights || [];
        var map = buildLightMap(w, h, lights);

        var ambR = num(params.ambientR, 0.2);
        var ambG = num(params.ambientG, 0.2);
        var ambB = num(params.ambientB, 0.25);
        var nightFactor = num(params.nightFactor, 1);
        var lightGain = num(params.lightGain, 1);

        var out = new Uint8ClampedArray(w * h * 4);
        var invNight = 1 - nightFactor;
        for (var i = 0; i < w * h * 4; i += 4) {
            var r = src[i];
            var gr = src[i + 1];
            var b = src[i + 2];
            var a = src[i + 3];

            var lr = Math.min(map[i] / 255, 1) * lightGain;
            var lg = Math.min(map[i + 1] / 255, 1) * lightGain;
            var lb = Math.min(map[i + 2] / 255, 1) * lightGain;

            var litR = r * (ambR + lr);
            var litG = gr * (ambG + lg);
            var litB = b * (ambB + lb);

            out[i] = clampByte(r * invNight + litR * nightFactor);
            out[i + 1] = clampByte(gr * invNight + litG * nightFactor);
            out[i + 2] = clampByte(b * invNight + litB * nightFactor);
            out[i + 3] = a;
        }
        return out;
    }

    return {
        APPLY: apply,
        BUILD_LIGHT_MAP: buildLightMap
    };
});