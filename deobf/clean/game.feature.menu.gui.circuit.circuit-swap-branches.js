/**
 * game.feature.menu.gui.circuit.circuit-swap-branches
 * ===================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.circuit.circuit-swap-branches")`.
 *
 * The "swap branches" mode of the circuit menu: `sc.CircuitSwapBranches`
 * places a swap button on every OR-branch of the currently available element
 * trees, which the player can click (or navigate with the gamepad cursor) to
 * switch to the other branch of that skill. `sc.CircuitSwapBranches.Button`
 * is one such button, `sc.CircuitSwapBranchesInfoBox` shows the two branch
 * options next to the hovered skill, and `.Skill` renders one option row.
 * The `SWAP_BRANCH_POSITIONS` table maps every OR-branch to its button
 * position, start UID and element.
 */
ig.module("game.feature.menu.gui.circuit.circuit-swap-branches")
    .requires("impact.feature.gui.base.basic-gui", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.circuit.circuit-detail-elements")
    .defines(function () {

    Vec2.createC(0, 0);
    Vec2.createC(0, 0);
    Vec2.createC(0, 0);
    var SWAP_SOUND = new ig.Sound("media/sound/menu/circuit/circuit-upgrade-b-2.ogg", 1);

    sc.CircuitSwapBranches = ig.GuiElementBase.extend({
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
            },
            SCALE: {
                state: {
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        buttonGroup: null,
        cursor: null,
        _gamepadActive: false,
        _lastDevice: 0,
        _cursorPos: Vec2.createC(-1E4, -1E4),
        _firstVisit: false,
        effectGuis: [],

        init: function () {
            this.parent();
            this.setSize(274, 274);
            this.setPos(sc.options.hdMode ? 147 : 103, 23);
            this.hook.pivot.x = Math.floor(137);
            this.hook.pivot.y = Math.floor(137);
            var count = SWAP_BRANCH_POSITIONS.length,
                button = null;
            this.buttonGroup = new sc.MouseButtonGroup;
            this.buttonGroup.ignoreActiveFocus = true;
            for (this.buttonGroup.onButtonTraversal = function () {
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.skillSwapFocus) {
                        sc.menu.skillSwapFocus.onButtonPress()
                    }
                }.bind(this); count--;) {
                button = SWAP_BRANCH_POSITIONS[count];
                if (sc.model.player.hasElement(button.element)) {
                    if (sc.skilltree.getSkill(button.startUID).type != sc.SKILL_STATES.OR_BRANCH_FIRST) {
                        ig.warn("Swap Skill UID is not first branch UID: " + button.startUID + " [Panel will be skipped]")
                    } else {
                        button = new sc.CircuitSwapBranches.Button(button.pos.x - 1, button.pos.y, button.startUID, button.element);
                        this.addChildGui(button);
                        this.buttonGroup.addFocusGui(button)
                    }
                }
            }
            this.cursor = new sc.CircuitSwapCursor;
            this.addChildGui(this.cursor);
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            sc.menu.skillSwapMoved = false;
            if (!ig.interact.isBlocked() && this.buttonGroup.isActive()) {
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice;
                    var cursorPos = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        cursorPos = this._cursorPos;
                        this._initCursor(cursorPos);
                        sc.menu.skillSwapCursor.x = cursorPos.x;
                        sc.menu.skillSwapCursor.y = cursorPos.y;
                        this._limitCursorPos();
                        sc.menu.resetSwapCursor();
                        this.cursor.moveTo(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
                    } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        this._cursorPos.x = sc.menu.skillSwapCursor.x;
                        this._cursorPos.y = sc.menu.skillSwapCursor.y;
                        this.cursor.unfocus()
                    }
                    sc.menu.toggledInputMode()
                }
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var moveX = 0,
                        moveY = 0,
                        axis = 0,
                        moved = false;
                    if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                        moveX = (-100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    } else if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                        moveX = (100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    }
                    if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        moveY = (-100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    } else if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                        moveY = (100 + axis * 100) * ig.system.actualTick;
                        moved = true
                    }
                    if (moved) {
                        sc.menu.skillSwapMoved = true;
                        sc.menu.skillSwapCursor.x = moveX >= 0 ? Math.floor(sc.menu.skillSwapCursor.x + moveX) : Math.ceil(sc.menu.skillSwapCursor.x + moveX);
                        sc.menu.skillSwapCursor.y = moveY >= 0 ? Math.floor(sc.menu.skillSwapCursor.y + moveY) : Math.ceil(sc.menu.skillSwapCursor.y + moveY);
                        this._limitCursorPos();
                        this.cursor.moveTo(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
                    }
                }
            }
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup);
            sc.menu.pushBackCallback(this._onBackButtonPress.bind(this));
            sc.menu.resetSwapCursor();
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            this._focusButton();
            if (sc.menu.skillStateOrigin == sc.MENU_SKILL_STATE.DETAIL_VIEW) {
                this.doStateTransition("SCALE", true);
                this.doStateTransition("DEFAULT")
            } else {
                this.doStateTransition("DEFAULT", true)
            }
        },

        exitMenu: function () {
            this.cursor.unfocus();
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            this.buttonGroup.unfocusCurrentButton();
            sc.menu.popBackCallback();
            for (var index = this.effectGuis.length; index--;) {
                this.effectGuis[index].hide();
                this.removeChildGui(this.effectGuis[index])
            }
            this.effectGuis.length = 0;
            this.doStateTransition("HIDDEN", true)
        },

        _initCursor: function (cursorPos) {
            if (cursorPos.x <= -1E4 || cursorPos.y <= -1E4) {
                cursorPos.x = Math.floor(this.hook.size.x / 2);
                cursorPos.y = Math.floor(this.hook.size.y / 2)
            }
        },

        _limitCursorPos: function () {
            var x = sc.menu.skillSwapCursor.x;
            sc.menu.skillSwapCursor.x = x.limit(0, Math.floor(this.hook.size.x));
            x = sc.menu.skillSwapCursor.y;
            sc.menu.skillSwapCursor.y = x.limit(0, this.hook.size.y)
        },

        _focusButton: function () {
            var cursorPos = this._cursorPos;
            if (this._firstVisit) {
                cursorPos.x = sc.menu.skillSwapCursor.x;
                cursorPos.y = sc.menu.skillSwapCursor.y;
                this._limitCursorPos();
                this.cursor.moveTo(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
            } else if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                this._firstVisit = true;
                this._initCursor(cursorPos);
                sc.menu.skillSwapCursor.x = cursorPos.x;
                sc.menu.skillSwapCursor.y = cursorPos.y;
                this._limitCursorPos();
                this.cursor.moveTo(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
            }
        },

        _onBackButtonPress: function () {
            sc.menu.leaveSwapBranches()
        },

        _showEffect: function (skillGui) {
            if (skillGui) {
                var display = new sc.CircuitEffectDisplay(true);
                this.addChildGui(display);
                display.show(skillGui, true, 0, true);
                this.effectGuis.push(display)
            }
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SKILL_ENTER_SWAP_BRANCHES) {
                    this.showMenu()
                } else if (event == sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES) {
                    this.exitMenu()
                } else if (event == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                    this.buttonGroup.isActive() && this.cursor.resetFocusTimer()
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_FOCUS) {
                    this.buttonGroup.isActive() && this.cursor.focusOnNode(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_UNFOCUS) {
                    this.buttonGroup.isActive() && this.cursor.unfocus()
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_ENSURE) {
                    this.buttonGroup.isActive() && (this.cursor.focus || this.cursor.focusOnNode(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y))
                } else if (event == sc.MENU_EVENT.SKILL_SHOW_EFFECT_SWAP) {
                    this._showEffect(data)
                }
            }
        }
    });

    var MOUSE_OVER_RADIUS = Math.floor(22.5);

    sc.CircuitSwapBranches.Button = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        submitSound: null,
        blockedSound: null,
        startUID: -1,
        element: -1,

        init: function (x, y, startUID, element) {
            this.parent();
            this.setSize(45, 45);
            this.setPos(x, y);
            this.startUID = startUID || -1;
            this.element = element || 0;
            this.submitSound = SWAP_SOUND;
            this.blockedSound = sc.BUTTON_SOUND.denied
        },

        updateDrawables: function () {
            if (sc.menu.skillState != sc.MENU_SKILL_STATE.SWAP_BRANCHES) {
                return false
            }
        },

        onButtonPress: function () {
            if (ig.interact.isBlocked()) {
                return false
            }
            if (this.startUID < 0) {
                ig.warn("skill UID is not valid: " + this.startUID)
            } else {
                for (var isOrFirst = sc.skilltree.getSkill(this.startUID).type == sc.SKILL_STATES.OR_BRANCH_FIRST, canSwitch = false, index = 0; index < 6; index++) {
                    if (sc.model.player.hasSkill(this.startUID + index)) {
                        canSwitch = true;
                        break
                    }
                }
                var switchStart = -1;
                if (sc.model.player.hasSkill(this.startUID)) {
                    switchStart = this.startUID + 1;
                    isOrFirst = false
                } else {
                    sc.model.player.hasSkill(this.startUID + 1) ? switchStart = this.startUID : canSwitch = false
                }
                if (canSwitch && switchStart >= 0) {
                    this.submitSound && this.submitSound.play();
                    sc.model.player.switchBranch(switchStart, isOrFirst);
                    if (window.IG_GAME_DEBUG) {
                        console.groupCollapsed("%cSwitched Branch: ", "color:#00CC00");
                        console.groupCollapsed("%cNew BranchIndices: %c[%i, %i, %i]", "color:#00CC00", "", switchStart, switchStart + 2, switchStart + 4);
                        for (index = 0; index < 3; index++) {
                            ig.log("%c [%i]: %c" + sc.skilltree.getSkill(switchStart + index * 2).getName(), "color:#00CC00", switchStart + index * 2, "")
                        }
                        console.groupEnd();
                        switchStart = switchStart + (isOrFirst ? 1 : -1);
                        console.groupCollapsed("%cOld BranchIndices: %c[%i, %i, %i]", "color:#00CC00", "", switchStart, switchStart + 2, switchStart + 4);
                        for (index = 0; index < 3; index++) {
                            ig.log("%c [%i]: %c" + sc.skilltree.getSkill(switchStart + index * 2).getName(), "color:#00CC00", switchStart + index * 2, "")
                        }
                        console.groupEnd();
                        console.groupEnd()
                    }
                    sc.menu.showSwapSkillEffect(this)
                } else {
                    this.blockedSound && this.blockedSound.play()
                }
            }
        },

        isMouseOver: function () {
            if (ig.interact.isBlocked() || sc.menu.skillState != sc.MENU_SKILL_STATE.SWAP_BRANCHES) {
                return false
            }
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                var distance = this.getDistanceToCursor();
                if (sc.menu.skillSwapMoved) {
                    sc.menu.unfocusSwapCursor(this);
                    return false
                }
                if (distance <= 16) {
                    sc.menu.focusSwapCursor(this.hook.pos.x + 22, this.hook.pos.y + 22, this);
                    return true
                }
                sc.menu.unfocusSwapCursor(this)
            } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                var screenX = Math.floor(this.hook.screenCoords.x),
                    screenY = Math.floor(this.hook.screenCoords.y),
                    mouseX = Math.floor(sc.control.getMouseX()),
                    mouseY = Math.floor(sc.control.getMouseY());
                var isOver = Math.abs(mouseX - (MOUSE_OVER_RADIUS + screenX)) + Math.abs(mouseY - (MOUSE_OVER_RADIUS + screenY)) <= MOUSE_OVER_RADIUS;
                isOver ? sc.menu.focusSwapCursor(this.hook.pos.x + 22, this.hook.pos.y + 22, this) : sc.menu.unfocusSwapCursor(this);
                return isOver
            }
            return false
        },

        getDistanceToCursor: function () {
            return Math.floor(Vec2.distanceC(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y, this.hook.pos.x + Math.floor(this.hook.size.x / 2), this.hook.pos.y + Math.floor(this.hook.size.y / 2)))
        }
    });

    sc.CircuitSwapBranchesInfoBox = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 1,
                    scaleY: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/menu.png"),
        buttonGroup: null,
        currentFocus: null,
        leftContent: null,
        rightContent: null,
        arrow: null,
        branches: {
            left: [null, null, null],
            right: [null, null, null]
        },
        _scrollHook: null,
        delta: Vec2.createC(-1, -1),

        init: function (buttonGroup) {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(5, 0);
            this.setSize(150, 209);
            this.setPivot(0, 104.5);
            this.hook.invisibleUpdate = true;
            this.buttonGroup = buttonGroup;
            this.leftContent = new sc.MenuPanel(sc.MenuPanelType.BOTTOM_LEFT_EDGE);
            this.leftContent.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 75
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.leftContent.setSize(150, 77);
            this.leftContent.doStateTransition("HIDDEN", true);
            this.addChildGui(this.leftContent);
            this.leftContent.annotation = {
                content: {
                    title: "sc.gui.menu.help.circuit.titles.branch",
                    description: "sc.gui.menu.help.circuit.description.branch"
                },
                offset: {
                    x: 0,
                    y: -1
                },
                size: {
                    x: 150,
                    y: 77
                },
                index: {
                    x: 1,
                    y: 1
                }
            };
            this.rightContent = new sc.MenuPanel(sc.MenuPanelType.TOP_LEFT_EDGE);
            this.rightContent.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 75
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.rightContent.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.rightContent.setSize(150, 77);
            this.rightContent.doStateTransition("HIDDEN", true);
            this.addChildGui(this.rightContent);
            this.rightContent.annotation = {
                content: {
                    title: "sc.gui.menu.help.circuit.titles.branch",
                    description: "sc.gui.menu.help.circuit.description.branch"
                },
                offset: {
                    x: 0,
                    y: -1
                },
                size: {
                    x: 150,
                    y: 77
                },
                index: {
                    x: 1,
                    y: 0
                }
            };
            this.arrow = new ig.ImageGui(this.gfx, 576, 224, 23, 20);
            this.arrow.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.arrow.hook.transitions = {
                DOWN: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                DOWN_INACTIVE: {
                    state: {},
                    time: 0.05,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                UP: {
                    state: {
                        angle: Math.PI
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                UP_INACTIVE: {
                    state: {
                        angle: Math.PI
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        angle: -Math.PI / 2
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.arrow.doStateTransition("HIDDEN", true);
            this.addChildGui(this.arrow);
            for (var posY = 2, index = 0; index < 3; index++) {
                this.branches.left[index] = new sc.CircuitSwapBranchesInfoBox.Skill;
                this.branches.left[index].setPos(0, posY);
                this.branches.right[index] = new sc.CircuitSwapBranchesInfoBox.Skill;
                this.branches.right[index].setPos(0, posY);
                this.leftContent.addChildGui(this.branches.left[index]);
                this.rightContent.addChildGui(this.branches.right[index]);
                posY = posY + 24
            }
            this.doStateTransition("DEFAULT", true)
        },

        setContent: function (clear) {
            this.currentFocus = sc.menu.skillSwapFocus;
            if (!this.currentFocus || clear) {
                var state = "UP_INACTIVE";
                this.arrow.hook.currentStateName == "DOWN" && (state = "DOWN_INACTIVE");
                this.arrow.doStateTransition(state, false, false, function () {
                    for (var index = 0; index < 3; index++) {
                        this.branches.left[index].setContent(null, -1, false, 0.05);
                        this.branches.right[index].setContent(null, -1, false, 0.05)
                    }
                    this.arrow.offsetY = 245
                }.bind(this), 0.05)
            } else {
                this.arrow.hook.stateCallback = null;
                var startUID = this.currentFocus.startUID,
                    player = sc.model.player;
                sc.skilltree.getSkill(startUID);
                var skill = null,
                    index = 0,
                    left = this.branches.left,
                    right = this.branches.right,
                    isCurrent = player.hasSkill(startUID) ? true : false,
                    isEnabled = false;
                if (!player.hasSkill(startUID) && !player.hasSkill(startUID + 1)) {
                    this.arrow.offsetY = 245;
                    isCurrent = true
                } else {
                    this.arrow.offsetY = 224;
                    isEnabled = true
                }
                for (player = 0; player < 6; player = player + 2) {
                    skill = sc.skilltree.getSkill(startUID + player);
                    left[index].setContent(skill, startUID + player, isCurrent, isEnabled);
                    skill = sc.skilltree.getSkill(startUID + (player + 1));
                    right[index].setContent(skill, startUID + (player + 1), !isCurrent, isEnabled);
                    index++
                }
                this.arrow.doStateTransition(!isCurrent ? "UP" : "DOWN");
                this.doStateTransition("DEFAULT")
            }
        },

        showMenu: function () {
            this.setContent();
            this.leftContent.doStateTransition("DEFAULT");
            this.rightContent.doStateTransition("DEFAULT");
            this.arrow.doStateTransition("DOWN")
        },

        hideMenu: function () {
            this.leftContent.doStateTransition("HIDDEN");
            this.rightContent.doStateTransition("HIDDEN");
            this.arrow.doStateTransition("HIDDEN")
        },

        modelChanged: function (menu, event) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SKILL_ENTER_SWAP_BRANCHES) {
                    this.showMenu()
                } else if (event == sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES) {
                    this.hideMenu()
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_FOCUS) {
                    this.buttonGroup.isActive() && this.setContent()
                } else if (event == sc.MENU_EVENT.SKILL_SWAP_UNFOCUS) {
                    this.buttonGroup.isActive() && this.setContent(true)
                }
            } else if (menu == sc.model.player && this.buttonGroup.isActive() && event == sc.PLAYER_MSG.SKILL_BRANCH_SWAP) {
                this.setContent()
            }
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.model.menu, this);
            sc.Model.removeObserver(sc.model.player, this)
        }
    });

    sc.CircuitSwapBranchesInfoBox.Skill = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HALF: {
                state: {
                    alpha: 0.5
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
        icons: new ig.Image("media/gui/circuit-icons.png"),
        text: null,
        skill: -1,

        init: function () {
            this.parent();
            this.setSize(150, 25);
            this.text = new sc.TextGui("\\c[4]---------------\\c[0]");
            this.text.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 10
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.text.setPos(32, 4);
            this.addChildGui(this.text)
        },

        setContent: function (skill, skillID, isCurrent, isEnabled) {
            this.skill = skillID;
            var name = skill ? skill.getName() : "\\c[4]---------------\\c[0]";
            sc.model.player.hasSkill(skillID) ? skill instanceof sc.SpecialSkill ? name = "\\c[3]" + name + "\\c[0]" : skill || (name = "\\c[4]---------------\\c[0]") : name = isEnabled && skill instanceof sc.SpecialSkill ? "\\c[3]" + name + "\\c[0]" : "\\c[4]" + name + "\\c[0]";
            this.text.setText(name);
            skill ? this.doStateTransition(isCurrent ? "DEFAULT" : "HALF") : this.doStateTransition("HALF", true)
        },

        updateDrawables: function (drawables) {
            var icon = 3;
            if (this.skill >= 0) {
                icon = sc.skilltree.getSkill(this.skill).icon
            }
            drawables.addGfx(this.icons, 4, 0, icon % 10 * 24, Math.floor(icon / 10) * 24, 24, 24)
        }
    });

    var SWAP_BRANCH_POSITIONS = [{
        element: sc.ELEMENT.COLD,
        pos: {
            x: 115,
            y: 0
        },
        startUID: 184
    }, {
        element: sc.ELEMENT.COLD,
        pos: {
            x: 92,
            y: 23
        },
        startUID: 159
    }, {
        element: sc.ELEMENT.COLD,
        pos: {
            x: 138,
            y: 23
        },
        startUID: 214
    }, {
        element: sc.ELEMENT.COLD,
        pos: {
            x: 69,
            y: 46
        },
        startUID: 150
    }, {
        element: sc.ELEMENT.COLD,
        pos: {
            x: 115,
            y: 46
        },
        startUID: 178
    }, {
        element: sc.ELEMENT.COLD,
        pos: {
            x: 161,
            y: 46
        },
        startUID: 205
    }, {
        element: sc.ELEMENT.COLD,
        pos: {
            x: 92,
            y: 69
        },
        startUID: 143
    }, {
        element: sc.ELEMENT.COLD,
        pos: {
            x: 138,
            y: 69
        },
        startUID: 198
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 0,
            y: 115
        },
        startUID: 358
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 23,
            y: 92
        },
        startUID: 388
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 23,
            y: 138
        },
        startUID: 333
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 46,
            y: 69
        },
        startUID: 379
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 46,
            y: 115
        },
        startUID: 352
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 46,
            y: 161
        },
        startUID: 324
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 69,
            y: 92
        },
        startUID: 372
    }, {
        element: sc.ELEMENT.WAVE,
        pos: {
            x: 69,
            y: 138
        },
        startUID: 317
    }, {
        element: sc.ELEMENT.NEUTRAL,
        pos: {
            x: 115,
            y: 92
        },
        startUID: 3
    }, {
        element: sc.ELEMENT.NEUTRAL,
        pos: {
            x: 115,
            y: 138
        },
        startUID: 29
    }, {
        element: sc.ELEMENT.NEUTRAL,
        pos: {
            x: 92,
            y: 115
        },
        startUID: 42
    }, {
        element: sc.ELEMENT.NEUTRAL,
        pos: {
            x: 138,
            y: 115
        },
        startUID: 16
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 115,
            y: 230
        },
        startUID: 97
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 92,
            y: 207
        },
        startUID: 127
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 138,
            y: 207
        },
        startUID: 72
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 69,
            y: 184
        },
        startUID: 118
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 115,
            y: 184
        },
        startUID: 91
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 161,
            y: 184
        },
        startUID: 63
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 92,
            y: 161
        },
        startUID: 111
    }, {
        element: sc.ELEMENT.HEAT,
        pos: {
            x: 138,
            y: 161
        },
        startUID: 56
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 230,
            y: 115
        },
        startUID: 271
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 207,
            y: 92
        },
        startUID: 246
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 207,
            y: 138
        },
        startUID: 301
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 184,
            y: 69
        },
        startUID: 237
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 184,
            y: 115
        },
        startUID: 265
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 184,
            y: 161
        },
        startUID: 292
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 161,
            y: 92
        },
        startUID: 230
    }, {
        element: sc.ELEMENT.SHOCK,
        pos: {
            x: 161,
            y: 138
        },
        startUID: 285
    }]
});
ig.baked = !0;
