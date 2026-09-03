# Recipe: add a worker/WASM pixel task

> Extend the engine’s worker model for expensive image math while keeping a
> synchronous JS fallback. This recipe follows the verified architecture of
> `assets/mods/lighting-wasm/`.

## Contract

| Item | Choice |
|---|---|
| Main-thread API | `ig.Worker(path, name).doTask(type, payload, callback)` |
| Worker registry | `WORKER.<NAME>.<TASK>` |
| Payload | structured clone friendly; typed arrays are allowed |
| Fallback | same task and result shape, executed synchronously by engine fallback |
| WASM | instantiate once; queue tasks during the single flight |
| Rendering | worker computes; main thread owns Canvas2D upload/composite |

## Worker task shape

```js
(function (global) {
    'use strict';
    var REF = global.WORKER_MYMOD_REF || null;

    function apply(data) {
        // Pure JS reference implementation. Keep it deterministic and testable.
        var out = new Uint8ClampedArray(data.src);
        return { data: out, width: data.width, height: data.height, wasm: false };
    }

    var tasks = {
        APPLY: function (data, callback) {
            var result = apply(data);
            if (callback) callback(result);
            return result;
        }
    };

    global.WORKER = global.WORKER || {};
    global.WORKER.MYMOD = tasks;

    if (typeof importScripts === 'function') {
        self.onmessage = function (event) {
            var message = event.data;
            var id = message._id;
            var type = message._type;
            delete message._id;
            delete message._type;
            var result = tasks[type] ? tasks[type](message) : { error: 'TASK NOT FOUND' };
            result._id = id;
            self.postMessage(result);
        };
    }
})(typeof self !== 'undefined' ? self : this);
```

The actual engine worker protocol includes `_type` and `_id`, and replies with
`_id`; using the global registry is important because `ig.Worker`’s fallback
looks up the bare `WORKER` object rather than importing your worker module as a
normal browser module.

## Main-thread wrapper

```js
var engine = {
    worker: null,
    getWorker: function () {
        if (!this.worker) this.worker = new ig.Worker('mods/mymod/worker.js', 'MYMOD');
        return this.worker;
    },
    apply: function (src, params, callback) {
        if (!src || !src.data) {
            if (callback) callback({ error: 'bad src' });
            return;
        }
        this.getWorker().doTask('APPLY', {
            src: src.data,
            width: src.width,
            height: src.height,
            params: params || {}
        }, callback);
    }
};
```

The path is resolved relative to the game root in the same way as the working
`lighting-wasm` mod. In a packaged mod, determine the installed mod directory
rather than assuming the repository’s source path.

## Adding WASM without breaking the fallback

Use a single-flight state machine:

```js
var wasm = null;
var wasmLoading = false;
var pending = [];
var settled = false;

function withWasm(run) {
    if (wasm || settled) return run();
    pending.push(run);
    if (!wasmLoading) {
        wasmLoading = true;
        loadWasm().then(function (instance) {
            wasm = instance;
            settled = true;
            wasmLoading = false;
            pending.splice(0).forEach(function (job) { job(); });
        }).catch(function () {
            settled = true;
            wasmLoading = false;
            pending.splice(0).forEach(function (job) { job(); });
        });
    }
}
```

When the WASM path is active, allocate/reuse native buffers by byte count, copy
input once, run the kernel, and copy output once. If Emscripten memory can grow,
refresh `HEAPU8` after allocation/init before making typed-array views.

A result should expose capability telemetry separately from correctness:

```ts
type Result = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  wasm: boolean;
  parallelism: number;
  error?: string;
};
```

Do not report “WASM active” merely because the glue script loaded. The working
lighting mod reports `wasm` from the task result and obtains observed pthread
parallelism from the compiled kernel.

## Testing checklist

- Run the same small input through JS and WASM and compare output within the
  intended tolerance.
- Test missing glue, missing paired `.wasm`, failed instantiation, and no worker.
- Test early calls made before the WASM promise resolves; they must not be lost
  or run twice.
- Test changing image dimensions so stale heap pointers cannot be reused.
- Test a worker error and return a structured `{ error }` result.
- Test that the main thread never calls `getImageData` on the live canvas just to
  feed the worker every frame.
- Measure copy and composite time, not only WASM kernel time.

## Guardrails

- Never compile/instantiate WASM from inside a draw callback.
- Never make the worker result shape differ between fallback and accelerated
  paths.
- Never retain typed-array views across possible Emscripten memory growth.
- Never assume pthreads are available because `SharedArrayBuffer` exists.
- Never hide a failed accelerator behind a silent visual no-op; expose a
  diagnostic and keep the JS path available.
