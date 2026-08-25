ig.module("game.feature.menu.map-model").requires("impact.base.game", "impact.base.loader", "impact.base.vars", "impact.feature.database.database", "game.config", "game.feature.quick-menu.quick-menu-model", "game.feature.model.options-model").defines(function() {
    var b = {
        landmark: "",
        area: ""
    };
    sc.LANDMARK_OPTIONS = {
        DEFAULT: {
            icon: null,
            bounds: {
                x: 0,
                y: 0,
                w: 8,
                h: 8
            }
        }
    };
    sc.MAP_DUNGEON_OVERRIDE = {
        DUNGEON: 1,
        NO_DUNGEON: 2
    };
    sc.AREA_TYPE = {};
    sc.AREA_TYPE.TOWN = 0;
    sc.AREA_TYPE.PATH = 1;
    sc.AREA_TYPE.DUNGEON = 2;
    sc.AREA_ITEM_TYPE = {
        DUNGEON_KEY: {
            areaField: "keyItem"
        },
        DUNGEON_MASTER_KEY: {
            areaField: "masterKeyItem"
        },
        BOOSTER: {
            areaField: "boosterItem"
        }
    };
    sc.MapModel = ig.GameAddon.extend({
        observers: [],
        activeLandmarks: {},
        areas: null,
        areasVisited: {},
        currentPlayerArea: null,
        currentArea: null,
        currentPlayerFloor: 0,
        currentFloor: 0,
        currentMap: null,
        unknownArea: null,
        teleportEvent: null,
        _usedNames: [],
        _oobSoundTerrain: null,
        init: function() {
            this.parent("MapModel");
            ig.storage.register(this);
            window.wm && ig.database.register("areas", "AreaList", "Areas");
            this.initAreas();
            ig.vars.registerVarAccessor("area",
                this, "VarAreaEditor");
            ig.vars.registerVarAccessor("location", this, "VarLocationEditor")
        },
        isValidArea: function(a) {
            return this.areas[a].track && !this.areas[a].isDLC
        },
        getTotalAreasFound: function(a) {
            var b = 0,
                c = 0,
                e;
            for (e in this.areas)
                if (this.isValidArea(e)) {
                    this.areasVisited[e.toCamel()] && b++;
                    c++
                } return a ? b / c : b
        },
        getTotalLandmarksFound: function(a) {
            var b = 0,
                c = 0,
                e;
            for (e in this.areas)
                for (var f in this.areas[e].landmarks)
                    if (!this.areas[e].landmarks[f].extension && this.isValidArea(e)) {
                        this.activeLandmarks[e] &&
                            this.activeLandmarks[e][f] && b++;
                        c++
                    } return a ? b / c : b
        },
        getTotalChestsFound: function(a) {
            var b = 0,
                c = 0,
                e;
            for (e in this.areas)
                if (this.isValidArea(e)) {
                    var f = sc.stats.getMap("chests", e) || 0;
                    f > this.areas[e].chests && (f = this.areas[e].chests);
                    b = b + f;
                    c = c + (this.areas[e].chests || 0)
                } return a ? b / c : b
        },
        getTotalChests: function() {
            var a = 0,
                b;
            for (b in this.areas) this.isValidArea(b) && (a = a + (this.areas[b].chests || 0));
            return a
        },
        hasAllAreasFound: function() {
            for (var a in this.areas)
                if (this.isValidArea(a) && !this.areasVisited[a.toCamel()]) return false;
            return true
        },
        getTotalLandmarksFoundInArea: function(a) {
            if (a = this.activeLandmarks[a]) {
                var b = 0,
                    c;
                for (c in a) b++;
                return b || 0
            }
        },
        levelLoadStartOrder: 10,
        onLevelLoadStart: function(a) {
            this.currentMap = a.name.toKey("", "");
            var b = a.attributes && a.attributes.area || "fallback";
            this.updateVisitedArea(b);
            this._oobSoundTerrain = a.attributes && a.attributes.oobSound || "HOLE";
            a = false;
            this.currentPlayerArea && this.currentPlayerArea.path != b ? a = true : this.currentPlayerArea || (a = true);
            if (a) {
                this.currentPlayerArea = new sc.AreaLoadable(b);
                this.currentPlayerArea.addLoadListener(this);
                this.currentArea = this.currentPlayerArea
            } else {
                this.currentArea = this.currentPlayerArea;
                this.onLoadableComplete()
            }
        },
        levelLoadedOrder: 150,
        onLevelLoaded: function() {
            var a = ig.game.entities,
                b = a.length;
            Math.seedrandomSeed(ig.game.mapName);
            this._usedNames.length = 0;
            for (var c = sc.quickmodel.names, e = 0, f = sc.NPC_GENDER.BOTH; b--;) {
                var g = a[b];
                if (g && g instanceof ig.ENTITY.NPC && !g.displayName && !g.character.data.name) {
                    for (var f = sc.NPC_GENDER[g.character.data.gender] || sc.NPC_GENDER.BOTH,
                            h = Math.floor(Math.randomSeed() * c.length), e = 0; !this.canUseGenderName(f, sc.NPC_GENDER[c[h].gender]) || this._usedNames[h];) {
                        h = Math.floor(Math.randomSeed() * c.length);
                        e++;
                        if (e >= 3) break
                    }
                    this._usedNames[h] = true;
                    g.displayNameRandom = ig.LangLabel.getText(c[h].name)
                }
            }
            sc.Model.notifyObserver(sc.map, sc.MAP_EVENT.MAP_ENTERED)
        },
        canUseGenderName: function(a, b) {
            switch (b || 0) {
                case sc.NPC_GENDER.BOTH:
                    return a == sc.NPC_GENDER.MALE || a == sc.NPC_GENDER.FEMALE;
                case sc.NPC_GENDER.MALE:
                    return a == sc.NPC_GENDER.MALE;
                case sc.NPC_GENDER.FEMALE:
                    return a ==
                        sc.NPC_GENDER.FEMALE
            }
            return false
        },
        onReset: function() {
            this.areasVisited = {};
            this.activeLandmarks = {}
        },
        onVarAccess: function(a, b) {
            if (b[0] == "area") {
                var c = b[1];
                if (this.areas[c]) switch (b[2]) {
                    case "name":
                        return ig.LangLabel.getText(this.areas[c].name);
                    case "isCurrent":
                        return this.currentPlayerArea && this.currentPlayerArea.path == c;
                    case "isBoosted":
                        return this.getAreaItemToggleState(sc.AREA_ITEM_TYPE.BOOSTER, c);
                    case "chests":
                        return (this.areas[c].chests || 0) + "";
                    case "landmark":
                        switch (b[3]) {
                            case "name":
                                return ig.LangLabel.getText(this.areas[c].landmarks[b[4]].name);
                            case "active":
                                return this.activeLandmarks[b[1]][b[4]] ? true : false
                        }
                        break;
                    case "unlocked":
                        return this.areasVisited[c.toCamel()] ? true : false
                }
            }
            if (b[0] == "location") switch (b[1]) {
                case "current":
                    return this.currentPlayerArea && this.currentPlayerArea.path;
                case "isMapDungeon":
                    return this.isDungeon();
                case "isAreaDungon":
                    return this.isDungeon(true)
            }
            throw Error("Unsupported var access path: " + a);
        },
        initAreas: function() {
            this.areas = ig.database.get("areas")
        },
        loadArea: function(a, b) {
            if (a == this.currentPlayerArea.path) {
                this.currentArea =
                    this.currentPlayerArea;
                b.onLoadableComplete(true, this.currentArea)
            } else {
                this.currentArea = new sc.AreaLoadable(a);
                this.currentArea.addLoadListener(b)
            }
        },
        unloadCurrentArea: function() {
            if (this.currentArea.path != this.currentPlayerArea.path) {
                this.currentArea.decreaseRef();
                this.currentArea = null
            }
        },
        updateVisitedArea: function(a) {
            if (!this.areasVisited[a.toCamel()]) {
                this.areas[a].track && sc.stats.addMap("exploration", "areas", 1);
                this.areasVisited[a.toCamel()] = {}
            }
        },
        undoVisitedArea: function(a, b) {
            if (this.areasVisited[a.toCamel()]) {
                this.areas[a].track &&
                    sc.stats.subMap("exploration", "areas", 1);
                delete this.areasVisited[a.toCamel()]
            }
            if (b)
                for (var c = b.data.floors, e = c.length; e--;)
                    for (var f = c[e], g = f.maps.length; g--;) ig.vars.set("maps." + f.maps[g].path.toCamel().toPath("", ""), null)
        },
        validateCurrentPlayerFloor: function() {
            var a = this.currentPlayerArea.data;
            if (a) {
                var b = a.floors.length,
                    c = 0,
                    e = null,
                    f = null;
                this.currentPlayerFloor = this.currentFloor = 0;
                for (var g = false; b--;) {
                    e = a.floors[b];
                    for (c = e.maps.length; c--;) {
                        f = e.maps[c];
                        g = f.path == this.currentMap;
                        f.zMin && (g = g &
                            ig.game.playerEntity.coll.level >= f.zMin);
                        f.zMax && (g = g & ig.game.playerEntity.coll.level <= f.zMax);
                        if (g) {
                            this.currentFloor = this.currentPlayerFloor = e.level || 0;
                            return
                        }
                    }
                }
            }
        },
        validateCurrentFloor: function() {
            var a = this.currentArea.data,
                b = a.floors.length,
                c = 0,
                e = null,
                f = null;
            this.currentFloor = 0;
            for (var g = a.defaultFloor == void 0 ? void 0 : a.defaultFloor, h = false; b--;) {
                e = a.floors[b];
                for (c = e.maps.length; c--;) {
                    f = e.maps[c];
                    h = ig.vars.get("maps." + f.path.toCamel().toPath("", ""));
                    f.zMin && (h = h & ig.game.playerEntity.coll.level >=
                        f.zMin);
                    f.zMax && (h = h & ig.game.playerEntity.coll.level <= f.zMax);
                    if (h) {
                        if (g == void 0) {
                            this.currentFloor = e.level || 0;
                            return
                        }
                        if (g == e.level) {
                            this.currentFloor = g;
                            return
                        }
                    } else e.level == g && (g = void 0)
                }
            }
        },
        restore: function() {
            this.currentFloor = this.currentPlayerFloor;
            this.currentArea && this.currentPlayerArea && this.currentArea.path != this.currentPlayerArea.path && this.currentArea.decreaseRef();
            this.currentArea = this.currentPlayerArea
        },
        addLandmark: function(a, d, c) {
            if (!this.isLandmarkValid(a, d || this.currentPlayerArea.path)) throw Error("invalid Landmark: " +
                a + "! Maybe missing entry in database?");
            d = d || this.currentPlayerArea.path;
            this.activeLandmarks[d] || (this.activeLandmarks[d] = {});
            if (!this.activeLandmarks[d][a] || !this.activeLandmarks[d][a].active) {
                if (this.activeLandmarks[d][a]) this.activeLandmarks[d][a].active = true;
                else {
                    this.activeLandmarks[d][a] = {
                        active: true
                    };
                    sc.stats.addMap("exploration", "landmarks", 1);
                    sc.stats.addMap("exploration", d + "-landmarks", 1);
                    sc.stats.setMap("exploration", "landmarksTotalRate", this.getTotalLandmarksFound(true));
                    sc.menu.addLog({
                        type: "LANDMARK",
                        area: d,
                        landmark: a
                    })
                }
                b.landmark = a;
                b.area = d || this.currentPlayerArea.path;
                c && sc.options.get("update-landmark-style") != sc.UPDATE_LANDMARK_STYLE.NONE && ig.game.events.callEvent(this.getLandmarkEvent(c), ig.EventRunType.INTERRUPTABLE);
                sc.quests.onLandmarkEvent(d);
                sc.Model.notifyObserver(this, sc.MAP_EVENT.LANDMARK_ADDED, b)
            }
        },
        startTeleport: function(a) {
            this.teleportEvent = this.getTeleportEvent(a.path);
            sc.stats.addMap("player", "teleports", 1);
            sc.model.enterRunning();
            sc.Cutscene.startCutscene(this.teleportEvent)
        },
        getAreaType: function(a) {
            return sc.AREA_TYPE[this.areas[a].areaType]
        },
        isLandmarkValid: function(a, b) {
            var c = this.areas[b].landmarks;
            return c ? c[a] : false
        },
        getAreaItemId: function(a, b) {
            if (!b) {
                if (!this.currentPlayerArea) return -1;
                b = this.currentPlayerArea.path
            }
            var c = this.areas[b][a.areaField];
            return !c && c !== 0 ? -1 : c
        },
        getAreaItemType: function(a, b) {
            if (!b) {
                if (!this.currentPlayerArea) return null;
                b = this.currentPlayerArea.path
            }
            var c = this.areas[b],
                e;
            for (e in sc.AREA_ITEM_TYPE)
                if (a == c[sc.AREA_ITEM_TYPE[e].areaField]) return e
        },
        getAreaItemAmount: function(a, b) {
            var c = this.getAreaItemId(a, b);
            return c == -1 ? 0 : sc.model.player.getItemAmount(c)
        },
        getAreaItemToggleState: function(a, b) {
            var c = this.getAreaItemId(a, b);
            return c == -1 ? false : sc.model.player.getItemAmount(c) > 0 && sc.model.player.getToggleItemState(c)
        },
        isLandmarkActive: function(a, b, c) {
            if (b = b || this.currentPlayerArea && this.currentPlayerArea.path) {
                this.activeLandmarks[b] || (this.activeLandmarks[b] = {});
                return !this.activeLandmarks[b][a] ? false : c ? this.activeLandmarks[b][a].active || false :
                    this.activeLandmarks[b][a] || false
            }
        },
        setLandmarkActiveState: function(a, b, c) {
            (c = c || this.currentPlayerArea && this.currentPlayerArea.path) && this.activeLandmarks[c] && this.activeLandmarks[c][a] && (this.activeLandmarks[c][a].active = b || false)
        },
        setAreaLandmarksActiveState: function(a, b) {
            var c = this.activeLandmarks[a];
            if (c)
                for (var e in c) c[e].active = b
        },
        isDungeon: function(a) {
            if (!this.currentPlayerArea) return false;
            if (!a)
                if (a = this.getMapDungeon(this.currentMap)) return a == sc.MAP_DUNGEON_OVERRIDE.DUNGEON;
            a = this.areas[this.currentPlayerArea.path];
            return sc.AREA_TYPE[a && a.areaType] == sc.AREA_TYPE.DUNGEON
        },
        hasAnyAreaUnlocked: function() {
            for (var a in this.areas)
                if (this.areas[a] && this.areas[a].track && this.areasVisited[a.toCamel()]) return true;
            return false
        },
        getUnlockedAreas: function() {
            var a = [],
                b;
            for (b in this.areas) this.areas[b] && (this.areas[b].track && this.areasVisited[b.toCamel()]) && a.push(b);
            return a
        },
        sortAreaList: function(a) {
            if (a) {
                a.sort(function(a, b) {
                    return (this.areas[a].order || 0) - (this.areas[b].order || 0)
                }.bind(this));
                return a
            }
        },
        getLandmarkName: function(a,
            b) {
            var c = (b = this.areas[b]) && b.landmarks && b.landmarks[a] && b.landmarks[a].name;
            return c ? new ig.LangLabel(c) : "???"
        },
        getLandmark: function(a, b) {
            return this.areas[b].landmarks[a]
        },
        getCurrentAreaLandmark: function(a) {
            return this.areas[this.currentArea.path].landmarks[a]
        },
        getCurrentPlayerAreaName: function() {
            return new ig.LangLabel(this.areas[this.currentPlayerArea.path].name)
        },
        getCurrentAreaName: function() {
            return new ig.LangLabel(this.areas[this.currentArea.path].name)
        },
        getAreaOrder: function(a) {
            return this.areas[a] ?
                this.areas[a].order || 0 : 0
        },
        getAreaName: function(a, b, c) {
            if (!a) return "";
            if (a = this.areas[a]) {
                b = new ig.LangLabel(b ? a.shortName ? a.shortName : a.name : a.name);
                c && a.isDLC && (b = b + (" \\c[2][" + ig.lang.get("sc.gui.dlc.abr") + "]\\c[0]"));
                return b
            }
            return null
        },
        getCurrentMapName: function(a) {
            var b = this.getMapName(this.currentMap);
            return a && b == this.currentMap ? "???" : b
        },
        getMapName: function(a) {
            for (var b = this.currentArea.data.floors[this.getCurrentFloorIndex()].maps, c = b.length; c--;) {
                var e = b[c];
                if (e.path == a && e.name) return new ig.LangLabel(e.name)
            }
            return this.currentMap
        },
        getMapDungeon: function(a) {
            if (!this.currentArea || !this.currentArea.data) return null;
            var b = this.currentArea.data.floors[this.getCurrentFloorIndex()];
            if (!b) return null;
            for (var b = b.maps, c = b.length; c--;) {
                var e = b[c];
                if (e.path == a) return sc.MAP_DUNGEON_OVERRIDE[e.dungeon] || null
            }
            return null
        },
        getCurrentFloorIndex: function() {
            return this.currentFloor - this.currentArea.lowestFloor
        },
        getCurrentArea: function() {
            return this.currentArea ? this.currentArea.data : null
        },
        getLandmarkEvent: function(a) {
            return new ig.Event({
                steps: [{
                    type: "SET_CAMERA_BETWEEN",
                    entity1: a,
                    entity2: ig.game.playerEntity,
                    speed: "NORMAL",
                    wait: true,
                    transition: "EASE_OUT"
                }, {
                    type: "WAIT",
                    time: 1
                }, {
                    type: "RESET_CAMERA",
                    speed: "NORMAL",
                    transition: "EASE_IN_OUT"
                }]
            })
        },
        getTeleportEvent: function(a) {
            var b = ig.game.playerEntity,
                c = [];
            c.push({
                type: "DO_ACTION",
                entity: ig.game.playerEntity,
                action: [{
                    type: "SET_Z_GRAVITY_FACTOR",
                    value: 0
                }, {
                    type: "SET_Z_VEL",
                    value: 0
                }, {
                    type: "WAIT",
                    time: 5
                }]
            });
            c.push({
                time: 0.2,
                ignoreSlowDown: false,
                type: "WAIT"
            });
            c.push({
                type: "SET_TELEPORT_COLOR",
                lighter: true,
                color: "white"
            });
            c.push({
                color: "white",
                alpha: 1,
                time: 1,
                lighter: true,
                type: "SET_OVERLAY"
            });
            c.push({
                type: "SET_CAMERA_TARGET",
                entity: b,
                speed: "NORMAL",
                transition: "EASE_IN_OUT",
                zoom: 1.5
            });
            c.push({
                time: 0.2,
                ignoreSlowDown: false,
                type: "WAIT"
            });
            c.push({
                type: "SHOW_EFFECT",
                entity: b,
                effect: {
                    sheet: "teleport",
                    name: "hideMapTeleport"
                }
            });
            for (b = sc.party.getPartySize(); b--;) {
                var e = sc.party.getPartyMemberEntityByIndex(b);
                c.push({
                    type: "SHOW_EFFECT",
                    entity: e,
                    effect: {
                        sheet: "teleport",
                        name: "hideFast"
                    }
                })
            }
            c.push({
                time: 1,
                ignoreSlowDown: false,
                type: "WAIT"
            });
            c.push({
                type: "TELEPORT",
                map: a,
                marker: "landmark"
            });
            c.push({
                time: 3,
                ignoreSlowDown: false,
                type: "WAIT"
            });
            a = new ig.Event({
                steps: c
            });
            a.addHint("SKIN_ALLOWED");
            return a
        },
        getVisitedArea: function(a) {
            return this.areasVisited[a.toCamel()]
        },
        getTeleport: function() {
            return this.teleportEvent
        },
        getCurrentChestCount: function() {
            return this.areas[this.currentArea.path].chests || 0
        },
        getChestCount: function(a) {
            return this.areas[a].chests || 0
        },
        onStorageSave: function(a) {
            if (this.currentPlayerArea) {
                a.area = this.areas[this.currentPlayerArea.path].name;
                if (this.currentPlayerFloor != void 0)
                    for (var b = this.currentPlayerArea.data.floors, c = b.length; c--;) {
                        if (this.currentPlayerFloor == b[c].level) {
                            a.floor = b[c].name ? ig.LangLabel.getText(b[c].name) : "";
                            b = b[c].maps;
                            for (c = b.length; c--;)
                                if (b[c].path == this.currentMap && b[c].name) {
                                    a.specialMap = ig.LangLabel.getText(b[c].name);
                                    a.specialMap = b[c].name
                                } break
                        }
                    } else a.floor = "???"
            } else {
                a.area = "???";
                a.floor = ""
            }
            a.visitedAreas = ig.copy(this.areasVisited);
            a.landmarks = ig.copy(this.activeLandmarks)
        },
        onStoragePreLoad: function(a) {
            this.areasVisited =
                a.visitedAreas || {};
            a = a.landmarks || {};
            this.activeLandmarks = {};
            var b, c;
            for (c in a) {
                b = 0;
                for (var e in a[c]) {
                    this.activeLandmarks[c] || (this.activeLandmarks[c] = {});
                    var f = a[c][e];
                    if (!f || f.active === void 0) f = {
                        active: true
                    };
                    this.activeLandmarks[c][e] = f;
                    b++
                }
                sc.stats.setMap("exploration", c + "-landmarks", b)
            }
            sc.stats.setMap("exploration", "landmarksTotalRate", this.getTotalLandmarksFound(true));
            sc.stats.setMap("chests", "totalRate", sc.map.getTotalChestsFound(true))
        },
        onLoadableComplete: function() {
            this.validateCurrentPlayerFloor()
        }
    });
    sc.MAP_EVENT = {};
    sc.MAP_EVENT.LANDMARK_ADDED = 1;
    sc.MAP_EVENT.PLAYER_AREA_CHANGED = 2;
    sc.MAP_EVENT.MAP_ENTERED = 3;
    ig.addGameAddon(function() {
        return sc.map = new sc.MapModel
    })
});
ig.baked = !0;
