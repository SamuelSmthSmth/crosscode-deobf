/**
 * game.feature.menu.gui.item.item-status-default
 * ==============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.item.item-status-default")`.
 *
 * `sc.ItemStatusDefaultBar`: a reusable HP/SP/EXP/buff bar with animated
 * values and a segmented SP bar that shows the regen portion in a lighter
 * color (the `drawSpBarFilled`/`drawSpBarSegmentsSmall` helpers draw the
 * segments from the sprite sheet). `sc.ItemStatusDefault` is the player
 * status panel of the item menu (level, element icon, HP/SP/EXP bars).
 */
ig.module("game.feature.menu.gui.item.item-status-default")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    function drawSpBarFilled(drawables, gfx, state, first, last, isRegen, isFullRegen, spLeft) {
        var spriteX = SEG_FILLED_SX,
            spriteY = SEG_FILLED_SY;
        isRegen || (spriteY = spriteY + SEG_FILLED_REGEN_Y);
        isFullRegen || (spriteY = spriteY + SEG_FILLED_NORMAL_Y);
        var width = SEG_FILLED_W * 2 + SEG_FILLED_GAP * 4,
            advance = width - SEG_FILLED_EDGE;
        if (first != void 0) {
            spriteX = spriteX + (SEG_FILLED_W + first * SEG_FILLED_GAP);
            width = width - (SEG_FILLED_W + first * SEG_FILLED_GAP);
            advance = width - SEG_FILLED_EDGE
        }
        if (last != void 0) {
            advance = width = width - (SEG_FILLED_W + (4 - last) * SEG_FILLED_GAP)
        }
        if (isFullRegen && !isRegen && spLeft == 0) {
            spriteX = spriteX + SEG_FILLED_W;
            advance = width = width - (SEG_FILLED_W + 1)
        }
        drawables.addGfx(gfx, state.posX, 9, spriteX, spriteY, width, SEG_FILLED_H);
        state.posX = state.posX + advance
    }

    function drawSpBarSegmentsSmall(drawables, gfx, state, first, last, isRegen, isFullRegen, spLeft) {
        var spriteX = SEG_MIN_SX,
            spriteY = SEG_MIN_SY;
        isRegen || (spriteY = spriteY + SEG_MIN_REGEN_Y);
        isFullRegen || (spriteY = spriteY + SEG_MIN_NORMAL_Y);
        var width = SEG_MIN_W * 2 + SEG_MIN_GAP * 4,
            advance = width - SEG_MIN_EDGE;
        if (first != void 0) {
            spriteX = spriteX + (SEG_MIN_W + first * SEG_MIN_GAP);
            width = width - (SEG_MIN_W + first * SEG_MIN_GAP);
            advance = width - SEG_MIN_EDGE
        }
        if (last != void 0) {
            advance = width = width - (SEG_MIN_W + (4 - last) * SEG_MIN_GAP)
        }
        if (isFullRegen && !isRegen && spLeft == 0) {
            spriteX = spriteX + SEG_MIN_W;
            advance = width = width - (SEG_MIN_W + 1)
        }
        drawables.addGfx(gfx, state.posX, 9, spriteX, spriteY, width, SEG_MIN_H);
        state.posX = state.posX + advance
    }

    sc.MENU_BAR_TYPE = {
        HP: 0,
        EXP: 1,
        SP: 2,
        BUFF: 3
    };

    var SP_BAR_STATE = {
        sp: 0,
        posX: 0,
        barFilled: 0,
        regenFilled: 0
    };

    sc.ItemStatusDefaultBar = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        backgroundPatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 0,
            left: 4,
            top: 6,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 128,
                    y: 408
                },
                sp: {
                    x: 112,
                    y: 408
                },
                spm: {
                    x: 112,
                    y: 416
                }
            }
        }),
        barPatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 46,
            height: 0,
            left: 1,
            top: 1,
            right: 1,
            bottom: 0,
            offsets: {
                hp: {
                    x: 0,
                    y: 48
                },
                bg: {
                    x: 0,
                    y: 49
                },
                red: {
                    x: 0,
                    y: 50
                },
                fg: {
                    x: 0,
                    y: 51
                },
                exp: {
                    x: 0,
                    y: 52
                },
                buff: {
                    x: 0,
                    y: 54
                }
            }
        }),
        type: 0,
        name: "",
        maxValue: 0,
        currentValue: -1,
        targetValue: 0,
        timer: 0,
        currentNumber: null,
        maxNumber: null,
        buff: null,
        barHeight: 0,
        model: null,

        init: function (name, type, buff, width, barHeight, textOffsetY) {
            this.parent();
            this.setSize(width || 126, 14);
            this.barHeight = barHeight || 0;
            this.buff = buff || null;
            this.type = type || sc.MENU_BAR_TYPE.HP;
            this.model = sc.model.player;
            var text = new sc.TextGui(name, {
                font: sc.fontsystem.tinyFont,
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            text.setPos(3, textOffsetY);
            this.addChildGui(text);
            if (this.type != sc.MENU_BAR_TYPE.BUFF) {
                var maxValue = 0;
                switch (this.type) {
                    case sc.MENU_BAR_TYPE.HP:
                        maxValue = 9999;
                        break;
                    case sc.MENU_BAR_TYPE.EXP:
                        maxValue = sc.EXP_PER_LEVEL;
                        break;
                    case sc.MENU_BAR_TYPE.SP:
                        maxValue = 99
                }
                this.maxNumber = new sc.NumberGui(maxValue);
                this.maxNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.maxNumber.setPos(6, 0);
                this.addChildGui(this.maxNumber);
                this.currentNumber = new sc.NumberGui(maxValue, {
                    transitionTime: 0.2
                });
                this.currentNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.currentNumber.setPos(48, 0)
            } else {
                var secondsText = new sc.TextGui(ig.lang.get("sc.gui.menu.seconds"), {
                    font: sc.fontsystem.tinyFont,
                    speed: ig.TextBlock.SPEED.IMMEDIATE
                });
                secondsText.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                secondsText.setPos(3, -1);
                this.addChildGui(secondsText);
                this.currentNumber = new sc.NumberGui(999);
                this.currentNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.currentNumber.setPos(19, 0)
            }
            this.addChildGui(this.currentNumber)
        },

        updateValues: function (instant, model, current, maxValue) {
            this.model = model ? model : sc.model.player;
            switch (this.type) {
                case sc.MENU_BAR_TYPE.HP:
                    var params = model ? model.params : sc.model.player.params;
                    current = current || params.currentHp;
                    if (this.currentValue != current) {
                        if ((this.targetValue - this.currentValue) * (current - this.targetValue) < 0) {
                            this.currentValue = this.targetValue
                        }
                        this.targetValue = current;
                        instant ? this.currentValue = this.targetValue : this.timer = 0.2;
                        this.maxValue = maxValue || params.getStat("hp");
                        this.currentNumber.setNumber(current, instant);
                        this.maxNumber.setNumber(this.maxValue, instant)
                    }
                    break;
                case sc.MENU_BAR_TYPE.EXP:
                    var player = model ? model : sc.model.player;
                    if (this.currentValue != player.exp) {
                        this.currentValue = this.targetValue = Math.floor(player.exp);
                        this.maxValue = sc.EXP_PER_LEVEL;
                        this.currentNumber.setNumber(player.exp, instant);
                        this.maxNumber.setNumber(this.maxValue, instant)
                    }
                    break;
                case sc.MENU_BAR_TYPE.SP:
                    var params = model ? model.params : sc.model.player.params;
                    this.currentValue != params.currentSp && this.currentNumber.setNumber(Math.floor(params.currentSp), instant);
                    this.maxNumber.setNumber(params.maxSp, instant);
                    break;
                case sc.MENU_BAR_TYPE.BUFF:
                    var seconds = Math.ceil(this.buff.timer);
                    if (this.currentValue != seconds) {
                        this.currentValue = this.targetValue = seconds;
                        this.maxValue = this.buff.time;
                        this.currentNumber.setNumber(seconds, instant)
                    }
            }
        },

        resetValues: function () {
            this.currentNumber.setNumber(0);
            this.targetValue = this.currentValue = -1;
            this.timer = 0
        },

        update: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick
            } else if (this.targetValue != this.currentValue) {
                var step = ig.system.actualTick * this.maxValue / 2;
                if (this.currentValue > this.targetValue) {
                    this.currentValue = Math.max(this.targetValue, this.currentValue - step)
                } else if (this.currentValue < this.targetValue) {
                    this.currentValue = Math.min(this.targetValue, this.currentValue + step)
                }
            }
        },

        updateDrawables: function (drawables) {
            if (this.type == sc.MENU_BAR_TYPE.SP) {
                this._drawSpBar(drawables)
            } else {
                var fillRatio, bgRatio, fillKey, bgKey;
                this.type != sc.MENU_BAR_TYPE.BUFF ? this.backgroundPatch.draw(drawables, this.hook.size.x - (this.barHeight ? this.barHeight : 4), this.barHeight ? this.barHeight : 4, "default", 2, 9) : this.backgroundPatch.draw(drawables, this.hook.size.x - 3, 3, "default", 2, 9);
                this.type != sc.MENU_BAR_TYPE.BUFF && drawables.addGfx(this.backgroundPatch.gfx, this.hook.size.x - 46, 0, 80, 408, 8, 8);
                switch (this.type) {
                    case sc.MENU_BAR_TYPE.HP:
                        fillKey = "hp";
                        break;
                    case sc.MENU_BAR_TYPE.EXP:
                        fillKey = "exp";
                        break;
                    case sc.MENU_BAR_TYPE.BUFF:
                        fillKey = "buff"
                }
                if (this.targetValue > 0) {
                    if (this.targetValue < this.currentValue) {
                        bgRatio = this.currentValue / this.maxValue;
                        fillRatio = this.targetValue / this.maxValue;
                        bgKey = "bg"
                    } else {
                        bgRatio = this.targetValue / this.maxValue;
                        fillRatio = this.currentValue / this.maxValue;
                        bgKey = "fg"
                    }
                    this.type == sc.MENU_BAR_TYPE.HP && (fillKey = fillRatio > 0.25 ? "hp" : "red")
                }
                for (var rows = this.barHeight || (this.type != sc.MENU_BAR_TYPE.BUFF ? 4 : 3), row = 0; row < rows; row++) {
                    bgRatio && (this.targetValue != this.currentValue && this.type == sc.MENU_BAR_TYPE.HP) && this.barPatch.draw(drawables, Math.round(bgRatio.limit(0, 1) * (this.hook.size.x - 7)), 1, bgKey, 2 + row, 9 + row);
                    fillRatio > 0 && this.barPatch.draw(drawables, this.type == sc.MENU_BAR_TYPE.BUFF ? Math.round(fillRatio.limit(0, 1) * (this.hook.size.x - 6)) : Math.round(fillRatio.limit(0, 1) * (this.hook.size.x - (this.barHeight == 3 ? 6 : 7))), 1, fillKey, 2 + row, 9 + row)
                }
            }
        },

        _drawSpBarMinified: function (drawables) {
            var barGfx = this.backgroundPatch.gfx,
                maxSp = this.model.params.maxSp,
                count = 16;
            this.backgroundPatch.draw(drawables, this.hook.size.x - 4, 4, "spm", 2, 9);
            drawables.addGfx(barGfx, this.hook.size.x - 46, 0, 80, 408, 8, 8);
            for (var posX = 6, index = 0; index < count; index++) {
                drawables.addColor(index + 1 > count / 2 ? SP_REG_COLOR : SP_NORMAL_COLOR, posX, 10, 3, 2);
                posX = (index + 1) % 4 == 0 ? posX + 6 : posX + 4
            }
        },

        _drawSpBar: function (drawables) {
            var barGfx = this.backgroundPatch.gfx,
                params = this.model.params,
                maxSp = params.maxSp,
                regenTarget = maxSp * sc.SP_REGEN_FACTOR,
                currentSp = params.currentSp,
                floorSp = Math.floor(currentSp);
            this.barHeight == 3 ? this.backgroundPatch.draw(drawables, this.hook.size.x - 4, 4, "spm", 2, 9) : this.backgroundPatch.draw(drawables, this.hook.size.x - 4, 6, "sp", 2, 9);
            drawables.addGfx(barGfx, this.hook.size.x - 46, 0, 80, 408, 8, 8);
            this.barHeight == 3 ? drawables.addGfx(barGfx, 2, 9, 560, 160 + (currentSp < 1 ? 16 : 0), 6, 4) : drawables.addGfx(barGfx, 2, 9, 144, 480 + (currentSp < 1 ? 16 : 0), 6, 6);
            SP_BAR_STATE.posX = 8;
            SP_BAR_STATE.sp = 0;
            SP_BAR_STATE.barFilled = Math.min(4, floorSp);
            SP_BAR_STATE.regenFilled = Math.min(4, regenTarget);
            var drawFn = this.barHeight == 3 ? drawSpBarSegmentsSmall : drawSpBarFilled;
            for (; SP_BAR_STATE.sp + 1 <= floorSp;) {
                var first = SP_BAR_STATE.sp ? void 0 : 0;
                if (SP_BAR_STATE.barFilled == 4 && (SP_BAR_STATE.regenFilled == 4 || SP_BAR_STATE.regenFilled == 0)) {
                    drawFn(drawables, barGfx, SP_BAR_STATE, first, void 0, true, SP_BAR_STATE.regenFilled == 4)
                } else if (SP_BAR_STATE.regenFilled > 0 && SP_BAR_STATE.regenFilled < SP_BAR_STATE.barFilled) {
                    var last = SP_BAR_STATE.barFilled == 4 ? void 0 : SP_BAR_STATE.barFilled;
                    drawFn(drawables, barGfx, SP_BAR_STATE, first, SP_BAR_STATE.regenFilled, true, true);
                    drawFn(drawables, barGfx, SP_BAR_STATE, SP_BAR_STATE.regenFilled, last, true, false)
                } else {
                    drawFn(drawables, barGfx, SP_BAR_STATE, first, SP_BAR_STATE.barFilled, true, SP_BAR_STATE.regenFilled > 0)
                }
                SP_BAR_STATE.sp = SP_BAR_STATE.sp + SP_BAR_STATE.barFilled;
                if (SP_BAR_STATE.barFilled == 4) {
                    SP_BAR_STATE.barFilled = Math.min(4, floorSp - SP_BAR_STATE.sp);
                    SP_BAR_STATE.regenFilled = (regenTarget - SP_BAR_STATE.sp).limit(0, 4)
                }
            }
            if (SP_BAR_STATE.sp % 4 != 0) {
                if (SP_BAR_STATE.regenFilled > SP_BAR_STATE.barFilled && SP_BAR_STATE.regenFilled < 4) {
                    drawFn(drawables, barGfx, SP_BAR_STATE, SP_BAR_STATE.barFilled, SP_BAR_STATE.regenFilled, false, true);
                    SP_BAR_STATE.barFilled = SP_BAR_STATE.regenFilled
                }
                drawFn(drawables, barGfx, SP_BAR_STATE, SP_BAR_STATE.barFilled, void 0, false, SP_BAR_STATE.regenFilled == 4);
                SP_BAR_STATE.sp = Math.ceil(SP_BAR_STATE.sp / 4) * 4
            }
            for (; SP_BAR_STATE.sp < maxSp;) {
                SP_BAR_STATE.regenFilled = (regenTarget - SP_BAR_STATE.sp).limit(0, 4);
                if (SP_BAR_STATE.regenFilled == 4 || SP_BAR_STATE.regenFilled == 0) {
                    drawFn(drawables, barGfx, SP_BAR_STATE, void 0, void 0, false, SP_BAR_STATE.regenFilled == 4, floorSp)
                } else {
                    drawFn(drawables, barGfx, SP_BAR_STATE, void 0, SP_BAR_STATE.regenFilled, false, true);
                    drawFn(drawables, barGfx, SP_BAR_STATE, SP_BAR_STATE.regenFilled, void 0, false, false)
                }
                SP_BAR_STATE.sp = SP_BAR_STATE.sp + 4
            }
        }
    });

    var SEG_FILLED_SX = 144,
        SEG_FILLED_SY = 480,
        SEG_FILLED_W = 6,
        SEG_FILLED_GAP = 5,
        SEG_FILLED_EDGE = 2,
        SEG_FILLED_REGEN_Y = 16,
        SEG_FILLED_NORMAL_Y = 8,
        SEG_FILLED_H = 6,
        SEG_MIN_SX = 560,
        SEG_MIN_SY = 160,
        SEG_MIN_W = 6,
        SEG_MIN_GAP = 3,
        SEG_MIN_EDGE = 2,
        SEG_MIN_REGEN_Y = 10,
        SEG_MIN_NORMAL_Y = 5,
        SEG_MIN_H = 4;

    sc.ItemStatusDefault = sc.MenuPanel.extend({
        menuGfx: new ig.Image("media/gui/menu.png"),
        statusGfx: new ig.Image("media/gui/status-gui.png"),
        level: null,
        hpBar: null,
        spBar: null,
        expBar: null,
        skinGfx: null,
        bounds: null,

        init: function () {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 95);
            this.setPos(sc.options.hdMode ? 25 : 2, 28);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(126 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.level = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.LARGE
            });
            this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.level.setPos(3, 2);
            this.addChildGui(this.level);
            this.hpBar = new sc.ItemStatusDefaultBar("HP", sc.MENU_BAR_TYPE.HP);
            this.hpBar.setPos(0, 39);
            this.addChildGui(this.hpBar);
            this.hpBar.updateValues(true);
            this.hpBar.annotation = {
                size: {
                    x: this.hpBar.hook.size.x + 2,
                    y: this.hpBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.hp",
                    description: "sc.gui.menu.help.item.description.hp"
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.spBar = new sc.ItemStatusDefaultBar("SP", sc.MENU_BAR_TYPE.SP);
            this.spBar.setPos(0, 57);
            this.addChildGui(this.spBar);
            this.spBar.updateValues(true);
            this.spBar.annotation = {
                size: {
                    x: this.spBar.hook.size.x + 2,
                    y: this.spBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.sp",
                    description: "sc.gui.menu.help.item.description.sp"
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.expBar = new sc.ItemStatusDefaultBar("EXP", sc.MENU_BAR_TYPE.EXP);
            this.expBar.setPos(0, 77);
            this.addChildGui(this.expBar);
            this.expBar.updateValues(true);
            this.expBar.annotation = {
                size: {
                    x: this.expBar.hook.size.x + 2,
                    y: this.expBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.exp",
                    description: "sc.gui.menu.help.item.description.exp"
                },
                index: {
                    x: 0,
                    y: 2
                }
            };
            this.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (drawables) {
            this.parent(drawables);
            drawables.addGfx(this.menuGfx, 0, 0, 280, 472, 126, 35);
            this.skinGfx && this.bounds ? drawables.addGfx(this.skinGfx, 0, 0, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h) : drawables.addGfx(this.menuGfx, 0, 0, 211, 26, 60, 34);
            drawables.addGfx(this.statusGfx, 64, 5, 104, 32 + sc.model.player.currentElementMode * 24, 24, 24)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model.player.params, this);
            sc.Model.addObserver(sc.playerSkins, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this);
            sc.Model.removeObserver(sc.model.player, this);
            sc.Model.removeObserver(sc.model.player.params, this);
            sc.Model.removeObserver(sc.playerSkins, this)
        },

        showMenu: function () {
            this.checkSkin();
            this._updateElements(true);
            !sc.menu.isItemEquipTab() && sc.menu.itemCurrentTab != 6 && this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            this.doStateTransition("HIDDEN")
        },

        checkSkin: function () {
            var skin = sc.playerSkins.getCurrentSkin("Appearance");
            if (skin && skin.loaded) {
                this.skinGfx = skin.guiImage;
                this.bounds = skin.guiImageBounds ? skin.guiImageBounds.face || null : null
            } else {
                this.bounds = this.skinGfx = null
            }
        },

        modelChanged: function (model, event) {
            if (model == sc.menu) {
                event == sc.MENU_EVENT.ITEM_CHANGED_TAB && (!sc.menu.isItemEquipTab() && sc.menu.itemCurrentTab != 6 ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN"))
            } else if (model == sc.model.player) {
                (event == sc.PLAYER_MSG.LEVEL_CHANGE || event == sc.PLAYER_MSG.EXP_CHANGE || event == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE) && this._updateElements()
            } else if (model == sc.model.player.params) {
                (event == sc.COMBAT_PARAM_MSG.BUFF_ADDED || event == sc.COMBAT_PARAM_MSG.HP_CHANGED || event == sc.COMBAT_PARAM_MSG.SP_CHANGED || event == sc.COMBAT_PARAM_MSG.STATS_CHANGED) && this._updateElements()
            } else if (model == sc.playerSkins) {
                this.checkSkin()
            }
        },

        _updateElements: function (instant) {
            this.level.setNumber(sc.model.player.level);
            this.hpBar.updateValues(instant);
            this.expBar.updateValues(instant);
            this.spBar.updateValues(instant)
        }
    })
});
ig.baked = !0;
