ig.module("game.feature.menu.gui.arena.arena-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.arena.arena-misc").defines(function() {
    var b = {
        key: "",
        round: -2
    };
    sc.ArenaRoundList = sc.ListTabbedPane.extend({
        currentCup: null,
        active: false,
        submit: new ig.Sound("media/sound/arena/arena-cup-select.ogg", 0.8),
        init: function() {
            this.parent(false);
            this.setSize(264, 262);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(264, 262);
            this.setPanelSize(264, 243);
            this.submitSound = sc.BUTTON_SOUND.submit;
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
            var a = new sc.TextGui(ig.lang.get("sc.gui.arena.menu.medal"), {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(5, -8);
            this.bg.addChildGui(a);
            this.addTab("tab", 0, {
                type: "cup"
            })
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        show: function(a) {
            this.parent();
            this.active = true;
            this.currentCup = a;
            this.setTab(this.currentTabIndex || 0, true, {
                skipSounds: true
            });
            this.tabs.tab.setText(sc.arena.getCupDifficultyIcon(a) + sc.arena.getCupName(a));
            this.tabs.tab.setWidthToTextSize();
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.parent();
            this.active = false;
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("HIDDEN")
        },
        onTabButtonCreation: function(a, b, c) {
            a = new sc.ItemTabbedBox.TabButton("IfYouReadThisYouAreStupidHiHi", null, 230, null, true);
            a.textChild.setPos(7, 1);
            a.setPos(0, 2);
            a.setData({
                type: c.type
            });
            this.addChildGui(a);
            return a
        },
        onTabPressed: function(a, b) {
            if (!b) return false
        },
        onTabSelected: function() {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null,
                true)
        },
        onTabMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true)
        },
        onClearCurrentContent: function(a) {
            a.list.clear();
            a.list.doStateTransition("HIDDEN", true)
        },
        onListEntryPressed: function(a) {
            this.submitSound.play();
            var b = a.key,
                c = a.index,
                a = null,
                a = c == -1 ? ig.lang.get("sc.gui.arena.menu.startRushMode").replace("[CUP_NAME]", sc.arena.getCupName(b)) : ig.lang.get("sc.gui.arena.menu.startAtRound").replace("[CUP_NAME]", sc.arena.getCupName(b)).replace("[ROUND_INDEX]", c + 1);
            sc.Dialogs.showYesNoDialog(a, sc.DIALOG_INFO_ICON.QUESTION,
                function(a) {
                    if (a.data == 0) {
                        sc.arena.enterArenaMode(b, c);
                        this.submit.play();
                        sc.model.enterPrevSubState()
                    } else a.data > 0 && sc.BUTTON_SOUND.submit.play()
                }.bind(this), true)
        },
        onCreateListEntries: function(a, b) {
            var c = sc.arena.getCupRounds(this.currentCup);
            a.clear();
            b.clear();
            var e = null,
                e = null,
                f = sc.arena.getCupCore(this.currentCup);
            if (f && !f.noRush) {
                e = "\\i[arena-bolt-left]\\c[0]" + ig.lang.get("sc.gui.arena.menu.rush") + "\\c[0]\\i[arena-bolt-right]";
                e = new sc.ArenaRoundEntryButton(e, this.currentCup, -1, sc.arena.getCupMedal(this.currentCup,
                    -1), c.length);
                a.addButton(e)
            }
            for (f = 0; f < c.length; f++) {
                e = ig.LangLabel.getText(c[f].name);
                e = new sc.ArenaRoundEntryButton(e, this.currentCup, f, sc.arena.getCupMedal(this.currentCup, f), c.length);
                e.setActive(ig.perf.enableArenaRound || this.isRoundActive(this.currentCup, f));
                a.addButton(e)
            }
        },
        onListEntrySelected: function(a) {
            if (a.key != void 0) {
                b.key = a.key;
                b.round = a.index;
                sc.menu.setSynopInfo(b);
                a.description ? sc.menu.setInfoText(a.description, false) : a.active ? sc.menu.setInfoText(null, false) : sc.menu.setInfoText(ig.lang.get("sc.gui.arena.menu.roundUnlockCond"),
                    false)
            } else {
                sc.menu.setSynopInfo(a.key);
                a.data && (a.data instanceof Object || sc.menu.setInfoText(a.data))
            }
        },
        onListMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },
        isRoundActive: function(a, b) {
            return b <= 0 || sc.arena.getCupProgress(a).rounds[b].cleared >= 1 ? true : sc.arena.getCupProgress(a).rounds[b - 1].cleared >= 1
        },
        modelChanged: function(a, b, c) {
            if (a == sc.menu && b == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                this.sort(c.data.sortType)
            }
        }
    });
    sc.ArenaCupList = sc.ListTabbedPane.extend({
        submitSound: null,
        favSound: null,
        errorSound: null,
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
            var a = new sc.TextGui(ig.lang.get("sc.gui.arena.menu.trophy"), {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(5, -8);
            this.bg.addChildGui(a);
            if (sc.menu.arenaCustomMode) {
                this.addTab("solo", 0, {
                    type: sc.ARENA_BASE_TYPE.SOLO_CUSTOM
                });
                this.addTab("team", 1, {
                    type: sc.ARENA_BASE_TYPE.TEAM_CUSTOM
                })
            } else {
                this.addTab("solo", 0, {
                    type: sc.ARENA_BASE_TYPE.SOLO_CUP
                });
                this.addTab("team", 1, {
                    type: sc.ARENA_BASE_TYPE.TEAM_CUP
                })
            }
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
            var a = null,
                a = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.ARENA_SORT_TYPES.ORDER : sc.ARENA_SORT_TYPES.ORDER,
                b = "auto";
            switch (a) {
                case sc.ARENA_SORT_TYPES.ORDER:
                    b = "auto"
            }
            return ig.lang.get("sc.gui.menu.sort." + b)
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
            a = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.arena.menu.tabs." + a), "arena-" + a, 105);
            a.textChild.setPos(7,
                1);
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
        onListEntryPressed: function(a) {
            this.submitSound.play();
            sc.menu.setSynopPressed(a)
        },
        onCreateListEntries: function(a, b, c, e) {
            c = sc.arena.getSortedCupList(c, e);
            a.clear();
            b.clear();
            for (b = 0; b < c.length; b++) {
                e = c[b];
                if (sc.arena.isCupUnlocked(e)) {
                    var f = sc.arena.getCupDifficultyIcon(e) + sc.arena.getCupName(e),
                        e = new sc.ArenaEntryButton(f, e, sc.arena.getCupDescription(e), sc.arena.getCupTrophy(e));
                    a.addButton(e)
                }
            }
        },
        onListEntrySelected: function(a) {
            if (a.key != void 0) {
                b.key = a.key;
                b.round = -2;
                sc.menu.setSynopInfo(b);
                sc.menu.setInfoText(a.description, false)
            } else {
                sc.menu.setSynopInfo(a.key);
                a.data && (a.data instanceof Object || sc.menu.setInfoText(a.data))
            }
        },
        onListMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },
        modelChanged: function(a, b, c) {
            if (a == sc.menu && b == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                this.sort(c.data.sortType)
            }
        }
    })
});
ig.baked = !0;
