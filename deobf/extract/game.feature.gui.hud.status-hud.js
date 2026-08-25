ig.module("game.feature.gui.hud.status-hud").requires("impact.feature.gui.gui", "game.feature.gui.hud.hp-hud", "game.feature.gui.hud.sp-hud", "game.feature.gui.hud.param-hud", "game.feature.gui.hud.buff-hud", "game.feature.gui.hud.item-timer-hud", "game.feature.model.options-model", "game.feature.gui.hud.key-hud").defines(function() {
    var b = [{
            x: 20,
            y: 20
        }, {
            x: 20,
            y: 44
        }, {
            x: 20,
            y: -4
        }, {
            x: 44,
            y: 20
        }, {
            x: -4,
            y: 20
        }],
        a = [{
            x: [220, 289],
            y: [11, 34]
        }, {
            x: [90, 141],
            y: [19, 42]
        }, {
            x: [20, 42],
            y: [36, 83]
        }];
    sc.StatusHudGui = ig.GuiElementBase.extend({
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
        battleBgGui: null,
        battleSymbolGui: null,
        upperGui: null,
        lowerGui: null,
        elementBgGui: null,
        elementModeGui: null,
        paramGui: null,
        partyGui: null,
        keyHud: null,
        elementSwitchTimer: 0,
        menuMode: false,
        init: function() {
            this.parent();
            this.hook.zIndex = 1201;
            this.hook.pauseGui = true;
            this.elementBgGui = new sc.StatusElementBgGui;
            this.elementBgGui.setPos(3, 3);
            this.addChildGui(this.elementBgGui);
            this.elementModeGui = new sc.StatusElementModeGui;
            this.elementModeGui.setPos(0, 0);
            this.addChildGui(this.elementModeGui);
            this.paramGui = new sc.ParamHudGui;
            this.paramGui.setPos(54, 26);
            this.addChildGui(this.paramGui);
            this.lowerGui = new sc.StatusLowerGui;
            this.lowerGui.setPos(29, 21);
            this.addChildGui(this.lowerGui);
            this.upperGui = new sc.StatusUpperGui;
            this.upperGui.setPos(24, 3);
            this.addChildGui(this.upperGui);
            this.partyGui = new sc.PartyHudGui;
            this.partyGui.setPos(2, 39);
            this.addChildGui(this.partyGui);
            this.keyHud = new sc.KeyHudGui;
            this.keyHud.setPos(0, 53);
            this.addChildGui(this.keyHud);
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model.menu, this);
            sc.Model.addObserver(sc.quickmodel, this);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.elementSwitchTimer > 0 && !sc.model.isLevelUp() && !sc.model.isQuickMenu() && !sc.autoControl.isActive()) {
                this.elementSwitchTimer = this.elementSwitchTimer - ig.system.actualTick;
                this.elementSwitchTimer <= 0 && this._minimizeDisplay()
            }
        },
        modelChanged: function(a, b, c) {
            if (a == sc.model) {
                if (b == sc.GAME_MODEL_MSG.STATE_CHANGED ||
                    b == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED)
                    if (sc.model.isLevelUp()) this.elementSwitchDisplay();
                    else if (sc.model.isQuickMenu()) this._enterQuickMenuMode();
                else if (sc.model.isMenu()) {
                    this.menuMode = true;
                    sc.menu.directMode && sc.menu.directMenu ? this._changeMenuModeVisibility(sc.menu.directMenu) : this._changeMenuModeVisibility(sc.menu.currentMenu)
                } else {
                    if (this.menuMode) {
                        this._minimizeDisplay();
                        this.menuMode = false
                    }
                    this._updateVisibility()
                }
            } else if (a == sc.menu)(b == sc.MENU_EVENT.ENTER_MENU || b == sc.MENU_EVENT.LEAVE_MENU) &&
                this._changeMenuModeVisibility(sc.menu.currentMenu);
            else if (a == sc.model.player)
                if (b == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE) this.elementSwitchDisplay();
                else if (b == sc.PLAYER_MSG.ITEM_CONSUME_START) this.elementSwitchTimer = 100;
            else {
                if (b == sc.PLAYER_MSG.ITEM_CONSUME_END) this.elementSwitchTimer = c ? 1.5 : 1E-4
            } else a == sc.quickmodel && b == sc.QUICK_MODEL_EVENT.SWITCH_STATE && (sc.quickmodel.isQuickCheck() ? this.doStateTransition("HIDDEN") : this.doStateTransition("DEFAULT"))
        },
        varsChanged: function() {
            this._updateVisibility()
        },
        _updateVisibility: function() {
            if (!sc.model.isQuickMenu() && !sc.model.isMenu() && !sc.model.isLevelUp() && !sc.model.isQuickMenu()) {
                var a = ig.vars.get("playerVar.statusHidden"),
                    b = sc.options.get("hud-display"),
                    a = !a && sc.model.isGame() && sc.model.isRunning() && b;
                if (!a && this.elementSwitchTimer > 0) {
                    this.elementSwitchTimer = 0;
                    this._minimizeDisplay()
                }
                this.doStateTransition(a ? "DEFAULT" : "HIDDEN")
            }
        },
        _minimizeDisplay: function() {
            this.elementSwitchTimer = 0;
            this.elementModeGui.doPosTranstition(0, 0, 0.3, KEY_SPLINES.EASE_IN_OUT);
            this.elementModeGui.selectBg = false;
            this.elementBgGui.doStateTransition("HIDDEN");
            this.upperGui.doPosTranstition(24, 3, 0.3, KEY_SPLINES.EASE_IN_OUT);
            this.lowerGui.doPosTranstition(29, 21, 0.3, KEY_SPLINES.EASE_IN_OUT);
            this.partyGui.doPosTranstition(2, 39, 0.3, KEY_SPLINES.EASE_IN_OUT);
            this.keyHud.doPosTranstition(0, 53, 0.3, KEY_SPLINES.EASE_IN_OUT);
            this.paramGui.hideParams();
            this.doStateTransition("DEFAULT")
        },
        _minimizeDisplayFast: function() {
            this.elementSwitchTimer = 0;
            this.elementModeGui.doPosTranstition(0, 0,
                0.2, KEY_SPLINES.EASE_IN_OUT);
            this.elementModeGui.selectBg = false;
            this.elementBgGui.doStateTransition("HIDDEN_MENU");
            this.upperGui.doPosTranstition(24, 3, 0.2, KEY_SPLINES.EASE_IN_OUT);
            this.lowerGui.doPosTranstition(29, 21, 0.2, KEY_SPLINES.EASE_IN_OUT);
            this.partyGui.doPosTranstition(2, 39, 0.2, KEY_SPLINES.EASE_IN_OUT);
            this.keyHud.doPosTranstition(0, 53, 0.2, KEY_SPLINES.EASE_IN_OUT);
            this.paramGui.hideParams();
            this.doStateTransition("DEFAULT");
            this._updateVisibility()
        },
        _enterQuickMenuMode: function() {
            this.elementSwitchTimer =
                0.1;
            var a = sc.model.player.currentElementMode;
            this.elementBgGui.doStateTransition("QUICKMENU");
            a = b[a];
            this.elementModeGui.doPosTranstition(a.x + 3, a.y + 3, 0.2, KEY_SPLINES.EASE);
            this.elementModeGui.doStateTransition("QUICKMENU");
            this.elementModeGui.selectBg = true;
            this.upperGui.doPosTranstition(73, 26, 0.2, KEY_SPLINES.EASE);
            this.lowerGui.doPosTranstition(78, 44, 0.2, KEY_SPLINES.EASE);
            this.partyGui.doPosTranstition(2, 88, 0.2, KEY_SPLINES.EASE);
            this.keyHud.doPosTranstition(0, 80, 0.2, KEY_SPLINES.EASE);
            this.paramGui.showParams(false);
            this.doStateTransition("DEFAULT")
        },
        _enterMenuMode: function() {
            this.elementSwitchTimer = 0;
            var a = sc.model.player.currentElementMode;
            this.elementBgGui.doStateTransition("MENU");
            a = b[a];
            this.elementModeGui.doPosTranstition(a.x + 3 + 2, a.y + 3 + 21, 0.2, KEY_SPLINES.EASE);
            this.elementModeGui.doStateTransition("MENU");
            this.elementModeGui.selectBg = true;
            this.upperGui.doPosTranstition(75, 47, 0.2, KEY_SPLINES.EASE);
            this.lowerGui.doPosTranstition(80, 65, 0.2, KEY_SPLINES.EASE);
            this.partyGui.doPosTranstition(2, 109, 0.2, KEY_SPLINES.EASE);
            this.keyHud.doPosTranstition(0, 110, 0.2, KEY_SPLINES.EASE);
            this.paramGui.showParams(true);
            this.doStateTransition("DEFAULT")
        },
        _changeMenuModeVisibility: function(a) {
            switch (a) {
                case sc.MENU_SUBMENU.START:
                    this.doStateTransition("DEFAULT");
                    this._enterMenuMode();
                    break;
                default:
                    this._minimizeDisplayFast();
                    this.doStateTransition("HIDDEN")
            }
        },
        elementSwitchDisplay: function() {
            var a = sc.model.player.currentElementMode;
            this.elementSwitchTimer = sc.model.isLevelUp() || sc.model.isQuickMenu() ? 0.1 : 2;
            this.elementBgGui.doStateTransition("DEFAULT");
            a = b[a];
            this.elementModeGui.setPos(a.x + 3, a.y + 3);
            this.elementModeGui.doStateTransition("ZOOM", true);
            this.elementModeGui.doStateTransition("DEFAULT");
            this.elementModeGui.selectBg = true;
            this.upperGui.doPosTranstition(73, 26, 0.1, KEY_SPLINES.LINEAR);
            this.lowerGui.doPosTranstition(78, 44, 0.1, KEY_SPLINES.LINEAR);
            this.partyGui.doPosTranstition(2, 88, 0.1, KEY_SPLINES.LINEAR);
            this.keyHud.doPosTranstition(0, 80, 0.1, KEY_SPLINES.LINEAR);
            this.paramGui.showParams(false)
        },
        getFreeScreenMinY: function(b) {
            var c = this.elementBgGui.hook.getStateTransitionProgress();
            this.elementBgGui.hook.currentStateName == "HIDDEN" && (c = 1 - c);
            for (var d = a.length, h = 0, i = 0; d--;) {
                var j = a[d],
                    k = j.x[0] * (1 - c) + j.x[1] * c,
                    j = j.y[0] * (1 - c) + j.y[1] * c;
                if (b <= k) return Math.max(j, h - (b - i));
                i = k;
                h = j
            }
            return Math.max(0, h - (b - i))
        }
    });
    sc.StatusUpperGui = ig.GuiElementBase.extend({
        init: function() {
            this.parent();
            var a = new sc.HpHudGui;
            this.addChildGui(a);
            a = new sc.SpHudGui;
            this.addChildGui(a);
            a.setPos(55, 0);
            a = new sc.ExpHudGui;
            a.setPos(63, 8);
            this.addChildGui(a)
        }
    });
    sc.StatusLowerGui = ig.GuiElementBase.extend({
        buffGui: null,
        itemTimerGui: null,
        init: function() {
            this.parent();
            sc.Model.addObserver(sc.model.player, this);
            this.buffGui = new sc.BuffHudGui;
            this.addChildGui(this.buffGui);
            this.itemTimerGui = new sc.ItemTimerHudGui;
            this.itemTimerGui.setPos(0, 0);
            this.addChildGui(this.itemTimerGui)
        },
        modelChanged: function(a, b) {
            a == sc.model.player && (b == sc.PLAYER_MSG.ITEM_USED ? this.moveSubGui(true) : b == sc.PLAYER_MSG.ITEM_BLOCK_FINISH ? this.moveSubGui(false) : b == sc.PLAYER_MSG.RESET_PLAYER && this.moveSubGui(false))
        },
        moveSubGui: function(a) {
            this.buffGui.doPosTranstition(a ?
                32 : 0, 0, 0.2, KEY_SPLINES.EASE_IN_OUT)
        }
    });
    var d = [{
        above: 0,
        interval: 0.5,
        minAlpha: 0,
        maxAlpha: 0
    }, {
        above: 0.25,
        interval: 1,
        minAlpha: 0.1,
        maxAlpha: 0.2
    }, {
        above: 0.5,
        interval: 0.5,
        minAlpha: 0.2,
        maxAlpha: 0.5
    }, {
        above: 0.75,
        interval: 0.25,
        minAlpha: 0,
        maxAlpha: 1
    }, {
        above: 1,
        interval: 0.125,
        minAlpha: 0,
        maxAlpha: 1
    }];
    sc.ElementalLoadOverlayGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/overload-overlay.png"),
        alphaHandler: null,
        currentWarnMode: -1,
        init: function() {
            this.parent();
            this.hook.zIndex = -40;
            this.setSize(ig.system.width,
                ig.system.height);
            this.alphaHandler = new ig.AlphaTransitionHandler(true)
        },
        update: function() {
            var a = sc.model.player.elementLoad;
            sc.model.player.hasOverload && (a = 1);
            for (var b = d.length; b--;)
                if (a >= d[b].above) break;
            if (b != this.currentWarnMode) {
                this.currentWarnMode = b;
                a = d[b];
                this.alphaHandler.set(a.minAlpha, a.interval, a.maxAlpha)
            }
            if (!this.alphaHandler.update()) this.hook.localAlpha = this.alphaHandler.getAlpha()
        },
        updateDrawables: function(a) {
            if (sc.options.get("element-overload")) {
                var b = sc.model.player.hasOverload ||
                    sc.model.player.elementLoad < 0.1 ? 160 : 0;
                a.addGfx(this.gfx, 0, 0, b, 0, 160, 160, false, false).setCompositionMode("lighter");
                a.addGfx(this.gfx, ig.system.width - 160, 0, b, 0, 160, 160, true, false).setCompositionMode("lighter");
                a.addGfx(this.gfx, ig.system.width - 160, ig.system.height - 160, b, 0, 160, 160, true, true).setCompositionMode("lighter");
                a.addGfx(this.gfx, 0, ig.system.height - 160, b, 0, 160, 160, false, true).setCompositionMode("lighter")
            }
        }
    });
    sc.StatusElementModeGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        timer: 0,
        selectBg: false,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.15,
                timeFunction: KEY_SPLINES.LINEAR
            },
            QUICKMENU: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            MENU: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            ZOOM: {
                state: {
                    scaleX: 0.25,
                    scaleY: 0.25
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent();
            this.setSize(40, 40);
            this.setPivot(20, 20)
        },
        update: function() {
            this.timer = (this.timer + ig.system.actualTick) % 2
        },
        updateDrawables: function(a) {
            var b = sc.model.player.currentElementMode,
                c = sc.model.player.elementLoad,
                d = Math.ceil(c * (this.hook.size.y - 7)),
                i = 2;
            c >= 0.9 ? i = 0.25 : c >= 0.75 ? i = 0.5 : c >= 0.5 && (i = 1);
            c = this.timer % i / i;
            c = c < 0.5 ? c * 2 : (1 - c) * 2;
            a.addGfx(this.gfx, 0, 0, 64, 32 + this.hook.size.x * (this.selectBg ? 0 : 1), this.hook.size.x, this.hook.size.y);
            if (d && c) {
                d = d + 4;
                a.addGfx(this.gfx, 0, this.hook.size.x - d, 64, 32 + this.hook.size.x * 3 - d, this.hook.size.x, d).setAlpha(c)
            }
            a.addGfx(this.gfx, 8, 8, 104, 32 + b * 24, 24, 24)
        }
    });
    var c = [{
        x: 32,
        y: 32
    }, {
        x: 32,
        y: 56
    }, {
        x: 32,
        y: 8
    }, {
        x: 56,
        y: 32
    }, {
        x: 8,
        y: 32
    }];
    sc.StatusElementBgGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            QUICKMENU: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            MENU: {
                state: {
                    offsetY: 21,
                    offsetX: 2
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            HIDDEN_MENU: {
                state: {
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        init: function() {
            this.parent();
            this.setSize(80, 80);
            this.setPivot(10, 10);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 136, 0, 80, 80);
            for (var b = sc.model.player.currentElementMode, d = 0; d < c.length; ++d)
                if (d != b) {
                    var h = c[d],
                        i = (d ? d - 1 : b - 1) * 16,
                        j = d ? 96 : 64;
                    ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE && (j = j + 16);
                    !sc.model.player.getCore(d + 8) && d && (j = j - 32);
                    a.addGfx(this.gfx, h.x, h.y, i, j, 16, 16)
                }
        }
    });
    sc.BattleModeBgGui = ig.ImageGui.extend({
        bgImage: new ig.Image("media/gui/status-gui.png"),
        transitions: {
            DEFAULT: {
                state: {
                    offsetX: -23,
                    offsetY: -23,
                    alpha: 0.6
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            MAXIMIZED: {
                state: {
                    alpha: 0.6
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    offsetX: -44,
                    offsetY: -44,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        init: function() {
            this.parent(this.bgImage, 128, 80, 88, 88)
        }
    });
    sc.BattleModeSymbolGui = ig.ImageGui.extend({
        bgImage: new ig.Image("media/gui/status-gui.png"),
        transitions: {
            DEFAULT: {
                state: {
                    offsetX: 0,
                    offsetY: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            MAXIMIZED: {
                state: {
                    offsetX: 6,
                    offsetY: 6
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    offsetX: -16,
                    offsetY: -16,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        init: function() {
            this.parent(this.bgImage, 216, 80, 16, 16)
        }
    })
});
ig.baked = !0;
