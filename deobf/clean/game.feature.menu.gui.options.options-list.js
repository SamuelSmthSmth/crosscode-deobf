/**
 * game.feature.menu.gui.options.options-list
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.options.options-list")`.
 *
 * `sc.OptionsTabBox`: the options pane container — the tab buttons
 * (general / interface / video / gamepad / arena / controls / assists),
 * the per-tab option row list (`sc.ButtonListBox` of `sc.OptionRow` /
 * `sc.OptionInfoBox` from `options-types`), and the global key-binder GUI
 * (`sc.KeyBinderGui`, shared via `sc.keyBinderGui`). Handles tab cycling
 * with the menu-shoulder buttons and cache/reuse of each tab's list.
 */
ig.module("game.feature.menu.gui.options.options-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.options.options-types")
    .defines(function () {

    sc.keyBinderGui = null;

    sc.OptionsTabBox = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        list: null,
        tabs: {
            general: null,
            "interface": null,
            video: null,
            audio: null,
            controls: null,
            assists: null,
            arena: null
        },
        bg: null,
        keyBinder: null,
        tabArray: [],
        tabGroup: null,
        rowButtonGroup: null,
        tabContent: [],
        rows: [],
        prevIndex: -1,
        prevPressed: null,
        isLocal: false,

        init: function (isLocal) {
            this.parent();
            this.setSize(436, 258);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.isLocal = isLocal;
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
                }
            };
            this.tabGroup = new sc.ButtonGroup;
            this.tabGroup.addPressCallback(function (button) {
                if (this.prevPressed != button) {
                    this.submitSound.play();
                    this.prevPressed = button;
                    button.setPressed(true);
                    this._resetButtons(button);
                    this._rearrangeTabs();
                    sc.menu.optionLastButtonData = button.data;
                    for (var i = this.tabArray.length; i--;)
                        if (button == this.tabArray[i]) {
                            this._refocusFromCycle = i;
                            sc.menu.setOptionTab(i);
                            break
                        }
                    ig.input.mouseGuiActive && sc.menu.setInfoText("")
                }
            }.bind(this));
            var panel = new sc.MenuPanel;
            panel.setSize(436, 242);
            panel.setPos(0, 21);
            this.addChildGui(panel);
            this.bg = new sc.MenuScanLines;
            this.bg.setPos(0, 29);
            this.bg.setSize(436, 228);
            this.addChildGui(this.bg);
            panel = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            panel.setPos(0, 21);
            this.addChildGui(panel);
            panel = new ig.ColorGui("#FF6D00", 431, 1);
            panel.setPos(5, 21);
            this.addChildGui(panel);
            var tabIndex = 0;
            this.tabs.general = this._createTabButton("general", tabIndex++, sc.OPTION_CATEGORY.GENERAL);
            this.tabs.interface = this._createTabButton("interface", tabIndex++, sc.OPTION_CATEGORY.INTERFACE);
            this.tabs.video = this._createTabButton("video", tabIndex++, sc.OPTION_CATEGORY.VIDEO);
            this.tabs.gamepad = this._createTabButton("gamepad", tabIndex++, sc.OPTION_CATEGORY.GAMEPAD);
            if (ig.vars.get("arenaVars.statsUnlocked")) this.tabs.arena = this._createTabButton("arena", tabIndex++, sc.OPTION_CATEGORY.ARENA);
            this.tabs.controls = this._createTabButton("controls", tabIndex++, sc.OPTION_CATEGORY.CONTROLS);
            this.tabs.assists = this._createTabButton("assists", tabIndex, sc.OPTION_CATEGORY.ASSISTS);
            sc.menu.optionLastButtonData = this.tabs.general.data;
            this.tabGroup.setCurrentFocus(0, 0);
            this.tabs.general.setPressed(true);
            this.prevPressed = this.tabs.general;
            this._rearrangeTabs();
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            ig.interact.setBlockDelay(0.2);
            this.keyBinder = new sc.KeyBinderGui;
            ig.gui.addGuiElement(this.keyBinder);
            sc.keyBinderGui = this.keyBinder;
            var lastButtonData = sc.menu.optionLastButtonData;
            lastButtonData && this._createCacheList(lastButtonData.type, true, ig.input.mouseGuiActive, true);
            this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
            sc.options.persistOptions();
            this.list.deactivate();
            this.keyBinder.remove();
            sc.keyBinderGui = null;
            this.doStateTransition("HIDDEN")
        },

        _createCacheList: function (category, refocus, mouseActive, hardFocus) {
            refocus = refocus || false;
            mouseActive = mouseActive || false;
            hardFocus = hardFocus || false;
            if (this.tabContent[this.prevIndex]) {
                this.list.deactivate();
                this.list.doStateTransition("HIDDEN", true)
            }
            var currentTab = sc.menu.optionCurrentTab,
                cached = this.tabContent[currentTab];
            if (cached) {
                this.list = cached.list;
                this.rows = cached.rows;
                this.rowButtonGroup = cached.buttonGroup;
                this.list.activate();
                this.list.doStateTransition("DEFAULT", true);
                refocus && !mouseActive && this.rowButtonGroup.regainCurrentFocus(false, hardFocus)
            } else {
                cached = {
                    buttonGroup: null,
                    list: null,
                    rows: null
                };
                this.rowButtonGroup = new sc.RowButtonGroup;
                this.rowButtonGroup.enableMultiPressed = true;
                this.rowButtonGroup.soundsOnPressed = true;
                this.list = new sc.ButtonListBox(1, 1, 28);
                this.list.setPos(0, 29);
                this.list.setSize(436, 228);
                this.list.setButtonGroup(this.rowButtonGroup);
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
                this.rowButtonGroup.isNonMouseMenuInput = this.isNonMouseMenuInput.bind(this);
                this.rowButtonGroup.addSelectionCallback(function (button) {
                    button.data && sc.menu.setInfoText(button.data.description ? button.data.description : button.data)
                }.bind(this));
                this.rowButtonGroup.setLeftRightCallback(function (direction, index) {
                    return this.rows[index] ? this.rows[index].onLeftRight(direction) : true
                }.bind(this));
                this.rowButtonGroup.addPressCallback(function (button) {
                    if (button.data && button.data.row != void 0) this.rows[button.data.row].onPressed(button)
                }.bind(this));
                this.rowButtonGroup.onButtonTraversal = this.onButtonTraversal.bind(this);
                if (category == sc.OPTION_CATEGORY.CONTROLS) this.rowButtonGroup.usePrevRowIndex = true;
                this._createOptionList(category);
                cached.buttonGroup = this.rowButtonGroup;
                cached.list = this.list;
                cached.rows = this.rows;
                this.list.activate();
                this.tabContent[currentTab] = cached;
                this.prevIndex = currentTab
            }
        },

        _createOptionList: function (category) {
            var rows = [],
                definition = null,
                browserOk = false,
                rowIndex = 0;
            for (var key in sc.OPTIONS_DEFINITION) {
                definition = sc.OPTIONS_DEFINITION[key];
                browserOk = false;
                if (definition.cat == category) {
                    definition.browser ? ig.platform == ig.PLATFORM_TYPES.BROWSER && (browserOk = true) : definition.noBrowser ? ig.platform != ig.PLATFORM_TYPES.BROWSER && (browserOk = true) : browserOk = true;
                    if (browserOk) {
                        var row = definition.type == "INFO" ? new sc.OptionInfoBox(definition, 431) : new sc.OptionRow(key, rowIndex, this.rowButtonGroup, this.isLocal, 431);
                        this.list.addButton(row, true);
                        rows[rowIndex] = row;
                        rowIndex++
                    }
                }
            }
            this.rows = rows
        },

        _resetButtons: function (pressedButton, alsoUnfocus) {
            for (var i = 0; i < this.tabArray.length; i++) {
                pressedButton != this.tabArray[i] && this.tabArray[i].setPressed(false);
                if (alsoUnfocus) this.tabArray[i].focus = false
            }
        },

        _rearrangeTabs: function () {
            for (var x = 9, button = null, i = 0; i < this.tabArray.length; i++) {
                button = this.tabArray[i];
                button.hook.pos.x = x;
                x = x + button.hook.size.x
            }
        },

        _createTabButton: function (name, index, category) {
            var button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.option." + name), name, 90);
            button.textChild.setPos(7, 1);
            button.setPos(0, 2);
            button.setData({
                type: category
            });
            this.addChildGui(button);
            this.tabGroup.addFocusGui(button, index, 0);
            return this.tabArray[index] = button
        },

        isNonMouseMenuInput: function () {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() || sc.control.menuCircleRight()
        },

        onButtonTraversal: function () {
            var currentTab = sc.menu.optionCurrentTab,
                button = this.tabArray[currentTab],
                direction = -1;
            sc.control.menuCircleRight() ? direction = 1 : sc.control.menuCircleLeft() && (direction = 0);
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
                this.prevPressed = button = this.tabArray[currentTab];
                button.setPressed(true);
                this._resetButtons(button, true);
                this._rearrangeTabs();
                sc.menu.optionLastButtonData = button.data;
                sc.menu.setOptionTab(currentTab)
            }
        },

        modelChanged: function (model, event, data) {
            model == sc.menu && event == sc.MENU_EVENT.OPTION_CHANGED_TAB && this._createCacheList(sc.menu.optionLastButtonData.type, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive)
        }
    })
});
ig.baked = !0;
