/**
 * game.feature.menu.gui.new-game.new-game-misc
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.new-game.new-game-misc")`.
 *
 * New Game+ setup widgets:
 *  - `sc.NewGameCart` (+ `sc.NewGameCartEntry`): the points / cost / rest
 *    overview panel.
 *  - `sc.NewGameToggleSet`: one option set (header, tinted background,
 *    divider line) with its 2-column option buttons.
 *  - `sc.NewGameOptionButton`: one toggleable NG+ option button (radio or
 *    checkbox style per set type, cost, requirement gating).
 */
ig.module("game.feature.menu.gui.new-game.new-game-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.NewGameCart = sc.MenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -164
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        points: null,
        cost: null,
        rest: null,
        enabled: true,

        init: function () {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(164, 87);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(8, 28);
            var y = 5,
                title = new sc.TextGui(ig.lang.get("sc.gui.menu.new-game.overview"), {
                    font: sc.fontsystem.tinyFont
                });
            title.setPos(2, y);
            this.addChildGui(title);
            y = y + 13;
            this.points = new sc.NewGameCartEntry(ig.lang.get("sc.gui.menu.new-game.points"));
            this.points.setPos(4, y);
            this.addChildGui(this.points);
            y = y + 13;
            this.cost = new sc.NewGameCartEntry(ig.lang.get("sc.gui.shop.cost"));
            this.cost.setPos(4, y);
            this.cost.hideSymbol = true;
            this.cost.number.noZero = true;
            this.cost.number.signed = true;
            this.cost.number.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.addChildGui(this.cost);
            y = y + 16;
            this.rest = new sc.NewGameCartEntry(ig.lang.get("sc.gui.shop.rest"));
            this.rest.setPos(4, y);
            this.addChildGui(this.rest);
            this.doStateTransition("HIDDEN", true)
        },

        resetNumbers: function (animate) {
            var points = sc.trophies.getTotalPoints();
            this.points.setNumber(points, animate);
            this.cost.setNumber(0, animate);
            this.rest.setNumber(points, animate);
            points < 0 ? this.rest.number.setColor(sc.GUI_NUMBER_COLOR.RED) : this.rest.number.setColor(sc.GUI_NUMBER_COLOR.WHITE)
        },

        updateCost: function (animate) {
            var points = sc.trophies.getTotalPoints(),
                cost = sc.newgame.getCost(),
                rest = points - cost;
            this.cost.setNumber(-cost, animate);
            this.rest.setNumber(rest, animate)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            renderer.addColor("#7E7E7E", 0, 12, this.hook.size.x, 1);
            renderer.addColor("#FFF", 3, 42, this.hook.size.x - 6, 1)
        },

        show: function () {
            this.resetNumbers(true);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.doStateTransition("HIDDEN")
        }
    });

    sc.NewGameCartEntry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        text: null,
        number: null,
        hideSymbol: false,

        init: function (label) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(157, 8);
            this.text = new sc.TextGui(label, {
                font: sc.fontsystem.tinyFont
            });
            this.addChildGui(this.text);
            this.number = new sc.NumberGui(99999, {
                transitionTime: 0.1,
                dots: true
            });
            this.number.setPos(12, 0);
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.number)
        },

        updateDrawables: function (renderer) {
            this.hideSymbol || renderer.addGfx(this.gfx, this.hook.size.x - 10, 0, 468, 201, 10, 8)
        },

        setNumber: function (value, animate) {
            this.number.setMaxNumber(Math.abs(value));
            this.number.setNumber(value, animate)
        }
    });

    sc.NewGameToggleSet = ig.GuiElementBase.extend({
        header: null,
        background: null,
        buttons: [],
        set: null,
        listIndex: 0,

        init: function (setKey, list, row, listIndex, counter) {
            this.parent();
            this.setSize(363, 9);
            this.listIndex = listIndex;
            this.set = sc.NEW_GAME_SETS[setKey];
            if (this.set.color) {
                this.background = new ig.ColorGui(this.set.color);
                this.background.hook.localAlpha = 0.2;
                this.background.setPos(-1, 0);
                this.addChildGui(this.background)
            }
            this.header = new sc.TextGui(ig.lang.get("sc.gui.menu.new-game.sets." + setKey), {
                font: sc.fontsystem.tinyFont
            });
            this.header.setPos(0, 1);
            this.addChildGui(this.header);
            this.line = new ig.ColorGui("#545454", this.hook.size.x + 2, 1);
            this.line.setPos(-1, 9);
            this.addChildGui(this.line);
            var options = sc.NEW_GAME_OPTIONS,
                col = 0,
                rowCount = 0,
                buttongroup = list.buttonGroup(),
                optionCount = 0;
            for (var key in options) {
                var option = options[key];
                if (!(option.set != setKey || option.disabled)) {
                    var name = ig.LangLabel.getText(ig.lang.get("sc.gui.menu.new-game.options.names." + key)),
                        description = ig.LangLabel.getText(ig.lang.get("sc.gui.menu.new-game.options.descriptions." + key)),
                        button = new sc.NewGameOptionButton(name, option.cost, key, description, setKey, this.set, this);
                    button.setPos(col * 182, rowCount * 20 + 11);
                    this.addChildGui(button);
                    this.buttons.push(button);
                    if (sc.menu.newGameViewMode) {
                        button.blockedSound = null;
                        sc.newgame.get(key) || button.setActive(false)
                    }
                    buttongroup.addFocusGui(button, col, rowCount + row);
                    col++;
                    if (col >= 2) {
                        col = 0;
                        rowCount++
                    }
                    optionCount++
                }
            }
            this.hook.size.y = Math.ceil(optionCount / 2) * 20 + 15;
            this.background && this.background.setSize(this.hook.size.x + 2, Math.ceil(optionCount / 2) * 20 + 15);
            counter.counter = optionCount
        },

        updateTogglesStates: function (pressedButton) {
            for (var i = this.buttons.length; i--;) pressedButton != this.buttons[i] && this.buttons[i].updateToggleState();
            if (pressedButton) {
                var animation = new sc.ItemMenuToggleAnimation(function () {
                        pressedButton.updateToggleState()
                    }.bind(this),
                    pressedButton.set.type == sc.TOGGLE_SET_TYPE.SINGLE);
                pressedButton.addChildGui(animation)
            }
        },

        updateActiveState: function (totalPoints, cost, rest) {
            var count = this.buttons.length;
            for (var i = this.getSingleCost(); count--;) {
                var option = this.buttons[count].data.id,
                    setType = sc.NEW_GAME_SETS[sc.NEW_GAME_OPTIONS[option].set].type;
                sc.newgame.options[option] ? this.buttons[count].setActive(true) : rest >= sc.NEW_GAME_OPTIONS[option].cost ? this.buttons[count].setActive(this.hasRequired(option)) : setType == "SINGLE" && rest + cost >= sc.NEW_GAME_OPTIONS[option].cost ? this.buttons[count].setActive(this.hasRequired(option)) : this.buttons[count].setActive(false)
            }
        },

        getSingleCost: function () {
            if (this.set.type == "MULTI") return 0;
            for (var i = this.buttons.length; i--;) {
                var option = this.buttons[i].data.id;
                if (sc.newgame.options[option]) return sc.NEW_GAME_OPTIONS[option].cost || 0
            }
        },

        hasRequired: function (option) {
            if (!sc.NEW_GAME_OPTIONS[option].requires) return true;
            for (var requires = sc.NEW_GAME_OPTIONS[option].requires, i = requires.length; i--;)
                if (!sc.newgame.options[requires[i]]) return false;
            return true
        }
    });

    sc.NewGameOptionButton = sc.ListBoxButton.extend({
        amount: null,
        set: null,
        setKey: null,
        setGui: null,

        init: function (label, cost, id, description, setKey, set, setGui) {
            this.parent(label, 142, 40, id, description);
            this.set = set;
            this.setKey = setKey;
            this.setGui = setGui;
            this.button.submitSound = null;
            if (cost >= 0) {
                this.amount = new sc.NumberGui(9999);
                this.amount.setNumber(cost, true);
                this.amount.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.amount.setPos(5, 7);
                this.addChildGui(this.amount)
            }
            if (sc.NEW_GAME_OPTIONS[id].requires) {
                this.active = false;
                this.button.setActive(false)
            }
            this.updateToggleState()
        },

        updateToggleState: function () {
            var toggled = null,
                toggled = sc.newgame.options[this.data.id] || false,
                icon = this.set.type == sc.TOGGLE_SET_TYPE.SINGLE ? "\\i[" + (toggled ? "toggle-item-on-radio" : "toggle-item-off-radio") + (this.active ? "" : "-grey") + "]" : "\\i[" + (toggled ? "toggle-item-on" : "toggle-item-off") + (this.active ? "" : "-grey") + "]";
            this.button.textChild.setText(icon + this.button.getButtonText())
        },

        setActive: function (active) {
            this.active = active;
            this.button.setActive(active);
            this.updateToggleState()
        }
    })
});
ig.baked = !0;
