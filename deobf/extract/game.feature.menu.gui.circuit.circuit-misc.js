ig.module("game.feature.menu.gui.circuit.circuit-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc", "game.feature.skills.skilltree", "game.feature.player.player-model").defines(function() {
    sc.LINE_DRAW_TYPE = {
        HORZ: 1,
        VERT: 2,
        SLOPE: 3
    };
    sc.TREE_CARDINAL_DIR = {
        NORTH: 0,
        EAST: 2,
        SOUTH: 4,
        WEST: 6,
        NORTH_EAST: 1,
        SOUTH_EAST: 3,
        SOUTH_WEST: 5,
        NORTH_WEST: 7
    };
    sc.CircuitSwapCursor = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        focusOffset: {
            x: 0,
            y: 0
        },
        focus: false,
        _focusTimer: 0,
        _focusTime: 0,
        _focusOffset: 0,
        _lastDevice: 0,
        _gamepadActive: false,
        _worldmap: false,
        _ignoreModel: false,
        init: function() {
            this.parent();
            this.setSize(49, 49);
            this._worldmap = true
        },
        focusOnNode: function(b, a) {
            this.setPos(b - Math.floor(this.hook.size.x / 2), a - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            this.focus = true;
            this._focusTimer = 0;
            this._focusTime = 0.15;
            this._focusOffset = 0
        },
        unfocus: function() {
            this.focus = false;
            this.resetFocusTimer()
        },
        resetFocusTimer: function() {
            this._focusTime =
                this._focusTimer = 0.15;
            this._focusOffset = 0
        },
        moveTo: function(b, a, d, c) {
            d && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.doPosTranstition(b - Math.floor(this.hook.size.x / 2), a - Math.floor(this.hook.size.y / 2) - this.focusOffset.y, c, KEY_SPLINES.EASE) : this.setPos(b - Math.floor(this.hook.size.x / 2), a - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            if (this.focus) {
                this._focusTimer = 0;
                this._focusTime = 0.15;
                this._focusOffset = 3;
                this.focus = false
            }
        },
        update: function() {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive =
                    ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            if (this._focusTimer < this._focusTime) {
                this._focusTimer = this._focusTimer + ig.system.tick;
                if (this._focusTimer >= this._focusTime) {
                    this._focusTimer = this._focusTime;
                    this._focusOffset = this.focus ? 3 : 0
                } else this._focusOffset = (this._focusTime ? 1 : -1) * (this._focusTimer / this._focusTime) * 3
            }
        },
        updateDrawables: function(b) {
            this.focus ? b.addGfx(this.gfx, 0, 0, 424, 168, 49, 49) : this._gamepadActive && b.addGfx(this.gfx, 0, 0, 424, 223, 49, 49)
        },
        modelChanged: function(b,
            a) {
            if (!this._ignoreModel && b == sc.menu)
                if (a == sc.MENU_EVENT.MAP_CHANGED_FLOOR) {
                    this.unfocus();
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) this._gamepadActive = true
                } else if (a == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                this._focusTime = this._focusTimer = 0.15;
                this._focusOffset = 0
            } else a == sc.MENU_EVENT.SKILL_SWAP_FOCUS ? this.focusOnNode(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y) : a == sc.MENU_EVENT.SKILL_SWAP_UNFOCUS ? this.unfocus() : a == sc.MENU_EVENT.SKILL_SWAP_ENSURE && (this.focus || this.focusOnNode(sc.menu.skillSwapCursor.x,
                sc.menu.skillSwapCursor.y))
        }
    });
    sc.CrossPointsOverview = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -86
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_MIN: {
                state: {
                    alpha: 0,
                    offsetX: -145
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        sizeTransition: null,
        points: [],
        background: null,
        leftButton: null,
        rightButton: null,
        currentElement: -1,
        minimized: false,
        _elementCount: 0,
        init: function() {
            this.parent();
            this.setPos(10, 30);
            this.setSize(132, 100);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.background = new sc.MenuPanel(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.background.setSize(76, 100);
            this.background.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.background);
            for (var b in sc.ELEMENT) {
                var a = sc.ELEMENT[b];
                this.points[a] = new sc.CrossPointsOverview.Entry(a);
                this.addChildGui(this.points[a])
            }
            this.leftButton = new sc.ButtonGui("\\i[arrow-left]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.leftButton.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_IN
                }
            };
            this.leftButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.leftButton.setPos(5, 0);
            this.leftButton.onButtonPress = this._onHotkeyLeft.bind(this);
            this.rightButton = new sc.ButtonGui("\\i[arrow-right]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.rightButton.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_IN
                }
            };
            this.rightButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.rightButton.setPos(-20, 0);
            this.rightButton.onButtonPress = this._onHotkeyRight.bind(this);
            this.leftButton.doStateTransition("HIDDEN", true);
            this.rightButton.doStateTransition("HIDDEN", true);
            this.background.annotation = {
                content: {
                    title: "sc.gui.menu.help.circuit.titles.points",
                    description: "sc.gui.menu.help.circuit.description.points"
                },
                offset: {
                    x: 0,
                    y: 0
                },
                size: {
                    x: "dyn",
                    y: "dyn"
                },
                index: {
                    x: 0,
                    y: 0
                },
                condition: function() {
                    return !this.minimized
                }.bind(this)
            };
            this.addChildGui(this.leftButton);
            this.addChildGui(this.rightButton);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var b = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    b = this.sizeTransition.timeFunction.get(b);
                this.background.hook.size.x = Math.round(this.sizeTransition.startWidth *
                    (1 - b) + this.sizeTransition.width * b);
                this.background.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - b) + this.sizeTransition.height * b);
                if (b == 1) this.sizeTransition = null
            }
        },
        doSizeTransition: function(b, a, d, c) {
            this.sizeTransition = {
                startWidth: this.background.hook.size.x,
                width: b || 0,
                startHeight: this.background.hook.size.y,
                height: a || 0,
                time: d,
                timeFunction: KEY_SPLINES.EASE,
                timer: 0 - (c || 0)
            }
        },
        _addHotkeys: function() {
            sc.menu.buttonInteract.addGlobalButton(this.leftButton, this._checkHotkey.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.rightButton,
                this._checkHotkey.bind(this))
        },
        _onHotkeyRight: function() {
            this._circleTree(1)
        },
        _onHotkeyLeft: function() {
            this._circleTree(0)
        },
        _checkHotkey: function() {
            return false
        },
        _circleTree: function(b) {
            if (b >= 0) {
                b = this._cycleElements(b);
                b != sc.menu.currentSkillTree && sc.menu.selectSkillTree(b)
            }
        },
        _cycleElements: function(b) {
            var a = sc.menu.currentSkillTree;
            do
                if (b > 0) a = (a + 1) % 5;
                else {
                    a--;
                    a < 0 && (a = 4)
                } while (!sc.model.player.hasElement(a));
            return a
        },
        _selectElement: function(b) {
            if (!(this._elementCount <= 1) && this.currentElement !=
                b) {
                if (this.minimized) {
                    this.points[this.currentElement].doStateTransition("HIDDEN", true);
                    this.points[b].setPos(42, -2 + (this._elementCount - 1) * 20);
                    this.points[b].doStateTransition("DEFAULT", true);
                    this.points[b].hideIcon(0, true);
                    this.points[b].showIcon(0.2, false, this.currentElement)
                } else
                    for (var a = this.points.length; a--;) a != b && this.points[a].doStateTransition("HIDDEN");
                this.currentElement = b;
                this._minimizeOverview(b)
            }
        },
        _minimizeOverview: function(b) {
            if (!this.minimized) {
                this.points[b].doPosTranstition(42,
                    -2 + (this._elementCount - 1) * 20, 0.2, KEY_SPLINES.EASE, 0.1);
                this.background.doPosTranstition(13, 0, 0.2, null, 0.2);
                this.doSizeTransition(132, 21, 0.2, 0.1);
                this.leftButton.doStateTransition("DEFAULT", false, false, null, 0.3);
                this.rightButton.doStateTransition("DEFAULT", false, false, null, 0.3);
                this._addHotkeys();
                this.minimized = true
            }
        },
        _maximizeOverview: function(b) {
            if (this.minimized) {
                this.currentElement = -1;
                b = this._setPositions(false, true, b);
                this.background.doPosTranstition(0, 0, 0.2, null, 0.1);
                this.doSizeTransition(76,
                    b, 0.2, 0.1);
                this.leftButton.doStateTransition("HIDDEN");
                this.rightButton.doStateTransition("HIDDEN");
                this.minimized = false;
                this.removeHotkeys()
            }
        },
        _resetOverview: function() {
            this.minimized = false;
            this.currentElement = -1;
            var b = this._setPositions();
            this.hook.size.y = b;
            this.background.setPos(0, 0);
            this.background.setSize(76, b < 20 ? 20 : b);
            this.leftButton.doStateTransition("HIDDEN", true);
            this.rightButton.doStateTransition("HIDDEN", true)
        },
        _setPositions: function(b, a, d) {
            for (var c = -2, e = null, f = sc.model.player, g = this._elementCount =
                    0; g < this.points.length; g++) {
                e = this.points[g];
                if (f.getCore(g + 8)) {
                    if (a && d != g) {
                        e.doStateTransition("HIDDEN", true);
                        e.doStateTransition("DEFAULT", false, false, null, 0.3)
                    } else e.doStateTransition("DEFAULT", !b);
                    this._elementCount++
                } else e.doStateTransition("HIDDEN", !b);
                d == g && a ? e.doPosTranstition(2, c, 0.2, KEY_SPLINES.EASE, 0.1) : e.setPos(2, c);
                f.getCore(g + 8) && (c = c + 20)
            }
            return this._elementCount * 20
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.model.menu,
                this);
            sc.Model.removeObserver(sc.model.player, this)
        },
        showMenu: function() {
            this._resetOverview();
            this.doStateTransition("DEFAULT")
        },
        hideMenu: function() {
            this.exitMenu()
        },
        exitMenu: function() {
            this.minimized ? this.doStateTransition("HIDDEN_MIN") : this.doStateTransition("HIDDEN", false, false, function() {
                this._resetOverview()
            }.bind(this));
            this.minimized = false;
            this.removeHotkeys()
        },
        removeHotkeys: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.leftButton);
            sc.menu.buttonInteract.removeGlobalButton(this.rightButton)
        },
        modelChanged: function(b, a) {
            if (b == sc.menu) a == sc.MENU_EVENT.SKILL_TREE_SELECT && (sc.menu.currentSkillTree < 0 ? this._maximizeOverview(this.currentElement) : this._selectElement(sc.menu.currentSkillTree));
            else if (b == sc.model.player && (a == sc.PLAYER_MSG.CP_CHANGE || a == sc.PLAYER_MSG.SKILL_CHANGED))
                for (var d = this.points.length; d--;) this.points[d].updatePoints()
        }
    });
    sc.CrossPointsOverview.Entry = ig.GuiElementBase.extend({
        elementGfx: new ig.Image("media/gui/status-gui.png"),
        gfx: new ig.Image("media/gui/circuit.png"),
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
        alphaTransition: null,
        element: 0,
        preElement: 0,
        alpha: 1,
        init: function(b) {
            this.parent();
            this.setSize(75, 24);
            this.number = new sc.NumberGui(108, {
                transitionTime: 0.2
            });
            this.number.setNumber(sc.model.player.skillPoints[b], true);
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.number.setPos(7, 10);
            this.addChildGui(this.number);
            this.element = b
        },
        update: function() {
            if (this.alphaTransition) {
                this.alphaTransition.timer = this.alphaTransition.timer + ig.system.actualTick;
                var b = Math.min(1, Math.max(0, this.alphaTransition.timer) / this.alphaTransition.time),
                    b = this.alphaTransition.timeFunction.get(b);
                this.alpha = this.alphaTransition.startAlpha * (1 - b) + this.alphaTransition.alpha * b;
                if (b == 1) this.alphaTransition = null
            }
        },
        updateDrawables: function(b) {
            this.alphaTransition && b.addGfx(this.elementGfx, 0, 0, 104, 32 + this.preElement * 24, 24, 24).setAlpha(1 - this.alpha);
            b.addGfx(this.elementGfx,
                0, 0, 104, 32 + this.element * 24, 24, 24).setAlpha(this.alpha);
            b.addGfx(this.gfx, 22, 6, 368, 272, 52, 11)
        },
        updatePoints: function() {
            this.number.setNumber(sc.model.player.skillPoints[this.element])
        },
        hideIcon: function(b, a) {
            this.doIconTransition(0, b, a)
        },
        showIcon: function(b, a, d) {
            this.preElement = d;
            this.doIconTransition(1, b, a)
        },
        doIconTransition: function(b, a, d) {
            d ? this.alpha = b : this.alphaTransition = {
                startAlpha: this.alpha,
                alpha: b,
                time: a,
                timeFunction: KEY_SPLINES.EASE,
                timer: 0
            }
        }
    });
    sc.DebugSkillLearner = ig.GuiElementBase.extend({
        buttonInteract: null,
        button: null,
        itemList: null,
        selfUpdate: false,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.hook.zIndex = 2E3;
            this.hook.pauseGui = true;
            this.buttonInteract = new ig.ButtonInteractEntry;
            sc.Model.addObserver(sc.model.player, this);
            this.button = new sc.ButtonGui("+ 2 CP", 0, true, sc.BUTTON_TYPE.SMALL);
            this.button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.button.setPos(0, -116);
            this.button.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -180
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.button.doStateTransition("HIDDEN", true);
            this.button.onButtonPress = function() {
                sc.model.player.addSkillPoints(2, -1, true)
            }.bind(this);
            this.addChildGui(this.button);
            this.itemList = new sc.ItemListBox(1);
            this.itemList.setSize(170, 210);
            this.itemList.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.itemList.quantity.setText("learned");
            this.itemList.list.buttonGroup.addPressCallback(function(b) {
                this._updateLearned(b)
            }.bind(this));
            this.itemList.setPos(0, 11);
            this.itemList.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -180
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.buttonInteract.pushButtonGroup(this.itemList.list.buttonGroup);
            this._loadSkills();
            this.addChildGui(this.itemList);
            this.itemList.doStateTransition("HIDDEN", true);
            this.buttonInteract.addGlobalButton(this.button, function() {
                return false
            }.bind(this))
        },
        update: function() {
            if (ig.input.pressed("skills"))
                if (this.itemList.hook.currentStateName ==
                    "DEFAULT") {
                    ig.interact.removeEntry(this.buttonInteract);
                    this.itemList.doStateTransition("HIDDEN");
                    this.button.doStateTransition("HIDDEN")
                } else {
                    ig.interact.addEntry(this.buttonInteract);
                    this.itemList.doStateTransition("DEFAULT");
                    this.button.doStateTransition("DEFAULT")
                }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.model.player && (a == sc.PLAYER_MSG.SKILL_CHANGED || a == sc.PLAYER_MSG.SKILL_BRANCH_SWAP))
                if (this.selfUpdate) this.selfUpdate = false;
                else
                    for (var b = a == sc.PLAYER_MSG.SKILL_BRANCH_SWAP, a = this.itemList.list.getChildren(),
                            c = a.length, e = null, f = false; c--;) {
                        e = a[c].gui;
                        if (f = b ? true : e.data && d == e.data.description) {
                            sc.model.player.hasSkill(e.data.description) ? e.has.setText("YES") : e.has.setText("NO");
                            if (!b) break
                        }
                    }
        },
        _loadSkills: function() {
            this.itemList.list.buttonGroup.clear();
            this.itemList.list.clear(false);
            for (var b = sc.skilltree.skills, a = null, a = null, d = 0; d < Math.floor(b.length / 2); d++) {
                a = b[d];
                a = new sc.DebugSkillLearner.ItemBoxButton(a.getName(), 136, 31, a.id, d);
                this.itemList.list.addButton(a)
            }
        },
        _updateLearned: function(b) {
            if (b.data) {
                this.selfUpdate =
                    true;
                if (sc.model.player.hasSkill(b.data.description)) {
                    sc.model.player.unlearnSkill(b.data.description);
                    b.has.setText("NO")
                } else {
                    sc.model.player.learnSkill(b.data.description, true);
                    b.has.setText("YES")
                }
            }
        }
    });
    sc.DebugSkillLearner.ItemBoxButton = sc.ListBoxButton.extend({
        has: null,
        init: function(b, a, d, c, e) {
            this.parent(b, a, d, e, c);
            b = sc.model.player.hasSkill(c) ? "YES" : "NO";
            this.has = new sc.TextGui(b, {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.has.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.has.setPos(3,
                2);
            this.addChildGui(this.has)
        }
    })
});
ig.baked = !0;
