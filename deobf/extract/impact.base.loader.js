ig.module("impact.base.loader").defines(function() {
        function a(c, d, e) {
            if (!c || typeof c != "object") return c;
            if (c.jsonINSTANCE) return b(c, d, e);
            if (c instanceof Array)
                for (var f = c.length; f--;) {
                    var g = a(c[f], d, e);
                    if (c[f] != g && g instanceof Array && c[f].jsonList) {
                        g.splice(0, 0, f, 1);
                        c.splice.apply(c, g)
                    } else c[f] = g
                } else
                    for (f in c) c[f] = a(c[f], d, e);
            return c
        }

        function b(a, d, e) {
            var f = a.jsonINSTANCE,
                g = e[f] || d[f];
            if (!g) throw Error("Could not find template '" +
                f + "'");
            return c(g, a, d, e)
        }

        function c(d, e, f, g) {
            if (!d || typeof d != "object") return d;
            if (d.jsonINSTANCE) {
                d = ig.copy(d);
                return b(d, f, g)
            }
            if (d.jsonPARAM) {
                f = e[d.jsonPARAM];
                if (f == void 0)
                    if (d["default"] !== void 0) f = d["default"];
                    else throw Error("Could not find template parameters '" + d.jsonPARAM + "' ");
                return a(f)
            }
            var h;
            if (d instanceof Array) {
                h = [];
                for (var i = 0; i < d.length; ++i) {
                    var j = d[i];
                    if (j.jsonIF) {
                        if (e[j.jsonIF] === void 0) continue;
                        if (j.jsonTHEN) j = j.jsonTHEN;
                        else {
                            j = ig.copy(j);
                            delete j.jsonIF
                        }
                    }
                    j = c(j, e, f, g);
                    j instanceof
                    Array && d[i].jsonList ? h.push.apply(h, j) : h.push(j)
                }
            } else {
                h = {};
                for (i in d) {
                    j = d[i];
                    if (j.jsonIF) {
                        if (e[j.jsonIF] === void 0) continue;
                        if (j.jsonTHEN) j = j.jsonTHEN;
                        else {
                            j = ig.copy(j);
                            delete j.jsonIF
                        }
                    }
                    h[i] = c(j, e, f, g)
                }
            }
            return h
        }
        ig.cacheList = {};
        var d = false;
        ig.cleanCache = function(a) {
            if (a) ig.nocache = ig.nocache ? ig.nocache + 1 : 1;
            d = true;
            for (var b in ig.cacheList) {
                var c = ig.cacheList[b],
                    e;
                for (e in c) {
                    var f = c[e];
                    if (f && f.referenceCount == 0) {
                        f.emptyMapChangeCount++;
                        if (a || f.emptyMapChangeCount > 5) {
                            f.onCacheCleared && f.onCacheCleared();
                            c[e] = null
                        }
                    }
                }
            }
            d = false
        };
        ig.reloadCache = function() {
            for (var a in ig.cacheList) {
                var b = ig.cacheList[a],
                    c;
                for (c in b) {
                    var d = b[c];
                    d && d.loaded && d.reload()
                }
            }
        };
        ig.fileForwarding = {};
        ig.getFilePath = function(a) {
            a && (a = a.trim());
            return ig.fileForwarding[a] ? ig.fileForwarding[a] : a
        };
        ig.Cacheable = ig.Class.extend({
            cacheType: null,
            cacheKey: null,
            referenceCount: 0,
            emptyMapChangeCount: 0,
            staticInstantiate: function() {
                if (!this.constructor.cache) {
                    this.constructor.cache = {};
                    var a = this.constructor.prototype.cacheType;
                    if (!a) throw Error("ig.Cacheable without CacheType!");
                    if (ig.cacheList[a] != void 0) throw Error("Duplicated cacheType: " + a);
                    ig.cacheList[a] = this.constructor.cache
                }
                if (a = this.cacheKey = this.getCacheKey.apply(this, arguments))
                    if (a = this.constructor.cache[a]) {
                        a.onInstanceReused && a.onInstanceReused();
                        a.increaseRef();
                        return a
                    } return null
            },
            init: function() {
                this.cacheKey && (this.constructor.cache[this.cacheKey] = this);
                this.increaseRef()
            },
            increaseRef: function() {
                this.referenceCount++;
                if (this.cacheKey) this.emptyMapChangeCount = 0
            },
            decreaseRef: function() {
                this.referenceCount--;
                if (this.referenceCount < 0) throw Error("Call to decreaseRef() results in negative count! Key: '" + this.cacheKey + "'");
                if (this.referenceCount == 0 && (!this.cacheKey || d)) {
                    this.onCacheCleared && this.onCacheCleared();
                    this.cacheKey && (this.constructor.cache[this.cacheKey] = null)
                }
            },
            getCacheKey: null,
            onCacheCleared: null
        });
        ig.Loadable = ig.Cacheable.extend({
            loaded: false,
            failed: false,
            path: "",
            tolerateMissingResources: false,
            loadListeners: [],
            loadCollectors: [],
            init: function(a) {
                this.parent();
                if (typeof a == "string") {
                    this.path =
                        a;
                    ig.addResourceToCollectors(this);
                    ig.ready ? this.load() : ig.addResource(this)
                } else {
                    this.path = "[INLINE DATA]";
                    this.loaded = true
                }
            },
            reload: function() {
                if (this.debugReload) {
                    if (this.onCacheCleared) this.onCacheCleared();
                    this.loaded = false;
                    ig.ready ? this.load() : ig.addResource(this)
                }
            },
            onInstanceReused: function() {
                this.loaded || ig.addResourceToCollectors(this)
            },
            getCacheKey: function(a) {
                return typeof a == "string" ? a : null
            },
            load: function(a) {
                if (this.loaded) a && a(this.cacheType, this.path, true);
                else {
                    this.loadCallback = a || null;
                    this.loadInternal(this.path)
                }
            },
            loadingFinished: function(a) {
                a ? this.loaded = true : this.failed = true;
                if (this.loadListeners.length > 0)
                    for (var b = this.loadListeners.length; b--;) this.loadListeners[b].onLoadableComplete(this.loaded, this);
                this.loadListeners.length = 0;
                ig.setResourceLoadedToCollectors(this);
                if (this.loadCallback) {
                    this.loadCallback(this.cacheType, this.path, a);
                    this.loadCallback = null
                }
            },
            addLoadListener: function(a) {
                if (this.loaded) a.onLoadableComplete(true, this);
                else this.loadListeners.push(a)
            }
        });
        ig.JsonLoadable =
            ig.Loadable.extend({
                init: function(a) {
                    this.parent(a);
                    if (typeof a == "object") this.onload(a)
                },
                loadInternal: function() {
                    $.ajax({
                        dataType: "json",
                        url: ig.getFilePath(this.getJsonPath()),
                        context: this,
                        success: this.onJsonLoaded.bind(this),
                        error: this.onJsonError.bind(this)
                    })
                },
                onJsonLoaded: function(a) {
                    a = ig.jsonTemplate.resolve(a);
                    if (!a) throw Error("Json file of path '" + this.path + "' is null. Maybe the original JSON had a syntax error and was compressed incorrectly?");
                    ig.activateCollectors(this);
                    this.onload(a);
                    ig.removeCollectors(this);
                    this.loadingFinished(true)
                },
                onJsonError: function() {
                    this.onerror && this.onerror();
                    this.loadingFinished(false)
                }
            });
        ig.SingleLoadable = ig.Class.extend({
            loaded: false,
            failed: false,
            path: "NO_PATCH",
            staticInstantiate: function() {
                return this.constructor.instance || null
            },
            init: function() {
                this.constructor.instance = this;
                ig.ready ? this.load() : ig.addResource(this)
            },
            load: function(a) {
                if (this.loaded) a && a(this.cacheType, this.path, true);
                else {
                    this.loadCallback = a || null;
                    this.loadInternal()
                }
            },
            loadingFinished: function(a) {
                a ? this.loaded =
                    true : this.failed = true;
                this.loadCallback && this.loadCallback(this.cacheType, this.path, a)
            }
        });
        ig.Loader = ig.Class.extend({
            resources: [],
            prevResourcesCnt: 0,
            status: 0,
            done: false,
            lastPath: "",
            gameObjectCreated: false,
            _unloaded: [],
            _drawStatus: 0,
            _intervalId: 0,
            _loadCallbackBound: null,
            _loadIndex: 0,
            _nextStepFunction: null,
            init: function(a) {
                this.gameClass = a || null;
                this.resources = ig.resources;
                this._loadCallbackBound = this._loadCallback.bind(this)
            },
            load: function() {
                ig.ready = false;
                ig.loading = true;
                this.done = false;
                this._drawStatus =
                    this.status = 0;
                if (this.resources.length) {
                    for (var a = 0; a < this.resources.length; a++) this._unloaded.push(this.resources[a].cacheType + this.resources[a].path);
                    this._loadIndex = this.resources.length;
                    for (a = 0; a < this.resources.length; a++) this.loadResource(this.resources[a]);
                    this._intervalId = setInterval(this.draw.bind(this), 16)
                } else this.end()
            },
            loadResource: function(a) {
                a.load(this._loadCallbackBound)
            },
            end: function() {
                if (!this.done) {
                    this.done = true;
                    this.onEnd()
                }
            },
            onEnd: function() {
                this.finalize()
            },
            finalize: function() {
                this.prevResourcesCnt =
                    ig.resources.length;
                ig.resources.length = 0;
                clearInterval(this._intervalId);
                if (this.gameClass) {
                    if (!this.gameObjectCreated) {
                        this.gameObjectCreated = true;
                        ig.system.setGame(this.gameClass)
                    }
                    if (ig.resources.length > 0) {
                        this.load();
                        return
                    }
                    this.prevResources = null;
                    ig.ready = true;
                    ig.system.setDelegate(ig.game)
                } else {
                    ig.ready = true;
                    ig.game.loadingComplete()
                }
                this._loadCallbackBound = null;
                ig.loading = false
            },
            draw: function() {
                this._drawStatus = this._drawStatus + (this.status - this._drawStatus) / 5;
                var a = ig.system.scale,
                    b = ig.system.width *
                    0.6,
                    c = ig.system.height * 0.1,
                    d = ig.system.width * 0.5 - b / 2,
                    e = ig.system.height * 0.5 - c / 2;
                ig.system.context.fillStyle = "#000";
                ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
                ig.system.context.fillStyle = "#fff";
                ig.system.context.fillRect(d * a, e * a, b * a, c * a);
                ig.system.context.fillStyle = "#000";
                ig.system.context.fillRect(d * a + a, e * a + a, b * a - a - a, c * a - a - a);
                ig.system.context.fillStyle = "#fff";
                ig.system.context.fillRect(d * a, e * a, b * a * this._drawStatus, c * a)
            },
            _loadCallback: function(a, b, c) {
                this._unloaded.erase(a +
                    b);
                a = this._loadIndex;
                this._loadIndex = this.resources.length;
                for (var d = a; d < this.resources.length; d++) this._unloaded.push(this.resources[d].cacheType + this.resources[d].path);
                for (d = a; d < this.resources.length; d++) this.loadResource(this.resources[d]);
                !c && !this.tolerateMissingResources && ig.system.error(Error("Failed to load resource: " + b));
                this.lastPath = b;
                this.status = 1 - this._unloaded.length / this.resources.length;
                this._unloaded.length == 0 && this.end()
            }
        });
        ig.LoadCollector = ig.Class.extend({
            listener: null,
            resources: [],
            init: function(a) {
                this.listener = a;
                ig.loadCollectors.push(this)
            },
            finalizeLoadableFetching: function() {
                ig.loadCollectors.erase(this);
                this.resources.length == 0 && this.done()
            },
            addResource: function(a) {
                if (this.resources.indexOf(a) == -1) {
                    this.resources.push(a);
                    a.loadCollectors.push(this)
                }
            },
            setResourceLoaded: function(a) {
                this.resources.erase(a);
                this.resources.length == 0 && this.done()
            },
            done: function() {
                this.listener.onLoadableComplete(true, this)
            }
        });
        ig.loadCollectors = [];
        ig.addResourceToCollectors = function(a) {
            for (var b =
                    ig.loadCollectors.length; b--;) ig.loadCollectors[b].addResource(a)
        };
        ig.setResourceLoadedToCollectors = function(a) {
            for (var b = a.loadCollectors, c = b.length; c--;) b[c].setResourceLoaded(a);
            a.loadCollectors.length = 0
        };
        ig.activateCollectors = function(a) {
            for (var b = a.loadCollectors.length; b--;) ig.loadCollectors.push(a.loadCollectors[b])
        };
        ig.removeCollectors = function(a) {
            for (var b = a.loadCollectors.length; b--;) ig.loadCollectors.erase(a.loadCollectors[b])
        };
        ig.JsonTemplate = ig.Class.extend({
            templates: [],
            init: function() {},
            register: function(a, b) {
                this.templates[a] = b
            },
            resolve: function(b) {
                var c = [];
                if (b && b.jsonTEMPLATES) {
                    var d = b.jsonTEMPLATES,
                        e;
                    for (e in d) c[e] = d[e];
                    delete b.jsonTEMPLATES
                }
                return a(b, this.templates, c)
            }
        });
        ig.jsonTemplate = new ig.JsonTemplate
    });
    ig.baked = !0;
    