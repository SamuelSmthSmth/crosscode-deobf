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
            if ((sc.model.isGame() ||
                    sc.model.isCutscene()) && (!sc.model.isPaused() && (sc.model.isRunning() || sc.model.isMenu())) && ig.game.firstUpdateLoop)
                if (this.statsEnabled) this.addMap("player", "playtime", ig.system.rawTick);
                else {
                    this.values.player || (this.values.player = {});
                    this.values.player.playtime || (this.values.player.playtime = 0);
                    this.values.player.playtime = this.values.player.playtime + ig.system.rawTick
                } if (this._deferredTimer > 0) {
                this._deferredTimer = this._deferredTimer - ig.system.actualTick;
                if (this._deferredTimer <= 0) {
                    this._deferredTimer =
                        0;
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
        onVarAccess: function(b, a) {
            if (a[0] == "stat") {
                if (a[1] && a[2]) {
                    for (var d = a[2], c = 3; a[c];) d = d + ("." + a[c++]);
                    return this.getMap(a[1], d)
                }
                if (a[1]) return this.get(a[1])
            }
            throw Error("Unsupported var access path: " +
                b);
        },
        set: function(b, a) {
            if (this.statsEnabled) {
                this.values[b] = a;
                this._notify(b)
            }
        },
        setMax: function(b, a) {
            if (this.statsEnabled) {
                this.values[b] = Math.max(this.values[b], a);
                this._notify(b)
            }
        },
        setMin: function(b, a) {
            if (this.statsEnabled) {
                this.values[b] = Math.min(this.values[b], a);
                this._notify(b)
            }
        },
        add: function(b, a) {
            if (this.statsEnabled) {
                this.values[b] = this.values[b] ? this.values[b] + a : a;
                this._notify(b)
            }
        },
        subtract: function(b, a) {
            if (this.statsEnabled) {
                this.values[b] = this.values[b] ? this.values[b] - a : a;
                this._notify(b)
            }
        },
        setMap: function(b, a, d) {
            if (this.statsEnabled) {
                this.values[b] || (this.values[b] = {});
                this.values[b][a] = d;
                this._notify(b, a)
            }
        },
        addMap: function(b, a, d) {
            if (this.statsEnabled) {
                this.values[b] || (this.values[b] = {});
                this.values[b][a] = this.values[b][a] ? this.values[b][a] + d : d;
                this._notify(b, a)
            }
        },
        subMap: function(b, a, d) {
            if (this.statsEnabled) {
                this.values[b] || (this.values[b] = {});
                this.values[b][a] = this.values[b][a] ? this.values[b][a] - d : d;
                this._notify(b, a)
            }
        },
        setMapMin: function(b, a, d) {
            if (this.statsEnabled) {
                this.values[b] ||
                    (this.values[b] = {});
                this.setMap(b, a, this.values[b][a] == void 0 ? d : Math.min(this.values[b][a], d))
            }
        },
        setMapMax: function(b, a, d) {
            if (this.statsEnabled) {
                this.values[b] || (this.values[b] = {});
                this.setMap(b, a, this.values[b][a] == void 0 ? d : Math.max(this.values[b][a], d));
                this._notify(b, a)
            }
        },
        get: function(b) {
            return this.values[b]
        },
        getMap: function(b, a) {
            this.values[b] || (this.values[b] = {});
            return this.values[b][a]
        },
        printValues: function() {
            for (var b in this.values)
                if (this.values[b] == {})
                    for (var a in b) console.log("  " + a +
                        ": " + this.values[b][a]);
                else console.log(b + ": " + this.values[b])
        },
        setActive: function(b) {
            this.statsEnabled = b || false
        },
        updateBoots: function(b) {
            var a = parseInt(localStorage.getItem("ccLocalStatBoots")) || 0;
            b && a++;
            localStorage.setItem("ccLocalStatBoots", a);
            this.values.gameBoots = a
        },
        onStorageSave: function(b) {
            b.playtime = this.getMap("player", "playtime");
            b.stats = ig.copy(this.values)
        },
        onStoragePreLoad: function(b) {
            this.values = b.stats || {};
            this.statsEnabled = true;
            this.updateBoots(false);
            sc.trophies && sc.trophies.updateAll()
        },
        _notify: function(b, a) {
            if (!this._checkDuplicates(b, a)) {
                this._deferredCallbacks.push({
                    key: b,
                    mapKey: a
                });
                if (this._deferredTimer <= 0) this._deferredTimer = 1
            }
        },
        _checkDuplicates: function(b, a) {
            for (var d = this._deferredCallbacks.length; d--;) {
                var c = this._deferredCallbacks[d];
                if (c.key == b && c.mapKey == a) return true
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
