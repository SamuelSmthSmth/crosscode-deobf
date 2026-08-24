/**
 * game.feature.menu.gui.arena.arena-list
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.arena.arena-list")`.
 *
 * `sc.ArenaRoundList`: the per-cup round list (round start / rush-mode
 * entries with medals and the start-confirmation dialog), and
 * `sc.ArenaCupList`: the solo/team cup list (tabbed, sorted, with the
 * unlock/selection synopsis flow).
 */
ig.module("game.feature.menu.gui.arena.arena-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.arena.arena-misc")
    .defines(function () {

    var synopInfo = {
        key: "",
        round: -2
    };

    sc.ArenaRoundList = sc.ListTabbedPane.extend({
        currentCup: null,
        active: false,
        submit: new ig.Sound("media/sound/arena/arena-cup-select.ogg", 0.8),

        init: function () {
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
            var medalLabel = new sc.TextGui(ig.lang.get("sc.gui.arena.menu.medal"), {
                font: sc.fontsystem.tinyFont
            });
            medalLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            medalLabel.setPos(5, -8);
            this.bg.addChildGui(medalLabel);
            this.addTab("tab", 0, {
                type: "cup"
            })
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function (cup) {
            this.parent();
            this.active = true;
            this.currentCup = cup;
            this.setTab(this.currentTabIndex || 0, true, {
                skipSounds: true
            });
            this.tabs.tab.setText(sc.arena.getCupDifficultyIcon(cup) + sc.arena.getCupName(cup));
            this.tabs.tab.setWidthToTextSize();
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.parent();
            this.active = false;
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("HIDDEN")
        },

        onTabButtonCreation: function (name, index, data) {
            var button = new sc.ItemTabbedBox.TabButton("IfYouReadThisYouAreStupidHiHi", null, 230, null, true);
            button.textChild.setPos(7, 1);
            button.setPos(0, 2);
            button.setData({
                type: data.type
            });
            this.addChildGui(button);
            return button
        },

        onTabPressed: function (button, isPressed) {
            if (!isPressed) return false
        },

        onTabSelected: function () {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
        },

        onTabMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true)
        },

        onClearCurrentContent: function (content) {
            content.list.clear();
            content.list.doStateTransition("HIDDEN", true)
        },

        onListEntryPressed: function (entry) {
            this.submitSound.play();
            var cup = entry.key,
                round = entry.index,
                message = null,
                message = round == -1 ? ig.lang.get("sc.gui.arena.menu.startRushMode").replace("[CUP_NAME]", sc.arena.getCupName(cup)) : ig.lang.get("sc.gui.arena.menu.startAtRound").replace("[CUP_NAME]", sc.arena.getCupName(cup)).replace("[ROUND_INDEX]", round + 1);
            sc.Dialogs.showYesNoDialog(message, sc.DIALOG_INFO_ICON.QUESTION, function (result) {
                if (result.data == 0) {
                    sc.arena.enterArenaMode(cup, round);
                    this.submit.play();
                    sc.model.enterPrevSubState()
                } else result.data > 0 && sc.BUTTON_SOUND.submit.play()
            }.bind(this), true)
        },

        onCreateListEntries: function (list, buttongroup, sortType) {
            var rounds = sc.arena.getCupRounds(this.currentCup);
            list.clear();
            buttongroup.clear();
            var entry = null,
                label = null,
                cupCore = sc.arena.getCupCore(this.currentCup);
            if (cupCore && !cupCore.noRush) {
                label = "\\i[arena-bolt-left]\\c[0]" + ig.lang.get("sc.gui.arena.menu.rush") + "\\c[0]\\i[arena-bolt-right]";
                entry = new sc.ArenaRoundEntryButton(label, this.currentCup, -1, sc.arena.getCupMedal(this.currentCup, -1), rounds.length);
                list.addButton(entry)
            }
            for (var i = 0; i < rounds.length; i++) {
                label = ig.LangLabel.getText(rounds[i].name);
                entry = new sc.ArenaRoundEntryButton(label, this.currentCup, i, sc.arena.getCupMedal(this.currentCup, i), rounds.length);
                entry.setActive(ig.perf.enableArenaRound || this.isRoundActive(this.currentCup, i));
                list.addButton(entry)
            }
        },

        onListEntrySelected: function (entry) {
            if (entry.key != void 0) {
                synopInfo.key = entry.key;
                synopInfo.round = entry.index;
                sc.menu.setSynopInfo(synopInfo);
                entry.description ? sc.menu.setInfoText(entry.description, false) : entry.active ? sc.menu.setInfoText(null, false) : sc.menu.setInfoText(ig.lang.get("sc.gui.arena.menu.roundUnlockCond"), false)
            } else {
                sc.menu.setSynopInfo(entry.key);
                entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
            }
        },

        onListMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },

        isRoundActive: function (cup, round) {
            return round <= 0 || sc.arena.getCupProgress(cup).rounds[round].cleared >= 1 ? true : sc.arena.getCupProgress(cup).rounds[round - 1].cleared >= 1
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu && event == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                this.sort(data.data.sortType)
            }
        }
    });

    sc.ArenaCupList = sc.ListTabbedPane.extend({
        submitSound: null,
        favSound: null,
        errorSound: null,

        init: function () {
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
            var trophyLabel = new sc.TextGui(ig.lang.get("sc.gui.arena.menu.trophy"), {
                font: sc.fontsystem.tinyFont
            });
            trophyLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            trophyLabel.setPos(5, -8);
            this.bg.addChildGui(trophyLabel);
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

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function () {
            this.parent();
            this.setTab(this.currentTabIndex || 0, true, {
                skipSounds: true
            });
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.parent();
            this.doStateTransition("HIDDEN")
        },

        getCurrentSortText: function () {
            var sortType = null,
                sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.ARENA_SORT_TYPES.ORDER : sc.ARENA_SORT_TYPES.ORDER,
                key = "auto";
            switch (sortType) {
                case sc.ARENA_SORT_TYPES.ORDER:
                    key = "auto"
            }
            return ig.lang.get("sc.gui.menu.sort." + key)
        },

        onLeftRightPress: function (button, index, direction) {
            this.submitSound.play();
            sc.menu.switchSynopsisPage(direction == 1 ? 1 : -1);
            return {
                skipSounds: true
            }
        },

        onTabChanged: function (index) {
            sc.menu.setSynoTab(index);
            (ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },

        onTabButtonCreation: function (name, index, data) {
            var button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.arena.menu.tabs." + name), "arena-" + name, 105);
            button.textChild.setPos(7, 1);
            button.setPos(0, 2);
            button.setData({
                type: data.type
            });
            this.addChildGui(button);
            return button
        },

        onTabPressed: function (button, isPressed) {
            if (!isPressed) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(button));
                for (var i = this.tabArray.length; i--;)
                    if (button == this.tabArray[i]) {
                        sc.menu.setSynoTab(i);
                        break
                    }
                sc.menu.setSynopInfo(null, true);
                return false
            }
        },

        onTabSelected: function () {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
        },

        onTabMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true)
        },

        onListEntryPressed: function (entry) {
            this.submitSound.play();
            sc.menu.setSynopPressed(entry)
        },

        onCreateListEntries: function (list, buttongroup, tabType, sortType) {
            var cups = sc.arena.getSortedCupList(tabType, sortType);
            list.clear();
            buttongroup.clear();
            for (var i = 0; i < cups.length; i++) {
                var cup = cups[i];
                if (sc.arena.isCupUnlocked(cup)) {
                    var label = sc.arena.getCupDifficultyIcon(cup) + sc.arena.getCupName(cup),
                        entry = new sc.ArenaEntryButton(label, cup, sc.arena.getCupDescription(cup), sc.arena.getCupTrophy(cup));
                    list.addButton(entry)
                }
            }
        },

        onListEntrySelected: function (entry) {
            if (entry.key != void 0) {
                synopInfo.key = entry.key;
                synopInfo.round = -2;
                sc.menu.setSynopInfo(synopInfo);
                sc.menu.setInfoText(entry.description, false)
            } else {
                sc.menu.setSynopInfo(entry.key);
                entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
            }
        },

        onListMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu && event == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                this.sort(data.data.sortType)
            }
        }
    })
});
ig.baked = !0;
