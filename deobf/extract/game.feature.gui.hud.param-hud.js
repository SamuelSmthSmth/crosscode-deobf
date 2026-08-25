ig.module("game.feature.gui.hud.param-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box").defines(function() {
    sc.ParamHudGui = ig.GuiElementBase.extend({
        transitions: {
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
        },
        level: null,
        hp: null,
        atk: null,
        def: null,
        foc: null,
        _isOut: false,
        init: function() {
            this.parent();
            this.level = new sc.ParamHudGui.Level;
            this.level.setAlign(ig.GUI_ALIGN.X_LEFT,
                ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.level);
            this.hp = new sc.ParamHudGui.Param("maxhp", "hp", 62, 9999, 0);
            this.hp.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.hp.setPos(52, 0);
            this.addChildGui(this.hp);
            this.atk = new sc.ParamHudGui.Param("atk", "attack", 54, 999, 1);
            this.atk.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.atk.setPos(100, 0);
            this.addChildGui(this.atk);
            this.def = new sc.ParamHudGui.Param("def", "defense", 54, 999, 2);
            this.def.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.def.setPos(140,
                0);
            this.addChildGui(this.def);
            this.foc = new sc.ParamHudGui.Param("foc", "focus", 54, 999, 3);
            this.foc.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.foc.setPos(180, 0);
            this.addChildGui(this.foc);
            this.hideParams(true);
            this.doStateTransition("DEFAULT")
        },
        showParams: function(b) {
            b ? this.hasTransition() || this._isOut ? this.doPosTranstition(54, 26, 0.2, KEY_SPLINES.EASE) : this.setPos(54, 26) : this.hasTransition() || this._isOut ? this.doPosTranstition(52, 5, 0.2, KEY_SPLINES.LINEAR) : this.setPos(52, 5);
            this._isOut = true;
            this.level.doStateTransition("DEFAULT", false, false, null, 0.048);
            this.hp.doStateTransition("DEFAULT", false, false, null, 0.048);
            this.atk.doStateTransition("DEFAULT", false, false, null, 0.048);
            this.def.doStateTransition("DEFAULT", false, false, null, 0.048);
            this.foc.doStateTransition("DEFAULT", false, false, null, 0.048)
        },
        hideParams: function(b) {
            b = b != void 0 ? b : false;
            this.level.doStateTransition("HIDDEN", b);
            this.hp.doStateTransition("HIDDEN", b);
            this.atk.doStateTransition("HIDDEN", b);
            this.def.doStateTransition("HIDDEN",
                b);
            this.foc.doStateTransition("HIDDEN", b);
            this._isOut = false
        }
    });
    sc.ParamHudGui.Pie = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        param: "",
        offsetX: 0,
        offsetY: 0,
        _timer: 0,
        _targetValue: 1,
        _startValue: 1,
        init: function(b) {
            this.parent();
            this.param = b;
            this.setSize(8, 8);
            sc.Model.addObserver(sc.model.player, this);
            this._timer = 0.2;
            this._calcOffset(1)
        },
        update: function() {
            if (this._timer < 0.2) {
                this._timer = this._timer + ig.system.actualTick;
                if (this._timer >= 0.2) this._timer = 0.2;
                this._calcOffset(this._getCurrentValue())
            }
        },
        updateDrawables: function(b) {
            b.addGfx(this.gfx, 0, 0, 1 + this.offsetX, 146 + this.offsetY, this.hook.size.x, this.hook.size.y)
        },
        _getCurrentValue: function() {
            if (this._timer >= 0.2) return this._targetValue;
            var b = this._timer / 0.2;
            return (1 - b) * this._startValue + b * this._targetValue
        },
        _calcOffset: function(b) {
            var a = b < 1 ? (b - 1) * -1 + 1 : b,
                d = (Math.abs(a) - 1) * 10 % 6;
            this.offsetX = (b < 1 ? Math.ceil(d) : Math.floor(d)) * 9;
            this.offsetY = (b < 1 ? 18 : 0) + (Math.abs(a) - 1 >= 0.6 ? 9 : 0)
        },
        modelChanged: function(b, a) {
            if (b == sc.model.player && (a == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE ||
                    a == sc.PLAYER_MSG.LEVEL_CHANGE || a == sc.PLAYER_MSG.SKILL_CHANGED)) {
                var d = sc.model.player.getCurrentElementMode().getParamFactor(this.param);
                if (this._targetValue != d) {
                    this._timer = 0;
                    this._startValue = this._targetValue;
                    this._targetValue = d
                }
            }
        }
    });
    sc.ParamHudGui.Param = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 3,
            height: 0,
            left: 17,
            top: 17,
            right: 17,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 128
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    scaleY: 0,
                    alpha: 0,
                    scaleX: 0.8
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        _pie: null,
        _text: null,
        _number: null,
        _param: "",
        init: function(b, a, d, c, e) {
            this.parent(d, 17);
            this.hook.pivot.x = 0;
            this.hook.pivot.y = 0;
            this._param = a;
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model.player.params, this);
            this._text = new sc.TextGui(ig.lang.get("sc.gui.status-hud." + b), {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            this._text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this._text.setPos(19,
                0);
            this.addChildGui(this._text);
            this._pie = new ig.ImageGui(this.ninepatch.gfx, e * 8, 232, 8, 8);
            this._pie.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this._pie.setPos(9, 0);
            this.addChildGui(this._pie);
            this._number = new sc.NumberGui(c, {
                signed: true,
                transitionTime: 0.2
            });
            this._number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this._number.setPos(10, 1);
            this._setNumber(true);
            this.addChildGui(this._number);
            this.doStateTransition("HIDDEN", true)
        },
        _setNumber: function(b) {
            var a = sc.model.player.params.getStat(this._param);
            this._number.setNumber(a, b);
            b = sc.model.player.params.getStatBuffFactor(this._param);
            a = sc.GUI_NUMBER_COLOR.WHITE;
            if (b < 1) a = sc.GUI_NUMBER_COLOR.RED;
            if (b > 1) a = sc.GUI_NUMBER_COLOR.GREEN;
            this._number.setColor(a)
        },
        modelChanged: function(b, a) {
            b == sc.model.player ? a == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE || a == sc.PLAYER_MSG.LEVEL_CHANGE ? this._setNumber() : (a == sc.PLAYER_MSG.EQUIP_CHANGE || a == sc.PLAYER_MSG.RESET_PLAYER || a == sc.PLAYER_MSG.CONFIG_CHANGED || a == sc.PLAYER_MSG.SET_PARAMS || a == sc.PLAYER_MSG.SKILL_CHANGED) && this._setNumber(!this.isVisible()) :
                b == sc.model.player.params && a == sc.COMBAT_PARAM_MSG.STATS_CHANGED && this._setNumber(!this.isVisible())
        }
    });
    sc.ParamHudGui.Level = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 3,
            height: 0,
            left: 17,
            top: 17,
            right: 17,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 128
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    scaleY: 0,
                    alpha: 0,
                    scaleX: 0.8
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        _text: null,
        _level: null,
        init: function() {
            this.parent(66, 17);
            this.hook.pivot.x =
                0;
            this.hook.pivot.y = 0;
            sc.Model.addObserver(sc.model.player, this);
            this._text = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            this._text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this._text.setPos(10, 1);
            this.addChildGui(this._text);
            this._level = new sc.NumberGui(99, {
                signed: true,
                transitionTime: 0.2,
                size: sc.NUMBER_SIZE.LARGE
            });
            this._level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this._level.setPos(17, 1);
            this._level.setNumber(sc.model.player.level,
                true);
            this.addChildGui(this._level);
            this.doStateTransition("HIDDEN", true)
        },
        modelChanged: function(b, a) {
            b == sc.model.player && (a == sc.PLAYER_MSG.LEVEL_CHANGE ? this._level.setNumber(sc.model.player.level) : a == sc.PLAYER_MSG.SET_PARAMS && this._level.setNumber(sc.model.player.level, true))
        }
    })
});
ig.baked = !0;
