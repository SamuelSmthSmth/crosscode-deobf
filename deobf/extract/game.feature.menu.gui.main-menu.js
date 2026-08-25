ig.module("game.feature.menu.gui.main-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes").defines(function() {
    sc.MainMenu = ig.GuiElementBase.extend({
        screenBlocking: true,
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
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
        submenus: {},
        topBar: null,
        hotkeyBar: null,
        smallRhombus: null,
        lea: null,
        sline: null,
        moneyTime: null,
        menuDisplay: null,
        backButton: null,
        info: null,
        buffInfo: null,
        subMenuInsertPos: 0,
        init: function() {
            this.parent();
            this.hook.zIndex = 1200;
            this.hook.pauseGui = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.hook.screenBlocking = true;
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.model.menu, this);
            this.doStateTransition("HIDDEN", true);
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(0, 0, 32, 320, ig.ImagePattern.OPT.REPEAT_X);
            this.submenus.start = new sc.StartMenu;
            var d = new sc.ButtonGui("\\i[back]" + ig.lang.get("sc.gui.menu.back"), sc.BUTTON_TOP_MENU_WIDTH, true, sc.BUTTON_TYPE.SMALL, sc.BUTTON_SOUND.back);
            d.keepMouseFocus = true;
            d.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetX: -sc.BUTTON_TOP_MENU_WIDTH
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            d.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            d.onButtonPress = function() {
                sc.menu.invokeTopBackButton()
            }.bind(this);
            d.setData(ig.lang.get("sc.gui.menu.description.back"));
            this.backButton = d;
            d = new ig.ColorGui("#000000", this.hook.size.x, 21);
            d.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            d.hook.transitions = {
                DEFAULT: {
                    state: {
                        alpha: 0.5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -21,
                        alpha: 0.5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            d.doStateTransition("HIDDEN", true);
            this.topBar = d;
            d = new sc.MainMenu.TopBar(this.hook.size.x);
            d.doStateTransition("HIDDEN", true);
            this.hotkeyBar = d;
            d = new sc.MainMenu.SmallRhombus;
            d.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.smallRhombus = d;
            this.info = new sc.InfoBar(this.hook.size.x, 21);
            this.info.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.buffInfo = new sc.BuffInfo;
            this.moneyTime = new sc.TimeAndMoneyGUI;
            this.lea = new sc.MainMenu.Lea;
            this.lea.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.lea.setPos(0, 101);
            this.sline = new sc.MainMenu.StatusLine;
            this.sline.setPos(b, a);
            this.menuDisplay = new sc.MainMenu.CurrentMenuDisplay;
            this.menuDisplay.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.smallRhombus);
            this.addChildGui(this.sline);
            this.addChildGui(this.lea);
            this.addChildGui(this.submenus.start);
            this.addChildGui(this.topBar);
            this.addChildGui(this.hotkeyBar);
            this.addChildGui(this.info);
            this.info.addChildGui(this.buffInfo);
            this.addChildGui(this.moneyTime);
            this.addChildGui(this.menuDisplay);
            this.addChildGui(this.backButton);
            sc.menu.guiReference = this
        },
        update: function() {
            this.parent()
        },
        updateDrawables: function(a) {
            a.addPattern(this.constructor.PATTERN, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
        },
        _checkBackButtonInput: function() {
            return sc.control.menuBack()
        },
        _onBackButton: function() {
            sc.model.enterPrevSubState()
        },
        _enterMenu: function() {
            this._preCleanUp();
            sc.trophies.validateFeatPoints();
            this.hotkeyBar.enterMenu();
            if (sc.menu.directMode && sc.menu.directMenu) {
                this._switchMenus(sc.menu.directMenu, 0);
                this._makeExtraTransitions(sc.menu.directMenu, null, true);
                this.menuDisplay.pushMenuDisplay(sc.menu.getMenuAsName(sc.menu.directMenu));
                sc.menu.currentMenu = sc.menu.directMenu
            } else {
                sc.menu.directMode = false;
                this.submenus.start.showMenu();
                this.menuDisplay.pushMenuDisplay(ig.lang.get("sc.gui.menu.menu-titles.start"));
                this.lea.reset();
                this.lea.doStateTransition("DEFAULT");
                this.info.doSizeTransition(431, 21);
                this.moneyTime.doStateTransition("DEFAULT");
                this.smallRhombus.doStateTransition("DEFAULT");
                this.sline.showLine()
            }
            sc.menu.enterMenu();
            sc.menu.buttonInteract.addGlobalButton(this.backButton, this._checkBackButtonInput.bind(this));
            sc.menu.pushBackCallback(this._onBackButton.bind(this));
            var a = this._getMenuFromID(sc.menu.currentMenu);
            a.onPostDirectEnter && a.onPostDirectEnter();
            this.backButton.doStateTransition("DEFAULT");
            this.topBar.doStateTransition("DEFAULT");
            this.info.doStateTransition("DEFAULT")
        },
        _exitMenu: function() {
            this._getMenuFromID(sc.menu.currentMenu).exitMenu();
            this.submenus.start.exitMenu();
            sc.menu.buttonInteract.clearAllButtons();
            sc.menu.exitMenu();
            ig.interact.setBlockDelay(0.2);
            this.backButton.doStateTransition("HIDDEN");
            this.topBar.doStateTransition("HIDDEN");
            this.hotkeyBar.exitMenu();
            this.smallRhombus.doStateTransition("HIDDEN");
            this.info.doStateTransition("HIDDEN");
            this.moneyTime.doStateTransition("HIDDEN");
            this.sline.hideLine();
            this.lea.hideLea();
            this.menuDisplay.hideDisplay()
        },
        _preCleanUp: function() {
            this.buffInfo.setText("");
            this.info.setText("");
            this.menuDisplay.reset();
            this.moneyTime.updateCredit();
            this._postCleanUp()
        },
        _postCleanUp: function() {
            for (var a in this.submenus)
                if (a != "start" && this.submenus[a]) {
                    this.removeChildGui(this.submenus[a]);
                    this.submenus[a] && this.submenus[a].removeObservers();
                    this.submenus[a] = null
                } this.hotkeyBar.cleanChildren()
        },
        _switchMenus: function(a, b) {
            this._createMenu(a);
            var e =
                this._getMenuFromID(b),
                f = this._getMenuFromID(a);
            if (e != null) {
                e.hideMenu(f, a);
                f.showMenu(e, b)
            }
        },
        _createMenu: function(a) {
            if (a != sc.MENU_SUBMENU.START && !this.submenus[sc.SUB_MENU_INFO[a].name]) {
                this.submenus[sc.SUB_MENU_INFO[a].name] = new sc.SUB_MENU_INFO[a].Clazz;
                this.insertChildGui(this.submenus[sc.SUB_MENU_INFO[a].name], 4)
            }
        },
        _getMenuFromID: function(a) {
            return this.submenus[sc.SUB_MENU_INFO[a].name]
        },
        _makeExtraTransitions: function(a, b, e) {
            switch (a) {
                case sc.MENU_SUBMENU.START:
                    this.smallRhombus.doStateTransition("DEFAULT",
                        e);
                    this.sline.showLine(0.1);
                    break;
                default:
                    this.smallRhombus.doStateTransition("HIDDEN", e);
                    this.sline.hideLineFade()
            }
            if (a == sc.MENU_SUBMENU.START || a == sc.MENU_SUBMENU.STATUS && sc.menu.statusPage == 0 && !sc.menu.helpMenuOpen) {
                this.info.doSizeTransition(431, 21, 0.1, KEY_SPLINES.EASE_OUT);
                this.moneyTime.doStateTransition("DEFAULT_FAST")
            } else {
                this.info.doSizeTransition(ig.system.width, 21, 0.1, KEY_SPLINES.EASE_OUT);
                this.moneyTime.doStateTransition("HIDDEN_FAST")
            }
        },
        modelChanged: function(a, b, e) {
            if (a == sc.model)
                if (b ==
                    sc.GAME_MODEL_MSG.SUB_STATE_CHANGED) {
                    (a = sc.model.isMenu()) ? this.doStateTransition("DEFAULT", false, false, function() {
                        sc.menu.fullyEntered()
                    }.bind(this)): this.doStateTransition("HIDDEN", false, false, function() {
                        this._postCleanUp();
                        sc.menu.invokePostExit()
                    }.bind(this));
                    a ? this._enterMenu() : this._exitMenu()
                } else b == sc.GAME_MODEL_MSG.RESET_MENU_STATE && this.submenus.start.resetButtonFocus();
            else if (a == sc.menu)
                if (b == sc.MENU_EVENT.INFO_TEXT_CHANGED) this.info.setText(sc.menu.infoText, e ? 0.5 : 0);
                else if (b == sc.MENU_EVENT.ENTER_MENU ||
                b == sc.MENU_EVENT.LEAVE_MENU) {
                this.hotkeyBar.hideHotkeys();
                this._switchMenus(sc.menu.currentMenu, sc.menu.previousMenu);
                this._makeExtraTransitions(sc.menu.currentMenu, sc.menu.previousMenu)
            } else if (b == sc.MENU_EVENT.REMOVE_HOTKEYS) this.hotkeyBar.hideHotkeys();
            else if (b == sc.MENU_EVENT.TOP_BAR_CHANGED) this.hotkeyBar.addHotkeysToTopBar(e);
            else if (b == sc.MENU_EVENT.TOP_BAR_UPDATE) this.hotkeyBar.updateHotkeys(e);
            else if (b == sc.MENU_EVENT.SET_BUFF_INFO) this.buffInfo.setText(sc.menu.buffText, e ? 0.5 : 0);
            else if (b ==
                sc.MENU_EVENT.STATUS_SET_PAGE)
                if (sc.menu.statusPage == 0 && !sc.menu.helpMenuOpen) {
                    this.info.doSizeTransition(431, 21, 0.1, KEY_SPLINES.EASE_OUT);
                    this.moneyTime.doStateTransition("DEFAULT_FAST")
                } else {
                    this.info.doSizeTransition(ig.system.width, 21, 0.1, KEY_SPLINES.EASE_OUT);
                    this.moneyTime.doStateTransition("HIDDEN_FAST")
                }
        }
    });
    sc.MainMenu.TopBar = ig.GuiElementBase.extend({
        hotkeys: [],
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    offsetY: -21,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        _lateHotKeys: false,
        _hotkeyTimer: 0.2,
        _hotkeyTime: 0.2,
        init: function(a) {
            this.parent();
            this.setSize(a, 21)
        },
        update: function() {
            this.parent();
            if (this._hotkeyTimer < this._hotkeyTime) {
                this._hotkeyTimer = this._hotkeyTimer + ig.system.actualTick;
                if (this._hotkeyTimer >= this._hotkeyTime) {
                    this._hotkeyTimer = this._hotkeyTime;
                    this.hook.removeAllChildren();
                    this._lateHotKeys && this._addHotKeyButtons()
                }
            }
        },
        enterMenu: function() {
            this.hook.removeAllChildren();
            this._hotkeyTime = this._hotkeyTimer = 0.2;
            this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN", false, false, function() {
                this.hook.removeAllChildren()
            }.bind(this))
        },
        cleanChildren: function() {
            this.hook.removeAllChildren()
        },
        _addHotKeyButtons: function() {
            if (this.hook.children.length > 0) {
                ig.warn("At this point there should be no children, but there are: " + this.hook.children.length);
                this.hook.removeAllChildren()
            }
            this._positionHotKeys(true);
            for (var a = sc.menu.hotkeysCallbacks, b = 66 + (sc.options.hdMode ? 7 : 5), e = a.length; e--;) {
                var f = a[e]();
                if (f) {
                    f.setAlign(ig.GUI_ALIGN.X_RIGHT,
                        ig.GUI_ALIGN.Y_TOP);
                    f.hook.pos.x = b;
                    b = b + (f.hook.size.x + (sc.options.hdMode ? 7 : 5));
                    f.hook.doStateTransition("HIDDEN", true);
                    f.startHidden || f.hook.doStateTransition("DEFAULT");
                    this.hook.addChildHook(f.hook)
                }
            }
        },
        _positionHotKeys: function(a, b) {
            for (var e = sc.menu.hotkeysCallbacks, f = 66 + (sc.options.hdMode ? 7 : 5), g = e.length; g--;) {
                var h = e[g]();
                if (h) {
                    b && h.resetText && h.resetText();
                    h.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                    h.hook.pos.x = f;
                    f = f + (h.hook.size.x + (sc.options.hdMode ? 7 : 5));
                    if (a) {
                        h.hook.doStateTransition("HIDDEN",
                            true);
                        h.startHidden || h.hook.doStateTransition("DEFAULT");
                        this.hook.addChildHook(h.hook)
                    }
                }
            }
        },
        hideHotkeys: function() {
            var a = this.hook.children;
            if (a.length > 0) {
                this._hotkeyTimer = 0;
                this._hotkeyTime = 0.2;
                for (var b = a.length; b--;) a[b].doStateTransition("HIDDEN")
            }
        },
        addHotkeysToTopBar: function(a) {
            if (a) {
                this._hotkeyTimer = 0;
                this._hotkeyTime = 0.2
            }
            this._hotkeyTimer < this._hotkeyTime ? this._lateHotKeys = true : this._addHotKeyButtons()
        },
        updateHotkeys: function(a) {
            this._positionHotKeys(false, a)
        }
    });
    sc.MainMenu.CurrentMenuDisplay =
        ig.GuiElementBase.extend({
            boxes: [],
            init: function() {
                this.parent();
                this.setSize(120, 21);
                sc.Model.addObserver(sc.model.menu, this)
            },
            reset: function() {
                this.boxes = [];
                this.removeAllChildren()
            },
            hideDisplay: function() {
                if (this.boxes.length > 0) {
                    var a = this.boxes[this.boxes.length - 1];
                    a.hook.currentStateName != "HIDDEN_TOP" && a.doStateTransition("HIDDEN")
                }
            },
            pushMenuDisplay: function(a) {
                this.boxes.length > 0 && this.boxes[this.boxes.length - 1].doStateTransition("HIDDEN_TOP");
                a = new sc.MainMenu.SubMenuBox(a);
                this.boxes.push(a);
                this.addChildGui(a);
                a.doStateTransition("DEFAULT")
            },
            popMenuDisplay: function() {
                if (this.boxes.length > 1) {
                    var a = this.boxes[this.boxes.length - 2];
                    this.addChildGui(a);
                    a.doStateTransition("DEFAULT");
                    a = this.boxes[this.boxes.length - 1];
                    a.doStateTransition("HIDDEN", false, false, function() {}.bind(this));
                    this.boxes.pop()
                } else if (this.boxes.length > 0) {
                    a = this.boxes[this.boxes.length - 1];
                    a.doStateTransition("HIDDEN", false, false, function() {
                        this.boxes.pop()
                    }.bind(this))
                }
            },
            modelChanged: function(a, b) {
                b == sc.MENU_EVENT.ENTER_MENU ?
                    this.pushMenuDisplay(a.getCurrentMenuAsName()) : b == sc.MENU_EVENT.LEAVE_MENU && this.popMenuDisplay()
            }
        });
    sc.MainMenu.SubMenuBox = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 21,
            left: 2,
            top: 0,
            right: 7,
            bottom: 0,
            offsets: {
                "default": {
                    x: 88,
                    y: 436
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -120
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_TOP: {
                state: {
                    offsetY: -21
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        init: function(a) {
            this.parent(120, 21);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.text = new sc.TextGui(a, {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.text);
            this.doStateTransition("HIDDEN", true)
        }
    });
    var b = 64,
        a = 85;
    sc.MainMenu.StatusLine = ig.GuiElementBase.extend({
        slope: null,
        line: null,
        init: function() {
            this.parent();
            this.hook.size.x = 200;
            this.hook.size.y = 30;
            this.hook.clip = true;
            this.slope = new sc.SlopeLine(19);
            this.slope.hide();
            this.line = new ig.ColorGui("white", sc.options.hdMode ? 176 : 128, 1);
            this.line.setPos(19, 19);
            this.line.setPivot(0, 0);
            this.line.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_FADE: {
                    state: {
                        scaleX: 0,
                        alpha: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.line.doStateTransition("HIDDEN", true);
            this.addChildGui(this.slope);
            this.addChildGui(this.line)
        },
        showLine: function(a) {
            a = a != void 0 ? a :
                0;
            this.slope.doStateTransition("DEFAULT");
            this.slope.show(0.1, a);
            this.line.doStateTransition("DEFAULT", false, false, null, 0.1 + a)
        },
        hideLine: function() {
            this.line.doStateTransition("HIDDEN");
            this.slope.hide(0.1, 0.11)
        },
        hideLineFade: function() {
            this.line.doStateTransition("HIDDEN_FADE");
            this.slope.doStateTransition("HIDDEN");
            this.slope.hide(0.1, 0.11)
        }
    });
    sc.MainMenu.LeaLarge = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        skinGfx: null,
        bounds: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            FADE_TO_SMALL: {
                state: {
                    scaleX: 0.69,
                    scaleY: 0.69,
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            FADE_IN_ALPHA: {
                state: {
                    scaleX: 0.69,
                    scaleY: 0.69,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent();
            this.hook.size.x = 138;
            this.hook.size.y = 380;
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2;
            this.doStateTransition("DEFAULT")
        },
        setBounds: function(a) {
            if (this.bounds = a) {
                this.hook.size.x = a.w;
                this.hook.size.y =
                    a.h
            } else {
                this.hook.size.x = 138;
                this.hook.size.y = 380
            }
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2
        },
        updateDrawables: function(a) {
            this.skinGfx ? this.bounds ? a.addDraw().setGfx(this.skinGfx, this.bounds.offX || 0, this.bounds.offY || 0, this.bounds.x || 0, this.bounds.y || 0, this.bounds.w || 0, this.bounds.h || 0) : a.addDraw().setGfx(this.skinGfx, -6, -18, 0, 0, 144, 400) : a.addDraw().setGfx(this.gfx, 0, 0, 173, 0, 138, 380)
        }
    });
    sc.MainMenu.LeaSmall = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        skinGfx: null,
        bounds: null,
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
        init: function() {
            this.parent();
            this.hook.size.x = 97;
            this.hook.size.y = 263;
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2;
            this.doStateTransition("DEFAULT")
        },
        setBounds: function(a) {
            if (this.bounds = a) {
                this.hook.size.x = a.w;
                this.hook.size.y = a.h
            } else {
                this.hook.size.x = 97;
                this.hook.size.y = 263
            }
            this.hook.pivot.x = this.hook.size.x /
                2;
            this.hook.pivot.y = this.hook.size.y / 2
        },
        updateDrawables: function(a) {
            this.skinGfx ? this.bounds ? a.addDraw().setGfx(this.skinGfx, this.bounds.offX || 0, this.bounds.offY || 0, this.bounds.x || 0, this.bounds.y || 0, this.bounds.w || 0, this.bounds.h || 0) : a.addDraw().setGfx(this.skinGfx, -8, -18, 144, 0, 112, 288) : a.addGfx(this.gfx, 0, 0, 311, 0, 97, 263)
        }
    });
    sc.MainMenu.Lea = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetY: 20
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_NO_OFFSET: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        large: null,
        small: null,
        init: function() {
            this.parent();
            this.hook.size.x = 138;
            this.hook.size.y = 380;
            this.large = new sc.MainMenu.LeaLarge;
            this.large.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.small = new sc.MainMenu.LeaSmall;
            this.small.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.small.setPos(1, 0);
            this.addChildGui(this.large);
            this.addChildGui(this.small);
            this.doStateTransition("HIDDEN", true);
            this.reset();
            sc.Model.addObserver(sc.model.menu, this);
            sc.Model.addObserver(sc.playerSkins, this)
        },
        moveLea: function(a, b, e, f) {
            if (this.hook.currentStateName == "HIDDEN" || this.hook.currentStateName == "HIDDEN_NO_OFFSET") {
                f && this.hook.doStateTransition("HIDDEN_NO_OFFSET", true);
                this.hook.doStateTransition("DEFAULT")
            }
            f ? this.setPos(a, 101 + b) : this.doPosTranstition(0 + a, 101 + b, f ? 0 : 0.3, KEY_SPLINES.EASE);
            if (e && !this.isSmall())
                if (f) {
                    this.large.doStateTransition("FADE_IN_ALPHA", true);
                    this.small.doStateTransition("DEFAULT", true)
                } else this.fadeToSmall();
            else !e && this.isSmall() && this.fadeToLarge()
        },
        hideLea: function() {
            this.isSmall() ? this.doStateTransition("HIDDEN_NO_OFFSET", false, false, function() {
                this.reset();
                this.doStateTransition("HIDDEN", true)
            }.bind(this)) : this.doStateTransition("HIDDEN", false, false, function() {
                this.reset()
            }.bind(this))
        },
        reset: function() {
            this.large.doStateTransition("DEFAULT", true);
            this.small.doStateTransition("HIDDEN", true);
            this.setPos(0, 101)
        },
        fadeToSmall: function() {
            this.large.doStateTransition("FADE_TO_SMALL", false, false, function() {
                this.large.doStateTransition("FADE_IN_ALPHA")
            }.bind(this));
            this.small.doStateTransition("DEFAULT", false, false, null, 0.2)
        },
        fadeToLarge: function() {
            this.small.doStateTransition("HIDDEN");
            this.large.doStateTransition("FADE_TO_SMALL", false, false, function() {
                this.large.doStateTransition("DEFAULT")
            }.bind(this))
        },
        isSmall: function() {
            return this.small.hook.currentStateName == "DEFAULT"
        },
        modelChanged: function(a, b, e) {
            if (a == sc.menu) b == sc.MENU_EVENT.LEA_STATE_CHANGED && (sc.menu.leaState == sc.MENU_LEA_STATE.HIDDEN ? this.hideLea() : this.moveLea(e.x, e.y, sc.menu.leaState, e.skip));
            else if (a == sc.playerSkins)
                if ((a = sc.playerSkins.getCurrentSkin("Appearance")) && a.loaded) {
                    this.large.setBounds(a.guiImageBounds ? a.guiImageBounds.large : null);
                    this.small.setBounds(a.guiImageBounds ? a.guiImageBounds.small : null);
                    this.small.skinGfx = a.guiImage;
                    this.large.skinGfx = a.guiImage
                } else {
                    this.small.skinGfx = null;
                    this.large.skinGfx = null;
                    this.large.setBounds();
                    this.small.setBounds()
                }
        }
    });
    sc.MainMenu.SmallRhombus = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 0.5,
                    offsetY: 21
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    offsetX: -87,
                    alpha: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent();
            this.hook.size.x = 87;
            this.hook.size.y = 87
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 0, 425, 87, 87)
        }
    })
});
ig.baked = !0;
