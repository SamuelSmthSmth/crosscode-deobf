/**
 * lighting-worker.js
 * ==================
 * Host for the WASM lighting kernels, mirroring the engine's own worker
 * (assets/impact/webworker/image-tasks.js):
 *
 *   - registers tasks on the GLOBAL `WORKER.LIGHTING` registry (the engine's
 *     synchronous fallback reads bare `WORKER[key]`), and
 *   - dispatches `onmessage` tasks by `_type`, replying `{ result, _id }`.
 *
 * Task loading:
 *   - In a real Web Worker it dynamically imports the Emscripten SINGLE_FILE
 *     build (dist/LightingWasm.js), instantiates it (single-flight), and runs
 *     on WASM.
 *   - If that build is missing/fails, or the runtime has no `Worker`, it falls
 *     back to the pure-JS reference kernels (lighting-kernels.js) so the API
 *     still works — just without the C++ speedup.
 *
 * Registered tasks (WORKER.LIGHTING.*):
 *   APPLY  (data): { src: Uint8ClampedArray, width, height,
 *                    radialLights: [{cx,cy,radius,intensity,r,g,b,falloff}],
 *                    ambientR, ambientG, ambientB, nightFactor, lightGain }
 *          -> { data: Uint8ClampedArray, width, height }
 */
