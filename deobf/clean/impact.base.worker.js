/**
 * impact.base.worker
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.worker")`.
 *
 * Web Worker wrapper, with a synchronous `<script>` fallback when `window.Worker`
 * is unavailable. Tasks are dispatched by name. In fallback mode the global
 * `WORKER` registry (see `assets/impact/webworker/image-tasks.js`) maps a worker
 * `key` to a set of named handler functions.
 */
ig.module("impact.base.worker").defines(function () {

    ig.Worker = ig.Class.extend({
        lastId: 0,
        runningTasks: {}, // task id -> { hint, callback }
        worker: null,     // real Web Worker (null = fallback mode)
        key: null,        // key into the global WORKER registry (fallback)

        /**
         * @param {string} workerPath path to the worker script (relative to ig.root)
         * @param {string} key registry key for the synchronous fallback
         */
        init: function (workerPath, key) {
            this.key = key;
            if (window.Worker) {
                this.worker = new window.Worker(ig.root + workerPath);
                this.worker.onmessage = this._onMessage.bind(this);
            } else {
                // Fallback: load the worker script synchronously into the page.
                var script = ig.$new("script");
                script.type = "text/javascript";
                script.src = ig.root + workerPath;
                ig.$("head")[0].appendChild(script);
            }
        },

        /**
         * Dispatch a task.
         * @param {string} type task name
         * @param {Object} data task payload (gets an `_id` and `_type` added)
         * @param {Function} callback receives the result data
         */
        doTask: function (type, data, callback) {
            if (this.worker) {
                data._id = this.lastId;
                data._type = type;
                this.lastId++;
                this.runningTasks[data._id] = { hint: data.hint, callback: callback };
                this.worker.postMessage(data);
            } else {
                // Synchronous fallback via the in-page WORKER registry.
                var result = WORKER[this.key][type](data);
                result.hint = data.hint;
                callback(result);
            }
        },

        _onMessage: function (event) {
            var id = event.data._id;
            delete event.data._id;
            if (this.runningTasks[id]) {
                event.data.hint = this.runningTasks[id].hint;
                this.runningTasks[id].callback(event.data);
                delete this.runningTasks[id];
            }
        },
    });
});
