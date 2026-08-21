/*
 * impact.base.loader
 * -------------------
 * The resource-loading layer: JSON-template resolution, caching, and the
 * main `ig.Loader` that drives the loading screen and boots the game.
 *
 * Original: deobf/extract/impact.base.loader.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.loader").defines(function () {
    /**
     * Resolve a JSON value, expanding `jsonINSTANCE` template references.
     * (Top-level pass used by `ig.JsonTemplate.resolve`.)
     */
    function resolveJsonValue(value, templateList, templateParams) {
        if (!value || typeof value != "object") return value;
        if (value.jsonINSTANCE) return resolveJsonInstance(value, templateList, templateParams);
        if (value instanceof Array) {
            for (var i = value.length; i--;) {
                var resolved = resolveJsonValue(value[i], templateList, templateParams);
                // A "jsonList" splice marker injects the resolved array in place.
                if (value[i] != resolved && resolved instanceof Array && value[i].jsonList) {
                    resolved.splice(0, 0, i, 1);
                    value.splice.apply(value, resolved);
                } else {
                    value[i] = resolved;
                }
            }
        } else {
            for (i in value) value[i] = resolveJsonValue(value[i], templateList, templateParams);
        }
        return value;
    }

    /**
     * Look up the template named by `value.jsonINSTANCE` and instantiate it
     * with the given parameters.
     */
    function resolveJsonInstance(instanceValue, templateList, templateParams) {
        var instanceName = instanceValue.jsonINSTANCE;
        var template = templateParams[instanceName] || templateList[instanceName];
        if (!template) throw Error("Could not find template '" + instanceName + "'");
        return resolveJsonTemplate(template, instanceValue, templateList, templateParams);
    }

    /**
     * Recursively expand a template: `jsonINSTANCE` (again), `jsonPARAM`
     * (inline parameter substitution), and `jsonIF`/`jsonTHEN` (conditionals).
     */
    function resolveJsonTemplate(node, instanceParams, templateList, templateParams) {
        if (!node || typeof node != "object") return node;
        if (node.jsonINSTANCE) {
            node = ig.copy(node);
            return resolveJsonInstance(node, templateList, templateParams);
        }
        if (node.jsonPARAM) {
            templateParams = instanceParams[node.jsonPARAM];
            if (templateParams == void 0) {
                if (node["default"] !== void 0) {
                    templateParams = node["default"];
                } else {
                    throw Error("Could not find template parameters '" + node.jsonPARAM + "' ");
                }
            }
            return resolveJsonValue(templateParams);
        }
        var result;
        if (node instanceof Array) {
            result = [];
            for (var i = 0; i < node.length; ++i) {
                var item = node[i];
                if (item.jsonIF) {
                    if (instanceParams[item.jsonIF] === void 0) continue;
                    if (item.jsonTHEN) {
                        item = item.jsonTHEN;
                    } else {
                        item = ig.copy(item);
                        delete item.jsonIF;
                    }
                }
                item = resolveJsonTemplate(item, instanceParams, templateList, templateParams);
                // jsonList arrays are spliced flat rather than nested.
                item instanceof Array && node[i].jsonList ? result.push.apply(result, item) : result.push(item);
            }
        } else {
            result = {};
            for (i in node) {
                item = node[i];
                if (item.jsonIF) {
                    if (instanceParams[item.jsonIF] === void 0) continue;
                    if (item.jsonTHEN) {
                        item = item.jsonTHEN;
                    } else {
                        item = ig.copy(item);
                        delete item.jsonIF;
                    }
                }
                result[i] = resolveJsonTemplate(item, instanceParams, templateList, templateParams);
            }
        }
        return result;
    }

    // Caches of live resources, keyed by `cacheType` then `cacheKey`.
    ig.cacheList = {};
    var clearingCache = false;

    /**
     * Clear caches. With `hard` also increments `ig.nocache` (forces reloads
     * of assets that tolerate missing resources).
     */
    ig.cleanCache = function (hard) {
        if (hard) ig.nocache = ig.nocache ? ig.nocache + 1 : 1;
        clearingCache = true;
        for (var cacheType in ig.cacheList) {
            var cache = ig.cacheList[cacheType];
            var key;
            for (key in cache) {
                var entry = cache[key];
                if (entry && entry.referenceCount == 0) {
                    entry.emptyMapChangeCount++;
                    if (hard || entry.emptyMapChangeCount > 5) {
                        entry.onCacheCleared && entry.onCacheCleared();
                        cache[key] = null;
                    }
                }
            }
        }
        clearingCache = false;
    };

    /** Reload every loaded cache entry. */
    ig.reloadCache = function () {
        for (var cacheType in ig.cacheList) {
            var cache = ig.cacheList[cacheType];
            var key;
            for (key in cache) {
                var entry = cache[key];
                entry && entry.loaded && entry.reload();
            }
        }
    };

    // Path alias map used by `ig.getFilePath`.
    ig.fileForwarding = {};

    /** Resolve a file path through any forwarding aliases. */
    ig.getFilePath = function (path) {
        path && (path = path.trim());
        return ig.fileForwarding[path] ? ig.fileForwarding[path] : path;
    };

    /**
     * Base class for reference-counted, cacheable resources.
     * Subclasses set `cacheType` (a unique namespace string) and provide
     * `getCacheKey()` to derive a key from the constructor arguments.
     */
    ig.Cacheable = ig.Class.extend({
        cacheType: null,
        cacheKey: null,
        referenceCount: 0,
        emptyMapChangeCount: 0,

        // Return an existing cached instance (and bump its ref), else null.
        staticInstantiate: function () {
            if (!this.constructor.cache) {
                this.constructor.cache = {};
                var cacheType = this.constructor.prototype.cacheType;
                if (!cacheType) throw Error("ig.Cacheable without CacheType!");
                if (ig.cacheList[cacheType] != void 0) throw Error("Duplicated cacheType: " + cacheType);
                ig.cacheList[cacheType] = this.constructor.cache;
            }
            if ((cacheType = this.cacheKey = this.getCacheKey.apply(this, arguments))) {
                if ((cacheType = this.constructor.cache[cacheType])) {
                    cacheType.onInstanceReused && cacheType.onInstanceReused();
                    cacheType.increaseRef();
                    return cacheType;
                }
            }
            return null;
        },

        init: function () {
            this.cacheKey && (this.constructor.cache[this.cacheKey] = this);
            this.increaseRef();
        },

        increaseRef: function () {
            this.referenceCount++;
            if (this.cacheKey) this.emptyMapChangeCount = 0;
        },

        decreaseRef: function () {
            this.referenceCount--;
            if (this.referenceCount < 0) {
                throw Error("Call to decreaseRef() results in negative count! Key: '" + this.cacheKey + "'");
            }
            if (this.referenceCount == 0 && (!this.cacheKey || clearingCache)) {
                this.onCacheCleared && this.onCacheCleared();
                this.cacheKey && (this.constructor.cache[this.cacheKey] = null);
            }
        },

        getCacheKey: null,
        onCacheCleared: null
    });

    /**
     * A cacheable resource loaded asynchronously from disk (by `path`).
     * Notifies `loadListeners` when loading finishes.
     */
    ig.Loadable = ig.Cacheable.extend({
        loaded: false,
        failed: false,
        path: "",
        tolerateMissingResources: false,
        loadListeners: [],
        loadCollectors: [],

        init: function (path) {
            this.parent();
            if (typeof path == "string") {
                this.path = path;
                ig.addResourceToCollectors(this);
                ig.ready ? this.load() : ig.addResource(this);
            } else {
                this.path = "[INLINE DATA]";
                this.loaded = true;
            }
        },

        reload: function () {
            if (this.debugReload) {
                if (this.onCacheCleared) this.onCacheCleared();
                this.loaded = false;
                ig.ready ? this.load() : ig.addResource(this);
            }
        },

        onInstanceReused: function () {
            this.loaded || ig.addResourceToCollectors(this);
        },

        getCacheKey: function (path) {
            return typeof path == "string" ? path : null;
        },

        load: function (callback) {
            if (this.loaded) {
                callback && callback(this.cacheType, this.path, true);
            } else {
                this.loadCallback = callback || null;
                this.loadInternal(this.path);
            }
        },

        loadingFinished: function (success) {
            success ? (this.loaded = true) : (this.failed = true);
            if (this.loadListeners.length > 0) {
                for (var i = this.loadListeners.length; i--;) {
                    this.loadListeners[i].onLoadableComplete(this.loaded, this);
                }
            }
            this.loadListeners.length = 0;
            ig.setResourceLoadedToCollectors(this);
            if (this.loadCallback) {
                this.loadCallback(this.cacheType, this.path, success);
                this.loadCallback = null;
            }
        },

        addLoadListener: function (listener) {
            if (this.loaded) {
                listener.onLoadableComplete(true, this);
            } else {
                this.loadListeners.push(listener);
            }
        }
    });

    /** A loadable that fetches JSON from disk and resolves templates. */
    ig.JsonLoadable = ig.Loadable.extend({
        init: function (path) {
            this.parent(path);
            if (typeof path == "object") this.onload(path);
        },

        loadInternal: function () {
            $.ajax({
                dataType: "json",
                url: ig.getFilePath(this.getJsonPath()),
                context: this,
                success: this.onJsonLoaded.bind(this),
                error: this.onJsonError.bind(this)
            });
        },

        onJsonLoaded: function (data) {
            data = ig.jsonTemplate.resolve(data);
            if (!data) {
                throw Error("Json file of path '" + this.path + "' is null. Maybe the original JSON had a syntax error and was compressed incorrectly?");
            }
            ig.activateCollectors(this);
            this.onload(data);
            ig.removeCollectors(this);
            this.loadingFinished(true);
        },

        onJsonError: function () {
            this.onerror && this.onerror();
            this.loadingFinished(false);
        }
    });

    /** A singleton (one instance per class) loadable resource. */
    ig.SingleLoadable = ig.Class.extend({
        loaded: false,
        failed: false,
        path: "NO_PATCH",

        staticInstantiate: function () {
            return this.constructor.instance || null;
        },

        init: function () {
            this.constructor.instance = this;
            ig.ready ? this.load() : ig.addResource(this);
        },

        load: function (callback) {
            if (this.loaded) {
                callback && callback(this.cacheType, this.path, true);
            } else {
                this.loadCallback = callback || null;
                this.loadInternal();
            }
        },

        loadingFinished: function (success) {
            success ? (this.loaded = true) : (this.failed = true);
            this.loadCallback && this.loadCallback(this.cacheType, this.path, success);
        }
    });

    /**
     * Drives the whole load sequence: draws the progress bar, loads every
     * queued resource, and finally instantiates the game class.
     */
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

        init: function (gameClass) {
            this.gameClass = gameClass || null;
            this.resources = ig.resources;
            this._loadCallbackBound = this._loadCallback.bind(this);
        },

        load: function () {
            ig.ready = false;
            ig.loading = true;
            this.done = false;
            this._drawStatus = this.status = 0;
            if (this.resources.length) {
                for (var i = 0; i < this.resources.length; i++) {
                    this._unloaded.push(this.resources[i].cacheType + this.resources[i].path);
                }
                this._loadIndex = this.resources.length;
                for (i = 0; i < this.resources.length; i++) this.loadResource(this.resources[i]);
                this._intervalId = setInterval(this.draw.bind(this), 16);
            } else {
                this.end();
            }
        },

        loadResource: function (resource) {
            resource.load(this._loadCallbackBound);
        },

        end: function () {
            if (!this.done) {
                this.done = true;
                this.onEnd();
            }
        },

        onEnd: function () {
            this.finalize();
        },

        finalize: function () {
            this.prevResourcesCnt = ig.resources.length;
            ig.resources.length = 0;
            clearInterval(this._intervalId);
            if (this.gameClass) {
                if (!this.gameObjectCreated) {
                    this.gameObjectCreated = true;
                    ig.system.setGame(this.gameClass);
                }
                // Resources queued during game creation trigger another pass.
                if (ig.resources.length > 0) {
                    this.load();
                    return;
                }
                this.prevResources = null;
                ig.ready = true;
                ig.system.setDelegate(ig.game);
            } else {
                ig.ready = true;
                ig.game.loadingComplete();
            }
            this._loadCallbackBound = null;
            ig.loading = false;
        },

        draw: function () {
            // Ease the displayed progress toward the actual status.
            this._drawStatus = this._drawStatus + (this.status - this._drawStatus) / 5;
            var scale = ig.system.scale;
            var barWidth = ig.system.width * 0.6;
            var barHeight = ig.system.height * 0.1;
            var barX = ig.system.width * 0.5 - barWidth / 2;
            var barY = ig.system.height * 0.5 - barHeight / 2;
            ig.system.context.fillStyle = "#000";
            ig.system.context.fillRect(0, 0, ig.system.contextWidth, ig.system.contextHeight);
            ig.system.context.fillStyle = "#fff";
            ig.system.context.fillRect(barX * scale, barY * scale, barWidth * scale, barHeight * scale);
            ig.system.context.fillStyle = "#000";
            ig.system.context.fillRect(barX * scale + scale, barY * scale + scale, barWidth * scale - scale - scale, barHeight * scale - scale - scale);
            ig.system.context.fillStyle = "#fff";
            ig.system.context.fillRect(barX * scale, barY * scale, barWidth * scale * this._drawStatus, barHeight * scale);
        },

        _loadCallback: function (cacheType, path, success) {
            this._unloaded.erase(cacheType + path);
            cacheType = this._loadIndex;
            this._loadIndex = this.resources.length;
            // Pick up any resources queued while the previous ones loaded.
            for (var i = cacheType; i < this.resources.length; i++) {
                this._unloaded.push(this.resources[i].cacheType + this.resources[i].path);
            }
            for (i = cacheType; i < this.resources.length; i++) this.loadResource(this.resources[i]);
            !success && !this.tolerateMissingResources && ig.system.error(Error("Failed to load resource: " + path));
            this.lastPath = path;
            this.status = 1 - this._unloaded.length / this.resources.length;
            this._unloaded.length == 0 && this.end();
        }
    });

    /**
     * Tracks a set of loadables and notifies its listener once they are all
     * loaded.
     */
    ig.LoadCollector = ig.Class.extend({
        listener: null,
        resources: [],

        init: function (listener) {
            this.listener = listener;
            ig.loadCollectors.push(this);
        },

        finalizeLoadableFetching: function () {
            ig.loadCollectors.erase(this);
            this.resources.length == 0 && this.done();
        },

        addResource: function (resource) {
            if (this.resources.indexOf(resource) == -1) {
                this.resources.push(resource);
                resource.loadCollectors.push(this);
            }
        },

        setResourceLoaded: function (resource) {
            this.resources.erase(resource);
            this.resources.length == 0 && this.done();
        },

        done: function () {
            this.listener.onLoadableComplete(true, this);
        }
    });

    // Global collector registry + the resource-collection helpers used by
    // loadables as they're created, reused, and finished.
    ig.loadCollectors = [];

    ig.addResourceToCollectors = function (resource) {
        for (var i = ig.loadCollectors.length; i--;) ig.loadCollectors[i].addResource(resource);
    };

    ig.setResourceLoadedToCollectors = function (resource) {
        for (var i = resource.loadCollectors, n = i.length; n--;) i[n].setResourceLoaded(resource);
        resource.loadCollectors.length = 0;
    };

    ig.activateCollectors = function (resource) {
        for (var i = resource.loadCollectors.length; i--;) ig.loadCollectors.push(resource.loadCollectors[i]);
    };

    ig.removeCollectors = function (resource) {
        for (var i = resource.loadCollectors.length; i--;) ig.loadCollectors.erase(resource.loadCollectors[i]);
    };

    /** Registry of named JSON templates + the top-level resolver. */
    ig.JsonTemplate = ig.Class.extend({
        templates: [],

        init: function () {},

        register: function (name, template) {
            this.templates[name] = template;
        },

        resolve: function (root) {
            var localParams = [];
            if (root && root.jsonTEMPLATES) {
                var templates = root.jsonTEMPLATES;
                var name;
                for (name in templates) localParams[name] = templates[name];
                delete root.jsonTEMPLATES;
            }
            return resolveJsonValue(root, this.templates, localParams);
        }
    });

    ig.jsonTemplate = new ig.JsonTemplate();
});
ig.baked = !0;
