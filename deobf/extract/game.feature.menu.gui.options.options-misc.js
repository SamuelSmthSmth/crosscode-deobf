ig.module("game.feature.menu.gui.options.options-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.menu.gui.menu-misc").defines(function() {
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
        init: function() {
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
            this.button.setAlign(ig.GUI_ALIGN.X_LEFT,
                ig.GUI_ALIGN.Y_BOTTOM);
            this.button.setPos(4, 6);
            this.button.onButtonPress = this.onUnbindPress.bind(this);
            this.box.addChildGui(this.button);
            this.back = new sc.ButtonGui(ig.lang.get("sc.gui.options.controls.back"));
            this.back.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.back.setPos(4, 6);
            this.back.onButtonPress = this.onReturnPress.bind(this);
            this.box.addChildGui(this.back);
            var b = new sc.TextGui(ig.lang.get("sc.gui.options.controls.anykey"));
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            b.setPos(0, 6);
            this.box.addChildGui(b);
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.buttonInteract.addGlobalButton(this.button, this.onGlobalButtonCheck.bind(this));
            this.buttonInteract.addGlobalButton(this.back, this.onGlobalButtonCheck.bind(this));
            this.doStateTransition("HIDDEN", true);
            this.box.doStateTransition("HIDDEN", true)
        },
        show: function(b, a, d) {
            this.doStateTransition("DEFAULT");
            this.box.doStateTransition("DEFAULT");
            if (d) {
                this.button.setPos(4, 6);
                this.back.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
                this.back.setPos(4, 6)
            } else {
                this.button.setPos(-1E3, -1E3);
                this.back.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                this.back.setPos(0, 6)
            }
            a = Math.max(150, this.button.hook.size.x + this.back.hook.size.x + 12);
            this.box.setSize(a, 60);
            this.finishCallback = b || null;
            this.isAlternative = d;
            ig.input.ignoreKeyboard = true;
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.bindedKeyCheck = this.onKeyCheck.bind(this);
            window.addEventListener("keydown", this.bindedKeyCheck, false)
        },
        hide: function() {
            this.doStateTransition("HIDDEN");
            this.box.doStateTransition("HIDDEN");
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            window.removeEventListener("keydown", this.bindedKeyCheck);
            this.finishCallback = null;
            this.isAlternative = false;
            ig.input.ignoreKeyboard = false
        },
        onUnbindPress: function() {
            if (this.isAlternative) {
                this.finishCallback && this.finishCallback(null, this.isAlternative, true);
                this.hide()
            }
        },
        onReturnPress: function() {
            this.hide()
        },
        onKeyCheck: function(b) {
            b.preventDefault();
            if (!ig.interact.isBlocked() && !this._isBlackedListed(b.keyCode)) {
                this.finishCallback && this.finishCallback(b.keyCode, this.isAlternative, false);
                this.hide()
            }
        },
        onGlobalButtonCheck: function() {
            return false
        },
        _isBlackedListed: function(b) {
            return sc.KEY_BLACK_LIST[b]
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
        init: function(b, a, d, c) {
            this.parent(b, a, d);
            this.fill = c != void 0 ? c : false
        },
        updateDrawables: function(b) {
            this.backgroundNinePatch.draw(b, this.hook.size.x, this.hook.size.y, this.focus ? "default-focus" : "default");
            this.fill && this.backgroundNinePatch.draw(b, this.thumb.hook.pos.x + this.prefWidth / 2, this.hook.size.y, this.focus ? "fill-focus" : "fill")
        },
        setSize: function(b, a) {
            this.hook.size.x = b;
            this.hook.size.y = a;
            this.setThumbPos(true)
        }
    });
    sc.OptionThumb =
        ig.GuiElementBase.extend({
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
            init: function(b) {
                this.parent();
                this.slider = b
            },
            onMouseInteract: function(b, a, d) {
                if (!d)
                    if (sc.control.getGuiPressed()) {
                        this.drag = true;
                        this.starValue = this.slider.slider.value;
                        this._startPos.x = b;
                        this._startPos.y = a
                    } else sc.control.getGuiHold() ?
                        this.drag && this.slider.onDrag && this.slider.onDrag(b - this._startPos.x, a - this._startPos.y, this.starValue) : this.drag = false
            },
            updateDrawables: function(b) {
                this.thumbNinePatch.draw(b, this.hook.size.x, this.hook.size.y, this.currentOffset)
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
        init: function(b, a, d, c) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this._buttongroup =
                c || null;
            this.snap = a == void 0 ? true : a;
            this.changeCallback = b || null;
            this.thumb = new sc.OptionThumb(this);
            this.slider = new sc.OptionSlider(false, this.thumb, false, d);
            this.slider.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.slider.offset.y = -6;
            this.slider.inset.left = 2;
            this.slider.inset.right = 2;
            this.addChildGui(this.slider)
        },
        setPreferredThumbSize: function(b, a) {
            this.slider.setPreferredThumbSize(b, a)
        },
        setSize: function(b, a, d) {
            this.parent(b, a);
            this.slider.setSize(b, d || a);
            this.slider.setThumbPos(true)
        },
        setValue: function(b) {
            this.slider.setValue(b, true)
        },
        setMinMaxValue: function(b, a) {
            this.slider.setMinMaxValue(b, a, true)
        },
        getValue: function() {
            return this.slider.value
        },
        update: function() {
            this.parent();
            if (!ig.input.mouseGuiActive) this.thumb.currentOffset = this.focus ? "focus" : "default"
        },
        focusGained: function() {
            this.focus = true;
            this.slider.focus = true
        },
        focusLost: function() {
            this.focus = false;
            this.slider.focus = false
        },
        canPlayFocusSounds: function() {
            return !this.thumb.drag
        },
        canLeaveFocus: function() {
            return !this.thumb.drag
        },
        onMouseInteract: function(b, a) {
            this.parent(b, a);
            if (!ig.interact.isBlocked() && (!this._buttongroup || this._buttongroup.isActive())) {
                this._hasKeyboardFocus = false;
                var d = this.hook.screenCoords,
                    c = this.thumb.hook;
                if (!c.screenCoords) this.thumb.hook.screenCoords = {
                    x: 0,
                    y: 0,
                    w: c.size.x,
                    h: c.size.y
                };
                c.screenCoords.x = d.x + c.pos.x - this.slider.offset.x;
                c.screenCoords.y = d.y + c.pos.y - this.slider.offset.y;
                var d = c.screenCoords,
                    c = sc.control.getMouseX(),
                    e = sc.control.getMouseY();
                if (d.x <= c && d.x + d.w > c && d.y <= e && d.y + d.h > e || this.thumb.drag) {
                    this.thumb.currentOffset =
                        "focus";
                    this.thumb.onMouseInteract(c | 0, e | 0, a)
                } else {
                    this.thumb.currentOffset = "default";
                    if (a) {
                        this.clickSound && this.clickSound.play();
                        d = Math.max(0, c - this.hook.screenCoords.x);
                        d = Math.round(d / this.slider.hook.size.x * this.slider.getRange());
                        this.slider.setValue(d, true);
                        this.changeCallback && this.changeCallback(d)
                    }
                }
            }
        },
        onDrag: function(b, a, d) {
            b = this.vertical ? a : b;
            a = this.slider;
            b = (a.maxValue - a.minValue) * b / a.calcThumbArea();
            a.setValue(this.snap ? Math.round(d + b) : d + b, true);
            this.changeCallback && this.changeCallback(a.value)
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
        init: function() {
            this.parent(429, 50);
            this.setPivot(427, 0);
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.addPressCallback(function(b) {
                if (b && b.data && b.data.lang != void 0) {
                    this.anchor.onLanguageSelected(false, b.data.lang);
                    this.hide()
                }
            }.bind(this));
            this.createButtons();
            this.doStateTransition("HIDDEN", true)
        },
        createButtons: function() {
            var b = 3,
                a = 4,
                d = 0,
                c;
            for (c in sc.LANGUAGE) {
                var e = sc.LANGUAGE[c],
                    f = "\\i[language-" + e + "] " + ig.lang.get("sc.gui.options.language.group")[e],
                    f = new sc.ButtonGui(f, 210, true, d % 2 == 0 ? sc.BUTTON_TYPE.GROUP_LEFT : sc.BUTTON_TYPE.GROUP_RIGHT, null, true);
                f.noFocusOnPressed = true;
                f.setPos(b, a);
                f.setData({
                    lang: e
                });
                this.addChildGui(f);
                this.buttons[e] = f;
                this.buttongroup.addFocusGui(f, d % 2, Math.floor(d / 2));
                d++;
                b = b + 212;
                if (d % 2 == 0) {
                    b = 3;
                    a = a + 22
                }
            }
            this.hook.size.y = a + 24;
            b = sc.options.get("language");
            this._prevPressed = this.buttons[b];
            this.resetButtons(this._prevPressed);
            this.buttongroup.setPressedFocusGui(this._prevPressed)
        },
        resetButtons: function(b) {
            for (var a = this.buttons.length; a--;) this.buttons[a] && this.buttons[a] != b && this.buttons[a].setPressed(false)
        },
        show: function(b, a) {
            if (!this.active) {
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                sc.menu.pushBackCallback(this.onBackButtonPressed.bind(this));
                this.callback = a || null;
                this.active = true;
                this.anchor = b;
                var d = b.button.hook;
                this.setPos(d.screenCoords.x - 429 + d.screenCoords.w, d.screenCoords.y + d.screenCoords.h);
                d = sc.options.get("language");
                this._prevPressed = this.buttons[d];
                this.resetButtons(this._prevPressed);
                this.buttongroup.setPressedFocusGui(this._prevPressed);
                ig.interact.setBlockDelay(0.2);
                this.doStateTransition("DEFAULT")
            }
        },
        hide: function() {
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
        onBackButtonPressed: function() {
            this.hide()
        }
    })
});
ig.baked = !0;
