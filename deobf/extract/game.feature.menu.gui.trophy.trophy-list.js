ig.module("game.feature.menu.gui.trophy.trophy-list").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.trophy.trophy-misc").defines(function() {
    sc.TrophyList = sc.ListTabbedPane.extend({
        submitSound: null,
        containerHeightOffset: -26,
        listPosOffset: -6,
        listHeightOffset: 6,
        listPageSize: 25,
        sections: [],
        sectionCache: {},
        showStats: false,
        showProgress: false,
        newList: [],
        init: function() {
            this.parent(true);
            this.setSize(436,
                258);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(436, 258);
            this.setPanelSize(436, 216);
            this.submitSound = sc.BUTTON_SOUND.submit;
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
                },
                HIDDEN_EASE: {
                    state: {
                        alpha: 0,
                        offsetX: 218
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                }
            };
            this.addTab("GENERAL", 0, {
                type: sc.TROPHY_TYPES.GENERAL
            });
            this.addTab("COMBAT", 1, {
                type: sc.TROPHY_TYPES.COMBAT
            });
            this.addTab("EXPLORATION", 2, {
                type: sc.TROPHY_TYPES.EXPLORATION
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
            this.sections[this.currentTabIndex || 0].activate();
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.sections[this.currentTabIndex || 0].deactivate();
            this.parent();
            for (var b = this.newList.length; b--;) {
                this.newList[b].clearOverlay();
                sc.menu.clearNewUnlock(sc.MENU_SUBMENU.TROPHY, this.newList[b].key)
            }
            this.newList.length = 0;
            this.doStateTransition("HIDDEN")
        },
        toggleProgress: function() {
            this.showProgress = !this.showProgress;
            if (this.currentList)
                for (var b = this.currentList.getChildren(), a = b.length; a--;) b[a].gui.toggleProgress && b[a].gui.toggleProgress(this.showProgress)
        },
        onButtonTraversal: function() {
            this.parent();
            var b = -1;
            sc.control.menuListDown() ? b = 1 : sc.control.menuListUp() && (b = 0);
            b >= 0 && this.switchSection(b)
        },
        getCurrentSortText: function() {
            var b =
                null,
                b = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.TROPHY_SORT_TYPES.ORDER : sc.TROPHY_SORT_TYPES.ORDER,
                a = "auto";
            switch (b) {
                case sc.TROPHY_SORT_TYPES.ORDER:
                    a = "auto";
                    break;
                case sc.TROPHY_SORT_TYPES.UNLOCKED:
                    a = "featLock";
                    break;
                case sc.TROPHY_SORT_TYPES.NAME:
                    a = "featName";
                    break;
                case sc.TROPHY_SORT_TYPES.POINTS:
                    a = "featPoints"
            }
            return ig.lang.get("sc.gui.menu.sort." + a)
        },
        onLeftRightPress: function() {
            return {
                skipSounds: true
            }
        },
        onTabChanged: function(b, a) {
            this.submitSound.play();
            a >= 0 && this.sections[a].deactivate();
            b >= 0 && this.sections[b].activate();
            if (this.currentList)
                for (var d = this.currentList.getChildren(), c = d.length; c--;) d[c].gui.toggleProgress && d[c].gui.toggleProgress(this.showProgress)
        },
        onTabButtonCreation: function(b, a, d) {
            var c = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.trophies.tabs." + b), "trophies-" + b, 105);
            c.textChild.setPos(7, 1);
            c.setPos(0, 2);
            c.setData({
                type: d.type
            });
            this.addChildGui(c);
            b = new sc.TrophySectionList(b, a, this.onSectionPress.bind(this));
            this.sections[a] =
                b;
            this.addChildGui(b);
            return c
        },
        onTabPressed: function(b, a) {
            if (!a) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(b));
                for (var d = this.tabArray.length; d--;)
                    if (b == this.tabArray[d]) {
                        sc.menu.setSynoTab(d);
                        break
                    } return false
            }
        },
        onTabSelected: function() {
            sc.menu.setInfoText("", true)
        },
        onTabMouseFocusLost: function() {
            sc.menu.setInfoText("", true)
        },
        onSectionPress: function(b, a, d) {
            this.sections[this.currentTabIndex].setActiveButton(d.data.index, true);
            this.onCreateListEntries(this.currentList, this.currentGroup,
                d.data.category, this.tabContent[this.currentTabIndex].sort)
        },
        switchSection: function(b) {
            this.submitSound.play();
            var a = this.sections[this.currentTabIndex],
                d = a.buttons,
                c = a.currentButton;
            if (b == 1) {
                c++;
                c >= d.length && (c = 0)
            } else {
                c--;
                c < 0 && (c = d.length - 1)
            }
            b = d[c];
            a.setActiveButton(c);
            this.onCreateListEntries(this.currentList, this.currentGroup, b.data.category, this.tabContent[this.currentTabIndex].sort)
        },
        onCreateListEntries: function(b, a, d, c) {
            var e = null,
                e = null,
                f = this.sections[this.currentTabIndex].getCurrentSection(),
                g = this.sections[this.currentTabIndex].getPreviousSection();
            if (!b.overview) {
                b.overview = new sc.TrophyTabOverview;
                b.addChildGui(b.overview)
            }
            this.sectionCache[d] || (this.sectionCache[d] = {});
            var h = this.sectionCache[d][g];
            if (!h) {
                h = {
                    y: 0,
                    scroll: 0,
                    sort: c
                };
                this.sectionCache[d][g] = h
            }
            if (h.sort = !c) {
                h.y = 0;
                h.scroll = 0;
                h.sort = c
            } else {
                h.y = a.current.y;
                h.scroll = b.getScrollY()
            }
            b.setSize(300, 203);
            b.clear();
            b.scrollToY(0, true);
            a.clear();
            g = this.collectTrophies(d, f, c);
            for (h = 0; h < g.length; h++) {
                e = g[h];
                e = new sc.TrophyListEntry(e,
                    d, f, this.showProgress);
                b.addButton(e)
            }
            h = this.sectionCache[d][f];
            if (!h) {
                h = {
                    y: 0,
                    scroll: 0,
                    sort: c
                };
                this.sectionCache[d][f] = h
            }
            ig.input.mouseGuiActive ? a.setCurrentFocus(0, h.y) : a.focusCurrentButton(0, h.y, false, true);
            b.scrollToY(h.scroll, true);
            b.overview && b.overview.updateNumbers(d, f);
            b.overview.doStateTransition(this.showStats ? "DEFAULT" : "HIDDEN", true)
        },
        onListEntrySelected: function(b) {
            b.key && b.overlay && this.newList.indexOf(b) == -1 && this.newList.push(b);
            b.data && (b.data instanceof Object || sc.menu.setInfoText(b.data))
        },
        onListMouseFocusLost: function() {
            sc.menu.setInfoText(null, true)
        },
        collectTrophies: function(b, a, d) {
            var c = [],
                e = sc.trophies.trophies,
                f;
            for (f in e) {
                var g = e[f];
                g.track && g.category == b && g.section == a && c.push(f)
            }
            this.sortList(c, d);
            return c
        },
        sortList: function(b, a) {
            switch (a) {
                case sc.TROPHY_SORT_TYPES.ORDER:
                    b.sort(function(a, b) {
                        var e = sc.trophies.getTrophy(a),
                            f = sc.trophies.getTrophy(b);
                        return (e.order || 0) - (f.order || 0)
                    });
                    break;
                case sc.TROPHY_SORT_TYPES.NAME:
                    b.sort(function(a, b) {
                        var e = ig.LangLabel.getText(sc.trophies.getTrophy(a).name),
                            f = ig.LangLabel.getText(sc.trophies.getTrophy(b).name);
                        return e.toString().localeCompare(f.toString())
                    });
                    break;
                case sc.TROPHY_SORT_TYPES.UNLOCKED:
                    b.sort(function(a, b) {
                        var e = sc.trophies.getTrophy(a),
                            f = sc.trophies.getTrophy(b);
                        return e.triggered == f.triggered ? (e.order || 0) - (f.order || 0) : e.triggered ? -1 : f.triggered ? 1 : 0
                    });
                    break;
                case sc.TROPHY_SORT_TYPES.POINTS:
                    b.sort(function(a, b) {
                        var e = sc.trophies.getTrophy(a),
                            f = sc.trophies.getTrophy(b);
                        return e.points == f.points ? (e.order || 0) - (f.order || 0) : (f.points || 0) - (e.points ||
                            0)
                    })
            }
        },
        modelChanged: function(b, a, d) {
            b == sc.menu && a == sc.MENU_EVENT.SORT_LIST && this.sort(d.data.sortType)
        }
    })
});
ig.baked = !0;
