/**
 * game.feature.menu.gui.quests.quest-tab-list
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.quests.quest-tab-list")`.
 *
 * `sc.QuestListBox`: the quest log list — active / solved / all tabs with
 * a cached per-tab `sc.ButtonListBox`, quest rows (with sub-quest
 * indentation and parent-chain icons), favorite marking and the
 * enter-details press handling.
 */
ig.module("game.feature.menu.gui.quests.quest-tab-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.quests.quest-misc", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.item.item-sort-menu")
    .defines(function () {

    var scratchQuests = [];

    sc.QuestListBox = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        list: null,
        bg: null,
        tabs: {
            active: null,
            solved: null,
            all: null
        },
        tabArray: [],
        tabContent: [],
        buttongroup: null,
        tabGroup: [],
        submitSound: null,
        favSound: null,
        errorSound: null,
        _prevIndex: null,
        _prevPressed: null,
        _refocusFromCycle: -1,
        _lastCursorPos: [],
        _curElement: -1,

        init: function () {
            this.parent();
            this.setSize(264, 262);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(264, 262);
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
            this.tabGroup = new sc.ButtonGroup;
            this.tabGroup.addPressCallback(function (button) {
                if (this._prevPressed != button) {
                    this.submitSound.play();
                    this._prevPressed = button;
                    button.setPressed(true);
                    this._resetButtons(button);
                    this._rearrangeTabs();
                    sc.menu.questLastButtonData = button.data;
                    for (var i = this.tabArray.length; i--;)
                        if (button == this.tabArray[i]) {
                            sc.menu.setQuestTab(i);
                            break
                        }
                    sc.menu.setQuestInfo(null, true)
                }
            }.bind(this));
            this.tabGroup.addSelectionCallback(function () {});
            this.tabGroup.setMouseFocusLostCallback(function () {});
            var panel = new sc.MenuPanel;
            panel.setSize(264, 243);
            panel.setPos(0, 21);
            this.addChildGui(panel);
            this.bg = new sc.MenuScanLines;
            this.bg.setPos(0, 35);
            this.bg.setSize(262, 223);
            this.addChildGui(this.bg);
            panel = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            panel.setPos(0, 21);
            this.addChildGui(panel);
            panel = new ig.ColorGui("#FF6D00", 259, 1);
            panel.setPos(5, 21);
            this.addChildGui(panel);
            panel = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
                font: sc.fontsystem.tinyFont
            });
            panel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            panel.setPos(7, -8);
            this.bg.addChildGui(panel);
            this.tabs.active = this._createTabButton("active", 0, sc.QUEST_LIST_TYPE.ACTIVE, "quest");
            this.tabs.solved = this._createTabButton("solved", 1, sc.QUEST_LIST_TYPE.SOLVED, "quest-solve");
            this.tabs.all = this._createTabButton("all", 2, sc.QUEST_LIST_TYPE.ALL, "quest-all");
            sc.menu.questLastButtonData = this.tabs.active.data;
            this.tabGroup.setCurrentFocus(0, 0);
            this.tabs.active.setPressed(true);
            this._prevPressed = this.tabs.active;
            this._rearrangeTabs();
            this.doStateTransition("HIDDEN", true)
        },

        setFavorite: function () {
            if (this._curElement && sc.menu.questCurrentTab == 0)
                if (this._curElement.data && this._curElement.data.id != void 0) {
                    this.favSound && this.favSound.play();
                    sc.quests.markQuest(this._curElement.data.quest.id);
                    this._curElement.setText(this._makeName(this._curElement.data.quest))
                } else this.errorSound.play();
            else {
                this.submitSound.play();
                var text = ig.lang.get("sc.gui.menu.help-texts.quests.title-2") + "\n\n" + ig.lang.get("sc.gui.menu.help-texts.quests.text-2"),
                    msgBox = new sc.CenterMsgBoxGui(text, {
                        maxWidth: 300,
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    }, "black", 0.9);
                msgBox.hook.zIndex = 15E4;
                msgBox.hook.pauseGui = true;
                ig.gui.addGuiElement(msgBox)
            }
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function () {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            ig.interact.setBlockDelay(0.2);
            var lastButtonData = sc.menu.questLastButtonData;
            lastButtonData && this._createCacheList(lastButtonData.type, true, ig.input.mouseGuiActive, true);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
            this.list.deactivate();
            this.doStateTransition("HIDDEN")
        },

        getCurrentSortText: function () {
            var sortType = null,
                sortType = this.tabContent[sc.menu.questCurrentTab] ? this.tabContent[sc.menu.questCurrentTab].sort || sc.QUEST_SORT_TYPE.ACCEPTED : sc.QUEST_SORT_TYPE.ACCEPTED,
                key = "auto";
            switch (sortType) {
                case sc.QUEST_SORT_TYPE.ACCEPTED:
                    key = "questAccepted";
                    break;
                case sc.QUEST_SORT_TYPE.ORDER:
                    key = "auto";
                    break;
                case sc.QUEST_SORT_TYPE.NAME:
                    key = "name";
                    break;
                case sc.QUEST_SORT_TYPE.LEVEL:
                    key = "questLevel"
            }
            return ig.lang.get("sc.gui.menu.sort." + key)
        },

        isNonMouseMenuInput: function () {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() || sc.control.menuCircleRight()
        },

        onButtonTraversal: function () {
            var currentTab = sc.menu.questCurrentTab,
                button = this.tabArray[currentTab],
                direction = -1;
            if (sc.control.menuCircleRight() || sc.control.rightPressed()) direction = 1;
            else if (sc.control.menuCircleLeft() || sc.control.leftPressed()) direction = 0;
            if (direction >= 0) {
                this.submitSound.play();
                button.setPressed(false);
                if (direction == 1) {
                    currentTab++;
                    currentTab >= this.tabArray.length && (currentTab = 0)
                } else {
                    currentTab--;
                    currentTab < 0 && (currentTab = this.tabArray.length - 1)
                }
                this._prevPressed = button = this.tabArray[currentTab];
                button.setPressed(true);
                sc.menu.setQuestInfo(null, true);
                this._resetButtons(button, true);
                this._rearrangeTabs();
                sc.menu.questLastButtonData = button.data;
                sc.menu.setQuestTab(currentTab)
            }
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu)
                if (event == sc.MENU_EVENT.QUEST_CHANGED_TAB) this._createCacheList(sc.menu.questLastButtonData.type, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive);
                else if (event == sc.MENU_EVENT.QUEST_ENTER_DEAILS) {
                sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
                this.doStateTransition("HIDDEN_EASE")
            } else if (event == sc.MENU_EVENT.QUEST_LEAVE_DEAILS) {
                sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
                this.doStateTransition("DEFAULT")
            } else event == sc.MENU_EVENT.SORT_LIST && this._sortCacheList(data.data.sortType)
        },

        _sortCacheList: function (sortType) {
            this.tabContent[sc.menu.questCurrentTab].sort = sortType;
            this._createListEntries(sc.menu.questLastButtonData.type, sortType);
            ig.input.mouseGuiActive ? this.buttongroup.setRegainFocus() : this.buttongroup.regainCurrentFocus(false, true)
        },

        _createCacheList: function (listType, refocus, mouseActive, hardFocus) {
            refocus = refocus || false;
            mouseActive = mouseActive || false;
            hardFocus = hardFocus || false;
            if (this.tabContent[this._prevIndex]) {
                this.list.deactivate();
                this.list.doStateTransition("HIDDEN", true)
            }
            var currentTab = sc.menu.questCurrentTab,
                cached = this.tabContent[currentTab];
            if (cached) {
                this.list = cached.list;
                this.buttongroup = cached.buttongroup;
                this.list.activate();
                this.list.doStateTransition("DEFAULT", true);
                refocus && (mouseActive ? this.buttongroup.setRegainFocus() : this.buttongroup.regainCurrentFocus(false, hardFocus))
            } else {
                cached = {
                    buttongroup: null,
                    list: null,
                    sort: sc.QUEST_SORT_TYPE.ACCEPTED
                };
                this.buttongroup = new sc.ButtonGroup;
                this.list = new sc.ButtonListBox(1, 0, 28);
                this.list.setPos(0, 35);
                this.list.setSize(264, 223);
                this.list.setButtonGroup(this.buttongroup);
                this.list.hook.transitions = {
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
                this.addChildGui(this.list);
                this.buttongroup.isNonMouseMenuInput = this.isNonMouseMenuInput.bind(this);
                this.buttongroup.addSelectionCallback(function (button) {
                    if (button.data) {
                        this._curElement = button;
                        if (button.data.quest) sc.menu.setQuestInfo(button.data.quest);
                        else {
                            button.data instanceof Object || sc.menu.setInfoText(button.data);
                            sc.menu.setQuestInfo(null, true)
                        }
                    }
                }.bind(this));
                this.buttongroup.setMouseFocusLostCallback(function () {
                    this._curElement = null;
                    sc.menu.setInfoText("", true);
                    sc.menu.setQuestInfo(null, true)
                }.bind(this));
                this.buttongroup.addPressCallback(function (button) {
                    sc.menu.enterQuestDetails(button.data.quest)
                }.bind(this));
                this.buttongroup.onButtonTraversal = this.onButtonTraversal.bind(this);
                this._createListEntries(listType);
                cached.buttongroup = this.buttongroup;
                cached.list = this.list;
                this.list.activate();
                this.tabContent[currentTab] = cached;
                this._prevIndex = currentTab
            }
        },

        _createListEntries: function (listType, sortType) {
            var button = null,
                icon = button = null,
                quest = null,
                indent = 0;
            this.buttongroup.clear();
            this.list.clear();
            for (var sort = sortType || sc.QUEST_SORT_TYPE.ACCEPTED, quests = sc.quests.getQuestList(listType, sort), i = scratchQuests.length = 0; i < quests.length; i++)
                if (quest = quests[i]) {
                    var name = this._makeName(quest);
                    if (quest.parentQuest) {
                        var isHidden = (!sc.quests.isQuestSolved(quest.parentQuest) || false) && listType == sc.QUEST_LIST_TYPE.SOLVED;
                        button = new sc.ItemBoxButton(name, 236 - (isHidden ? 0 : 22), 25, quest.level);
                        indent = isHidden ? 0 : 22;
                        if (!isHidden) {
                            icon = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
                            icon.setPos(-16, 1);
                            button.addChildGui(icon)
                        }
                        button.setData({
                            quest: quest,
                            id: i
                        });
                        sort == sc.QUEST_SORT_TYPE.ORDER || sort == sc.QUEST_SORT_TYPE.ACCEPTED ? this.list.addButton(button, null, indent) : scratchQuests.push(quest)
                    } else {
                        button = new sc.ItemBoxButton(name, 236, 25, quest.level);
                        indent = 0;
                        button.setData({
                            quest: quest,
                            id: i
                        });
                        this.list.addButton(button, null, indent)
                    }
                }
            if (scratchQuests.length >= 1) {
                var count = scratchQuests.length;
                for (var childrenCount = this.list.getChildren().length; count--;) {
                    quest = scratchQuests[count];
                    sc.quests.isQuestSolved(quest.parentQuest);
                    var parentIndex = this._findParentIndex(quest.parentQuest);
                    if (parentIndex >= 0) {
                        var name = this._makeName(quest),
                            subButton = new sc.ItemBoxButton(name, 214, 25, quest.level);
                        icon = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
                        icon.setPos(-16, 1);
                        subButton.addChildGui(icon);
                        subButton.setData({
                            quest: quest,
                            id: this.list.getChildren().length
                        });
                        parentIndex == childrenCount - 1 ? this.list.addButton(subButton, null, 22) : this.list.insertButton(subButton, parentIndex + 1, null, null, null, true);
                        subButton.hook.pos.x = 22
                    }
                }
            }
        },

        _findParentIndex: function (parentQuest) {
            for (var children = this.list.getChildren(), i = children.length; i--;)
                if (children[i].gui.data.quest.id == parentQuest) return i;
            return -1
        },

        _createTabButton: function (name, index, listType, icon) {
            var button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.quests.tabs." + name), icon, 90);
            button.textChild.setPos(6, 0);
            button.setPos(0, 2);
            button.setData({
                type: listType
            });
            this.addChildGui(button);
            this.tabGroup.addFocusGui(button, index, 0);
            return this.tabArray[index] = button
        },

        _rearrangeTabs: function () {
            for (var x = 9, button = null, i = 0; i < this.tabArray.length; i++) {
                button = this.tabArray[i];
                button.hook.pos.x = x;
                x = x + button.hook.size.x
            }
        },

        _resetButtons: function (pressedButton, alsoUnfocus) {
            for (var i = 0; i < this.tabArray.length; i++) {
                pressedButton != this.tabArray[i] && this.tabArray[i].setPressed(false);
                if (alsoUnfocus) this.tabArray[i].focus = false
            }
        },

        _makeName: function (quest) {
            var name = "",
                name = sc.quests.isMarkedQuest(quest.id) ? "\\i[quest-fav]" : sc.quests.isQuestSolved(quest.id) ? quest.elite ? "\\i[quest-elite-solve]" : "\\i[quest-solve]" : quest.elite ? "\\i[quest-elite]" : "\\i[quest]";
            return name = name + quest.name
        }
    })
});
ig.baked = !0;
