ig.module("game.feature.menu.gui.lore.lore-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.lore.lore-misc").defines(function() {
    var b = [];
    ig.perf.fullLoreList = false;
    sc.LoreListBoxNew = sc.ListTabbedPane.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        submitSound: null,
        favSound: null,
        errorSound: null,
        completion: null,
        newList: [],
        init: function() {
            this.parent(true);
            this.setSize(264, 262);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(264, 262);
            this.setPanelSize(264, 243);
            this.favSound = this.submitSound = sc.BUTTON_SOUND.submit;
            this.errorSound = sc.BUTTON_SOUND.denied;
            this.completion = new sc.TextGui(ig.lang.get("sc.gui.menu.lore.completion"), {
                font: sc.fontsystem.tinyFont
            });
            this.completion.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 4
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE
                }
            };
            this.completion.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.completion.setPos(4, -8);
            this.bg.addChildGui(this.completion);
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
            this.addTab("story", 0, {
                type: sc.LORE_CATERGORIES.STORY
            });
            this.addTab("people", 1, {
                type: sc.LORE_CATERGORIES.CHARACTERS
            });
            this.addTab("cross-lore",
                2, {
                    type: sc.LORE_CATERGORIES.CROSS_LORE
                });
            this.addTab("earth-lore", 3, {
                type: sc.LORE_CATERGORIES.EARTH_LORE
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
            this.canShowCompletion(this.currentTabIndex) ? this.completion.doStateTransition("DEFAULT", true) : this.completion.doStateTransition("HIDDEN", true);
            for (var a in this.tabs) this.tabs[a].newUnlock.deactivate(false);
            a = sc.menu.newUnlocks[sc.MENU_SUBMENU.LORE];
            for (var b = a.length; b--;) {
                var c = sc.lore.getLore(a[b]);
                if (c)(c = this.tabs[this.keys[sc.LORE_CATERGORIES[c.category]]]) && c.newUnlock.activate()
            }
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.parent();
            for (var a = this.newList.length; a--;) {
                this.newList[a].clearOverlay();
                sc.menu.clearNewUnlock(sc.MENU_SUBMENU.LORE, this.newList[a].key)
            }
            this.newList.length = 0;
            this.doStateTransition("HIDDEN")
        },
        getCurrentSortText: function() {
            var a =
                null,
                a = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.LORE_SORT_TYPE.ORDER : sc.LORE_SORT_TYPE.ORDER,
                b = "auto";
            switch (a) {
                case sc.LORE_SORT_TYPE.ORDER:
                    b = "auto";
                    break;
                case sc.LORE_SORT_TYPE.NAME:
                    b = "name";
                    break;
                case sc.LORE_SORT_TYPE.UNLOCKED:
                    b = "unlocked"
            }
            return ig.lang.get("sc.gui.menu.sort." + b)
        },
        onListEntryPressed: function(a) {
            sc.menu.setSynopFocus(a)
        },
        onLeftRightPress: function(a, b, c) {
            this.submitSound.play();
            sc.menu.switchSynopsisPage(c == 1 ? 1 : -1);
            return {
                skipSounds: true
            }
        },
        onTabChanged: function(a) {
            sc.menu.setSynoTab(a);
            (ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },
        onTabButtonCreation: function(a, b, c) {
            a = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.lore.tabs." + a), "lore-" + a, 115);
            a.onPressedChange = function(a) {
                a ? this.newUnlock.setPos(4, 4) : this.newUnlock.setPos(2, 2)
            };
            b = new sc.NewUnlockOverlay;
            b.deactivate(false);
            b.setPos(2, 2);
            a.addChildGui(b);
            a.newUnlock = b;
            a.textChild.setPos(7, 1);
            a.setPos(0, 2);
            a.setData({
                type: c.type
            });
            this.addChildGui(a);
            return a
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
        onTabSelected: function() {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
        },
        onTabMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true)
        },
        onCreateListEntries: function(a, d, c, e) {
            var f = null,
                g = f = null,
                h = null,
                g = null,
                i = sc.lore.getCategoryList(c,
                    e);
            a.clear();
            d.clear();
            for (var d = "\\i[lore-" + this.getCurrentTabKey() + "]", j = b.length = 0; j < i.length; j++) {
                h = i[j];
                g = sc.lore.getLore(h);
                if (ig.perf.fullLoreList || sc.lore.isLoreAvailable(h)) {
                    if (!g.extension || ig.extensions.hasExtension(g.extension)) {
                        f = d + ig.LangLabel.getText(g.title);
                        if (g.parent) {
                            f = new sc.LoreEntryButton(f, h, c, true, true);
                            g = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
                            g.setPos(-16, 1);
                            f.addChildGui(g);
                            e == sc.LORE_SORT_TYPE.ORDER ? a.addButton(f, null, 22) : b.push(h)
                        } else {
                            f = new sc.LoreEntryButton(f, h, c,
                                true);
                            a.addButton(f)
                        }
                    }
                } else if ((!g.extension || ig.extensions.hasExtension(g.extension)) && this.showLockedEntries(c))
                    if (g.parent && sc.lore.isLoreAvailable(g.parent)) {
                        f = d + "??????????????????";
                        f = new sc.LoreEntryButton(f, h, c, null, true);
                        g = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
                        g.setPos(-16, 1);
                        f.addChildGui(g);
                        f.setActive(false);
                        a.addButton(f, null, 22)
                    } else {
                        f = d + "??????????????????";
                        f = new sc.LoreEntryButton(f, h, c);
                        f.setActive(false);
                        a.addButton(f)
                    }
            }
            if (b.length >= 1) {
                j = b.length;
                for (e = a.getChildren().length; j--;) {
                    g =
                        sc.lore.getLore(b[j]);
                    h = this.findParentIndex(g.parent, a.getChildren());
                    if (h >= 0) {
                        f = d + ig.LangLabel.getText(g.title);
                        f = new sc.LoreEntryButton(f, b[j], c, true, true);
                        g = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
                        g.setPos(-16, 1);
                        f.addChildGui(g);
                        h == e - 1 ? a.addButton(f, null, 22) : a.insertButton(f, h + 1, null, null, null, true);
                        f.hook.pos.x = 22
                    }
                }
            }
        },
        findParentIndex: function(a, b) {
            for (var c = b.length; c--;)
                if (b[c].gui.key == a) return c;
            return -1
        },
        onListEntrySelected: function(a) {
            if (a.key) {
                sc.menu.setSynopInfo(a.key);
                a.overlay && this.newList.push(a);
                sc.menu.setInfoText(null)
            } else {
                sc.menu.setSynopInfo(a.key);
                a.data && (a.data instanceof Object || sc.menu.setInfoText(a.data))
            }
        },
        onListMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },
        showLockedEntries: function(a) {
            return a != sc.LORE_CATERGORIES.STORY
        },
        modelChanged: function(a, b, c) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.SORT_LIST) {
                    this.sort(c.data.sortType);
                    sc.menu.setSynopInfo(null, true);
                    sc.menu.setInfoText(null, true)
                } else b == sc.MENU_EVENT.SYNO_CHANGED_TAB && (this.canShowCompletion(this.currentTabIndex) ?
                    this.completion.doStateTransition("DEFAULT") : this.completion.doStateTransition("HIDDEN"))
        },
        canShowCompletion: function(a) {
            switch (a) {
                case 0:
                    return false;
                case 1:
                    return true;
                case 2:
                    return true;
                case 3:
                    return true;
                case 4:
                    return true;
                case 5:
                    return true
            }
        }
    })
});
ig.baked = !0;
