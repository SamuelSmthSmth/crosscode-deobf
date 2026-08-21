/*
 * impact.base.game
 * ----------------
 * `ig.Game` — the heart of the engine: level loading/teleporting, entity
 * spawning and lifecycle (show/hide/kill), the addon hooks, the per-frame
 * update/draw loop, and the collision/trace/hole query helpers. Also defines
 * `ig.GameAddon` (the extension hook base) and `ig.TeleportPosition`.
 *
 * Original: deobf/extract/impact.base.game.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.game").requires("impact.base.impact", "impact.base.entity", "impact.base.event", "impact.base.renderer", "impact.base.physics", "impact.base.game-state", "impact.base.collision-map", "impact.base.background-map", "impact.base.global-settings", "impact.base.extension", "impact.base.utils", "impact.base.dom").defines(function () {
    Vec2.create();
    Vec2.create();
    Vec2.create();
    window.IG_ENTITY_KILL_CALL = false;

    ig.Game = ig.Class.extend({
        clearColor: "#000008",
        gravity: 0,
        screen: { x: 0, y: 0 },
        soundPos: { x: 0, y: 0 },
        size: { x: 0, y: 0 },
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
        events: new ig.EventManager(),
        renderer: new ig.Renderer2d(),
        physics: new ig.Physics(),
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

        staticInstantiate: function () {
            ig.game = this;
            return null;
        },

        init: function () {
            this.addons.all = ig.initGameAddons();
            for (var i = 0; i < this.addons.all.length; ++i) {
                var addon = this.addons.all[i];
                addon.onLevelLoadStart && this.addons.levelLoadStart.push(addon);
                addon.onLevelLoaded && this.addons.levelLoaded.push(addon);
                addon.onTeleport && this.addons.teleport.push(addon);
                addon.onPreUpdate && this.addons.preUpdate.push(addon);
                addon.onPostUpdate && this.addons.postUpdate.push(addon);
                addon.onDeferredUpdate && this.addons.deferredUpdate.push(addon);
                addon.onPreDraw && this.addons.preDraw.push(addon);
                addon.onMidDraw && this.addons.midDraw.push(addon);
                addon.onPostDraw && this.addons.postDraw.push(addon);
                addon.onVarsChanged && this.addons.varsChanged.push(addon);
                addon.onReset && this.addons.reset.push(addon);
                addon.onWindowFocusChanged && this.addons.windowFocusChanged.push(addon);
            }
            this.addons.levelLoadStart.sort(function (a, b) { return a.levelLoadStartOrder - b.levelLoadStartOrder; });
            this.addons.levelLoaded.sort(function (a, b) { return a.levelLoadedOrder - b.levelLoadedOrder; });
            this.addons.teleport.sort(function (a, b) { return a.teleportOrder - b.teleportOrder; });
            this.addons.preUpdate.sort(function (a, b) { return a.preUpdateOrder - b.preUpdateOrder; });
            this.addons.postUpdate.sort(function (a, b) { return a.postUpdateOrder - b.postUpdateOrder; });
            this.addons.deferredUpdate.sort(function (a, b) { return a.deferredUpdateOrder - b.deferredUpdateOrder; });
            this.addons.preDraw.sort(function (a, b) { return a.preDrawOrder - b.preDrawOrder; });
            this.addons.midDraw.sort(function (a, b) { return a.midDrawOrder - b.midDrawOrder; });
            this.addons.postDraw.sort(function (a, b) { return a.postDrawOrder - b.postDrawOrder; });
            this.addons.varsChanged.sort(function (a, b) { return a.varsChangedOrder - b.varsChangedOrder; });
            this.addons.reset.sort(function (a, b) { return a.resetOrder - b.resetOrder; });
            this.addons.windowFocusChanged.sort(function (a, b) { return a.windowFocusOrder - b.windowFocusOrder; });
            i = new ig.GameState();
            i.initFromGame(this);
            this.states.push(i);
            ig.extensions.load();
            ig.vars && ig.vars.registerVarAccessor("game", this);
        },

        pushState: function (state) {
            this.states.last().onEnd(this);
            this.states.push(state);
            state.onStart(this);
        },

        popState: function () {
            if (!(this.states.length <= 1)) {
                this.states.pop().onEnd(this);
                this.states.last().onStart(this);
            }
        },

        printGameAddonsString: function () {
            console.groupCollapsed("GameAddons: ");
            for (var key in this.addons) {
                if (this.addons[key] && this.addons[key] != this.addons.all) {
                    var label = key.charAt(0).toUpperCase() + key.substring(1);
                    console.groupCollapsed(label + "Order: ");
                    this.printGameAddonsStringFromArray(this.addons[key], key + "Order");
                    console.groupEnd();
                }
            }
            console.groupEnd();
        },

        printGameAddonsStringFromArray: function (list, orderName) {
            for (var i = 0; i < list.length; i++) console.log(list[i].name + ": %c" + list[i].__proto__[orderName], "color:#149AEB");
        },

        getLevelIdx: function (z) {
            for (var level = ig.game.maxLevel; level-- && ig.game.levels[level].height > z;);
            level < 0 && (level = -1);
            return level;
        },

        getLevelHeight: function (level) {
            return level == -1 ? this.levels[0].height - 1 : this.levels[level].height;
        },

        getHeightFromLevelOffset: function (offset) {
            return this.getLevelHeight(offset.offset ? offset.level : offset) + (offset.offset || 0);
        },

        getEntityByName: function (name) {
            return this.namedEntities[name];
        },

        getEntityByMapId: function (mapId) {
            return this.mapEntities[mapId];
        },

        swapNamedEntities: function (a, b) {
            var aName = a.name;
            var bName = b.name;
            a.name = bName;
            b.name = aName;
            aName && (this.namedEntities[aName] = b);
            bName && (this.namedEntities[bName] = a);
        },

        getEntityCount: function () {
            return this.shownEntities.length - this.freeEntityIds.length - 1;
        },

        getObjectMaps: function (level) {
            return [this.levels[level].maps[0]];
        },

        isMapTileEmpty: function (x, y) {
            for (var level = ig.game.maxLevel; level--;) {
                for (var maps = this.levels[level].maps, i = maps.length; i--;) {
                    var map = maps[i];
                    if (map instanceof ig.MAP.Background) {
                        var tile = map.getTile(x, y);
                        if (tile) return ig.terrain.getTerrainOfMapTile(map, tile) == ig.TERRAIN.NOTHING;
                    }
                }
            }
            return true;
        },

        getEntitiesInRectangle: function (x, y, z, sizeX, sizeY, sizeZ, ignore, mask) {
            return this.physics.getEntitiesInRectangle(x, y, z, sizeX, sizeY, sizeZ, ignore, mask);
        },

        getOverlapEntities: function (entity) {
            var coll = entity.coll;
            return this.physics.getEntitiesInRectangle(coll.pos.x, coll.pos.y, coll.pos.z, coll.size.x, coll.size.y, coll.size.z, entity);
        },

        getEntitiesInCircle: function (x, y, z, radius, ignore, mask, ignoreCollType, maxCount, sortByDistance, orderByDistance, checkOverlap) {
            return this.physics.getEntitiesInCircle(x, y, z, radius, ignore, mask, ignoreCollType, maxCount, sortByDistance, orderByDistance, checkOverlap);
        },

        getEntitiesByType: function (type) {
            type = typeof type === "string" ? ig.ENTITY[type] : type;
            var result = [];
            for (var i = 0; i < this.shownEntities.length; i++) {
                var entity = this.shownEntities[i];
                entity instanceof type && !entity._killed && result.push(entity);
            }
            return result;
        },

        getEntitiesOnTop: function (entity) {
            for (var result = [], i = 0; i < this.shownEntities.length; ++i) {
                var other = this.shownEntities[i];
                other && (other.coll._collData && other.coll._collData.groundEntry == entity.coll) && result.push(other);
            }
            return result;
        },

        isInterruptible: function () {
            return this.events.isInterruptible() && this.isEventStartReady();
        },

        isEventStartReady: function () {
            return true;
        },

        isPlayerTouch: function (entity, player, dir) {
            if (player != this.playerEntity || this.events.getBlockingEventCall() || !dir) return false;
            entity = player.coll;
            return Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x > 0 && entity.accelDir.x > 0) || (dir.x < 0 && entity.accelDir.x < 0) : (dir.y > 0 && entity.accelDir.y > 0) || (dir.y < 0 && entity.accelDir.y < 0);
        },

        isControlBlocked: function () {
            var blockingCall = this.events.getBlockingEventCall();
            return this.teleporting.active || (blockingCall ? blockingCall.runType == ig.EventRunType.BLOCKING : false);
        },

        getErrorData: function () {},

        onExternalMessageReceived: function (message, data) {
            data = data && JSON.parse(data);
            for (var i = this.entities.length; i--;) {
                var entity = this.entities[i];
                if (entity && entity.onExternalMessage) entity.onExternalMessage(message, data);
            }
        },

        sendExternalMessage: function (message, data) {
            data = JSON.stringify(data);
            window.parent && window.parent.EXTERNAL_IG_MESSAGE && window.parent.EXTERNAL_IG_MESSAGE(message, data);
        },

        setWindowFocus: function (focus) {
            for (var i = 0; i < this.addons.windowFocusChanged.length; ++i) this.addons.windowFocusChanged[i].onWindowFocusChanged(focus);
        },

        setPaused: function (paused) {
            if (this.paused != paused) (this.paused = paused) ? ig.soundManager.pushPaused() : ig.soundManager.popPaused();
        },

        spawnEntity: function (type, x, y, z, settings, showImmediately) {
            var entityClass;
            if (typeof type === "string") {
                entityClass = ig.ENTITY[type];
                settings = ig.globalSettings.resolveEntitySettings(type, settings);
            } else {
                entityClass = type;
            }
            if (!entityClass) throw Error("Can't spawn entity of type " + type);
            entityClass = new entityClass(x, y, z, settings || {});
            if (entityClass._killed) return null;
            entityClass.initSprites();
            entityClass.name && (this.namedEntities[entityClass.name] = entityClass);
            this.entities.push(entityClass);
            entityClass.mapId && (this.mapEntities[entityClass.mapId] = entityClass);
            if (settings && settings.spawnCondition) {
                var condition = new ig.VarCondition(settings.spawnCondition);
                this.conditionalEntities.push({
                    condition: condition,
                    type: type,
                    x: x,
                    y: y,
                    z: z,
                    settings: settings,
                    entity: entityClass
                });
                if (!condition.evaluate()) return null;
            }
            entityClass.show(!showImmediately);
            return entityClass;
        },

        showEntity: function (entity) {
            entity._hideRequest = false;
            if (entity._hidden) {
                var detachIdx = this._deferredDetach.indexOf(entity);
                if (detachIdx != -1) {
                    this._deferredDetach.splice(detachIdx, 1);
                } else {
                    detachIdx = 0;
                    if (this.freeEntityIds.length > 0) {
                        detachIdx = this.freeEntityIds.pop();
                        if (this.shownEntities[detachIdx]) throw Error("Overriding Entity that is already set!");
                        this.shownEntities[detachIdx] = entity;
                    } else {
                        detachIdx = this.shownEntities.length;
                        this.shownEntities.push(entity);
                    }
                    entity.id = detachIdx;
                }
                entity._hidden = false;
                this.physics.addCollEntry(entity.coll);
            }
        },

        hideEntity: function (entity) {
            if (!entity._hidden) {
                entity._hidden = true;
                this.detachEntity(entity);
            }
        },

        requestEntityHide: function (entity) {
            entity._hideRequest = true;
            if (entity.onHideRequest) entity.onHideRequest();
            else entity.hide();
        },

        removeEntity: function (entity) {
            entity.name && delete this.namedEntities[entity.name];
            entity._killed = entity.coll._killed = true;
            this.detachEntity(entity);
        },

        detachEntity: function (entity) {
            if (!entity._killed && !entity._hidden) throw Error("Tried to remove entity that is not hidden or killed");
            (entity._killed || entity.id != 0) && this._deferredDetach.push(entity);
        },

        onVarAccess: function (access, path) {
            if (path[1] == "marker") return this.marker;
        },

        reset: function () {
            this.isReset = true;
            this.clearMap();
            ig.vars.clear();
            ig.soundManager.reset();
            for (var i = 0; i < this.addons.reset.length; ++i) this.addons.reset[i].onReset();
            this.isReset = false;
        },

        teleport: function (mapName, position, delay, clearCache, reloadCache) {
            this.previousMap = this.mapName;
            this.mapName = mapName;
            this.marker = position ? position.marker : null;
            this.teleporting.position = position;
            this.teleporting.active = true;
            this.teleporting.timer = this.onTeleportStart(mapName, position, delay);
            this.teleporting.clearCache = clearCache || false;
            this.teleporting.reloadCache = reloadCache || false;
            this.events.clearQueue();
            for (clearCache = 0; clearCache < this.addons.teleport.length; ++clearCache) this.addons.teleport[clearCache].onTeleport(mapName, position, delay);
            this.preloadLevel(mapName);
        },

        isTeleporting: function () {
            return this.teleporting.active;
        },

        onTeleportStart: function () {
            return 0;
        },

        onTeleportEnd: function () {},

        createPlayer: function () {},

        getVersion: function () {
            return "???";
        },

        preloadLevel: function (mapName) {
            this.teleporting.levelData = null;
            this.currentLoadingResource = "LOADING MAP: " + mapName;
            window.IS_IT_CUBAUM = Math.random() < (sc.gameCode.isEnabled("regularTrees") ? 1 : 1e-4);
            var url = mapName.toPath(ig.root + "data/maps/", ".json") + ig.getCacheSuffix();
            $.ajax({
                dataType: "json",
                url: ig.getFilePath(url),
                context: this,
                success: function (data) {
                    this.teleporting.levelData = data;
                },
                error: function (jqXHR, status, error) {
                    ig.system.error(Error("Loading of Map '" + url + "' failed: " + jqXHR + " / " + status + " / " + error));
                }
            });
        },

        clearMap: function (clearCache) {
            this.screen = { x: 0, y: 0 };
            for (var i = this.entities.length; i--;) {
                this.entities[i] && this.entities[i].kill(true);
                if (this.entities[i] && !this.entities[i]._killed) throw Error("Entity of id " + this.entities[i].id + " was not properly killed");
            }
            for (i = 0; i < this.maps.length; ++i) {
                this.maps[i].clear();
                this.maps[i].clearCached && this.maps[i].clearCached();
            }
            this.maps.length = 0;
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
                ig.log("Force GC!");
            }
            clearCache && ig.cleanCache(true);
        },

        loadLevel: function (levelData, clearEntities, reloadCache) {
            this.currentLoadingResource = "CREATING MAP:  " + levelData.name;
            this.clearMap(clearEntities);
            ig.imageAtlas.defragment();
            ig.ready = false;
            reloadCache && ig.reloadCache(true);
            ig.vars.onLevelChange(levelData.name);
            for (clearEntities = 0; clearEntities < this.addons.levelLoadStart.length; ++clearEntities) this.addons.levelLoadStart[clearEntities].onLevelLoadStart(levelData);
            this.levels = {};
            this.minLevelZ = 1e5;
            this.maxLevel = levelData.levels.length;
            this.levels.first = { maps: [] };
            for (clearEntities = 0; clearEntities < levelData.levels.length; clearEntities++) {
                this.minLevelZ = Math.min(this.minLevelZ, levelData.levels[clearEntities].height);
                this.levels["" + clearEntities] = {
                    height: levelData.levels[clearEntities].height,
                    collision: ig.MAP.Collision.staticNoCollision,
                    maps: []
                };
                reloadCache = levelData.levels;
            }
            this.levels.last = { maps: [] };
            this.levels.light = { maps: [] };
            this.levels.postlight = { maps: [] };
            this.levels.object1 = { maps: [] };
            this.levels.object2 = { maps: [] };
            this.levels.object3 = { maps: [] };
            this.masterLevel = levelData.masterLevel ? levelData.masterLevel.limit(0, this.maxLevel - 1) : 0;
            for (var mapWidth = 0, mapHeight = 0, i = 0; i < levelData.layer.length; i++) {
                var layer = levelData.layer[i];
                var levelIdx = layer.level || 0;
                if (!layer.distance || layer.distance == 1) {
                    mapWidth = Math.max(mapWidth, layer.tilesize * layer.width);
                    mapHeight = Math.max(mapHeight, layer.tilesize * layer.height);
                }
                var map = new ig.MAP[layer.type](layer, this.levels[levelIdx].height);
                this.maps.push(map);
                ig.MAP[layer.type].levelKey ? (this.levels[levelIdx][ig.MAP[layer.type].levelKey] = map) : this.levels[levelIdx].maps.push(map);
            }
            this.size.x = mapWidth;
            this.size.y = mapHeight;
            this.physics.mapLoaded();
            for (i = 0; i < levelData.entities.length; i++) {
                reloadCache = levelData.entities[i];
                mapWidth = this.getHeightFromLevelOffset(reloadCache.level);
                this.spawnEntity(reloadCache.type, reloadCache.x, reloadCache.y, mapWidth, reloadCache.settings);
            }
            this.createPlayer();
            i = this.teleporting.position;
            mapWidth = mapHeight = null;
            if (this.playerEntity) {
                if (!i || i.marker) {
                    if (ig.ENTITY.Marker) {
                        for (i = 0; i < this.shownEntities.length; ++i) {
                            if ((reloadCache = this.shownEntities[i]) && reloadCache.applyMarkerPosition) {
                                if (reloadCache.name == this.marker) {
                                    mapHeight = reloadCache;
                                    break;
                                }
                                mapWidth || (mapWidth = reloadCache);
                            }
                        }
                        mapHeight || (mapHeight = mapWidth);
                    }
                    if (mapHeight && this.playerEntity) {
                        this.marker = mapHeight.name;
                        mapHeight.applyMarkerPosition(this.playerEntity);
                    }
                } else {
                    this.marker = null;
                    this.playerEntity.coll.level = i.level;
                    this.playerEntity.coll.baseZPos = i.baseZPos;
                    this.playerEntity.coll.pos.z = i.pos.z;
                    this.playerEntity.face.x = i.face.x;
                    this.playerEntity.face.y = i.face.y;
                    this.playerEntity.setPos(i.pos.x + i.size.x / 2 - this.playerEntity.coll.size.x / 2, i.pos.y + i.size.y / 2 - this.playerEntity.coll.size.y / 2);
                }
                ig.ready = true;
            }
            mapHeight = new (this.mapLoader || ig.Loader)();
            mapHeight.load();
            this.currentLoadingResource = mapHeight;
        },

        loadingComplete: function () {
            this.teleporting.active = false;
            this.playerEntity && this.playerEntity.onPlayerPlaced && this.playerEntity.onPlayerPlaced();
            if (this.postPlacementAction) {
                this.postPlacementAction.onPostPlacementAction(this.playerEntity);
                this.postPlacementAction = null;
            }
            this.preDrawMaps();
            var prevCollision = null;
            if (this.levels[this.masterLevel].collision) {
                this.levels[this.masterLevel].collision.prepare(null);
                prevCollision = this.levels[this.masterLevel].collision;
            }
            for (var level = this.masterLevel + 1; level < this.maxLevel; ++level) {
                var levelData = this.levels[level];
                if (levelData.collision.prepare) {
                    levelData.collision.prepare(prevCollision, prevCollision ? (levelData.height - this.levels[level - 1].height) / 16 : 0);
                    prevCollision = levelData.collision;
                } else {
                    prevCollision = null;
                }
            }
            prevCollision = this.levels[this.masterLevel].collision ? this.levels[this.masterLevel].collision : null;
            for (level = this.masterLevel - 1; level >= 0; --level) {
                levelData = this.levels[level];
                if (levelData.collision.prepare) {
                    levelData.collision.prepare(prevCollision, prevCollision ? (levelData.height - this.levels[level + 1].height) / 16 : 0);
                    prevCollision = levelData.collision;
                } else {
                    prevCollision = null;
                }
            }
            for (prevCollision = 0; prevCollision < this.addons.levelLoaded.length; ++prevCollision) this.addons.levelLoaded[prevCollision].onLevelLoaded(this);
            ig.cleanCache();
            if (window.nwf) {
                window.nwf.system.Memory.requestGC();
                window.nwf.system.Memory.forceGC();
                window.nwf.system.Memory.clearCaches();
                ig.log("Image Buffer Count: " + window.nwf.system.Stats.imageBufferCount);
                window.nwf.system.Stats.getMemoryStats(true);
            }
        },

        hasLightLayer: function () {
            return this.levels.light && this.levels.light.maps.length > 0;
        },

        preDrawMaps: function () {
            for (var level = 0; level < this.maxLevel; ++level) this.preDrawLevel(level);
            this.preDrawLevel("first");
            this.preDrawLevel("last");
            this.preDrawLevel("light");
            this.preDrawLevel("postlight");
            this.preDrawLevel("object1", true);
            this.preDrawLevel("object2", true);
            this.preDrawLevel("object3", true);
        },

        preDrawLevel: function (level, screenRender) {
            for (var chunk = null, screenBuffer = null, maps = this.levels[level], i = 0; i < maps.maps.length; ++i) {
                var map = maps.maps[i];
                if (map.preRender) {
                    var prevMap = maps.maps[i - 1];
                    if (!prevMap || map.noMerge || map.width != prevMap.width || map.height != prevMap.height || map.moveSpeed.x != prevMap.moveSpeed.x || map.moveSpeed.y != prevMap.moveSpeed.y) screenBuffer = chunk = null;
                    if (map.screenRender && !screenRender) {
                        screenBuffer || (screenBuffer = new ig.ScreenBuffer(map));
                        map.screenBuffer = screenBuffer;
                    } else {
                        chunk = map.preRenderMapToChunks(chunk);
                    }
                    if (map.noMerge) screenBuffer = chunk = null;
                } else {
                    screenBuffer = chunk = null;
                }
            }
            ig.ScreenBufferPool.reduceFreeBuffers(1);
        },

        run: function () {
            if (ig.system.hasFocusLost() && this.fullyStopped) {
                ig.soundManager.update();
            } else {
                this.fullyStopped = false;
                var context = ig.system.context;
                ig.system.context = null;
                if (ig.perf.update) {
                    var fullTick = ig.system.actualTick;
                    var remaining = fullTick;
                    for (this.firstUpdateLoop = true; remaining > 0;) {
                        ig.system.actualTick = Math.min(0.05, remaining);
                        ig.system.tick = ig.system.actualTick * ig.system.timeFactor;
                        this.update();
                        this.firstUpdateLoop = false;
                        remaining = remaining - ig.system.actualTick;
                    }
                    ig.system.actualTick = fullTick;
                    ig.system.tick = ig.system.actualTick * ig.system.timeFactor;
                }
                this.firstUpdateLoop = true;
                ig.perf.deferredUpdate && this.deferredUpdate();
                ig.input.clearPressed();
                ig.soundManager.update();
                ig.system.context = context;
                if (ig.perf.draw) {
                    this.draw();
                    this.finalDraw();
                }
            }
        },

        update: function () {
            for (var i = 0; i < this.addons.preUpdate.length; ++i) this.addons.preUpdate[i].onPreUpdate();
            if (!this.paused && !ig.loading) {
                if (this.teleporting.timer > 0) {
                    this.teleporting.timer = this.teleporting.timer - ig.system.actualTick;
                    if (this.teleporting.timer <= 0) this.onTeleportEnd();
                }
                if (this.teleporting.timer <= 0 && this.teleporting.levelData) {
                    this.loadLevel(this.teleporting.levelData, this.teleporting.clearCache, this.teleporting.reloadCache);
                    this.teleporting.levelData = null;
                    this.teleporting.clearCache = false;
                    if (ig.loading) return;
                }
            }
            if (this._deferredVarChanged) {
                this.varsChanged();
                this._deferredVarChanged = false;
            }
            if (!this.paused && !ig.loading) {
                this.physics.update();
                this.backgroundAnimTimer = this.backgroundAnimTimer + ig.system.tick;
                for (var name in this.backgroundAnims) {
                    var anims = this.backgroundAnims[name];
                    var key;
                    for (key in anims) anims[key].update();
                }
            }
            ig.loading || this.events.update();
            for (i = 0; i < this.addons.postUpdate.length; ++i) this.addons.postUpdate[i].onPostUpdate();
        },

        deferredUpdate: function () {
            this.deferredMapEntityUpdate();
            for (var i = 0; i < this.addons.deferredUpdate.length; ++i) this.addons.deferredUpdate[i].onDeferredUpdate();
        },

        deferredMapEntityUpdate: function () {
            ig.system.ingameTick = ig.system.tick;
            if (!this.paused && !ig.loading) {
                for (var updateList = this.physics.collUpdateList, i = 0; i < updateList.length; i++) {
                    var entity = updateList[i].entity;
                    if (entity && !entity._killed) {
                        ig.system.tick = entity.coll.getTick(false);
                        if (entity.deferredUpdate) {
                            ig.vars.pushEntityAccessor(entity);
                            entity.deferredUpdate();
                            ig.vars.popEntityAccessor(entity);
                        }
                        ig.system.tick = ig.system.ingameTick;
                    }
                }
                for (var levelName in this.levels) {
                    for (i = 0; i < this.levels[levelName].maps.length; i++) {
                        entity = this.levels[levelName].maps[i];
                        entity.update && entity.update();
                    }
                }
            }
            for (i = 0; i < this._deferredDetach.length; i++) {
                if ((entity = this._deferredDetach[i])) {
                    if (!entity._hidden && !entity._killed) throw Error("Detaching an Entity that is neither killed nor hidden! Entity Name: " + entity.name);
                    if (entity.id) {
                        this.physics.removeCollEntry(entity.coll);
                        this.shownEntities[entity.id] = null;
                        this.freeEntityIds.push(entity.id);
                        entity.id = 0;
                    }
                    if (entity._killed) {
                        levelName = this.entities.indexOf(entity);
                        if (levelName != -1) {
                            this.entities.splice(levelName, 1);
                            entity.erase();
                        }
                    }
                }
            }
            this._deferredDetach.length = 0;
        },

        draw: function () {
            for (var levelName in this.levels) {
                for (var i = 0; i < this.levels[levelName].maps.length; i++) this.levels[levelName].maps[i].setScreenPos(this.screen.x, this.screen.y);
            }
            for (i = 0; i < this.addons.preDraw.length; ++i) this.addons.preDraw[i].onPreDraw();
            ig.system.startZoomedDraw();
            this.renderer.prepareDraw(this.shownEntities);
            this.renderer.drawLayers();
            for (i = 0; i < this.addons.midDraw.length; ++i) this.addons.midDraw[i].onMidDraw();
            this.renderer.drawPostLayerSprites();
            ig.system.endZoomedDraw();
            for (i = 0; i < this.addons.postDraw.length; ++i) this.addons.postDraw[i].onPostDraw();
        },

        finalDraw: function () {
            if (ig.system.hasFocusLost()) {
                ig.system.clear("rgba(0,0,0,0.6)");
                this.fullyStopped = true;
            }
        },

        varsChanged: function () {
            for (var i = this.conditionalEntities.length; i--;) {
                var entry = this.conditionalEntities[i];
                if (entry._killed) {
                    this.conditionalEntities.splice(i, 1);
                } else {
                    var condition = entry.condition.evaluate();
                    entry.entity._hideRequest && condition ? entry.entity.show() : (!entry.entity._hideRequest && !condition && ig.game.requestEntityHide(entry.entity));
                }
            }
            for (i = 0; i < this.entities.length; i++) this.entities[i] && this.entities[i].varsChanged && this.entities[i].varsChanged();
            for (i = 0; i < this.addons.varsChanged.length; ++i) this.addons.varsChanged[i].onVarsChanged();
        },

        varsChangedDeferred: function () {
            this._deferredVarChanged = true;
        },

        isAreaBlocked: function (x, y, z, sizeX, sizeY, sizeZ, checkEntities) {
            var level = ig.game.getLevelIdx(z);
            level = ig.game.levels[level];
            if (!level || !level.collision) return false;
            if (level.collision.isTileAreaBlocked(x, y - level.height, sizeX, sizeY)) return true;
            if (checkEntities) {
                z = this.physics.getEntitiesInRectangle(x, y, z, sizeX, sizeY, sizeZ, void 0, void 0, true);
                for (sizeZ = z.length; sizeZ--;) {
                    checkEntities = z[sizeZ].coll;
                    if (checkEntities.type == ig.COLLTYPE.BLOCK || checkEntities.type == ig.COLLTYPE.FENCE) {
                        if (checkEntities.shape == ig.COLLSHAPE.RECTANGLE || ig.CollMapTools.isTriangleOverlap(checkEntities.pos.x + checkEntities.size.x / 2, checkEntities.pos.y + checkEntities.size.y / 2, checkEntities.shape, x, y, sizeX, sizeY)) return true;
                    }
                }
            }
            return false;
        },

        isOverHole: function (x, y, z, sizeX, sizeY, checkEntities, ignoreHeight) {
            var level = ig.game.getLevelIdx(z);
            level = ig.game.levels[level];
            if (!level || !level.collision || (!ignoreHeight || z - level.height <= ig.COLLISION.HEIGHT_TOLERATE) && !level.collision.isOverHole(x, y - level.height, sizeX, sizeY)) return false;
            if (checkEntities) {
                checkEntities = this.physics.getEntitiesInRectangle(x, y, z - 4, sizeX, sizeY, 4);
                for (ignoreHeight = checkEntities.length; ignoreHeight--;) {
                    level = checkEntities[ignoreHeight].coll;
                    if ((level.type == ig.COLLTYPE.BLOCK || level.type == ig.COLLTYPE.FENCE) && !(level.pos.z + level.size.z > z + ig.COLLISION.HEIGHT_TOLERATE)) {
                        if (level.shape == ig.COLLSHAPE.RECTANGLE || ig.CollMapTools.isTriangleOverlap(level.pos.x + level.size.x / 2, level.pos.y + level.size.y / 2, level.shape, x, y, sizeX, sizeY)) return false;
                    }
                }
            }
            return true;
        },

        traceEntity: function (result, entity, velX, velY, offsetX, offsetY, offsetZ, collType, traceResultType, self, sizeZReduction) {
            self === void 0 && (self = entity);
            return this.trace(result, entity.coll.pos.x + (offsetX || 0), entity.coll.pos.y + (offsetY || 0), entity.coll.pos.z + (offsetZ || 0), velX, velY, entity.coll.size.x, entity.coll.size.y, entity.coll.size.z - (sizeZReduction || 0), collType || entity.coll.type, self, traceResultType || null);
        },

        trace: function (result, x, y, z, velX, velY, sizeX, sizeY, sizeZ, collType, entity, traceResultType, extra) {
            return this.physics.trace(result, x, y, z, velX, velY, sizeX, sizeY, sizeZ, collType, entity && entity.coll, traceResultType, extra);
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

        init: function (name) {
            this.name = name != void 0 ? name : "game_addon";
        }
    });

    ig.TeleportPosition = ig.Class.extend({
        pos: null,
        face: null,
        marker: null,
        level: 0,
        baseZPos: 0,
        size: { x: 0, y: 0 },

        init: function (marker) {
            this.marker = marker || null;
        },

        setFromData: function (marker, pos, face, level, baseZPos, size) {
            this.marker = marker || null;
            this.pos = pos || null;
            this.face = face || null;
            this.level = level || 0;
            this.baseZPos = baseZPos || 0;
            this.size = size;
        },

        setFromJson: function (json) {
            this.setFromData(json.marker, json.pos, json.face, json.level, json.baseZPos, json.size);
        },

        getJson: function () {
            return {
                marker: this.marker,
                pos: ig.copy(this.pos),
                face: this.face,
                level: this.level,
                baseZPos: this.baseZPos,
                size: ig.copy(this.size)
            };
        }
    });

    ig.TeleportPosition.createFromJson = function (json) {
        if (!json || (!json.marker && (!json.pos || !json.size || !json.face))) return null;
        var position = new ig.TeleportPosition();
        position.setFromJson(json);
        return position;
    };
});
window.sc || (window.sc = {}, window.sc = window.sc);
ig.baked = !0;
