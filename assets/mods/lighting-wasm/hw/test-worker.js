#!/usr/bin/env node
/**
 * hw/test-worker.js — exercises lighting-worker.js WITHOUT the game runtime:
 * it loads the worker source into a VM with a simulated worker global (no WASM
 * build present -> the pure-JS reference kernels must serve the tasks), then
 * drives the engine-compatible `WORKER.LIGHTING.APPLY` API and the `onmessage`
 * dispatch loop, asserting the results agree with the reference kernels.
 *
 * Usage:
 *   node hw/test-worker.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ref = require('../worker/lighting-kernels.js');
const workerSrc = fs.readFileSync(
    path.join(__dirname, '..', 'worker', 'lighting-worker.js'), 'utf8');

const W = 32, H = 24;

function makeSrc() {
    const src = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < src.length; i += 4) {
        src[i] = 180; src[i + 1] = 170; src[i + 2] = 150; src[i + 3] = 255;
    }
    return src;
}

const PARAMS = {
    radialLights: [{ cx: 16, cy: 12, radius: 12, intensity: 0.85, r: 255, g: 220, b: 180, falloff: 1.5 }],
    ambientR: 0.2, ambientG: 0.2, ambientB: 0.25,
    nightFactor: 1, lightGain: 1
};

let failures = 0;
function check(name, cond) {
    if (cond) { console.log('  ok  ' + name); }
    else { failures++; console.error('FAIL  ' + name); }
}

function eqArrays(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

function setupWorkerSandbox() {
    const sandbox = { console };
    sandbox.self = sandbox; // worker global aliases the VM global, like a real worker
    sandbox.location = { href: 'https://game.local/mods/lighting-wasm/worker/lighting-worker.js' };
    sandbox.WORKER_LIGHT_REF = ref; // reference kernels are "imported"
    sandbox.importScripts = function () {
        // Glue build absent -> simulate a missing dist/LightingWasm.js
        throw new Error('[test] dist/LightingWasm.js not present (build with emcc to use WASM)');
    };
    sandbox.postMessage = function () {};
    vm.createContext(sandbox);
    vm.runInContext(workerSrc, sandbox, { filename: 'lighting-worker.js' });
    return sandbox;
}

function main() {
    console.log('lighting-worker host harness\n-----------------------------');

    const sandbox = setupWorkerSandbox();

    // 1) Global registry is engine-compatible.
    check('global.WORKER.LIGHTING.APPLY is a function',
        typeof sandbox.WORKER.LIGHTING.APPLY === 'function');

    // 2) Direct sync call through WORKER.LIGHTING (engine fallback style).
    const src = makeSrc();
    const direct = sandbox.WORKER.LIGHTING.APPLY({ src, width: W, height: H, ...PARAMS });
    check('APPLY returns {data,width,height}',
        direct && direct.width === W && direct.height === H &&
        direct.data && direct.data.length === W * H * 4);

    // 3) Correctness vs the JS reference kernels.
    const expected = ref.APPLY(src, W, H, PARAMS);
    check('APPLY output matches reference kernels exactly',
        eqArrays(direct.data, expected));

    // 4) onmessage dispatch (worker path): pushes a task through _type/_id.
    const posted = [];
    sandbox.postMessage = function (msg) { posted.push(msg); };
    sandbox.onmessage({ data: { _type: 'APPLY', _id: 7, src, width: W, height: H, ...PARAMS } });
    const asyncResult = posted[0];
    check('dispatched task posts back {result buffer, _id}',
        asyncResult && asyncResult._id === 7 &&
        asyncResult.width === W && asyncResult.height === H &&
        asyncResult.data && asyncResult.data.length === W * H * 4);
    check('dispatched result equals reference', eqArrays(asyncResult.data, expected));

    // 5) Unknown task replies TASK NOT FOUND.
    const before = posted.length;
    sandbox.onmessage({ data: { _type: 'BOGUS', _id: 9 } });
    check('unknown task => {error:"TASK NOT FOUND"}',
        posted.length > before && posted[posted.length - 1].error === 'TASK NOT FOUND');

    console.log('\n' + (failures ? failures + ' check(s) FAILED' : 'All checks passed.'));
    process.exit(failures ? 1 : 0);
}

main();