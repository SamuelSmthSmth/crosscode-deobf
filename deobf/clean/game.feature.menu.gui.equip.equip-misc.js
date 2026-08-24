/**
 * game.feature.menu.gui.equip.equip-misc
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.equip.equip-misc")`.
 *
 * Equip menu helper widgets:
 * - `sc.EquipLevelOverview`: small panel showing player level vs. average
 *   equip level with color coding (green/white/orange/red by gap).
 * - `sc.BodyPartButton`: a `sc.ButtonGui` paired with an "other" button so
 *   both share focus/pressed state (used for the head slot shown twice).
 * - `sc.BodyPartMouseButton`: a body-part slot over Lea's sprite — a
 *   button + equip icon plus a blue selection line (slope + line +
 *   connector + end cap) that animates up when the part is active and
 *   turns orange on focus.
 * - `sc.EquipMenuMiddleIcon`: the equip icon with a spawn flash animation.
 */
ig.module("game.feature.menu.gui.equip.equip-misc")
    .requires("impact.feature.gui.gui", "game.feature.gui.plug-in")
    .defines(function () {

    sc.EquipLevelOverview = sc.MenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -195
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        playerLevel: null,
        equipLevel: null,

        init: function () {
            this.parent(sc.MenuPanelType.TOP_LEFT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(53, 28);
            this.setPos(197, 28);
            this.annotation = {
                descType: "levels",
                content: {
                    title: "sc.gui.menu.equip.levels",
                    description: "sc.gui.menu.equip.descriptions.levels"
                },
                size: {
                    x: 55,
                    y: 30
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 1,
                    y: 0
                }
            };
            var label = new sc.TextGui("LVL", {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            label.setPos(3, 0);
            this.addChildGui(label);
            label = new ig.ColorGui("#cdcdcd", 51, 1);
            label.setPos(1, 7);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.player"), {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            label.setPos(21, 9);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.equip"), {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            label.setPos(21, 19);
            this.addChildGui(label);
            this.playerLevel = new sc.NumberGui(99, {
                transitionTime: 0.2
            });
            this.playerLevel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.playerLevel.setPos(2, 9);
            this.addChildGui(this.playerLevel);
            this.equipLevel = new sc.NumberGui(99, {
                transitionTime: 0.2
            });
            this.equipLevel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.equipLevel.setPos(2, 19);
            this.addChildGui(this.equipLevel);
            this.doStateTransition("HIDDEN", true)
        },

        show: function () {
            if (sc.options.get("equip-level-display")) {
                this.updateNumbers(true);
                this.doStateTransition("DEFAULT")
            }
        },

        hide: function (skipSounds) {
            this.doStateTransition("HIDDEN", skipSounds)
        },

        updateNumbers: function (skipSounds) {
            var player = sc.model.player,
                playerLevel = player.level,
                equipLevel = ~~player.getAvgEquipLevel();
            this.playerLevel.setNumber(playerLevel, skipSounds);
            this.equipLevel.setNumber(equipLevel, skipSounds);
            var diff = equipLevel - playerLevel;
            if (diff >= -2) this.setColors(sc.GUI_NUMBER_COLOR.GREEN);
            else if (diff >= -4) this.setColors(sc.GUI_NUMBER_COLOR.WHITE);
            else if (diff >= -8) this.setColors(sc.GUI_NUMBER_COLOR.ORANGE);
            else if (diff < -8) this.setColors(sc.GUI_NUMBER_COLOR.RED)
        },

        setColors: function (color) {
            this.playerLevel.setColor(color);
            this.equipLevel.setColor(color)
        }
    });

    sc.BodyPartButton = sc.ButtonGui.extend({
        otherButton: null,
        callback: null,

        init: function (text, width, buttonType, otherButton, icon) {
            this.parent(text, width, true, buttonType, null, icon);
            this.otherButton = otherButton || null
        },

        focusGained: function () {
            this.parent();
            if (this.otherButton) this.otherButton.focus = true;
            if (this.callback) this.callback(this.focus, this.pressed)
        },

        focusLost: function () {
            this.parent();
            if (this.otherButton) this.otherButton.focus = false;
            if (this.callback) this.callback(this.focus, this.pressed)
        },

        setPressed: function (pressed) {
            this.parent(pressed);
            if (this.otherButton) this.otherButton.pressed = pressed;
            if (this.callback) this.callback(this.focus, this.pressed)
        },

        setPressedAndUnFocus: function (pressed) {
            this.pressed = pressed;
            this.focus = false;
            if (this.otherButton) {
                this.otherButton.focus = false;
                this.otherButton.pressed = pressed
            }
            if (this.callback) this.callback(this.focus, this.pressed)
        },

        isSameAs: function (button) {
            return this == button || button == this.otherButton
        }
    });

    sc.BodyPartMouseButton = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        button: null,
        slope: null,
        line: null,
        connect: null,
        end: null,
        equip: null,
        sizeTransition: null,
        topY: 1,
        bottomY: 1,
        _isActiveTop: false,
        _hasLine: false,

        init: function (isRight, offsetX, slopeLength, lineWidth, topY, slopeOffsetY) {
            this.parent();
            this.topY = topY || 0;
            slopeOffsetY = slopeOffsetY || 0;
            this.button = new sc.BodyPartButton("", 39, sc.BUTTON_TYPE.EQUIP, null, true);
            this.button.callback = this._focusCallback.bind(this);
            this.button.setWidth(39);
            this.button.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_FADE: {
                    state: {
                        alpha: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.button.doStateTransition("HIDDEN", true);
            this.addChildGui(this.button);
            this.equip = new sc.EquipMenuMiddleIcon;
            this.equip.setPos(0, -1);
            this.button.addChildGui(this.equip);
            isRight = isRight || false;
            offsetX = offsetX || 0;
            slopeLength = slopeLength || 9;
            lineWidth = lineWidth || 10;
            this.slope = new sc.SlopeLine(slopeLength, true, !isRight, sc.SlopeLine_Color.BLUE);
            this.slope.setPos(offsetX, isRight ? 2 : 36 + slopeOffsetY);
            this.slope.hide();
            this.addChildGui(this.slope);
            this.line = new ig.ColorGui("#94CEFF", lineWidth, 1);
            this.line.setPos(offsetX + slopeLength, isRight ? -(slopeLength - 2) : 35 + slopeLength + slopeOffsetY);
            this.line.setPivot(0, 0);
            this.line.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_FADE: {
                    state: {
                        alpha: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.line);
            this.line.doStateTransition("HIDDEN", true);
            this.connect = new ig.ColorGui("#94CEFF", 1, 0);
            this.connect.setPos(offsetX + slopeLength + lineWidth - 1, isRight ? -(slopeLength - 2) : 35 + slopeLength + slopeOffsetY);
            this.connect.setPivot(0, 0);
            this.connect.hook.transitions = {
                DEFAULT: {
                    state: {
                        scaleY: -1
                    },
                    time: 0,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleY: -1
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.connect);
            this.connect.doStateTransition("HIDDEN", true);
            this.connect.doStateTransition("DEFAULT", true);
            this.end = new ig.ImageGui(this.gfx, 0, 403, 172, 2);
            this.end.setPos(slopeLength + offsetX + lineWidth, isRight ? -(slopeLength - 2) : 35 + slopeLength + slopeOffsetY);
            this.end.setPivot(0, 0);
            this.end.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_FADE: {
                    state: {
                        alpha: 0,
                        scaleX: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.bottomY = this.end.hook.pos.y;
            this.addChildGui(this.end);
            this.end.doStateTransition("HIDDEN", true)
        },

        _focusCallback: function (focused, pressed) {
            if (pressed || focused) {
                if (this.slope.color != sc.SlopeLine_Color.ORANGE) {
                    this.slope.color = sc.SlopeLine_Color.ORANGE;
                    this.line.color = "#FF8A34";
                    this.connect.color = "#FF8A34";
                    this.end.offsetY = 405
                }
            } else if (this.slope.color != sc.SlopeLine_Color.BLUE) {
                this.slope.color = sc.SlopeLine_Color.BLUE;
                this.line.color = "#94CEFF";
                this.connect.color = "#94CEFF";
                this.end.offsetY = 403
            }
        },

        update: function () {
            this.parent();
            this._updateSize()
        },

        _updateSize: function () {
            if (this.sizeTransition) {
                this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                var progress = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                    eased = this.sizeTransition.timeFunction.get(progress);
                this.connect.hook.size.y = Math.round(this.sizeTransition.startHeight * (1 - eased) + this.sizeTransition.height * eased);
                if (eased == 1) this.sizeTransition = null
            }
        },

        setEquip: function (rarity, subType, level, skipSounds) {
            this.equip.setEquip(rarity, subType, level, skipSounds)
        },

        setPressedAndUnFocus: function (pressed) {
            this.button.setPressedAndUnFocus(pressed)
        },

        moveToBottom: function () {
            if (this._isActiveTop) {
                this._isActiveTop = false;
                this.sizeTransition = {
                    startHeight: this.connect.hook.size.y,
                    height: 0,
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE,
                    timer: 0
                };
                this.end.doPosTranstition(this.end.hook.pos.x, this.bottomY, 0.1, KEY_SPLINES.EASE)
            }
        },

        moveToTop: function () {
            if (!this._isActiveTop) {
                this._isActiveTop = true;
                this.connect.doStateTransition("DEFAULT", true);
                if (this.connect.hook.size.y != 0) this.connect.hook.size.y = 0;
                var delay = this.line.hook.anim.timer < this.line.hook.anim.maxTime ? 0.048 + (this.line.hook.anim.maxTime - this.line.hook.anim.timer) : 0;
                this.sizeTransition = {
                    startHeight: this.connect.hook.size.y,
                    height: this.topY,
                    time: 0.1,
                    timeFunction: KEY_SPLINES.EASE,
                    timer: 0 - delay
                };
                this.end.doPosTranstition(this.end.hook.pos.x, this.end.hook.pos.y - this.topY, 0.1, KEY_SPLINES.EASE, delay)
            }
        },

        showButton: function () {
            this.button.doStateTransition("HIDDEN", true);
            this.button.doStateTransition("DEFAULT");
            this.slope.doStateTransition("DEFAULT");
            this.slope.hide();
            this.slope.show(0.1, 0.2);
            this.line.doStateTransition("HIDDEN", true);
            this.line.doStateTransition("DEFAULT", false, false, null, 0.1 + 0.2);
            this.end.doStateTransition("HIDDEN", true);
            this.connect.doStateTransition("DEFAULT", true);
            this.sizeTransition = {
                startHeight: this.connect.hook.size.y,
                height: 0,
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR,
                timer: 0
            };
            this.end.setPos(this.end.hook.pos.x, this.bottomY);
            this.end.doStateTransition("DEFAULT", false, false, null, 0.4);
            this._hasLine = true
        },

        hideButton: function () {
            this.button.doStateTransition("HIDDEN_FADE");
            if (this.line.hook.currentStateName != "HIDDEN") this.line.doStateTransition("HIDDEN_FADE");
            this.slope.doStateTransition("HIDDEN");
            if (this.end.hook.currentStateName != "HIDDEN") this.end.doStateTransition("HIDDEN_FADE");
            if (this.connect.hook.currentStateName != "HIDDEN") this.connect.doStateTransition("HIDDEN");
            this._hasLine = this._isActiveTop = false
        },

        showLine: function (moveToTop) {
            if (!this._hasLine) {
                this.slope.show(0.1);
                this.line.doStateTransition("DEFAULT", false, false, null, 0.1);
                this.connect.doStateTransition("DEFAULT", true);
                this.sizeTransition = {
                    startHeight: this.connect.hook.size.y,
                    height: 0,
                    time: 0,
                    timeFunction: KEY_SPLINES.LINEAR,
                    timer: 0
                };
                this.end.setPos(this.end.hook.pos.x, this.bottomY);
                this.end.doStateTransition("DEFAULT", false, false, null, 0.2);
                this._hasLine = true
            }
            if (moveToTop) this.moveToTop()
        },

        hideLine: function (skipSounds) {
            if (this._hasLine) {
                if (this._isActiveTop) {
                    this._isActiveTop = false;
                    this.sizeTransition = {
                        startHeight: this.connect.hook.size.y,
                        height: 0,
                        time: 0.1,
                        timeFunction: KEY_SPLINES.LINEAR,
                        timer: 0
                    };
                    this.end.doPosTranstition(this.end.hook.pos.x, this.bottomY, 0.1, KEY_SPLINES.LINEAR)
                }
                this.line.doStateTransition("HIDDEN", skipSounds, false, null, 0.1);
                this.slope.hide(skipSounds ? 0 : 0.1, skipSounds ? 0 : 0.2);
                this.end.doStateTransition("HIDDEN", skipSounds);
                this._hasLine = false
            }
        },

        resetLine: function () {
            if (this._hasLine) {
                if (this._isActiveTop) this.moveToBottom()
            } else this.showLine()
        }
    });

    var ANIM_FRAMES = [0, 1, 2, 3, 4];

    sc.EquipMenuMiddleIcon = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/equip-fx.png"),
        menuGfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        equipIcon: null,
        animTimer: 0,
        animFrame: ANIM_FRAMES.length,

        init: function () {
            this.parent();
            this.setSize(38, 38);
            this.equipIcon = new ig.ImageGui(this.gfx, 0, 32, 11, 12);
            this.equipIcon.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.15,
                    timeFunction: KEY_SPLINES.EASE_IN
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleX: 1.5,
                        scaleY: 1.5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.equipIcon.setPos(14, 14);
            this.addChildGui(this.equipIcon)
        },

        setEquip: function (rarity, subType, level, skipSounds) {
            if (subType) {
                this.equipIcon.doStateTransition("HIDDEN", true);
                this.equipIcon.offsetX = 0 + rarity * 11;
                this.equipIcon.offsetY = 32 + this.getTypeIndex(subType) * 12;
                if (!skipSounds) this.animTimer = this.animFrame = 0;
                this.equipIcon.doStateTransition("DEFAULT", skipSounds)
            } else this.equipIcon.doStateTransition("HIDDEN", true)
        },

        getTypeIndex: function (subType) {
            switch (subType) {
                case sc.ITEMS_EQUIP_TYPES.HEAD:
                    return 0;
                case sc.ITEMS_EQUIP_TYPES.ARM:
                    return 1;
                case sc.ITEMS_EQUIP_TYPES.TORSO:
                    return 2;
                case sc.ITEMS_EQUIP_TYPES.FEET:
                    return 3
            }
        },

        update: function () {
            if (this.animFrame < ANIM_FRAMES.length) {
                this.animTimer = this.animTimer + ig.system.actualTick;
                if (this.animTimer >= 0.05) {
                    this.animTimer = 0;
                    this.animFrame++;
                    if (this.animFrame >= ANIM_FRAMES.length) this.animFrame = ANIM_FRAMES.length
                }
            }
        },

        updateDrawables: function (ctx) {
            if (this.animFrame < ANIM_FRAMES.length) ctx.addGfx(this.gfx, 3, 4, ANIM_FRAMES[this.animFrame] * 32, 0, 32, 32).setCompositionMode("lighter");
            ctx.addGfx(this.gfx, 7, 7, 96, 32, 24, 25)
        }
    })
});
ig.baked = !0;
