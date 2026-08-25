ig.module("game.feature.menu.gui.tab-box").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes").defines(function() {
    sc.TabbedPane = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
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
        },
        tabGroup: null,
        keys: [],
        tabs: {},
        tabArray: [],
        tabContent: [],
        currentTabIndex: -1,
        currentContent: null,
        tabSelectionListener: null,
        tabPressListener: null,
        tabButtonCreationCallback: null,
        cacheContent: true,
        menuPanel: null,
        menuHighlight: null,
        _prevIndex: -1,
        _prevPressed: null,
        _refocusFromCycle: -1,
        _lastCursorPos: [],
        init: function(b) {
            this.parent();
            this.cacheContent = b == void 0 ? true : b;
            this.menuPanel = new sc.MenuPanel;
            this.menuPanel.setSize(100, 200);
            this.menuPanel.setPos(0, 21);
            this.addChildGui(this.menuPanel);
            b = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            b.setPos(0, 21);
            this.addChildGui(b);
            this.menuHighlight = new ig.ColorGui("#FF6D00", 95, 1);
            this.menuHighlight.setPos(5, 21);
            this.addChildGui(this.menuHighlight);
            this.setSize(100, 200);
            this.tabGroup = new sc.ButtonGroup;
            this.tabGroup.addPressCallback(function(a) {
                if (this._prevPressed != a) {
                    a.setPressed(true);
                    this._prevPressed = a;
                    this.resetButtons(a);
                    this.rearrangeTabs();
                    this.onTabPressed(a, false) && this.setTab(this.getButtonIndex(a))
                } else this.onTabPressed(a, true)
            }.bind(this));
            this.tabGroup.addSelectionCallback(function(a) {
                this.onTabSelected(a)
            }.bind(this));
            this.tabGroup.setMouseFocusLostCallback(function() {
                this.onTabMouseFocusLost()
            }.bind(this))
        },
        setSize: function(b, a) {
            this.parent(b, a);
            this.menuHighlight.setSize(b - 5, 1)
        },
        setPanelSize: function(b, a) {
            this.menuPanel.setSize(b, a)
        },
        addTab: function(b, a, d) {
            d = this.onTabButtonCreation(b, a, d);
            if (!d) throw Error("Tab Button Creation failed for index: " + a);
            this.tabGroup.addFocusGui(d, a, 0);
            this.tabArray[a] = d;
            this.tabs[b] = d;
            this.keys[a] = b;
            this.rearrangeTabs();
            if (this.tabArray.length == 1) {
                this.currentTabIndex = 0;
                this.tabGroup.setCurrentFocus(0,
                    0);
                this.tabs[b].setPressed(true);
                this._prevPressed = this.tabs[b]
            }
        },
        setTab: function(b, a, d) {
            if (a) this._prevIndex = -1;
            if (this._prevIndex != b) {
                if (!this.tabArray[b]) throw Error("No such tab at index: " + b);
                if (this.currentTabIndex >= 0 && this._prevIndex >= 0)
                    if (a = this.tabContent[this._prevIndex]) this.onClearPrevContent(a, d);
                this.currentTabIndex = b;
                this.currentContent && this.onClearCurrentContent && this.onClearCurrentContent(this.currentContent);
                this.currentContent = null;
                a = this._prevIndex;
                this._prevIndex = this.currentTabIndex;
                var c = this.tabContent[b];
                if (c) {
                    this.onSetCacheContent(c, b, d);
                    this.onTabChanged(this.currentTabIndex, a, d)
                } else {
                    this.currentContent = this.onContentCreation(b, d);
                    if (this.cacheContent) this.tabContent[this.currentTabIndex] = this.currentContent;
                    this.onTabChanged(this.currentTabIndex, a)
                }
            }
        },
        show: function(b) {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            b != void 0 && this.setTab(b)
        },
        hide: function() {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup)
        },
        rearrangeTabs: function() {
            for (var b = 9, a = null, d =
                    0; d < this.tabArray.length; d++) {
                a = this.tabArray[d];
                a.hook.pos.x = b;
                b = b + a.hook.size.x
            }
        },
        resetButtons: function(b, a) {
            for (var d = 0; d < this.tabArray.length; d++) {
                b != this.tabArray[d] && this.tabArray[d].setPressed(false);
                if (a) this.tabArray[d].focus = false
            }
        },
        getCurrentTabButton: function() {
            return this.currentTabIndex <= -1 ? null : this.tabArray[this.currentTabIndex]
        },
        getCurrentTabKey: function() {
            return this.keys[this.currentTabIndex]
        },
        getButtonIndex: function(b) {
            return this.tabArray.indexOf(b)
        },
        onTabSelected: function() {},
        onTabPressed: function() {},
        onTabButtonCreation: function() {},
        onTabMouseFocusLost: function() {},
        onTabChanged: function() {},
        onClearPrevContent: function() {},
        onContentCreation: function() {},
        onSetCacheContent: function() {}
    });
    sc.ListTabbedPane = sc.TabbedPane.extend({
        currentList: null,
        currentGroup: null,
        listPadding: 0,
        listPageSize: 20,
        defaultSortType: 0,
        containerHeightOffset: 0,
        listPosOffset: 0,
        listHeightOffset: 0,
        bg: null,
        init: function(b, a) {
            this.parent(b);
            this.defaultSortType = a || 0;
            this.bg = new sc.MenuScanLines;
            this.bg.setPos(0,
                35);
            this.bg.setSize(this.hook.size.x, 223 + this.containerHeightOffset);
            this.addChildGui(this.bg)
        },
        update: function() {
            if (this.currentGroup && this.currentGroup.isActive() && ig.input.mouseGuiActive) this.onButtonTraversal()
        },
        setSize: function(b, a) {
            this.parent(b, a);
            this.bg && this.bg.setSize(this.hook.size.x, 223 + this.containerHeightOffset)
        },
        show: function() {
            this.parent()
        },
        hide: function() {
            this.parent();
            this.currentList.deactivate()
        },
        onClearPrevContent: function() {
            if (this.currentList) {
                this.currentList.deactivate();
                this.currentList.doStateTransition("HIDDEN", true)
            }
        },
        onSetCacheContent: function(b, a, d) {
            this.currentList = b.list;
            this.currentGroup = b.buttongroup;
            this.currentList.activate();
            this.currentList.doStateTransition("DEFAULT", true);
            ig.input.mouseGuiActive ? this.currentGroup.setRegainFocus() : this.currentGroup.regainCurrentFocus(false, d && d.skipSounds)
        },
        onContentCreation: function() {
            var b = {
                buttongroup: null,
                list: null,
                sort: this.onInitSortType() || sc.LORE_SORT_TYPE.ORDER
            };
            this.currentGroup = new sc.ButtonGroup;
            this.currentList =
                new sc.ButtonListBox(1, this.listPadding, this.listPageSize);
            this.currentList.setPos(0, 35 + this.listPosOffset);
            this.currentList.setSize(this.hook.size.x, 223 + this.containerHeightOffset + this.listHeightOffset);
            this.currentList.setButtonGroup(this.currentGroup);
            this.currentList.hook.transitions = {
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
            this.addChildGui(this.currentList);
            this.currentGroup.isNonMouseMenuInput = this.isNonMouseMenuInput.bind(this);
            this.currentGroup.onButtonTraversal = this.onButtonTraversal.bind(this);
            this.currentGroup.addSelectionCallback(function(a) {
                this.onListEntrySelected(a)
            }.bind(this));
            this.currentGroup.setMouseFocusLostCallback(function() {
                this.onListMouseFocusLost()
            }.bind(this));
            this.currentGroup.addPressCallback(function(a) {
                this.onListEntryPressed(a)
            }.bind(this));
            this.onCreateListEntries(this.currentList, this.currentGroup, this.getCurrentTabButton().data.type, b.sort);
            b.buttongroup = this.currentGroup;
            b.list = this.currentList;
            this.currentList.activate();
            return b
        },
        sort: function(b) {
            var a = this.tabArray[this.currentTabIndex].data.type;
            this.tabContent[this.currentTabIndex].sort = b;
            this.onCreateListEntries(this.currentList, this.currentGroup, a, b);
            ig.input.mouseGuiActive ? this.currentGroup.setRegainFocus() : this.currentGroup.regainCurrentFocus(false, true)
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() || sc.control.downDown() || sc.control.upDown()
        },
        onButtonTraversal: function() {
            var b = -1;
            sc.control.menuCircleRight() ?
                b = 1 : sc.control.menuCircleLeft() && (b = 0);
            this.switchTab(b)
        },
        switchTab: function(b) {
            var a = this.currentTabIndex,
                d = this.getCurrentTabButton();
            if (b >= 0) {
                d.setPressed(false);
                if (b == 1) {
                    a++;
                    a >= this.tabArray.length && (a = 0)
                } else {
                    a--;
                    a < 0 && (a = this.tabArray.length - 1)
                }
                this._prevPressed = d = this.tabArray[a];
                d.setPressed(true);
                b = this.onLeftRightPress(d, a, b);
                this.setTab(a, false, b);
                this.resetButtons(d, true);
                this.rearrangeTabs()
            }
        },
        onInitSortType: function() {
            return 0
        },
        onListEntryPressed: function() {},
        onListEntrySelected: function() {},
        onListMouseFocusLost: function() {},
        onLeftRightPress: function() {},
        onCreateListEntries: function() {}
    })
});
ig.baked = !0;
