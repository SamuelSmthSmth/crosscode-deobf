ig.module("game.feature.quick-menu.gui.quick-party").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.interact.button-group", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.menu-misc", "game.feature.quick-menu.gui.quick-item-menu").defines(function() {
    var tempVec = Vec2.createC(0, 0);
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
        init: function(base, anchor) {
            this.parent(202, 115);
            this.base = base.hook;
            this.anchor = anchor.hook;
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
            var label = new sc.TextGui(ig.lang.get("sc.gui.quick-menu.strategy.headers.target"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(9, 4);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.quick-menu.strategy.headers.behaviour"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(9, 41);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.quick-menu.strategy.headers.arts"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(9, 78);
            this.addChildGui(label);
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
        updateDrawables: function(drawables) {
            this.parent(drawables);
            drawables.addColor("#7E7E7E", 2, 11, 198, 1);
            drawables.addColor("#7E7E7E", 2, 48, 198, 1);
            drawables.addColor("#7E7E7E", 2, 85, 198, 1)
        },
        addRow: function(key, row) {
            this.rows[row] = [];
            var button = this.createButton(key, 0, row, sc.BUTTON_TYPE.GROUP_LEFT);
            button.setPos(8, 15 + row * 37);
            this.addChildGui(button);
            button = this.createButton(key, 1, row, sc.BUTTON_TYPE.GROUP);
            button.setPos(38, 15 + row * 37);
            this.addChildGui(button);
            button = this.createButton(key, 2, row, sc.BUTTON_TYPE.GROUP_RIGHT);
            button.setPos(68, 15 + row * 37);
            this.addChildGui(button);
            button = new ig.ImageGui(this.ninepatch.gfx,
                560, 213, 9, 7);
            button.setPos(102, 22 + row * 37);
            this.addChildGui(button);
            button = new sc.TextGui("");
            button.setPos(115, 17 + row * 37);
            this.addChildGui(button);
            this.currentText[row] = button
        },
        createButton: function(key, index, row, buttonType) {
            buttonType = new sc.ButtonGui("\\i[party-" + key + "-" + index + "]", 29, true, buttonType, null, true);
            buttonType.textChild.setPos(index == 0 ? 2 : 0, 0);
            buttonType.data = {
                description: ig.lang.get("sc.gui.quick-menu.strategy.description." + key)[index],
                id: index,
                row: row,
                key: key
            };
            buttonType.noFocusOnPressed = true;
            this.buttongroup.addFocusGui(buttonType, index, row);
            return this.rows[row][index] = buttonType
        },
        show: function() {
            if (this._hidden) {
                this._hidden = false;
                var hook = this.hook;
                tempVec.x = this.base.pos.x + this.anchor.pos.x + Math.floor(this.anchor.size.x / 2);
                tempVec.y = this.base.pos.y + this.anchor.pos.y + Math.floor(this.anchor.size.y / 2);
                var anchorY = tempVec.y + -46;
                tempVec.y = Math.max(10, Math.min(ig.system.height - 115 - 10 - 22, tempVec.y + -46));
                hook.pos.y = tempVec.y;
                if (tempVec.x + 240 < ig.system.width) {
                    this.currentTileOffset = "default";
                    hook.pos.x = tempVec.x + 27 + 30;
                    hook.doPosTranstition(tempVec.x + 27, tempVec.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(-10, 42 + (anchorY - tempVec.y), false)
                } else {
                    this.currentTileOffset = "flipped";
                    hook.pos.x = tempVec.x - hook.size.x - 27 - 30 - 1;
                    hook.doPosTranstition(tempVec.x -
                        hook.size.x - 27 - 1, tempVec.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(hook.size.x + 1, 42 + (anchorY - tempVec.y), true)
                }
                ig.interact.setBlockDelay(0.2);
                this.resetRow("TARGET", 0);
                this.resetRow("BEHAVIOUR", 1);
                this.resetRow("ARTS", 2);
                hook = this.rows[1][2];
                if (sc.arena.active) {
                    hook.setActive(false);
                    hook.setText("\\i[party-BEHAVIOUR-2-grey]", true)
                } else {
                    hook.setActive(true);
                    hook.setText("\\i[party-BEHAVIOUR-2]", true)
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
        resetRow: function(key, row) {
            var index = this.getButtonIndex(sc.party.strategyKeys[key], row);
            this.resetButtons(this.rows[row][index], this.rows[row]);
            this.buttongroup.setPressedFocusGui(this.rows[row][index]);
            this.currentText[row].setText(ig.lang.get("sc.gui.quick-menu.strategy.names." + key)[index])
        },
        resetButtons: function(activeButton, buttons) {
            for (var i = buttons.length; i--;) buttons[i] != activeButton && buttons[i].setPressed(false)
        },
        getButtonIndex: function(strategy, row) {
            if (row == 0) {
                if (strategy == "WHATEVER") return 0;
                if (strategy == "MY_ENEMY") return 1;
                if (strategy == "OTHERS") return 2
            } else if (row == 1) {
                if (strategy == "OFFENSIVE") return 0;
                if (strategy == "DEFENSIVE") return 1;
                if (strategy == "DO_NOTHING") return 2
            } else if (row == 2) {
                if (strategy == "NORMAL") return 0;
                if (strategy == "OFTEN") return 1;
                if (strategy == "NEVER") return 2
            }
        },
        onSelection: function(button) {
            button.data && button.data.description && sc.quickmodel.setInfoText(button.data.description)
        },
        onPress: function(button) {
            if (button.data) {
                button = button.data;
                sc.party.updatePartyStrategy(button.key, sc.party.getStrategyKey(button.key, button.id));
                this.resetRow(button.key, button.row)
            }
        },
        modelChanged: function(model, msg) {
            model ==
                sc.quickmodel && (msg == sc.QUICK_MODEL_EVENT.SWITCH_STATE ? sc.quickmodel.isQuickParty() ? this.show() : this.hide() : msg == sc.QUICK_MODEL_EVENT.EXIT_MENU && this.hide())
        }
    })
});
ig.baked = !0;
