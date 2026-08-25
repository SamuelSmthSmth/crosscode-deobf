ig.module("game.feature.gui.hud.buff-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui").defines(function() {
    sc.BuffHudEntry = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 2,
            height: 0,
            left: 2,
            top: 10,
            right: 2,
            bottom: 0,
            offsets: {
                "default": {
                    x: 241,
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
                    alpha: 0,
                    offsetX: 20
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            REMOVE: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            SCALED: {
                state: {
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        buff: null,
        id: 0,
        init: function(b, a, d) {
            this.parent(10, 10);
            this.buff = b;
            this.id = a || 0;
            b = new sc.TextGui(b.iconString, {
                font: sc.fontsystem.tinyFont,
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(1, 1);
            this.addChildGui(b);
            this.setSize(b.hook.size.x + 5 + 1, 10);
            this.setPos(d, 0);
            this.setPivot(0, this.hook.size.y / 2);
            this.doStateTransition(a == 0 ? "HIDDEN" : "SCALED",
                true)
        },
        updateDrawables: function(b) {
            this.parent(b);
            if (this.buff.hasTimer) {
                var a = Math.ceil(this.buff.getTimeFactor() * 8);
                b.addGfx(this.ninepatch.gfx, this.hook.size.x - 4, 1, 249, 129, 2, 8);
                a > 0 && b.addGfx(this.ninepatch.gfx, this.hook.size.x - 4, this.hook.size.y - 1 - a, 252, 129 + (8 - a), 2, a)
            }
        }
    });
    sc.BuffHudGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        startPiece: null,
        endPiece: null,
        buffSlots: [],
        init: function() {
            this.parent();
            sc.Model.addObserver(sc.model.player.params, this);
            this.startPiece = new ig.ImageGui(this.gfx,
                216, 128, 10, 10);
            this.startPiece.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 20
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                REMOVE: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.startPiece.doStateTransition("REMOVE", true);
            this.addChildGui(this.startPiece);
            this.endPiece = new ig.ImageGui(this.gfx, 230, 129, 10, 10);
            this.endPiece.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 20
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                REMOVE: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.endPiece.doStateTransition("REMOVE", true);
            this.addChildGui(this.endPiece)
        },
        update: function() {
            for (var b = this.buffSlots.length, a = false; b--;)
                if (this.buffSlots[b] && this.buffSlots[b].buff.getTimeFactor() <= 0) {
                    b == 0 && !this.buffSlots[b + 1] ? this.buffSlots[b].doStateTransition("REMOVE", false, true) : this.buffSlots[b].doStateTransition("SCALED", false, true);
                    this.buffSlots.splice(b, 1);
                    a = true
                } if (a &&
                this.sortSlots()) {
                this.startPiece.doStateTransition("REMOVE");
                this.endPiece.doStateTransition("REMOVE")
            }
        },
        sortSlots: function() {
            for (var b = 10, a = true, d = null, c = 0; c < this.buffSlots.length; c++)
                if (d = this.buffSlots[c]) {
                    a = false;
                    d.doPosTranstition(b, 0, 0.2, KEY_SPLINES.EASE);
                    d.id = c;
                    b = b + d.hook.size.x
                } a || this.endPiece.doPosTranstition(b, 0, 0.2, KEY_SPLINES.EASE);
            return a
        },
        addBuff: function(b) {
            for (var a = 10, d = 0, c = 0; c < this.buffSlots.length; c++)
                if (this.buffSlots[c]) {
                    a = a + this.buffSlots[c].hook.size.x;
                    d++
                } b = new sc.BuffHudEntry(b,
                d, a);
            b.doStateTransition("DEFAULT");
            this.addChildGui(b);
            this.buffSlots[d] = b;
            if (d == 0) {
                this.startPiece.doStateTransition("HIDDEN", true);
                this.endPiece.doStateTransition("HIDDEN", true);
                this.endPiece.setPos(a + b.hook.size.x, 0)
            } else this.endPiece.doPosTranstition(a + b.hook.size.x, 0, 0.2, KEY_SPLINES.EASE);
            this.startPiece.doStateTransition("DEFAULT");
            this.endPiece.doStateTransition("DEFAULT")
        },
        removeAll: function() {
            this.hook.removeAllChildren();
            for (var b = 0; b < this.buffSlots.length; b++) this.buffSlots[b] && this.buffSlots[b].doStateTransition("REMOVE",
                true, true);
            this.buffSlots.length = 0;
            this.startPiece.doStateTransition("REMOVE", true);
            this.endPiece.doStateTransition("REMOVE", true);
            this.addChildGui(this.startPiece);
            this.addChildGui(this.endPiece)
        },
        modelChanged: function(b, a, d) {
            a == sc.COMBAT_PARAM_MSG.BUFF_ADDED ? this.addBuff(d) : (a == sc.COMBAT_PARAM_MSG.RESET_STATS || a == sc.COMBAT_PARAM_MSG.BUFFS_CLEARED) && this.removeAll()
        }
    })
});
ig.baked = !0;
