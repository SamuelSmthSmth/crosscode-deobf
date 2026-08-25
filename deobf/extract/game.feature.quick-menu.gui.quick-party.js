ig.module("game.feature.quick-menu.gui.quick-party").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.interact.button-group", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.menu-misc", "game.feature.quick-menu.gui.quick-item-menu").defines(function() {
    var b = Vec2.createC(0, 0);
    sc.QuickPartyStrategyMenu = ig.BoxGui.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 432,
                    y: 304
                },
                flipped: {
                    x: 456,
                    y: 304
                }
            }
        }),
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        base: null,
        anchor: null,
        arrow: null,
        rows: [],
        currentText: [],
        buttongroup: null,
        _hidden: true,
        init: function(a, b) {
            this.parent(202, 115);
            this.base = a.hook;
            this.anchor = b.hook;
            this.buttongroup = new sc.RowButtonGroup;
            this.buttongroup.enableMultiPressed = true;
            this.buttongroup.soundsOnPressed = true;
            this.buttongroup.addSelectionCallback(this.onSelection.bind(this));
            this.buttongroup.addPressCallback(this.onPress.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function() {
                sc.quickmodel.setInfoText("", true);
                sc.quickmodel.setBuffText("", true)
            }.bind(this));
            this.buttongroup.setLeftRightCallback(function() {
                return true
            }.bind(this));
            sc.Model.addObserver(sc.quickmodel, this);
            var c = new sc.TextGui(ig.lang.get("sc.gui.quick-menu.strategy.headers.target"), {
                font: sc.fontsystem.tinyFont
            });
            c.setPos(9, 4);
            this.addChildGui(c);
            c = new sc.TextGui(ig.lang.get("sc.gui.quick-menu.strategy.headers.behaviour"), {
                font: sc.fontsystem.tinyFont
            });
            c.setPos(9, 41);
            this.addChildGui(c);
            c = new sc.TextGui(ig.lang.get("sc.gui.quick-menu.strategy.headers.arts"), {
                font: sc.fontsystem.tinyFont
            });
            c.setPos(9, 78);
            this.addChildGui(c);
            this.arrow = new sc.QuickItemArrow;
            this.addChildGui(this.arrow);
            this.addRow("TARGET", 0);
            this.addRow("BEHAVIOUR", 1);
            this.addRow("ARTS", 2);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.isVisible() && (this.buttongroup.isActive() && !ig.interact.isBlocked()) && sc.control.menuBack()) {
                sc.BUTTON_SOUND.back.play();
                sc.quickmodel.enterNone()
            }
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addColor("#7E7E7E", 2, 11, 198, 1);
            a.addColor("#7E7E7E", 2, 48, 198, 1);
            a.addColor("#7E7E7E", 2, 85, 198, 1)
        },
        addRow: function(a, b) {
            this.rows[b] = [];
            var c = this.createButton(a, 0, b, sc.BUTTON_TYPE.GROUP_LEFT);
            c.setPos(8, 15 + b * 37);
            this.addChildGui(c);
            c = this.createButton(a, 1, b, sc.BUTTON_TYPE.GROUP);
            c.setPos(38, 15 + b * 37);
            this.addChildGui(c);
            c = this.createButton(a, 2, b, sc.BUTTON_TYPE.GROUP_RIGHT);
            c.setPos(68, 15 + b * 37);
            this.addChildGui(c);
            c = new ig.ImageGui(this.ninepatch.gfx,
                560, 213, 9, 7);
            c.setPos(102, 22 + b * 37);
            this.addChildGui(c);
            c = new sc.TextGui("");
            c.setPos(115, 17 + b * 37);
            this.addChildGui(c);
            this.currentText[b] = c
        },
        createButton: function(a, b, c, e) {
            e = new sc.ButtonGui("\\i[party-" + a + "-" + b + "]", 29, true, e, null, true);
            e.textChild.setPos(b == 0 ? 2 : 0, 0);
            e.data = {
                description: ig.lang.get("sc.gui.quick-menu.strategy.description." + a)[b],
                id: b,
                row: c,
                key: a
            };
            e.noFocusOnPressed = true;
            this.buttongroup.addFocusGui(e, b, c);
            return this.rows[c][b] = e
        },
        show: function() {
            if (this._hidden) {
                this._hidden = false;
                var a = this.hook;
                b.x = this.base.pos.x + this.anchor.pos.x + Math.floor(this.anchor.size.x / 2);
                b.y = this.base.pos.y + this.anchor.pos.y + Math.floor(this.anchor.size.y / 2);
                var d = b.y + -46;
                b.y = Math.max(10, Math.min(ig.system.height - 115 - 10 - 22, b.y + -46));
                a.pos.y = b.y;
                if (b.x + 240 < ig.system.width) {
                    this.currentTileOffset = "default";
                    a.pos.x = b.x + 27 + 30;
                    a.doPosTranstition(b.x + 27, b.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(-10, 42 + (d - b.y), false)
                } else {
                    this.currentTileOffset = "flipped";
                    a.pos.x = b.x - a.size.x - 27 - 30 - 1;
                    a.doPosTranstition(b.x -
                        a.size.x - 27 - 1, b.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(a.size.x + 1, 42 + (d - b.y), true)
                }
                ig.interact.setBlockDelay(0.2);
                this.resetRow("TARGET", 0);
                this.resetRow("BEHAVIOUR", 1);
                this.resetRow("ARTS", 2);
                a = this.rows[1][2];
                if (sc.arena.active) {
                    a.setActive(false);
                    a.setText("\\i[party-BEHAVIOUR-2-grey]", true)
                } else {
                    a.setActive(true);
                    a.setText("\\i[party-BEHAVIOUR-2]", true)
                }
                sc.quickmodel.buttonInteract.pushButtonGroup(this.buttongroup);
                this.doStateTransition("DEFAULT")
            }
        },
        hide: function() {
            if (!this._hidden) {
                this._hidden =
                    true;
                sc.quickmodel.buttonInteract.removeButtonGroup(this.buttongroup);
                this.doStateTransition("HIDDEN")
            }
        },
        resetRow: function(a, b) {
            var c = this.getButtonIndex(sc.party.strategyKeys[a], b);
            this.resetButtons(this.rows[b][c], this.rows[b]);
            this.buttongroup.setPressedFocusGui(this.rows[b][c]);
            this.currentText[b].setText(ig.lang.get("sc.gui.quick-menu.strategy.names." + a)[c])
        },
        resetButtons: function(a, b) {
            for (var c = b.length; c--;) b[c] != a && b[c].setPressed(false)
        },
        getButtonIndex: function(a, b) {
            if (b == 0) {
                if (a == "WHATEVER") return 0;
                if (a == "MY_ENEMY") return 1;
                if (a == "OTHERS") return 2
            } else if (b == 1) {
                if (a == "OFFENSIVE") return 0;
                if (a == "DEFENSIVE") return 1;
                if (a == "DO_NOTHING") return 2
            } else if (b == 2) {
                if (a == "NORMAL") return 0;
                if (a == "OFTEN") return 1;
                if (a == "NEVER") return 2
            }
        },
        onSelection: function(a) {
            a.data && a.data.description && sc.quickmodel.setInfoText(a.data.description)
        },
        onPress: function(a) {
            if (a.data) {
                a = a.data;
                sc.party.updatePartyStrategy(a.key, sc.party.getStrategyKey(a.key, a.id));
                this.resetRow(a.key, a.row)
            }
        },
        modelChanged: function(a, b) {
            a ==
                sc.quickmodel && (b == sc.QUICK_MODEL_EVENT.SWITCH_STATE ? sc.quickmodel.isQuickParty() ? this.show() : this.hide() : b == sc.QUICK_MODEL_EVENT.EXIT_MENU && this.hide())
        }
    })
});
ig.baked = !0;
