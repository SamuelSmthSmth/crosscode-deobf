ig.module("impact.base.worker").defines(function() {
        ig.Worker = ig.Class.extend({
            lastId: 0,
            runningTasks: {},
            worker: null,
            key: null,
            init: function(a, b) {
                this.key = b;
                if (window.Worker) {
                    this.worker =
                        new window.Worker(ig.root + a);
                    this.worker.onmessage = this._onMessage.bind(this)
                } else {
                    var c = ig.$new("script");
                    c.type = "text/javascript";
                    c.src = ig.root + a;
                    ig.$("head")[0].appendChild(c)
                }
            },
            doTask: function(a, b, c) {
                if (this.worker) {
                    b._id = this.lastId;
                    b._type = a;
                    this.lastId++;
                    this.runningTasks[b._id] = {
                        hint: b.hint,
                        callback: c
                    };
                    this.worker.postMessage(b)
                } else {
                    a = WORKER[this.key][a](b);
                    a.hint = b.hint;
                    c(a)
                }
            },
            _onMessage: function(a) {
                var b = a.data._id;
                delete a.data._id;
                if (this.runningTasks[b]) {
                    a.data.hint = this.runningTasks[b].hint;
                    this.runningTasks[b].callback(a.data);
                    delete this.runningTasks[b]
                }
            }
        })
    });
    ig.baked = !0;
    