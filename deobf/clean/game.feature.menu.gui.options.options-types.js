/**
 * game.feature.menu.gui.options.options-types
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.options.options-types")`.
 *
 * The per-type option row widgets, registered in `sc.OPTION_GUIS`:
 *  - `BUTTON_GROUP`: a row of grouped toggle buttons (one per option value).
 *  - `OBJECT_SLIDER`: slider over an enumerated value list (shows the
 *    current value / percentage on the thumb).
 *  - `ARRAY_SLIDER`: numeric slider over a [min, max] range (×10 scale).
 *  - `CHECKBOX`: `sc.CheckboxGui` toggle.
 *  - `CONTROLS`: the primary/alternative key-binding buttons (opens the
 *    `sc.KeyBinderGui` rebind dialog).
 *  - `LANGUAGE`: the language button (opens `sc.OptionLangPopUp`).
 * Plus `sc.OptionInfoBox` (an info/description row) and `sc.OptionRow`
 * (the row shell: name, divider headers, text-speed preview, mouse
 * hover info text).
 */
ig.module("game.feature.menu.gui.options.options-types")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.options.options-misc", "game.feature.model.options-model")
    .defines(function () {

    var scratchEntries = [],
        mouseX = 0,
        mouseY = 0;

    sc.OPTION_GUIS = {};

    sc.OPTION_GUIS[sc.OPTION_TYPES.BUTTON_GROUP] = ig.GuiElementBase.extend({
        base: null,
        buttons: [],
        _prevPressed: null,
        _rowGroup: null,

        init: function (base, width, rowGroup) {
            this.parent();
            this.base = base;
            var values = base.option.data;
            scratchEntries.length = 0;
            for (var value in values) scratchEntries.push(values[value]);
            this._rowGroup = rowGroup;
            var buttonWidth = Math.floor(width / scratchEntries.length);
            var button = null;
            var x = 0;
            for (var i = 0; i < scratchEntries.length; i++) {
                var label = ig.lang.get("sc.gui.options." + base.optionName + ".group")[scratchEntries[i]];
                button = i == 0 ? new sc.ButtonGui(label, buttonWidth, true, sc.BUTTON_TYPE.GROUP_LEFT, null, true) : i == scratchEntries.length - 1 ? new sc.ButtonGui(label, buttonWidth, true, sc.BUTTON_TYPE.GROUP_RIGHT, null, true) : new sc.ButtonGui(label, buttonWidth, true, sc.BUTTON_TYPE.GROUP, null, true);
                i == scratchEntries.length - 1 && buttonWidth * scratchEntries.length < width ? button.setWidth(buttonWidth + 1) : button.setWidth(buttonWidth);
                button.noFocusOnPressed = true;
                var maxWidth = buttonWidth;
                if ((new ig.TextBlock(sc.fontsystem.font, label, {})).size.x < maxWidth - 16) label = sc.fontsystem.font;
                else if ((new ig.TextBlock(sc.fontsystem.smallFont, label, {})).size.x < maxWidth - 16) label = sc.fontsystem.smallFont;
                else {
                    new ig.TextBlock(sc.fontsystem.tinyFont, label, {});
                    label = sc.fontsystem.tinyFont
                }
                label != button.textChild.font && button.textChild.setFont(label, null);
                button.setPressed = function (pressed) {
                    (this.pressed = pressed) ? this.textChild.setText("\\c[0]" + this.text) : this.textChild.setText("\\c[" + sc.FONT_COLORS.GREY + "]" + this.text)
                };
                button.data = {
                    description: base.optionDes,
                    id: scratchEntries[i],
                    row: base.row
                };
                button.setPos(x, 3);
                x = x + button.hook.size.x;
                rowGroup.addFocusGui(button, i, base.row);
                this.buttons[scratchEntries[i]] = button;
                this.addChildGui(button)
            }
            var current = sc.options.get(base.optionName, base.local);
            this._prevPressed = this.buttons[current];
            this.resetButtons(this._prevPressed);
            rowGroup.setPressedFocusGui(this._prevPressed)
        },

        resetButtons: function (pressedButton) {
            for (var i = this.buttons.length; i--;) this.buttons[i] != pressedButton && this.buttons[i].setPressed(false)
        },

        onAttach: function () {
            sc.Model.addObserver(sc.options, this)
        },

        onDetach: function () {
            sc.Model.removeObserver(sc.options, this)
        },

        modelChanged: function (model, event) {
            if (event == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var current = sc.options.get(this.base.optionName, this.base.local);
                if (this._prevPressed != this.buttons[current]) {
                    this._prevPressed = this.buttons[current];
                    this.resetButtons(this._prevPressed);
                    this._rowGroup.setPressedFocusGui(this._prevPressed)
                }
            }
        },

        onPressed: function (button) {
            if (this._prevPressed != button) {
                this.resetButtons(button);
                sc.options.set(this.base.optionName, button.data.id, this.base.local);
                this._prevPressed = button
            }
        }
    });

    sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER] = ig.GuiElementBase.extend({
        slider: null,
        base: null,
        entries: [],
        currentNumber: null,
        _lastVal: 0,

        init: function (base, width, rowGroup) {
            this.parent();
            this.base = base;
            var snap = base.option.snap == void 0 ? true : base.option.snap,
                values = base.option.data,
                index = 0,
                currentIndex = 0;
            for (var key in values) {
                this.entries[index] = values[key];
                values[key] == sc.options.get(base.optionName, base.local) && (currentIndex = index);
                index++
            }
            this._lastVal = currentIndex;
            var sliderWidth = width - 4;
            this.slider = new sc.OptionFocusSlider(this.onChange.bind(this), snap, base.option.fill, rowGroup);
            this.slider.setPreferredThumbSize(Math.floor(sliderWidth / this.entries.length), 21);
            this.slider.setPos(0, 0);
            this.slider.setMinMaxValue(0, this.entries.length - 1);
            this.slider.setValue(currentIndex);
            this.slider.setSize(sliderWidth - 4, 21, 9);
            this.slider.data = base.optionDes;
            this.addChildGui(this.slider);
            this.currentNumber = (this.showPercentage = base.option.showPercentage) ? new sc.TextGui("100%") : new sc.NumberGui(this.entries.length);
            this.updateNumberDisplay();
            this.currentNumber.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.slider.thumb.addChildGui(this.currentNumber);
            rowGroup.addFocusGui(this.slider, 0, base.row)
        },

        updateNumberDisplay: function () {
            if (this.showPercentage) {
                var text = Math.round(this.entries[this._lastVal] * 100) + "%";
                this.currentNumber.setText(text)
            } else this.currentNumber.setNumber(this._lastVal + 1, true)
        },

        onAttach: function () {
            sc.Model.addObserver(sc.options, this)
        },

        onDetach: function () {
            sc.Model.removeObserver(sc.options, this)
        },

        modelChanged: function (model, event) {
            if (event == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var current = sc.options.get(this.base.optionName, this.base.local);
                if (current != this.entries[this._lastVal]) {
                    this._lastVal = current = this.entries.indexOf(current);
                    this.slider.setValue(current);
                    this.updateNumberDisplay()
                }
            }
        },

        onChange: function (value) {
            if (value != this._lastVal) {
                this._lastVal = value;
                this.updateNumberDisplay();
                sc.options.set(this.base.optionName, this.entries[value], this.base.local)
            }
        },

        onLeftRight: function (direction) {
            this._lastVal = direction ? this._lastVal + 1 : this._lastVal - 1;
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

        init: function (base, width, rowGroup) {
            this.parent();
            this.base = base;
            var option = base.option;
            this.scale = 10;
            this.stepSize = 1;
            var range = option.data,
                sliderWidth = width - 4;
            this.slider = new sc.OptionFocusSlider(this.onChange.bind(this), option.snap, option.fill, rowGroup);
            this.slider.setPreferredThumbSize(10, 21);
            this.slider.setMinMaxValue(range[0] * this.scale, range[1] * this.scale);
            this.slider.setValue(sc.options.get(base.optionName, base.local) * this.scale);
            this.slider.setSize(sliderWidth - 4, 21, 9);
            this.slider.data = base.optionDes;
            this.addChildGui(this.slider);
            this._lastVal = this.slider.getValue();
            rowGroup.addFocusGui(this.slider, 0, base.row)
        },

        onAttach: function () {
            sc.Model.addObserver(sc.options, this)
        },

        onDetach: function () {
            sc.Model.removeObserver(sc.options, this)
        },

        modelChanged: function (model, event) {
            if (event == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var current = sc.options.get(this.base.optionName, this.base.local) * this.scale;
                if (this._lastVal != current) {
                    this.slider.setValue(current);
                    this._lastVal = current
                }
            }
        },

        onChange: function (value) {
            if (value != this._lastVal) {
                this._lastVal = value;
                sc.options.set(this.base.optionName, value / this.scale, this.base.local)
            }
        },

        onLeftRight: function (direction) {
            this._lastVal = direction ? this._lastVal + 1 : this._lastVal - 1;
            this.slider.setValue(this._lastVal);
            this._lastVal = this.slider.getValue();
            sc.options.set(this.base.optionName, this._lastVal / this.scale, this.base.local)
        }
    });

    sc.OPTION_GUIS[sc.OPTION_TYPES.CHECKBOX] = ig.GuiElementBase.extend({
        base: null,
        button: null,

        init: function (base, width, rowGroup) {
            this.parent();
            this.base = base;
            var checked = sc.options.get(base.optionName, base.local);
            this.button = new sc.CheckboxGui(checked, 30);
            this.button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.button.data = {
                description: base.optionDes,
                row: base.row
            };
            this.addChildGui(this.button);
            rowGroup.addFocusGui(this.button, 0, base.row)
        },

        onAttach: function () {
            sc.Model.addObserver(sc.options, this)
        },

        onDetach: function () {
            sc.Model.removeObserver(sc.options, this)
        },

        onPressed: function (button) {
            button == this.button && sc.options.set(this.base.optionName, button.pressed)
        },

        modelChanged: function (model, event) {
            if (event == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var checked = sc.options.get(this.base.optionName);
                this.button.pressed != checked && this.button.setPressed(checked)
            }
        }
    });

    sc.OPTION_GUIS[sc.OPTION_TYPES.CONTROLS] = ig.GuiElementBase.extend({
        keyButton: null,
        altButton: null,
        base: null,
        controlKey: "",

        init: function (base, width, rowGroup) {
            this.parent();
            this.base = base;
            this.controlKey = this.base.optionName.substr(5);
            var buttonWidth = Math.floor(width / 2);
            base.option.isDebug ? this.base.nameGui.setText("Debug " + this.controlKey) : this.base.nameGui.setText(ig.lang.get("sc.gui.options.controls.keys." + this.controlKey));
            this.base.optionDes = ig.lang.get("sc.gui.options.controls.description");
            var keys = sc.options.get(base.optionName),
                key1 = keys.key1,
                key1Button = new sc.ButtonGui("\\i[keyCode-" + key1 + "]", buttonWidth, true, sc.BUTTON_TYPE.GROUP_LEFT);
            key1Button.setWidth(buttonWidth);
            key1Button.data = {
                description: base.optionDes,
                row: base.row
            };
            key1Button.setPos(0, 3);
            this.keyButton = key1Button;
            var key2 = keys.key2,
                key2Button = new sc.ButtonGui(key2 ? "\\i[keyCode-" + key2 + "]" : ig.lang.get("sc.gui.options.controls.none"), buttonWidth, true, sc.BUTTON_TYPE.GROUP_RIGHT);
            key2Button.setWidth(width > buttonWidth * 2 ? buttonWidth + 1 : buttonWidth);
            key2Button.data = {
                description: base.optionDes,
                row: base.row
            };
            key2Button.setPos(buttonWidth, 3);
            this.altButton = key2Button;
            this.addChildGui(this.keyButton);
            this.addChildGui(this.altButton);
            rowGroup.addFocusGui(this.keyButton, 0, base.row);
            rowGroup.addFocusGui(this.altButton, 1, base.row)
        },

        onAttach: function () {
            sc.Model.addObserver(sc.options, this)
        },

        onDetach: function () {
            sc.Model.removeObserver(sc.options, this)
        },

        onPressed: function (button) {
            button == this.keyButton ? sc.keyBinderGui.show(this.onButtonSetCallback.bind(this), this.controlKey, false) : button == this.altButton && sc.keyBinderGui.show(this.onButtonSetCallback.bind(this), this.controlKey, true)
        },

        onButtonSetCallback: function (keyCode, isAlternative, unbound) {
            var optionName = this.base.optionName;
            sc.options.keyBinder.changeBinding(optionName, keyCode, isAlternative, unbound);
            var keys = sc.options.get(optionName);
            this.keyButton.textChild.setText("\\i[keyCode-" + keys.key1 + "]");
            this.altButton.textChild.setText(keys.key2 ? "\\i[keyCode-" + keys.key2 + "]" : ig.lang.get("sc.gui.options.controls.none"))
        },

        modelChanged: function (model, event) {
            if (event == sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED) {
                var keys = sc.options.get(this.base.optionName);
                this.keyButton.textChild.setText("\\i[keyCode-" + keys.key1 + "]");
                this.altButton.textChild.setText(keys.key2 ? "\\i[keyCode-" + keys.key2 + "]" : ig.lang.get("sc.gui.options.controls.none"))
            }
        }
    });

    sc.OPTION_GUIS[sc.OPTION_TYPES.LANGUAGE] = ig.GuiElementBase.extend({
        button: null,
        base: null,

        init: function (base, width, rowGroup) {
            this.parent();
            this.base = base;
            var lang = sc.options.get(base.optionName),
                label = "\\i[language-" + lang + "] " + ig.lang.get("sc.gui.options.language.group")[lang],
                button = new sc.ButtonGui(label, width, true, sc.BUTTON_TYPE.DEFAULT);
            button.setWidth(width);
            button.data = {
                description: base.optionDes,
                row: base.row
            };
            button.setPos(0, 3);
            this.button = button;
            this.addChildGui(this.button);
            rowGroup.addFocusGui(this.button, 0, base.row)
        },

        onAttach: function () {
            sc.Model.addObserver(sc.options, this)
        },

        onDetach: function () {
            sc.Model.removeObserver(sc.options, this)
        },

        onPressed: function (button) {
            button == this.button && sc.menu.openLanguagePopUp(this)
        },

        onLanguageSelected: function (cancelled, lang) {
            cancelled ? ig.input.mouseGuiActive && this.button.focusLost() : sc.options.set(this.base.optionName, lang, this.base.local)
        },

        modelChanged: function (model, event) {
            if (event == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var lang = sc.options.get(this.base.optionName),
                    label = "\\i[language-" + lang + "] " + ig.lang.get("sc.gui.options.language.group")[lang];
                this.button.setText(label, true)
            }
        }
    });

    sc.OptionInfoBox = ig.GuiElementBase.extend({
        text: null,
        box: null,

        init: function (option, width) {
            this.parent();
            this.text = new sc.TextGui(ig.lang.get("sc.gui." + option.data), {
                maxWidth: width - 36,
                font: sc.fontsystem.smallFont
            });
            var textWrapper = new ig.GuiElementBase;
            textWrapper.setSize(width - 36, this.text.hook.size.y);
            textWrapper.addChildGui(this.text);
            this.box = new sc.CenterBoxGui(textWrapper, true);
            this.box.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.box.setPos(1, 0);
            this.addChildGui(this.box);
            this.setSize(width || 400, this.box.hook.size.y - 5)
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

        init: function (optionName, row, rowGroup, local, width, height) {
            if (!optionName) throw Error("option entry is null!");
            this.parent();
            this.setSize(width || 400, height || 26);
            this._rowGroup = rowGroup;
            this.local = local || false;
            this.optionName = optionName;
            this.option = sc.OPTIONS_DEFINITION[this.optionName];
            this.optionDes = ig.lang.get("sc.gui.options." + this.optionName + ".description");
            this.row = row;
            this.nameGui = new sc.TextGui(ig.lang.get("sc.gui.options." + this.optionName + ".name"));
            this.nameGui.setPos(5, 4);
            this.addChildGui(this.nameGui);
            var dividerLine = new ig.ColorGui("#545454", 166, 1);
            dividerLine.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            dividerLine.setPos(0, 4);
            this.addChildGui(dividerLine);
            var cornerGfx = new ig.ImageGui(this.gfx, 32, 416, 8, 8);
            cornerGfx.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            cornerGfx.setPos(dividerLine.hook.size.x, 3);
            this.addChildGui(cornerGfx);
            var typeWidth = this.hook.size.x - 175;
            var typeClass = sc.OPTION_GUIS[sc.OPTION_TYPES[this.option.type]];
            if (typeClass) {
                this.typeGui = new typeClass(this, typeWidth, rowGroup);
                this.typeGui.setSize(typeWidth, 26);
                this.typeGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
                this.typeGui.setPos(175, 0);
                this.addChildGui(this.typeGui)
            } else {
                var missingGui = new sc.TextGui("Missing Option Type: " + this.option.type);
                missingGui.setPos(175, 4);
                this.addChildGui(missingGui)
            }
            if (this.option.hasDivider) {
                this.divider = true;
                this.hook.size.y = this.hook.size.y + 17;
                var headerGui = new sc.TextGui(ig.lang.get("sc.gui.options.headers." + this.option.header), {
                    font: sc.fontsystem.tinyFont
                });
                headerGui.setPos(2, 6);
                this.addChildGui(headerGui);
                this.nameGui.setPos(5, 21)
            }
            if (this.option.data == ig.TextBlock.SPEED) {
                var exampleGui = new sc.TextGui(ig.lang.get("sc.gui.options.text-speed.example"), {
                    speed: sc.options.get(this.optionName)
                });
                exampleGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                exampleGui.setPos(265, 4);
                var block = exampleGui.textBlock;
                block.optName = this.optionName;
                block.optTimer = 0.7;
                block.realUpdate = block.update;
                block.update = function () {
                    block.realUpdate();
                    this.setSpeed(sc.options.get(this.optName));
                    if (this.isFinished())
                        if (this.optTimer <= 0) {
                            this.reset();
                            this.optTimer = 0.7
                        } else this.optTimer = this.optTimer - ig.system.actualTick
                };
                this.addChildGui(exampleGui)
            }
            this.hook.setMouseRecord(true)
        },

        updateDrawables: function (renderer) {
            this.divider && renderer.addColor("#545454", 0, this.hook.size.y - 26 - 1 - 2, this.hook.size.x + 2, 1)
        },

        onPressed: function (button) {
            this.typeGui.onPressed && this.typeGui.onPressed(button)
        },

        onLeftRight: function (direction) {
            return this.typeGui.onLeftRight && this.typeGui.onLeftRight(direction) || true
        },

        onMouseInteract: function () {
            if (sc.menu.buttonInteract.isActive() && this._rowGroup.isActive()) {
                var screen = this.hook.screenCoords;
                mouseX = sc.control.getMouseX();
                mouseY = sc.control.getMouseY();
                if (screen.x <= mouseX && screen.x + screen.w > mouseX && screen.y <= mouseY && screen.y + screen.h > mouseY) {
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
