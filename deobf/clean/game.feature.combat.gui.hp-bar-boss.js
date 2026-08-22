/**
 * game.feature.combat.gui.hp-bar-boss
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.gui.hp-bar-boss")`.
 *
 * Big bottom-of-screen HP bars: `sc.BigGenericBar` (the generic flowing bar),
 * `sc.BigHpBar` (boss/visibility-aware variant), and `sc.SUB_HP_EDITOR.BOSS`
 * / `.PVP` which lay out along the bottom of the screen.
 */
ig.module("game.feature.combat.gui.hp-bar-boss")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.box")
    .defines(function () {

    function compareBarOrder(a, b) {
        return a.barOrder - b.barOrder
    }

    function layoutBars(activeBar) {
        var count = bossBars.length,
            barWidth = (ig.system.width - barMargin * 2) / count,
            x = barMargin;
        for (var index = 0; index < count; ++index) {
            var bar = bossBars[index];
            bar.updatePlacement(x, barWidth, activeBar == bar);
            x = x + barWidth
        }
        sc.model.message.setBottomGap(count ? 14 : 0)
    }

    var barMargin = 2;

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

        init: function (leftOffset, upperColor, lowerColor) {
            this.parent();
            this.leftOffset = leftOffset;
            this.lowerColor = lowerColor;
            this.upperColor = upperColor;
            this.hook.zIndex = 0;
            this.hook.invisibleUpdate = true
        },

        setMaxValue: function (maxValue) {
            this.maxValue = maxValue;
            if (this.currentValue > this.maxValue) this.currentValue = this.maxValue
        },

        setValue: function (value, instant, forceCurrent) {
            if (value > this.maxValue) value = this.maxValue;
            if (this.targetValue != value) {
                this.timer = 0.75;
                if ((this.targetValue - this.currentValue) * (value - this.targetValue) < 0) this.flowValue = value;
                this.targetValue = value;
                if (this.targetValue < 0) this.targetValue = 0;
                if (instant) {
                    this.flowValue = this.targetValue;
                    this.timer = 0
                }
                if (forceCurrent) this.currentValue = this.targetValue
            }
        },

        update: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) this.flowValue = this.targetValue
            }
            if (this.flowValue != this.currentValue) {
                var step = ig.system.actualTick * this.maxValue / 4;
                if (this.currentValue > this.flowValue) this.currentValue = Math.max(this.flowValue, this.currentValue - step);
                else if (this.currentValue < this.flowValue) this.currentValue = Math.min(this.flowValue, this.currentValue + step)
            }
        },

        updateDrawables: function (renderer) {
            var hook = this.hook;
            this.ninepatchOuter.draw(renderer, hook.size.x, hook.size.y, "default");
            var maxValue = this.maxValue,
                barHeight = hook.size.y - 4,
                leftX = this.leftOffset + 12,
                barWidth = hook.size.x - leftX - 12 - barHeight + 1;
            this.ninepatchInner.draw(renderer, barWidth + barHeight - 1, barHeight, "default", leftX, 2);
            var minFillPx = Math.round(barWidth * Math.min(this.targetValue, this.currentValue) / maxValue),
                maxFillPx = Math.round(barWidth * Math.max(this.targetValue, this.currentValue) / maxValue);
            minFillPx && this.updateBarDraw(renderer, leftX, minFillPx, this.upperColor, this.lowerColor, barHeight);
            maxFillPx != minFillPx && this.updateBarDraw(renderer, leftX + minFillPx, maxFillPx - minFillPx, "white", "white", barHeight);
            var fillRatio = Math.max(this.targetValue, this.currentValue) / maxValue;
            for (var index = this.splits.length; index--;) {
                var splitX = Math.round(this.splits[index] * barWidth) - 10;
                renderer.addGfx(this.gfx, leftX + splitX, 0, 56 + (this.splits[index] > fillRatio ? 24 : 0), 213, 24, 11)
            }
        },

        updateBarDraw: function (renderer, x, width, topColor, bottomColor, height) {
            var xPos = 2,
                y = x + height - 1,
                halfHeight = Math.ceil(height / 2);
            while (height--) {
                renderer.addColor(height >= halfHeight ? topColor : bottomColor, y, xPos, width, 1);
                xPos++;
                y--
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

        init: function (target, leftOffset) {
            this.parent(leftOffset, "#ff7a7a", "#d71112");
            this.target = target;
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.model.message, this);
            this.doStateTransition("HIDDEN", true);
            this._isHpBarVisible() && (sc.model.isCutscene() ? this.doStateTransition("CUTSCENE") : this.doStateTransition("DEFAULT"))
        },

        initWithParams: function () {
            this.setMaxValue(this.target.params.getStat("hp"));
            this.setValue(this.target.params.currentHp, true);
            this.updateSplits();
            sc.Model.addObserver(this.target.params, this)
        },

        _isHpBarVisible: function () {
            return this.target.visibility.hpBar == sc.ENEMY_HP_BAR.VISIBLE ? true : this.target.visibility.hpBar == sc.ENEMY_HP_BAR.HIDDEN ? false : this.target.aggression != sc.ENEMY_AGGRESSION.PEACEFUL
        },

        modelChanged: function (model) {
            if (!this.hook.removeAfterTransition) {
                if (model instanceof sc.GameModel || model instanceof sc.MessageModel) this._isHpBarVisible() && (sc.model.isCutscene() ? this.doStateTransition(sc.model.message.hasPerson() ? "HIDDEN_CUTSCENE" : "CUTSCENE") : this.doStateTransition("DEFAULT"));
                else {
                    this.setMaxValue(this.target.params.getStat("hp"));
                    this.setHp(this.target.params.currentHp)
                }
            }
        },

        setHp: function (hp) {
            this.setValue(hp);
            this.updateSplits()
        },

        updateSplits: function () {
            if (this.target) {
                var hpBreaks = this.target.enemyType.hpBreaks,
                    index = hpBreaks.length;
                for (this.splits.length = 0; index-- > this.target.hpBreakReached;) this.splits.push(hpBreaks[index].hp)
            }
        },

        update: function () {
            if (!this.hook.removeAfterTransition) {
                if (this._isHpBarVisible()) sc.model.isCutscene() ? this.doStateTransition(sc.model.message.hasPerson() ? "HIDDEN_CUTSCENE" : "CUTSCENE") : this.doStateTransition("DEFAULT");
                else {
                    this.doStateTransition("HIDDEN");
                    return
                }
                this.parent()
            }
        },

        remove: function () {
            this.target.params && sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.model, this);
            sc.Model.removeObserver(sc.model.message, this);
            this.doStateTransition("HIDDEN", false, true)
        },

        forceRemove: function () {
            this.target.params && sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.model, this);
            this.doStateTransition("HIDDEN", true, true)
        }
    });

    sc.SUB_HP_EDITOR = {};

    var bossBars = [];

    sc.SUB_HP_EDITOR.BOSS = sc.BigHpBar.extend({
        labelGui: null,
        listed: false,
        barOrder: 0,

        init: function (target) {
            this.labelGui = new sc.TextGui("Boss", {
                font: sc.fontsystem.tinyFont
            });
            this.labelGui.setPos(12, 2);
            this.parent(target, this.labelGui.hook.size.x + 4);
            this.addChildGui(this.labelGui);
            this.setSize(ig.system.width - barMargin * 2, 11);
            this.setPivot(this.hook.size.x / 2, 5.5);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(barMargin, 4)
        },

        initWithParams: function () {
            var label = ig.LangLabel.getText(this.target.enemyType.bossLabel);
            this.barOrder = this.target.enemyType.bossOrder;
            this.labelGui.setText(label);
            this.leftOffset = this.labelGui.hook.size.x + 4;
            this.parent()
        },

        update: function () {
            if (this.hook.currentStateName != "HIDDEN" && !this.listed) {
                this.listed = true;
                bossBars.push(this);
                bossBars.sort(compareBarOrder);
                layoutBars(this)
            } else if (this.hook.currentStateName == "HIDDEN" && this.listed) {
                this.listed = false;
                bossBars.erase(this);
                layoutBars()
            }
            this.parent()
        },

        onDetach: function () {
            if (this.listed) {
                this.listed = false;
                bossBars.erase(this);
                layoutBars()
            }
        },

        updatePlacement: function (x, width) {
            this.setSize(width, 11);
            this.setPivot(width / 2, 5.5);
            this.setPos(x, 4)
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

        init: function (target) {
            this.parent(target, 4);
            this.setSize(ig.system.width / 3, 9);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(barMargin, 4);
            this.spBar = new sc.SpMiniHudGui(target.params);
            this.spBar.setPos(12, -6);
            this.addChildGui(this.spBar)
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            this.spBGPatch.draw(renderer, 36, 7, "default", 4, -8);
            renderer.addGfx(this.gfx, -15, -13, 231, 175, 25, 25);
            var headIdx = this.target.getHeadIdx();
            renderer.addGfx(this.heads, -14, -16, headIdx * 24, 0, 24, 24)
        }
    })
});
ig.baked = !0;
