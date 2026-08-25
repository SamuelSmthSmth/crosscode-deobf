ig.module("game.feature.menu.gui.circuit.circuit-swap-branches").requires("impact.feature.gui.base.basic-gui", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.circuit.circuit-detail-elements").defines(function() {
    Vec2.createC(0, 0);
    Vec2.createC(0, 0);
    Vec2.createC(0, 0);
    var b = new ig.Sound("media/sound/menu/circuit/circuit-upgrade-b-2.ogg", 1);
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
        init: function() {
            this.parent();
            this.setSize(274, 274);
            this.setPos(sc.options.hdMode ? 147 : 103, 23);
            this.hook.pivot.x = Math.floor(137);
            this.hook.pivot.y = Math.floor(137);
            var a = d.length,
                b = null,
                b = null;
            this.buttonGroup = new sc.MouseButtonGroup;
            this.buttonGroup.ignoreActiveFocus =
                true;
            for (this.buttonGroup.onButtonTraversal = function() {
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.skillSwapFocus) sc.menu.skillSwapFocus.onButtonPress()
                }.bind(this); a--;) {
                b = d[a];
                if (sc.model.player.hasElement(b.element))
                    if (sc.skilltree.getSkill(b.startUID).type != sc.SKILL_STATES.OR_BRANCH_FIRST) ig.warn("Swap Skill UID is not first branch UID: " + b.startUID + " [Panel will be skipped]");
                    else {
                        b = new sc.CircuitSwapBranches.Button(b.pos.x - 1, b.pos.y, b.startUID, b.element);
                        this.addChildGui(b);
                        this.buttonGroup.addFocusGui(b)
                    }
            }
            this.cursor = new sc.CircuitSwapCursor;
            this.addChildGui(this.cursor);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            sc.menu.skillSwapMoved = false;
            if (!ig.interact.isBlocked() && this.buttonGroup.isActive()) {
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice;
                    var a = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        a = this._cursorPos;
                        this._initCursor(a);
                        sc.menu.skillSwapCursor.x = a.x;
                        sc.menu.skillSwapCursor.y = a.y;
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
                    var b = a = 0,
                        d = 0,
                        g = false;
                    if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) <
                        -0.5) {
                        a = (-100 + d * 100) * ig.system.actualTick;
                        g = true
                    } else if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                        a = (100 + d * 100) * ig.system.actualTick;
                        g = true
                    }
                    if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        b = (-100 + d * 100) * ig.system.actualTick;
                        g = true
                    } else if ((d = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                        b = (100 + d * 100) * ig.system.actualTick;
                        g = true
                    }
                    if (g) {
                        sc.menu.skillSwapMoved = true;
                        sc.menu.skillSwapCursor.x = a >= 0 ? Math.floor(sc.menu.skillSwapCursor.x + a) : Math.ceil(sc.menu.skillSwapCursor.x +
                            a);
                        sc.menu.skillSwapCursor.y = b >= 0 ? Math.floor(sc.menu.skillSwapCursor.y + b) : Math.ceil(sc.menu.skillSwapCursor.y + b);
                        this._limitCursorPos();
                        this.cursor.moveTo(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
                    }
                }
            }
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
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
            } else this.doStateTransition("DEFAULT", true)
        },
        exitMenu: function() {
            this.cursor.unfocus();
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            this.buttonGroup.unfocusCurrentButton();
            sc.menu.popBackCallback();
            for (var a = this.effectGuis.length; a--;) {
                this.effectGuis[a].hide();
                this.removeChildGui(this.effectGuis[a])
            }
            this.effectGuis.length = 0;
            this.doStateTransition("HIDDEN", true)
        },
        _initCursor: function(a) {
            if (a.x <= -1E4 || a.y <= -1E4) {
                a.x = Math.floor(this.hook.size.x / 2);
                a.y = Math.floor(this.hook.size.y / 2)
            }
        },
        _limitCursorPos: function() {
            var a = sc.menu.skillSwapCursor.x;
            sc.menu.skillSwapCursor.x = a.limit(0, Math.floor(this.hook.size.x));
            a = sc.menu.skillSwapCursor.y;
            sc.menu.skillSwapCursor.y = a.limit(0, this.hook.size.y)
        },
        _focusButton: function() {
            if (this._firstVisit) {
                var a =
                    this._cursorPos;
                a.x = sc.menu.skillSwapCursor.x;
                a.y = sc.menu.skillSwapCursor.y;
                this._limitCursorPos();
                this.cursor.moveTo(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
            } else if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                this._firstVisit = true;
                a = this._cursorPos;
                this._initCursor(a);
                sc.menu.skillSwapCursor.x = a.x;
                sc.menu.skillSwapCursor.y = a.y;
                this._limitCursorPos();
                this.cursor.moveTo(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)
            }
        },
        _onBackButtonPress: function() {
            sc.menu.leaveSwapBranches()
        },
        _showEffect: function(a) {
            if (a) {
                var b = new sc.CircuitEffectDisplay(true);
                this.addChildGui(b);
                b.show(a, true, 0, true);
                this.effectGuis.push(b)
            }
        },
        modelChanged: function(a, b, d) {
            a == sc.menu && (b == sc.MENU_EVENT.SKILL_ENTER_SWAP_BRANCHES ? this.showMenu() : b == sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES ? this.exitMenu() : b == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE ? this.buttonGroup.isActive() && this.cursor.resetFocusTimer() : b == sc.MENU_EVENT.SKILL_SWAP_FOCUS ? this.buttonGroup.isActive() && this.cursor.focusOnNode(sc.menu.skillSwapCursor.x,
                sc.menu.skillSwapCursor.y) : b == sc.MENU_EVENT.SKILL_SWAP_UNFOCUS ? this.buttonGroup.isActive() && this.cursor.unfocus() : b == sc.MENU_EVENT.SKILL_SWAP_ENSURE ? this.buttonGroup.isActive() && (this.cursor.focus || this.cursor.focusOnNode(sc.menu.skillSwapCursor.x, sc.menu.skillSwapCursor.y)) : b == sc.MENU_EVENT.SKILL_SHOW_EFFECT_SWAP && this._showEffect(d))
        }
    });
    var a = Math.floor(22.5);
    sc.CircuitSwapBranches.Button = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        submitSound: null,
        blockedSound: null,
        startUID: -1,
        element: -1,
        init: function(a, d, f, g) {
            this.parent();
            this.setSize(45, 45);
            this.setPos(a, d);
            this.startUID = f || -1;
            this.element = g || 0;
            this.submitSound = b;
            this.blockedSound = sc.BUTTON_SOUND.denied
        },
        updateDrawables: function() {
            if (sc.menu.skillState != sc.MENU_SKILL_STATE.SWAP_BRANCHES) return false
        },
        onButtonPress: function() {
            if (ig.interact.isBlocked()) return false;
            if (this.startUID < 0) ig.warn("skill UID is not valid: " + this.startUID);
            else {
                for (var a = sc.skilltree.getSkill(this.startUID).type == sc.SKILL_STATES.OR_BRANCH_FIRST,
                        b = false, d = 0; d < 6; d++)
                    if (sc.model.player.hasSkill(this.startUID + d)) {
                        b = true;
                        break
                    } var g = -1;
                if (sc.model.player.hasSkill(this.startUID)) {
                    g = this.startUID + 1;
                    a = false
                } else sc.model.player.hasSkill(this.startUID + 1) ? g = this.startUID : b = false;
                if (b && g >= 0) {
                    this.submitSound && this.submitSound.play();
                    sc.model.player.switchBranch(g, a);
                    if (window.IG_GAME_DEBUG) {
                        console.groupCollapsed("%cSwitched Branch: ", "color:#00CC00");
                        console.groupCollapsed("%cNew BranchIndices: %c[%i, %i, %i]", "color:#00CC00", "", g, g + 2, g + 4);
                        for (d =
                            0; d < 3; d++) ig.log("%c [%i]: %c" + sc.skilltree.getSkill(g + d * 2).getName(), "color:#00CC00", g + d * 2, "");
                        console.groupEnd();
                        g = g + (a ? 1 : -1);
                        console.groupCollapsed("%cOld BranchIndices: %c[%i, %i, %i]", "color:#00CC00", "", g, g + 2, g + 4);
                        for (d = 0; d < 3; d++) ig.log("%c [%i]: %c" + sc.skilltree.getSkill(g + d * 2).getName(), "color:#00CC00", g + d * 2, "");
                        console.groupEnd();
                        console.groupEnd()
                    }
                    sc.menu.showSwapSkillEffect(this)
                } else this.blockedSound && this.blockedSound.play()
            }
        },
        isMouseOver: function() {
            if (ig.interact.isBlocked() || sc.menu.skillState !=
                sc.MENU_SKILL_STATE.SWAP_BRANCHES) return false;
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                var b = this.getDistanceToCursor();
                if (sc.menu.skillSwapMoved) {
                    sc.menu.unfocusSwapCursor(this);
                    return false
                }
                if (b <= 16) {
                    sc.menu.focusSwapCursor(this.hook.pos.x + 22, this.hook.pos.y + 22, this);
                    return true
                }
                sc.menu.unfocusSwapCursor(this)
            } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                var b = Math.floor(this.hook.screenCoords.x),
                    d = Math.floor(this.hook.screenCoords.y),
                    f = Math.floor(sc.control.getMouseX()),
                    g = Math.floor(sc.control.getMouseY());
                (b = Math.abs(f - (a + b)) + Math.abs(g - (a + d)) <= a) ? sc.menu.focusSwapCursor(this.hook.pos.x + 22, this.hook.pos.y + 22, this): sc.menu.unfocusSwapCursor(this);
                return b
            }
            return false
        },
        getDistanceToCursor: function() {
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
        init: function(a) {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.setPos(5, 0);
            this.setSize(150, 209);
            this.setPivot(0, 104.5);
            this.hook.invisibleUpdate = true;
            this.buttonGroup = a;
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
            this.rightContent.doStateTransition("HIDDEN",
                true);
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
            for (var a = 2, b = 0; b < 3; b++) {
                this.branches.left[b] = new sc.CircuitSwapBranchesInfoBox.Skill;
                this.branches.left[b].setPos(0, a);
                this.branches.right[b] = new sc.CircuitSwapBranchesInfoBox.Skill;
                this.branches.right[b].setPos(0, a);
                this.leftContent.addChildGui(this.branches.left[b]);
                this.rightContent.addChildGui(this.branches.right[b]);
                a = a + 24
            }
            this.doStateTransition("DEFAULT", true)
        },
        setContent: function(a) {
            this.currentFocus = sc.menu.skillSwapFocus;
            if (!this.currentFocus || a) {
                a = "UP_INACTIVE";
                this.arrow.hook.currentStateName == "DOWN" && (a = "DOWN_INACTIVE");
                this.arrow.doStateTransition(a, false, false, function() {
                    for (var a = 0; a < 3; a++) {
                        this.branches.left[a].setContent(null, -1, false, 0.05);
                        this.branches.right[a].setContent(null,
                            -1, false, 0.05)
                    }
                    this.arrow.offsetY = 245
                }.bind(this), 0.05)
            } else {
                this.arrow.hook.stateCallback = null;
                var a = this.currentFocus.startUID,
                    b = sc.model.player;
                sc.skilltree.getSkill(a);
                var d = null,
                    g = 0,
                    h = this.branches.left,
                    i = this.branches.right,
                    j = b.hasSkill(a) ? true : false,
                    k = false;
                if (!b.hasSkill(a) && !b.hasSkill(a + 1)) {
                    this.arrow.offsetY = 245;
                    j = true
                } else {
                    this.arrow.offsetY = 224;
                    k = true
                }
                for (b = 0; b < 6; b = b + 2) {
                    d = sc.skilltree.getSkill(a + b);
                    h[g].setContent(d, a + b, j, k);
                    d = sc.skilltree.getSkill(a + (b + 1));
                    i[g].setContent(d, a + (b + 1),
                        !j, k);
                    g++
                }
                this.arrow.doStateTransition(!j ? "UP" : "DOWN");
                this.doStateTransition("DEFAULT")
            }
        },
        showMenu: function() {
            this.setContent();
            this.leftContent.doStateTransition("DEFAULT");
            this.rightContent.doStateTransition("DEFAULT");
            this.arrow.doStateTransition("DOWN")
        },
        hideMenu: function() {
            this.leftContent.doStateTransition("HIDDEN");
            this.rightContent.doStateTransition("HIDDEN");
            this.arrow.doStateTransition("HIDDEN")
        },
        modelChanged: function(a, b) {
            a == sc.menu ? b == sc.MENU_EVENT.SKILL_ENTER_SWAP_BRANCHES ? this.showMenu() :
                b == sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES ? this.hideMenu() : b == sc.MENU_EVENT.SKILL_SWAP_FOCUS ? this.buttonGroup.isActive() && this.setContent() : b == sc.MENU_EVENT.SKILL_SWAP_UNFOCUS && this.buttonGroup.isActive() && this.setContent(true) : a == sc.model.player && this.buttonGroup.isActive() && b == sc.PLAYER_MSG.SKILL_BRANCH_SWAP && this.setContent()
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            sc.Model.removeObserver(sc.model.player,
                this)
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
        init: function() {
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
        setContent: function(a, b, d, g) {
            this.skill = b;
            var h = a ? a.getName() : "\\c[4]---------------\\c[0]";
            sc.model.player.hasSkill(b) ? a instanceof sc.SpecialSkill ? h = "\\c[3]" + h + "\\c[0]" : a || (h = "\\c[4]---------------\\c[0]") : h = g && a instanceof sc.SpecialSkill ? "\\c[3]" + h + "\\c[0]" : "\\c[4]" + h + "\\c[0]";
            this.text.setText(h);
            a ? this.doStateTransition(d ? "DEFAULT" :
                "HALF") : this.doStateTransition("HALF", true)
        },
        updateDrawables: function(a) {
            var b = 3;
            if (this.skill >= 0) b = sc.skilltree.getSkill(this.skill).icon;
            a.addGfx(this.icons, 4, 0, b % 10 * 24, Math.floor(b / 10) * 24, 24, 24)
        }
    });
    var d = [{
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
