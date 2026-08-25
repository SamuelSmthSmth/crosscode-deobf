ig.module("impact.base.game").requires("impact.base.impact", "impact.base.entity", "impact.base.event", "impact.base.renderer", "impact.base.physics", "impact.base.game-state", "impact.base.collision-map", "impact.base.background-map", "impact.base.global-settings", "impact.base.extension", "impact.base.utils", "impact.base.dom").defines(function() {
    Vec2.create();
    Vec2.create();
    Vec2.create();
    window.IG_ENTITY_KILL_CALL = false;
    ig.Game = ig.Class.extend({
        clearColor: "#000008",
        gravity: 0,
        screen: {
            x: 0,
            y: 0
        },
        soundPos: {
            x: 0,
            y: 0
        },
        size: {
            x: 0,
            y: 0
        },
        paused: false,
        mapRenderingBlocked: false,
        isReset: false,
        shadowImage: null,
        previousMap: null,
        mapName: null,
        currentLoadingResource: "",
        entities: [],
        mapEntities: [],
        shownEntities: [],
        freeEntityIds: [],
        namedEntities: {},
        conditionalEntities: [],
        maps: [],
        levels: {},
        maxLevel: 0,
        minLevelZ: 0,
        masterLevel: 0,
        backgroundAnims: {},
        backgroundAnimTimer: 0,
        cellSize: 64,
        events: new ig.EventManager,
        renderer: new ig.Renderer2d,
        physics: new ig.Physics,
        _deferredDetach: [],
        _levelToLoad: null,
        playerEntity: null,
        marker: "",
        postPlacementAction: null,
        teleporting: {
            active: false,
            timer: 0,
            position: null,
            clearCache: false,
            reloadCache: false,
            levelData: null
        },
        addons: {
            all: [],
            levelLoadStart: [],
            levelLoaded: [],
            teleport: [],
            preUpdate: [],
            postUpdate: [],
            deferredUpdate: [],
            preDraw: [],
            midDraw: [],
            postDraw: [],
            varsChanged: [],
            reset: [],
            windowFocusChanged: []
        },
        states: [],
        staticInstantiate: function() {
            ig.game = this;
            return null
        },
        init: function() {
            this.addons.all = ig.initGameAddons();
            for (var b = 0; b < this.addons.all.length; ++b) {
                var a = this.addons.all[b];
                a.onLevelLoadStart && this.addons.levelLoadStart.push(a);
                a.onLevelLoaded && this.addons.levelLoaded.push(a);
                a.onTeleport && this.addons.teleport.push(a);
                a.onPreUpdate && this.addons.preUpdate.push(a);
                a.onPostUpdate && this.addons.postUpdate.push(a);
                a.onDeferredUpdate && this.addons.deferredUpdate.push(a);
                a.onPreDraw && this.addons.preDraw.push(a);
                a.onMidDraw && this.addons.midDraw.push(a);
                a.onPostDraw && this.addons.postDraw.push(a);
                a.onVarsChanged && this.addons.varsChanged.push(a);
                a.onReset && this.addons.reset.push(a);
                a.onWindowFocusChanged && this.addons.windowFocusChanged.push(a)
            }
            this.addons.levelLoadStart.sort(function(a,
                b) {
                return a.levelLoadStartOrder - b.levelLoadStartOrder
            });
            this.addons.levelLoaded.sort(function(a, b) {
                return a.levelLoadedOrder - b.levelLoadedOrder
            });
            this.addons.teleport.sort(function(a, b) {
                return a.teleportOrder - b.teleportOrder
            });
            this.addons.preUpdate.sort(function(a, b) {
                return a.preUpdateOrder - b.preUpdateOrder
            });
            this.addons.postUpdate.sort(function(a, b) {
                return a.postUpdateOrder - b.postUpdateOrder
            });
            this.addons.deferredUpdate.sort(function(a, b) {
                return a.deferredUpdateOrder - b.deferredUpdateOrder
            });
            this.addons.preDraw.sort(function(a,
                b) {
                return a.preDrawOrder - b.preDrawOrder
            });
            this.addons.midDraw.sort(function(a, b) {
                return a.midDrawOrder - b.midDrawOrder
            });
            this.addons.postDraw.sort(function(a, b) {
                return a.postDrawOrder - b.postDrawOrder
            });
            this.addons.varsChanged.sort(function(a, b) {
                return a.varsChangedOrder - b.varsChangedOrder
            });
            this.addons.reset.sort(function(a, b) {
                return a.resetOrder - b.resetOrder
            });
            this.addons.windowFocusChanged.sort(function(a, b) {
                return a.windowFocusOrder - b.windowFocusOrder
            });
            b = new ig.GameState;
            b.initFromGame(this);
            this.states.push(b);
            ig.extensions.load();
            ig.vars && ig.vars.registerVarAccessor("game", this)
        },
        pushState: function(b) {
            this.states.last().onEnd(this);
            this.states.push(b);
            b.onStart(this)
        },
        popState: function() {
            if (!(this.states.length <= 1)) {
                this.states.pop().onEnd(this);
                this.states.last().onStart(this)
            }
        },
        printGameAddonsString: function() {
            console.groupCollapsed("GameAddons: ");
            for (var b in this.addons)
                if (this.addons[b] && this.addons[b] != this.addons.all) {
                    var a = b.charAt(0).toUpperCase() + b.substring(1);
                    console.groupCollapsed(a + "Order: ");
                    this.printGameAddonsStringFromArray(this.addons[b], b + "Order");
                    console.groupEnd()
                } console.groupEnd()
        },
        printGameAddonsStringFromArray: function(b, a) {
            for (var d = 0; d < b.length; d++) console.log(b[d].name + ": %c" + b[d].__proto__[a], "color:#149AEB")
        },
        getLevelIdx: function(b) {
            for (var a = ig.game.maxLevel; a-- && ig.game.levels[a].height > b;);
            a < 0 && (a = -1);
            return a
        },
        getLevelHeight: function(b) {
            return b == -1 ? this.levels[0].height - 1 : this.levels[b].height
        },
        getHeightFromLevelOffset: function(b) {
            return this.getLevelHeight(b.offset ?
                b.level : b) + (b.offset || 0)
        },
        getEntityByName: function(b) {
            return this.namedEntities[b]
        },
        getEntityByMapId: function(b) {
            return this.mapEntities[b]
        },
        swapNamedEntities: function(b, a) {
            var d = b.name,
                c = a.name;
            a.name = d;
            b.name = c;
            d && (this.namedEntities[d] = a);
            c && (this.namedEntities[c] = b)
        },
        getEntityCount: function() {
            return this.shownEntities.length - this.freeEntityIds.length - 1
        },
        getObjectMaps: function(b) {
            return [this.levels[b].maps[0]]
        },
        isMapTileEmpty: function(b, a) {
            for (var d = ig.game.maxLevel; d--;)
                for (var c = this.levels[d].maps,
                        e = c.length; e--;) {
                    var f = c[e];
                    if (f instanceof ig.MAP.Background) {
                        var g = f.getTile(b, a);
                        if (g) return ig.terrain.getTerrainOfMapTile(f, g) == ig.TERRAIN.NOTHING
                    }
                }
            return true
        },
        getEntitiesInRectangle: function(b, a, d, c, e, f, g, h) {
            return this.physics.getEntitiesInRectangle(b, a, d, c, e, f, g, h)
        },
        getOverlapEntities: function(b) {
            var a = b.coll;
            return this.physics.getEntitiesInRectangle(a.pos.x, a.pos.y, a.pos.z, a.size.x, a.size.y, a.size.z, b)
        },
        getEntitiesInCircle: function(b, a, d, c, e, f, g, h, i, j, k) {
            return this.physics.getEntitiesInCircle(b,
                a, d, c, e, f, g, h, i, j, k)
        },
        getEntitiesByType: function(b) {
            for (var b = typeof b === "string" ? ig.ENTITY[b] : b, a = [], d = 0; d < this.shownEntities.length; d++) {
                var c = this.shownEntities[d];
                c instanceof b && !c._killed && a.push(c)
            }
            return a
        },
        getEntitiesOnTop: function(b) {
            for (var a = [], d = 0; d < this.shownEntities.length; ++d) {
                var c = this.shownEntities[d];
                c && (c.coll._collData && c.coll._collData.groundEntry == b.coll) && a.push(c)
            }
            return a
        },
        isInterruptible: function() {
            return this.events.isInterruptible() && this.isEventStartReady()
        },
        isEventStartReady: function() {
            return true
        },
        isPlayerTouch: function(b, a, d) {
            if (a != this.playerEntity || this.events.getBlockingEventCall() || !d) return false;
            b = a.coll;
            return Math.abs(d.x) > Math.abs(d.y) ? d.x > 0 && b.accelDir.x > 0 || d.x < 0 && b.accelDir.x < 0 : d.y > 0 && b.accelDir.y > 0 || d.y < 0 && b.accelDir.y < 0
        },
        isControlBlocked: function() {
            var b = this.events.getBlockingEventCall();
            return this.teleporting.active || (b ? b.runType == ig.EventRunType.BLOCKING : false)
        },
        getErrorData: function() {},
        onExternalMessageReceived: function(b, a) {
            for (var a = a && JSON.parse(a), d = this.entities.length; d--;) {
                var c =
                    this.entities[d];
                if (c && c.onExternalMessage) c.onExternalMessage(b, a)
            }
        },
        sendExternalMessage: function(b, a) {
            a = JSON.stringify(a);
            window.parent && window.parent.EXTERNAL_IG_MESSAGE && window.parent.EXTERNAL_IG_MESSAGE(b, a)
        },
        setWindowFocus: function(b) {
            for (var a = 0; a < this.addons.windowFocusChanged.length; ++a) this.addons.windowFocusChanged[a].onWindowFocusChanged(b)
        },
        setPaused: function(b) {
            if (this.paused != b)(this.paused = b) ? ig.soundManager.pushPaused() : ig.soundManager.popPaused()
        },
        spawnEntity: function(b, a, d, c, e,
            f) {
            var g;
            if (typeof b === "string") {
                g = ig.ENTITY[b];
                e = ig.globalSettings.resolveEntitySettings(b, e)
            } else g = b;
            if (!g) throw Error("Can't spawn entity of type " + b);
            g = new g(a, d, c, e || {});
            if (g._killed) return null;
            g.initSprites();
            g.name && (this.namedEntities[g.name] = g);
            this.entities.push(g);
            g.mapId && (this.mapEntities[g.mapId] = g);
            if (e && e.spawnCondition) {
                var h = new ig.VarCondition(e.spawnCondition);
                this.conditionalEntities.push({
                    condition: h,
                    type: b,
                    x: a,
                    y: d,
                    z: c,
                    settings: e,
                    entity: g
                });
                if (!h.evaluate()) return null
            }
            g.show(!f);
            return g
        },
        showEntity: function(b) {
            b._hideRequest = false;
            if (b._hidden) {
                var a = this._deferredDetach.indexOf(b);
                if (a != -1) this._deferredDetach.splice(a, 1);
                else {
                    a = 0;
                    if (this.freeEntityIds.length > 0) {
                        a = this.freeEntityIds.pop();
                        if (this.shownEntities[a]) throw Error("Overriding Entity that is already set!");
                        this.shownEntities[a] = b
                    } else {
                        a = this.shownEntities.length;
                        this.shownEntities.push(b)
                    }
                    b.id = a
                }
                b._hidden = false;
                this.physics.addCollEntry(b.coll)
            }
        },
        hideEntity: function(b) {
            if (!b._hidden) {
                b._hidden = true;
                this.detachEntity(b)
            }
        },
        requestEntityHide: function(b) {
            b._hideRequest = true;
            if (b.onHideRequest) b.onHideRequest();
            else b.hide()
        },
        removeEntity: function(b) {
            b.name && delete this.namedEntities[b.name];
            b._killed = b.coll._killed = true;
            this.detachEntity(b)
        },
        detachEntity: function(b) {
            if (!b._killed && !b._hidden) throw Error("Tried to remove entity that is not hidden or killed");
            (b._killed || b.id != 0) && this._deferredDetach.push(b)
        },
        onVarAccess: function(b, a) {
            if (a[1] == "marker") return this.marker
        },
        reset: function() {
            this.isReset = true;
            this.clearMap();
            ig.vars.clear();
            ig.soundManager.reset();
            for (var b = 0; b < this.addons.reset.length; ++b) this.addons.reset[b].onReset();
            this.isReset = false
        },
        teleport: function(b, a, d, c, e) {
            this.previousMap = this.mapName;
            this.mapName = b;
            this.marker = a ? a.marker : null;
            this.teleporting.position = a;
            this.teleporting.active = true;
            this.teleporting.timer = this.onTeleportStart(b, a, d);
            this.teleporting.clearCache = c || false;
            this.teleporting.reloadCache = e || false;
            this.events.clearQueue();
            for (c = 0; c < this.addons.teleport.length; ++c) this.addons.teleport[c].onTeleport(b,
                a, d);
            this.preloadLevel(b)
        },
        isTeleporting: function() {
            return this.teleporting.active
        },
        onTeleportStart: function() {
            return 0
        },
        onTeleportEnd: function() {},
        createPlayer: function() {},
        getVersion: function() {
            return "???"
        },
        preloadLevel: function(b) {
            this.teleporting.levelData = null;
            this.currentLoadingResource = "LOADING MAP: " + b;
            window.IS_IT_CUBAUM = Math.random() < (sc.gameCode.isEnabled("regularTrees") ? 1 : 1E-4);
            var a = b.toPath(ig.root + "data/maps/", ".json") + ig.getCacheSuffix();
            $.ajax({
                dataType: "json",
                url: ig.getFilePath(a),
                context: this,
                success: function(a) {
                    this.teleporting.levelData = a
                },
                error: function(b, c, e) {
                    ig.system.error(Error("Loading of Map '" + a + "' failed: " + b + " / " + c + " / " + e))
                }
            })
        },
        clearMap: function(b) {
            this.screen = {
                x: 0,
                y: 0
            };
            for (var a = this.entities.length; a--;) {
                this.entities[a] && this.entities[a].kill(true);
                if (this.entities[a] && !this.entities[a]._killed) throw Error("Entity of id " + this.entities[a].id + " was not properly killed");
            }
            for (a = 0; a < this.maps.length; ++a) {
                this.maps[a].clear();
                this.maps[a].clearCached && this.maps[a].clearCached()
            }
            this.maps.length =
                0;
            this.levels = {};
            this.minLevelZ = this.maxLevel = 0;
            this.events.clear();
            this.entities.length = 0;
            this.mapEntities.length = 0;
            this.shownEntities = [null];
            this._deferredDetach.length = 0;
            this.freeEntityIds.length = 0;
            this.conditionalEntities.length = 0;
            this.renderer.mapCleared();
            this.physics.mapCleared();
            this.namedEntities = {};
            if (window.nwf) {
                window.nwf.system.Memory.forceGC();
                ig.log("Force GC!")
            }
            b && ig.cleanCache(true)
        },
        loadLevel: function(b, a, d) {
            this.currentLoadingResource = "CREATING MAP:  " + b.name;
            this.clearMap(a);
            ig.imageAtlas.defragment();
            ig.ready = false;
            d && ig.reloadCache(true);
            ig.vars.onLevelChange(b.name);
            for (a = 0; a < this.addons.levelLoadStart.length; ++a) this.addons.levelLoadStart[a].onLevelLoadStart(b);
            this.levels = {};
            this.minLevelZ = 1E5;
            this.maxLevel = b.levels.length;
            this.levels.first = {
                maps: []
            };
            for (a = 0; a < b.levels.length; a++) {
                this.minLevelZ = Math.min(this.minLevelZ, b.levels[a].height);
                this.levels["" + a] = {
                    height: b.levels[a].height,
                    collision: ig.MAP.Collision.staticNoCollision,
                    maps: []
                };
                d = b.levels
            }
            this.levels.last = {
                maps: []
            };
            this.levels.light = {
                maps: []
            };
            this.levels.postlight = {
                maps: []
            };
            this.levels.object1 = {
                maps: []
            };
            this.levels.object2 = {
                maps: []
            };
            this.levels.object3 = {
                maps: []
            };
            this.masterLevel = b.masterLevel ? b.masterLevel.limit(0, this.maxLevel - 1) : 0;
            for (var c = 0, e = 0, a = 0; a < b.layer.length; a++) {
                var f = b.layer[a],
                    d = f.level || 0;
                if (!f.distance || f.distance == 1) {
                    c = Math.max(c, f.tilesize * f.width);
                    e = Math.max(e, f.tilesize * f.height)
                }
                var g = new ig.MAP[f.type](f, this.levels[d].height);
                this.maps.push(g);
                ig.MAP[f.type].levelKey ? this.levels[d][ig.MAP[f.type].levelKey] =
                    g : this.levels[d].maps.push(g)
            }
            this.size.x = c;
            this.size.y = e;
            this.physics.mapLoaded();
            for (a = 0; a < b.entities.length; a++) {
                d = b.entities[a];
                c = this.getHeightFromLevelOffset(d.level);
                this.spawnEntity(d.type, d.x, d.y, c, d.settings)
            }
            this.createPlayer();
            a = this.teleporting.position;
            c = b = null;
            if (this.playerEntity)
                if (!a || a.marker) {
                    if (ig.ENTITY.Marker) {
                        for (a = 0; a < this.shownEntities.length; ++a)
                            if ((d = this.shownEntities[a]) && d.applyMarkerPosition) {
                                if (d.name == this.marker) {
                                    b = d;
                                    break
                                }
                                c || (c = d)
                            } b || (b = c)
                    }
                    if (b && this.playerEntity) {
                        this.marker =
                            b.name;
                        b.applyMarkerPosition(this.playerEntity)
                    }
                } else {
                    this.marker = null;
                    this.playerEntity.coll.level = a.level;
                    this.playerEntity.coll.baseZPos = a.baseZPos;
                    this.playerEntity.coll.pos.z = a.pos.z;
                    this.playerEntity.face.x = a.face.x;
                    this.playerEntity.face.y = a.face.y;
                    this.playerEntity.setPos(a.pos.x + a.size.x / 2 - this.playerEntity.coll.size.x / 2, a.pos.y + a.size.y / 2 - this.playerEntity.coll.size.y / 2)
                } ig.ready = true;
            b = new(this.mapLoader || ig.Loader);
            b.load();
            this.currentLoadingResource = b
        },
        loadingComplete: function() {
            this.teleporting.active =
                false;
            this.playerEntity && this.playerEntity.onPlayerPlaced && this.playerEntity.onPlayerPlaced();
            if (this.postPlacementAction) {
                this.postPlacementAction.onPostPlacementAction(this.playerEntity);
                this.postPlacementAction = null
            }
            this.preDrawMaps();
            var b = null;
            if (this.levels[this.masterLevel].collision) {
                this.levels[this.masterLevel].collision.prepare(null);
                b = this.levels[this.masterLevel].collision
            }
            for (var a = this.masterLevel + 1; a < this.maxLevel; ++a) {
                var d = this.levels[a];
                if (d.collision.prepare) {
                    d.collision.prepare(b,
                        b ? (d.height - this.levels[a - 1].height) / 16 : 0);
                    b = d.collision
                } else b = null
            }
            b = this.levels[this.masterLevel].collision ? this.levels[this.masterLevel].collision : null;
            for (a = this.masterLevel - 1; a >= 0; --a) {
                d = this.levels[a];
                if (d.collision.prepare) {
                    d.collision.prepare(b, b ? (d.height - this.levels[a + 1].height) / 16 : 0);
                    b = d.collision
                } else b = null
            }
            for (b = 0; b < this.addons.levelLoaded.length; ++b) this.addons.levelLoaded[b].onLevelLoaded(this);
            ig.cleanCache();
            if (window.nwf) {
                window.nwf.system.Memory.requestGC();
                window.nwf.system.Memory.forceGC();
                window.nwf.system.Memory.clearCaches();
                ig.log("Image Buffer Count: " + window.nwf.system.Stats.imageBufferCount);
                window.nwf.system.Stats.getMemoryStats(true)
            }
        },
        hasLightLayer: function() {
            return this.levels.light && this.levels.light.maps.length > 0
        },
        preDrawMaps: function() {
            for (var b = 0; b < this.maxLevel; ++b) this.preDrawLevel(b);
            this.preDrawLevel("first");
            this.preDrawLevel("last");
            this.preDrawLevel("light");
            this.preDrawLevel("postlight");
            this.preDrawLevel("object1", true);
            this.preDrawLevel("object2", true);
            this.preDrawLevel("object3",
                true)
        },
        preDrawLevel: function(b, a) {
            for (var d = null, c = null, e = this.levels[b], f = 0; f < e.maps.length; ++f) {
                var g = e.maps[f];
                if (g.preRender) {
                    var h = e.maps[f - 1];
                    if (!h || g.noMerge || g.width != h.width || g.height != h.height || g.moveSpeed.x != h.moveSpeed.x || g.moveSpeed.y != h.moveSpeed.y) c = d = null;
                    if (g.screenRender && !a) {
                        c || (c = new ig.ScreenBuffer(g));
                        g.screenBuffer = c
                    } else d = g.preRenderMapToChunks(d);
                    if (g.noMerge) c = d = null
                } else c = d = null
            }
            ig.ScreenBufferPool.reduceFreeBuffers(1)
        },
        run: function() {
            if (ig.system.hasFocusLost() && this.fullyStopped) ig.soundManager.update();
            else {
                this.fullyStopped = false;
                var b = ig.system.context;
                ig.system.context = null;
                if (ig.perf.update) {
                    var a = ig.system.actualTick,
                        d = a;
                    for (this.firstUpdateLoop = true; d > 0;) {
                        ig.system.actualTick = Math.min(0.05, d);
                        ig.system.tick = ig.system.actualTick * ig.system.timeFactor;
                        this.update();
                        this.firstUpdateLoop = false;
                        d = d - ig.system.actualTick
                    }
                    ig.system.actualTick = a;
                    ig.system.tick = ig.system.actualTick * ig.system.timeFactor
                }
                this.firstUpdateLoop = true;
                ig.perf.deferredUpdate && this.deferredUpdate();
                ig.input.clearPressed();
                ig.soundManager.update();
                ig.system.context = b;
                if (ig.perf.draw) {
                    this.draw();
                    this.finalDraw()
                }
            }
        },
        update: function() {
            for (var b = 0; b < this.addons.preUpdate.length; ++b) this.addons.preUpdate[b].onPreUpdate();
            if (!this.paused && !ig.loading) {
                if (this.teleporting.timer > 0) {
                    this.teleporting.timer = this.teleporting.timer - ig.system.actualTick;
                    if (this.teleporting.timer <= 0) this.onTeleportEnd()
                }
                if (this.teleporting.timer <= 0 && this.teleporting.levelData) {
                    this.loadLevel(this.teleporting.levelData, this.teleporting.clearCache, this.teleporting.reloadCache);
                    this.teleporting.levelData = null;
                    this.teleporting.clearCache = false;
                    if (ig.loading) return
                }
            }
            if (this._deferredVarChanged) {
                this.varsChanged();
                this._deferredVarChanged = false
            }
            if (!this.paused && !ig.loading) {
                this.physics.update();
                this.backgroundAnimTimer = this.backgroundAnimTimer + ig.system.tick;
                for (var a in this.backgroundAnims) {
                    var b = this.backgroundAnims[a],
                        d;
                    for (d in b) b[d].update()
                }
            }
            ig.loading || this.events.update();
            for (b = 0; b < this.addons.postUpdate.length; ++b) this.addons.postUpdate[b].onPostUpdate()
        },
        deferredUpdate: function() {
            this.deferredMapEntityUpdate();
            for (var b = 0; b < this.addons.deferredUpdate.length; ++b) this.addons.deferredUpdate[b].onDeferredUpdate()
        },
        deferredMapEntityUpdate: function() {
            ig.system.ingameTick = ig.system.tick;
            if (!this.paused && !ig.loading) {
                for (var b = this.physics.collUpdateList, a = 0; a < b.length; a++) {
                    var d = b[a].entity;
                    if (d && !d._killed) {
                        ig.system.tick = d.coll.getTick(false);
                        if (d.deferredUpdate) {
                            ig.vars.pushEntityAccessor(d);
                            d.deferredUpdate();
                            ig.vars.popEntityAccessor(d)
                        }
                        ig.system.tick = ig.system.ingameTick
                    }
                }
                for (var c in this.levels)
                    for (a =
                        0; a < this.levels[c].maps.length; a++) {
                        d = this.levels[c].maps[a];
                        d.update && d.update()
                    }
            }
            for (a = 0; a < this._deferredDetach.length; a++)
                if (d = this._deferredDetach[a]) {
                    if (!d._hidden && !d._killed) throw Error("Detaching an Entity that is neither killed nor hidden! Entity Name: " + d.name);
                    if (d.id) {
                        this.physics.removeCollEntry(d.coll);
                        this.shownEntities[d.id] = null;
                        this.freeEntityIds.push(d.id);
                        d.id = 0
                    }
                    if (d._killed) {
                        c = this.entities.indexOf(d);
                        if (c != -1) {
                            this.entities.splice(c, 1);
                            d.erase()
                        }
                    }
                } this._deferredDetach.length =
                0
        },
        draw: function() {
            for (var b in this.levels)
                for (var a = 0; a < this.levels[b].maps.length; a++) this.levels[b].maps[a].setScreenPos(this.screen.x, this.screen.y);
            for (b = 0; b < this.addons.preDraw.length; ++b) this.addons.preDraw[b].onPreDraw();
            ig.system.startZoomedDraw();
            this.renderer.prepareDraw(this.shownEntities);
            this.renderer.drawLayers();
            for (b = 0; b < this.addons.midDraw.length; ++b) this.addons.midDraw[b].onMidDraw();
            this.renderer.drawPostLayerSprites();
            ig.system.endZoomedDraw();
            for (b = 0; b < this.addons.postDraw.length; ++b) this.addons.postDraw[b].onPostDraw()
        },
        finalDraw: function() {
            if (ig.system.hasFocusLost()) {
                ig.system.clear("rgba(0,0,0,0.6)");
                this.fullyStopped = true
            }
        },
        varsChanged: function() {
            for (var b = this.conditionalEntities.length; b--;) {
                var a = this.conditionalEntities[b];
                if (a._killed) this.conditionalEntities.splice(b, 1);
                else {
                    var d = a.condition.evaluate();
                    a.entity._hideRequest && d ? a.entity.show() : !a.entity._hideRequest && !d && ig.game.requestEntityHide(a.entity)
                }
            }
            for (b = 0; b < this.entities.length; b++) this.entities[b] && this.entities[b].varsChanged && this.entities[b].varsChanged();
            for (b = 0; b < this.addons.varsChanged.length; ++b) this.addons.varsChanged[b].onVarsChanged()
        },
        varsChangedDeferred: function() {
            this._deferredVarChanged = true
        },
        isAreaBlocked: function(b, a, d, c, e, f, g) {
            var h = ig.game.getLevelIdx(d),
                h = ig.game.levels[h];
            if (!h || !h.collision) return false;
            if (h.collision.isTileAreaBlocked(b, a - h.height, c, e)) return true;
            if (g) {
                d = this.physics.getEntitiesInRectangle(b, a, d, c, e, f, void 0, void 0, true);
                for (f = d.length; f--;) {
                    g = d[f].coll;
                    if (g.type == ig.COLLTYPE.BLOCK || g.type == ig.COLLTYPE.FENCE)
                        if (g.shape ==
                            ig.COLLSHAPE.RECTANGLE || ig.CollMapTools.isTriangleOverlap(g.pos.x + g.size.x / 2, g.pos.y + g.size.y / 2, g.shape, b, a, c, e)) return true
                }
            }
            return false
        },
        isOverHole: function(b, a, d, c, e, f, g) {
            var h = ig.game.getLevelIdx(d),
                h = ig.game.levels[h];
            if (!h || !h.collision || (!g || d - h.height <= ig.COLLISION.HEIGHT_TOLERATE) && !h.collision.isOverHole(b, a - h.height, c, e)) return false;
            if (f) {
                f = this.physics.getEntitiesInRectangle(b, a, d - 4, c, e, 4);
                for (g = f.length; g--;) {
                    h = f[g].coll;
                    if ((h.type == ig.COLLTYPE.BLOCK || h.type == ig.COLLTYPE.FENCE) && !(h.pos.z +
                            h.size.z > d + ig.COLLISION.HEIGHT_TOLERATE))
                        if (h.shape == ig.COLLSHAPE.RECTANGLE || ig.CollMapTools.isTriangleOverlap(h.pos.x + h.size.x / 2, h.pos.y + h.size.y / 2, h.shape, b, a, c, e)) return false
                }
            }
            return true
        },
        traceEntity: function(b, a, d, c, e, f, g, h, i, j, k) {
            j === void 0 && (j = a);
            return this.trace(b, a.coll.pos.x + (e || 0), a.coll.pos.y + (f || 0), a.coll.pos.z + (g || 0), d, c, a.coll.size.x, a.coll.size.y, a.coll.size.z - (k || 0), h || a.coll.type, j, i || null)
        },
        trace: function(b, a, d, c, e, f, g, h, i, j, k, l, o) {
            return this.physics.trace(b, a, d, c, e, f, g, h, i,
                j, k && k.coll, l, o)
        }
    });
    ig.GameAddon = ig.Class.extend({
        levelLoadStartOrder: 0,
        levelLoadedOrder: 0,
        teleportOrder: 0,
        preUpdateOrder: 0,
        postUpdateOrder: 0,
        deferredUpdateOrder: 0,
        preDrawOrder: 0,
        midDrawOrder: 0,
        postDrawOrder: 0,
        resetOrder: 0,
        varsChangedOrder: 0,
        windowFocusOrder: 0,
        name: "game_addon",
        onLevelLoadStart: null,
        onLevelLoaded: null,
        onTeleport: null,
        onPreUpdate: null,
        onPostUpdate: null,
        onDeferredUpdate: null,
        onPreDraw: null,
        onMidDraw: null,
        onPostDraw: null,
        onReset: null,
        onVarsChanged: null,
        onWindowFocusChanged: null,
        init: function(b) {
            this.name =
                b != void 0 ? b : "game_addon"
        }
    });
    ig.TeleportPosition = ig.Class.extend({
        pos: null,
        face: null,
        marker: null,
        level: 0,
        baseZPos: 0,
        size: {
            x: 0,
            y: 0
        },
        init: function(b) {
            this.marker = b || null
        },
        setFromData: function(b, a, d, c, e, f) {
            this.marker = b || null;
            this.pos = a || null;
            this.face = d || null;
            this.level = c || 0;
            this.baseZPos = e || 0;
            this.size = f
        },
        setFromJson: function(b) {
            this.setFromData(b.marker, b.pos, b.face, b.level, b.baseZPos, b.size)
        },
        getJson: function() {
            return {
                marker: this.marker,
                pos: ig.copy(this.pos),
                face: this.face,
                level: this.level,
                baseZPos: this.baseZPos,
                size: ig.copy(this.size)
            }
        }
    });
    ig.TeleportPosition.createFromJson = function(b) {
        if (!b || !b.marker && (!b.pos || !b.size || !b.face)) return null;
        var a = new ig.TeleportPosition;
        a.setFromJson(b);
        return a
    }
});
window.sc || (window.sc = {}, window.sc = window.sc);
ig.baked = !0;
