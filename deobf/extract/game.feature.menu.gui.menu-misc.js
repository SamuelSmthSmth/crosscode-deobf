ig.module("game.feature.menu.gui.menu-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.button", "game.feature.combat.stat-change").defines(function() {
    sc.ScrollType = {};
    sc.ScrollType.BOTH = 0;
    sc.ScrollType.Y_ONLY = 1;
    sc.ScrollType.X_ONLY = 2;
    sc.MenuPanelType = {};
    sc.MenuPanelType.TOP_LEFT_EDGE = 0;
    sc.MenuPanelType.TOP_RIGHT_EDGE = 1;
    sc.MenuPanelType.TOP_LEFT_EDGE_DARK = 2;
    sc.MenuPanelType.TOP_RIGHT_EDGE_DARK = 3;
    sc.MenuPanelType.SQUARE = 4;
    sc.MenuPanelType.BOTTOM_LEFT_EDGE = 5;
    sc.MenuPanelType.TOP_RIGHT_EDGE_DARKER = 6;
    sc.MenuPanelType.BOTTOM_RIGHT_EDGE = 7;
    var b = KEY_SPLINES.EASE;
    sc.MODIFIER_ICON_DRAW = {
        X: 620,
        Y: 219,
        SIZE: 11,
        MAX_PER_ROW: 5
    };
    var a = Vec2.createC(0, 0);
    sc.PercentNumber = ig.GuiElementBase.extend({
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
        number: null,
        init: function(a, b) {
            this.parent();
            this.number = new sc.NumberGui(a, b);
            this.addChildGui(this.number);
            this.setSize(this.number.hook.size.x + 9, this.number.hook.size.y)
        },
        setNumber: function(a, b) {
            a != 0 && this.doStateTransition("DEFAULT", true);
            this.number.setNumber(a, b);
            this.setSize(this.number.hook.size.x + 9, this.number.hook.size.y)
        },
        setColor: function(a) {
            this.number.setColor(a)
        },
        hide: function() {
            this.setNumber(0, true);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx,
                this.hook.size.x - 8, 0, this.number.color * 9, 407, 8, 8)
        }
    });
    sc.NewUnlockButton = sc.ButtonGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        overlay: null,
        init: function(a, b, c, d, i, j, k) {
            this.parent(a, b, c, d, i, j, k);
            this.overlay = new sc.NewUnlockOverlay;
            this.overlay.setPos(4, 4);
            this.addChildGui(this.overlay)
        },
        activateNewOverlay: function(a) {
            this.overlay.activate(a)
        },
        deactivateNewOverlay: function() {
            this.overlay.deactivate()
        }
    });
    sc.NewUnlockOverlay = ig.ImageGui.extend({
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
        gfx: new ig.Image("media/gui/menu.png"),
        overlayActive: false,
        small: false,
        timer: 0,
        alpha: 1,
        init: function() {
            this.parent(this.gfx, 464, 488, 11, 11);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(5.5, 5.5)
        },
        update: function() {
            this.parent();
            if (this.overlayActive) {
                this.timer = (this.timer + ig.system.actualTick) % 1.6;
                var a = this.timer / 1.6,
                    a = KEY_SPLINES.EASE_IN_OUT.get(1 - (a > 0.5 ? 1 - (a - 0.5) * 2 : a * 2)),
                    a = 0.7 * a + 0.3;
                this.active || (a = a * 0.7);
                this.alpha = Math.min(1, a + 0.3);
                this.hook.localAlpha = this.alpha
            }
        },
        updateDrawables: function(a) {
            a.addTransform().setPivot(this.hook.pivot.x, this.hook.pivot.y).setScale(this.alpha, this.alpha);
            this.parent(a);
            a.undoTransform()
        },
        activate: function() {
            this.overlayActive = true;
            this.doStateTransition("DEFAULT", true)
        },
        deactivate: function(a, b) {
            this.overlayActive = false;
            this.doStateTransition("HIDDEN", a ? b || false : true, a)
        }
    });
    sc.BuffInfo = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            FADE_OUT: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 4,
            height: 0,
            left: 11,
            top: 12,
            right: 11,
            bottom: 0,
            offsets: {
                "default": {
                    x: 216,
                    y: 144
                }
            }
        }),
        text: null,
        _width: 0,
        init: function() {
            this.parent();
            this.hook.size.x = 100;
            this.hook.size.y = 21;
            this.setPos(2, 0);
            this.text = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont,
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT,
                ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(13, 0);
            this.text.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                FADE_OUT: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.text.doStateTransition("DEFAULT", true);
            this.text.annotation = {
                descType: "buff",
                size: {
                    x: "dyn",
                    y: 16,
                    offX: 3
                },
                offset: {
                    x: 0,
                    y: ig.system.height - 25
                },
                content: {},
                index: {
                    x: 0,
                    y: "last"
                }
            };
            this.text.isHelpVisible = function() {
                return sc.menu.buffID >= 0
            };
            this.addChildGui(this.text);
            this.doStateTransition("HIDDEN", true)
        },
        setText: function(a, b) {
            b = b || 0;
            if (b > 0) this.doStateTransition("FADE_OUT", false, false, null, b);
            else {
                this.hook.currentStateName == "FADE_OUT" && this.doStateTransition("DEFAULT", true);
                this.text.setText(a);
                a == "" && this.doStateTransition("FADE_OUT", true);
                this._width = a ? this.text.hook.size.x + 21 : 0
            }
        },
        updateDrawables: function(a) {
            this._width && this.ninepatch.draw(a, this._width, 12, "default", 2, 4)
        }
    });
    sc.InfoBar = ig.GuiElementBase.extend({
        text: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    offsetY: -21
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        sizeTransition: null,
        skipRender: null,
        alpha: 0.5,
        init: function(a, b, c) {
            this.parent();
            this.hook.size.x = a || ig.system.width;
            this.hook.size.y = b || 21;
            this.setStateValue("HIDDEN", "offsetY", -this.hook.size.y);
            this.skipRender = c || false;
            this.text = new sc.TextGui("", {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.text.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(8, 0);
            this.text.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                FADE_OUT: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.text.doStateTransition("HIDDEN", true);
            this.addChildGui(this.text);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var a = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    a = this.sizeTransition.timeFunction.get(a);
                this.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - a) + this.sizeTransition.width * a);
                this.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - a) + this.sizeTransition.height * a);
                if (a == 1) this.sizeTransition = null
            }
        },
        updateDrawables: function(a) {
            this.skipRender || a.addColor("#000000", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(this.alpha)
        },
        doSizeTransition: function(a, b, c, d, i) {
            if (c) this.sizeTransition = {
                startWidth: this.hook.size.x,
                width: a || 0,
                startHeight: this.hook.size.y,
                height: b || 0,
                time: c,
                timeFunction: d || KEY_SPLINES.EASE,
                timer: 0 - (i || 0)
            };
            else {
                this.hook.size.x = a;
                this.hook.size.y = b
            }
        },
        setText: function(a, b) {
            b = b || 0;
            if (b > 0) this.text.doStateTransition("FADE_OUT", false, false, null, b);
            else {
                this.text.hook.currentStateName == "FADE_OUT" && this.text.doStateTransition("DEFAULT", true);
                this.text.setText(a)
            }
        }
    });
    sc.DummyContainer = ig.GuiElementBase.extend({
        init: function(a) {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            this.hook.clip = true;
            this.addChildGui(a)
        }
    });
    sc.ListBoxButton = ig.FocusGui.extend({
        numberGfx: new ig.Image("media/gui/menu.png"),
        gfx: new ig.Image("media/gui/buttons.png"),
        button: null,
        data: null,
        _actualLineWidth: 0,
        _width: 0,
        blockedSound: sc.BUTTON_SOUND.denied,
        level: 0,
        init: function(a, b, c, d, i, j, k, l) {
            this.parent(true, false);
            b = b || 1;
            c = c || 1;
            i = i != void 0 ? i : "";
            if (j) {
                this._actualLineWidth = -1;
                b = b + c
            } else this._actualLineWidth = Math.max(0, c - 22);
            this._width = b;
            this.setSize(b + c, sc.BUTTON_TYPE.ITEM.height);
            this.button = new sc.ButtonGui(a, b, true,
                sc.BUTTON_TYPE.ITEM, l);
            this.button.hook.setMouseRecord(false);
            if (k) {
                this.button.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.button.textChild.setPos(0, 0)
            }
            i != void 0 && this.setData({
                id: d,
                description: i
            });
            this.addChildGui(this.button);
            if (!this.constructor.PATTERN_FOCUS) this.constructor.PATTERN_FOCUS = this.gfx.createPattern(62, 45, 4, 1, ig.ImagePattern.OPT.REPEAT_X);
            if (!this.constructor.PATTERN_UNFOCUS) this.constructor.PATTERN_UNFOCUS = this.gfx.createPattern(18, 45, 4, 1, ig.ImagePattern.OPT.REPEAT_X)
        },
        setButtonText: function(a) {
            this.button.setText(a, true)
        },
        setLevel: function(a) {
            this.level = a || 0;
            this.level > 0 ? this.setDrawCallback(function(a, b) {
                sc.MenuHelper.drawLevel(this.level, a, b, this.numberGfx, sc.inventory.isScalable(this.data.id))
            }.bind(this)) : this.setDrawCallback(null)
        },
        setWidth: function(a, b) {
            a = a || 1;
            b = b || 1;
            this._actualLineWidth = Math.max(0, b - 22);
            this._width = a;
            this.hook.size.x = a + b;
            this.button.hook.size.x = a
        },
        setData: function(a) {
            if (a) this.data = a
        },
        setDrawCallback: function(a) {
            this.button.textChild.setDrawCallback(a)
        },
        updateDrawables: function(a) {
            if (!(this._actualLineWidth < 0)) {
                var b = this.button.hook.size.x;
                if (this.focus || this.keepPressed && this.pressed) {
                    a.addPattern(this.constructor.PATTERN_FOCUS, b, 0, 0, 0, this._actualLineWidth, 1);
                    a.addGfx(this.gfx, b + this._actualLineWidth, 0, 66, 45, 22, 1)
                } else {
                    a.addPattern(this.constructor.PATTERN_UNFOCUS, b, 0, 0, 0, this._actualLineWidth, 1);
                    a.addGfx(this.gfx, b + this._actualLineWidth, 0, 22, 45, 22, 1)
                }
            }
        },
        focusGained: function() {
            this.focus = true;
            this.button.focus = true
        },
        setText: function(a) {
            this.button.setText(a);
            this.button.setWidth(this._width)
        },
        focusLost: function() {
            this.focus = false;
            this.button.focus = false
        },
        setActive: function(a) {
            this.parent(a);
            this.button.setActive(a)
        },
        invokeButtonPress: function() {
            this.button.invokeButtonPress()
        }
    });
    sc.ItemBoxButton = sc.ListBoxButton.extend({
        amount: null,
        init: function(a, b, c, d, i, j, k, l, o, m, n) {
            this.parent(a, b, c, i, j, k, l, o);
            if (d >= 0) {
                this.amount = new sc.NumberGui(m || 99);
                this.amount.setNumber(d, true);
                this.amount.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.amount.setPos(5,
                    7);
                this.addChildGui(this.amount)
            }
            this.setLevel(n)
        }
    });
    sc.ToggleSet = ig.GuiElementBase.extend({
        header: null,
        background: null,
        buttons: [],
        set: null,
        init: function(a, b, c, d) {
            this.parent();
            this.setSize(337, 9);
            this.set = a;
            this.background = new ig.ColorGui(a.color || "darkblue");
            this.background.hook.localAlpha = 0.2;
            this.background.setPos(-1, 0);
            this.addChildGui(this.background);
            this.header = new sc.TextGui(ig.LangLabel.getText(a.name), {
                font: sc.fontsystem.tinyFont
            });
            this.header.setPos(0, 1);
            this.addChildGui(this.header);
            this.line = new ig.ColorGui("#545454", this.hook.size.x + 2, 1);
            this.line.setPos(-1, 9);
            this.addChildGui(this.line);
            for (var i = a.items, j = 0, k = 0, b = b.buttonGroup(), l = sc.model.player, o = 0, m = 0; m < i.length; m++) {
                var n = sc.inventory.getItem(i[m]);
                if (!(l.getItemAmount(i[m]) < 1)) {
                    var p = null,
                        p = a.type == sc.TOGGLE_SET_TYPE.SINGLE ? "\\i[" + (l.getToggleItemState(i[m]) ? "toggle-item-on-radio" : "toggle-item-off-radio") + "]" : "\\i[" + (l.getToggleItemState(i[m]) ? "toggle-item-on" : "toggle-item-off") + "]",
                        p = p + ig.LangLabel.getText(n.name),
                        n = ig.LangLabel.getText(n.description),
                        p = new sc.ItemBoxButton(p, 142, 24, -1, i[m], n, true);
                    p.set = a;
                    p.setGui = this;
                    p.updateToggleState = function() {
                        var a = null,
                            a = l.getToggleItemState(this.data.id),
                            a = this.set.type == sc.TOGGLE_SET_TYPE.SINGLE ? "\\i[" + (a ? "toggle-item-on-radio" : "toggle-item-off-radio") + "]" : "\\i[" + (a ? "toggle-item-on" : "toggle-item-off") + "]",
                            a = a + sc.inventory.getItemName(this.data.id);
                        this.setText(a)
                    };
                    p.button.submitSound = null;
                    p.setPos(j * 168, k * 20 + 11);
                    this.addChildGui(p);
                    this.buttons.push(p);
                    b.addFocusGui(p,
                        j, k + c);
                    j++;
                    if (j >= 2) {
                        j = 0;
                        k++
                    }
                    o++
                }
            }
            d.counter = o;
            this.hook.size.y = Math.ceil(o / 2) * 20 + 15;
            this.background.setSize(this.hook.size.x + 2, Math.ceil(o / 2) * 20 + 15)
        },
        updateTogglesStates: function(a) {
            for (var b = this.buttons.length; b--;) a != this.buttons[b] && this.buttons[b].updateToggleState();
            if (a) {
                b = new sc.ItemMenuToggleAnimation(function() {
                    a.updateToggleState()
                }.bind(this), a.set.type == sc.TOGGLE_SET_TYPE.SINGLE);
                a.addChildGui(b)
            }
        }
    });
    var d = [0, 1, 2, 3, 4],
        c = [5, 6, 7, 8, 9];
    sc.ItemMenuToggleAnimation = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        timer: 0,
        index: 0,
        callback: null,
        radio: false,
        frames: null,
        init: function(a, b) {
            this.parent();
            this.setPos(5, 1);
            this.setSize(16, 16);
            this.timer = 0.02;
            this.callback = a;
            this.frames = (this.radio = b || false) ? c : d
        },
        update: function() {
            this.timer = this.timer - ig.system.actualTick;
            if (this.timer <= 0) {
                this.timer = 0.02;
                if (this.index == this.frames.length - 1) {
                    this.callback && this.callback();
                    this.remove()
                } else this.index = (this.index + 1) % this.frames.length
            }
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 656, 352 + this.frames[this.index] *
                16, 16, 15)
        }
    });
    sc.SimpleStatusDisplay = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        name: "nope.",
        lineID: 0,
        iconID: 0,
        usePercent: false,
        iconIndex: Vec2.createC(0, 0),
        currentValueGui: null,
        changeValueGui: null,
        nameGui: null,
        arrowGui: null,
        percentCurrentGui: null,
        percentChangeGui: null,
        simpleMode: false,
        noPercentMode: false,
        stayWhite: false,
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
        width: 0,
        init: function(a,
            b, c, d, i, j, k, l) {
            this.parent();
            this.setSize(k || 169, 11);
            this.width = this.hook.size.x;
            this.name = a || "nope.";
            this.lineID = b || 0;
            this.iconID = c || 0;
            this.usePercent = d || false;
            this.simpleMode = j || false;
            this.noPercentMode = l || false;
            this.iconIndex.x = this.iconID % sc.MODIFIER_ICON_DRAW.MAX_PER_ROW;
            this.iconIndex.y = Math.floor(this.iconID / sc.MODIFIER_ICON_DRAW.MAX_PER_ROW);
            this.nameGui = new sc.TextGui(a, {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            this.nameGui.setPos(sc.MODIFIER_ICON_DRAW.SIZE + 2, 3);
            this.addChildGui(this.nameGui);
            if (this.noPercentMode) {
                this.changeValueGui = new ig.ImageGui(this.gfx, 112, 320, 24, 8);
                this.changeValueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.changeValueGui.setPos(3, 1);
                this.changeValueGui.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.1,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    FADE: {
                        state: {
                            alpha: 0
                        },
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
                this.changeValueGui.doStateTransition("DEFAULT", true);
                this.addChildGui(this.changeValueGui)
            } else {
                if (!this.simpleMode) {
                    this.currentValueGui =
                        new sc.NumberGui(i, {
                            signed: true,
                            transitionTime: 0.2
                        });
                    this.currentValueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                    this.currentValueGui.setPos(this.usePercent ? 63 : 54, 4);
                    this.addChildGui(this.currentValueGui);
                    if (this.usePercent) {
                        this.percentCurrentGui = new sc.PercentChar;
                        this.percentCurrentGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                        this.percentCurrentGui.setPos(54, 4);
                        this.addChildGui(this.percentCurrentGui)
                    }
                    this.arrowGui = new ig.ImageGui(this.gfx, 1, 321, 4, 6);
                    this.arrowGui.setAlign(ig.GUI_ALIGN.X_RIGHT,
                        ig.GUI_ALIGN.Y_TOP);
                    this.arrowGui.setPos(47, 5);
                    this.arrowGui.hook.transitions = {
                        DEFAULT: {
                            state: {},
                            time: 0.1,
                            timeFunction: KEY_SPLINES.LINEAR
                        },
                        FADE: {
                            state: {
                                alpha: 0
                            },
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
                    this.arrowGui.doStateTransition("HIDDEN", true);
                    this.addChildGui(this.arrowGui)
                }
                this.changeValueGui = new sc.NumberGui(i, {
                    signed: true,
                    showPlus: true,
                    transitionTime: 0
                });
                this.changeValueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.changeValueGui.setPos(this.usePercent ? 12 : 3, 4);
                this.changeValueGui.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.1,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    FADE: {
                        state: {
                            alpha: 0
                        },
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
                this.changeValueGui.doStateTransition("HIDDEN", true);
                this.addChildGui(this.changeValueGui);
                if (this.usePercent) {
                    this.percentChangeGui = new sc.PercentChar;
                    this.percentChangeGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                    this.percentChangeGui.setPos(3, 4);
                    this.addChildGui(this.percentChangeGui);
                    this.percentChangeGui.doStateTransition("HIDDEN", true)
                }
            }
        },
        setCurrentValue: function(a, b) {
            if (!this.noPercentMode && !this.simpleMode) {
                a = a || 0;
                a = this.usePercent ? Math.round(a * 100) - 100 : a;
                this.currentValueGui.setNumber(a, b)
            }
        },
        setChangeValue: function(a, b, c) {
            if (this.noPercentMode) this.changeValueGui.offsetY = a <= -1 ? 312 : a >= 1 ? 304 : 320;
            else if (a) {
                a = a || 0;
                a = this.usePercent ? Math.round(a * 100) : a;
                c = 0;
                this.stayWhite || (c = a > 0 ? sc.GUI_NUMBER_COLOR.GREEN :
                    a < 0 ? sc.GUI_NUMBER_COLOR.RED : sc.GUI_NUMBER_COLOR.WHITE);
                this.changeValueGui.setNumber(a, b);
                this.changeValueGui.setColor(c);
                this.changeValueGui.doStateTransition("DEFAULT", true);
                this.simpleMode || this.arrowGui.doStateTransition("DEFAULT", true);
                if (this.usePercent) {
                    this.percentChangeGui.state = c;
                    this.percentChangeGui.doStateTransition("DEFAULT", true)
                }
            } else if (c) {
                this.changeValueGui.doStateTransition("DEFAULT", true);
                this.changeValueGui.setNumber(0, b);
                this.changeValueGui.setColor(0);
                if (this.usePercent) {
                    this.percentChangeGui.state =
                        0;
                    this.percentChangeGui.doStateTransition("DEFAULT", true)
                }
            } else {
                this.changeValueGui.doStateTransition("HIDDEN", true);
                this.simpleMode || this.arrowGui.doStateTransition("HIDDEN", true);
                this.usePercent && this.percentChangeGui.doStateTransition("HIDDEN", true)
            }
        },
        fadeChangeValues: function(a) {
            if (!this.noPercentMode) {
                a = a || 0;
                this.changeValueGui.doStateTransition("FADE", false, false, null, a);
                this.simpleMode || this.arrowGui.doStateTransition("FADE", false, false, null, a);
                this.usePercent && this.percentChangeGui.doStateTransition("FADE",
                    false, false, null, a)
            }
        },
        updateDrawables: function(b) {
            var c = 0,
                d = this.lineID * 12;
            if (this.noPercentMode) {
                a.x = this.simpleMode ? 144 : 0;
                a.y = (this.simpleMode ? 408 : 329) + d;
                b.addGfx(this.gfx, 0, 0, a.x, a.y, 72, 11);
                b.addGfx(this.gfx, 72, 0, a.x + 11, a.y, 9, 11);
                b.addGfx(this.gfx, 81, 10, a.x + 81, a.y, this.simpleMode ? 46 : 89, 11)
            } else b.addGfx(this.gfx, 0, 0, this.simpleMode ? 144 : 0, (this.simpleMode ? 408 : 329) + d, this.width, 11);
            c = this.iconIndex.x * (sc.MODIFIER_ICON_DRAW.SIZE + 1);
            d = this.iconIndex.y * (sc.MODIFIER_ICON_DRAW.SIZE + 1);
            b.addGfx(this.gfx,
                0, 0, sc.MODIFIER_ICON_DRAW.X + c, sc.MODIFIER_ICON_DRAW.Y + d, sc.MODIFIER_ICON_DRAW.SIZE, sc.MODIFIER_ICON_DRAW.SIZE)
        }
    });
    sc.PercentChar = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            FADE: {
                state: {
                    alpha: 0
                },
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
        gfx: new ig.Image("media/gui/menu.png"),
        state: 0,
        init: function() {
            this.parent();
            this.setSize(8, 8)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx,
                0, 0, this.state * 9, 407, 8, 8)
        }
    });
    sc.MenuPanel = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 5,
            height: 5,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "top-left": {
                    x: 100,
                    y: 425
                },
                "top-right": {
                    x: 116,
                    y: 425
                },
                "bottom-left": {
                    x: 544,
                    y: 465
                },
                "top-left-dark": {
                    x: 100,
                    y: 441
                },
                "top-right-dark": {
                    x: 116,
                    y: 441
                },
                "top-right-darker": {
                    x: 33,
                    y: 288
                },
                square: {
                    x: 88,
                    y: 496
                }
            }
        }),
        sizeTransition: null,
        init: function(a) {
            this.parent();
            a = a || sc.MenuPanelType.TOP_LEFT_EDGE;
            switch (a) {
                case sc.MenuPanelType.TOP_LEFT_EDGE:
                    this.currentTileOffset =
                        "top-left";
                    break;
                case sc.MenuPanelType.TOP_RIGHT_EDGE:
                    this.currentTileOffset = "top-right";
                    break;
                case sc.MenuPanelType.TOP_LEFT_EDGE_DARK:
                    this.currentTileOffset = "top-left-dark";
                    break;
                case sc.MenuPanelType.TOP_RIGHT_EDGE_DARK:
                    this.currentTileOffset = "top-right-dark";
                    break;
                case sc.MenuPanelType.TOP_RIGHT_EDGE_DARKER:
                    this.currentTileOffset = "top-right-darker";
                    break;
                case sc.MenuPanelType.BOTTOM_LEFT_EDGE:
                    this.currentTileOffset = "bottom-left";
                    break;
                case sc.MenuPanelType.BOTTOM_RIGHT_EDGE:
                    this.currentTileOffset =
                        "bottom-left";
                    this.flipped = true;
                    break;
                case sc.MenuPanelType.SQUARE:
                    this.currentTileOffset = "square"
            }
        },
        update: function() {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var a = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    a = this.sizeTransition.timeFunction.get(a);
                this.hook.size.x = Math.ceil(this.sizeTransition.startWidth * (1 - a) + this.sizeTransition.width * a);
                this.hook.size.y = Math.ceil(this.sizeTransition.startHeight * (1 - a) + this.sizeTransition.height *
                    a);
                if (a == 1) this.sizeTransition = null
            }
        },
        doSizeTransition: function(a, b, c, d, i) {
            this.sizeTransition = {
                startWidth: this.hook.size.x,
                width: a || 0,
                startHeight: this.hook.size.y,
                height: b || 0,
                time: c,
                timeFunction: d || KEY_SPLINES.LINEAR,
                timer: 0 - (i || 0)
            }
        }
    });
    sc.HeaderMenuPanel = sc.MenuPanel.extend({
        headerPatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 0,
            left: 1,
            top: 9,
            right: 5,
            bottom: 0,
            offsets: {
                "default": {
                    x: 96,
                    y: 408
                }
            }
        }),
        header: null,
        title: "",
        init: function(a, b) {
            this.parent(b);
            this.title = a || "";
            this.header = new sc.TextGui(this.title, {
                font: sc.fontsystem.tinyFont,
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.header.setPos(2, 1);
            this.addChildGui(this.header)
        },
        updateDrawables: function(a) {
            this.parent(a);
            this.headerPatch.draw(a, this.hook.size.x, 9, "default")
        },
        removeAllChildren: function() {
            this.hook.removeAllChildren();
            this.addChildGui(this.header)
        }
    });
    sc.MenuScanLines = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        init: function() {
            this.parent();
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(88,
                475, 16, 16, ig.ImagePattern.OPT.REPEAT_Y)
        },
        updateDrawables: function(a) {
            a.addDraw().setPattern(this.constructor.PATTERN, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
        }
    });
    sc.ScrollPane = ig.GuiElementBase.extend({
        box: null,
        scrollType: sc.ScrollType.Y_ONLY,
        scrollbarV: null,
        scrollbarH: null,
        showTopBar: true,
        showBottomBar: true,
        init: function(a) {
            this.parent();
            this.scrollType = a || sc.ScrollType.BOTH;
            this.box = new sc.ScrollPane.Container;
            this.box.setPos(0, 1);
            this.addChildGui(this.box);
            if (this.scrollType != sc.ScrollType.X_ONLY) {
                this.scrollbarV =
                    new sc.Slider;
                this.scrollbarV.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.scrollbarV.setPos(1, 2);
                this.scrollbarV.setSize(2, this.hook.size.y - 4 - (this.scrollType == sc.ScrollType.BOTH ? 3 : 0));
                this.addChildGui(this.scrollbarV)
            }
            if (this.scrollType != sc.ScrollType.Y_ONLY) {
                this.scrollbarH = new sc.Slider(false);
                this.scrollbarH.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
                this.scrollbarH.setPos(1, 2);
                this.scrollbarH.setSize(this.hook.size.x - (this.scrollType == sc.ScrollType.BOTH ? 5 : 0), 2);
                this.addChildGui(this.scrollbarH)
            }
        },
        setContent: function(a) {
            this.box.removeAllChildren();
            this.box.addChildGui(a);
            this.recalculateScrollBars()
        },
        scrollX: function(a, c) {
            if (this.scrollType != sc.ScrollType.Y_ONLY) {
                this.scrollbarH.addValue(a, c);
                this.box.doScrollTransition(-this.scrollbarH.value, this.scrollbarV ? -this.scrollbarV.value : 0, c ? 0 : 0.1, b)
            }
        },
        scrollY: function(a, c, d, h) {
            if (this.scrollType != sc.ScrollType.X_ONLY) {
                this.scrollbarV.addValue(a, c);
                this.box.doScrollTransition(this.scrollbarH ? -this.scrollbarH.value : 0, -this.scrollbarV.value, c ? 0 : d ||
                    0.1, h || b)
            }
        },
        setScrollY: function(a, c, d, h) {
            this.scrollbarV.setValue(a, c);
            this.box.doScrollTransition(this.scrollbarH ? -this.scrollbarH.value : 0, -this.scrollbarV.value, c ? 0 : d || 0.1, h || b)
        },
        recalculateScrollBars: function(a) {
            if (!(this.box.hook.children.length <= 0))
                if (this.scrollType == sc.ScrollType.BOTH) {
                    this.recalculateBar(this.box.hook.size.x, this.box.getContentWidth(), this.scrollbarH, a);
                    this.recalculateBar(this.box.hook.size.y, this.box.getContentHeight(), this.scrollbarV, a)
                } else this.scrollType == sc.ScrollType.Y_ONLY ?
                    this.recalculateBar(this.box.hook.size.y, this.box.getContentHeight(), this.scrollbarV, a) : this.recalculateBar(this.box.hook.size.x, this.box.getContentWidth(), this.scrollbarH, a)
        },
        recalculateBar: function(a, b, c, d) {
            c && c.setMinMaxValue(0, Math.max(0, b - a), d)
        },
        updateDrawables: function(a) {
            this.showTopBar && a.addColor("#7E7E7E", 0, 0, this.hook.size.x * ig.system.scale, 1);
            this.showBottomBar && a.addColor("#7E7E7E", 0, this.hook.size.y - 1, this.hook.size.x * ig.system.scale, 1)
        },
        setSize: function(a, b) {
            this.parent(a, b);
            this.box.hook.size.x =
                this.hook.size.x - (this.scrollType != sc.ScrollType.X_ONLY ? 3 : 0);
            this.box.hook.size.y = this.hook.size.y - 2 - (this.scrollType != sc.ScrollType.Y_ONLY ? 4 : 0);
            this.scrollbarV && this.scrollbarV.setSize(2, this.hook.size.y - 4 - (this.scrollType == sc.ScrollType.BOTH ? 3 : 0));
            this.scrollbarH && this.scrollbarH.setSize(this.hook.size.x - (this.scrollType == sc.ScrollType.BOTH ? 5 : 0), 2);
            this.recalculateScrollBars()
        },
        getScrollY: function() {
            return -this.box.hook.scroll.y
        }
    });
    sc.Slider = ig.GuiElementBase.extend({
        offset: Vec2.createC(0, 0),
        inset: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        minValue: 0,
        maxValue: 0,
        value: 0,
        vertical: true,
        scaleThumb: true,
        prefWidth: 0,
        prefHeight: 0,
        thumb: null,
        init: function(a, b, c) {
            this.parent();
            this.vertical = a != void 0 ? a : true;
            this.thumb = b || new sc.Slider.Thumb;
            this.scaleThumb = c == void 0 ? true : c;
            this.addChildGui(this.thumb)
        },
        updateDrawables: function(a) {
            a.addColor("#1A1A1A", 0, 0, this.hook.size.x * ig.system.scale, this.hook.size.y * ig.system.scale)
        },
        range: function(a) {
            if (this.minValue < this.maxValue)
                if (a < this.minValue) a = this.minValue;
                else {
                    if (a > this.maxValue) a =
                        this.maxValue
                }
            else if (a > this.minValue) a = this.minValue;
            else if (a < this.maxValue) a = this.maxValue;
            return a
        },
        calcThumbArea: function() {
            return this.vertical ? Math.max(1, this.hook.size.y - (this.prefHeight || 4)) : Math.max(1, this.hook.size.x - (this.prefWidth || 4))
        },
        setThumbPos: function(a) {
            var c = this.maxValue - this.minValue,
                d = (this.vertical ? this.prefHeight : this.prefWidth) || 4;
            if (this.scaleThumb) var h = Math.max(1, this.vertical ? this.getHeight() : this.getWidth()),
                d = Math.floor(Math.max(d, h * (h / (h + c))));
            h = Math.max(1, (this.vertical ?
                this.getHeight() : this.getWidth()) - d);
            c = (c != 0 ? Math.floor((this.value - this.minValue) * h / c) : 0) + (this.vertical ? this.inset.top : this.inset.left);
            if (this.vertical) {
                this.thumb.setSize(this.prefWidth || this.hook.size.x, d);
                this.thumb.doPosTranstition(this.offset.x, c, a ? 0 : 0.1, b)
            } else {
                this.thumb.setSize(d, this.prefHeight || this.hook.size.y);
                this.thumb.doPosTranstition(c, this.offset.y, a ? 0 : 0.1, b)
            }
        },
        setPreferredThumbSize: function(a, b) {
            this.prefWidth = a || 4;
            this.prefHeight = b || 4
        },
        addValue: function(a, b) {
            this.setValue(this.value +
                a, b)
        },
        setValue: function(a, b) {
            a = this.range(a);
            if (this.value != a || b) {
                this.value = a;
                this.setThumbPos(b)
            }
        },
        setMinMaxValue: function(a, b, c) {
            if (b < a) throw Error("max value can never less then min in ScrollBar!");
            this.minValue = a;
            this.maxValue = b;
            this.value = this.range(this.value);
            this.setThumbPos(c)
        },
        getRange: function() {
            return Math.abs(this.maxValue - this.minValue)
        },
        getWidth: function() {
            return this.hook.size.x - this.inset.right - this.inset.left
        },
        getHeight: function() {
            return this.hook.size.y - this.inset.bottom
        }
    });
    sc.Slider.Thumb =
        ig.GuiElementBase.extend({
            updateDrawables: function(a) {
                a.addColor("#7E7E7E", 0, 0, this.hook.size.x * ig.system.scale, this.hook.size.y * ig.system.scale)
            }
        });
    sc.ScrollPane.Container = ig.GuiElementBase.extend({
        scrollIndex: 0,
        init: function() {
            this.parent();
            this.hook.clip = true
        },
        getContentWidth: function() {
            return this.hook.children.length <= 0 ? 0 : this.hook.children[this.scrollIndex].size.x
        },
        getContentHeight: function() {
            return this.hook.children.length <= 0 ? 0 : this.hook.children[this.scrollIndex].size.y
        }
    });
    sc.TimeAndMoneyGUI =
        sc.MenuPanel.extend({
            gfx: new ig.Image("media/gui/message.png"),
            timeGfx: new ig.Image("media/gui/basic.png"),
            transitions: {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                DEFAULT_FAST: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        offsetX: -136
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_FAST: {
                    state: {
                        offsetX: -136
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE_OUT
                }
            },
            credit: null,
            timeSec: null,
            timeMin: null,
            timeHour: null,
            _lastSec: -1,
            _lastMin: -1,
            _lastHour: -1,
            init: function() {
                this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
                this.setSize(136, 33);
                this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
                sc.Model.addObserver(sc.model.player, this);
                var a = new sc.TextGui(ig.lang.get("sc.gui.menu.credits"), {
                    font: sc.fontsystem.tinyFont
                });
                a.setPos(5, 8);
                this.addChildGui(a);
                a = new sc.TextGui(ig.lang.get("sc.gui.menu.playtime"), {
                    font: sc.fontsystem.tinyFont
                });
                a.setPos(5, 21);
                this.addChildGui(a);
                this.credit = new sc.NumberGui(9999999);
                this.credit.setNumber(sc.model.player.credit);
                this.credit.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.credit.setPos(24, 7);
                this.addChildGui(this.credit);
                this.timeSec = new sc.NumberGui(99, {
                    leadingZeros: 2
                });
                this.timeSec.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.timeSec.setPos(8, 20);
                this.addChildGui(this.timeSec);
                this.timeMin = new sc.NumberGui(99, {
                    leadingZeros: 2
                });
                this.timeMin.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.timeMin.setPos(32, 20);
                this.addChildGui(this.timeMin);
                this.timeHour = new sc.NumberGui(999, {
                    leadingZeros: 3
                });
                this.timeHour.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.timeHour.setPos(56, 20);
                this.addChildGui(this.timeHour);
                this.doStateTransition("HIDDEN", true)
            },
            updateCredit: function() {
                this.credit.setNumber(sc.model.player.credit)
            },
            update: function() {
                var a = sc.stats.getMap("player", "playtime"),
                    b = Math.floor(a) % 60;
                if (b != this._lastSec) {
                    this.timeSec.setNumber(b, true);
                    this._lastSec = b
                }
                b = Math.floor(a / 60) % 60;
                if (b != this._lastMin) {
                    this.timeMin.setNumber(b, true);
                    this._lastMin = b
                }
                b = Math.floor(a / 60 / 60);
                if (b != this._lastHour) {
                    this.timeHour.setNumber(b, true);
                    this._lastHour = b
                }
            },
            updateDrawables: function(a) {
                this.parent(a);
                a.addGfx(this.gfx, this.hook.size.x - 10 - 8, 7, 0, 88, 10, 8);
                a.addGfx(this.timeGfx, 107, 21, 107, 1, 3, 7);
                a.addGfx(this.timeGfx, 82, 21, 107, 1, 3, 7)
            },
            modelChanged: function(a, b) {
                a == sc.model.player && b == sc.PLAYER_MSG.CREDIT_CHANGE && this.credit.setNumber(sc.model.player.credit)
            }
        })
});
ig.baked = !0;
