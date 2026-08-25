ig.module("game.feature.gui.hud.hp-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.numbers", "game.feature.model.options-model").defines(function() {
    sc.HpHudGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/status-gui.png"),
        criticalText: null,
        hpNumber: null,
        hpBar: null,
        critical: false,
        criticalTimer: 0,
        init: function(b) {
            this.parent();
            this.setSize(68,
                16);
            this.setPivot(36, 16);
            this.hpNumber = new sc.NumberGui(9999, {
                signed: true,
                transitionTime: 0.5
            });
            this.hpNumber.setPos(12, 1);
            this.addChildGui(this.hpNumber);
            this.criticalText = new sc.TextGui("\\c[1]CRITICAL", {
                font: sc.fontsystem.tinyFont
            });
            this.criticalText.setPos(20, 0);
            this.addChildGui(this.criticalText);
            this.criticalText.hook.localAlpha = 0;
            b = sc.model.player.params;
            this.hpBar = new sc.HpHudBarGui(b, 48, 3);
            this.hpBar.setPos(12, 9);
            this.addChildGui(this.hpBar);
            sc.Model.addObserver(b, this);
            sc.Model.addObserver(sc.model.player,
                this);
            sc.Model.addObserver(sc.options, this);
            this.hpNumber.setNumber(b.currentHp, true)
        },
        update: function() {
            if (this.critical) {
                this.hpNumber.hook.localAlpha = 0;
                this.criticalTimer = this.criticalTimer - ig.system.actualTick;
                if (this.criticalTimer <= 0) this.criticalTimer = 0.1;
                this.criticalText.hook.localAlpha = this.criticalTimer < 0.05 ? 0 : 1
            } else {
                this.hpNumber.hook.localAlpha = 1;
                this.criticalTimer = this.criticalText.hook.localAlpha = 0
            }
            var b = sc.model.player.hasLevelUp() ? 1 : (sc.model.player.exp / sc.EXP_PER_LEVEL).limit(0, 1);
            this.hpBar.setExpRatio(b)
        },
        updateDrawables: function(b) {
            b.addGfx(this.gfx, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
        },
        modelChanged: function(b, a) {
            if (b == sc.model.player.params) {
                var d = Math.max(0, b.currentHp);
                a == sc.COMBAT_PARAM_MSG.HP_CHANGED ? this.hpNumber.setNumber(d) : a == sc.COMBAT_PARAM_MSG.STATS_CHANGED ? this.hpNumber.setNumber(d, !this.hook._visible) : a == sc.COMBAT_PARAM_MSG.RESET_STATS && this.hpNumber.setNumber(d, true);
                if (a == sc.COMBAT_PARAM_MSG.HP_CHANGED || a == sc.COMBAT_PARAM_MSG.STATS_CHANGED)
                    if (b.getHpFactor() <=
                        sc.HP_LOW_WARNING) {
                        this.hpNumber.setColor(sc.GUI_NUMBER_COLOR.RED);
                        sc.options.get("low-health-warning") && ig.overlay.setCorner("RED", 1, 0.4, 0.5)
                    } else {
                        this.hpNumber.setColor(sc.GUI_NUMBER_COLOR.WHITE);
                        sc.options.get("low-health-warning") && ig.overlay.setCorner("RED", 0, 0.4)
                    } this.critical = b.currentHp <= 0 && !b.defeated
            } else if (b == sc.model.player) {
                if (a == sc.PLAYER_MSG.SET_PARAMS || a == sc.PLAYER_MSG.CONFIG_CHANGED) {
                    d = sc.model.player.params;
                    this.hpNumber.setNumber(Math.max(0, d.currentHp), true);
                    this.hpBar.resetHp();
                    this.critical = d.currentHp <= 0 && !d.defeated
                }
            } else b == sc.options && a == sc.OPTIONS_EVENT.OPTION_CHANGED && (this.targetHp / this.maxHp <= sc.HP_LOW_WARNING ? sc.options.get("low-health-warning") ? ig.overlay.setCorner("RED", 1, 0.4, 0.5) : ig.overlay.setCorner("RED", 0, 0.4) : ig.overlay.setCorner("RED", 0, 0.4))
        }
    });
    sc.HpHudBarGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        maxHp: 0,
        currentHp: 0,
        targetHp: 0,
        timer: 0,
        expTimer: 0,
        params: null,
        width: 0,
        height: 0,
        expRatio: 0,
        init: function(b, a, d) {
            this.parent();
            this.params = b;
            this.width = a || 48;
            this.height = d || 3;
            this.maxHp = b.getStat("hp");
            this.currentHp = this.targetHp = b.currentHp
        },
        onAttach: function() {
            sc.Model.addObserver(this.params, this)
        },
        onDetach: function() {
            sc.Model.removeObserver(this.params, this)
        },
        update: function() {
            if (this.targetHp < 0) {
                this.currentHp = -1;
                this.timer = (this.timer + ig.system.actualTick) % 0.2
            } else if (this.timer > 0) this.timer = this.timer - ig.system.actualTick;
            else if (this.targetHp != this.currentHp) {
                var b = ig.system.actualTick * this.maxHp / 2;
                if (this.currentHp >
                    this.targetHp) this.currentHp = Math.max(this.targetHp, this.currentHp - b);
                else if (this.currentHp < this.targetHp) this.currentHp = Math.min(this.targetHp, this.currentHp + b)
            }
            if (this.expRatio >= 1) this.expTimer = (this.expTimer + ig.system.actualTick) % 0.2
        },
        setExpRatio: function(b) {
            this.expRatio = b
        },
        resetHp: function() {
            this.maxHp = this.params.getStat("hp");
            this.currentHp = this.targetHp = this.params.currentHp
        },
        updateDrawables: function(b) {
            var a, d, c, e, f = 1;
            if (this.targetHp > 0) {
                if (this.targetHp < this.currentHp) {
                    d = this.currentHp /
                        this.maxHp;
                    a = this.targetHp / this.maxHp;
                    e = 49
                } else {
                    d = this.targetHp / this.maxHp;
                    a = this.currentHp / this.maxHp;
                    e = 51
                }
                c = a > sc.HP_LOW_WARNING ? 48 : 50
            } else {
                a = 1;
                c = 50;
                f = this.timer / 0.2;
                f = (f < 0.5 ? f : 1 - f) * 2
            }
            for (var g = 0; g < this.height; g++) {
                d && this.targetHp != this.currentHp && b.addGfx(this.gfx, g, g, 0, e, d.limit(0, 1) * this.width, 1).setAlpha(f);
                a > 0 && b.addGfx(this.gfx, g, g, 0, c, a.limit(0, 1) * this.width, 1).setAlpha(f)
            }
            a = this.expTimer > 0.1;
            d = this.expRatio;
            c = this.expRatio >= 1;
            d && b.addGfx(this.gfx, this.height + 1, this.height + 1, 0, 48 + (c && a ? 6 :
                4), d.limit(0, 1) * this.width, 1)
        },
        modelChanged: function(b, a) {
            if (a == sc.COMBAT_PARAM_MSG.HP_CHANGED) {
                this.timer = 0.5;
                if ((this.targetHp - this.currentHp) * (b.currentHp - this.targetHp) < 0) this.currentHp = this.targetHp;
                this.targetHp = b.currentHp;
                this.maxHp = b.getStat("hp")
            } else if (a == sc.COMBAT_PARAM_MSG.STATS_CHANGED) {
                this.maxHp = b.getStat("hp");
                this.targetHp = b.currentHp;
                this.currentHp = this.currentHp - (this.targetHp - b.currentHp)
            } else if (a == sc.COMBAT_PARAM_MSG.RESET_STATS) {
                this.maxHp = b.getStat("hp");
                this.currentHp = this.targetHp =
                    b.currentHp
            }
            if (this.currentHp < -1) this.currentHp = -1
        }
    })
});
ig.baked = !0;
