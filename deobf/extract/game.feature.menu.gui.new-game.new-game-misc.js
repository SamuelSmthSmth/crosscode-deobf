ig.module("game.feature.menu.gui.new-game.new-game-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.menu.gui.menu-misc").defines(function() {
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
        init: function() {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(164, 87);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(8, 28);
            var b = 5,
                a = new sc.TextGui(ig.lang.get("sc.gui.menu.new-game.overview"), {
                    font: sc.fontsystem.tinyFont
                });
            a.setPos(2, b);
            this.addChildGui(a);
            b = b + 13;
            this.points = new sc.NewGameCartEntry(ig.lang.get("sc.gui.menu.new-game.points"));
            this.points.setPos(4, b);
            this.addChildGui(this.points);
            b = b + 13;
            this.cost = new sc.NewGameCartEntry(ig.lang.get("sc.gui.shop.cost"));
            this.cost.setPos(4, b);
            this.cost.hideSymbol = true;
            this.cost.number.noZero =
                true;
            this.cost.number.signed = true;
            this.cost.number.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.addChildGui(this.cost);
            b = b + 16;
            this.rest = new sc.NewGameCartEntry(ig.lang.get("sc.gui.shop.rest"));
            this.rest.setPos(4, b);
            this.addChildGui(this.rest);
            this.doStateTransition("HIDDEN", true)
        },
        resetNumbers: function(b) {
            var a = sc.trophies.getTotalPoints();
            this.points.setNumber(a, b);
            this.cost.setNumber(0, b);
            this.rest.setNumber(a, b);
            a < 0 ? this.rest.number.setColor(sc.GUI_NUMBER_COLOR.RED) : this.rest.number.setColor(sc.GUI_NUMBER_COLOR.WHITE)
        },
        updateCost: function(b) {
            var a = sc.trophies.getTotalPoints(),
                d = sc.newgame.getCost(),
                a = a - d;
            this.cost.setNumber(-d, b);
            this.rest.setNumber(a, b)
        },
        updateDrawables: function(b) {
            this.parent(b);
            b.addColor("#7E7E7E", 0, 12, this.hook.size.x, 1);
            b.addColor("#FFF", 3, 42, this.hook.size.x - 6, 1)
        },
        show: function() {
            this.resetNumbers(true);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        }
    });
    sc.NewGameCartEntry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        text: null,
        number: null,
        hideSymbol: false,
        init: function(b) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(157, 8);
            this.text = new sc.TextGui(b, {
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
        updateDrawables: function(b) {
            this.hideSymbol || b.addGfx(this.gfx, this.hook.size.x - 10, 0, 468, 201, 10, 8)
        },
        setNumber: function(b,
            a) {
            this.number.setMaxNumber(Math.abs(b));
            this.number.setNumber(b, a)
        }
    });
    sc.NewGameToggleSet = ig.GuiElementBase.extend({
        header: null,
        background: null,
        buttons: [],
        set: null,
        listIndex: 0,
        init: function(b, a, d, c, e) {
            this.parent();
            this.setSize(363, 9);
            this.listIndex = c;
            this.set = sc.NEW_GAME_SETS[b];
            if (this.set.color) {
                this.background = new ig.ColorGui(this.set.color);
                this.background.hook.localAlpha = 0.2;
                this.background.setPos(-1, 0);
                this.addChildGui(this.background)
            }
            this.header = new sc.TextGui(ig.lang.get("sc.gui.menu.new-game.sets." +
                b), {
                font: sc.fontsystem.tinyFont
            });
            this.header.setPos(0, 1);
            this.addChildGui(this.header);
            this.line = new ig.ColorGui("#545454", this.hook.size.x + 2, 1);
            this.line.setPos(-1, 9);
            this.addChildGui(this.line);
            var c = sc.NEW_GAME_OPTIONS,
                f = 0,
                g = 0,
                a = a.buttonGroup(),
                h = 0,
                i;
            for (i in c) {
                var j = c[i];
                if (!(j.set != b || j.disabled)) {
                    var k = ig.LangLabel.getText(ig.lang.get("sc.gui.menu.new-game.options.names." + i)),
                        l = ig.LangLabel.getText(ig.lang.get("sc.gui.menu.new-game.options.descriptions." + i)),
                        j = new sc.NewGameOptionButton(k,
                            j.cost, i, l, b, this.set, this);
                    j.setPos(f * 182, g * 20 + 11);
                    this.addChildGui(j);
                    this.buttons.push(j);
                    if (sc.menu.newGameViewMode) {
                        j.blockedSound = null;
                        sc.newgame.get(i) || j.setActive(false)
                    }
                    a.addFocusGui(j, f, g + d);
                    f++;
                    if (f >= 2) {
                        f = 0;
                        g++
                    }
                    h++
                }
            }
            this.hook.size.y = Math.ceil(h / 2) * 20 + 15;
            this.background && this.background.setSize(this.hook.size.x + 2, Math.ceil(h / 2) * 20 + 15);
            e.counter = h
        },
        updateTogglesStates: function(b) {
            for (var a = this.buttons.length; a--;) b != this.buttons[a] && this.buttons[a].updateToggleState();
            if (b) {
                a = new sc.ItemMenuToggleAnimation(function() {
                        b.updateToggleState()
                    }.bind(this),
                    b.set.type == sc.TOGGLE_SET_TYPE.SINGLE);
                b.addChildGui(a)
            }
        },
        updateActiveState: function(b, a, d) {
            b = this.buttons.length;
            for (a = this.getSingleCost(); b--;) {
                var c = this.buttons[b].data.id,
                    e = sc.NEW_GAME_SETS[sc.NEW_GAME_OPTIONS[c].set].type;
                sc.newgame.options[c] ? this.buttons[b].setActive(true) : d >= sc.NEW_GAME_OPTIONS[c].cost ? this.buttons[b].setActive(this.hasRequired(c)) : e == "SINGLE" && d + a >= sc.NEW_GAME_OPTIONS[c].cost ? this.buttons[b].setActive(this.hasRequired(c)) : this.buttons[b].setActive(false)
            }
        },
        getSingleCost: function() {
            if (this.set.type ==
                "MULTI") return 0;
            for (var b = this.buttons.length; b--;) {
                var a = this.buttons[b].data.id;
                if (sc.newgame.options[a]) return sc.NEW_GAME_OPTIONS[a].cost || 0
            }
        },
        hasRequired: function(b) {
            if (!sc.NEW_GAME_OPTIONS[b].requires) return true;
            for (var b = sc.NEW_GAME_OPTIONS[b].requires, a = b.length; a--;)
                if (!sc.newgame.options[b[a]]) return false;
            return true
        }
    });
    sc.NewGameOptionButton = sc.ListBoxButton.extend({
        amount: null,
        set: null,
        setKey: null,
        setGui: null,
        init: function(b, a, d, c, e, f, g) {
            this.parent(b, 142, 40, d, c);
            this.set = f;
            this.setKey =
                e;
            this.setGui = g;
            this.button.submitSound = null;
            if (a >= 0) {
                this.amount = new sc.NumberGui(9999);
                this.amount.setNumber(a, true);
                this.amount.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.amount.setPos(5, 7);
                this.addChildGui(this.amount)
            }
            if (sc.NEW_GAME_OPTIONS[d].requires) {
                this.active = false;
                this.button.setActive(false)
            }
            this.updateToggleState()
        },
        updateToggleState: function() {
            var b = null,
                b = sc.newgame.options[this.data.id] || false,
                b = this.set.type == sc.TOGGLE_SET_TYPE.SINGLE ? "\\i[" + (b ? "toggle-item-on-radio" :
                    "toggle-item-off-radio") + (this.active ? "" : "-grey") + "]" : "\\i[" + (b ? "toggle-item-on" : "toggle-item-off") + (this.active ? "" : "-grey") + "]";
            this.button.textChild.setText(b + this.button.getButtonText())
        },
        setActive: function(b) {
            this.active = b;
            this.button.setActive(b);
            this.updateToggleState()
        }
    })
});
ig.baked = !0;
