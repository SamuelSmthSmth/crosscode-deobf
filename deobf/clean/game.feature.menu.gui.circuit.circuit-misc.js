/**
 * game.feature.menu.gui.circuit.circuit-misc
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.circuit.circuit-misc")`.
 *
 * Shared circuit-menu building blocks: `sc.CircuitSwapCursor` (the gamepad
 * cursor used in swap-branches mode), `sc.CrossPointsOverview` (the element
 * skill-point HUD in the bottom-left corner that minimizes to a single
 * element with left/right arrows), its `Entry` (one element icon + CP
 * counter), and the debug-only `sc.DebugSkillLearner` panel.
 */
ig.module("game.feature.menu.gui.circuit.circuit-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc", "game.feature.skills.skilltree", "game.feature.player.player-model")
    .defines(function () {

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

        init: function () {
            this.parent();
            this.setSize(49, 49);
            this._worldmap = true
        },

        focusOnNode: function (x, y) {
            this.setPos(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            this.focus = true;
            this._focusTimer = 0;
            this._focusTime = 0.15;
            this._focusOffset = 0
        },

        unfocus: function () {
            this.focus = false;
            this.resetFocusTimer()
        },

        resetFocusTimer: function () {
            this._focusTime = this._focusTimer = 0.15;
            this._focusOffset = 0
        },

        moveTo: function (x, y, animate, time) {
            animate && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.doPosTranstition(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2) - this.focusOffset.y, time, KEY_SPLINES.EASE) : this.setPos(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2) - this.focusOffset.y);
            if (this.focus) {
                this._focusTimer = 0;
                this._focusTime = 0.15;
                this._focusOffset = 3;
                this.focus = false
            }
        },

        update: function () {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            if (this._focusTimer < this._focusTime) {
                this._focusTimer = this._focusTimer + ig.system.tick;
                if (this._focusTimer >= this._focusTime) {
                    this._focusTimer = this._focusTime;
                    this._focusOffset = this.focus ? 3 : 0
                } else {
                    this._focusOffset = (this._focusTime ? 1 : -1) * (this._focusTimer / this._focusTime) * 3
                }
            }
        },

        updateDrawables: function (drawables) {
            this.focus ? drawables.addGfx(this.gfx, 0, 0, 424, 168, 49, 49) : this._gamepadActive && drawables.addGfx(this.gfx, 0, 0, 424, 223, 49, 49)
        },

        modelChanged: function (menu, event) {
            if (!this._ignoreModel && menu == sc.menu) {
                if (event == sc.MENU_EVENT.MAP_CHANGED_FLOOR) {
                    this.unfocus();
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        this._gamepadActive = true
                    }
                } else if (event == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                    this._focusTime = this._focusTimer = 0.15;
                    this._focusOffset = 0
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_FOCUS) {
                    this.focusOnNode(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_UNFOCUS) {
                    this.unfocus()
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_ENSURE) {
                    this.focus || this.focusOnNode(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
                }
            }
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

        init: function () {
            this.parent();
            this.setPos(10, 30);
            this.setSize(132, 100);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.background = new sc.MenuPanel(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.background.setSize(76, 100);
            this.background.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.background);
            for (var element in sc.ELEMENT) {
                var elementID = sc.ELEMENT[element];
                this.points[elementID] = new sc.CrossPointsOverview.Entry(elementID);
                this.addChildGui(this.points[elementID])
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
                condition: function () {
                    return !this.minimized
                }.bind(this)
            };
            this.addChildGui(this.leftButton);
            this.addChildGui(this.rightButton);
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var progress = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    eased = this.sizeTransition.timeFunction.get(progress);
                this.background.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - eased) + this.sizeTransition.width * eased);
                this.background.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - eased) + this.sizeTransition.height * eased);
                if (eased == 1) {
                    this.sizeTransition = null
                }
            }
        },

        doSizeTransition: function (width, height, time, delay) {
            this.sizeTransition = {
                startWidth: this.background.hook.size.x,
                width: width || 0,
                startHeight: this.background.hook.size.y,
                height: height || 0,
                time: time,
                timeFunction: KEY_SPLINES.EASE,
                timer: 0 - (delay || 0)
            }
        },

        _addHotkeys: function () {
            sc.menu.buttonInteract.addGlobalButton(this.leftButton, this._checkHotkey.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.rightButton, this._checkHotkey.bind(this))
        },

        _onHotkeyRight: function () {
            this._circleTree(1)
        },

        _onHotkeyLeft: function () {
            this._circleTree(0)
        },

        _checkHotkey: function () {
            return false
        },

        _circleTree: function (direction) {
            if (direction >= 0) {
                direction = this._cycleElements(direction);
                direction != sc.menu.currentSkillTree && sc.menu.selectSkillTree(direction)
            }
        },

        _cycleElements: function (direction) {
            var element = sc.menu.currentSkillTree;
            do
                if (direction > 0) {
                    element = (element + 1) % 5
                } else {
                    element--;
                    element < 0 && (element = 4)
                } while (!sc.model.player.hasElement(element));
            return element
        },

        _selectElement: function (element) {
            if (!(this._elementCount <= 1) && this.currentElement != element) {
                if (this.minimized) {
                    this.points[this.currentElement].doStateTransition("HIDDEN", true);
                    this.points[element].setPos(42, -2 + (this._elementCount - 1) * 20);
                    this.points[element].doStateTransition("DEFAULT", true);
                    this.points[element].hideIcon(0, true);
                    this.points[element].showIcon(0.2, false, this.currentElement)
                } else {
                    for (var index = this.points.length; index--;) {
                        index != element && this.points[index].doStateTransition("HIDDEN")
                    }
                }
                this.currentElement = element;
                this._minimizeOverview(element)
            }
        },

        _minimizeOverview: function (element) {
            if (!this.minimized) {
                this.points[element].doPosTranstition(42, -2 + (this._elementCount - 1) * 20, 0.2, KEY_SPLINES.EASE, 0.1);
                this.background.doPosTranstition(13, 0, 0.2, null, 0.2);
                this.doSizeTransition(132, 21, 0.2, 0.1);
                this.leftButton.doStateTransition("DEFAULT", false, false, null, 0.3);
                this.rightButton.doStateTransition("DEFAULT", false, false, null, 0.3);
                this._addHotkeys();
                this.minimized = true
            }
        },

        _maximizeOverview: function (element) {
            if (this.minimized) {
                this.currentElement = -1;
                var height = this._setPositions(false, true, element);
                this.background.doPosTranstition(0, 0, 0.2, null, 0.1);
                this.doSizeTransition(76, height, 0.2, 0.1);
                this.leftButton.doStateTransition("HIDDEN");
                this.rightButton.doStateTransition("HIDDEN");
                this.minimized = false;
                this.removeHotkeys()
            }
        },

        _resetOverview: function () {
            this.minimized = false;
            this.currentElement = -1;
            var height = this._setPositions();
            this.hook.size.y = height;
            this.background.setPos(0, 0);
            this.background.setSize(76, height < 20 ? 20 : height);
            this.leftButton.doStateTransition("HIDDEN", true);
            this.rightButton.doStateTransition("HIDDEN", true)
        },

        _setPositions: function (instant, delayOthers, highlight) {
            for (var posY = -2, entry = null, player = sc.model.player, index = this._elementCount = 0; index < this.points.length; index++) {
                entry = this.points[index];
                if (player.getCore(index + 8)) {
                    if (delayOthers && highlight != index) {
                        entry.doStateTransition("HIDDEN", true);
                        entry.doStateTransition("DEFAULT", false, false, null, 0.3)
                    } else {
                        entry.doStateTransition("DEFAULT", !instant)
                    }
                    this._elementCount++
                } else {
                    entry.doStateTransition("HIDDEN", !instant)
                }
                highlight == index && delayOthers ? entry.doPosTranstition(2, posY, 0.2, KEY_SPLINES.EASE, 0.1) : entry.setPos(2, posY);
                player.getCore(index + 8) && (posY = posY + 20)
            }
            return this._elementCount * 20
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.model.menu, this);
            sc.Model.removeObserver(sc.model.player, this)
        },

        showMenu: function () {
            this._resetOverview();
            this.doStateTransition("DEFAULT")
        },

        hideMenu: function () {
            this.exitMenu()
        },

        exitMenu: function () {
            this.minimized ? this.doStateTransition("HIDDEN_MIN") : this.doStateTransition("HIDDEN", false, false, function () {
                this._resetOverview()
            }.bind(this));
            this.minimized = false;
            this.removeHotkeys()
        },

        removeHotkeys: function () {
            sc.menu.buttonInteract.removeGlobalButton(this.leftButton);
            sc.menu.buttonInteract.removeGlobalButton(this.rightButton)
        },

        modelChanged: function (menu, event) {
            if (menu == sc.menu) {
                event == sc.MENU_EVENT.SKILL_TREE_SELECT && (sc.menu.currentSkillTree < 0 ? this._maximizeOverview(this.currentElement) : this._selectElement(sc.menu.currentSkillTree))
            } else if (menu == sc.model.player && (event == sc.PLAYER_MSG.CP_CHANGE || event == sc.PLAYER_MSG.SKILL_CHANGED)) {
                for (var index = this.points.length; index--;) {
                    this.points[index].updatePoints()
                }
            }
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

        init: function (element) {
            this.parent();
            this.setSize(75, 24);
            this.number = new sc.NumberGui(108, {
                transitionTime: 0.2
            });
            this.number.setNumber(sc.model.player.skillPoints[element], true);
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.number.setPos(7, 10);
            this.addChildGui(this.number);
            this.element = element
        },

        update: function () {
            if (this.alphaTransition) {
                this.alphaTransition.timer = this.alphaTransition.timer + ig.system.actualTick;
                var progress = Math.min(1, Math.max(0, this.alphaTransition.timer) / this.alphaTransition.time),
                    eased = this.alphaTransition.timeFunction.get(progress);
                this.alpha = this.alphaTransition.startAlpha * (1 - eased) + this.alphaTransition.alpha * eased;
                if (eased == 1) {
                    this.alphaTransition = null
                }
            }
        },

        updateDrawables: function (drawables) {
            this.alphaTransition && drawables.addGfx(this.elementGfx, 0, 0, 104, 32 + this.preElement * 24, 24, 24).setAlpha(1 - this.alpha);
            drawables.addGfx(this.elementGfx, 0, 0, 104, 32 + this.element * 24, 24, 24).setAlpha(this.alpha);
            drawables.addGfx(this.gfx, 22, 6, 368, 272, 52, 11)
        },

        updatePoints: function () {
            this.number.setNumber(sc.model.player.skillPoints[this.element])
        },

        hideIcon: function (time, instant) {
            this.doIconTransition(0, time, instant)
        },

        showIcon: function (time, instant, previousElement) {
            this.preElement = previousElement;
            this.doIconTransition(1, time, instant)
        },

        doIconTransition: function (targetAlpha, time, instant) {
            instant ? this.alpha = targetAlpha : this.alphaTransition = {
                startAlpha: this.alpha,
                alpha: targetAlpha,
                time: time,
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

        init: function () {
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
            this.button.onButtonPress = function () {
                sc.model.player.addSkillPoints(2, -1, true)
            }.bind(this);
            this.addChildGui(this.button);
            this.itemList = new sc.ItemListBox(1);
            this.itemList.setSize(170, 210);
            this.itemList.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.itemList.quantity.setText("learned");
            this.itemList.list.buttonGroup.addPressCallback(function (entry) {
                this._updateLearned(entry)
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
            this.buttonInteract.addGlobalButton(this.button, function () {
                return false
            }.bind(this))
        },

        update: function () {
            if (ig.input.pressed("skills")) {
                if (this.itemList.hook.currentStateName == "DEFAULT") {
                    ig.interact.removeEntry(this.buttonInteract);
                    this.itemList.doStateTransition("HIDDEN");
                    this.button.doStateTransition("HIDDEN")
                } else {
                    ig.interact.addEntry(this.buttonInteract);
                    this.itemList.doStateTransition("DEFAULT");
                    this.button.doStateTransition("DEFAULT")
                }
            }
        },

        modelChanged: function (player, event, data) {
            if (player == sc.model.player && (event == sc.PLAYER_MSG.SKILL_CHANGED || event == sc.PLAYER_MSG.SKILL_BRANCH_SWAP)) {
                if (this.selfUpdate) {
                    this.selfUpdate = false
                } else {
                    for (var isSwap = event == sc.PLAYER_MSG.SKILL_BRANCH_SWAP, entries = this.itemList.list.getChildren(), count = entries.length, entry = null, done = false; count--;) {
                        entry = entries[count].gui;
                        if (done = isSwap ? true : entry.data && data == entry.data.description) {
                            sc.model.player.hasSkill(entry.data.description) ? entry.has.setText("YES") : entry.has.setText("NO");
                            if (!isSwap) {
                                break
                            }
                        }
                    }
                }
            }
        },

        _loadSkills: function () {
            this.itemList.list.buttonGroup.clear();
            this.itemList.list.clear(false);
            for (var skills = sc.skilltree.skills, skill = null, button = null, index = 0; index < Math.floor(skills.length / 2); index++) {
                skill = skills[index];
                button = new sc.DebugSkillLearner.ItemBoxButton(skill.getName(), 136, 31, skill.id, index);
                this.itemList.list.addButton(button)
            }
        },

        _updateLearned: function (entry) {
            if (entry.data) {
                this.selfUpdate = true;
                if (sc.model.player.hasSkill(entry.data.description)) {
                    sc.model.player.unlearnSkill(entry.data.description);
                    entry.has.setText("NO")
                } else {
                    sc.model.player.learnSkill(entry.data.description, true);
                    entry.has.setText("YES")
                }
            }
        }
    });

    sc.DebugSkillLearner.ItemBoxButton = sc.ListBoxButton.extend({
        has: null,

        init: function (name, width, height, skillID, index) {
            this.parent(name, width, height, index, skillID);
            var text = sc.model.player.hasSkill(skillID) ? "YES" : "NO";
            this.has = new sc.TextGui(text, {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.has.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.has.setPos(3, 2);
            this.addChildGui(this.has)
        }
    })
});
ig.baked = !0;
