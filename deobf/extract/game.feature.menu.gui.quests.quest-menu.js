ig.module("game.feature.menu.gui.quests.quest-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.quests.quest-misc", "game.feature.menu.gui.quests.quest-tab-list", "game.feature.menu.gui.quests.quest-details").defines(function() {
    sc.QuestMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeySort: null,
        hotkeyTask: null,
        helpGui: null,
        questInfoBox: null,
        questListBox: null,
        questDetailBox: null,
        sortMenu: null,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.questInfoBox = new sc.QuestInfoBox;
            this.questInfoBox.setPos(8, 29);
            this.questInfoBox.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(this.questInfoBox.hook.size.x / 2)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_EASE: {
                    state: {
                        alpha: 0,
                        offsetX: -(this.questInfoBox.hook.size.x / 2)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                }
            };
            this.addChildGui(this.questInfoBox);
            this.questInfoBox.hide(true);
            this.questListBox =
                new sc.QuestListBox;
            this.questListBox.setPos(8, 29);
            this.addChildGui(this.questListBox);
            this.questListBox.doStateTransition("HIDDEN", true);
            this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyHelp.keepMouseFocus = true;
            this.hotkeyHelp.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyHelp.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyHelp.onButtonPress =
                this.onHelpButtonPressed.bind(this);
            this.hotkeySort = new sc.ButtonGui("\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeySort.keepMouseFocus = true;
            this.hotkeySort.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeySort.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeySort.onButtonPress = this.onSortButtonPress.bind(this);
            this.hotkeyTask = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.quests.fav"),
                void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyTask.keepMouseFocus = true;
            this.hotkeyTask.submitSound = null;
            this.hotkeyTask.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyTask.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                }
            };
            this.hotkeyTask.onButtonPress = function() {
                sc.menu.questDetailMode ? this.questDetailBox.checkTaskSwitch() : this.questListBox.setFavorite()
            }.bind(this);
            this.sortMenu = new sc.SortMenu(this.onExecuteSort.bind(this));
            this.sortMenu.addButton("questAccepted",
                sc.QUEST_SORT_TYPE.ACCEPTED, 0);
            this.sortMenu.addButton("auto", sc.QUEST_SORT_TYPE.ORDER, 1);
            this.sortMenu.addButton("name", sc.QUEST_SORT_TYPE.NAME, 2);
            this.sortMenu.addButton("questLevel", sc.QUEST_SORT_TYPE.LEVEL, 3);
            this.questDetailBox = new sc.QuestDetailsView(this.hotkeyTask);
            this.addChildGui(this.questDetailBox);
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.questListBox.addObservers();
            this.questDetailBox.addObservers()
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu,
                this);
            this.questListBox.removeObservers();
            this.questDetailBox.removeObservers()
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            ig.interact.setBlockDelay(0.2);
            this._updateSortMenuButton(this.questListBox.getCurrentSortText());
            this.questInfoBox.show();
            this.questListBox.show();
            this.onAddHotkeys()
        },
        hideMenu: function() {
            this.removeObservers();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySort);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyTask);
            this.questInfoBox.hide();
            this.questListBox.hide();
            this.questDetailBox.hide();
            this.helpGui = null;
            this.sortMenu.active && this.sortMenu.hideSortMenu();
            ig.cleanCache()
        },
        onHotkeyHelpCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onHelpButtonPressed: function() {
            sc.menu.removeHotkeys();
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },
        onHotkeySortCheck: function() {
            return sc.control.menuHotkeyHelp3()
        },
        onHotkeyTaskCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        onSortButtonPress: function() {
            if (this.sortMenu.active) this.sortMenu.hideSortMenu();
            else {
                ig.gui.addGuiElement(this.sortMenu);
                this.sortMenu.showSortMenu(this.hotkeySort)
            }
        },
        onExecuteSort: function(b) {
            if (b.data) {
                this.sortMenu.hideSortMenu();
                sc.menu.sortList(b)
            }
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui =
                    new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.quests.title"), ig.lang.get("sc.gui.menu.help-texts.quests.pages"), function() {
                        this.commitHotKeysToTopBar(true)
                    }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, this.onHotkeySortCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyTask,
                this.onHotkeyTaskCheck.bind(this));
            this.commitHotKeysToTopBar(b)
        },
        commitHotKeysToTopBar: function(b) {
            sc.menu.addHotkey(function() {
                return this.hotkeyTask
            }.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeySort
            }.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(b)
        },
        onBackButtonPress: function() {
            sc.menu.popBackCallback();
            sc.menu.popMenu()
        },
        _updateSortMenuButton: function(b) {
            var a = "\\i[help3]" + ig.lang.get("sc.gui.menu.item.sort-title") + ": ";
            this.hotkeySort.setText(a +
                ("\\c[3]" + b + "\\c[0]"));
            sc.menu.updateHotkeys()
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.QUEST_SET_INFO) this.questInfoBox.setQuest(sc.menu.questInfo);
                else if (a == sc.MENU_EVENT.QUEST_ENTER_DEAILS) {
                this.hotkeySort.setActive(false);
                this.questInfoBox.doStateTransition("HIDDEN_EASE")
            } else if (a == sc.MENU_EVENT.QUEST_LEAVE_DEAILS) {
                this.hotkeySort.setActive(true);
                ig.input.mouseGuiActive && this.questInfoBox.setQuest(null);
                this.questInfoBox.doStateTransition("DEFAULT")
            } else if (a == sc.MENU_EVENT.QUEST_CHANGED_TAB) {
                this.sortMenu.active &&
                    this.sortMenu.hideSortMenu();
                d != sc.menu.questCurrentTab && this._updateSortMenuButton(this.questListBox.getCurrentSortText())
            } else a == sc.MENU_EVENT.SORT_LIST && this._updateSortMenuButton(d.text)
        }
    })
});
ig.baked = !0;
