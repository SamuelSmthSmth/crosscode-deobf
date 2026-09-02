#!/usr/bin/env node
/**
 * hw/test-wasm.js — correctness harness for the lighting kernels.
 *
 * Always tests the pure-JS reference kernels. If dist/LightingWasm.js has been
 * produced (run build/build.sh with Emscripten), it ALSO loads the compiled
 * WASM in Node and cross-checks its output against the reference within the
 * tolerance allowed by Float32/uint8 rounding.
 *
 * Usage:
 *   node hw/test-wasm.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ref = require('../worker/lighting-kernels.js');

const W = 64, H = 48;

function makeTestSet(nightFactor, lights) {
    // Plain gradient-ish source so lit vs un-lit differences are unambiguous.
    const src = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < src.length; i += 4) {
        src[i] = 200; src[i + 1] = 180; src[i + 2] = 160; src[i + 3] = 255;
    }
    const params = {
        radialLights: lights,
        ambientR: 0.2, ambientG: 0.2, ambientB: 0.25,
        nightFactor: nightFactor,
        lightGain: 1
    };
    return { src, params };
}

const BASIC_LIGHTS = [{ cx: 32, cy: 24, radius: 20, intensity: 0.9, r: 255, g: 220, b: 180, falloff: 1.5 }];

let failures = 0;
function check(name, cond) {
    if (cond) { console.log('  ok  ' + name); }
    else { failures++; console.error('FAIL  ' + name); }
}

function runWasm(inst, src, w, h, params) {
    const cwrap = inst.cwrap;
    const init = cwrap('lighting_init', 'number', ['number', 'number']);
    const clear = cwrap('lighting_clear', 'void', []);
    const addRadial = cwrap('lighting_add_radial', 'void',
        ['number','number','number','number','number','number','number','number']);
    const apply = cwrap('lighting_apply', 'void',
        ['number','number','number','number','number','number','number','number','number','number']);
    const setThreads = cwrap('lighting_set_max_threads', 'void', ['number']);
    const parallelism = cwrap('lighting_get_last_parallelism', 'number', []);

    setThreads(4); // force a deterministic fan-out so the harness can prove threading

    const bytes = w * h * 4;
    const sb = inst._malloc(bytes);
    const ob = inst._malloc(bytes);
    init(w, h);
    clear();
    (params.radialLights || []).forEach((L) => {
        addRadial(L.cx || 0, L.cy || 0, L.radius || 1, L.intensity || 1,
            (L.r !== undefined) ? L.r : 255,
            (L.g !== undefined) ? L.g : 255,
            (L.b !== undefined) ? L.b : 255,
            (L.falloff !== undefined) ? L.falloff : 1.5);
    });
    const wa = inst.HEAPU8; // fetch AFTER growth (init/malloc may grow memory)
    wa.set(src, sb);
    apply(sb, ob, w, h,
        params.ambientR || 0.2, params.ambientG || 0.2, params.ambientB || 0.25,
        params.nightFactor || 1, params.lightGain === undefined ? 1 : params.lightGain);    const out = new Uint8ClampedArray(bytes);
    out.set(new Uint8Array(wa.buffer, ob, bytes));
    inst._free(sb);
    inst._free(ob);
    return { out: out, parallelism: parallelism() };
    }

function maxChannelDiff(a, b) {
    let max = 0;
    for (let i = 0; i < a.length; i++) {
        const d = Math.abs(a[i] - b[i]);
        if (d > max) max = d;
    }
    return max;
}

async function main() {
    console.log('lighting-wasm correctness harness\n------------------------------------');

    check('runtime provides SharedArrayBuffer (threading support)',
        typeof SharedArrayBuffer !== 'undefined');

    // 1) Night-mode composite on the JS reference.
    console.log('[JS reference kernels]');
    const refNight = ref.APPLY(makeTestSet(1, BASIC_LIGHTS).src,
        W, H, makeTestSet(1, BASIC_LIGHTS).params);
    const idxLit = (24 * W + 32) * 4;   // near light center
    const idxDark = (0 * W + 0) * 4;    // far from light
    check('lit pixel brighter than un-lit ambient pixel',
        refNight[idxLit] > refNight[idxDark] + 40);
    check('all channels within 0..255',
        [].every.call(refNight, (v) => v >= 0 && v <= 255));

    // 2) nightFactor = 0 is a day pass-through (identity).
    const refDay = ref.APPLY(makeTestSet(0, BASIC_LIGHTS).src,
        W, H, makeTestSet(0, BASIC_LIGHTS).params);
    const daySrc = makeTestSet(0, BASIC_LIGHTS).src;
    let identity = true;
    for (let i = 0; i < refDay.length; i++) if (refDay[i] !== daySrc[i]) { identity = false; break; }
    check('nightFactor=0 leaves a pixel unchanged (day)', identity);
    check('alpha is preserved', refNight[3] === 255 && refDay[3] === 255);

    // 3) WASM cross-check, if a build exists.
    const gluePath = path.join(__dirname, '..', 'dist', 'LightingWasm.js');
    if (fs.existsSync(gluePath)) {
        console.log('[WASM cross-check: ' + path.relative(process.cwd(), gluePath) + ']');
        try {
            const create = require(gluePath);
            const inst = await create({
                locateFile: function (p) { return path.join(path.dirname(gluePath), p); }
            });
            const ws = makeTestSet(1, BASIC_LIGHTS);
            const res = runWasm(inst, ws.src, W, H, ws.params);
            const diff = maxChannelDiff(res.out, refNight);
            check('WASM matches JS reference within rounding tolerance (max diff ' + diff + ')', diff <= 6);
            check('WASM out shape', res.out.length === W * H * 4);
            check('WASM ran across multiple pthreads (parallelism ' + res.parallelism + ')',
                res.parallelism >= 2);
        } catch (e) {
            failures++;
            console.error('FAIL  could not load/run WASM: ' + (e && e.message));
        }
    } else {
        console.log('[WASM] dist/LightingWasm.js missing — build with build/build.sh first; testing JS reference only.');
    }

    console.log('\n' + (failures ? failures + ' check(s) FAILED' : 'All checks passed.'));
    process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });