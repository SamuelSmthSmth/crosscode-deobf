"use strict";
/**
 * lighting-wasm — main-thread wrapper
 * ===================================
 * Exposes ig.LightingEngine, a thin, engine-native wrapper over the WASM
 * lighting worker. It reuses the engine's own ig.Worker so task dispatch,
 * callbacks, and the synchronous fallback all behave exactly like the engine's
 * image worker (ig.Image.worker.doTask).
 *
 * This pass only builds the compute backbone: no ig.GameAddon, no draw hooks.
 * The visual lighting features land later, on the "game world, under the HUD"
 * layer established by tilt-shift.
 *
 * Diagnostics / dev-overlay:
 *   - Every APPLY result carries `wasm` (true when running the compiled WASM,
 *     false for the pure-JS fallback) and `parallelism` (peak pthreads used).
 *   - ig.LightingEngine.diag(callback) runs a synthetic frame through the same
 *     worker and reports a one-shot verdict + timing, for the dev-overlay panel.
 *   - _diag holds the latest live telemetry (SAB availability, core count,
 *     current wasm/parallelism, last self-test) for read-only HUD display.
 *
 * Usage:
 *   ig.LightingEngine.apply(imageData, {
 *       radialLights: [{ cx, cy, radius, intensity, r, g, b, falloff }],
 *       ambientR: 0.2, ambientG: 0.2, ambientB: 0.25,
 *       nightFactor: 1, lightGain: 1
 *   }, function (result) {
 *       // result = { data, width, height, wasm: bool, parallelism: int, error? }
 *   });
 *
 *   ig.LightingEngine.diag(function (d) { /* d.verdict, d.wasm, d.parallelism, d.ms *\/ });
 */
(function () {
    var MOD_ID = 'lighting-wasm';

    /**
     * Locate this mod's installed directory relative to ig.root.
     * ig.Worker prepends ig.root, so we return a dir like "mods/lighting-wasm/".
     * Falls back to the standard ccloader layout if window.activeMods is hidden.
     */
    function resolveModDir() {
        try {
            var mods = window.activeMods || [];
            for (var i = 0; i < mods.length; i++) {
                var m = mods[i];
                var dir = (m && m.baseDirectory) || '';
                var matches = (m.name === MOD_ID) ||
                              (m.displayName === MOD_ID) ||
                              (dir.indexOf(MOD_ID) >= 0);
                if (!matches || !dir) continue;
                if (dir.indexOf('assets/') === 0) dir = dir.substring(7); /* ig.root-relative */
                return dir.charAt(dir.length - 1) === '/' ? dir : dir + '/';
            }
        } catch (e) { /* fall through */ }
        return 'mods/' + MOD_ID + '/';
    }

    function now() {
        return (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
    }

    function boot() {
        if (!window.ig || !ig.Worker) { setTimeout(boot, 100); return; }
        if (ig.LightingEngine) return;

        var workerPath = resolveModDir() + 'worker/lighting-worker.js';

        var eng = {
            worker: null,

            // Latest telemetry, cheap to read every frame from a HUD panel.
            _diag: {
                ready: false,
                sab: (typeof SharedArrayBuffer !== 'undefined'),
                hw: (navigator && navigator.hardwareConcurrency) || 1,
                wasm: null,        // true = compiled WASM active; false = JS fallback
                parallelism: 0,    // peak pthreads from the last APPLY (0 = single-threaded)
                ms: -1,            // ms of the last APPLY
                lastTest: null     // verdict object from the last diag() run (or null)
            },

            /** Lazily create the engine worker (one per runtime). */
            getWorker: function () {
                if (this.worker) return this.worker;
                this.worker = new ig.Worker(workerPath, 'LIGHTING');
                this._diag.ready = true;
                return this.worker;
            },

            /**
             * Run the composite lighting kernel.
             * src: an ImageData-like object (or a { data, width, height }).
             * Returns via callback the worker's result dict directly:
             *   { data, width, height, wasm, parallelism, error? }.
             */
            apply: function (src, params, callback) {
                if (!src || !src.data) {
                    if (callback) callback({ error: 'bad src; expected ImageData-like {data,width,height}' });
                    return;
                }
                params = params || {};
                var payload = {
                    src: src.data,
                    width: src.width,
                    height: src.height,
                    radialLights: params.radialLights || [],
                    ambientR: params.ambientR,
                    ambientG: params.ambientG,
                    ambientB: params.ambientB,
                    nightFactor: params.nightFactor,
                    lightGain: params.lightGain
                };
                var t0 = now();
                try {
                    this.getWorker().doTask('APPLY', payload, function (msg) {
                        var d = eng._diag;
                        if (!msg || msg.error) {
                            d.lastTest = null;
                            if (callback) callback({ error: (msg && msg.error) || 'no reply' });
                            return;
                        }
                        // msg is the worker's result dict (ig.Worker passes event.data through).
                        if (typeof msg.wasm === 'boolean') d.wasm = msg.wasm;
                        if (typeof msg.parallelism === 'number') d.parallelism = msg.parallelism;
                        d.ms = now() - t0;
                        if (callback) callback(msg);
                    });
                } catch (e) {
                    if (callback) callback({ error: String(e) });
                }
            },

            /**
             * One-shot self-test: push a synthetic frame through the exact same
             * APPLY path and report a PASS/FAIL verdict. callback(d):
             *   { verdict: 0/1, sab: bool, hw: int, wasm: bool, parallelism: int,
             *     ms: float, correct: bool, error? }
             * verdict 1 = SAB available && compiled WASM active && parallelism >= 2
             *            && brightness sanity check passed.
             */
            diag: function (callback) {
                callback = callback || function () {};
                var W = 96, H = 72;
                var data = new Uint8ClampedArray(W * H * 4);
                for (var i = 0; i < data.length; i += 4) { data[i] = 200; data[i + 1] = 180; data[i + 2] = 160; data[i + 3] = 255; }
                var params = {
                    radialLights: [{ cx: 48, cy: 36, radius: 24, intensity: 0.9, r: 255, g: 220, b: 180, falloff: 1.5 }],
                    ambientR: 0.2, ambientG: 0.2, ambientB: 0.25,
                    nightFactor: 1, lightGain: 1
                };
                var d = eng._diag;
                this.apply({ data: data, width: W, height: H }, params, function (res) {
                    var report = {
                        sab: typeof SharedArrayBuffer !== 'undefined',
                        hw: (navigator && navigator.hardwareConcurrency) || 1,
                        wasm: !!res.wasm,
                        parallelism: res.parallelism || 0,
                        ms: d.ms,
                        error: res.error
                    };
                    var correct = false;
                    if (res && res.data && !res.error) {
                        // Night pass: a pixel near the light must be brighter than a corner.
                        var lit = (36 * W + 48) * 4;
                        var dark = 0;
                        correct = (res.data[lit] > res.data[dark] + 20);
                    }
                    report.correct = correct;
                    report.verdict = (report.sab && report.wasm &&
                                      report.parallelism >= 2 && correct) ? 1 : 0;
                    d.lastTest = report;
                    callback(report);
                });
            }
        };

        ig.LightingEngine = eng;

        if (window.console && console.log) {
            console.log('[lighting-wasm] ig.LightingEngine ready (worker at ' + workerPath + '). ' +
                'diag() self-test available for dev-overlay.');
        }
    }

    boot();
})();