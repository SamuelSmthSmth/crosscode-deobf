ig.module("game.feature.menu.gui.options.options-types").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.options.options-misc", "game.feature.model.options-model").defines(function() {
    var b = [],
        a = 0,
        d = 0;
    sc.OPTION_GUIS = {};
    sc.OPTION_GUIS[sc.OPTION_TYPES.BUTTON_GROUP] = ig.GuiElementBase.extend({
        base: null,
        buttons: [],
        _prevPressed: null,
        _rowGroup: null,
        init: function(a, d, f) {
            this.parent();
            this.base = a;
            var g = a.option.data;
            b.length = 0;
            for (var h in g) b.push(g[h]);
            this._rowGroup = f;
            g = Math.floor(d / b.length);
            h = null;
            for (var i, j = 0, k = 0; k < b.length; k++) {
                i = ig.lang.get("sc.gui.options." + a.optionName + ".group")[b[k]];
                h = k == 0 ? new sc.ButtonGui(i, g, true, sc.BUTTON_TYPE.GROUP_LEFT, null, true) : k == b.length - 1 ? new sc.ButtonGui(i, g, true, sc.BUTTON_TYPE.GROUP_RIGHT, null, true) : new sc.ButtonGui(i, g, true, sc.BUTTON_TYPE.GROUP, null, true);
                k == b.length - 1 && g * b.length < d ? h.setWidth(g + 1) : h.setWidth(g);
                h.noFocusOnPressed = true;
                var l = g;
                if ((new ig.TextBlock(sc.fontsystem.font, i, {})).size.x < l - 16) i = sc.fontsystem.font;
                else if ((new ig.TextBlock(sc.fontsystem.smallFont, i, {})).size.x < l - 16) i = sc.fontsystem.smallFont;
                else {
                    new ig.TextBlock(sc.fontsystem.tinyFont, i, {});
                    i = sc.fontsystem.tinyFont
                }
                i != h.textChild.font && h.textChild.setFont(i, null);
                h.setPressed = function(a) {
                    (this.pressed = a) ? this.textChild.setText("\\c[0]" + this.text): this.textChild.setText("\\c[" + sc.FONT_COLORS.GREY + "]" + this.text)
                };
                h.data = {
                    description: a.optionDes,
                    id: b[k],
                    row: a.row
                };
                h.setPos(j, 3);
                j = j + h.hook.size.x;
                f.addFocusGui(h, k, a.row);
                this.buttons[b[k]] = h;
                this.addChildGui(h)
            }
            a = sc.options.get(a.optionName, a.local);
            this._prevPressed = this.buttons[a];
            this.resetButtons(this._prevPressed);
            f.setPressedFocusGui(this._prevPressed)
        },
        resetButtons: function(a) {
            for (var b = this.buttons.length; b--;) this.buttons[b] != a && this.buttons[b].setPressed(false)
        },
        onAttach: function() {
            sc.Model.addObserver(sc.options, this)
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.options, this)
        },
        modelChanged: function(a,
            b) {
            if (b == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var d = sc.options.get(this.base.optionName, this.base.local);
                if (this._prevPressed != this.buttons[d]) {
                    this._prevPressed = this.buttons[d];
                    this.resetButtons(this._prevPressed);
                    this._rowGroup.setPressedFocusGui(this._prevPressed)
                }
            }
        },
        onPressed: function(a) {
            if (this._prevPressed != a) {
                this.resetButtons(a);
                sc.options.set(this.base.optionName, a.data.id, this.base.local);
                this._prevPressed = a
            }
        }
    });
    sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER] = ig.GuiElementBase.extend({
        slider: null,
        base: null,
        entries: [],
        currentNumber: null,
        _lastVal: 0,
        init: function(a, b, d) {
            this.parent();
            this.base = a;
            var g = a.option.snap == void 0 ? true : a.option.snap,
                h = a.option.data,
                i = 0,
                j = 0,
                k;
            for (k in h) {
                this.entries[i] = h[k];
                h[k] == sc.options.get(a.optionName, a.local) && (j = i);
                i++
            }
            this._lastVal = j;
            b = b - 4;
            this.slider = new sc.OptionFocusSlider(this.onChange.bind(this), g, a.option.fill, d);
            this.slider.setPreferredThumbSize(Math.floor(b / this.entries.length), 21);
            this.slider.setPos(0, 0);
            this.slider.setMinMaxValue(0, this.entries.length -
                1);
            this.slider.setValue(j);
            this.slider.setSize(b - 4, 21, 9);
            this.slider.data = a.optionDes;
            this.addChildGui(this.slider);
            this.currentNumber = (this.showPercentage = a.option.showPercentage) ? new sc.TextGui("100%") : new sc.NumberGui(this.entries.length);
            this.updateNumberDisplay();
            this.currentNumber.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.slider.thumb.addChildGui(this.currentNumber);
            d.addFocusGui(this.slider, 0, a.row)
        },
        updateNumberDisplay: function() {
            if (this.showPercentage) {
                var a = Math.round(this.entries[this._lastVal] *
                    100) + "%";
                this.currentNumber.setText(a)
            } else this.currentNumber.setNumber(this._lastVal + 1, true)
        },
        onAttach: function() {
            sc.Model.addObserver(sc.options, this)
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.options, this)
        },
        modelChanged: function(a, b) {
            if (b == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var d = sc.options.get(this.base.optionName, this.base.local);
                if (d != this.entries[this._lastVal]) {
                    this._lastVal = d = this.entries.indexOf(d);
                    this.slider.setValue(d);
                    this.updateNumberDisplay()
                }
            }
        },
        onChange: function(a) {
            if (a != this._lastVal) {
                this._lastVal =
                    a;
                this.updateNumberDisplay();
                sc.options.set(this.base.optionName, this.entries[a], this.base.local)
            }
        },
        onLeftRight: function(a) {
            this._lastVal = a ? this._lastVal + 1 : this._lastVal - 1;
            this.slider.setValue(this._lastVal);
            this._lastVal = this.slider.getValue();
            this.updateNumberDisplay();
            sc.options.set(this.base.optionName, this.entries[this._lastVal], this.base.local)
        }
    });
    sc.OPTION_GUIS[sc.OPTION_TYPES.ARRAY_SLIDER] = ig.GuiElementBase.extend({
        slider: null,
        base: null,
        _lastVal: 0,
        scale: 0,
        stepSize: 0,
        init: function(a, b, d) {
            this.parent();
            this.base = a;
            var g = a.option;
            this.scale = 10;
            this.stepSize = 1;
            var h = g.data,
                b = b - 4;
            this.slider = new sc.OptionFocusSlider(this.onChange.bind(this), g.snap, g.fill, d);
            this.slider.setPreferredThumbSize(10, 21);
            this.slider.setMinMaxValue(h[0] * this.scale, h[1] * this.scale);
            this.slider.setValue(sc.options.get(a.optionName, a.local) * this.scale);
            this.slider.setSize(b - 4, 21, 9);
            this.slider.data = a.optionDes;
            this.addChildGui(this.slider);
            this._lastVal = this.slider.getValue();
            d.addFocusGui(this.slider, 0, a.row)
        },
        onAttach: function() {
            sc.Model.addObserver(sc.options,
                this)
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.options, this)
        },
        modelChanged: function(a, b) {
            if (b == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var d = sc.options.get(this.base.optionName, this.base.local) * this.scale;
                if (this._lastVal != d) {
                    this.slider.setValue(d);
                    this._lastVal = d
                }
            }
        },
        onChange: function(a) {
            if (a != this._lastVal) {
                this._lastVal = a;
                sc.options.set(this.base.optionName, a / this.scale, this.base.local)
            }
        },
        onLeftRight: function(a) {
            this._lastVal = a ? this._lastVal + 1 : this._lastVal - 1;
            this.slider.setValue(this._lastVal);
            this._lastVal = this.slider.getValue();
            sc.options.set(this.base.optionName, this._lastVal / this.scale, this.base.local)
        }
    });
    sc.OPTION_GUIS[sc.OPTION_TYPES.CHECKBOX] = ig.GuiElementBase.extend({
        base: null,
        button: null,
        init: function(a, b, d) {
            this.parent();
            this.base = a;
            b = sc.options.get(a.optionName, a.local);
            this.button = new sc.CheckboxGui(b, 30);
            this.button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.button.data = {
                description: a.optionDes,
                row: a.row
            };
            this.addChildGui(this.button);
            d.addFocusGui(this.button,
                0, a.row)
        },
        onAttach: function() {
            sc.Model.addObserver(sc.options, this)
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.options, this)
        },
        onPressed: function(a) {
            a == this.button && sc.options.set(this.base.optionName, a.pressed)
        },
        modelChanged: function(a, b) {
            if (b == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var d = sc.options.get(this.base.optionName);
                this.button.pressed != d && this.button.setPressed(d)
            }
        }
    });
    sc.OPTION_GUIS[sc.OPTION_TYPES.CONTROLS] = ig.GuiElementBase.extend({
        keyButton: null,
        altButton: null,
        base: null,
        controlKey: "",
        init: function(a, b, d) {
            this.parent();
            this.base = a;
            this.controlKey = this.base.optionName.substr(5);
            var g = Math.floor(b / 2);
            a.option.isDebug ? this.base.nameGui.setText("Debug " + this.controlKey) : this.base.nameGui.setText(ig.lang.get("sc.gui.options.controls.keys." + this.controlKey));
            this.base.optionDes = ig.lang.get("sc.gui.options.controls.description");
            var h = sc.options.get(a.optionName),
                i = h.key1,
                i = new sc.ButtonGui("\\i[keyCode-" + i + "]", g, true, sc.BUTTON_TYPE.GROUP_LEFT);
            i.setWidth(g);
            i.data = {
                description: a.optionDes,
                row: a.row
            };
            i.setPos(0, 3);
            this.keyButton = i;
            i = h.key2;
            i = new sc.ButtonGui(i ? "\\i[keyCode-" + i + "]" : ig.lang.get("sc.gui.options.controls.none"), g, true, sc.BUTTON_TYPE.GROUP_RIGHT);
            i.setWidth(b > g * 2 ? g + 1 : g);
            i.data = {
                description: a.optionDes,
                row: a.row
            };
            i.setPos(g, 3);
            this.altButton = i;
            this.addChildGui(this.keyButton);
            this.addChildGui(this.altButton);
            d.addFocusGui(this.keyButton, 0, a.row);
            d.addFocusGui(this.altButton, 1, a.row)
        },
        onAttach: function() {
            sc.Model.addObserver(sc.options, this)
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.options,
                this)
        },
        onPressed: function(a) {
            a == this.keyButton ? sc.keyBinderGui.show(this.onButtonSetCallback.bind(this), this.controlKey, false) : a == this.altButton && sc.keyBinderGui.show(this.onButtonSetCallback.bind(this), this.controlKey, true)
        },
        onButtonSetCallback: function(a, b, d) {
            var g = this.base.optionName;
            sc.options.keyBinder.changeBinding(g, a, b, d);
            a = sc.options.get(g);
            this.keyButton.textChild.setText("\\i[keyCode-" + a.key1 + "]");
            this.altButton.textChild.setText(a.key2 ? "\\i[keyCode-" + a.key2 + "]" : ig.lang.get("sc.gui.options.controls.none"))
        },
        modelChanged: function(a, b) {
            if (b == sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED) {
                var d = sc.options.get(this.base.optionName);
                this.keyButton.textChild.setText("\\i[keyCode-" + d.key1 + "]");
                this.altButton.textChild.setText(d.key2 ? "\\i[keyCode-" + d.key2 + "]" : ig.lang.get("sc.gui.options.controls.none"))
            }
        }
    });
    sc.OPTION_GUIS[sc.OPTION_TYPES.LANGUAGE] = ig.GuiElementBase.extend({
        button: null,
        base: null,
        init: function(a, b, d) {
            this.parent();
            this.base = a;
            var g = sc.options.get(a.optionName),
                g = "\\i[language-" + g + "] " + ig.lang.get("sc.gui.options.language.group")[g],
                g = new sc.ButtonGui(g, b, true, sc.BUTTON_TYPE.DEFAULT);
            g.setWidth(b);
            g.data = {
                description: a.optionDes,
                row: a.row
            };
            g.setPos(0, 3);
            this.button = g;
            this.addChildGui(this.button);
            d.addFocusGui(this.button, 0, a.row)
        },
        onAttach: function() {
            sc.Model.addObserver(sc.options, this)
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.options, this)
        },
        onPressed: function(a) {
            a == this.button && sc.menu.openLanguagePopUp(this)
        },
        onLanguageSelected: function(a, b) {
            a ? ig.input.mouseGuiActive && this.button.focusLost() : sc.options.set(this.base.optionName,
                b, this.base.local)
        },
        modelChanged: function(a, b) {
            if (b == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var d = sc.options.get(this.base.optionName),
                    d = "\\i[language-" + d + "] " + ig.lang.get("sc.gui.options.language.group")[d];
                this.button.setText(d, true)
            }
        }
    });
    sc.OptionInfoBox = ig.GuiElementBase.extend({
        text: null,
        box: null,
        init: function(a, b) {
            this.parent();
            this.text = new sc.TextGui(ig.lang.get("sc.gui." + a.data), {
                maxWidth: b - 36,
                font: sc.fontsystem.smallFont
            });
            var d = new ig.GuiElementBase;
            d.setSize(b - 36, this.text.hook.size.y);
            d.addChildGui(this.text);
            this.box = new sc.CenterBoxGui(d, true);
            this.box.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.box.setPos(1, 0);
            this.addChildGui(this.box);
            this.setSize(b || 400, this.box.hook.size.y - 5)
        }
    });
    sc.OptionRow = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        row: -1,
        optionName: null,
        option: null,
        optionDes: null,
        local: false,
        divider: false,
        nameGui: null,
        typeGui: null,
        _hasEntered: false,
        _rowGroup: null,
        init: function(a, b, d, g, h, i) {
            if (!a) throw Error("option entry is null!");
            this.parent();
            this.setSize(h ||
                400, i || 26);
            this._rowGroup = d;
            this.local = g || false;
            this.optionName = a;
            this.option = sc.OPTIONS_DEFINITION[this.optionName];
            this.optionDes = ig.lang.get("sc.gui.options." + this.optionName + ".description");
            this.row = b;
            this.nameGui = new sc.TextGui(ig.lang.get("sc.gui.options." + this.optionName + ".name"));
            this.nameGui.setPos(5, 4);
            this.addChildGui(this.nameGui);
            a = new ig.ColorGui("#545454", 166, 1);
            a.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            a.setPos(0, 4);
            this.addChildGui(a);
            b = new ig.ImageGui(this.gfx, 32, 416,
                8, 8);
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            b.setPos(a.hook.size.x, 3);
            this.addChildGui(b);
            a = this.hook.size.x - 175;
            if (b = sc.OPTION_GUIS[sc.OPTION_TYPES[this.option.type]]) {
                this.typeGui = new b(this, a, d);
                this.typeGui.setSize(a, 26);
                this.typeGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
                this.typeGui.setPos(175, 0);
                this.addChildGui(this.typeGui)
            } else {
                d = new sc.TextGui("Missing Option Type: " + this.option.type);
                d.setPos(175, 4);
                this.addChildGui(d)
            }
            if (this.option.hasDivider) {
                this.divider =
                    true;
                this.hook.size.y = this.hook.size.y + 17;
                d = new sc.TextGui(ig.lang.get("sc.gui.options.headers." + this.option.header), {
                    font: sc.fontsystem.tinyFont
                });
                d.setPos(2, 6);
                this.addChildGui(d);
                this.nameGui.setPos(5, 21)
            }
            if (this.option.data == ig.TextBlock.SPEED) {
                d = new sc.TextGui(ig.lang.get("sc.gui.options.text-speed.example"), {
                    speed: sc.options.get(this.optionName)
                });
                d.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                d.setPos(265, 4);
                var j = d.textBlock;
                j.optName = this.optionName;
                j.optTimer = 0.7;
                j.realUpdate = j.update;
                j.update = function() {
                    j.realUpdate();
                    this.setSpeed(sc.options.get(this.optName));
                    if (this.isFinished())
                        if (this.optTimer <= 0) {
                            this.reset();
                            this.optTimer = 0.7
                        } else this.optTimer = this.optTimer - ig.system.actualTick
                };
                this.addChildGui(d)
            }
            this.hook.setMouseRecord(true)
        },
        updateDrawables: function(a) {
            this.divider && a.addColor("#545454", 0, this.hook.size.y - 26 - 1 - 2, this.hook.size.x + 2, 1)
        },
        onPressed: function(a) {
            this.typeGui.onPressed && this.typeGui.onPressed(a)
        },
        onLeftRight: function(a) {
            return this.typeGui.onLeftRight &&
                this.typeGui.onLeftRight(a) || true
        },
        onMouseInteract: function() {
            if (sc.menu.buttonInteract.isActive() && this._rowGroup.isActive()) {
                var b = this.hook.screenCoords;
                a = sc.control.getMouseX();
                d = sc.control.getMouseY();
                if (b.x <= a && b.x + b.w > a && b.y <= d && b.y + b.h > d) {
                    if (!this._hasEntered) {
                        sc.menu.setInfoText(this.optionDes);
                        this._hasEntered = true
                    }
                } else if (this._hasEntered) {
                    sc.menu.setInfoText("", true);
                    this._hasEntered = false
                }
            }
        }
    })
});
ig.baked = !0;
