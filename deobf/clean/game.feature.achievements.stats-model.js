/**
 * @module game.feature.achievements.stats-model
 *
 * Central statistics tracking system. Records per-player stats
 * (playtime, kills, items, etc.) and trophies across the game.
 * Stats are stored in key→value maps and can be queried via the
 * ig.vars system. Notifies observers with deferred stat change
 * events to batch UI updates. Tracks game boot count in localStorage.
 */
ig.module("game.feature.achievements.stats-model").requires("impact.base.game", "impact.feature.storage.storage").defines(function() {
    sc.StatsModel = ig.GameAddon.extend({
        observers: [],
        values: {},
        _deferredCallbacks: [],
        _deferredTimer: 0,
        statsEnabled: false,
        init: function() {
            this.parent("Stats");
            if (window.IG_GAME_DEBUG) this.statsEnabled = true;
            ig.storage.register(this);
            ig.vars.registerVarAccessor("stat", this, "VarStatEditor");
            this.updateBoots(true)
        },
        postUpdateOrder: -100,
        onPostUpdate: function() {
            if ((sc.model.isGame() || sc.model.isCutscene()) && (!sc.model.isPaused() && (sc.model.isRunning() || sc.model.isMenu())) && ig.game.firstUpdateLoop)
                if (this.statsEnabled) this.addMap("player", "playtime", ig.system.rawTick);
                else {
                    this.values.player || (this.values.player = {});
                    this.values.player.playtime || (this.values.player.playtime = 0);
                    this.values.player.playtime = this.values.player.playtime + ig.system.rawTick
                } if (this._deferredTimer > 0) {
                this._deferredTimer = this._deferredTimer - ig.system.actualTick;
                if (this._deferredTimer <= 0) {
                    this._deferredTimer = 0;
                    window.IG_GAME_DEBUG && sc.Debug && sc.Debug.addStats(this._deferredCallbacks);
                    sc.Model.notifyObserver(this, sc.STATS_EVENT.DEFERRED_STAT_CHANGED, this._deferredCallbacks);
                    this._deferredCallbacks.length = 0
                }
            }
        },
        onReset: function() {
            this.values = {};
            this._deferredTimer = this._deferredCallbacks.length = 0;
            this.updateBoots(false)
        },
        onVarAccess: function(path, args) {
            if (args[0] == "stat") {
                if (args[1] && args[2]) {
                    var mapKey = args[2];
                    for (var idx = 3; args[idx];) mapKey = mapKey + ("." + args[idx++]);
                    return this.getMap(args[1], mapKey)
                }
                if (args[1]) return this.get(args[1])
            }
            throw Error("Unsupported var access path: " + path);
        },
        set: function(key, value) {
            if (this.statsEnabled) {
                this.values[key] = value;
                this._notify(key)
            }
        },
        setMax: function(key, value) {
            if (this.statsEnabled) {
                this.values[key] = Math.max(this.values[key], value);
                this._notify(key)
            }
        },
        setMin: function(key, value) {
            if (this.statsEnabled) {
                this.values[key] = Math.min(this.values[key], value);
                this._notify(key)
            }
        },
        add: function(key, value) {
            if (this.statsEnabled) {
                this.values[key] = this.values[key] ? this.values[key] + value : value;
                this._notify(key)
            }
        },
        subtract: function(key, value) {
            if (this.statsEnabled) {
                this.values[key] = this.values[key] ? this.values[key] - value : value;
                this._notify(key)
            }
        },
        setMap: function(key, mapKey, value) {
            if (this.statsEnabled) {
                this.values[key] || (this.values[key] = {});
                this.values[key][mapKey] = value;
                this._notify(key, mapKey)
            }
        },
        addMap: function(key, mapKey, value) {
            if (this.statsEnabled) {
                this.values[key] || (this.values[key] = {});
                this.values[key][mapKey] = this.values[key][mapKey] ? this.values[key][mapKey] + value : value;
                this._notify(key, mapKey)
            }
        },
        subMap: function(key, mapKey, value) {
            if (this.statsEnabled) {
                this.values[key] || (this.values[key] = {});
                this.values[key][mapKey] = this.values[key][mapKey] ? this.values[key][mapKey] - value : value;
                this._notify(key, mapKey)
            }
        },
        setMapMin: function(key, mapKey, value) {
            if (this.statsEnabled) {
                this.values[key] || (this.values[key] = {});
                this.setMap(key, mapKey, this.values[key][mapKey] == void 0 ? value : Math.min(this.values[key][mapKey], value))
            }
        },
        setMapMax: function(key, mapKey, value) {
            if (this.statsEnabled) {
                this.values[key] || (this.values[key] = {});
                this.setMap(key, mapKey, this.values[key][mapKey] == void 0 ? value : Math.max(this.values[key][mapKey], value));
                this._notify(key, mapKey)
            }
        },
        get: function(key) {
            return this.values[key]
        },
        getMap: function(key, mapKey) {
            this.values[key] || (this.values[key] = {});
            return this.values[key][mapKey]
        },
        printValues: function() {
            for (var key in this.values)
                if (this.values[key] == {})
                    for (var innerKey in key) console.log("  " + innerKey + ": " + this.values[key][innerKey]);
                else console.log(key + ": " + this.values[key])
        },
        setActive: function(active) {
            this.statsEnabled = active || false
        },
        updateBoots: function(isNewBoot) {
            var bootCount = parseInt(localStorage.getItem("ccLocalStatBoots")) || 0;
            isNewBoot && bootCount++;
            localStorage.setItem("ccLocalStatBoots", bootCount);
            this.values.gameBoots = bootCount
        },
        onStorageSave: function(storageData) {
            storageData.playtime = this.getMap("player", "playtime");
            storageData.stats = ig.copy(this.values)
        },
        onStoragePreLoad: function(storageData) {
            this.values = storageData.stats || {};
            this.statsEnabled = true;
            this.updateBoots(false);
            sc.trophies && sc.trophies.updateAll()
        },
        _notify: function(key, mapKey) {
            if (!this._checkDuplicates(key, mapKey)) {
                this._deferredCallbacks.push({
                    key: key,
                    mapKey: mapKey
                });
                if (this._deferredTimer <= 0) this._deferredTimer = 1
            }
        },
        _checkDuplicates: function(key, mapKey) {
            for (var idx = this._deferredCallbacks.length; idx--;) {
                var cb = this._deferredCallbacks[idx];
                if (cb.key == key && cb.mapKey == mapKey) return true
            }
            return false
        }
    });
    sc.STATS_EVENT = {};
    sc.STATS_EVENT.STAT_CHANGED = 0;
    sc.STATS_EVENT.DEFERRED_STAT_CHANGED = 1;
    ig.addGameAddon(function() {
        return sc.stats = new sc.StatsModel
    })
});
ig.baked = !0;