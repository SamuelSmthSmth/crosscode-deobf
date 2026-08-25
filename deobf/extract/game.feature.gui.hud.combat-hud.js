ig.module("game.feature.gui.hud.combat-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.box").defines(function() {
    sc.CombatHudGui = ig.GuiElementBase.extend({
        upperGui: null,
        lowerGui: null,
        skipGui: null,
        lineTimer: 0,
        isCombat: false,
        isRanked: false,
        init: function() {
            this.parent();
            this.hook.zIndex = 100;
            this.hook.pauseGui = true;
            this.setSize(ig.system.width, ig.system.height);
            this.upperGui = new sc.CombatUpperHud;
            this.addChildGui(this.upperGui);
            this.lowerGui = new sc.CombatLowerHud;
            this.addChildGui(this.lowerGui);
            this.skipGui = new sc.CombatSkipGui;
            this.addChildGui(this.skipGui);
            sc.Model.addObserver(sc.model, this)
        },
        update: function() {
            if (sc.model.isCombatCooldown() && sc.model.player.getCombatCooldownTime()) this.lineTimer = 0.7 * sc.model.getCombatCooldownFactor();
            else if (this.lineTimer) {
                this.lineTimer = this.lineTimer - ig.system.actualTick;
                if (this.lineTimer <= 0) {
                    this.lineTimer = 0;
                    if (!this.isCombat) {
                        this.progress = 0;
                        this.upperGui.doStateTransition("HIDDEN");
                        this.lowerGui.doStateTransition("HIDDEN")
                    }
                }
            }
        },
        getLineWidth: function() {
            return this.isCombat ?
                1 - this.lineTimer / 0.7 : this.lineTimer / 0.7
        },
        modelChanged: function(a, b) {
            if (b == sc.GAME_MODEL_MSG.COMBAT_MODE_CHANGED) {
                var c = sc.model.isCombatActive();
                if (this.isCombat != c) {
                    this.isCombat = c;
                    this.isRanked = sc.model.isCombatRankActive();
                    c = sc.pvp.isActive();
                    this.lineTimer = 0.7 - this.lineTimer;
                    this.upperGui.combatChanged(this.isCombat, this.isRanked, c);
                    this.lowerGui.combatChanged(this.isCombat, this.isRanked, c)
                }
                if (sc.model.isCombatCooldown()) {
                    c = this.upperGui.getUpperRightWidth();
                    this.skipGui.setPos(c, 3);
                    this.skipGui.show()
                } else this.skipGui.hide()
            }
        }
    });
    sc.CombatSkipGui = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleY: 0,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 0,
            left: 16,
            top: 14,
            right: 16,
            bottom: 0,
            offsets: {
                "default": {
                    x: 48,
                    y: 38
                }
            }
        }),
        init: function() {
            var a = "\\i[menu]" + ig.lang.get("sc.gui.combat-hud.skip"),
                a = new sc.TextGui(a);
            this.parent(a.hook.size.x + 24, 14);
            this.hook.localAlpha = 0.5;
            a.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(a);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        }
    });
    sc.CombatUpperHud = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: 16
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/status-gui.png"),
        ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 16,
            height: 0,
            left: 16,
            top: 14,
            right: 0,
            bottom: 0,
            offsets: {
                battle: {
                    x: 128,
                    y: 80
                },
                cooldown: {
                    x: 160,
                    y: 80
                }
            }
        }),
        sub: {},
        currentSub: null,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, 20);
            this.doStateTransition("HIDDEN", true);
            this.sub.empty = new b.EMPTY;
            this.sub.ranked = new b.RANKED;
            this.sub.pvp = new b.PVP
        },
        updateDrawables: function(a) {
            var b = this.hook,
                c = b.parentHook.gui;
            if (this.currentSub) {
                var e = this.currentSub.hook.size.x + 13,
                    c = Math.ceil(b.size.x * c.getLineWidth()),
                    f = b.size.x - e,
                    b = b.size.x - c,
                    g = !sc.model.isCombatMode() ||
                    sc.model.isCombatCooldown(),
                    h = g ? "#006d7d" : "#b0001d";
                b < f - 1 && a.addColor(h, b, 0, f - 1 - b, 2).setCompositionMode("lighter");
                b = Math.max(0, e + 1 - c);
                b < 13 && a.addGfx(this.gfx, f - 1 + b, 0, 128 + (g ? 16 : 0) + b, 96, 13 - b, 16).setCompositionMode("lighter");
                var i = e - 13 + 1,
                    b = Math.max(0, i - c);
                b < i && a.addColor(h, f - 1 + 13 + b, 13, i - b, 2).setCompositionMode("lighter");
                a.addTransform().setAlpha(0.5);
                this.ninepatch.draw(a, e, 16, g ? "cooldown" : "battle", f, 0);
                a.undoTransform()
            }
        },
        updateSubGui: function(a, b) {
            if (this.currentSub) {
                this.currentSub.end();
                this.removeChildGui(this.currentSub)
            }
            this.currentSub =
                b ? this.sub.pvp : a ? this.sub.ranked : this.sub.empty;
            this.addChildGui(this.currentSub);
            this.currentSub.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.currentSub.start()
        },
        combatChanged: function(a, b, c) {
            if (a) {
                this.doStateTransition("DEFAULT");
                this.updateSubGui(b, c)
            }
        },
        getUpperRightWidth: function() {
            return (this.currentSub && this.currentSub.hook.size.x || 0) + 13
        }
    });
    var b = {};
    sc.CombatLowerHud = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent();
            this.setSize(ig.system.width, 2);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            var b = this.hook,
                c = b.size.x,
                e = b.parentHook.gui.getLineWidth(),
                e = Math.ceil(c * (1 - e)),
                f = !sc.model.isCombatMode() || sc.model.isCombatCooldown() ? "#006d7d" : "#b0001d";
            a.addColor(f, 0, 0, c - e, b.size.y).setCompositionMode("lighter")
        },
        combatChanged: function(a) {
            a && this.doStateTransition("DEFAULT")
        }
    });
    b.EMPTY = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        init: function() {
            this.parent();
            this.setSize(17, 20)
        },
        updateDrawables: function(a) {
            var b = this.hook,
                c = !sc.model.isCombatMode() || sc.model.isCombatCooldown();
            a.addGfx(this.gfx, b.size.x - 18, 0, 160 + (c ? 16 : 0), 96, 13, 13)
        },
        start: function() {},
        end: function() {}
    });
    b.RANKED = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        rankLabel: null,
        rankValue: null,
        progress: 0,
        blinkTimer: 0,
        init: function() {
            this.parent();
            this.setSize(49,
                20);
            this.rankLabel = new sc.TextGui("Rank", {
                font: sc.fontsystem.tinyFont
            });
            this.rankLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.rankLabel.setPos(28, 1);
            this.rankValue = new sc.TextGui("A");
            this.rankValue.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.rankValue.setPos(18, -2);
            this.addChildGui(this.rankLabel);
            this.addChildGui(this.rankValue)
        },
        update: function() {
            var a = sc.model.getCombatRankProgress();
            if (this.progress != a)
                if (sc.model.isSRank()) this.progress = a;
                else {
                    this.progress = 0.2 * a +
                        0.8 * this.progress;
                    if (Math.abs(this.progress - a) < 0.05) this.progress = a
                } this.blinkTimer = sc.model.isSRank() ? this.blinkTimer + ig.system.actualTick : 0
        },
        updateDrawables: function(a) {
            var b = this.hook,
                c = !sc.model.isCombatMode() || sc.model.isCombatCooldown();
            a.addGfx(this.gfx, b.size.x - 18, 0, 160 + (c ? 16 : 0), 96, 13, 13);
            var e = this.progress == 1 ? 22 : Math.floor(21 * this.progress);
            a.addGfx(this.gfx, b.size.x - 50, 8, 128, 112, 24, 3);
            var f = 1 - Math.abs(Math.sin(this.blinkTimer / 0.2 * Math.PI));
            a.addTransform().setAlpha(f);
            e && a.addGfx(this.gfx,
                b.size.x - 50, 8, 128, 112 + (c ? 8 : 4), 1 + e, 3);
            a.undoTransform()
        },
        start: function() {
            sc.Model.addObserver(sc.model, this);
            this.rankValue.setText(sc.model.getCombatRankLabel());
            this.progress = 0
        },
        end: function() {
            sc.Model.removeObserver(sc.model, this)
        },
        modelChanged: function(a, b) {
            if (b == sc.GAME_MODEL_MSG.COMBAT_RANK_CHANGED) {
                this.progress = 1;
                this.rankValue.setText(sc.model.getCombatRankLabel())
            }
        }
    });
    b.PVP = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        heads: new ig.Image("media/gui/severed-heads.png"),
        init: function() {
            this.parent();
            var a;
            a = 110 + sc.pvp.winPoints * 10;
            a = a + (sc.party.getPartySize() + 1) * 16;
            a = a + sc.pvp.enemies.length * 16;
            this.setSize(a, 20)
        },
        updateDrawables: function(a) {
            var b = this.hook.size.x / 2;
            a.addGfx(this.gfx, b - 8, 0, 136, 160, 16, 16);
            var c = sc.pvp.winPoints;
            this._renderPoints(a, b - 12 - 4, -1, c, sc.pvp.points[sc.COMBATANT_PARTY.PLAYER], 0);
            this._renderPoints(a, b + 12, 1, c, sc.pvp.points[sc.COMBATANT_PARTY.ENEMY], 8);
            for (var c = 12 + c * 5, e = [0], f = 0; f < sc.party.getPartySize(); ++f) e.push(sc.party.getPartyMemberModelByIndex(f).getHeadIdx());
            this._renderHeads(a, b - c, true, e);
            e = [];
            for (f = 0; f < sc.pvp.enemies.length; ++f) e.push(sc.pvp.enemies[f].getHeadIdx());
            this._renderHeads(a, b + c, false, e)
        },
        _renderPoints: function(a, b, c, e, f, g) {
            for (var h = 0; h < e; ++h) {
                a.addGfx(this.gfx, b, 2, (e - h > f ? 124 : 120) + g, 160, 4, 12);
                b = b + 5 * c
            }
        },
        _renderHeads: function(a, b, c, e) {
            c && (b = b - 24);
            for (var f = 0; f < e.length; ++f) {
                a.addGfx(this.heads, b, -10, e[f] * 24, 0, 24, 24, c);
                b = b + (c ? -16 : 16)
            }
        },
        start: function() {},
        end: function() {}
    })
});
ig.baked = !0;
