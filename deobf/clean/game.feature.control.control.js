/**
 * game.feature.control.control
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.control.control")`.
 *
 * Global input routing (`sc.Control`) and the global input addon
 * (`sc.GlobalInput`). Maps keyboard, mouse, and gamepad input to the
 * high-level actions the game uses: attacking, dashing, guarding, charging,
 * menu navigation, element switching, etc. Also handles cursor-style
 * switching between melee/throw/pointer icons based on distance to the
 * player entity.
 */
ig.module("game.feature.control.control").requires(
    "impact.base.game",
    "impact.feature.interact.press-repeater",
    "impact.feature.gui.gui"
).defines(function () {

    /**
     * Compute the screen-space distance between the mouse cursor and
     * the player's aim point. Used to decide between melee and throw
     * cursor icons.
     * @returns {number} distance in screen pixels
     */
    function getAimDistance() {
        var player = ig.game.playerEntity;
        if (!player || !sc.options.get("close-combat-input")) return 9999;
        var coll = player.coll;
        ig.system.getScreenFromMapPos(
            screenPos,
            coll.pos.x + coll.size.x / 2,
            coll.pos.y + coll.size.y / 2 - coll.pos.z - Constants.BALL_HEIGHT - Constants.BALL_SIZE / 2
        );
        return Vec2.distance(screenPos, ig.input.mouse) / ig.system.zoom;
    }

    /** Sticky previous-frame move direction for gamepad smoothing. */
    var lastMoveDir = Vec2.create();

    ig.canLeavePauseMenu = true;

    /* ── sc.GlobalInput — per-frame input router ─────────────────── */

    sc.GlobalInput = ig.GameAddon.extend({
        init: function () {
            this.parent("GlobalInput");
            ig.gui.setControlModule(sc.control);
            ig.system.cancelFocusLostCallback = function () {
                ig.gamepad.onPreUpdate();
                return sc.control.menuBack();
            };
        },

        preUpdateOrder: 5,
        onPreUpdate: function () {
            var isPlayerActive = !ig.game.paused && sc.model.isRunning() &&
                sc.model.isGame() && ig.game.playerEntity &&
                !ig.game.playerEntity.isControlBlocked();

            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                ig.system.setCursorType("none");
            } else if (ig.input.mouseOutOfScreen()) {
                ig.system.clearCursorType();
            } else if (isPlayerActive) {
                var hasMelee = sc.model.player.getCore(sc.PLAYER_CORE.CLOSE_COMBAT);
                var hasThrow = sc.model.player.getCore(sc.PLAYER_CORE.THROWING);
                if (!hasMelee && !hasThrow) {
                    ig.system.setCursorType("pointer");
                } else if (hasThrow) {
                    ig.system.setCursorType(
                        hasMelee
                            ? (getAimDistance() < sc.ATTACK_INPUT_DISTANCE
                                ? "melee" : "throw")
                            : "throw"
                    );
                } else {
                    ig.system.setCursorType("melee");
                }
            } else {
                ig.system.setCursorType("pointer");
            }

            sc.control.updateRepeater();
        },

        postUpdateOrder: 8999,
        onPostUpdate: function () {
            if (ig.loading) return;

            // Pause toggle.
            if ((sc.control.pause() || sc.model.isPaused() && sc.control.menuBack()) &&
                ig.canLeavePauseMenu && !sc.arena.isPauseBlocked()) {
                if (sc.model.isPaused()) {
                    sc.model.enterRunning();
                    sc.BUTTON_SOUND.back.play();
                } else {
                    sc.model.enterPause() && sc.BUTTON_SOUND.submit.play();
                }
            }

            // Skip cutscene.
            if ((sc.model.isCutscene() && sc.model.isRunning() ||
                sc.model.message.isMenuMode()) &&
                !ig.system.skipMode && ig.canLeavePauseMenu &&
                !sc.model.hasActiveChoice() && !sc.arena.isPauseBlocked() &&
                !sc.model.skipBlock && sc.control.skipCutscene()) {
                sc.model.skipCutscene();
            }
            if (!sc.model.isCutscene() && sc.control.skipCutscene()) {
                sc.skipInteract.triggerSkip();
            }

            // Menu toggle.
            if (sc.control.menu() && sc.model.player.getCore(sc.PLAYER_CORE.MENU)) {
                if (sc.model.isMenu()) {
                    if (sc.menu.isButtonInteractActive()) {
                        sc.model.enterRunning();
                        sc.BUTTON_SOUND.back.play();
                    }
                } else if (sc.model.isRunning()) {
                    if (sc.model.isCombatCooldown()) {
                        sc.model.cancelCombatCooldown();
                    } else if (sc.model.isCombatMode()) {
                        sc.BUTTON_SOUND.denied.play();
                    } else {
                        sc.model.enterMenu() && sc.BUTTON_SOUND.submit.play();
                    }
                }
            }

            // Quest circle.
            if (sc.model.player.getCore(sc.PLAYER_CORE.QUEST_SWITCH) &&
                sc.model.isRunning() && sc.model.isGame()) {
                sc.control.questCircleLeft()
                    ? sc.quests.cycleFavQuest(-1)
                    : sc.control.questCircleRight() && sc.quests.cycleFavQuest(1);
            }

            // Element mode switching (heat/cold/shock/wave/neutral).
            if (!ig.game.isControlBlocked() && sc.model.isGame() &&
                (sc.model.isRunning() || sc.model.isQuickMenuElementSwapEnabled()) &&
                ig.game.playerEntity && !ig.game.playerEntity.isElementChangeBlocked() &&
                !sc.model.player.hasOverload && !sc.control.charge()) {

                var elementInput = sc.control.elementModeSwitch();
                if (elementInput !== false) {
                    if (!elementInput || elementInput == sc.model.player.currentElementMode) {
                        elementInput = sc.ELEMENT.NEUTRAL;
                    }
                    if (elementInput != sc.model.player.currentElementMode) {
                        sc.model.player.setElementMode(elementInput);
                    }
                }

                var scrollInput = sc.control.elementModeScroll();
                if (scrollInput) sc.model.player.scrollElementMode(scrollInput);
            }

            // Quick menu.
            if (sc.model.player.getCore(sc.PLAYER_CORE.QUICK_MENU)) {
                var accessMode = sc.options.get("quick-menu-access");
                if (accessMode == sc.QUICK_MENU_ACCESS.HOLD) {
                    if (sc.control.quickmenu()) {
                        if (!sc.quickmodel.activeState && sc.model.enterQuickMenu()) {
                            sc.quickmodel.activeState = true;
                            sc.BUTTON_SOUND.quickAppear.play();
                        }
                    } else {
                        if (sc.quickmodel.activeState) {
                            sc.quickmodel.activeState = false;
                            if (sc.quickmodel.visible) {
                                sc.model.enterRunning();
                                sc.BUTTON_SOUND.quickHide.play();
                            }
                        }
                    }
                } else if (accessMode == sc.QUICK_MENU_ACCESS.PRESS && sc.control.quickmenuPress()) {
                    if (sc.model.isQuickMenu()) {
                        sc.model.enterRunning();
                        sc.BUTTON_SOUND.quickHide.play();
                    } else {
                        sc.model.enterQuickMenu() && sc.BUTTON_SOUND.quickAppear.play();
                    }
                }
            }

            // Fullscreen toggle (desktop only).
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP && ig.input.pressed("fullscreen")) {
                sc.options.set("fullscreen", !sc.options.get("fullscreen"));
                sc.options.persistOptions();
            }

            // Screenshot.
            if (ig.input.pressed("snapshot")) {
                var dataUrl = ig.system.canvas.toDataURL("image/png");
                if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                    if (ig.nwjsVersion && ig.nwjsVersion[1] >= 3000) {
                        require("nw.gui").Window.open(dataUrl, {
                            min_width: 1136,
                            min_height: 640
                        });
                        nw.Clipboard.get().set(dataUrl, "png", false);
                    } else {
                        window.open(dataUrl);
                    }
                } else {
                    window.SHOW_SCREENSHOT(dataUrl);
                }
            }
        }
    });

    /* ── sc.Control — input polling object ───────────────────────── */

    sc.ATTACK_INPUT_DISTANCE = 48;

    sc.Control = ig.Class.extend({
        repeater: new ig.PressRepeater,
        repeaterPressed: false,
        autoControl: null,

        /** Which button is the attack trigger when gamepad-attack is enabled. */
        _getAttackButton: function () {
            return sc.options.get("gamepad-attack")
                ? ig.BUTTONS.RIGHT_TRIGGER : ig.BUTTONS.RIGHT_SHOULDER;
        },

        /** Which button is the special attack / charge trigger. */
        _getSpecialButton: function () {
            return sc.options.get("gamepad-attack")
                ? ig.BUTTONS.RIGHT_SHOULDER : ig.BUTTONS.RIGHT_TRIGGER;
        },

        /** Which button is the dash trigger. */
        _getDashButton: function () {
            return sc.options.get("gamepad-dash")
                ? ig.BUTTONS.LEFT_TRIGGER : ig.BUTTONS.LEFT_SHOULDER;
        },

        /** Which button is the quick-menu toggle. */
        _getQuickMenuButton: function () {
            return sc.options.get("gamepad-dash")
                ? ig.BUTTONS.LEFT_SHOULDER : ig.BUTTONS.LEFT_TRIGGER;
        },

        _getMeleeButton: function () {
            return ig.BUTTONS.FACE2;
        },

        /** @param {object} [autoCtrl] an auto-control provider (for AI/recording playback) */
        setAutoControl: function (autoCtrl) {
            this.autoControl = autoCtrl;
        },

        /* ── Mouse / GUI input ──────────────────────────────────── */

        getMouseX: function () {
            return this.autoControl ? this.autoControl.get("mouseX") : ig.input.mouse.x;
        },
        getMouseY: function () {
            return this.autoControl ? this.autoControl.get("mouseY") : ig.input.mouse.y;
        },
        getGuiClickPre: function () {
            return this.autoControl ? true : ig.input.pressed("aim");
        },
        getGuiClick: function () {
            return this.autoControl
                ? ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE &&
                  this.autoControl.get("menuConfirm")
                : ig.input.keyupd("aim");
        },
        getGuiPressed: function () {
            return this.autoControl ? false : ig.input.pressed("aim");
        },
        getGuiHold: function () {
            return this.autoControl ? false : ig.input.state("aim");
        },

        /* ── Gamepad axes ────────────────────────────────────────── */

        getAxesValue: function (axis) {
            if (this.autoControl) {
                if (axis == ig.AXES.LEFT_STICK_X) return this.autoControl.get("axisLeftX");
                if (axis == ig.AXES.LEFT_STICK_Y) return this.autoControl.get("axisLeftY");
                if (axis == ig.AXES.RIGHT_STICK_X) return this.autoControl.get("axisRightX");
                if (axis == ig.AXES.RIGHT_STICK_Y) return this.autoControl.get("axisRightY");
                throw Error("Unknown Axis: " + axis);
            }
            return ig.gamepad.getAxesValue(axis);
        },
        isLeftStickDown: function () {
            return this.autoControl ? this.autoControl.get("leftStickDown") : ig.gamepad.isLeftStickDown();
        },
        isRightStickDown: function () {
            return this.autoControl ? this.autoControl.get("rightStickDown") : ig.gamepad.isRightStickDown();
        },

        /* ── Repeater (shoulder-button scrolling) ────────────────── */

        updateRepeater: function () {
            ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_SHOULDER)
                ? this.repeater.setDown("scrollUp")
                : ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_SHOULDER) &&
                  this.repeater.setDown("scrollDown");
            this.repeaterPressed = this.repeater.getPressed();
        },

        /* ── Combat input ────────────────────────────────────────── */

        aimStart: function () {
            return this.autoControl ? this.autoControl.get("aimStart")
                : ig.input.pressed("aim") || ig.gamepad.isRightStickDown();
        },
        aiming: function () {
            return this.autoControl ? this.autoControl.get("aiming")
                : ig.input.state("aim") || ig.gamepad.isRightStickDown();
        },
        attacking: function () {
            return this.autoControl ? this.autoControl.get("attacking")
                : (ig.input.pressed("aim") && getAimDistance() < sc.ATTACK_INPUT_DISTANCE) ||
                  (!ig.gamepad.isRightStickDown() && ig.gamepad.isButtonPressed(this._getAttackButton()));
        },
        fullScreenAttacking: function () {
            return this.autoControl ? this.autoControl.get("attacking")
                : ig.input.pressed("aim") || ig.gamepad.isButtonPressed(this._getAttackButton());
        },
        chargeThrowSwap: function () {
            return this.autoControl ? false
                : (ig.input.state("aim") && getAimDistance() >= sc.ATTACK_INPUT_DISTANCE) ||
                  ig.gamepad.isRightStickDown();
        },
        chargeAttackSwap: function () {
            return this.autoControl ? false
                : (ig.input.pressed("aim") && getAimDistance() < sc.ATTACK_INPUT_DISTANCE) ||
                  (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && !ig.gamepad.isRightStickDown());
        },
        thrown: function () {
            return this.autoControl ? this.autoControl.get("thrown")
                : ig.input.keyupd("aim") ||
                  (ig.gamepad.isRightStickDown() && ig.gamepad.isButtonPressed(this._getAttackButton()));
        },
        melee: function () {
            return this.autoControl ? this.autoControl.get("melee")
                : ig.input.pressed("melee") || ig.gamepad.isButtonPressed(this._getMeleeButton());
        },
        charge: function () {
            return this.autoControl ? this.autoControl.get("charge")
                : ig.input.state("special") || ig.gamepad.isButtonDown(this._getSpecialButton());
        },
        autoThrown: function () {
            return this.autoControl ? false
                : ig.gamepad.isRightStickDown() && ig.gamepad.isButtonDown(this._getAttackButton());
        },
        dashing: function () {
            return this.autoControl ? this.autoControl.get("dashing")
                : ig.input.pressed("dash") || ig.input.pressed("dash2") ||
                  ig.gamepad.isButtonPressed(this._getDashButton());
        },
        dashHold: function () {
            return this.autoControl ? this.autoControl.get("dashHold")
                : ig.input.state("dash") || ig.input.state("dash2") ||
                  ig.gamepad.isButtonDown(this._getDashButton());
        },
        guarding: function () {
            return this.autoControl ? this.autoControl.get("guarding")
                : (ig.input.state("dash") || ig.input.state("guard") ||
                   ig.gamepad.isButtonDown(ig.BUTTONS.FACE1) ||
                   ig.gamepad.isButtonDown(this._getDashButton())) &&
                  !ig.interact.isBlocked();
        },

        /**
         * Read the movement direction.
         * @param {Vec2} outDir — receives the direction
         * @param {number} prevMag — magnitude from the previous frame (for smoothing)
         * @param {boolean} [noSmooth] skip gamepad stick smoothing
         * @returns {number} current magnitude (0..1)
         */
        moveDir: function (outDir, prevMag, noSmooth) {
            if (this.autoControl) {
                outDir.x = this.autoControl.get("moveDirX");
                outDir.y = this.autoControl.get("moveDirY");
                return 1;
            }
            if (ig.gamepad.isLeftStickDown()) {
                outDir.x = ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X, true);
                outDir.y = ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y, true);
                var magnitude;
                if (!noSmooth) {
                    if (Vec2.dot(outDir, lastMoveDir) >= 0) {
                        magnitude = Vec2.length(outDir);
                        magnitude = magnitude > 0.8 ? 1 : magnitude * magnitude / 0.64;
                        if (prevMag > magnitude) magnitude = prevMag * 0.8 + 0.2 * magnitude;
                    } else {
                        Vec2.assignC(outDir, 0, 0);
                        magnitude = 0;
                    }
                }
                Vec2.assign(lastMoveDir, outDir);
                return magnitude;
            }
            outDir.x = outDir.y = 0;
            if (ig.input.state("left")) outDir.x = -1;
            else if (ig.input.state("right")) outDir.x = 1;
            if (ig.input.state("up")) outDir.y = -1;
            else if (ig.input.state("down")) outDir.y = 1;
            return outDir.x || outDir.y ? 1 : 0;
        },

        /* ── Menu / system input ─────────────────────────────────── */

        pause: function () {
            return this.autoControl ? this.autoControl.get("pause")
                : ig.input.pressed("pause") || ig.gamepad.isButtonPressed(ig.BUTTONS.START);
        },
        menu: function () {
            return this.autoControl ? this.autoControl.get("menu")
                : ig.input.pressed("menu") || ig.gamepad.isButtonPressed(ig.BUTTONS.SELECT);
        },
        quickmenu: function () {
            return this.autoControl ? this.autoControl.get("quickmenu")
                : ig.input.state("quick") || ig.gamepad.isButtonDown(this._getQuickMenuButton());
        },
        quickmenuPress: function () {
            return this.autoControl ? this.autoControl.get("quickmenu")
                : ig.input.pressed("quick") || ig.gamepad.isButtonPressed(this._getQuickMenuButton());
        },
        skipCutscene: function () {
            return this.autoControl ? this.autoControl.get("skipCutscene")
                : ig.input.pressed("skip-cutscene") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE3);
        },
        menuConfirm: function () {
            return this.autoControl
                ? ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD &&
                  this.autoControl.get("menuConfirm")
                : (ig.input.pressed("confirm") || ig.input.pressed("special") ||
                   ig.gamepad.isButtonPressed(ig.BUTTONS.FACE0)) && !ig.interact.isBlocked();
        },
        menuBack: function () {
            return this.autoControl ? this.autoControl.get("menuBack")
                : ig.input.pressed("pause") || ig.input.pressed("back") ||
                  ig.input.pressed("dash") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE1);
        },

        /* ── Menu hotkeys ────────────────────────────────────────── */

        menuHotkeyHelp: function () {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp")
                : ig.input.pressed("help") || ig.gamepad.isButtonPressed(ig.BUTTONS.START);
        },
        menuHotkeyHelp2: function () {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp2")
                : ig.input.pressed("help2") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE2);
        },
        menuHotkeyHelp3: function () {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp3")
                : ig.input.pressed("help3") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE3);
        },
        menuHotkeyHelp4: function () {
            return this.autoControl ? this.autoControl.get("menuHotkeyHelp4")
                : ig.input.pressed("help4") || ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_STICK);
        },

        /* ── Skill tree / circuit navigation ─────────────────────── */

        menuSkillLeft: function (threshold) {
            if (this.autoControl) return this.autoControl.get("menuSkillLeft");
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("left") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) < -threshold;
        },
        menuSkillRight: function (threshold) {
            if (this.autoControl) return this.autoControl.get("menuSkillRight");
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("right") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) > threshold;
        },
        menuSkillUp: function (threshold) {
            if (this.autoControl) return this.autoControl.get("menuSkillUp");
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("up") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -threshold;
        },
        menuSkillDown: function (threshold) {
            if (this.autoControl) return this.autoControl.get("menuSkillDown");
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("down") || ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > threshold;
        },

        /* ── Circle navigation (circuit/tab switching) ───────────── */

        menuCircleLeft: function () {
            return this.autoControl ? this.autoControl.get("menuCircleLeft")
                : ig.input.pressed("circle-left") || ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER);
        },
        menuCircleRight: function () {
            return this.autoControl ? this.autoControl.get("menuCircleRight")
                : ig.input.pressed("circle-right") || ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER);
        },
        menuListUp: function () {
            return this.autoControl ? this.autoControl.get("menuListUp")
                : ig.input.pressed("left") || ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_TRIGGER);
        },
        menuListDown: function () {
            return this.autoControl ? this.autoControl.get("menuListDown")
                : ig.input.pressed("right") || ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_TRIGGER);
        },

        /* ── Quest circle (stick buttons) ────────────────────────── */

        questCircleLeft: function () {
            return this.autoControl ? this.autoControl.get("questCircleLeft")
                : ig.input.pressed("circle-left") || ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_STICK);
        },
        questCircleRight: function () {
            return this.autoControl ? this.autoControl.get("questCircleRight")
                : ig.input.pressed("circle-right") || ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_STICK);
        },

        /* ── Map panning ─────────────────────────────────────────── */

        menuMapLeftDown: function (threshold) {
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("left") ||
                ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) < -threshold ||
                ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) < -threshold;
        },
        menuMapRightDown: function (threshold) {
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("right") ||
                ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) > threshold ||
                ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) > threshold;
        },
        menuMapUpDown: function (threshold) {
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("up") ||
                ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) < -threshold ||
                ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -threshold;
        },
        menuMapDownDown: function (threshold) {
            threshold = threshold !== void 0 ? threshold : 0.8;
            return ig.input.state("down") ||
                ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) > threshold ||
                ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > threshold;
        },

        /* ── Scrolling ───────────────────────────────────────────── */

        menuScrollUp: function () {
            return this.autoControl ? this.autoControl.get("menuScrollUp") : ig.input.pressed("scrollUp");
        },
        menuScrollDown: function () {
            return this.autoControl ? this.autoControl.get("menuScrollDown") : ig.input.pressed("scrollDown");
        },
        arenaScrollUp: function () {
            return this.autoControl ? this.autoControl.get("arenaScrollUp")
                : ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8;
        },
        arenaScrollDown: function () {
            return this.autoControl ? this.autoControl.get("arenaScrollDown")
                : ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8;
        },
        scrollUp: function () {
            return this.autoControl ? this.autoControl.get("scrollUp")
                : ig.input.pressed("scrollUp") || this.repeaterPressed == "scrollUp";
        },
        scrollDown: function () {
            return this.autoControl ? this.autoControl.get("scrollDown")
                : ig.input.pressed("scrollDown") || this.repeaterPressed == "scrollDown";
        },

        /* ── Interaction ─────────────────────────────────────────── */

        interactPressed: function (allowBack, blockBack) {
            return !blockBack && this.autoControl ? this.autoControl.get("interactPressed")
                : ig.input.pressed("aim") || ig.gamepad.isButtonPressed(ig.BUTTONS.FACE0) ||
                  ig.input.pressed("confirm") || (allowBack ? this.menuBack() : false);
        },
        interactDown: function () {
            return this.autoControl ? this.autoControl.get("interactDown")
                : ig.input.state("aim") || ig.gamepad.isButtonDown(ig.BUTTONS.FACE0);
        },

        /* ── Directional (DPAD / keyboard arrows) ────────────────── */

        leftPressed: function () {
            return this.autoControl ? this.autoControl.get("leftPressed")
                : ig.input.pressed("left") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT);
        },
        rightPressed: function () {
            return this.autoControl ? this.autoControl.get("rightPressed")
                : ig.input.pressed("right") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT);
        },
        upPressed: function () {
            return this.autoControl ? this.autoControl.get("upPressed")
                : ig.input.pressed("up") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP);
        },
        downPressed: function () {
            return this.autoControl ? this.autoControl.get("downPressed")
                : ig.input.pressed("down") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_DOWN);
        },

        /* ── Directional with sticks ─────────────────────────────── */

        leftPressedSticks: function () {
            return this.autoControl ? this.autoControl.get("leftPressedSticks")
                : ig.input.pressed("left") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) < -0.8 ||
                  ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) < -0.8;
        },
        rightPressedSticks: function () {
            return this.autoControl ? this.autoControl.get("rightPressedSticks")
                : ig.input.pressed("right") ||
                  (!sc.model.isQuickMenuElementSwapEnabled() &&
                   ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT)) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) > 0.8 ||
                  ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X) > 0.8;
        },
        upPressedSticks: function () {
            return this.autoControl ? this.autoControl.get("upPressedSticks")
                : ig.input.pressed("up") ||
                  (!sc.model.isQuickMenuElementSwapEnabled() &&
                   ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_UP)) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) < -0.8 ||
                  ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8;
        },
        downPressedSticks: function () {
            return this.autoControl ? this.autoControl.get("downPressedSticks")
                : ig.input.pressed("down") ||
                  (!sc.model.isQuickMenuElementSwapEnabled() &&
                   ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_DOWN)) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) > 0.8 ||
                  ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8;
        },

        /* ── Directional hold (DPAD/arrows/sticks) ───────────────── */

        leftDown: function () {
            return this.autoControl ? this.autoControl.get("menuLeft")
                : ig.input.state("left") ||
                  (!sc.model.isQuickMenuElementSwapEnabled() &&
                   ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_LEFT)) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) < -0.8;
        },
        rightDown: function () {
            return this.autoControl ? this.autoControl.get("menuRight")
                : ig.input.state("right") ||
                  (!sc.model.isQuickMenuElementSwapEnabled() &&
                   ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_RIGHT)) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X) > 0.8;
        },
        upDown: function () {
            return this.autoControl ? this.autoControl.get("menuUp")
                : ig.input.state("up") ||
                  (!sc.model.isQuickMenuElementSwapEnabled() &&
                   ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_UP)) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) < -0.8;
        },
        downDown: function () {
            return this.autoControl ? this.autoControl.get("menuDown")
                : ig.input.state("down") ||
                  (!sc.model.isQuickMenuElementSwapEnabled() &&
                   ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_DOWN)) ||
                  ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y) > 0.8;
        },

        /* ── Lore navigation (right stick Y + DPAD right) ────────── */

        loreDown: function () {
            return this.autoControl ? this.autoControl.get("loreDown")
                : ig.input.state("right") ||
                  ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) > 0.8 ||
                  ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_RIGHT);
        },
        loreUp: function () {
            return this.autoControl ? this.autoControl.get("loreDown")
                : ig.input.state("left") ||
                  ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y) < -0.8 ||
                  ig.gamepad.isButtonDown(ig.BUTTONS.DPAD_LEFT);
        },

        /* ── Element mode ────────────────────────────────────────── */

        elementModeScroll: function () {
            if (this.autoControl || !sc.options.get("element-wheel")) return 0;
            if (ig.input.pressed("scrollUp")) return -1;
            if (ig.input.pressed("scrollDown")) return 1;
        },
        elementModeSwitch: function () {
            return this.autoControl
                ? this.autoControl.get("heatMode") ? sc.ELEMENT.HEAT
                    : this.autoControl.get("coldMode") ? sc.ELEMENT.COLD
                    : this.autoControl.get("shockMode") ? sc.ELEMENT.SHOCK
                    : this.autoControl.get("waveMode") ? sc.ELEMENT.WAVE
                    : false
                : ig.input.pressed("neutral") ? sc.ELEMENT.NEUTRAL
                : ig.input.pressed("heat") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_DOWN) ? sc.ELEMENT.HEAT
                : ig.input.pressed("cold") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP) ? sc.ELEMENT.COLD
                : ig.input.pressed("shock") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT) ? sc.ELEMENT.SHOCK
                : ig.input.pressed("wave") || ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) ? sc.ELEMENT.WAVE
                : false;
        }
    });

    /** Reusable screen-space Vec2 for aim distance calculation. */
    var screenPos = Vec2.create();

    /* ── Singleton ───────────────────────────────────────────────── */

    sc.control = new sc.Control;
    ig.addGameAddon(function () {
        return sc.globalinput = new sc.GlobalInput;
    });
});
ig.baked = !0;