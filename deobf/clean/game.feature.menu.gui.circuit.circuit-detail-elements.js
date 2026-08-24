/**
 * game.feature.menu.gui.circuit.circuit-detail-elements
 * =====================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.circuit.circuit-detail-elements")`.
 *
 * The building blocks of the skill-tree detail view: `sc.CiruitCursor` (the
 * gamepad focus cursor), `sc.CircuitNodeMenu` (the activate/cancel popup on a
 * hovered node, with branch-switching and skill-chain logic),
 * `sc.CircuitInfoBox` (the skill info box that follows the cursor),
 * `sc.CircuitDetailButtonGroup` (button traversal for the detail view) and
 * the `DISPLAY_TIME_CONFIG` table for the info box's show/hide timings.
 */
ig.module("game.feature.menu.gui.circuit.circuit-detail-elements")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.interact", "game.feature.font.font-system", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.menu-misc", "game.feature.model.options-model", "game.feature.skills.skills")
    .defines(function () {

    var DISPLAY_TIME_CONFIG = [];
    DISPLAY_TIME_CONFIG[sc.CIRCUIT_MENU_DISPLAY_TIME.SHORT] = {
        hideDelay: 0.05,
        midDelay: 0.05,
        showDuration: 0.1,
        hideDuration: 0.1,
        noInterrupt: true
    };
    DISPLAY_TIME_CONFIG[sc.CIRCUIT_MENU_DISPLAY_TIME.LONG] = {
        hideDelay: 0.3,
        midDelay: 0.2,
        showDuration: 0.2,
        hideDuration: 0.2,
        noInterrupt: true
    };

    sc.CiruitCursor = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        focus: false,
        _focusTimer: 0,
        _focusTime: 0,
        _focusOffset: 0,
        _lastDevice: 0,
        _gamepadActive: false,

        init: function () {
            this.parent();
            this.setSize(31, 31)
        },

        focusOnNode: function (x, y) {
            this.setPos(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2));
            this.focus = true;
            this._focusTimer = 0;
            this._focusTime = 0.2;
            this._focusOffset = 0
        },

        unfocus: function () {
            this.focus = false;
            this._focusTime = this._focusTimer = 0.2;
            this._focusOffset = 0
        },

        moveTo: function (x, y, animate, time) {
            animate != void 0 && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.doPosTranstition(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2), time, KEY_SPLINES.EASE) : this.setPos(x - Math.floor(this.hook.size.x / 2), y - Math.floor(this.hook.size.y / 2));
            if (this.focus) {
                this._focusTimer = 0;
                this._focusTime = 0.2;
                this._focusOffset = 3;
                this.focus = false
            }
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        update: function () {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            if (this._focusTimer < this._focusTime) {
                this._focusTimer = this._focusTimer + ig.system.actualTick;
                if (this._focusTimer >= this._focusTime) {
                    this._focusTimer = this._focusTime;
                    this._focusOffset = this.focus ? 3 : 0
                } else {
                    this._focusOffset = (this._focusTime ? 1 : -1) * (this._focusTimer / this._focusTime) * 3
                }
            }
        },

        updateDrawables: function (drawables) {
            if (this._gamepadActive || this.focus) {
                drawables.addGfx(this.gfx, 3 - this._focusOffset, 3 - this._focusOffset, 36, 116, 12, 12);
                drawables.addGfx(this.gfx, 16 + this._focusOffset, 3 - this._focusOffset, 48, 116, 12, 12);
                drawables.addGfx(this.gfx, 3 - this._focusOffset, 16 + this._focusOffset, 36, 128, 12, 12);
                drawables.addGfx(this.gfx, 16 + this._focusOffset, 16 + this._focusOffset, 48, 128, 12, 12)
            }
        },

        modelChanged: function (menu, event) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SKILL_TREE_SELECT) {
                    this.unfocus();
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        this._gamepadActive = true
                    }
                } else if (event == sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE) {
                    this.focusOnNode(sc.menu.skillCursor.x, sc.menu.skillCursor.y)
                } else if (event == sc.MENU_EVENT.SKILL_CURSOR_UNFOCUS_NODE) {
                    this.unfocus()
                } else if (event == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                    this._focusTime = this._focusTimer = 0.2;
                    this._focusOffset = 0
                } else if (event == sc.MENU_EVENT.SKILL_ENSURE_GAMEPAD_FOCUS) {
                    this.focus || this.focusOnNode(sc.menu.skillCursor.x, sc.menu.skillCursor.y)
                }
            }
        }
    });

    var tmpCursor = Vec2.createC(0, 0),
        tmpSize = Vec2.createC(0, 0),
        tmpTarget = Vec2.createC(0, 0);

    sc.CIRCUIT_NODE_MENU_MODE = {
        ACTIVATE: 0,
        SWAP: 1
    };

    sc.CircuitNodeMenu = sc.MenuPanel.extend({
        ninepatch: new ig.NinePatch("media/gui/circuit.png", {
            width: 5,
            height: 5,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "top-left": {
                    x: 32,
                    y: 176
                },
                "top-right": {
                    x: 48,
                    y: 176
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    scaleX: 1,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        activateSound: new ig.Sound("media/sound/menu/circuit/circuit-upgrade-b-2.ogg", 1),
        cost: null,
        costNumber: null,
        costCP: null,
        activate: null,
        cancel: null,
        buttonGroup: null,
        mode: sc.CIRCUIT_NODE_MENU_MODE.ACTIVATE,
        delta: Vec2.createC(-1, -1),
        _scrollHook: null,
        _currentFocusGui: null,
        _maxOrSkillStep: 0,
        _chainMode: false,

        init: function (scrollHook) {
            this.parent();
            this.setSize(100, 63);
            this._scrollHook = scrollHook;
            this.hook.invisibleUpdate = true;
            this.hook.setMouseRecord(true);
            this.buttonGroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.cost = new sc.TextGui(ig.lang.get("sc.gui.menu.skill.cost"), {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.cost.setPos(6, 2);
            this.addChildGui(this.cost);
            this.costCP = new sc.TextGui("cp", {
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            this.costCP.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.costCP.setPos(6, 2);
            this.costCP.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.costCP);
            this.costNumber = new sc.NumberGui(444, {
                transitionTime: 0,
                size: sc.NUMBER_SIZE.TEXT
            });
            this.costNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.costNumber.setPos(this.costCP.hook.size.x + 6, 6);
            this.costNumber.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.costNumber);
            this.activate = new sc.ButtonGui(ig.lang.get("sc.gui.menu.skill.activate"), 96, true, sc.BUTTON_TYPE.ITEM);
            this.activate.setPos(1, 21);
            this.activate.submitSound = null;
            this.activate.onButtonPress = this._onActivatePress.bind(this);
            this.addChildGui(this.activate);
            this.cancel = new sc.ButtonGui(ig.lang.get("sc.gui.menu.skill.cancel"), 96, true, sc.BUTTON_TYPE.ITEM);
            this.cancel.setPos(1, 41);
            this.cancel.onButtonPress = this._onCancelPress.bind(this);
            this.addChildGui(this.cancel);
            this.buttonGroup.addFocusGui(this.activate, 0, 0);
            this.buttonGroup.addFocusGui(this.cancel, 0, 1);
            this._addLine(1, 19, 98, 1);
            this._addLine(1, 61, 98, 1);
            this._addLine(98, 20, 1, 7);
            this._addLine(98, 36, 1, 25);
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        update: function () {
            this._updatePos()
        },

        updateDrawables: function (drawables) {
            this.parent(drawables);
            drawables.addGfx(this.ninepatch.gfx, 99, 26, 32, 148, 12, 13)
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SKILL_NODE_SELECT) {
                    this._enterNodeMenu(data)
                } else if (event == sc.MENU_EVENT.SKILL_NODE_EXIT) {
                    this._exitNodeMenu()
                } else if (event == sc.MENU_EVENT.SKILL_TREE_SELECT && this.hook.currentStateName == "DEFAULT") {
                    this._exitNodeMenu()
                }
            }
        },

        _onActivatePress: function () {
            if (this._currentFocusGui) {
                var isBranch = this._currentFocusGui.branchSkill ? true : false,
                    focusGui = this._currentFocusGui,
                    parentGui = this._currentFocusGui.parentGui ? this._currentFocusGui.parentGui : null,
                    skillUID = this._currentFocusGui.skill.uid;
                sc.skilltree.getSkill(skillUID);
                if (sc.skilltree.skills[skillUID]) {
                    if (isBranch) {
                        isBranch = false;
                        focusGui.orLeft ? sc.model.player.hasSkill(skillUID + 1) && (isBranch = true) : sc.model.player.hasSkill(skillUID - 1) && (isBranch = true);
                        if (isBranch) {
                            this.activateSound.play();
                            sc.model.player.switchBranch(skillUID - focusGui.orBranchIndex * 2, focusGui.orLeft);
                            this._showEffectOnBranch(this._currentFocusGui)
                        } else {
                            isBranch = false;
                            focusGui.orBranchIndex > 0 ? parentGui.orLeft ? sc.model.player.hasSkill(parentGui.skill.uid + 1) && (isBranch = true) : sc.model.player.hasSkill(parentGui.skill.uid - 1) && (isBranch = true) : isBranch = false;
                            if (sc.model.player.hasSkillPoints(skillUID)) {
                                if (isBranch) {
                                    this.activateSound.play();
                                    sc.model.player.switchBranch(skillUID - focusGui.orBranchIndex * 2, focusGui.orLeft, skillUID);
                                    this._showEffectOnBranch(this._currentFocusGui)
                                } else if (this._chainMode) {
                                    this._chainActive(this._currentFocusGui)
                                }
                            } else {
                                this.activateSound.play();
                                sc.model.player.learnSkill(skillUID);
                                sc.menu.showSkillEffect(this._currentFocusGui, false)
                            }
                        }
                    } else if (sc.model.player.hasSkillPoints(skillUID)) {
                        if (this._chainMode) {
                            this._chainActive(this._currentFocusGui)
                        } else {
                            this.activateSound.play();
                            sc.model.player.learnSkill(skillUID);
                            sc.menu.showSkillEffect(this._currentFocusGui, false)
                        }
                    }
                    sc.menu.exitNodeMenu()
                } else {
                    ig.warn("Could not find skill: " + skillUID)
                }
            }
        },

        _showEffectOnBranch: function (focusGui) {
            if (focusGui.orBranchIndex == 0) {
                sc.menu.showSkillEffect(this._currentFocusGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui.nextGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui.nextGui.nextGui, false)
            } else if (focusGui.orBranchIndex == 1) {
                sc.menu.showSkillEffect(this._currentFocusGui.parentGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui.nextGui, false)
            } else if (focusGui.orBranchIndex == 2) {
                sc.menu.showSkillEffect(this._currentFocusGui.parentGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui.parentGui.parentGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui, false)
            }
        },

        _chainActive: function (focusGui) {
            var delay = 0.2,
                chain = [],
                nodePos = Vec2.createC(0, 0);
            this._collectSkills(focusGui, chain, focusGui);
            for (var index = chain.length; index--;) {
                var entry = chain[index];
                entry.switch ? sc.model.player.switchBranch(entry.skill.uid - entry.gui.orBranchIndex * 2, entry.gui.orLeft, entry.noNew ? void 0 : entry.skill.uid) : sc.model.player.learnSkill(entry.skill.uid);
                entry.gui.getNodeFocus(nodePos);
                sc.menu.showSkillEffect(entry.gui, false, delay);
                delay = delay + 0.1
            }
            chain = chain[chain.length - 1];
            sc.menu.centerOnNodeCam(chain.gui, chain.gui.getNodeFocus(), 0.2, function () {
                sc.menu.centerOnNodeCam(focusGui, focusGui.getNodeFocus(), delay)
            }.bind(this));
            ig.interact.setBlockDelay(delay + 0.1)
        },

        _collectSkills: function (gui, chain, origin) {
            var skill = gui.skill,
                player = sc.model.player;
            if (!player.hasSkill(skill.uid)) {
                if (gui.skill) {
                    if (gui.orGui) {
                        var orGui = gui.orGui;
                        if (player.hasSkill(orGui.skill.uid)) {
                            if (origin.orGui && origin.orLeft != orGui.orLeft) {
                                chain.push({
                                    gui: gui,
                                    skill: skill,
                                    "switch": true,
                                    noNew: true
                                });
                                return
                            }
                            if (orGui.orBranchIndex == 2) {
                                return
                            }
                            if (orGui.orBranchIndex <= 1) {
                                chain[chain.length - 1] = {
                                    gui: orGui.nextGui,
                                    skill: orGui.nextGui.skill,
                                    "switch": true
                                };
                                orGui.nextGui.nextGui && (chain[chain.length - 2] = {
                                    gui: orGui.nextGui.nextGui,
                                    skill: orGui.nextGui.nextGui.skill,
                                    "switch": true
                                });
                                return
                            }
                        }
                    }
                    chain.push({
                        gui: gui,
                        skill: skill
                    })
                }
                gui.parentGui && this._collectSkills(gui.parentGui, chain, origin)
            }
        },

        _setContent: function (chainMode) {
            this._chainMode = chainMode || false;
            var isBranch = this._currentFocusGui.branchSkill ? true : false,
                skill = this._currentFocusGui.skill,
                skillUID = skill.uid,
                parentGui = this._currentFocusGui.parentGui ? this._currentFocusGui.parentGui : null;
            this.activate.textChild.setText(ig.lang.get("sc.gui.menu.skill.activate"));
            this.activate.setActive(true);
            this.cost.setText(ig.lang.get("sc.gui.menu.skill.cost"));
            this.costCP.doStateTransition("DEFAULT", true);
            this.costNumber.doStateTransition("DEFAULT", true);
            this.costNumber.setColor(0, sc.GUI_NUMBER_COLOR.WHITE);
            this.costNumber.setNumber(0, true);
            this.buttonGroup.setCurrentFocus(0, 0);
            if (sc.model.player.hasSkill(skill.uid)) {
                this.cost.setText(ig.lang.get("sc.gui.menu.skill.activated"));
                this.costCP.doStateTransition("HIDDEN", false);
                this.costNumber.doStateTransition("HIDDEN", false);
                this.activate.setActive(false);
                this.buttonGroup.setCurrentFocus(0, 1)
            } else {
                var isChain = false;
                if (isBranch) {
                    isBranch = false;
                    this._currentFocusGui.orLeft ? sc.model.player.hasSkill(skill.uid + 1) && (isBranch = true) : sc.model.player.hasSkill(skill.uid - 1) && (isBranch = true);
                    if (isBranch) {
                        this.activate.textChild.setText(ig.lang.get("sc.gui.menu.skill.switch"));
                        this.cost.setText(ig.lang.get("sc.gui.menu.skill.activated"));
                        this.costCP.doStateTransition("HIDDEN", false);
                        this.costNumber.doStateTransition("HIDDEN", false);
                        return
                    }
                    this._currentFocusGui.orBranchIndex > 0 && (parentGui.orLeft ? sc.model.player.hasSkill(parentGui.skill.uid + 1) && (isBranch = true) : sc.model.player.hasSkill(parentGui.skill.uid - 1) && (isBranch = true));
                    isBranch && this.activate.textChild.setText(ig.lang.get("sc.gui.menu.skill.switch"));
                    !isBranch && chainMode && (isChain = true)
                } else {
                    chainMode && (isChain = true)
                }
                if (isChain) {
                    if (!this._hasParent(parentGui)) {
                        sc.menu.setInfoText(ig.lang.get("sc.gui.menu.skill.chain-des"));
                        chainMode = this._getTotalSkillCost(this._currentFocusGui, 0);
                        this.costNumber.setNumber(chainMode, true);
                        if (sc.model.player.hasSkillPointsByCp(chainMode, sc.skilltree.getSkill(skill.uid).element)) {
                            this.activate.setActive(true);
                            this.activate.textChild.setText(ig.lang.get("sc.gui.menu.skill.chain"));
                            this.costNumber.setColor(sc.GUI_NUMBER_COLOR.GREEN);
                            this.costCP.setText("\\c[2]cp\\c[0]")
                        } else {
                            this.costNumber.setColor(sc.GUI_NUMBER_COLOR.RED);
                            this.activate.setActive(false);
                            this.activate.textChild.setText("\\c[4]" + ig.lang.get("sc.gui.menu.skill.chain") + "\\c[0]");
                            this.buttonGroup.setCurrentFocus(0, 1);
                            this.costCP.setText("\\c[1]cp\\c[0]")
                        }
                        return
                    }
                } else {
                    this._chainMode = false
                }
                skill = sc.skilltree.getSkill(skill.uid);
                if (!chainMode && !this._hasParent(parentGui)) {
                    this.activate.setActive(false);
                    this.buttonGroup.setCurrentFocus(0, 1)
                }
                this.costNumber.setNumber(skill.getCPCost(), true);
                if (sc.model.player.hasSkillPoints(skillUID)) {
                    this.costNumber.setColor(sc.GUI_NUMBER_COLOR.GREEN);
                    this.costCP.setText("\\c[2]cp\\c[0]")
                } else {
                    this.costNumber.setColor(sc.GUI_NUMBER_COLOR.RED);
                    this.activate.setActive(false);
                    this.buttonGroup.setCurrentFocus(0, 1);
                    this.costCP.setText("\\c[1]cp\\c[0]")
                }
            }
        },

        _getTotalSkillCost: function (gui, total) {
            if (!gui.skill || sc.model.player.hasSkill(gui.skill.uid) || gui.orGui && sc.model.player.hasSkill(gui.orGui.skill.uid)) {
                return total
            }
            var skill = sc.skilltree.getSkill(gui.skill.uid),
                total = total + skill.getCPCost();
            return gui.parentGui ? this._getTotalSkillCost(gui.parentGui, total) : total
        },

        _onCancelPress: function () {
            sc.menu.exitNodeMenu()
        },

        _enterNodeMenu: function (chainMode) {
            if (this._currentFocusGui = sc.menu.currentSkillFocus) {
                this.doStateTransition("DEFAULT");
                sc.menu.pushBackCallback(this._onBackButtonPress.bind(this));
                this._setContent(chainMode);
                sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
            } else {
                this._currentFocusGui = null
            }
        },

        _exitNodeMenu: function () {
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            this._currentFocusGui = null;
            this._chainMode && sc.menu.setInfoText("", true);
            this.doStateTransition("HIDDEN");
            sc.menu.popBackCallback()
        },

        _onBackButtonPress: function () {
            sc.menu.exitNodeMenu()
        },

        _addLine: function (x, y, width, height) {
            var line = new ig.ColorGui("#7E7E7E", width, height);
            line.setPos(x, y);
            this.addChildGui(line)
        },

        _updatePos: function () {
            if (sc.menu.currentSkillFocus && this._currentFocusGui) {
                var hook = this.hook;
                tmpSize.x = hook.size.x + 11;
                tmpSize.y = hook.size.y;
                tmpCursor.x = sc.menu.skillCursor.x + 6;
                tmpCursor.y = sc.menu.skillCursor.y + 54;
                tmpCursor.x = this._currentFocusGui.hook.pos.x + 6 + 15 + this._currentFocusGui.getOffsetX();
                tmpCursor.y = this._currentFocusGui.hook.pos.y + 54 + 15 + this._currentFocusGui.getOffsetY();
                var x = tmpCursor.x + Math.floor(this._scrollHook.scroll.x),
                    y = tmpCursor.y + Math.floor(this._scrollHook.scroll.y);
                this.delta.x = -1;
                this.delta.y = -1;
                tmpTarget.x = x + this.delta.x * (15.5 + tmpSize.x / 2) - tmpSize.x / 2;
                tmpTarget.y = y + this.delta.y * (15.5 + tmpSize.y / 2) - tmpSize.y / 2;
                this.hook.pos.x = Math.ceil(tmpTarget.x);
                this.hook.pos.y = Math.ceil(tmpTarget.y)
            }
        },

        _hasParent: function (gui) {
            if (gui) {
                if (gui.branchSkill) {
                    if (gui.orBranchIndex == 2) {
                        if (!sc.model.player.hasSkill(gui.skill.uid) && !sc.model.player.hasSkill(gui.skill.uid - 1)) {
                            return false
                        }
                    } else if (gui.orLeft) {
                        if (!sc.model.player.hasSkill(gui.skill.uid) && !sc.model.player.hasSkill(gui.skill.uid + 1)) {
                            return false
                        }
                    } else {
                        if (!sc.model.player.hasSkill(gui.skill.uid) && !sc.model.player.hasSkill(gui.skill.uid - 1)) {
                            return false
                        }
                    }
                } else if (!sc.model.player.hasSkill(gui.skill.uid)) {
                    return false
                }
            }
            return true
        }
    });

    sc.CircuitInfoBox = sc.MenuPanel.extend({
        ninepatch: new ig.NinePatch("media/gui/circuit.png", {
            width: 5,
            height: 5,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "top-left": {
                    x: 32,
                    y: 176
                },
                "top-right": {
                    x: 48,
                    y: 176
                }
            }
        }),
        header: null,
        line: null,
        text: null,
        special: null,
        cpCost: null,
        prevMove: Vec2.createC(-1, -1),
        delta: Vec2.createC(-1, -1),
        jumpFromLastSkill: null,
        lastPos: Vec2.createC(0, 0),
        lastPosTimer: 0,
        _scrollHook: null,
        sizeTransition: null,
        FONT_BOX_OPTIONS: null,

        init: function (scrollHook) {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.FONT_BOX_OPTIONS = [{
                font: sc.fontsystem.tinyFont,
                padding: 0,
                offset: 1
            }, {
                font: sc.fontsystem.smallFont,
                padding: -1,
                offset: 0
            }, {
                font: sc.fontsystem.font,
                padding: -1,
                offset: 0
            }];
            this._scrollHook = scrollHook;
            this.header = new sc.TextGui("UberSkill 9000gt", {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                maxWidth: 170
            });
            this.header.setPos(8, 2);
            this.addChildGui(this.header);
            this.special = new sc.TextGui("Guard Art", {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont,
                maxWidth: 170
            });
            this.special.setPos(7, 9);
            this.special.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.special);
            this.special.hook.localAlpha = 0;
            this.line = new ig.ColorGui("#FFFFFF", 10, 1);
            this.line.setPos(4, 19);
            this.addChildGui(this.line);
            this.cpCost = new sc.TextGui("Cost: ", {
                font: sc.fontsystem.tinyFont
            });
            this.cpCost.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.cpCost);
            var textSize = sc.options.get("circuit-text-size");
            textSize = this.FONT_BOX_OPTIONS[textSize] ? textSize : 0;
            this.text = new sc.TextGui("Unlocks Magic Dagger + 5.\nIncreases text by a third line.", {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                maxWidth: 170,
                linePadding: this.FONT_BOX_OPTIONS[textSize].padding,
                font: this.FONT_BOX_OPTIONS[textSize].font
            });
            this.text.setPos(8, 20 + this.FONT_BOX_OPTIONS[textSize].offset);
            this.addChildGui(this.text);
            var config = DISPLAY_TIME_CONFIG[sc.options.get("circuit-display-time") || 0];
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: config.showDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 1,
                        scaleY: 0,
                        alpha: 0
                    },
                    time: config.hideDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hook.invisibleUpdate = true;
            this.doSizeTransition(true);
            this.setPos(100, 100);
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            var textSize = sc.options.get("circuit-text-size"),
                textSize = this.FONT_BOX_OPTIONS[textSize] ? textSize : 0;
            this.text.setFont(this.FONT_BOX_OPTIONS[textSize].font, this.FONT_BOX_OPTIONS[textSize].padding);
            this.text.setPos(8, 20 + this.FONT_BOX_OPTIONS[textSize].offset);
            var config = DISPLAY_TIME_CONFIG[sc.options.get("circuit-display-time") || 0];
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: config.showDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 1,
                        scaleY: 0,
                        alpha: 0
                    },
                    time: config.hideDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.doSizeTransition(true)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this);
            this.jumpFromLastSkill = null;
            this.prevMove.x = 0
        },

        doSizeTransition: function (instant) {
            var height;
            height = 30 + (this.text.hook.size.y + 4);
            if (!(186 == this.hook.size.x && height == this.hook.size.y)) {
                this.line.setSize(178, 1);
                this.line.setPos(4, 19);
                this.cpCost.setPos(8, this.text.hook.size.y + 24);
                instant ? this.setSize(186, height) : this.sizeTransition = {
                    startWidth: this.hook.size.x,
                    width: 186,
                    startHeight: this.hook.size.y,
                    height: height || 0,
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE,
                    timer: 0
                }
            }
        },

        update: function () {
            if (sc.menu.skillDrag && !sc.menu.currentSkillFocus) {
                this.doStateTransition("HIDDEN", false, false, function () {
                    this.jumpFromLastSkill = null
                }.bind(this));
                this.jumpFromLastSkill = null
            }
            this._updatePos(true);
            this._updateSize();
            if (!this.hook.hasTransition() && this.hook.currentStateName == "HIDDEN") {
                this.jumpFromLastSkill = null;
                this.lastPosTimer = 0
            }
        },

        modelChanged: function (menu, event) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE) {
                    this._setContent();
                    this.doStateTransition("DEFAULT")
                } else if (event == sc.MENU_EVENT.SKILL_CURSOR_UNFOCUS_NODE) {
                    this._hideInfo()
                } else if (event == sc.MENU_EVENT.SKILL_TREE_SELECT || event == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                    this.jumpFromLastSkill = sc.menu.currentSkillFocus = null;
                    this.prevMove.x = 0;
                    this.doStateTransition("HIDDEN", false, false, function () {
                        this.jumpFromLastSkill = null
                    }.bind(this))
                }
            }
        },

        _updatePos: function (animate) {
            if (sc.menu.currentSkillFocus) {
                if (this.jumpFromLastSkill && this.jumpFromLastSkill != sc.menu.currentSkillFocus) {
                    Vec2.assign(this.lastPos, this.hook.pos);
                    this.lastPosTimer = 0.1
                }
                this.jumpFromLastSkill = sc.menu.currentSkillFocus;
                var hook = this.hook;
                tmpSize.x = hook.size.x;
                tmpSize.y = hook.size.y;
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    hook = sc.menu.currentSkillFocus;
                    tmpCursor.x = hook.hook.pos.x + 20 + hook.getOffsetX();
                    tmpCursor.y = hook.hook.pos.y + 20 + hook.getOffsetY()
                } else {
                    tmpCursor.x = sc.menu.skillCursor.x;
                    tmpCursor.y = sc.menu.skillCursor.y
                }
                var x = tmpCursor.x + Math.ceil(this._scrollHook.scroll.x),
                    y = tmpCursor.y + Math.ceil(this._scrollHook.scroll.y),
                    overflow = x - (ig.system.width - tmpSize.x - 16),
                    side = overflow <= 0 ? 1 : -1;
                if (animate && this.prevMove.x != 0) {
                    if (sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU) {
                        this.prevMove.x = 1
                    } else if (side != this.prevMove.x && Math.abs(overflow) > 16) {
                        this.prevMove.x = side
                    }
                    this.delta.x = this.delta.x * 0.8 + this.prevMove.x * 0.2;
                    this.delta.y = this.delta.y * 0.8 + this.prevMove.y * 0.2
                } else {
                    this.prevMove.x = this.delta.x = side;
                    this.prevMove.y = this.delta.y = -1
                }
                tmpTarget.x = x + this.delta.x * (15.5 + tmpSize.x / 2) - tmpSize.x / 2;
                tmpTarget.y = y + this.delta.y * (15.5 + tmpSize.y / 2) - tmpSize.y / 2;
                tmpTarget.x = tmpTarget.x.limit(1, ig.system.width - tmpSize.x - 1);
                tmpTarget.y = tmpTarget.y.limit(22, ig.system.height - tmpSize.y - 22 - (tmpTarget.x < 192 ? Math.min(30, 192 - tmpTarget.x) : 0));
                if (this.lastPosTimer > 0) {
                    this.lastPosTimer = this.lastPosTimer - ig.system.actualTick;
                    this.lastPosTimer <= 0 ? this.lastPosTimer = 0 : Vec2.lerp(tmpTarget, this.lastPos, this.lastPosTimer / 0.1)
                }
                this.hook.pos.x = Math.ceil(tmpTarget.x);
                this.hook.pos.y = Math.ceil(tmpTarget.y)
            } else {
                if (this.hook.currentStateName == "HIDDEN" && !this.hook.hasTransition()) {
                    this.jumpFromLastSkill = null
                }
                this.prevMove.x = 0
            }
        },

        _updateSize: function () {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var progress = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    eased = this.sizeTransition.timeFunction.get(progress);
                this.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - eased) + this.sizeTransition.width * eased);
                this.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - eased) + this.sizeTransition.height * eased);
                if (eased == 1) {
                    this.sizeTransition = null
                }
            }
        },

        _setContent: function () {
            var skill = sc.menu.currentSkillFocus.skill,
                skillData = sc.skilltree.getSkill(skill.uid);
            if (skillData.getName().slice(0, 4) == "BS [") {
                this.header.setText("UberSkill 9000gt")
            } else if (skillData instanceof sc.SpecialSkill) {
                this.header.setText("\\c[3]" + skillData.getName() + "\\c[0]");
                this.special.setText(ig.lang.get("sc.gui.skills.special-types." + skillData.skillType));
                this.special.hook.localAlpha = 1
            } else {
                this.header.setText(skillData.getName());
                this.special.hook.localAlpha = 0
            }
            if (sc.menu.currentSkillFocus.blocked) {
                var itemName = "\\c[3]" + sc.inventory.getItemName(sc.menu.currentSkillFocus.blockID) + "\\c[0]",
                    shadeText = ig.lang.get("sc.gui.menu.skill.shade");
                this.text.setText(shadeText.replace("[xyz]", itemName))
            } else {
                this.text.setText(skillData.getDescription())
            }
            var cost = sc.SkillTools.getCPCost(skillData.element, skillData.level),
                focusGui = sc.menu.currentSkillFocus,
                player = sc.model.player;
            if (focusGui.branchSkill) {
                var canSwitch = false;
                focusGui.orLeft ? player.hasSkill(skillData.id + 1) && (canSwitch = true) : player.hasSkill(skillData.id - 1) && (canSwitch = true);
                canSwitch ? this.cpCost.setText("\\c[3]" + ig.lang.get("sc.gui.menu.skill.swappable") + "\\c[0]") : player.hasSkill(skill.uid) ? this.cpCost.setText("\\c[3]" + ig.lang.get("sc.gui.menu.skill.activated") + "\\c[0]") : player.hasSkillPoints(skill.uid) ? this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") + " \\c[2]" + cost + "cp\\c[0]") : this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") + " \\c[1]" + cost + "cp\\c[0]")
            } else {
                player.hasSkill(skill.uid) ? this.cpCost.setText("\\c[3]" + ig.lang.get("sc.gui.menu.skill.activated") + "\\c[0]") : player.hasSkillPoints(skill.uid) ? this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") + " \\c[2]" + cost + "cp\\c[0]") : this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") + " \\c[1]" + cost + "cp\\c[0]")
            }
            this.doSizeTransition(true)
        },

        _hideInfo: function () {
            var config = DISPLAY_TIME_CONFIG[sc.options.get("circuit-display-time") || 0];
            this.hook.hasTransition() && this.hook.currentStateName != "DEFAULT" ? this.doStateTransition("HIDDEN", false, false, function () {
                this.jumpFromLastSkill = null
            }.bind(this)) : config.noInterrupt && this.hook.hasTransition() && this.hook.currentStateName == "DEFAULT" ? this.hook.stateCallback = function () {
                this.doStateTransition("HIDDEN", false, false, function () {
                    this.jumpFromLastSkill = null
                }.bind(this), config.midDelay)
            }.bind(this) : this.doStateTransition("HIDDEN", false, false, function () {
                this.jumpFromLastSkill = null
            }.bind(this), config.hideDelay)
        }
    });

    sc.CircuitDetailButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg", 0.9)
        },

        isNonMouseMenuInput: function () {
            return sc.control.elementModeSwitch() || sc.control.menuCircleRight() || sc.control.menuCircleLeft()
        },

        doButtonTraversal: function () {
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.currentSkillFocus) {
                sc.menu.currentSkillFocus.onButtonPress()
            }
            var direction = -1;
            sc.control.menuCircleRight() && (direction = 1);
            sc.control.menuCircleLeft() && (direction = 0);
            if (direction >= 0) {
                direction = this.cycleElements(direction);
                direction != sc.menu.currentSkillTree && sc.menu.selectSkillTree(direction)
            }
            direction = sc.control.elementModeSwitch();
            direction !== false && (!direction || direction == sc.menu.currentSkillTree ? sc.menu.selectSkillTree(sc.ELEMENT.NEUTRAL) : sc.model.player.hasElement(direction) && sc.menu.selectSkillTree(direction))
        },

        cycleElements: function (direction) {
            var element = sc.menu.currentSkillTree;
            do
                if (direction > 0) {
                    element = (element + 1) % 5
                } else {
                    element--;
                    element < 0 && (element = 4)
                } while (!sc.model.player.hasElement(element));
            return element
        }
    })
});
ig.baked = !0;
