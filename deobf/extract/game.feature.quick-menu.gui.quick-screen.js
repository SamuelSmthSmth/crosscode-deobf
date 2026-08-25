ig.module("game.feature.quick-menu.gui.quick-screen").requires("impact.base.image", "impact.feature.gui.gui", "game.feature.quick-menu.gui.quick-screen-types", "game.feature.menu.gui.menu-misc", "game.feature.quick-menu.gui.quick-misc").defines(function() {
    sc.QuickMenuAnalysisCursor = ig.GuiElementBase.extend({
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
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        focusOffset: {
            x: 0,
            y: 0
        },
        focus: false,
        _focusTimer: 0,
        _focusTime: 0,
        _focusOffset: 0,
        _lastDevice: 0,
        _gamepadActive: false,
        init: function() {
            this.parent();
            this.setSize(23, 23)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.quickmodel, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.quickmodel, this)
        },
        update: function() {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            if (this._focusTimer < this._focusTime) {
                this._focusTimer =
                    this._focusTimer + ig.system.tick;
                if (this._focusTimer >= this._focusTime) {
                    this._focusTimer = this._focusTime;
                    this._focusOffset = this.focus ? 2 : 0
                } else this._focusOffset = Math.floor((this._focusTime ? 1 : -1) * (this._focusTimer / this._focusTime) * 2)
            }
        },
        updateDrawables: function(b) {
            this.focus ? b.addGfx(this.gfx, -1, -1, 512 + (this.focus ? 24 : 0), 160, 23, 23) : this._gamepadActive && b.addGfx(this.gfx, -1, -1, 512 + (this.focus ? 24 : 0), 160, 23, 23)
        },
        focusOnNode: function(b, a) {
            this.setPos(b - Math.floor(this.hook.size.x / 2), a - Math.floor(this.hook.size.y /
                2) - this.focusOffset.y);
            this.focus = true;
            this._focusTimer = 0;
            this._focusTime = 0.2;
            this._focusOffset = 0
        },
        unfocus: function() {
            this.focus = false;
            this._focusTime = this._focusTimer = 0.2;
            this._focusOffset = 0
        },
        moveTo: function(b, a, d, c) {
            d && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.doPosTranstition(b - Math.floor(this.hook.size.x / 2), a - Math.floor(this.hook.size.y / 2) - this.focusOffset.y, c, KEY_SPLINES.EASE) : this.setPos(b - Math.floor(this.hook.size.x / 2), a - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            if (this.focus) {
                this._focusTimer =
                    0;
                this._focusTime = 0.2;
                this._focusOffset = 3;
                this.focus = false
            }
        },
        modelChanged: function(b, a) {
            if (b == sc.quickmodel)
                if (a == sc.QUICK_MODEL_EVENT.INPUT_MODEL_TOGGLED) {
                    this._focusTime = this._focusTimer = 0.2;
                    this._focusOffset = 0
                } else a == sc.QUICK_MODEL_EVENT.FOCUS_NODE ? this.focusOnNode(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y) : a == sc.QUICK_MODEL_EVENT.UNFOCUS ? this.unfocus() : a == sc.QUICK_MODEL_EVENT.ENSURE_FOCUS && (this.focus || this.focusOnNode(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y))
        }
    });
    sc.QuickMenuAnalysis =
        ig.GuiElementBase.extend({
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
            buttonGroup: null,
            cursor: null,
            entities: [],
            iconContainer: null,
            focusContainer: null,
            corners: [],
            background: null,
            _cursorPos: Vec2.createC(-1E4, -1E4),
            entered: false,
            init: function() {
                this.parent();
                this.setSize(ig.system.width, ig.system.height);
                sc.Model.addObserver(sc.quickmodel, this);
                this.buttonGroup = new sc.MouseButtonGroup;
                this.buttonGroup.ignoreActiveFocus = true;
                this.buttonGroup.addSelectionCallback(function() {}.bind(this));
                this.buttonGroup.setMouseFocusLostCallback(function() {}.bind(this));
                if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 352, 64, 64, ig.ImagePattern.OPT.REPEAT_X_AND_Y);
                this.background = new ig.GuiElementBase;
                this.background.hook.transitions = {
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
                this.background.updateDrawables =
                    function(b) {
                        b.addPattern(this.constructor.PATTERN, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y).setCompositionMode("lighter")
                    }.bind(this);
                this.background.doStateTransition("HIDDEN", true);
                this.addChildGui(this.background);
                this.createCorner();
                this.createCorner(true);
                this.createCorner(false, true);
                this.createCorner(true, true);
                this.iconContainer = new ig.GuiElementBase;
                this.iconContainer.setSize(ig.system.width, ig.system.height);
                this.addChildGui(this.iconContainer);
                this.cursor = new sc.QuickMenuAnalysisCursor;
                this.cursor.doStateTransition("HIDDEN", true);
                this.addChildGui(this.cursor);
                this.focusContainer = new sc.QuickFocusScreen;
                this.addChildGui(this.focusContainer)
            },
            update: function() {
                sc.quickmodel.cursorMoved = false;
                if (this.isVisible() && this.buttonGroup.isActive() && !ig.interact.isBlocked())
                    if (sc.control.menuBack()) {
                        sc.BUTTON_SOUND.back.play();
                        sc.quickmodel.enterNone()
                    } else {
                        if (sc.quickmodel.lastDevice != ig.input.currentDevice) {
                            sc.quickmodel.lastDevice = ig.input.currentDevice;
                            sc.quickmodel.gamepadActive = ig.input.currentDevice ==
                                ig.INPUT_DEVICES.GAMEPAD;
                            var b = null;
                            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                                b = this._cursorPos;
                                this.initCursor(b);
                                sc.quickmodel.cursor.x = b.x;
                                sc.quickmodel.cursor.y = b.y;
                                this.limitCursorPos();
                                sc.quickmodel.resetCursor();
                                this.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y)
                            } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                                this._cursorPos.x = sc.quickmodel.cursor.x;
                                this._cursorPos.y = sc.quickmodel.cursor.y;
                                this.cursor.unfocus()
                            }
                            sc.quickmodel.toggleInputMode()
                        }
                        if (ig.input.currentDevice ==
                            ig.INPUT_DEVICES.GAMEPAD) {
                            var a = b = 0,
                                d = 0,
                                c = false;
                            if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                                b = (-100 + d * 100) * ig.system.actualTick;
                                c = true
                            } else if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                                b = (100 + d * 100) * ig.system.actualTick;
                                c = true
                            }
                            if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                                a = (-100 + d * 100) * ig.system.actualTick;
                                c = true
                            } else if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                                a = (100 + d * 100) * ig.system.actualTick;
                                c = true
                            }
                            if (c) {
                                sc.quickmodel.cursorMoved = true;
                                sc.quickmodel.cursor.x =
                                    b >= 0 ? Math.floor(sc.quickmodel.cursor.x + b) : Math.ceil(sc.quickmodel.cursor.x + b);
                                sc.quickmodel.cursor.y = a >= 0 ? Math.floor(sc.quickmodel.cursor.y + a) : Math.ceil(sc.quickmodel.cursor.y + a);
                                this.limitCursorPos();
                                this.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y)
                            }
                        }
                    }
            },
            show: function() {
                this.iconContainer.removeAllChildren();
                this.entities.length = 0;
                this.buttonGroup.clear();
                this.focusContainer.resetSubGuis();
                for (var b = null, b = null, a = ig.game.shownEntities, d = a.length; d--;) {
                    var c = a[d];
                    if (c && c.getQuickMenuSettings &&
                        (c.isQuickMenuVisible && c.isQuickMenuVisible() || ig.EntityTools.isInScreen(c, 0))) {
                        b = c.getQuickMenuSettings();
                        if (!b.disabled && sc.QUICK_MENU_TYPES[b.type]) {
                            b.entity = c;
                            b = new sc.QUICK_MENU_TYPES[b.type](b.type, b, this.focusContainer);
                            b.alignGuiPosition(0, 0);
                            this.iconContainer.addChildGui(b);
                            b.show();
                            this.entities.push(b);
                            this.buttonGroup.addFocusGui(b)
                        }
                    }
                }
                this.focusContainer.reset();
                this.doStateTransition("DEFAULT")
            },
            hide: function() {
                for (var b = this.iconContainer.hook.children.length; b--;) {
                    this.iconContainer.hook.children[b].gui.hide();
                    this.iconContainer.hook.children[b].removeAfterTransition = true
                }
                for (b = this.entities.length; b--;) this.entities[b].onAnalysisExit();
                for (b = this.corners.length; b--;) this.corners[b].doStateTransition("DEFAULT")
            },
            enter: function() {
                sc.quickmodel.buttonInteract.pushButtonGroup(this.buttonGroup);
                for (var b = this.entities.length; b--;) {
                    this.entities[b].focusLost();
                    this.entities[b].onAnalysisEnter()
                }
                for (b = this.corners.length; b--;) this.corners[b].doStateTransition("DEFAULT");
                sc.quickmodel.resetCursor();
                this.cursor.addObservers();
                this.cursor.doStateTransition("DEFAULT");
                if (sc.quickmodel.lastDevice != ig.input.currentDevice) {
                    sc.quickmodel.gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    sc.quickmodel.lastDevice = ig.input.currentDevice
                }
                this.focusCenter();
                ig.interact.setBlockDelay(0.2);
                this.background.doStateTransition("DEFAULT");
                this.entered = true
            },
            exit: function() {
                this.cursor.unfocus();
                this.cursor.removeObservers();
                this.cursor.doStateTransition("HIDDEN");
                for (var b = this.entities.length; b--;) this.entities[b].onAnalysisExit();
                for (b = this.corners.length; b--;) this.corners[b].doStateTransition("HIDDEN");
                this.background.doStateTransition("HIDDEN");
                sc.quickmodel.buttonInteract.removeButtonGroup(this.buttonGroup);
                this.entered = false
            },
            focusCenter: function() {
                if (this.entered) {
                    var b = this._cursorPos;
                    b.x = sc.quickmodel.cursor.x;
                    b.y = sc.quickmodel.cursor.y;
                    this.limitCursorPos();
                    this.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y)
                } else if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    b = this._cursorPos;
                    this.initCursor(b);
                    sc.quickmodel.cursor.x = ig.system.width / 2;
                    sc.quickmodel.cursor.y = ig.system.height / 2;
                    this.limitCursorPos();
                    this.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y)
                }
            },
            initCursor: function(b) {
                if (b.x <= -1E4 || b.y <= -1E4) {
                    b.x = ig.system.width / 2;
                    b.y = ig.system.height / 2
                }
            },
            limitCursorPos: function() {
                var b = sc.quickmodel.cursor.x;
                sc.quickmodel.cursor.x = b.limit(1, ig.system.width - Math.floor(this.cursor.hook.size.x / 2) - 1);
                b = sc.quickmodel.cursor.y;
                sc.quickmodel.cursor.y = b.limit(1, ig.system.height - this.cursor.hook.size.y -
                    1)
            },
            createCorner: function(b, a) {
                var d = new ig.ImageGui(this.gfx, 512, 280, 104, 65);
                d.setAlign(b ? ig.GUI_ALIGN.X_RIGHT : ig.GUI_ALIGN.X_LEFT, a ? ig.GUI_ALIGN.Y_BOTTOM : ig.GUI_ALIGN.Y_TOP);
                d.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.2,
                        timeFunction: KEY_SPLINES.EASE
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0,
                            offsetX: -20
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                d.doStateTransition("HIDDEN", true);
                d.flipX = b || false;
                d.flipY = a || false;
                d.renderMode = "lighter";
                this.corners.push(d);
                this.addChildGui(d)
            },
            modelChanged: function(b, a) {
                b == sc.quickmodel &&
                    (a == sc.QUICK_MODEL_EVENT.SWITCH_STATE ? sc.quickmodel.isQuickCheck() ? this.enter() : this.exit() : a == sc.QUICK_MODEL_EVENT.EXIT_MENU && this.exit())
            }
        })
});
ig.baked = !0;
