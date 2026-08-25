ig.module("game.feature.menu.gui.quests.quest-tab-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.quests.quest-misc", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.item.item-sort-menu").defines(function() {
    var b = [];
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
        init: function() {
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
            this.tabGroup.addPressCallback(function(a) {
                if (this._prevPressed != a) {
                    this.submitSound.play();
                    this._prevPressed = a;
                    a.setPressed(true);
                    this._resetButtons(a);
                    this._rearrangeTabs();
                    sc.menu.questLastButtonData = a.data;
                    for (var b = this.tabArray.length; b--;)
                        if (a == this.tabArray[b]) {
                            sc.menu.setQuestTab(b);
                            break
                        } sc.menu.setQuestInfo(null, true)
                }
            }.bind(this));
            this.tabGroup.addSelectionCallback(function() {});
            this.tabGroup.setMouseFocusLostCallback(function() {});
            var a = new sc.MenuPanel;
            a.setSize(264, 243);
            a.setPos(0, 21);
            this.addChildGui(a);
            this.bg = new sc.MenuScanLines;
            this.bg.setPos(0, 35);
            this.bg.setSize(262, 223);
            this.addChildGui(this.bg);
            a = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            a.setPos(0, 21);
            this.addChildGui(a);
            a = new ig.ColorGui("#FF6D00", 259, 1);
            a.setPos(5, 21);
            this.addChildGui(a);
            a = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
                font: sc.fontsystem.tinyFont
            });
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(7, -8);
            this.bg.addChildGui(a);
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
        setFavorite: function() {
            if (this._curElement && sc.menu.questCurrentTab == 0)
                if (this._curElement.data && this._curElement.data.id != void 0) {
                    this.favSound && this.favSound.play();
                    sc.quests.markQuest(this._curElement.data.quest.id);
                    this._curElement.setText(this._makeName(this._curElement.data.quest))
                } else this.errorSound.play();
            else {
                this.submitSound.play();
                var a = ig.lang.get("sc.gui.menu.help-texts.quests.title-2") + "\n\n" + ig.lang.get("sc.gui.menu.help-texts.quests.text-2"),
                    a = new sc.CenterMsgBoxGui(a, {
                        maxWidth: 300,
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    }, "black", 0.9);
                a.hook.zIndex = 15E4;
                a.hook.pauseGui = true;
                ig.gui.addGuiElement(a)
            }
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        show: function() {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            ig.interact.setBlockDelay(0.2);
            var a = sc.menu.questLastButtonData;
            a && this._createCacheList(a.type, true, ig.input.mouseGuiActive, true);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
            this.list.deactivate();
            this.doStateTransition("HIDDEN")
        },
        getCurrentSortText: function() {
            var a = null,
                a = this.tabContent[sc.menu.questCurrentTab] ? this.tabContent[sc.menu.questCurrentTab].sort || sc.QUEST_SORT_TYPE.ACCEPTED : sc.QUEST_SORT_TYPE.ACCEPTED,
                b = "auto";
            switch (a) {
                case sc.QUEST_SORT_TYPE.ACCEPTED:
                    b = "questAccepted";
                    break;
                case sc.QUEST_SORT_TYPE.ORDER:
                    b = "auto";
                    break;
                case sc.QUEST_SORT_TYPE.NAME:
                    b = "name";
                    break;
                case sc.QUEST_SORT_TYPE.LEVEL:
                    b =
                        "questLevel"
            }
            return ig.lang.get("sc.gui.menu.sort." + b)
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() || sc.control.menuCircleRight()
        },
        onButtonTraversal: function() {
            var a = sc.menu.questCurrentTab,
                b = this.tabArray[a],
                c = -1;
            if (sc.control.menuCircleRight() || sc.control.rightPressed()) c = 1;
            else if (sc.control.menuCircleLeft() || sc.control.leftPressed()) c = 0;
            if (c >= 0) {
                this.submitSound.play();
                b.setPressed(false);
                if (c == 1) {
                    a++;
                    a >= this.tabArray.length && (a = 0)
                } else {
                    a--;
                    a < 0 && (a = this.tabArray.length - 1)
                }
                this._prevPressed = b = this.tabArray[a];
                b.setPressed(true);
                sc.menu.setQuestInfo(null, true);
                this._resetButtons(b, true);
                this._rearrangeTabs();
                sc.menu.questLastButtonData = b.data;
                sc.menu.setQuestTab(a)
            }
        },
        modelChanged: function(a, b, c) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.QUEST_CHANGED_TAB) this._createCacheList(sc.menu.questLastButtonData.type, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive);
                else if (b ==
                sc.MENU_EVENT.QUEST_ENTER_DEAILS) {
                sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
                this.doStateTransition("HIDDEN_EASE")
            } else if (b == sc.MENU_EVENT.QUEST_LEAVE_DEAILS) {
                sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
                this.doStateTransition("DEFAULT")
            } else b == sc.MENU_EVENT.SORT_LIST && this._sortCacheList(c.data.sortType)
        },
        _sortCacheList: function(a) {
            this.tabContent[sc.menu.questCurrentTab].sort = a;
            this._createListEntries(sc.menu.questLastButtonData.type, a);
            ig.input.mouseGuiActive ? this.buttongroup.setRegainFocus() :
                this.buttongroup.regainCurrentFocus(false, true)
        },
        _createCacheList: function(a, b, c, e) {
            b = b || false;
            c = c || false;
            e = e || false;
            if (this.tabContent[this._prevIndex]) {
                this.list.deactivate();
                this.list.doStateTransition("HIDDEN", true)
            }
            var f = sc.menu.questCurrentTab,
                g = this.tabContent[f];
            if (g) {
                this.list = g.list;
                this.buttongroup = g.buttongroup;
                this.list.activate();
                this.list.doStateTransition("DEFAULT", true);
                b && (c ? this.buttongroup.setRegainFocus() : this.buttongroup.regainCurrentFocus(false, e))
            } else {
                g = {
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
                this.buttongroup.addSelectionCallback(function(a) {
                    if (a.data) {
                        this._curElement =
                            a;
                        if (a.data.quest) sc.menu.setQuestInfo(a.data.quest);
                        else {
                            a.data instanceof Object || sc.menu.setInfoText(a.data);
                            sc.menu.setQuestInfo(null, true)
                        }
                    }
                }.bind(this));
                this.buttongroup.setMouseFocusLostCallback(function() {
                    this._curElement = null;
                    sc.menu.setInfoText("", true);
                    sc.menu.setQuestInfo(null, true)
                }.bind(this));
                this.buttongroup.addPressCallback(function(a) {
                    sc.menu.enterQuestDetails(a.data.quest)
                }.bind(this));
                this.buttongroup.onButtonTraversal = this.onButtonTraversal.bind(this);
                this._createListEntries(a);
                g.buttongroup = this.buttongroup;
                g.list = this.list;
                this.list.activate();
                this.tabContent[f] = g;
                this._prevIndex = f
            }
        },
        _createListEntries: function(a, d) {
            var c = null,
                e = c = null,
                f = null,
                g = 0;
            this.buttongroup.clear();
            this.list.clear();
            for (var d = d || sc.QUEST_SORT_TYPE.ACCEPTED, h = sc.quests.getQuestList(a, d), i = b.length = 0; i < h.length; i++)
                if (f = h[i]) {
                    c = this._makeName(f);
                    if (f.parentQuest) {
                        e = (!sc.quests.isQuestSolved(f.parentQuest) || false) && a == sc.QUEST_LIST_TYPE.SOLVED;
                        c = new sc.ItemBoxButton(c, 236 - (e ? 0 : 22), 25, f.level);
                        g = e ? 0 :
                            22;
                        if (!e) {
                            e = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
                            e.setPos(-16, 1);
                            c.addChildGui(e)
                        }
                        c.setData({
                            quest: f,
                            id: i
                        });
                        d == sc.QUEST_SORT_TYPE.ORDER || d == sc.QUEST_SORT_TYPE.ACCEPTED ? this.list.addButton(c, null, g) : b.push(f)
                    } else {
                        c = new sc.ItemBoxButton(c, 236, 25, f.level);
                        g = 0;
                        c.setData({
                            quest: f,
                            id: i
                        });
                        this.list.addButton(c, null, g)
                    }
                } if (b.length >= 1) {
                i = b.length;
                for (h = this.list.getChildren().length; i--;) {
                    f = b[i];
                    sc.quests.isQuestSolved(f.parentQuest);
                    g = this._findParentIndex(f.parentQuest);
                    if (g >= 0) {
                        c = this._makeName(f);
                        c = new sc.ItemBoxButton(c, 214, 25, f.level);
                        e = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
                        e.setPos(-16, 1);
                        c.addChildGui(e);
                        c.setData({
                            quest: f,
                            id: this.list.getChildren().length
                        });
                        g == h - 1 ? this.list.addButton(c, null, 22) : this.list.insertButton(c, g + 1, null, null, null, true);
                        c.hook.pos.x = 22
                    }
                }
            }
        },
        _findParentIndex: function(a) {
            for (var b = this.list.getChildren(), c = b.length; c--;)
                if (b[c].gui.data.quest.id == a) return c;
            return -1
        },
        _createTabButton: function(a, b, c, e) {
            a = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.quests.tabs." +
                a), e, 90);
            a.textChild.setPos(6, 0);
            a.setPos(0, 2);
            a.setData({
                type: c
            });
            this.addChildGui(a);
            this.tabGroup.addFocusGui(a, b, 0);
            return this.tabArray[b] = a
        },
        _rearrangeTabs: function() {
            for (var a = 9, b = null, c = 0; c < this.tabArray.length; c++) {
                b = this.tabArray[c];
                b.hook.pos.x = a;
                a = a + b.hook.size.x
            }
        },
        _resetButtons: function(a, b) {
            for (var c = 0; c < this.tabArray.length; c++) {
                a != this.tabArray[c] && this.tabArray[c].setPressed(false);
                if (b) this.tabArray[c].focus = false
            }
        },
        _makeName: function(a) {
            var b = "",
                b = sc.quests.isMarkedQuest(a.id) ?
                "\\i[quest-fav]" : sc.quests.isQuestSolved(a.id) ? a.elite ? "\\i[quest-elite-solve]" : "\\i[quest-solve]" : a.elite ? "\\i[quest-elite]" : "\\i[quest]";
            return b = b + a.name
        }
    })
});
ig.baked = !0;
