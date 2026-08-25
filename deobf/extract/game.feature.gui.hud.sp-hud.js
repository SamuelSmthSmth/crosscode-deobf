ig.module("game.feature.gui.hud.sp-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.numbers", "game.feature.combat.model.combat-params").defines(function() {
    function b(a, b, c, g, h, m, l) {
        var o = e,
            r = f;
        m || (r = r + n);
        l || (r = r + p);
        m = i * 2 + j * 4;
        l = m - k;
        if (g != void 0) {
            o = o + (i + g * j);
            m = m - (i + g * j);
            l = m - k
        }
        if (h != void 0) l = m = m - (i + (4 - h) * j);
        a.addGfx(b, c.posX, 0, o, r, m, d);
        c.posX = c.posX + l
    }

    function a(a, c, e, f, i, j, k) {
        e.sp && e.sp % 4 == 0 && b(a, c, e, void 0, 0, k != r.REMOVED, f <= i);
        var D = f <= i,
            C = 6,
            j = KEY_SPLINES.EASE_IN_OUT.get(j),
            C = Math.round(j *
                C + (1 - j) * 3),
            A = Math.floor(C * (f - Math.floor(f))),
            j = 1 + A,
            A = 1 + C - A,
            B = l,
            w = o;
        if (k == r.ADDED) {
            B = g;
            w = h
        } else if (k == r.REMOVED) {
            B = g;
            w = h + 8
        } else D || (w = w + p);
        a.addGfx(c, e.posX, 0, B, w, j, d);
        k || (w = w + n);
        B = B + (m - A);
        a.addGfx(c, e.posX + j, 0, B, w, A, d);
        e.posX = e.posX + (C + 2);
        e.sp++;
        e.barFilled++;
        if (e.sp % 4 == 0) {
            b(a, c, e, 4, void 0, k == r.ADDED, f <= i);
            e.barFilled = 0;
            e.regenFilled = (i - e.sp).limit(0, 4)
        }
    }
    var d = 7,
        c = {
            sp: 0,
            posX: 0,
            barFilled: 0,
            regenFilled: 0
        };
    sc.SpHudGui = ig.GuiElementBase.extend({
        barHideTimer: 0,
        barShowTimer: 0,
        hideBack: false,
        targetSp: 0,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    scaleY: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/status-gui.png"),
        init: function() {
            this.parent();
            this.setSize(142, d);
            this.setPivot(71, 3);
            var a = sc.model.player.params;
            sc.Model.addObserver(a, this);
            sc.Model.addObserver(sc.model.player, this);
            a.maxSp == 0 && this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            var a = sc.model.player.params.currentSp,
                b = this.targetSp != Math.floor(this.targetSp);
            if (a > this.targetSp) {
                if (!this.hideBack && !b) {
                    this.hideBack = false;
                    this.barShowTimer = 0.2
                }
                if (Math.floor(this.targetSp) < Math.floor(a)) {
                    this.hideBack = false;
                    this.barHideTimer = 0.2;
                    if (Math.floor(a) < a) this.barShowTimer = 0.2
                }
            } else if (a < this.targetSp) {
                if (Math.floor(a) == a && b) {
                    this.hideBack = true;
                    this.barHideTimer = 0.2
                }
                if (Math.floor(this.targetSp) > Math.floor(a)) {
                    this.hideBack = true;
                    this.barShowTimer = 0.2;
                    if (b) this.barHideTimer = 0.2
                }
            }
            this.targetSp = a;
            if (this.barShowTimer) {
                this.barShowTimer = this.barShowTimer - ig.system.actualTick;
                if (this.barShowTimer < 0) this.barShowTimer = 0
            }
            if (this.barHideTimer) {
                this.barHideTimer = this.barHideTimer - ig.system.actualTick;
                if (this.barHideTimer < 0) this.barHideTimer = 0
            }
        },
        updateDrawables: function(e) {
            var f = sc.model.player.params,
                g = f.maxSp || 4,
                h = g * sc.SP_REGEN_FACTOR,
                f = f.currentSp,
                i = Math.floor(f);
            e.addGfx(this.gfx, 0, 0, 0, 16, 19, d);
            this.barHideTimer && !this.hideBack && (i = Math.max(0, i - 1));
            c.posX = 19;
            c.sp = 0;
            c.barFilled = Math.min(4, i);
            for (c.regenFilled = Math.min(4, h); c.sp + 1 <= i;) {
                var j = c.sp ? void 0 : 0;
                if (c.barFilled ==
                    4 && (c.regenFilled == 4 || c.regenFilled == 0)) b(e, this.gfx, c, j, void 0, true, c.regenFilled == 4);
                else if (c.regenFilled > 0 && c.regenFilled < c.barFilled) {
                    var k = c.barFilled == 4 ? void 0 : c.barFilled;
                    b(e, this.gfx, c, j, c.regenFilled, true, true);
                    b(e, this.gfx, c, c.regenFilled, k, true, false)
                } else b(e, this.gfx, c, j, c.barFilled, true, c.regenFilled > 0);
                c.sp = c.sp + c.barFilled;
                if (c.barFilled == 4) {
                    c.barFilled = Math.min(4, i - c.sp);
                    c.regenFilled = (h - c.sp).limit(0, 4)
                }
            }
            if (this.barHideTimer && !this.hideBack) {
                j = this.barHideTimer / 0.2;
                a(e, this.gfx,
                    c, c.sp - 0.001, h, j, r.ADDED);
                i++
            }
            if (f - i > 0) {
                j = (0.2 - this.barShowTimer) / 0.2;
                a(e, this.gfx, c, f, h, j)
            }
            if (this.barHideTimer && this.hideBack) {
                j = this.barHideTimer / 0.2;
                a(e, this.gfx, c, c.sp + 1, h, j, r.REMOVED)
            }
            if (c.sp == 0 || c.sp % 4 != 0) {
                if (c.regenFilled > c.barFilled && c.regenFilled < 4) {
                    b(e, this.gfx, c, c.barFilled, c.regenFilled, false, true);
                    c.barFilled = c.regenFilled
                }
                b(e, this.gfx, c, c.barFilled, void 0, false, c.regenFilled == 4);
                c.sp = c.sp == 0 ? 4 : Math.ceil(c.sp / 4) * 4
            }
            for (; c.sp < g;) {
                c.regenFilled = (h - c.sp).limit(0, 4);
                if (c.regenFilled == 4 ||
                    c.regenFilled == 0) b(e, this.gfx, c, void 0, void 0, false, c.regenFilled == 4);
                else {
                    b(e, this.gfx, c, void 0, c.regenFilled, false, true);
                    b(e, this.gfx, c, c.regenFilled, void 0, false, false)
                }
                c.sp = c.sp + 4
            }
        },
        modelChanged: function(a, b) {
            if (a == sc.model.player.params) {
                if (b == sc.COMBAT_PARAM_MSG.MAX_SP_CHANGED)
                    if (sc.model.player.params.maxSp == 0) {
                        this.doStateTransition("HIDDEN");
                        this.targetSp = 0
                    } else this.doStateTransition("DEFAULT")
            } else a == sc.model.player && b == sc.PLAYER_MSG.CORE_CHANGED && (sc.model.player.getCore(sc.PLAYER_CORE.SPECIAL) ?
                this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN"))
        }
    });
    var e = 96,
        f = 0,
        g = 40,
        h = 16,
        i = 8,
        j = 5,
        k = 6,
        l = 68,
        o = 0,
        m = 26,
        n = 16,
        p = 8,
        r = {
            NONE: 0,
            ADDED: 1,
            REMOVED: 2
        }
});
ig.baked = !0;
