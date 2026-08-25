ig.module("game.feature.menu.gui.circuit.circuit-detail-elements").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.interact", "game.feature.font.font-system", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.menu-misc", "game.feature.model.options-model", "game.feature.skills.skills").defines(function() {
    var b = [];
    b[sc.CIRCUIT_MENU_DISPLAY_TIME.SHORT] = {
        hideDelay: 0.05,
        midDelay: 0.05,
        showDuration: 0.1,
        hideDuration: 0.1,
        noInterrupt: true
    };
    b[sc.CIRCUIT_MENU_DISPLAY_TIME.LONG] = {
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
        init: function() {
            this.parent();
            this.setSize(31, 31)
        },
        focusOnNode: function(a, b) {
            this.setPos(a - Math.floor(this.hook.size.x / 2), b - Math.floor(this.hook.size.y / 2));
            this.focus = true;
            this._focusTimer = 0;
            this._focusTime = 0.2;
            this._focusOffset = 0
        },
        unfocus: function() {
            this.focus =
                false;
            this._focusTime = this._focusTimer = 0.2;
            this._focusOffset = 0
        },
        moveTo: function(a, b, c, d) {
            c != void 0 && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.doPosTranstition(a - Math.floor(this.hook.size.x / 2), b - Math.floor(this.hook.size.y / 2), d, KEY_SPLINES.EASE) : this.setPos(a - Math.floor(this.hook.size.x / 2), b - Math.floor(this.hook.size.y / 2));
            if (this.focus) {
                this._focusTimer = 0;
                this._focusTime = 0.2;
                this._focusOffset = 3;
                this.focus = false
            }
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu,
                this)
        },
        update: function() {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
            if (this._focusTimer < this._focusTime) {
                this._focusTimer = this._focusTimer + ig.system.actualTick;
                if (this._focusTimer >= this._focusTime) {
                    this._focusTimer = this._focusTime;
                    this._focusOffset = this.focus ? 3 : 0
                } else this._focusOffset = (this._focusTime ? 1 : -1) * (this._focusTimer / this._focusTime) * 3
            }
        },
        updateDrawables: function(a) {
            if (this._gamepadActive ||
                this.focus) {
                a.addGfx(this.gfx, 3 - this._focusOffset, 3 - this._focusOffset, 36, 116, 12, 12);
                a.addGfx(this.gfx, 16 + this._focusOffset, 3 - this._focusOffset, 48, 116, 12, 12);
                a.addGfx(this.gfx, 3 - this._focusOffset, 16 + this._focusOffset, 36, 128, 12, 12);
                a.addGfx(this.gfx, 16 + this._focusOffset, 16 + this._focusOffset, 48, 128, 12, 12)
            }
        },
        modelChanged: function(a, b) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.SKILL_TREE_SELECT) {
                    this.unfocus();
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) this._gamepadActive = true
                } else if (b == sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE) this.focusOnNode(sc.menu.skillCursor.x,
                sc.menu.skillCursor.y);
            else if (b == sc.MENU_EVENT.SKILL_CURSOR_UNFOCUS_NODE) this.unfocus();
            else if (b == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                this._focusTime = this._focusTimer = 0.2;
                this._focusOffset = 0
            } else b == sc.MENU_EVENT.SKILL_ENSURE_GAMEPAD_FOCUS && (this.focus || this.focusOnNode(sc.menu.skillCursor.x, sc.menu.skillCursor.y))
        }
    });
    var a = Vec2.createC(0, 0),
        d = Vec2.createC(0, 0),
        c = Vec2.createC(0, 0);
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
        init: function(a) {
            this.parent();
            this.setSize(100, 63);
            this._scrollHook = a;
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
            this.costCP.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
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
            this.cancel.onButtonPress =
                this._onCancelPress.bind(this);
            this.addChildGui(this.cancel);
            this.buttonGroup.addFocusGui(this.activate, 0, 0);
            this.buttonGroup.addFocusGui(this.cancel, 0, 1);
            this._addLine(1, 19, 98, 1);
            this._addLine(1, 61, 98, 1);
            this._addLine(98, 20, 1, 7);
            this._addLine(98, 36, 1, 25);
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        update: function() {
            this._updatePos()
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addGfx(this.ninepatch.gfx, 99, 26, 32, 148, 12, 13)
        },
        modelChanged: function(a, b, c) {
            a == sc.menu && (b == sc.MENU_EVENT.SKILL_NODE_SELECT ? this._enterNodeMenu(c) : b == sc.MENU_EVENT.SKILL_NODE_EXIT ? this._exitNodeMenu() : b == sc.MENU_EVENT.SKILL_TREE_SELECT && this.hook.currentStateName == "DEFAULT" && this._exitNodeMenu())
        },
        _onActivatePress: function() {
            if (this._currentFocusGui) {
                var a = this._currentFocusGui.branchSkill ? true : false,
                    b = this._currentFocusGui,
                    c = this._currentFocusGui.parentGui ? this._currentFocusGui.parentGui : null,
                    d = this._currentFocusGui.skill.uid;
                sc.skilltree.getSkill(d);
                if (sc.skilltree.skills[d]) {
                    if (a) {
                        a = false;
                        b.orLeft ? sc.model.player.hasSkill(d + 1) && (a = true) : sc.model.player.hasSkill(d - 1) && (a = true);
                        if (a) {
                            this.activateSound.play();
                            sc.model.player.switchBranch(d - b.orBranchIndex * 2, b.orLeft);
                            this._showEffectOnBranch(this._currentFocusGui)
                        } else {
                            a = false;
                            b.orBranchIndex > 0 ? c.orLeft ? sc.model.player.hasSkill(c.skill.uid + 1) && (a = true) : sc.model.player.hasSkill(c.skill.uid - 1) && (a = true) : a = false;
                            if (sc.model.player.hasSkillPoints(d))
                                if (a) {
                                    this.activateSound.play();
                                    sc.model.player.switchBranch(d - b.orBranchIndex * 2, b.orLeft, d);
                                    this._showEffectOnBranch(this._currentFocusGui)
                                } else if (this._chainMode) this._chainActive(this._currentFocusGui);
                            else {
                                this.activateSound.play();
                                sc.model.player.learnSkill(d);
                                sc.menu.showSkillEffect(this._currentFocusGui, false)
                            }
                        }
                    } else if (sc.model.player.hasSkillPoints(d))
                        if (this._chainMode) this._chainActive(this._currentFocusGui);
                        else {
                            this.activateSound.play();
                            sc.model.player.learnSkill(d);
                            sc.menu.showSkillEffect(this._currentFocusGui, false)
                        } sc.menu.exitNodeMenu()
                } else ig.warn("Could not find skill: " +
                    d)
            }
        },
        _showEffectOnBranch: function(a) {
            if (a.orBranchIndex == 0) {
                sc.menu.showSkillEffect(this._currentFocusGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui.nextGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui.nextGui.nextGui, false)
            } else if (a.orBranchIndex == 1) {
                sc.menu.showSkillEffect(this._currentFocusGui.parentGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui.nextGui, false)
            } else if (a.orBranchIndex == 2) {
                sc.menu.showSkillEffect(this._currentFocusGui.parentGui,
                    false);
                sc.menu.showSkillEffect(this._currentFocusGui.parentGui.parentGui, false);
                sc.menu.showSkillEffect(this._currentFocusGui, false)
            }
        },
        _chainActive: function(a) {
            var b = 0.2,
                c = [],
                d = Vec2.createC(0, 0);
            this._collectSkills(a, c, a);
            for (var i = c.length; i--;) {
                var j = c[i];
                j.switch ? sc.model.player.switchBranch(j.skill.uid - j.gui.orBranchIndex * 2, j.gui.orLeft, j.noNew ? void 0 : j.skill.uid) : sc.model.player.learnSkill(j.skill.uid);
                j.gui.getNodeFocus(d);
                sc.menu.showSkillEffect(j.gui, false, b);
                b = b + 0.1
            }
            c = c[c.length - 1];
            sc.menu.centerOnNodeCam(c.gui,
                c.gui.getNodeFocus(), 0.2,
                function() {
                    sc.menu.centerOnNodeCam(a, a.getNodeFocus(), b)
                }.bind(this));
            ig.interact.setBlockDelay(b + 0.1)
        },
        _collectSkills: function(a, b, c) {
            var d = a.skill,
                i = sc.model.player;
            if (!i.hasSkill(d.uid)) {
                if (a.skill) {
                    if (a.orGui) {
                        var j = a.orGui;
                        if (i.hasSkill(j.skill.uid)) {
                            if (c.orGui && c.orLeft != j.orLeft) {
                                b.push({
                                    gui: a,
                                    skill: d,
                                    "switch": true,
                                    noNew: true
                                });
                                return
                            }
                            if (j.orBranchIndex == 2) return;
                            if (j.orBranchIndex <= 1) {
                                b[b.length - 1] = {
                                    gui: j.nextGui,
                                    skill: j.nextGui.skill,
                                    "switch": true
                                };
                                j.nextGui.nextGui &&
                                    (b[b.length - 2] = {
                                        gui: j.nextGui.nextGui,
                                        skill: j.nextGui.nextGui.skill,
                                        "switch": true
                                    });
                                return
                            }
                        }
                    }
                    b.push({
                        gui: a,
                        skill: d
                    })
                }
                a.parentGui && this._collectSkills(a.parentGui, b, c)
            }
        },
        _setContent: function(a) {
            this._chainMode = a || false;
            var b = this._currentFocusGui.branchSkill ? true : false,
                c = this._currentFocusGui.skill,
                d = c.uid,
                i = this._currentFocusGui.parentGui ? this._currentFocusGui.parentGui : null;
            this.activate.textChild.setText(ig.lang.get("sc.gui.menu.skill.activate"));
            this.activate.setActive(true);
            this.cost.setText(ig.lang.get("sc.gui.menu.skill.cost"));
            this.costCP.doStateTransition("DEFAULT", true);
            this.costNumber.doStateTransition("DEFAULT", true);
            this.costNumber.setColor(0, sc.GUI_NUMBER_COLOR.WHITE);
            this.costNumber.setNumber(0, true);
            this.buttonGroup.setCurrentFocus(0, 0);
            if (sc.model.player.hasSkill(c.uid)) {
                this.cost.setText(ig.lang.get("sc.gui.menu.skill.activated"));
                this.costCP.doStateTransition("HIDDEN", false);
                this.costNumber.doStateTransition("HIDDEN", false);
                this.activate.setActive(false);
                this.buttonGroup.setCurrentFocus(0, 1)
            } else {
                var j = false;
                if (b) {
                    b = false;
                    this._currentFocusGui.orLeft ? sc.model.player.hasSkill(c.uid + 1) && (b = true) : sc.model.player.hasSkill(c.uid - 1) && (b = true);
                    if (b) {
                        this.activate.textChild.setText(ig.lang.get("sc.gui.menu.skill.switch"));
                        this.cost.setText(ig.lang.get("sc.gui.menu.skill.activated"));
                        this.costCP.doStateTransition("HIDDEN", false);
                        this.costNumber.doStateTransition("HIDDEN", false);
                        return
                    }
                    this._currentFocusGui.orBranchIndex > 0 && (i.orLeft ? sc.model.player.hasSkill(i.skill.uid + 1) && (b = true) : sc.model.player.hasSkill(i.skill.uid -
                        1) && (b = true));
                    b && this.activate.textChild.setText(ig.lang.get("sc.gui.menu.skill.switch"));
                    !b && a && (j = true)
                } else a && (j = true);
                if (j) {
                    if (!this._hasParent(i)) {
                        sc.menu.setInfoText(ig.lang.get("sc.gui.menu.skill.chain-des"));
                        a = this._getTotalSkillCost(this._currentFocusGui, 0);
                        this.costNumber.setNumber(a, true);
                        if (sc.model.player.hasSkillPointsByCp(a, sc.skilltree.getSkill(c.uid).element)) {
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
                } else this._chainMode = false;
                c = sc.skilltree.getSkill(c.uid);
                if (!a && !this._hasParent(i)) {
                    this.activate.setActive(false);
                    this.buttonGroup.setCurrentFocus(0, 1)
                }
                this.costNumber.setNumber(c.getCPCost(), true);
                if (sc.model.player.hasSkillPoints(d)) {
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
        _getTotalSkillCost: function(a, b) {
            if (!a.skill || sc.model.player.hasSkill(a.skill.uid) || a.orGui && sc.model.player.hasSkill(a.orGui.skill.uid)) return b;
            var c = sc.skilltree.getSkill(a.skill.uid),
                b = b + c.getCPCost();
            return a.parentGui ? this._getTotalSkillCost(a.parentGui, b) : b
        },
        _onCancelPress: function() {
            sc.menu.exitNodeMenu()
        },
        _enterNodeMenu: function(a) {
            if (this._currentFocusGui = sc.menu.currentSkillFocus) {
                this.doStateTransition("DEFAULT");
                sc.menu.pushBackCallback(this._onBackButtonPress.bind(this));
                this._setContent(a);
                sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
            } else this._currentFocusGui = null
        },
        _exitNodeMenu: function() {
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            this._currentFocusGui = null;
            this._chainMode && sc.menu.setInfoText("", true);
            this.doStateTransition("HIDDEN");
            sc.menu.popBackCallback()
        },
        _onBackButtonPress: function() {
            sc.menu.exitNodeMenu()
        },
        _addLine: function(a, b, c, d) {
            c = new ig.ColorGui("#7E7E7E", c, d);
            c.setPos(a, b);
            this.addChildGui(c)
        },
        _updatePos: function() {
            if (sc.menu.currentSkillFocus && this._currentFocusGui) {
                var b = this.hook;
                d.x = b.size.x + 11;
                d.y = b.size.y;
                a.x = sc.menu.skillCursor.x + 6;
                a.y = sc.menu.skillCursor.y + 54;
                a.x = this._currentFocusGui.hook.pos.x + 6 + 15 + this._currentFocusGui.getOffsetX();
                a.y = this._currentFocusGui.hook.pos.y + 54 + 15 + this._currentFocusGui.getOffsetY();
                var b = a.x + Math.floor(this._scrollHook.scroll.x),
                    f = a.y + Math.floor(this._scrollHook.scroll.y);
                this.delta.x = -1;
                this.delta.y = -1;
                c.x = b + this.delta.x * (15.5 + d.x / 2) - d.x / 2;
                c.y = f + this.delta.y * (15.5 + d.y / 2) - d.y / 2;
                this.hook.pos.x = Math.ceil(c.x);
                this.hook.pos.y = Math.ceil(c.y)
            }
        },
        _hasParent: function(a) {
            if (a)
                if (a.branchSkill)
                    if (a.orBranchIndex == 2) {
                        if (!sc.model.player.hasSkill(a.skill.uid) && !sc.model.player.hasSkill(a.skill.uid - 1)) return false
                    } else if (a.orLeft) {
                if (!sc.model.player.hasSkill(a.skill.uid) && !sc.model.player.hasSkill(a.skill.uid + 1)) return false
            } else {
                if (!sc.model.player.hasSkill(a.skill.uid) &&
                    !sc.model.player.hasSkill(a.skill.uid - 1)) return false
            } else if (!sc.model.player.hasSkill(a.skill.uid)) return false;
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
        init: function(a) {
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
            this._scrollHook = a;
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
            a = sc.options.get("circuit-text-size");
            a = this.FONT_BOX_OPTIONS[a] ? a : 0;
            this.text = new sc.TextGui("Unlocks Magic Dagger + 5.\nIncreases text by a third line.", {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                maxWidth: 170,
                linePadding: this.FONT_BOX_OPTIONS[a].padding,
                font: this.FONT_BOX_OPTIONS[a].font
            });
            this.text.setPos(8, 20 + this.FONT_BOX_OPTIONS[a].offset);
            this.addChildGui(this.text);
            a = b[sc.options.get("circuit-display-time") || 0];
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: a.showDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 1,
                        scaleY: 0,
                        alpha: 0
                    },
                    time: a.hideDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hook.invisibleUpdate = true;
            this.doSizeTransition(true);
            this.setPos(100, 100);
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            var a = sc.options.get("circuit-text-size"),
                a = this.FONT_BOX_OPTIONS[a] ? a : 0;
            this.text.setFont(this.FONT_BOX_OPTIONS[a].font, this.FONT_BOX_OPTIONS[a].padding);
            this.text.setPos(8, 20 + this.FONT_BOX_OPTIONS[a].offset);
            a = b[sc.options.get("circuit-display-time") || 0];
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: a.showDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 1,
                        scaleY: 0,
                        alpha: 0
                    },
                    time: a.hideDuration,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.doSizeTransition(true)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            this.jumpFromLastSkill = null;
            this.prevMove.x = 0
        },
        doSizeTransition: function(a) {
            var b;
            b = 30 + (this.text.hook.size.y + 4);
            if (!(186 == this.hook.size.x && b == this.hook.size.y)) {
                this.line.setSize(178, 1);
                this.line.setPos(4, 19);
                this.cpCost.setPos(8, this.text.hook.size.y +
                    24);
                a ? this.setSize(186, b) : this.sizeTransition = {
                    startWidth: this.hook.size.x,
                    width: 186,
                    startHeight: this.hook.size.y,
                    height: b || 0,
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE,
                    timer: 0
                }
            }
        },
        update: function() {
            if (sc.menu.skillDrag && !sc.menu.currentSkillFocus) {
                this.doStateTransition("HIDDEN", false, false, function() {
                    this.jumpFromLastSkill = null
                }.bind(this));
                this.jumpFromLastSkill = null
            }
            this._updatePos(true);
            this._updateSize();
            if (!this.hook.hasTransition() && this.hook.currentStateName == "HIDDEN") {
                this.jumpFromLastSkill =
                    null;
                this.lastPosTimer = 0
            }
        },
        modelChanged: function(a, b) {
            if (a == sc.menu)
                if (b == sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE) {
                    this._setContent();
                    this.doStateTransition("DEFAULT")
                } else if (b == sc.MENU_EVENT.SKILL_CURSOR_UNFOCUS_NODE) this._hideInfo();
            else if (b == sc.MENU_EVENT.SKILL_TREE_SELECT || b == sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE) {
                this.jumpFromLastSkill = sc.menu.currentSkillFocus = null;
                this.prevMove.x = 0;
                this.doStateTransition("HIDDEN", false, false, function() {
                    this.jumpFromLastSkill = null
                }.bind(this))
            }
        },
        _updatePos: function(b) {
            if (sc.menu.currentSkillFocus) {
                if (this.jumpFromLastSkill &&
                    this.jumpFromLastSkill != sc.menu.currentSkillFocus) {
                    Vec2.assign(this.lastPos, this.hook.pos);
                    this.lastPosTimer = 0.1
                }
                this.jumpFromLastSkill = sc.menu.currentSkillFocus;
                var f = this.hook;
                d.x = f.size.x;
                d.y = f.size.y;
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    f = sc.menu.currentSkillFocus;
                    a.x = f.hook.pos.x + 20 + f.getOffsetX();
                    a.y = f.hook.pos.y + 20 + f.getOffsetY()
                } else {
                    a.x = sc.menu.skillCursor.x;
                    a.y = sc.menu.skillCursor.y
                }
                var f = a.x + Math.ceil(this._scrollHook.scroll.x),
                    g = a.y + Math.ceil(this._scrollHook.scroll.y),
                    h = f - (ig.system.width - d.x - 16),
                    i = h <= 0 ? 1 : -1;
                if (b && this.prevMove.x != 0) {
                    if (sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU) this.prevMove.x = 1;
                    else if (i != this.prevMove.x && Math.abs(h) > 16) this.prevMove.x = i;
                    this.delta.x = this.delta.x * 0.8 + this.prevMove.x * 0.2;
                    this.delta.y = this.delta.y * 0.8 + this.prevMove.y * 0.2
                } else {
                    this.prevMove.x = this.delta.x = i;
                    this.prevMove.y = this.delta.y = -1
                }
                c.x = f + this.delta.x * (15.5 + d.x / 2) - d.x / 2;
                c.y = g + this.delta.y * (15.5 + d.y / 2) - d.y / 2;
                c.x = c.x.limit(1, ig.system.width - d.x - 1);
                c.y = c.y.limit(22, ig.system.height -
                    d.y - 22 - (c.x < 192 ? Math.min(30, 192 - c.x) : 0));
                if (this.lastPosTimer > 0) {
                    this.lastPosTimer = this.lastPosTimer - ig.system.actualTick;
                    this.lastPosTimer <= 0 ? this.lastPosTimer = 0 : Vec2.lerp(c, this.lastPos, this.lastPosTimer / 0.1)
                }
                this.hook.pos.x = Math.ceil(c.x);
                this.hook.pos.y = Math.ceil(c.y)
            } else {
                if (this.hook.currentStateName == "HIDDEN" && !this.hook.hasTransition()) this.jumpFromLastSkill = null;
                this.prevMove.x = 0
            }
        },
        _updateSize: function() {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var a = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    a = this.sizeTransition.timeFunction.get(a);
                this.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - a) + this.sizeTransition.width * a);
                this.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - a) + this.sizeTransition.height * a);
                if (a == 1) this.sizeTransition = null
            }
        },
        _setContent: function() {
            var a = sc.menu.currentSkillFocus.skill,
                b = sc.skilltree.getSkill(a.uid);
            if (b.getName().slice(0, 4) == "BS [") this.header.setText("UberSkill 9000gt");
            else if (b instanceof sc.SpecialSkill) {
                this.header.setText("\\c[3]" + b.getName() + "\\c[0]");
                this.special.setText(ig.lang.get("sc.gui.skills.special-types." + b.skillType));
                this.special.hook.localAlpha = 1
            } else {
                this.header.setText(b.getName());
                this.special.hook.localAlpha = 0
            }
            if (sc.menu.currentSkillFocus.blocked) {
                var c = "\\c[3]" + sc.inventory.getItemName(sc.menu.currentSkillFocus.blockID) + "\\c[0]",
                    d = ig.lang.get("sc.gui.menu.skill.shade");
                this.text.setText(d.replace("[xyz]", c))
            } else this.text.setText(b.getDescription());
            var c = sc.SkillTools.getCPCost(b.element, b.level),
                d = sc.menu.currentSkillFocus,
                i = sc.model.player;
            if (d.branchSkill) {
                var j = false;
                d.orLeft ? i.hasSkill(b.id + 1) && (j = true) : i.hasSkill(b.id - 1) && (j = true);
                j ? this.cpCost.setText("\\c[3]" + ig.lang.get("sc.gui.menu.skill.swappable") + "\\c[0]") : i.hasSkill(a.uid) ? this.cpCost.setText("\\c[3]" + ig.lang.get("sc.gui.menu.skill.activated") + "\\c[0]") : i.hasSkillPoints(a.uid) ? this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") + " \\c[2]" + c + "cp\\c[0]") : this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") +
                    " \\c[1]" + c + "cp\\c[0]")
            } else i.hasSkill(a.uid) ? this.cpCost.setText("\\c[3]" + ig.lang.get("sc.gui.menu.skill.activated") + "\\c[0]") : i.hasSkillPoints(a.uid) ? this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") + " \\c[2]" + c + "cp\\c[0]") : this.cpCost.setText(ig.lang.get("sc.gui.menu.skill.cost") + " \\c[1]" + c + "cp\\c[0]");
            this.doSizeTransition(true)
        },
        _hideInfo: function() {
            var a = b[sc.options.get("circuit-display-time") || 0];
            this.hook.hasTransition() && this.hook.currentStateName != "DEFAULT" ? this.doStateTransition("HIDDEN",
                false, false,
                function() {
                    this.jumpFromLastSkill = null
                }.bind(this)) : a.noInterrupt && this.hook.hasTransition() && this.hook.currentStateName == "DEFAULT" ? this.hook.stateCallback = function() {
                this.doStateTransition("HIDDEN", false, false, function() {
                    this.jumpFromLastSkill = null
                }.bind(this), a.midDelay)
            }.bind(this) : this.doStateTransition("HIDDEN", false, false, function() {
                this.jumpFromLastSkill = null
            }.bind(this), a.hideDelay)
        }
    });
    sc.CircuitDetailButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg",
                0.9)
        },
        isNonMouseMenuInput: function() {
            return sc.control.elementModeSwitch() || sc.control.menuCircleRight() || sc.control.menuCircleLeft()
        },
        doButtonTraversal: function() {
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && sc.control.menuConfirm() && sc.menu.currentSkillFocus) sc.menu.currentSkillFocus.onButtonPress();
            var a = -1;
            sc.control.menuCircleRight() && (a = 1);
            sc.control.menuCircleLeft() && (a = 0);
            if (a >= 0) {
                a = this.cycleElements(a);
                a != sc.menu.currentSkillTree && sc.menu.selectSkillTree(a)
            }
            a = sc.control.elementModeSwitch();
            a !== false && (!a || a == sc.menu.currentSkillTree ? sc.menu.selectSkillTree(sc.ELEMENT.NEUTRAL) : sc.model.player.hasElement(a) && sc.menu.selectSkillTree(a))
        },
        cycleElements: function(a) {
            var b = sc.menu.currentSkillTree;
            do
                if (a > 0) b = (b + 1) % 5;
                else {
                    b--;
                    b < 0 && (b = 4)
                } while (!sc.model.player.hasElement(b));
            return b
        }
    })
});
ig.baked = !0;
