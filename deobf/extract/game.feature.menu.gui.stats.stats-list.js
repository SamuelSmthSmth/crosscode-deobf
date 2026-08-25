ig.module("game.feature.menu.gui.stats.stats-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.stats.stats-misc", "game.feature.menu.gui.stats.stats-gui-builds", "game.feature.menu.gui.stats.stats-types").defines(function() {
    var b = [];
    sc.StatsListBox = sc.TabbedPane.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        submitSound: null,
        bg: null,
        currentGui: null,
        tabState: [],
        _buttongroup: null,
        init: function(a) {
            this.parent(true);
            this.setSize(436, 258);
            this.setPanelSize(436, 242);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 218
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this._buttongroup = a;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.bg = new sc.MenuScanLines;
            this.bg.setPos(0, 29);
            this.bg.setSize(this.hook.size.x,
                228);
            this.addChildGui(this.bg);
            a = 0;
            this.addTab("general", a++, {
                type: sc.STATS_CATEGORY.GENERAL
            });
            this.addTab("combat", a++, {
                type: sc.STATS_CATEGORY.COMBAT
            });
            this.addTab("items", a++, {
                type: sc.STATS_CATEGORY.ITEMS
            });
            this.addTab("exploration", a++, {
                type: sc.STATS_CATEGORY.EXPLORATION
            });
            this.addTab("quests", a++, {
                type: sc.STATS_CATEGORY.QUESTS
            });
            ig.vars.get("arenaVars.statsUnlocked") && this.addTab("arena", a++, {
                type: sc.STATS_CATEGORY.ARENA
            });
            this.addTab("misc", a++, {
                type: sc.STATS_CATEGORY.MISC
            });
            this.addTab("log",
                a, {
                    type: sc.STATS_CATEGORY.LOG
                });
            this.doStateTransition("HIDDEN", true)
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
        switchTab: function(a) {
            var b = this.currentTabIndex,
                c = this.getCurrentTabButton();
            if (a >= 0) {
                c.setPressed(false);
                if (a == 1) {
                    b++;
                    b >= this.tabArray.length && (b = 0)
                } else {
                    b--;
                    b < 0 && (b = this.tabArray.length - 1)
                }
                this._prevPressed =
                    c = this.tabArray[b];
                c.setPressed(true);
                this.submitSound.play();
                this.setTab(b, false, {
                    skipSounds: true
                });
                this.resetButtons(c, true);
                this.rearrangeTabs()
            }
        },
        onTabPressed: function(a, b) {
            if (!b) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(a));
                for (var c = this.tabArray.length; c--;)
                    if (a == this.tabArray[c]) {
                        sc.menu.setSynoTab(c);
                        break
                    } sc.menu.setSynopInfo(null, true);
                return false
            }
        },
        onTabButtonCreation: function(a, b, c) {
            a = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.stats.tabs." + a), "stats-" + a, 105);
            a.textChild.setPos(7, 1);
            a.setPos(0, 2);
            a.setData({
                type: c.type
            });
            this.addChildGui(a);
            return a
        },
        onTabChanged: function(a) {
            sc.menu.setSynoTab(a)
        },
        onContentCreation: function() {
            var a = {
                gui: null
            };
            this.currentGui = new sc.StatsScrollPane;
            this.currentGui.setPos(0, 29);
            this.currentGui.setSize(this.hook.size.x, 228);
            this.currentGui.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.currentGui);
            this.currentGui.onCheckScrollable =
                function() {
                    return this._buttongroup.isActive()
                }.bind(this);
            var d = this.getCurrentTabButton().data.type,
                d = sc.STATS_BUILD[d],
                c = null,
                e = null,
                f = 431,
                g = new ig.VarCondition;
            b.length = 0;
            for (var h in d)
                if ((c = d[h]) && sc.STATS_ENTRY_TYPE[c.type] || c.type == "List") {
                    if (c.condition) {
                        g.setCondition(c.condition);
                        if (!g.evaluate()) continue
                    }
                    if (c.inset) {
                        if (b.indexOf(c.inset) != -1) throw Error(c.inset + " inset already exists. (Missing deset?)");
                        b.push(c.inset);
                        f = f - 24
                    } else if (c.deset) {
                        e = b.indexOf(c.deset);
                        if (e != -1) {
                            if (e != b.length -
                                1) throw Error(c.deset + " ist not top deset. (missing inset/deset?)");
                            b.pop();
                            f = f + 24
                        } else throw Error(c.deset + " dest does not exist. (missing inset?)");
                    }
                    if (c.type == "List") {
                        var e = c.list(),
                            i;
                        for (i in e)
                            if (e = c.getSettings(i)) {
                                e = new sc.STATS_ENTRY_TYPE[c.subtype](i, e, f);
                                e.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                                if (f < 431) {
                                    var j = new ig.ImageGui(this.gfx, 512, 207, 17, 16);
                                    j.setPos(-17, -1);
                                    e.addChildGui(j)
                                }
                                this.currentGui.addEntry(e, 5)
                            }
                    } else {
                        e = new sc.STATS_ENTRY_TYPE[c.type](h, c, f);
                        e.setAlign(ig.GUI_ALIGN.X_RIGHT,
                            ig.GUI_ALIGN.Y_TOP);
                        if (f < 431) {
                            j = new ig.ImageGui(this.gfx, 512, 207, 17, 16);
                            j.setPos(-17, -1);
                            e.addChildGui(j)
                        }
                        this.currentGui.addEntry(e, 5)
                    }
                } a.gui = this.currentGui;
            return a
        },
        onClearPrevContent: function() {
            this.currentGui && this.currentGui.doStateTransition("HIDDEN", true)
        },
        onSetCacheContent: function(a) {
            this.currentGui = a.gui;
            this.currentGui.doStateTransition("DEFAULT", true)
        },
        modelChanged: function() {}
    })
});
ig.baked = !0;
