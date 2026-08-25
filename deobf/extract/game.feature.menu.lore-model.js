ig.module("game.feature.menu.lore-model").requires("impact.base.game", "game.feature.model.base-model", "impact.feature.storage.storage").defines(function() {
    sc.LORE_CATERGORIES = {
        STORY: 0,
        CHARACTERS: 1,
        CROSS_LORE: 2,
        EARTH_LORE: 3
    };
    sc.LORE_SORT_TYPE = {
        ORDER: 0,
        NAME: 1,
        UNLOCKED: 2
    };
    sc.LORE_IMAGE_ALIGN = {
        LEFT: 0,
        CENTER: 1,
        RIGHT: 2
    };
    var b = {
        lore: null,
        entry: null,
        updated: false
    };
    sc.LoreModel = ig.GameAddon.extend({
        observers: [],
        lories: null,
        unlockedLories: {},
        loaded: false,
        init: function() {
            this.parent("LoreModel");
            ig.storage.register(this);
            window.wm && ig.database.register("lore", "LoreEnumEditor", "Lore");
            ig.vars.registerVarAccessor("lore", this, "VarLoreEditor");
            this.lories = ig.database.get("lore")
        },
        onReset: function() {
            this.unlockedLories = {};
            this.loaded = false
        },
        onVarAccess: function(a, b) {
            if (b[0] == "lore") switch (b[1]) {
                case "unlock":
                    var c = this._createUnlockText(b[2], b[3]);
                    b[3] ? this.unlockLoreEntry(b[2], b[3], true) : this.unlockLore(b[2], true);
                    return c;
                case "title":
                    return this.getLoreTitle(b[2]);
                case "unlocked":
                    return b[3] ? this.isLoreEntryUnlocked(b[2],
                        b[3]) : this.isLoreUnlocked(b[2])
            }
            throw Error("Unsupported var access path: " + a);
        },
        _createUnlockText: function(a, b) {
            return b ? !this.isLoreEntryUnlocked(a, b) ? "\\i[loreNew]" : "\\i[lore]" : !this.isLoreUnlocked(a) ? "\\i[loreNew]" : "\\i[lore]"
        },
        unlockLoreAll: function() {
            for (var a in this.lories) this.unlockLore(a, false, true)
        },
        unlockLore: function(a, d, c, e) {
            e = e == void 0 ? true : e;
            if (this.lories[a]) {
                if (!this.unlockedLories[a] || c) {
                    this.unlockedLories[a] = {};
                    b.entry = null;
                    b.lore = a;
                    b.updated = false;
                    var f = this.lories[a].content,
                        g;
                    for (g in f) {
                        this.unlockedLories[a][g] = true;
                        !c && e && sc.stats.addMap("exploration", "loreEntry", 1)
                    }!c && e && sc.menu.addNewUnlock(sc.MENU_SUBMENU.LORE, a);
                    !c && e && sc.stats.addMap("exploration", "lore", 1);
                    !c && e && sc.menu.addLog({
                        type: "LORE",
                        lore: a
                    });
                    sc.stats.setMap("exploration", "loreTotalRate", this.getTotalLoreFound(true));
                    d && sc.model.player.hasItem(135) && sc.Model.notifyObserver(this, sc.LORE_EVENT.UNLOCKED, b);
                    ig.game.varsChangedDeferred()
                }
            } else ig.warn("LOCK NOT FOUND: " + a)
        },
        unlockLoreEntry: function(a, d, c) {
            if (this.lories[a]) {
                var e =
                    this.lories[a].content;
                if (!this.unlockedLories[a] || !this.unlockedLories[a][d]) {
                    b.lore = a;
                    b.entry = d;
                    b.updated = false;
                    if (this.unlockedLories[a]) {
                        sc.menu.addLog({
                            type: "LORE",
                            lore: a,
                            update: true
                        });
                        b.updated = true
                    } else {
                        this.unlockedLories[a] = {};
                        sc.stats.addMap("exploration", "lore", 1);
                        sc.menu.addLog({
                            type: "LORE",
                            lore: a
                        });
                        b.updated = false
                    }
                    for (var f in e) {
                        if (!this.unlockedLories[a][f]) {
                            this.unlockedLories[a][f] = true;
                            sc.stats.addMap("exploration", "loreEntry", 1)
                        }
                        if (f == d) break
                    }
                    sc.menu.addNewUnlock(sc.MENU_SUBMENU.LORE,
                        a);
                    c && sc.model.player.hasItem(135) && sc.Model.notifyObserver(this, sc.LORE_EVENT.UNLOCKED, b);
                    ig.game.varsChangedDeferred()
                }
            } else throw Error("No such lore found: " + a);
        },
        notifyFirstActivated: function() {
            sc.Model.notifyObserver(this, sc.LORE_EVENT.ACIVATED)
        },
        getLore: function(a) {
            return this.lories[a]
        },
        getLoreTitle: function(a) {
            return ig.LangLabel.getText(this.lories[a].title)
        },
        getLoreEntry: function(a, b) {
            return this.lories[a] ? this.lories[a].content[b] : null
        },
        isLoreUnlocked: function(a) {
            if (!this.unlockedLories[a]) return false;
            var b = this.lories[a].content,
                c;
            for (c in b)
                if (!this.unlockedLories[a][c]) return false;
            return true
        },
        hasAtLeastOneUnlocked: function(a) {
            if (!this.unlockedLories[a]) return false;
            var b = this.lories[a].content,
                c;
            for (c in b)
                if (this.unlockedLories[a][c]) return true;
            return false
        },
        isLoreAvailable: function(a) {
            return this.unlockedLories[a] ? true : false
        },
        isLoreEntryUnlocked: function(a, b) {
            return this.unlockedLories[a] && this.unlockedLories[a][b]
        },
        getCategoryList: function(a, b) {
            var c = [],
                e = null,
                f;
            for (f in this.lories) {
                e =
                    this.lories[f];
                sc.LORE_CATERGORIES[e.category] == a && c.push(f)
            }
            b != void 0 && this.sortLoreList(c, b);
            return c
        },
        sortLoreList: function(a, b) {
            switch (b) {
                case sc.LORE_SORT_TYPE.ORDER:
                    a.sort(function(a, b) {
                        return (this.lories[a].order || 0) - (this.lories[b].order || 0)
                    }.bind(this));
                    break;
                case sc.LORE_SORT_TYPE.NAME:
                    a.sort(function(a, b) {
                        var d = ig.LangLabel.getText(this.lories[a].title),
                            g = ig.LangLabel.getText(this.lories[b].title);
                        return d.localeCompare(g)
                    }.bind(this));
                    break;
                case sc.LORE_SORT_TYPE.UNLOCKED:
                    a.sort(function(a,
                        b) {
                        var d = this.isLoreAvailable(a),
                            g = this.isLoreAvailable(b);
                        return d == g ? (this.lories[a].order || 0) - (this.lories[b].order || 0) : d === g ? 0 : d ? -1 : 1
                    }.bind(this))
            }
        },
        getCompletionPercent: function(a) {
            if (!this.unlockedLories[a]) return 0;
            var b = this.lories[a].content,
                c = 0,
                e = 0,
                f;
            for (f in b) {
                this.unlockedLories[a][f] && e++;
                c++
            }
            return !c && !e ? 100 : c ? e / c : 0
        },
        getTotalLoreFound: function(a, b) {
            var c = 0,
                e = 0,
                f;
            for (f in this.lories)
                if (!this.lories[f].noTrack && !this.lories[f].extension)
                    if (b) {
                        if (b == this.lories[f].category) {
                            this.hasAtLeastOneUnlocked(f) &&
                                c++;
                            e++
                        }
                    } else {
                        this.hasAtLeastOneUnlocked(f) && c++;
                        e++
                    } return a ? c / e : c
        },
        getTotalLoreEntriesFound: function(a, b) {
            return this.getTotalLoreFound(a, b)
        },
        onStorageSave: function(a) {
            a.lories = ig.copy(this.unlockedLories)
        },
        onStoragePreLoad: function(a) {
            this.unlockedLories = a.lories || {};
            for (var b in this.unlockedLories) this.lories[b] || delete this.unlockedLories[b];
            sc.stats.setMap("exploration", "loreTotalRate", this.getTotalLoreFound(true));
            this.loaded = true
        }
    });
    sc.LORE_EVENT = {};
    sc.LORE_EVENT.UNLOCKED = 0;
    sc.LORE_EVENT.ACIVATED =
        1;
    ig.addGameAddon(function() {
        return sc.lore = new sc.LoreModel
    })
});
ig.baked = !0;
