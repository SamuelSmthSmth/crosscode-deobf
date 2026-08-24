/**
 * game.feature.menu.gui.menu-misc
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.menu-misc")`.
 *
 * Shared menu GUI building blocks (87 modules depend on this):
 * - Panels: `sc.MenuPanel` (+ `sc.HeaderMenuPanel`, `sc.TimeAndMoneyGUI`),
 *   `sc.MenuScanLines`, `sc.DummyContainer`.
 * - Scrolling: `sc.ScrollPane` (+ `Container`), `sc.Slider` (+ `Thumb`),
 *   `sc.ScrollType`.
 * - Buttons/lists: `sc.ListBoxButton`, `sc.ItemBoxButton`, `sc.ToggleSet`,
 *   `sc.ItemMenuToggleAnimation`, `sc.NewUnlockButton`/`sc.NewUnlockOverlay`.
 * - Readouts: `sc.SimpleStatusDisplay`, `sc.PercentNumber`, `sc.PercentChar`,
 *   `sc.BuffInfo`, `sc.InfoBar`.
 */
ig.module("game.feature.menu.gui.menu-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.button", "game.feature.combat.stat-change")
    .defines(function () {

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

    var easeSpline = KEY_SPLINES.EASE;

    sc.MODIFIER_ICON_DRAW = {
        X: 620,
        Y: 219,
        SIZE: 11,
        MAX_PER_ROW: 5
    };

    var statusPosScratch = Vec2.createC(0, 0);

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

        init: function (number, options) {
            this.parent();
            this.number = new sc.NumberGui(number, options);
            this.addChildGui(this.number);
            this.setSize(this.number.hook.size.x + 9, this.number.hook.size.y)
        },

        setNumber: function (number, skipSounds) {
            if (number != 0) this.doStateTransition("DEFAULT", true);
            this.number.setNumber(number, skipSounds);
            this.setSize(this.number.hook.size.x + 9, this.number.hook.size.y)
        },

        setColor: function (color) {
            this.number.setColor(color)
        },

        hide: function () {
            this.setNumber(0, true);
            this.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (ctx) {
            ctx.addGfx(this.gfx, this.hook.size.x - 8, 0, this.number.color * 9, 407, 8, 8)
        }
    });

    sc.NewUnlockButton = sc.ButtonGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        overlay: null,

        init: function (text, width, focus, buttonType, data, description, centerText, icon) {
            this.parent(text, width, focus, buttonType, data, description, centerText, icon);
            this.overlay = new sc.NewUnlockOverlay;
            this.overlay.setPos(4, 4);
            this.addChildGui(this.overlay)
        },

        activateNewOverlay: function (params) {
            this.overlay.activate(params)
        },

        deactivateNewOverlay: function () {
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

        init: function () {
            this.parent(this.gfx, 464, 488, 11, 11);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(5.5, 5.5)
        },

        update: function () {
            this.parent();
            if (this.overlayActive) {
                this.timer = (this.timer + ig.system.actualTick) % 1.6;
                var phase = this.timer / 1.6,
                    scale = KEY_SPLINES.EASE_IN_OUT.get(1 - (phase > 0.5 ? 1 - (phase - 0.5) * 2 : phase * 2)),
                    scale = 0.7 * scale + 0.3;
                if (!this.active) scale = scale * 0.7;
                this.alpha = Math.min(1, scale + 0.3);
                this.hook.localAlpha = this.alpha
            }
        },

        updateDrawables: function (ctx) {
            ctx.addTransform().setPivot(this.hook.pivot.x, this.hook.pivot.y).setScale(this.alpha, this.alpha);
            this.parent(ctx);
            ctx.undoTransform()
        },

        activate: function () {
            this.overlayActive = true;
            this.doStateTransition("DEFAULT", true)
        },

        deactivate: function (transition, skipSounds) {
            this.overlayActive = false;
            this.doStateTransition("HIDDEN", transition ? skipSounds || false : true, transition)
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

        init: function () {
            this.parent();
            this.hook.size.x = 100;
            this.hook.size.y = 21;
            this.setPos(2, 0);
            this.text = new sc.TextGui("", {
                font: sc.fontsystem.tinyFont,
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
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
            this.text.isHelpVisible = function () {
                return sc.menu.buffID >= 0
            };
            this.addChildGui(this.text);
            this.doStateTransition("HIDDEN", true)
        },

        setText: function (text, delay) {
            delay = delay || 0;
            if (delay > 0) this.doStateTransition("FADE_OUT", false, false, null, delay);
            else {
                if (this.hook.currentStateName == "FADE_OUT") this.doStateTransition("DEFAULT", true);
                this.text.setText(text);
                if (text == "") this.doStateTransition("FADE_OUT", true);
                this._width = text ? this.text.hook.size.x + 21 : 0
            }
        },

        updateDrawables: function (ctx) {
            if (this._width) this.ninepatch.draw(ctx, this._width, 12, "default", 2, 4)
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

        init: function (width, height, skipRender) {
            this.parent();
            this.hook.size.x = width || ig.system.width;
            this.hook.size.y = height || 21;
            this.setStateValue("HIDDEN", "offsetY", -this.hook.size.y);
            this.skipRender = skipRender || false;
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

        update: function () {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var progress = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    eased = this.sizeTransition.timeFunction.get(progress);
                this.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - eased) + this.sizeTransition.width * eased);
                this.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - eased) + this.sizeTransition.height * eased);
                if (eased == 1) this.sizeTransition = null
            }
        },

        updateDrawables: function (ctx) {
            if (!this.skipRender) ctx.addColor("#000000", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(this.alpha)
        },

        doSizeTransition: function (width, height, time, timeFunction, delay) {
            if (time) this.sizeTransition = {
                startWidth: this.hook.size.x,
                width: width || 0,
                startHeight: this.hook.size.y,
                height: height || 0,
                time: time,
                timeFunction: timeFunction || KEY_SPLINES.EASE,
                timer: 0 - (delay || 0)
            };
            else {
                this.hook.size.x = width;
                this.hook.size.y = height
            }
        },

        setText: function (text, delay) {
            delay = delay || 0;
            if (delay > 0) this.text.doStateTransition("FADE_OUT", false, false, null, delay);
            else {
                if (this.text.hook.currentStateName == "FADE_OUT") this.text.doStateTransition("DEFAULT", true);
                this.text.setText(text)
            }
        }
    });

    sc.DummyContainer = ig.GuiElementBase.extend({
        init: function (child) {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            this.hook.clip = true;
            this.addChildGui(child)
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

        init: function (text, width, height, id, data, description, centerText, icon) {
            this.parent(true, false);
            width = width || 1;
            height = height || 1;
            data = data != void 0 ? data : "";
            if (icon) {
                this._actualLineWidth = -1;
                width = width + height
            } else this._actualLineWidth = Math.max(0, height - 22);
            this._width = width;
            this.setSize(width + height, sc.BUTTON_TYPE.ITEM.height);
            this.button = new sc.ButtonGui(text, width, true, sc.BUTTON_TYPE.ITEM, icon);
            this.button.hook.setMouseRecord(false);
            if (centerText) {
                this.button.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.button.textChild.setPos(0, 0)
            }
            if (data != void 0) this.setData({
                id: id,
                description: data
            });
            this.addChildGui(this.button);
            if (!this.constructor.PATTERN_FOCUS) this.constructor.PATTERN_FOCUS = this.gfx.createPattern(62, 45, 4, 1, ig.ImagePattern.OPT.REPEAT_X);
            if (!this.constructor.PATTERN_UNFOCUS) this.constructor.PATTERN_UNFOCUS = this.gfx.createPattern(18, 45, 4, 1, ig.ImagePattern.OPT.REPEAT_X)
        },

        setButtonText: function (text) {
            this.button.setText(text, true)
        },

        setLevel: function (level) {
            this.level = level || 0;
            if (this.level > 0) this.setDrawCallback(function (ctx, posY) {
                sc.MenuHelper.drawLevel(this.level, ctx, posY, this.numberGfx, sc.inventory.isScalable(this.data.id))
            }.bind(this));
            else this.setDrawCallback(null)
        },

        setWidth: function (width, height) {
            width = width || 1;
            height = height || 1;
            this._actualLineWidth = Math.max(0, height - 22);
            this._width = width;
            this.hook.size.x = width + height;
            this.button.hook.size.x = width
        },

        setData: function (data) {
            if (data) this.data = data
        },

        setDrawCallback: function (callback) {
            this.button.textChild.setDrawCallback(callback)
        },

        updateDrawables: function (ctx) {
            if (!(this._actualLineWidth < 0)) {
                var buttonWidth = this.button.hook.size.x;
                if (this.focus || this.keepPressed && this.pressed) {
                    ctx.addPattern(this.constructor.PATTERN_FOCUS, buttonWidth, 0, 0, 0, this._actualLineWidth, 1);
                    ctx.addGfx(this.gfx, buttonWidth + this._actualLineWidth, 0, 66, 45, 22, 1)
                } else {
                    ctx.addPattern(this.constructor.PATTERN_UNFOCUS, buttonWidth, 0, 0, 0, this._actualLineWidth, 1);
                    ctx.addGfx(this.gfx, buttonWidth + this._actualLineWidth, 0, 22, 45, 22, 1)
                }
            }
        },

        focusGained: function () {
            this.focus = true;
            this.button.focus = true
        },

        setText: function (text) {
            this.button.setText(text);
            this.button.setWidth(this._width)
        },

        focusLost: function () {
            this.focus = false;
            this.button.focus = false
        },

        setActive: function (active) {
            this.parent(active);
            this.button.setActive(active)
        },

        invokeButtonPress: function () {
            this.button.invokeButtonPress()
        }
    });

    sc.ItemBoxButton = sc.ListBoxButton.extend({
        amount: null,

        init: function (text, width, height, amount, id, description, centerText, icon, unused, maxAmount, level) {
            this.parent(text, width, height, id, description, centerText, icon);
            if (amount >= 0) {
                this.amount = new sc.NumberGui(maxAmount || 99);
                this.amount.setNumber(amount, true);
                this.amount.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.amount.setPos(5, 7);
                this.addChildGui(this.amount)
            }
            this.setLevel(level)
        }
    });

    sc.ToggleSet = ig.GuiElementBase.extend({
        header: null,
        background: null,
        buttons: [],
        set: null,

        init: function (set, buttonGroup, offsetY, counter) {
            this.parent();
            this.setSize(337, 9);
            this.set = set;
            this.background = new ig.ColorGui(set.color || "darkblue");
            this.background.hook.localAlpha = 0.2;
            this.background.setPos(-1, 0);
            this.addChildGui(this.background);
            this.header = new sc.TextGui(ig.LangLabel.getText(set.name), {
                font: sc.fontsystem.tinyFont
            });
            this.header.setPos(0, 1);
            this.addChildGui(this.header);
            this.line = new ig.ColorGui("#545454", this.hook.size.x + 2, 1);
            this.line.setPos(-1, 9);
            this.addChildGui(this.line);
            for (var items = set.items, column = 0, row = 0, group = buttonGroup.buttonGroup(), player = sc.model.player, count = 0, i = 0; i < items.length; i++) {
                var item = sc.inventory.getItem(items[i]);
                if (!(player.getItemAmount(items[i]) < 1)) {
                    var text = null,
                        text = set.type == sc.TOGGLE_SET_TYPE.SINGLE ? "\\i[" + (player.getToggleItemState(items[i]) ? "toggle-item-on-radio" : "toggle-item-off-radio") + "]" : "\\i[" + (player.getToggleItemState(items[i]) ? "toggle-item-on" : "toggle-item-off") + "]",
                        text = text + ig.LangLabel.getText(item.name),
                        item = ig.LangLabel.getText(item.description),
                        text = new sc.ItemBoxButton(text, 142, 24, -1, items[i], item, true);
                    text.set = set;
                    text.setGui = this;
                    text.updateToggleState = function () {
                        var icon = null,
                            icon = player.getToggleItemState(this.data.id),
                            icon = this.set.type == sc.TOGGLE_SET_TYPE.SINGLE ? "\\i[" + (icon ? "toggle-item-on-radio" : "toggle-item-off-radio") + "]" : "\\i[" + (icon ? "toggle-item-on" : "toggle-item-off") + "]",
                            icon = icon + sc.inventory.getItemName(this.data.id);
                        this.setText(icon)
                    };
                    text.button.submitSound = null;
                    text.setPos(column * 168, row * 20 + 11);
                    this.addChildGui(text);
                    this.buttons.push(text);
                    group.addFocusGui(text, column, row + offsetY);
                    column++;
                    if (column >= 2) {
                        column = 0;
                        row++
                    }
                    count++
                }
            }
            counter.counter = count;
            this.hook.size.y = Math.ceil(count / 2) * 20 + 15;
            this.background.setSize(this.hook.size.x + 2, Math.ceil(count / 2) * 20 + 15)
        },

        updateTogglesStates: function (changedButton) {
            for (var i = this.buttons.length; i--;)
                if (changedButton != this.buttons[i]) this.buttons[i].updateToggleState();
            if (changedButton) {
                var anim = new sc.ItemMenuToggleAnimation(function () {
                    changedButton.updateToggleState()
                }.bind(this), changedButton.set.type == sc.TOGGLE_SET_TYPE.SINGLE);
                changedButton.addChildGui(anim)
            }
        }
    });

    var TOGGLE_ANIM_NORMAL_FRAMES = [0, 1, 2, 3, 4],
        TOGGLE_ANIM_RADIO_FRAMES = [5, 6, 7, 8, 9];

    sc.ItemMenuToggleAnimation = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        timer: 0,
        index: 0,
        callback: null,
        radio: false,
        frames: null,

        init: function (callback, radio) {
            this.parent();
            this.setPos(5, 1);
            this.setSize(16, 16);
            this.timer = 0.02;
            this.callback = callback;
            this.frames = (this.radio = radio || false) ? TOGGLE_ANIM_RADIO_FRAMES : TOGGLE_ANIM_NORMAL_FRAMES
        },

        update: function () {
            this.timer = this.timer - ig.system.actualTick;
            if (this.timer <= 0) {
                this.timer = 0.02;
                if (this.index == this.frames.length - 1) {
                    if (this.callback) this.callback();
                    this.remove()
                } else this.index = (this.index + 1) % this.frames.length
            }
        },

        updateDrawables: function (ctx) {
            ctx.addGfx(this.gfx, 0, 0, 656, 352 + this.frames[this.index] * 16, 16, 15)
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

        init: function (name, lineID, iconID, usePercent, value, simpleMode, width, noPercentMode) {
            this.parent();
            this.setSize(width || 169, 11);
            this.width = this.hook.size.x;
            this.name = name || "nope.";
            this.lineID = lineID || 0;
            this.iconID = iconID || 0;
            this.usePercent = usePercent || false;
            this.simpleMode = simpleMode || false;
            this.noPercentMode = noPercentMode || false;
            this.iconIndex.x = this.iconID % sc.MODIFIER_ICON_DRAW.MAX_PER_ROW;
            this.iconIndex.y = Math.floor(this.iconID / sc.MODIFIER_ICON_DRAW.MAX_PER_ROW);
            this.nameGui = new sc.TextGui(name, {
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
                    this.currentValueGui = new sc.NumberGui(value, {
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
                    this.arrowGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
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
                this.changeValueGui = new sc.NumberGui(value, {
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

        setCurrentValue: function (value, skipSounds) {
            if (!this.noPercentMode && !this.simpleMode) {
                value = value || 0;
                value = this.usePercent ? Math.round(value * 100) - 100 : value;
                this.currentValueGui.setNumber(value, skipSounds)
            }
        },

        setChangeValue: function (value, skipSounds, keepVisible) {
            if (this.noPercentMode) this.changeValueGui.offsetY = value <= -1 ? 312 : value >= 1 ? 304 : 320;
            else if (value) {
                value = value || 0;
                value = this.usePercent ? Math.round(value * 100) : value;
                var color = 0;
                if (!this.stayWhite) color = value > 0 ? sc.GUI_NUMBER_COLOR.GREEN : value < 0 ? sc.GUI_NUMBER_COLOR.RED : sc.GUI_NUMBER_COLOR.WHITE;
                this.changeValueGui.setNumber(value, skipSounds);
                this.changeValueGui.setColor(color);
                this.changeValueGui.doStateTransition("DEFAULT", true);
                if (!this.simpleMode) this.arrowGui.doStateTransition("DEFAULT", true);
                if (this.usePercent) {
                    this.percentChangeGui.state = color;
                    this.percentChangeGui.doStateTransition("DEFAULT", true)
                }
            } else if (keepVisible) {
                this.changeValueGui.doStateTransition("DEFAULT", true);
                this.changeValueGui.setNumber(0, skipSounds);
                this.changeValueGui.setColor(0);
                if (this.usePercent) {
                    this.percentChangeGui.state = 0;
                    this.percentChangeGui.doStateTransition("DEFAULT", true)
                }
            } else {
                this.changeValueGui.doStateTransition("HIDDEN", true);
                if (!this.simpleMode) this.arrowGui.doStateTransition("HIDDEN", true);
                if (this.usePercent) this.percentChangeGui.doStateTransition("HIDDEN", true)
            }
        },

        fadeChangeValues: function (delay) {
            if (!this.noPercentMode) {
                delay = delay || 0;
                this.changeValueGui.doStateTransition("FADE", false, false, null, delay);
                if (!this.simpleMode) this.arrowGui.doStateTransition("FADE", false, false, null, delay);
                if (this.usePercent) this.percentChangeGui.doStateTransition("FADE", false, false, null, delay)
            }
        },

        updateDrawables: function (ctx) {
            var gfxX = 0,
                gfxY = this.lineID * 12;
            if (this.noPercentMode) {
                statusPosScratch.x = this.simpleMode ? 144 : 0;
                statusPosScratch.y = (this.simpleMode ? 408 : 329) + gfxY;
                ctx.addGfx(this.gfx, 0, 0, statusPosScratch.x, statusPosScratch.y, 72, 11);
                ctx.addGfx(this.gfx, 72, 0, statusPosScratch.x + 11, statusPosScratch.y, 9, 11);
                ctx.addGfx(this.gfx, 81, 10, statusPosScratch.x + 81, statusPosScratch.y, this.simpleMode ? 46 : 89, 11)
            } else ctx.addGfx(this.gfx, 0, 0, this.simpleMode ? 144 : 0, (this.simpleMode ? 408 : 329) + gfxY, this.width, 11);
            gfxX = this.iconIndex.x * (sc.MODIFIER_ICON_DRAW.SIZE + 1);
            gfxY = this.iconIndex.y * (sc.MODIFIER_ICON_DRAW.SIZE + 1);
            ctx.addGfx(this.gfx, 0, 0, sc.MODIFIER_ICON_DRAW.X + gfxX, sc.MODIFIER_ICON_DRAW.Y + gfxY, sc.MODIFIER_ICON_DRAW.SIZE, sc.MODIFIER_ICON_DRAW.SIZE)
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

        init: function () {
            this.parent();
            this.setSize(8, 8)
        },

        updateDrawables: function (ctx) {
            ctx.addGfx(this.gfx, 0, 0, this.state * 9, 407, 8, 8)
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

        init: function (panelType) {
            this.parent();
            panelType = panelType || sc.MenuPanelType.TOP_LEFT_EDGE;
            switch (panelType) {
                case sc.MenuPanelType.TOP_LEFT_EDGE:
                    this.currentTileOffset = "top-left";
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
                    this.currentTileOffset = "bottom-left";
                    this.flipped = true;
                    break;
                case sc.MenuPanelType.SQUARE:
                    this.currentTileOffset = "square"
            }
        },

        update: function () {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var progress = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    eased = this.sizeTransition.timeFunction.get(progress);
                this.hook.size.x = Math.ceil(this.sizeTransition.startWidth * (1 - eased) + this.sizeTransition.width * eased);
                this.hook.size.y = Math.ceil(this.sizeTransition.startHeight * (1 - eased) + this.sizeTransition.height * eased);
                if (eased == 1) this.sizeTransition = null
            }
        },

        doSizeTransition: function (width, height, time, timeFunction, delay) {
            this.sizeTransition = {
                startWidth: this.hook.size.x,
                width: width || 0,
                startHeight: this.hook.size.y,
                height: height || 0,
                time: time,
                timeFunction: timeFunction || KEY_SPLINES.LINEAR,
                timer: 0 - (delay || 0)
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

        init: function (title, panelType) {
            this.parent(panelType);
            this.title = title || "";
            this.header = new sc.TextGui(this.title, {
                font: sc.fontsystem.tinyFont,
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.header.setPos(2, 1);
            this.addChildGui(this.header)
        },

        updateDrawables: function (ctx) {
            this.parent(ctx);
            this.headerPatch.draw(ctx, this.hook.size.x, 9, "default")
        },

        removeAllChildren: function () {
            this.hook.removeAllChildren();
            this.addChildGui(this.header)
        }
    });

    sc.MenuScanLines = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),

        init: function () {
            this.parent();
            if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(88, 475, 16, 16, ig.ImagePattern.OPT.REPEAT_Y)
        },

        updateDrawables: function (ctx) {
            ctx.addDraw().setPattern(this.constructor.PATTERN, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
        }
    });

    sc.ScrollPane = ig.GuiElementBase.extend({
        box: null,
        scrollType: sc.ScrollType.Y_ONLY,
        scrollbarV: null,
        scrollbarH: null,
        showTopBar: true,
        showBottomBar: true,

        init: function (scrollType) {
            this.parent();
            this.scrollType = scrollType || sc.ScrollType.BOTH;
            this.box = new sc.ScrollPane.Container;
            this.box.setPos(0, 1);
            this.addChildGui(this.box);
            if (this.scrollType != sc.ScrollType.X_ONLY) {
                this.scrollbarV = new sc.Slider;
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

        setContent: function (content) {
            this.box.removeAllChildren();
            this.box.addChildGui(content);
            this.recalculateScrollBars()
        },

        scrollX: function (delta, skipSounds) {
            if (this.scrollType != sc.ScrollType.Y_ONLY) {
                this.scrollbarH.addValue(delta, skipSounds);
                this.box.doScrollTransition(-this.scrollbarH.value, this.scrollbarV ? -this.scrollbarV.value : 0, skipSounds ? 0 : 0.1, easeSpline)
            }
        },

        scrollY: function (delta, skipSounds, time, timeFunction) {
            if (this.scrollType != sc.ScrollType.X_ONLY) {
                this.scrollbarV.addValue(delta, skipSounds);
                this.box.doScrollTransition(this.scrollbarH ? -this.scrollbarH.value : 0, -this.scrollbarV.value, skipSounds ? 0 : time || 0.1, timeFunction || easeSpline)
            }
        },

        setScrollY: function (value, skipSounds, time, timeFunction) {
            this.scrollbarV.setValue(value, skipSounds);
            this.box.doScrollTransition(this.scrollbarH ? -this.scrollbarH.value : 0, -this.scrollbarV.value, skipSounds ? 0 : time || 0.1, timeFunction || easeSpline)
        },

        recalculateScrollBars: function (skipSounds) {
            if (!(this.box.hook.children.length <= 0))
                if (this.scrollType == sc.ScrollType.BOTH) {
                    this.recalculateBar(this.box.hook.size.x, this.box.getContentWidth(), this.scrollbarH, skipSounds);
                    this.recalculateBar(this.box.hook.size.y, this.box.getContentHeight(), this.scrollbarV, skipSounds)
                } else if (this.scrollType == sc.ScrollType.Y_ONLY)
                    this.recalculateBar(this.box.hook.size.y, this.box.getContentHeight(), this.scrollbarV, skipSounds);
                else this.recalculateBar(this.box.hook.size.x, this.box.getContentWidth(), this.scrollbarH, skipSounds)
        },

        recalculateBar: function (boxSize, contentSize, scrollbar, skipSounds) {
            if (scrollbar) scrollbar.setMinMaxValue(0, Math.max(0, contentSize - boxSize), skipSounds)
        },

        updateDrawables: function (ctx) {
            if (this.showTopBar) ctx.addColor("#7E7E7E", 0, 0, this.hook.size.x * ig.system.scale, 1);
            if (this.showBottomBar) ctx.addColor("#7E7E7E", 0, this.hook.size.y - 1, this.hook.size.x * ig.system.scale, 1)
        },

        setSize: function (width, height) {
            this.parent(width, height);
            this.box.hook.size.x = this.hook.size.x - (this.scrollType != sc.ScrollType.X_ONLY ? 3 : 0);
            this.box.hook.size.y = this.hook.size.y - 2 - (this.scrollType != sc.ScrollType.Y_ONLY ? 4 : 0);
            if (this.scrollbarV) this.scrollbarV.setSize(2, this.hook.size.y - 4 - (this.scrollType == sc.ScrollType.BOTH ? 3 : 0));
            if (this.scrollbarH) this.scrollbarH.setSize(this.hook.size.x - (this.scrollType == sc.ScrollType.BOTH ? 5 : 0), 2);
            this.recalculateScrollBars()
        },

        getScrollY: function () {
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

        init: function (vertical, thumb, scaleThumb) {
            this.parent();
            this.vertical = vertical != void 0 ? vertical : true;
            this.thumb = thumb || new sc.Slider.Thumb;
            this.scaleThumb = scaleThumb == void 0 ? true : scaleThumb;
            this.addChildGui(this.thumb)
        },

        updateDrawables: function (ctx) {
            ctx.addColor("#1A1A1A", 0, 0, this.hook.size.x * ig.system.scale, this.hook.size.y * ig.system.scale)
        },

        range: function (value) {
            if (this.minValue < this.maxValue)
                if (value < this.minValue) value = this.minValue;
                else {
                    if (value > this.maxValue) value = this.maxValue
                }
            else if (value > this.minValue) value = this.minValue;
            else if (value < this.maxValue) value = this.maxValue;
            return value
        },

        calcThumbArea: function () {
            return this.vertical ? Math.max(1, this.hook.size.y - (this.prefHeight || 4)) : Math.max(1, this.hook.size.x - (this.prefWidth || 4))
        },

        setThumbPos: function (skipSounds) {
            var range = this.maxValue - this.minValue,
                thumbSize = (this.vertical ? this.prefHeight : this.prefWidth) || 4;
            if (this.scaleThumb) {
                var barSize = Math.max(1, this.vertical ? this.getHeight() : this.getWidth());
                thumbSize = Math.floor(Math.max(thumbSize, barSize * (barSize / (barSize + range))))
            }
            barSize = Math.max(1, (this.vertical ? this.getHeight() : this.getWidth()) - thumbSize);
            var pos = (range != 0 ? Math.floor((this.value - this.minValue) * barSize / range) : 0) + (this.vertical ? this.inset.top : this.inset.left);
            if (this.vertical) {
                this.thumb.setSize(this.prefWidth || this.hook.size.x, thumbSize);
                this.thumb.doPosTranstition(this.offset.x, pos, skipSounds ? 0 : 0.1, easeSpline)
            } else {
                this.thumb.setSize(thumbSize, this.prefHeight || this.hook.size.y);
                this.thumb.doPosTranstition(pos, this.offset.y, skipSounds ? 0 : 0.1, easeSpline)
            }
        },

        setPreferredThumbSize: function (width, height) {
            this.prefWidth = width || 4;
            this.prefHeight = height || 4
        },

        addValue: function (delta, skipSounds) {
            this.setValue(this.value + delta, skipSounds)
        },

        setValue: function (value, skipSounds) {
            value = this.range(value);
            if (this.value != value || skipSounds) {
                this.value = value;
                this.setThumbPos(skipSounds)
            }
        },

        setMinMaxValue: function (min, max, skipSounds) {
            if (max < min) throw Error("max value can never less then min in ScrollBar!");
            this.minValue = min;
            this.maxValue = max;
            this.value = this.range(this.value);
            this.setThumbPos(skipSounds)
        },

        getRange: function () {
            return Math.abs(this.maxValue - this.minValue)
        },

        getWidth: function () {
            return this.hook.size.x - this.inset.right - this.inset.left
        },

        getHeight: function () {
            return this.hook.size.y - this.inset.bottom
        }
    });

    sc.Slider.Thumb = ig.GuiElementBase.extend({
        updateDrawables: function (ctx) {
            ctx.addColor("#7E7E7E", 0, 0, this.hook.size.x * ig.system.scale, this.hook.size.y * ig.system.scale)
        }
    });

    sc.ScrollPane.Container = ig.GuiElementBase.extend({
        scrollIndex: 0,

        init: function () {
            this.parent();
            this.hook.clip = true
        },

        getContentWidth: function () {
            return this.hook.children.length <= 0 ? 0 : this.hook.children[this.scrollIndex].size.x
        },

        getContentHeight: function () {
            return this.hook.children.length <= 0 ? 0 : this.hook.children[this.scrollIndex].size.y
        }
    });

    sc.TimeAndMoneyGUI = sc.MenuPanel.extend({
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

        init: function () {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(136, 33);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            sc.Model.addObserver(sc.model.player, this);
            var label = new sc.TextGui(ig.lang.get("sc.gui.menu.credits"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(5, 8);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.menu.playtime"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(5, 21);
            this.addChildGui(label);
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

        updateCredit: function () {
            this.credit.setNumber(sc.model.player.credit)
        },

        update: function () {
            var playtime = sc.stats.getMap("player", "playtime"),
                value = Math.floor(playtime) % 60;
            if (value != this._lastSec) {
                this.timeSec.setNumber(value, true);
                this._lastSec = value
            }
            value = Math.floor(playtime / 60) % 60;
            if (value != this._lastMin) {
                this.timeMin.setNumber(value, true);
                this._lastMin = value
            }
            value = Math.floor(playtime / 60 / 60);
            if (value != this._lastHour) {
                this.timeHour.setNumber(value, true);
                this._lastHour = value
            }
        },

        updateDrawables: function (ctx) {
            this.parent(ctx);
            ctx.addGfx(this.gfx, this.hook.size.x - 10 - 8, 7, 0, 88, 10, 8);
            ctx.addGfx(this.timeGfx, 107, 21, 107, 1, 3, 7);
            ctx.addGfx(this.timeGfx, 82, 21, 107, 1, 3, 7)
        },

        modelChanged: function (model, msg) {
            if (model == sc.model.player && msg == sc.PLAYER_MSG.CREDIT_CHANGE) this.credit.setNumber(sc.model.player.credit)
        }
    })
});
ig.baked = !0;
