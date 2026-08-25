ig.module("game.feature.menu.gui.enemies.enemy-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box").defines(function() {
    ig.perf.fullEnemyFibula = false;
    sc.EnemyListBox = sc.ListTabbedPane.extend({
        submitSound: null,
        favSound: null,
        errorSound: null,
        enemies: null,
        init: function() {
            this.parent(true);
            this.setSize(264, 262);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(264, 262);
            this.setPanelSize(264, 243);
            this.favSound = this.submitSound = sc.BUTTON_SOUND.submit;
            this.errorSound = sc.BUTTON_SOUND.denied;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -132
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_EASE: {
                    state: {
                        alpha: 0,
                        offsetX: -132
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                }
            };
            this.enemies = ig.database.get("enemies");
            var b = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(7, -8);
            this.bg.addChildGui(b);
            this.addTab("animals", 0, {
                type: sc.ENEMY_CATEGORY.ANIMALS
            });
            this.addTab("mecha", 1, {
                type: sc.ENEMY_CATEGORY.MECHA
            });
            this.addTab("avatars", 2, {
                type: sc.ENEMY_CATEGORY.PLAYERS
            });
            this.addTab("abstract", 3, {
                type: sc.ENEMY_CATEGORY.ABSTRACT
            });
            this.addTab("boss", 4, {
                type: sc.ENEMY_CATEGORY.BOSS
            })
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        show: function() {
            this.parent();
            this.setTab(this.currentTabIndex || 0, true, {
                skipSounds: true
            });
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.parent();
            this.doStateTransition("HIDDEN")
        },
        getCurrentSortText: function() {
            var b = null,
                b = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.COMBAT_ENEMY_SORT_TYPE.ORDER : sc.COMBAT_ENEMY_SORT_TYPE.ORDER,
                a = "auto";
            switch (b) {
                case sc.COMBAT_ENEMY_SORT_TYPE.ORDER:
                    a = "auto";
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.NAME:
                    a = "name";
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.LEVEL:
                    a = "enemyLevel";
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.AREA:
                    a = "area"
            }
            return ig.lang.get("sc.gui.menu.sort." + a)
        },
        onLeftRightPress: function(b, a, d) {
            this.submitSound.play();
            sc.menu.switchSynopsisPage(d == 1 ? 1 : -1);
            return {
                skipSounds: true
            }
        },
        onTabChanged: function(b) {
            sc.menu.setSynoTab(b);
            (ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },
        onTabButtonCreation: function(b, a, d) {
            b = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.enemy.tabs." +
                b), "enemy-" + b, 105);
            b.textChild.setPos(7, 1);
            b.setPos(0, 2);
            b.setData({
                type: d.type
            });
            this.addChildGui(b);
            return b
        },
        onTabPressed: function(b, a) {
            if (!a) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(b));
                for (var d = this.tabArray.length; d--;)
                    if (b == this.tabArray[d]) {
                        sc.menu.setSynoTab(d);
                        break
                    } sc.menu.setSynopInfo(null, true);
                return false
            }
        },
        onTabSelected: function() {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
        },
        onTabMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true)
        },
        onCreateListEntries: function(b,
            a, d, c) {
            var e = null,
                f = null,
                g = e = null,
                h = null,
                c = this.getEnemyList(d, c);
            b.clear();
            a.clear();
            for (a = 0; a < c.length; a++) {
                e = c[a];
                g = this.enemies[e];
                if ((ig.perf.fullEnemyFibula || sc.stats.getMap("combat", "kill" + e)) && g.track && (!g.extension || ig.extensions.hasExtension(g.extension))) {
                    var f = sc.map.getAreaItemToggleState(sc.AREA_ITEM_TYPE.BOOSTER, g.area),
                        h = d == sc.ENEMY_CATEGORY.BOSS ? "\\i[enemy-" + this.getEnemyCategoryKey(g.category) + "-boss]" : "\\i[enemy-" + this.getCurrentTabKey() + (g.boss ? "-boss" : "") + "]",
                        i = f && sc.combat.canShowBoostedEntry(e,
                            g.boss) ? g.boostedLevel || sc.MIN_BOOSTER_LEVEL : g.level,
                        f = "",
                        f = f + (h + ig.LangLabel.getText(g.name)),
                        e = new sc.EnemyEntryButton(f, e, i || 1);
                    b.addButton(e)
                }
            }
        },
        onListEntrySelected: function(b) {
            if (b.key) {
                sc.menu.setSynopInfo(b.key);
                sc.menu.setInfoText(null, true)
            } else {
                sc.menu.setSynopInfo(b.key);
                b.data && (b.data instanceof Object || sc.menu.setInfoText(b.data))
            }
        },
        onListMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },
        getEnemyList: function(b, a) {
            var d = [],
                c = this.enemies,
                e;
            for (e in c) {
                var f =
                    c[e];
                b == sc.ENEMY_CATEGORY.BOSS ? f.boss && d.push(e) : sc.ENEMY_CATEGORY[f.category || "ABSTRACT"] == b && d.push(e)
            }
            a != void 0 && this.sortLoreList(d, a);
            return d
        },
        sortLoreList: function(b, a) {
            switch (a) {
                case sc.COMBAT_ENEMY_SORT_TYPE.ORDER:
                    b.sort(function(a, b) {
                        a = this.enemies[a].order;
                        b = this.enemies[b].order;
                        return a - b
                    }.bind(this));
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.NAME:
                    b.sort(function(a, b) {
                        var e = ig.LangLabel.getText(this.enemies[a].name),
                            f = ig.LangLabel.getText(this.enemies[b].name);
                        return e.localeCompare(f)
                    }.bind(this));
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.LEVEL:
                    b.sort(function(a, b) {
                        var e = this.enemies[a],
                            f = this.enemies[b];
                        return (e.level || 1) == (f.level || 1) ? e.order - f.order : (e.level || 1) - (f.level || 1)
                    }.bind(this));
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.AREA:
                    b.sort(function(a, b) {
                        var e = this.enemies[a],
                            f = this.enemies[b];
                        return e.area == f.area ? e.order - f.order : sc.map.getAreaName(e.area).toString().localeCompare(sc.map.getAreaName(f.area).toString())
                    }.bind(this))
            }
        },
        getEnemyCategoryKey: function(b) {
            switch (sc.ENEMY_CATEGORY[b]) {
                case sc.ENEMY_CATEGORY.ANIMALS:
                    return "animals";
                case sc.ENEMY_CATEGORY.MECHA:
                    return "mecha";
                case sc.ENEMY_CATEGORY.PLAYERS:
                    return "avatars";
                case sc.ENEMY_CATEGORY.ABSTRACT:
                    return "abstract"
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu && a == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                this.sort(d.data.sortType)
            }
        }
    })
});
ig.baked = !0;
