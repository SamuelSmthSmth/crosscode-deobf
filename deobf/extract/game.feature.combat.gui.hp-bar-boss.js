ig.module("game.feature.combat.gui.hp-bar-boss").requires("impact.feature.gui.gui", "impact.feature.gui.base.box").defines(function() {
    function b(a, b) {
        return a.barOrder - b.barOrder
    }

    function a(a) {
        for (var b = c.length, g = (ig.system.width - d * 2) / b, h = d, i = 0; i < b; ++i) {
            var j = c[i];
            j.updatePlacement(h, g, a == j);
            h = h + g
        }
        sc.model.message.setBottomGap(b ? 14 : 0)
    }
    var d = 2;
    Vec2.create();
    sc.BigGenericBar = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        ninepatchOuter: new ig.NinePatch("media/gui/status-gui.png", {
            width: 12,
            height: 0,
            left: 10,
            top: 11,
            right: 10,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 213
                }
            }
        }),
        ninepatchInner: new ig.NinePatch("media/gui/status-gui.png", {
            width: 12,
            height: 0,
            left: 6,
            top: 7,
            right: 6,
            bottom: 0,
            offsets: {
                "default": {
                    x: 32,
                    y: 215
                }
            }
        }),
        currentValue: 0,
        targetValue: 0,
        flowValue: 0,
        maxValue: 0,
        timer: 0,
        splits: [],
        leftOffset: null,
        init: function(a, b, c) {
            this.parent();
            this.leftOffset = a;
            this.lowerColor = c;
            this.upperColor = b;
            this.hook.zIndex = 0;
            this.hook.invisibleUpdate = true
        },
        setMaxValue: function(a) {
            this.maxValue = a;
            if (this.currentValue >
                this.maxValue) this.currentValue = this.maxValue
        },
        setValue: function(a, b, c) {
            if (a > this.maxValue) a = this.maxValue;
            if (this.targetValue != a) {
                this.timer = 0.75;
                if ((this.targetValue - this.currentValue) * (a - this.targetValue) < 0) this.flowValue = a;
                this.targetValue = a;
                if (this.targetValue < 0) this.targetValue = 0;
                if (b) {
                    this.flowValue = this.targetValue;
                    this.timer = 0
                }
                if (c) this.currentValue = this.targetValue
            }
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) this.flowValue = this.targetValue
            }
            if (this.flowValue !=
                this.currentValue) {
                var a = ig.system.actualTick * this.maxValue / 4;
                if (this.currentValue > this.flowValue) this.currentValue = Math.max(this.flowValue, this.currentValue - a);
                else if (this.currentValue < this.flowValue) this.currentValue = Math.min(this.flowValue, this.currentValue + a)
            }
        },
        updateDrawables: function(a) {
            var b = this.hook;
            this.ninepatchOuter.draw(a, b.size.x, b.size.y, "default");
            var c = this.maxValue,
                d = b.size.y - 4,
                i = this.leftOffset + 12,
                b = b.size.x - i - 12 - d + 1;
            this.ninepatchInner.draw(a, b + d - 1, d, "default", i, 2);
            var j = Math.round(b *
                    Math.min(this.targetValue, this.currentValue) / c),
                k = Math.round(b * Math.max(this.targetValue, this.currentValue) / c);
            j && this.updateBarDraw(a, i, j, this.upperColor, this.lowerColor, d);
            k != j && this.updateBarDraw(a, i + j, k - j, "white", "white", d);
            c = Math.max(this.targetValue, this.currentValue) / c;
            for (d = this.splits.length; d--;) {
                j = Math.round(this.splits[d] * b) - 10;
                a.addGfx(this.gfx, i + j, 0, 56 + (this.splits[d] > c ? 24 : 0), 213, 24, 11)
            }
        },
        updateBarDraw: function(a, b, c, d, i, j) {
            for (var k = 2, b = b + j - 1, l = Math.ceil(j / 2); j--;) {
                a.addColor(j >= l ?
                    d : i, b, k, c, 1);
                k++;
                b--
            }
        }
    });
    sc.BigHpBar = sc.BigGenericBar.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            CUTSCENE: {
                state: {
                    offsetY: 20
                },
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 1,
                    scaleY: 0
                },
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN_CUTSCENE: {
                state: {
                    scaleX: 1,
                    scaleY: 0,
                    offsetY: 20
                },
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        target: null,
        init: function(a, b) {
            this.parent(b, "#ff7a7a", "#d71112");
            this.target = a;
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.model.message, this);
            this.doStateTransition("HIDDEN", true);
            this._isHpBarVisible() && (sc.model.isCutscene() ? this.doStateTransition("CUTSCENE") : this.doStateTransition("DEFAULT"))
        },
        initWithParams: function() {
            this.setMaxValue(this.target.params.getStat("hp"));
            this.setValue(this.target.params.currentHp, true);
            this.updateSplits();
            sc.Model.addObserver(this.target.params, this)
        },
        _isHpBarVisible: function() {
            return this.target.visibility.hpBar == sc.ENEMY_HP_BAR.VISIBLE ? true : this.target.visibility.hpBar ==
                sc.ENEMY_HP_BAR.HIDDEN ? false : this.target.aggression != sc.ENEMY_AGGRESSION.PEACEFUL
        },
        modelChanged: function(a) {
            if (!this.hook.removeAfterTransition)
                if (a instanceof sc.GameModel || a instanceof sc.MessageModel) this._isHpBarVisible() && (sc.model.isCutscene() ? this.doStateTransition(sc.model.message.hasPerson() ? "HIDDEN_CUTSCENE" : "CUTSCENE") : this.doStateTransition("DEFAULT"));
                else {
                    this.setMaxValue(this.target.params.getStat("hp"));
                    this.setHp(this.target.params.currentHp)
                }
        },
        setHp: function(a) {
            this.setValue(a);
            this.updateSplits()
        },
        updateSplits: function() {
            if (this.target) {
                var a = this.target.enemyType.hpBreaks,
                    b = a.length;
                for (this.splits.length = 0; b-- > this.target.hpBreakReached;) this.splits.push(a[b].hp)
            }
        },
        update: function() {
            if (!this.hook.removeAfterTransition)
                if (this._isHpBarVisible()) sc.model.isCutscene() ? this.doStateTransition(sc.model.message.hasPerson() ? "HIDDEN_CUTSCENE" : "CUTSCENE") : this.doStateTransition("DEFAULT");
                else {
                    this.doStateTransition("HIDDEN");
                    return
                } this.parent()
        },
        remove: function() {
            this.target.params &&
                sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.model, this);
            sc.Model.removeObserver(sc.model.message, this);
            this.doStateTransition("HIDDEN", false, true)
        },
        forceRemove: function() {
            this.target.params && sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.model, this);
            this.doStateTransition("HIDDEN", true, true)
        }
    });
    sc.SUB_HP_EDITOR = {};
    var c = [];
    sc.SUB_HP_EDITOR.BOSS = sc.BigHpBar.extend({
        labelGui: null,
        listed: false,
        barOrder: 0,
        init: function(a) {
            this.labelGui = new sc.TextGui("Boss", {
                font: sc.fontsystem.tinyFont
            });
            this.labelGui.setPos(12, 2);
            this.parent(a, this.labelGui.hook.size.x + 4);
            this.addChildGui(this.labelGui);
            this.setSize(ig.system.width - d * 2, 11);
            this.setPivot(this.hook.size.x / 2, 5.5);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(d, 4)
        },
        initWithParams: function() {
            var a = ig.LangLabel.getText(this.target.enemyType.bossLabel);
            this.barOrder = this.target.enemyType.bossOrder;
            this.labelGui.setText(a);
            this.leftOffset = this.labelGui.hook.size.x + 4;
            this.parent()
        },
        update: function() {
            if (this.hook.currentStateName !=
                "HIDDEN" && !this.listed) {
                this.listed = true;
                c.push(this);
                c.sort(b);
                a(this)
            } else if (this.hook.currentStateName == "HIDDEN" && this.listed) {
                this.listed = false;
                c.erase(this);
                a()
            }
            this.parent()
        },
        onDetach: function() {
            if (this.listed) {
                this.listed = false;
                c.erase(this);
                a()
            }
        },
        updatePlacement: function(a, b) {
            this.setSize(b, 11);
            this.setPivot(b / 2, 5.5);
            this.setPos(a, 4)
        }
    });
    sc.SUB_HP_EDITOR.PVP = sc.BigHpBar.extend({
        heads: new ig.Image("media/gui/severed-heads.png"),
        spBGPatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 13,
            height: 0,
            left: 7,
            top: 7,
            right: 7,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 128
                }
            }
        }),
        init: function(a) {
            this.parent(a, 4);
            this.setSize(ig.system.width / 3, 9);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(d, 4);
            this.spBar = new sc.SpMiniHudGui(a.params);
            this.spBar.setPos(12, -6);
            this.addChildGui(this.spBar)
        },
        updateDrawables: function(a) {
            this.parent(a);
            this.spBGPatch.draw(a, 36, 7, "default", 4, -8);
            a.addGfx(this.gfx, -15, -13, 231, 175, 25, 25);
            var b = this.target.getHeadIdx();
            a.addGfx(this.heads, -14, -16, b * 24, 0, 24, 24)
        }
    })
});
ig.baked = !0;
