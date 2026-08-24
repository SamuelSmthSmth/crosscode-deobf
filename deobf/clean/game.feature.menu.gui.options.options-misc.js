/**
 * game.feature.menu.gui.options.options-misc
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.options.options-misc")`.
 *
 * Supporting widgets of the options pane:
 *  - `sc.KeyBinderGui`: the modal "press any key" rebind dialog with
 *    unbind / back buttons and a key black-list check.
 *  - `sc.OptionSlider`: the slider track (optional fill) for option rows.
 *  - `sc.OptionThumb`: the draggable slider thumb.
 *  - `sc.OptionFocusSlider`: focusable slider with snapping, click-to-set,
 *    keyboard focus and drag callbacks.
 *  - `sc.OptionLangPopUp`: the language picker popup (per-language flag
 *    buttons laid out in a 2-column grid).
 */
ig.module("game.feature.menu.gui.options.options-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.KeyBinderGui = ig.ColorGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
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
        box: null,
        button: null,
        back: null,
        buttonGroup: null,
        buttonInteract: null,
        finishCallback: null,
        bindedKeyCheck: null,
        isAlternative: null,

        init: function () {
            this.parent("black");
            this.hook.pauseGui = true;
            this.hook.zIndex = 9001;
            this.hook.localAlpha = 0.9;
            this.box = new sc.BlackWhiteBox(200, 60);
            this.box.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.box.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleY: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.box);
            this.button = new sc.ButtonGui(ig.lang.get("sc.gui.options.controls.unbind"));
            this.button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.button.setPos(4, 6);
            this.button.onButtonPress = this.onUnbindPress.bind(this);
            this.box.addChildGui(this.button);
            this.back = new sc.ButtonGui(ig.lang.get("sc.gui.options.controls.back"));
            this.back.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.back.setPos(4, 6);
            this.back.onButtonPress = this.onReturnPress.bind(this);
            this.box.addChildGui(this.back);
            var hint = new sc.TextGui(ig.lang.get("sc.gui.options.controls.anykey"));
            hint.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            hint.setPos(0, 6);
            this.box.addChildGui(hint);
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.buttonInteract.addGlobalButton(this.button, this.onGlobalButtonCheck.bind(this));
            this.buttonInteract.addGlobalButton(this.back, this.onGlobalButtonCheck.bind(this));
            this.doStateTransition("HIDDEN", true);
            this.box.doStateTransition("HIDDEN", true)
        },

        show: function (finishCallback, anchor, isAlternative) {
            this.doStateTransition("DEFAULT");
            this.box.doStateTransition("DEFAULT");
            if (isAlternative) {
                this.button.setPos(4, 6);
                this.back.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
                this.back.setPos(4, 6)
            } else {
                this.button.setPos(-1E3, -1E3);
                this.back.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                this.back.setPos(0, 6)
            }
            var width = Math.max(150, this.button.hook.size.x + this.back.hook.size.x + 12);
            this.box.setSize(width, 60);
            this.finishCallback = finishCallback || null;
            this.isAlternative = isAlternative;
            ig.input.ignoreKeyboard = true;
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.bindedKeyCheck = this.onKeyCheck.bind(this);
            window.addEventListener("keydown", this.bindedKeyCheck, false)
        },

        hide: function () {
            this.doStateTransition("HIDDEN");
            this.box.doStateTransition("HIDDEN");
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            window.removeEventListener("keydown", this.bindedKeyCheck);
            this.finishCallback = null;
            this.isAlternative = false;
            ig.input.ignoreKeyboard = false
        },

        onUnbindPress: function () {
            if (this.isAlternative) {
                this.finishCallback && this.finishCallback(null, this.isAlternative, true);
                this.hide()
            }
        },

        onReturnPress: function () {
            this.hide()
        },

        onKeyCheck: function (event) {
            event.preventDefault();
            if (!ig.interact.isBlocked() && !this._isBlackedListed(event.keyCode)) {
                this.finishCallback && this.finishCallback(event.keyCode, this.isAlternative, false);
                this.hide()
            }
        },

        onGlobalButtonCheck: function () {
            return false
        },

        _isBlackedListed: function (keyCode) {
            return sc.KEY_BLACK_LIST[keyCode]
        }
    });

    sc.OptionSlider = sc.Slider.extend({
        backgroundNinePatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 8,
            height: 0,
            left: 4,
            top: 9,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 128,
                    y: 84
                },
                "default-focus": {
                    x: 144,
                    y: 84
                },
                fill: {
                    x: 128,
                    y: 72
                },
                "fill-focus": {
                    x: 144,
                    y: 72
                }
            }
        }),
        fill: false,
        focus: false,

        init: function (minValue, maxValue, defaultValue, isFill) {
            this.parent(minValue, maxValue, defaultValue);
            this.fill = isFill != void 0 ? isFill : false
        },

        updateDrawables: function (renderer) {
            this.backgroundNinePatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? "default-focus" : "default");
            this.fill && this.backgroundNinePatch.draw(renderer, this.thumb.hook.pos.x + this.prefWidth / 2, this.hook.size.y, this.focus ? "fill-focus" : "fill")
        },

        setSize: function (width, height) {
            this.hook.size.x = width;
            this.hook.size.y = height;
            this.setThumbPos(true)
        }
    });

    sc.OptionThumb = ig.GuiElementBase.extend({
        thumbNinePatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 6,
            height: 0,
            left: 4,
            top: 21,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 96,
                    y: 72
                },
                focus: {
                    x: 112,
                    y: 72
                }
            }
        }),
        currentOffset: "default",
        slider: null,
        drag: false,
        wasDragged: false,
        starValue: 0,
        _startPos: Vec2.createC(0, 0),

        init: function (slider) {
            this.parent();
            this.slider = slider
        },

        onMouseInteract: function (x, y, pressed) {
            if (!pressed)
                if (sc.control.getGuiPressed()) {
                    this.drag = true;
                    this.starValue = this.slider.slider.value;
                    this._startPos.x = x;
                    this._startPos.y = y
                } else sc.control.getGuiHold() ? this.drag && this.slider.onDrag && this.slider.onDrag(x - this._startPos.x, y - this._startPos.y, this.starValue) : this.drag = false
        },

        updateDrawables: function (renderer) {
            this.thumbNinePatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.currentOffset)
        }
    });

    sc.OptionFocusSlider = ig.FocusGui.extend({
        slider: null,
        thumb: null,
        snap: true,
        changeCallback: null,
        clickSound: sc.BUTTON_SOUND.submit,
        _hasKeyboardFocus: false,
        _buttongroup: null,

        init: function (changeCallback, snap, isFill, buttongroup) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this._buttongroup = buttongroup || null;
            this.snap = snap == void 0 ? true : snap;
            this.changeCallback = changeCallback || null;
            this.thumb = new sc.OptionThumb(this);
            this.slider = new sc.OptionSlider(false, this.thumb, false, isFill);
            this.slider.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.slider.offset.y = -6;
            this.slider.inset.left = 2;
            this.slider.inset.right = 2;
            this.addChildGui(this.slider)
        },

        setPreferredThumbSize: function (width, height) {
            this.slider.setPreferredThumbSize(width, height)
        },

        setSize: function (width, height, sliderHeight) {
            this.parent(width, height);
            this.slider.setSize(width, sliderHeight || height);
            this.slider.setThumbPos(true)
        },

        setValue: function (value) {
            this.slider.setValue(value, true)
        },

        setMinMaxValue: function (minValue, maxValue) {
            this.slider.setMinMaxValue(minValue, maxValue, true)
        },

        getValue: function () {
            return this.slider.value
        },

        update: function () {
            this.parent();
            if (!ig.input.mouseGuiActive) this.thumb.currentOffset = this.focus ? "focus" : "default"
        },

        focusGained: function () {
            this.focus = true;
            this.slider.focus = true
        },

        focusLost: function () {
            this.focus = false;
            this.slider.focus = false
        },

        canPlayFocusSounds: function () {
            return !this.thumb.drag
        },

        canLeaveFocus: function () {
            return !this.thumb.drag
        },

        onMouseInteract: function (x, y, pressed) {
            this.parent(x, y);
            if (!ig.interact.isBlocked() && (!this._buttongroup || this._buttongroup.isActive())) {
                this._hasKeyboardFocus = false;
                var screen = this.hook.screenCoords,
                    thumbHook = this.thumb.hook;
                if (!thumbHook.screenCoords) this.thumb.hook.screenCoords = {
                    x: 0,
                    y: 0,
                    w: thumbHook.size.x,
                    h: thumbHook.size.y
                };
                thumbHook.screenCoords.x = screen.x + thumbHook.pos.x - this.slider.offset.x;
                thumbHook.screenCoords.y = screen.y + thumbHook.pos.y - this.slider.offset.y;
                var thumbScreen = thumbHook.screenCoords,
                    mouseX = sc.control.getMouseX(),
                    mouseY = sc.control.getMouseY();
                if (thumbScreen.x <= mouseX && thumbScreen.x + thumbScreen.w > mouseX && thumbScreen.y <= mouseY && thumbScreen.y + thumbScreen.h > mouseY || this.thumb.drag) {
                    this.thumb.currentOffset = "focus";
                    this.thumb.onMouseInteract(mouseX | 0, mouseY | 0, pressed)
                } else {
                    this.thumb.currentOffset = "default";
                    if (pressed) {
                        this.clickSound && this.clickSound.play();
                        var value = Math.max(0, mouseX - this.hook.screenCoords.x);
                        value = Math.round(value / this.slider.hook.size.x * this.slider.getRange());
                        this.slider.setValue(value, true);
                        this.changeCallback && this.changeCallback(value)
                    }
                }
            }
        },

        onDrag: function (dx, dy, startValue) {
            dx = this.vertical ? dy : dx;
            var slider = this.slider;
            dx = (slider.maxValue - slider.minValue) * dx / slider.calcThumbArea();
            slider.setValue(this.snap ? Math.round(startValue + dx) : startValue + dx, true);
            this.changeCallback && this.changeCallback(slider.value)
        }
    });

    sc.OptionLangPopUp = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 480,
                    y: 304
                }
            }
        }),
        buttongroup: null,
        anchor: null,
        callback: null,
        buttons: [],
        active: false,
        _prevPressed: null,

        init: function () {
            this.parent(429, 50);
            this.setPivot(427, 0);
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.addPressCallback(function (button) {
                if (button && button.data && button.data.lang != void 0) {
                    this.anchor.onLanguageSelected(false, button.data.lang);
                    this.hide()
                }
            }.bind(this));
            this.createButtons();
            this.doStateTransition("HIDDEN", true)
        },

        createButtons: function () {
            var x = 3,
                y = 4,
                index = 0;
            for (var code in sc.LANGUAGE) {
                var lang = sc.LANGUAGE[code],
                    label = "\\i[language-" + lang + "] " + ig.lang.get("sc.gui.options.language.group")[lang],
                    button = new sc.ButtonGui(label, 210, true, index % 2 == 0 ? sc.BUTTON_TYPE.GROUP_LEFT : sc.BUTTON_TYPE.GROUP_RIGHT, null, true);
                button.noFocusOnPressed = true;
                button.setPos(x, y);
                button.setData({
                    lang: lang
                });
                this.addChildGui(button);
                this.buttons[lang] = button;
                this.buttongroup.addFocusGui(button, index % 2, Math.floor(index / 2));
                index++;
                x = x + 212;
                if (index % 2 == 0) {
                    x = 3;
                    y = y + 22
                }
            }
            this.hook.size.y = y + 24;
            var current = sc.options.get("language");
            this._prevPressed = this.buttons[current];
            this.resetButtons(this._prevPressed);
            this.buttongroup.setPressedFocusGui(this._prevPressed)
        },

        resetButtons: function (pressedButton) {
            for (var i = this.buttons.length; i--;) this.buttons[i] && this.buttons[i] != pressedButton && this.buttons[i].setPressed(false)
        },

        show: function (anchor, callback) {
            if (!this.active) {
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                sc.menu.pushBackCallback(this.onBackButtonPressed.bind(this));
                this.callback = callback || null;
                this.active = true;
                this.anchor = anchor;
                var anchorHook = anchor.button.hook;
                this.setPos(anchorHook.screenCoords.x - 429 + anchorHook.screenCoords.w, anchorHook.screenCoords.y + anchorHook.screenCoords.h);
                var current = sc.options.get("language");
                this._prevPressed = this.buttons[current];
                this.resetButtons(this._prevPressed);
                this.buttongroup.setPressedFocusGui(this._prevPressed);
                ig.interact.setBlockDelay(0.2);
                this.doStateTransition("DEFAULT")
            }
        },

        hide: function () {
            if (this.active) {
                this.active = false;
                sc.menu.popBackCallback();
                sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
                this.callback && this.callback();
                this.anchor.onLanguageSelected(true);
                sc.menu.buttonInteract.clearMouseOverFocus();
                this.doStateTransition("HIDDEN")
            }
        },

        onBackButtonPressed: function () {
            this.hide()
        }
    })
});
ig.baked = !0;