(function (global) {
    'use strict';

    var isWorker = typeof importScripts === 'function';

    var REF = global.WORKER_LIGHT_REF || null; /* pure-JS reference kernels */

    var wasm = null;                    /* Emscripten instance once instantiated */
    var fns = null;                     /* cwrap-bound exported functions */
    var wasmLoading = false;            /* single-flight guard for startWasm */
    var pending = [];                   /* tasks queued while wasm loads; null = settled */
    var threadsLogged = false;          /* once-only threading diagnostic */

    var buf = { srcBuf: 0, outBuf: 0, bytes: 0 };

    /* ------------------------------------------------------------------ */
    /* Small script loader (worker uses importScripts, page uses <script>) */
    /* ------------------------------------------------------------------ */
    function resolveUrl(rel) {
        if (isWorker) return new URL(rel, self.location.href).href;
        return rel;
    }

    function num(v, d) {
        return (typeof v === 'number' && isFinite(v)) ? v : d;
    }

    /* ------------------------------------------------------------------ */
    /* Reference kernels — load once for both worker and in-page fallback. */
    /* ------------------------------------------------------------------ */
    function loadReferenceKernels() {
        if (REF) return;
        var url = resolveUrl('./lighting-kernels.js');
        if (isWorker) {
            try {
                importScripts(url);
                REF = global.WORKER_LIGHT_REF || null;
            } catch (e) { /* leave REF null */ }
        } else if (global.document) {
            var s = global.document.createElement('script');
            s.src = url;
            s.async = false;
            (global.document.head || global.document.getElementsByTagName('head')[0])
                .appendChild(s);
        }
    }

    /* ------------------------------------------------------------------ */
    /* WASM bootstrap (single-flight so early tasks never double-instantiate) */
    /* ------------------------------------------------------------------ */
    function bindWasm() {
        var cwrap = wasm.cwrap.bind(wasm);
        fns = {
            init: cwrap('lighting_init', 'number', ['number', 'number']),
            clear: cwrap('lighting_clear', 'void', []),
            addRadial: cwrap('lighting_add_radial', 'void',
                ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
            apply: cwrap('lighting_apply', 'void',
                ['number', 'number', 'number', 'number', 'number', 'number',
                 'number', 'number', 'number', 'number']),
            setThreads: cwrap('lighting_set_max_threads', 'void', ['number']),
            lastParallelism: cwrap('lighting_get_last_parallelism', 'number', [])
        };
    }

    function flushPending() {
        var q = pending || [];
        pending = null; /* settle: future tasks decide wasm vs JS kernels */
        for (var i = 0; i < q.length; i++) q[i]();
    }

    function startWasm() {
        if (!isWorker) return; /* page fallback always uses JS kernels */
        if (wasm || wasmLoading) return; /* single-flight */
        wasmLoading = true;
        try {
            importScripts(resolveUrl('../dist/LightingWasm.js'));
        } catch (e) {
            wasmLoading = false;
            console && console.log('[lighting-wasm] glue import failed, using JS kernels:', e);
            flushPending();
            return;
        }
        if (typeof global.LightingWasm !== 'function') {
            wasmLoading = false;
            console && console.log('[lighting-wasm] dist/LightingWasm.js not found, using JS kernels');
            flushPending();
            return;
        }
        /* Non-SINGLE pthreads build: tell Emscripten where the .wasm lives so it
         * resolves relative to this mod's dist/ dir rather than the worker page. */
        var distBase = resolveUrl('../dist/');
        Promise.resolve(global.LightingWasm({
            locateFile: function (p) { return distBase + p; }
        })).then(function (inst) {
            wasm = inst;
            bindWasm();
            /* Cap the pthread fan-out to the machine (and keep it gentle: max 4). */
            var hw = (navigator && navigator.hardwareConcurrency)
                ? navigator.hardwareConcurrency : 4;
            fns.setThreads(Math.max(1, Math.min(hw, 4)));
            wasmLoading = false;
            flushPending();
        }).catch(function (err) {
            wasmLoading = false;
            console && console.log('[lighting-wasm] instantiation failed, using JS kernels:', err);
            flushPending();
        });
    }

    function allocBuffers(bytes) {
        if (buf.bytes === bytes && buf.srcBuf && buf.outBuf) return;
        if (buf.srcBuf) { wasm._free(buf.srcBuf); wasm._free(buf.outBuf); }
        buf.srcBuf = wasm._malloc(bytes);
        buf.outBuf = wasm._malloc(bytes);
        buf.bytes = bytes;
    }

    function runWasm(src, w, h, params) {
        var bytes = w * h * 4;
        allocBuffers(bytes);
        fns.init(w, h);
        fns.clear();
        var lights = params.radialLights || [];
        for (var i = 0; i < lights.length; i++) {
            var L = lights[i];
            fns.addRadial(num(L.cx, 0), num(L.cy, 0), num(L.radius, 1), num(L.intensity, 1),
                (L.r !== undefined ? L.r : 255), (L.g !== undefined ? L.g : 255),
                (L.b !== undefined ? L.b : 255), (L.falloff !== undefined ? L.falloff : 1.5));
        }
        /* Fetch the heap AFTER any malloc/init memory growth so the view is current. */
        var wa = wasm.HEAPU8;
        wa.set(src, buf.srcBuf);               /* single copy-in */
        fns.apply(buf.srcBuf, buf.outBuf, w, h,
            num(params.ambientR, 0.2), num(params.ambientG, 0.2), num(params.ambientB, 0.25),
            num(params.nightFactor, 1), num(params.lightGain, 1));
        var out = new Uint8ClampedArray(bytes);
        out.set(new Uint8Array(wa.buffer, buf.outBuf, bytes)); /* single copy-out */
        if (!threadsLogged) {
            threadsLogged = true;
            console && console.log('[lighting-wasm] pthread parallelism observed: ' +
                fns.lastParallelism() + ' worker(s)');
        }
        return out;
    }

    function runRef(src, w, h, params) {
        if (!REF) throw new Error('[lighting-wasm] reference kernels not loaded (WORKER_LIGHT_REF)');
        return REF.APPLY(src, w, h, params);
    }

    /* ------------------------------------------------------------------ */
    /* Task registry (mirrors the engine's WORKER.IMAGE; exposed globally) */
    /* ------------------------------------------------------------------ */
    var TASKS = {};

    TASKS.APPLY = function (data, callback) {
        var wasmActive = !!(isWorker && wasm);
        var out, par = 0;
        if (wasmActive) {
            out = runWasm(data.src, data.width, data.height, data);
            par = fns.lastParallelism(); /* peak pthreads used by the last kernel call */
        } else {
            out = runRef(data.src, data.width, data.height, data);
        }
        /* `wasm`+`parallelism` ride the result dict so a host (dev-overlay) can
         * prove the WASM is compiled in AND actually fanning out across threads.
         * parallelism 0 => single-threaded JS fallback. */
        var result = {
            data: out, width: data.width, height: data.height,
            wasm: wasmActive, parallelism: par
        };
        if (callback) callback(result);
        return result;
    };

    /* Engine-compatible global registry (ig.Worker's fallback reads bare `WORKER`). */
    global.WORKER = global.WORKER || {};
    global.WORKER.LIGHTING = TASKS;

    /* ------------------------------------------------------------------ */
    /* Dispatch (worker only; in-page fallback calls WORKER.LIGHTING       */
    /* synchronously via the engine's ig.Worker.doTask fallback branch).   */
    /* ------------------------------------------------------------------ */
    function withWasm(cb) {
        if (wasm) { cb(); return; }
        if (pending === null) { cb(); return; } /* wasm decided unavailable -> JS kernels */
        pending.push(cb);
        startWasm();
    }

    if (isWorker && typeof self !== 'undefined') {
        self.onmessage = function (event) {
            var data = event.data;
            var task = TASKS[data._type];
            if (!task) { self.postMessage({ error: 'TASK NOT FOUND' }); return; }
            var id = data._id;
            delete data._id;
            delete data._type;
            withWasm(function () {
                task(data, function (result) {
                    result._id = id;
                    self.postMessage(result);
                });
            });
        };
    }

    /* Boot: load the JS kernels, then kick off the WASM build if we can. */
    loadReferenceKernels();
    startWasm();
})(typeof self !== 'undefined' ? self : this);