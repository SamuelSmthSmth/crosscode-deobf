ig.module("game.feature.menu.gui.options.options-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.options.options-types").defines(function() {
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
        init: function(b) {
            this.parent();
            this.setSize(436, 258);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.isLocal = b;
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
            this.tabGroup.addPressCallback(function(a) {
                if (this.prevPressed != a) {
                    this.submitSound.play();
                    this.prevPressed = a;
                    a.setPressed(true);
                    this._resetButtons(a);
                    this._rearrangeTabs();
                    sc.menu.optionLastButtonData = a.data;
                    for (var b = this.tabArray.length; b--;)
                        if (a == this.tabArray[b]) {
                            this._refocusFromCycle = b;
                            sc.menu.setOptionTab(b);
                            break
                        } ig.input.mouseGuiActive && sc.menu.setInfoText("")
                }
            }.bind(this));
            b = new sc.MenuPanel;
            b.setSize(436, 242);
            b.setPos(0, 21);
            this.addChildGui(b);
            this.bg =
                new sc.MenuScanLines;
            this.bg.setPos(0, 29);
            this.bg.setSize(436, 228);
            this.addChildGui(this.bg);
            b = new ig.ImageGui(this.gfx, 32, 408, 5, 5);
            b.setPos(0, 21);
            this.addChildGui(b);
            b = new ig.ColorGui("#FF6D00", 431, 1);
            b.setPos(5, 21);
            this.addChildGui(b);
            b = 0;
            this.tabs.general = this._createTabButton("general", b++, sc.OPTION_CATEGORY.GENERAL);
            this.tabs.interface = this._createTabButton("interface", b++, sc.OPTION_CATEGORY.INTERFACE);
            this.tabs.video = this._createTabButton("video", b++, sc.OPTION_CATEGORY.VIDEO);
            this.tabs.gamepad =
                this._createTabButton("gamepad", b++, sc.OPTION_CATEGORY.GAMEPAD);
            if (ig.vars.get("arenaVars.statsUnlocked")) this.tabs.arena = this._createTabButton("arena", b++, sc.OPTION_CATEGORY.ARENA);
            this.tabs.controls = this._createTabButton("controls", b++, sc.OPTION_CATEGORY.CONTROLS);
            this.tabs.assists = this._createTabButton("assists", b, sc.OPTION_CATEGORY.ASSISTS);
            sc.menu.optionLastButtonData = this.tabs.general.data;
            this.tabGroup.setCurrentFocus(0, 0);
            this.tabs.general.setPressed(true);
            this.prevPressed = this.tabs.general;
            this._rearrangeTabs();
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            sc.menu.buttonInteract.addParallelGroup(this.tabGroup);
            ig.interact.setBlockDelay(0.2);
            this.keyBinder = new sc.KeyBinderGui;
            ig.gui.addGuiElement(this.keyBinder);
            sc.keyBinderGui = this.keyBinder;
            var b = sc.menu.optionLastButtonData;
            b && this._createCacheList(b.type, true, ig.input.mouseGuiActive, true);
            this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeParallelGroup(this.tabGroup);
            sc.options.persistOptions();
            this.list.deactivate();
            this.keyBinder.remove();
            sc.keyBinderGui = null;
            this.doStateTransition("HIDDEN")
        },
        _createCacheList: function(b, a, d, c) {
            a = a || false;
            d = d || false;
            c = c || false;
            if (this.tabContent[this.prevIndex]) {
                this.list.deactivate();
                this.list.doStateTransition("HIDDEN", true)
            }
            var e = sc.menu.optionCurrentTab,
                f = this.tabContent[e];
            if (f) {
                this.list = f.list;
                this.rows = f.rows;
                this.rowButtonGroup = f.buttonGroup;
                this.list.activate();
                this.list.doStateTransition("DEFAULT", true);
                a && !d && this.rowButtonGroup.regainCurrentFocus(false, c)
            } else {
                f = {
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
                this.rowButtonGroup.addSelectionCallback(function(a) {
                    a.data && sc.menu.setInfoText(a.data.description ? a.data.description : a.data)
                }.bind(this));
                this.rowButtonGroup.setLeftRightCallback(function(a, b) {
                    return this.rows[b] ? this.rows[b].onLeftRight(a) : true
                }.bind(this));
                this.rowButtonGroup.addPressCallback(function(a) {
                    if (a.data && a.data.row !=
                        void 0) this.rows[a.data.row].onPressed(a)
                }.bind(this));
                this.rowButtonGroup.onButtonTraversal = this.onButtonTraversal.bind(this);
                if (b == sc.OPTION_CATEGORY.CONTROLS) this.rowButtonGroup.usePrevRowIndex = true;
                this._createOptionList(b);
                f.buttonGroup = this.rowButtonGroup;
                f.list = this.list;
                f.rows = this.rows;
                this.list.activate();
                this.tabContent[e] = f;
                this.prevIndex = e
            }
        },
        _createOptionList: function(b) {
            var a = [],
                d = null,
                d = null,
                c = false,
                e = 0,
                d = sc.OPTIONS_DEFINITION,
                f;
            for (f in d) {
                d = sc.OPTIONS_DEFINITION[f];
                c = false;
                if (d.cat ==
                    b) {
                    d.browser ? ig.platform == ig.PLATFORM_TYPES.BROWSER && (c = true) : d.noBrowser ? ig.platform != ig.PLATFORM_TYPES.BROWSER && (c = true) : c = true;
                    if (c) {
                        d = d.type == "INFO" ? new sc.OptionInfoBox(d, 431) : new sc.OptionRow(f, e, this.rowButtonGroup, this.isLocal, 431);
                        this.list.addButton(d, true);
                        a[e] = d;
                        e++
                    }
                }
            }
            this.rows = a
        },
        _resetButtons: function(b, a) {
            for (var d = 0; d < this.tabArray.length; d++) {
                b != this.tabArray[d] && this.tabArray[d].setPressed(false);
                if (a) this.tabArray[d].focus = false
            }
        },
        _rearrangeTabs: function() {
            for (var b = 9, a = null, d =
                    0; d < this.tabArray.length; d++) {
                a = this.tabArray[d];
                a.hook.pos.x = b;
                b = b + a.hook.size.x
            }
        },
        _createTabButton: function(b, a, d) {
            b = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.option." + b), b, 90);
            b.textChild.setPos(7, 1);
            b.setPos(0, 2);
            b.setData({
                type: d
            });
            this.addChildGui(b);
            this.tabGroup.addFocusGui(b, a, 0);
            return this.tabArray[a] = b
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() ||
                sc.control.menuCircleRight()
        },
        onButtonTraversal: function() {
            var b = sc.menu.optionCurrentTab,
                a = this.tabArray[b],
                d = -1;
            sc.control.menuCircleRight() ? d = 1 : sc.control.menuCircleLeft() && (d = 0);
            if (d >= 0) {
                this.submitSound.play();
                a.setPressed(false);
                if (d == 1) {
                    b++;
                    b >= this.tabArray.length && (b = 0)
                } else {
                    b--;
                    b < 0 && (b = this.tabArray.length - 1)
                }
                this.prevPressed = a = this.tabArray[b];
                a.setPressed(true);
                this._resetButtons(a, true);
                this._rearrangeTabs();
                sc.menu.optionLastButtonData = a.data;
                sc.menu.setOptionTab(b)
            }
        },
        modelChanged: function(b,
            a) {
            b == sc.menu && a == sc.MENU_EVENT.OPTION_CHANGED_TAB && this._createCacheList(sc.menu.optionLastButtonData.type, true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive)
        }
    })
});
ig.baked = !0;
