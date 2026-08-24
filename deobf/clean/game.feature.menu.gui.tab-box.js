/**
 * game.feature.menu.gui.tab-box
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.tab-box")`.
 *
 * Tabbed menu panes:
 * - `sc.TabbedPane`: a menu panel with a row of tab buttons on top (each
 *   tab keyed by string, laid out in a `sc.ButtonGroup`). Switching tabs
 *   lazily creates the tab content (cached when `cacheContent` is true),
 *   fires onTabChanged/onTabPressed/onTabSelected hooks, and manages the
 *   pressed states + highlight bar.
 * - `sc.ListTabbedPane`: a `sc.TabbedPane` whose tab contents are a
 *   `sc.ButtonListBox` backed by a `sc.ButtonGroup`; supports sort,
 *   left/right tab cycling via shoulder input, and list entry callbacks.
 */
ig.module("game.feature.menu.gui.tab-box")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes")
    .defines(function () {

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

        init: function (cacheContent) {
            this.parent();
            this.cacheContent = cacheContent == void 0 ? true : cacheContent;
            this.menuPanel = new sc.MenuPanel;
            this.menuPanel.setSize(100, 200);
            this.menuPanel.setPos(0, 21);
            this.addChildGui(this.menuPanel);
            cacheContent = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            cacheContent.setPos(0, 21);
            this.addChildGui(cacheContent);
            this.menuHighlight = new ig.ColorGui("#FF6D00", 95, 1);
            this.menuHighlight.setPos(5, 21);
            this.addChildGui(this.menuHighlight);
            this.setSize(100, 200);
            this.tabGroup = new sc.ButtonGroup;
            this.tabGroup.addPressCallback(function (button) {
                if (this._prevPressed != button) {
                    button.setPressed(true);
                    this._prevPressed = button;
                    this.resetButtons(button);
                    this.rearrangeTabs();
                    if (this.onTabPressed(button, false)) this.setTab(this.getButtonIndex(button))
                } else this.onTabPressed(button, true)
            }.bind(this));
            this.tabGroup.addSelectionCallback(function (button) {
                this.onTabSelected(button)
            }.bind(this));
            this.tabGroup.setMouseFocusLostCallback(function () {
                this.onTabMouseFocusLost()
            }.bind(this))
        },

        setSize: function (width, height) {
            this.parent(width, height);
            this.menuHighlight.setSize(width - 5, 1)
        },

        setPanelSize: function (width, height) {
            this.menuPanel.setSize(width, height)
        },

        addTab: function (key, index, data) {
            data = this.onTabButtonCreation(key, index, data);
            if (!data) throw Error("Tab Button Creation failed for index: " + index);
            this.tabGroup.addFocusGui(data, index, 0);
            this.tabArray[index] = data;
            this.tabs[key] = data;
            this.keys[index] = key;
            this.rearrangeTabs();
            if (this.tabArray.length == 1) {
                this.currentTabIndex = 0;
                this.tabGroup.setCurrentFocus(0, 0);
                this.tabs[key].setPressed(true);
                this._prevPressed = this.tabs[key]
            }
        },

        setTab: function (index, noCacheSwitch, params) {
            if (noCacheSwitch) this._prevIndex = -1;
            if (this._prevIndex != index) {
                if (!this.tabArray[index]) throw Error("No such tab at index: " + index);
                if (this.currentTabIndex >= 0 && this._prevIndex >= 0)
                    if (noCacheSwitch = this.tabContent[this._prevIndex]) this.onClearPrevContent(noCacheSwitch, params);
                this.currentTabIndex = index;
                if (this.currentContent && this.onClearCurrentContent) this.onClearCurrentContent(this.currentContent);
                this.currentContent = null;
                noCacheSwitch = this._prevIndex;
                this._prevIndex = this.currentTabIndex;
                var cached = this.tabContent[index];
                if (cached) {
                    this.onSetCacheContent(cached, index, params);
                    this.onTabChanged(this.currentTabIndex, noCacheSwitch, params)
                } else {
                    this.currentContent = this.onContentCreation(index, params);
                    if (this.cacheContent) this.tabContent[this.currentTabIndex] = this.currentContent;
                    this.onTabChanged(this.currentTabIndex, noCacheSwitch)
                }
            }
        },

        show: function (tabIndex) {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            if (tabIndex != void 0) this.setTab(tabIndex)
        },

        hide: function () {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup)
        },

        rearrangeTabs: function () {
            for (var offsetX = 9, button = null, i = 0; i < this.tabArray.length; i++) {
                button = this.tabArray[i];
                button.hook.pos.x = offsetX;
                offsetX = offsetX + button.hook.size.x
            }
        },

        resetButtons: function (exclude, clearFocus) {
            for (var i = 0; i < this.tabArray.length; i++) {
                if (exclude != this.tabArray[i]) this.tabArray[i].setPressed(false);
                if (clearFocus) this.tabArray[i].focus = false
            }
        },

        getCurrentTabButton: function () {
            return this.currentTabIndex <= -1 ? null : this.tabArray[this.currentTabIndex]
        },

        getCurrentTabKey: function () {
            return this.keys[this.currentTabIndex]
        },

        getButtonIndex: function (button) {
            return this.tabArray.indexOf(button)
        },

        onTabSelected: function () {},
        onTabPressed: function () {},
        onTabButtonCreation: function () {},
        onTabMouseFocusLost: function () {},
        onTabChanged: function () {},
        onClearPrevContent: function () {},
        onContentCreation: function () {},
        onSetCacheContent: function () {}
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

        init: function (cacheContent, defaultSortType) {
            this.parent(cacheContent);
            this.defaultSortType = defaultSortType || 0;
            this.bg = new sc.MenuScanLines;
            this.bg.setPos(0, 35);
            this.bg.setSize(this.hook.size.x, 223 + this.containerHeightOffset);
            this.addChildGui(this.bg)
        },

        update: function () {
            if (this.currentGroup && this.currentGroup.isActive() && ig.input.mouseGuiActive) this.onButtonTraversal()
        },

        setSize: function (width, height) {
            this.parent(width, height);
            if (this.bg) this.bg.setSize(this.hook.size.x, 223 + this.containerHeightOffset)
        },

        show: function () {
            this.parent()
        },

        hide: function () {
            this.parent();
            this.currentList.deactivate()
        },

        onClearPrevContent: function () {
            if (this.currentList) {
                this.currentList.deactivate();
                this.currentList.doStateTransition("HIDDEN", true)
            }
        },

        onSetCacheContent: function (content, index, params) {
            this.currentList = content.list;
            this.currentGroup = content.buttongroup;
            this.currentList.activate();
            this.currentList.doStateTransition("DEFAULT", true);
            if (ig.input.mouseGuiActive) this.currentGroup.setRegainFocus();
            else this.currentGroup.regainCurrentFocus(false, params && params.skipSounds)
        },

        onContentCreation: function () {
            var content = {
                buttongroup: null,
                list: null,
                sort: this.onInitSortType() || sc.LORE_SORT_TYPE.ORDER
            };
            this.currentGroup = new sc.ButtonGroup;
            this.currentList = new sc.ButtonListBox(1, this.listPadding, this.listPageSize);
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
            this.currentGroup.addSelectionCallback(function (button) {
                this.onListEntrySelected(button)
            }.bind(this));
            this.currentGroup.setMouseFocusLostCallback(function () {
                this.onListMouseFocusLost()
            }.bind(this));
            this.currentGroup.addPressCallback(function (button) {
                this.onListEntryPressed(button)
            }.bind(this));
            this.onCreateListEntries(this.currentList, this.currentGroup, this.getCurrentTabButton().data.type, content.sort);
            content.buttongroup = this.currentGroup;
            content.list = this.currentList;
            this.currentList.activate();
            return content
        },

        sort: function (sortType) {
            var tabType = this.tabArray[this.currentTabIndex].data.type;
            this.tabContent[this.currentTabIndex].sort = sortType;
            this.onCreateListEntries(this.currentList, this.currentGroup, tabType, sortType);
            if (ig.input.mouseGuiActive) this.currentGroup.setRegainFocus();
            else this.currentGroup.regainCurrentFocus(false, true)
        },

        isNonMouseMenuInput: function () {
            return sc.control.menuConfirm() || sc.control.downDown() || sc.control.upDown()
        },

        onButtonTraversal: function () {
            var direction = -1;
            if (sc.control.menuCircleRight()) direction = 1;
            else if (sc.control.menuCircleLeft()) direction = 0;
            this.switchTab(direction)
        },

        switchTab: function (direction) {
            var tabIndex = this.currentTabIndex,
                tabButton = this.getCurrentTabButton();
            if (direction >= 0) {
                tabButton.setPressed(false);
                if (direction == 1) {
                    tabIndex++;
                    if (tabIndex >= this.tabArray.length) tabIndex = 0
                } else {
                    tabIndex--;
                    if (tabIndex < 0) tabIndex = this.tabArray.length - 1
                }
                this._prevPressed = tabButton = this.tabArray[tabIndex];
                tabButton.setPressed(true);
                direction = this.onLeftRightPress(tabButton, tabIndex, direction);
                this.setTab(tabIndex, false, direction);
                this.resetButtons(tabButton, true);
                this.rearrangeTabs()
            }
        },

        onInitSortType: function () {
            return 0
        },

        onListEntryPressed: function () {},
        onListEntrySelected: function () {},
        onListMouseFocusLost: function () {},
        onLeftRightPress: function () {},
        onCreateListEntries: function () {}
    })
});
ig.baked = !0;
