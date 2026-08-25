ig.module("game.feature.control.control").requires("impact.base.game", "impact.feature.interact.press-repeater", "impact.feature.gui.gui").defines(function() {
    function b() {
        var a = ig.game.playerEntity;
        if (!a || !sc.options.get("close-combat-input")) return 9999;
        a = a.coll;
        ig.system.getScreenFromMapPos(d, a.pos.x + a.size.x / 2, a.pos.y + a.size.y / 2 - a.pos.z - Constants.BALL_HEIGHT - Constants.BALL_SIZE / 2);
        return Vec2.distance(d, ig.input.mouse) / ig.system.zoom
    }
    var a = Vec2.create();
    ig.canLeavePauseMenu = true;
    sc.GlobalInput = ig.GameAddon.extend({
        init: function() {
            this.parent("GlobalInput");
            ig.gui.setControlModule(sc.control);
            ig.system.cancelFocusLostCallback = function() {
                ig.gamepad.onPreUpdate();
                return sc.control.menuBack()
            }
        },
        preUpdateOrder: 5,
        onPreUpdate: function() {
            var a = !ig.game.paused && sc.model.isRunning() && sc.model.isGame() && ig.game.playerEntity && !ig.game.playerEntity.isControlBlocked();
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) ig.system.setCursorType("none");
            else if (ig.input.mouseOutOfScreen()) ig.system.clearCursorType();
            else if (a) {
                var a = sc.model.player.getCore(sc.PLAYER_CORE.CLOSE_COMBAT),
                    d = sc.model.player.getCore(sc.PLAYER_CORE.THROWING);
                !a && !d ? ig.system.setCursorType("pointer") : d ? a ? b() < sc.ATTACK_INPUT_DISTANCE ? ig.system.setCursorType("melee") : ig.system.setCursorType("throw") : ig.system.setCursorType("throw") : ig.system.setCursorType("melee")
            } else ig.system.setCursorType("pointer");
            sc.control.updateRepeater()
        },
        postUpdateOrder: 8999,
        onPostUpdate: function() {
            if (!ig.loading) {
                if ((sc.control.pause() || sc.model.isPaused() && sc.control.menuBack()) && ig.canLeavePauseMenu && !sc.arena.isPauseBlocked())
                    if (sc.model.isPaused()) {
                        sc.model.enterRunning();
                        sc.BUTTON_SOUND.back.play()
                    } else sc.model.enterPause() && sc.BUTTON_SOUND.submit.play();
                (sc.model.isCutscene() && sc.model.isRunning() || sc.model.message.isMenuMode()) && !ig.system.skipMode && ig.canLeavePauseMenu && !sc.model.hasActiveChoice() && !sc.arena.isPauseBlocked() && !sc.model.skipBlock && sc.control.skipCutscene() && sc.model.skipCutscene();
                !sc.model.isCutscene() && sc.control.skipCutscene() && sc.skipInteract.triggerSkip();
                if (sc.control.menu() && sc.model.player.getCore(sc.PLAYER_CORE.MENU))
                    if (sc.model.isMenu()) {
                        if (sc.menu.isButtonInteractActive()) {
                            sc.model.enterRunning();
                            sc.BUTTON_SOUND.back.play()
                        }
                    } else sc.model.isRunning() && (sc.model.isCombatCooldown() ? sc.model.cancelCombatCooldown() : sc.model.isCombatMode() ? sc.BUTTON_SOUND.denied.play() : sc.model.enterMenu() && sc.BUTTON_SOUND.submit.play());
                sc.model.player.getCore(sc.PLAYER_CORE.QUEST_SWITCH) && (sc.model.isRunning() && sc.model.isGame()) && (sc.control.questCircleLeft() ? sc.quests.cycleFavQuest(-1) : sc.control.questCircleRight() && sc.quests.cycleFavQuest(1));
                if (!ig.game.isControlBlocked() && sc.model.isGame() && (sc.model.isRunning() ||
                        sc.model.isQuickMenuElementSwapEnabled()) && ig.game.playerEntity && !ig.game.playerEntity.isElementChangeBlocked() && !sc.model.player.hasOverload && !sc.control.charge()) {
                    var a = sc.control.elementModeSwitch();
                    if (a !== false) {
                        if (!a || a == sc.model.player.currentElementMode) a = sc.ELEMENT.NEUTRAL;
                        a != sc.model.player.currentElementMode && sc.model.player.setElementMode(a)
                    }(a = sc.control.elementModeScroll()) && sc.model.player.scrollElementMode(a)
                }
                if (sc.model.player.getCore(sc.PLAYER_CORE.QUICK_MENU)) {
                    a = sc.options.get("quick-menu-access");
                    if (a == sc.QUICK_MENU_ACCESS.HOLD)
                        if (sc.control.quickmenu()) {
                            if (!sc.quickmodel.activeState && sc.model.enterQuickMenu()) {
                                sc.quickmodel.activeState = true;
                                sc.BUTTON_SOUND.quickAppear.play()
                            }
                        } else {
                            if (sc.quickmodel.activeState) {
                                sc.quickmodel.activeState = false;
                                if (sc.quickmodel.visible) {
                                    sc.model.enterRunning();
                                    sc.BUTTON_SOUND.quickHide.play()
                                }
                            }
                        }
                    else if (a == sc.QUICK_MENU_ACCESS.PRESS && sc.control.quickmenuPress())
                        if (sc.model.isQuickMenu()) {
                            sc.model.enterRunning();
                            sc.BUTTON_SOUND.quickHide.play()
                        } else sc.model.enterQuickMenu() &&
                            sc.BUTTON_SOUND.quickAppear.play()
                }
                if (ig.platform == ig.PLATFORM_TYPES.DESKTOP && ig.input.pressed("fullscreen")) {
                    sc.options.set("fullscreen", !sc.options.get("fullscreen"));
                    sc.options.persistOptions()
                }
                if (ig.input.pressed("snapshot")) {
                    a = ig.system.canvas.toDataURL("image/png");
                    if (ig.platform == ig.PLATFORM_TYPES.DESKTOP)
                        if (ig.nwjsVersion && ig.nwjsVersion[1] >= 3E3) {
                            require("nw.gui").Window.open(a, {
                                min_width: 1136,
                                min_height: 640
                            });
                            nw.Clipboard.get().set(a, "png", false)
                        } else window.open(a);
                    else window.SHOW_SCREENSHOT(a)
                }
            }
        }
    });
    sc.ATTACK_INPUT_DISTANCE = 48;
    sc.Control = ig.Class.extend({
        repeater: new ig.PressRepeater,
        repeaterPressed: false,
        autoControl: null,
        _getAttackButton: function() {
            return sc.options.get("gamepad-attack") ? ig.BUTTONS.RIGHT_TRIGGER : ig.BUTTONS.RIGHT_SHOULDER
        },
        _getSpecialButton: function() {
            return sc.options.get("gamepad-attack") ? ig.BUTTONS.RIGHT_SHOULDER : ig.BUTTONS.RIGHT_TRIGGER
        },
        _getDashButton: function() {
            return sc.options.get("gamepad-dash") ? ig.BUTTONS.LEFT_TRIGGER : ig.BUTTONS.LEFT_SHOULDER
        },
        _getQuickMenuButton: function() {
            return sc.options.get("gamepad-dash") ?
                ig.BUTTONS.LEFT_SHOULDER : ig.BUTTONS.LEFT_TRIGGER
        },
        _getMeleeButton: function() {
            return ig.BUTTONS.FACE2
        },
        setAutoControl: function(a) {
            this.autoControl = a
        },
        getMouseX: function() {
            return this.autoControl ? this.autoControl.get("mouseX") : ig.input.mouse.x
        },
        getMouseY: function() {
            return this.autoControl ? this.autoControl.get("mouseY") : ig.input.mouse.y
        },
        getGuiClickPre: function() {
            return this.autoControl ? true : ig.input.pressed("aim")
        },
        getGuiClick: function() {
            return this.autoControl ? ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE &&
                this.autoControl.get("menuConfirm") : ig.input.keyupd("aim")
        },
        getGuiPressed: function() {
            return this.autoControl ? false : ig.input.pressed("aim")
        },
        getGuiHold: function() {
            return this.autoControl ? false : ig.input.state("aim")
        },
        getAxesValue: function(a) {
            if (this.autoControl) {
                if (a == ig.AXES.LEFT_STICK_X) return this.autoControl.get("axisLeftX");
                if (a == ig.AXES.LEFT_STICK_Y) return this.autoControl.get("axisLeftY");
                if (a == ig.AXES.RIGHT_STICK_X) return this.autoControl.get("axisRightX");
                if (a == ig.AXES.RIGHT_STICK_Y) return this.autoControl.get("axisRightY");
                throw Error("Unknown Axis: " + a);
            }
            return ig.gamepad.getAxesValue(a)
        },
        isLeftStickDown: function() {
            return this.autoControl ? this.autoControl.get("leftStickDown") : ig.gamepad.isLeftStickDown()
        },
        isRightStickDown: function() {
            return this.autoControl ? this.autoControl.get("rightStickDown") : ig.gamepad.isRightStickDown()
        },
        updateRepeater: function() {
            ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_SHOULDER) ? this.repeater.setDown("scrollUp") : ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_SHOULDER) && this.repeater.setDown("scrollDown");
            this.repeaterPressed = this.repeater.getPressed()
        },
        aimStart: function() {
            return this.autoControl ? this.autoControl.get("aimStart") : ig.input.pressed("aim") || ig.gamepad.isRightStickDown()
        },
        aiming: function() {
            return this.autoControl ? this.autoControl.get("aiming") : ig.input.state("aim") || ig.gamepad.isRightStickDown()
        },
        attacking: function() {
            return this.autoControl ? this.autoControl.get("attacking") : ig.input.pressed("aim") && b() < sc.ATTACK_INPUT_DISTANCE || !ig.gamepad.isRightStickDown() && ig.gamepad.isButtonPressed(this._getAttackButton())
        },
        fullScreenAttacking: function() {
            return this.autoControl ? this.autoControl.get("attacking") : ig.input.pressed("aim") || ig.gamepad.isButtonPressed(this._getAttackButton())
        },
        chargeThrowSwap: function() {
            return this.autoControl ? false : ig.input.state("aim") && b() >= sc.ATTACK_INPUT_DISTANCE || ig.gamepad.isRightStickDown()
        },
        chargeAttackSwap: function() {
            return this.autoControl ? false : ig.input.pressed("aim") && b() < sc.ATTACK_INPUT_DISTANCE || ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && !ig.gamepad.isRightStickDown()
        },
        thrown: function() {
            return this.autoControl ? this.autoControl.get("thrown") : ig.input.keyupd("aim") || ig.gamepad.isRightStickDown() && ig.gamepad.isButtonPressed(this._getAttackButton())
        },
        melee: function() {
            return this.autoControl ? this.autoControl.get("melee") : ig.input.pressed("melee") || ig.gamepad.isButtonPressed(this._getMeleeButton())
        },
        charge: function() {
            return this.autoControl ? this.autoControl.get("charge") : ig.input.state("special") || ig.gamepad.isButtonDown(this._getSpecialButton())
        },
        autoThrown: function() {
            return this.autoControl ?
                false : ig.gamepad.isRightStickDown() && ig.gamepad.isButtonDown(this._getAttackButton())
        },
        dashing: function() {
            return this.autoControl ? this.autoControl.get("dashing") : ig.input.pressed("dash") || ig.input.pressed("dash2") || ig.gamepad.isButtonPressed(this._getDashButton())
        },
        dashHold: function() {
            return this.autoControl ? this.autoControl.get("dashHold") : ig.input.state("dash") || ig.input.state("dash2") || ig.gamepad.isButtonDown(this._getDashButton())
        },
        guarding: function() {
            return this.autoControl ? this.autoControl.get("guarding") :
                (ig.input.state("dash") || ig.input.state("guard") || ig.gamepad.isButtonDown(ig.BUTTONS.FACE1) || ig.gamepad.isButtonDown(this._getDashButton())) && !ig.interact.isBlocked()
        },
        moveDir: function(b, d, f) {
            if (this.autoControl) {
                b.x = this.autoControl.get("moveDirX");
                b.y = this.autoControl.get("moveDirY");
                return 1
            }
            if (ig.gamepad.isLeftStickDown()) {
                b.x = ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X, true);
                b.y = ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y, true);
                if (!f)
                    if (Vec2.dot(b, a) >= 0) {
                        var f = Vec2.length(b),
                            g = f > 0.8 ? 1 : f * f /
                            0.64;
                        d > g && (g = d * 0.8 + 0.2 * g)
                    } else {
                        Vec2.assignC(b, 0, 0);
                        g = 0
                    } Vec2.assign(a, b);
                return g
            }
            b.x = b.y = 0;
            if (ig.input.state("left")) b.x = -1;
            else if (ig.input.state("right")) b.x = 1;
            if (ig.input.state("up")) b.y = -1;
            else if (ig.input.state("down")) b.y = 1;
            return b.x || b.y ? 1 : 0
        },
        pause: function() {
            return this.autoControl ? this.autoControl.get("pause") : ig.input.pressed("pause") || ig.gamepad.isButtonPressed(ig.BUTTONS.START)
        },
        menu: function() {
            return this.autoControl ? this.autoControl.get("menu") : ig.input.pressed("menu") || ig.gamepad.isButtonPressed(ig.BUTTONS.SELECT)
        },
        quickmenu: function() {
            return this.autoControl ? this.autoControl.get("quickmenu") : ig.input.state("quick") || ig.gamepad.isButtonDown(this._getQuickMenuButton())
        },
        quickmenuPress: function() {
            return this.autoControl ? this.autoControl.get("quickmenu") : ig.input.pressed("quick") || ig.gamepad.isButtonPressed(this._getQuickMenuButton())
        },
        skipCutscene: function() {
            return this.autoControl ? this.autoControl.get("skipCutscene") : ig.input.pressed("skip-cutscene") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE3)
        },
        menuConfirm: function() {
            return this.autoControl ?
                ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && this.autoControl.get("menuConfirm") : (ig.input.pressed("confirm") || ig.input.pressed("special") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE0)) && !ig.interact.isBlocked()
        },
        menuBack: function() {
            return this.autoControl ? this.autoControl.get("menuBack") : ig.input.pressed("pause") || ig.input.pressed("back") || ig.input.pressed("dash") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE1)
        },
        menuHotkeyHelp: function() {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp") :
                ig.input.pressed("help") || ig.gamepad.isButtonPressed(ig.BUTTONS.START)
        },
        menuHotkeyHelp2: function() {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp2") : ig.input.pressed("help2") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE2)
        },
        menuHotkeyHelp3: function() {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp3") : ig.input.pressed("help3") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE3)
        },
        menuHotkeyHelp4: function() {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp4") : ig.input.pressed("help4") ||
                ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_STICK)
        },
        menuSkillLeft: function(a) {
            if (this.autoControl) return this.autoControl.get("menuSkillLeft");
            a = a != void 0 ? a : 0.8;
            return ig.input.state("left") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) < -a
        },
        menuSkillRight: function(a) {
            if (this.autoControl) return this.autoControl.get("menuSkillRight");
            a = a != void 0 ? a : 0.8;
            return ig.input.state("right") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) > a
        },
        menuSkillUp: function(a) {
            if (this.autoControl) return this.autoControl.get("menuSkillUp");
            a = a != void 0 ? a : 0.8;
            return ig.input.state("up") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -a
        },
        menuSkillDown: function(a) {
            if (this.autoControl) return this.autoControl.get("menuSkillDown");
            a = a != void 0 ? a : 0.8;
            return ig.input.state("down") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > a
        },
        menuCircleLeft: function() {
            return this.autoControl ? this.autoControl.get("menuCircleLeft") : ig.input.pressed("circle-left") || ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER)
        },
        menuCircleRight: function() {
            return this.autoControl ?
                this.autoControl.get("menuCircleRight") : ig.input.pressed("circle-right") || ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER)
        },
        menuListUp: function() {
            return this.autoControl ? this.autoControl.get("menuListUp") : ig.input.pressed("left") || ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_TRIGGER)
        },
        menuListDown: function() {
            return this.autoControl ? this.autoControl.get("menuListDown") : ig.input.pressed("right") || ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_TRIGGER)
        },
        questCircleLeft: function() {
            return this.autoControl ?
                this.autoControl.get("questCircleLeft") : ig.input.pressed("circle-left") || ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_STICK)
        },
        questCircleRight: function() {
            return this.autoControl ? this.autoControl.get("questCircleRight") : ig.input.pressed("circle-right") || ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_STICK)
        },
        menuMapLeftDown: function(a) {
            a = a != void 0 ? a : 0.8;
            return ig.input.state("left") || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) < -a || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) < -a
        },
        menuMapRightDown: function(a) {
            a =
                a != void 0 ? a : 0.8;
            return ig.input.state("right") || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) > a || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) > a
        },
        menuMapUpDown: function(a) {
            a = a != void 0 ? a : 0.8;
            return ig.input.state("up") || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) < -a || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -a
        },
        menuMapDownDown: function(a) {
            a = a != void 0 ? a : 0.8;
            return ig.input.state("down") || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) > a || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > a
        },
        menuScrollUp: function() {
            return this.autoControl ?
                this.autoControl.get("menuScrollUp") : ig.input.pressed("scrollUp")
        },
        menuScrollDown: function() {
            return this.autoControl ? this.autoControl.get("menuScrollDown") : ig.input.pressed("scrollDown")
        },
        arenaScrollUp: function() {
            return this.autoControl ? this.autoControl.get("arenaScrollUp") : ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8
        },
        arenaScrollDown: function() {
            return this.autoControl ? this.autoControl.get("arenaScrollDown") : ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8
        },
        scrollUp: function() {
            return this.autoControl ?
                this.autoControl.get("scrollUp") : ig.input.pressed("scrollUp") || this.repeaterPressed == "scrollUp"
        },
        scrollDown: function() {
            return this.autoControl ? this.autoControl.get("scrollDown") : ig.input.pressed("scrollDown") || this.repeaterPressed == "scrollDown"
        },
        interactPressed: function(a, b) {
            return !b && this.autoControl ? this.autoControl.get("interactPressed") : ig.input.pressed("aim") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE0) || ig.input.pressed("confirm") || (a ? this.menuBack() : false)
        },
        interactDown: function() {
            return this.autoControl ?
                this.autoControl.get("interactDown") : ig.input.state("aim") || ig.gamepad.isButtonDown(ig.BUTTONS.FACE0)
        },
        leftPressed: function() {
            return this.autoControl ? this.autoControl.get("leftPressed") : ig.input.pressed("left") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT)
        },
        rightPressed: function() {
            return this.autoControl ? this.autoControl.get("rightPressed") : ig.input.pressed("right") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT)
        },
        upPressed: function() {
            return this.autoControl ? this.autoControl.get("upPressed") :
                ig.input.pressed("up") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP)
        },
        downPressed: function() {
            return this.autoControl ? this.autoControl.get("downPressed") : ig.input.pressed("down") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_DOWN)
        },
        leftPressedSticks: function() {
            return this.autoControl ? this.autoControl.get("leftPressedSticks") : ig.input.pressed("left") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) < -0.8 || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) <
                -0.8
        },
        rightPressedSticks: function() {
            return this.autoControl ? this.autoControl.get("rightPressedSticks") : ig.input.pressed("right") || !sc.model.isQuickMenuElementSwapEnabled() && ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT) || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) > 0.8 || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) > 0.8
        },
        upPressedSticks: function() {
            return this.autoControl ? this.autoControl.get("upPressedSticks") : ig.input.pressed("up") || !sc.model.isQuickMenuElementSwapEnabled() && ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_UP) ||
                ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) < -0.8 || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8
        },
        downPressedSticks: function() {
            return this.autoControl ? this.autoControl.get("downPressedSticks") : ig.input.pressed("down") || !sc.model.isQuickMenuElementSwapEnabled() && ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_DOWN) || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) > 0.8 || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8
        },
        leftDown: function() {
            return this.autoControl ? this.autoControl.get("menuLeft") : ig.input.state("left") ||
                !sc.model.isQuickMenuElementSwapEnabled() && ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_LEFT) || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) < -0.8
        },
        rightDown: function() {
            return this.autoControl ? this.autoControl.get("menuRight") : ig.input.state("right") || !sc.model.isQuickMenuElementSwapEnabled() && ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_RIGHT) || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) > 0.8
        },
        upDown: function() {
            return this.autoControl ? this.autoControl.get("menuUp") : ig.input.state("up") || !sc.model.isQuickMenuElementSwapEnabled() &&
                ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_UP) || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) < -0.8
        },
        downDown: function() {
            return this.autoControl ? this.autoControl.get("menuDown") : ig.input.state("down") || !sc.model.isQuickMenuElementSwapEnabled() && ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_DOWN) || ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) > 0.8
        },
        loreDown: function() {
            return this.autoControl ? this.autoControl.get("loreDown") : ig.input.state("right") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8 || ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_RIGHT)
        },
        loreUp: function() {
            return this.autoControl ? this.autoControl.get("loreDown") : ig.input.state("left") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8 || ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_LEFT)
        },
        elementModeScroll: function() {
            if (this.autoControl || !sc.options.get("element-wheel")) return 0;
            if (ig.input.pressed("scrollUp")) return -1;
            if (ig.input.pressed("scrollDown")) return 1
        },
        elementModeSwitch: function() {
            return this.autoControl ? this.autoControl.get("heatMode") ? sc.ELEMENT.HEAT : this.autoControl.get("coldMode") ?
                sc.ELEMENT.COLD : this.autoControl.get("shockMode") ? sc.ELEMENT.SHOCK : this.autoControl.get("waveMode") ? sc.ELEMENT.WAVE : false : ig.input.pressed("neutral") ? sc.ELEMENT.NEUTRAL : ig.input.pressed("heat") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_DOWN) ? sc.ELEMENT.HEAT : ig.input.pressed("cold") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP) ? sc.ELEMENT.COLD : ig.input.pressed("shock") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT) ? sc.ELEMENT.SHOCK : ig.input.pressed("wave") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) ?
                sc.ELEMENT.WAVE : false
        }
    });
    var d = Vec2.create();
    sc.control = new sc.Control;
    ig.addGameAddon(function() {
        return sc.globalinput = new sc.GlobalInput
    })
});
ig.baked = !0;
