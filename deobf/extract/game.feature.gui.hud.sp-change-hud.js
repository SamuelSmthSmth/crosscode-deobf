ig.module("game.feature.gui.hud.sp-change-hud").requires("impact.feature.gui.gui", "game.feature.combat.model.combat-params", "game.feature.model.options-model").defines(function() {
    var b = Vec2.createC(0, 0),
        a = {
            w: 10,
            x: 4,
            start: 2,
            end: 2
        },
        d = {
            w: 18,
            x: 14,
            start: 2,
            end: 0
        };
    sc.SpChangeHudGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            BIG: {
                state: {
                    scaleY: 2,
                    scaleX: 2
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            HIDDEN: {
                state: {
                    scaleY: 0,
                    scaleX: 1.5
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/status-gui.png"),
        currentSp: 0,
        consumedSp: 0,
        timer: 0,
        init: function() {
            this.parent();
            this.setSize(100, 7);
            this.setPivot(50, 3.5);
            this.zIndex = 10;
            this.doStateTransition("HIDDEN", true);
            sc.Model.addObserver(sc.model.player.params, this)
        },
        modelChanged: function(a, b, d) {
            if (sc.model.isCutscene()) this.hide();
            else if (sc.model.player.getCore(sc.PLAYER_CORE.SPECIAL) && !ig.vars.get("playerVar.statusHidden") && sc.options.get("sp-bar"))
                if (b == sc.COMBAT_PARAM_MSG.SP_CHANGED) {
                    a = sc.model.player.params.getSp();
                    if (d && this.currentSp < a) {
                        this.timer = 1;
                        this._updatePos(true);
                        this.doStateTransition("BIG", true);
                        this.doStateTransition("DEFAULT")
                    }
                    this.currentSp = a
                } else if (b == sc.COMBAT_PARAM_MSG.SP_CONSUME)
                if (this.consumedSp = d) {
                    this.timer = -1;
                    this._updatePos(true);
                    this.doStateTransition("BIG", true);
                    this.doStateTransition("DEFAULT")
                } else {
                    this.timer = 0;
                    this.hide()
                }
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    this.timer =
                        0;
                    this.hide()
                }
            }
            this._updatePos(true)
        },
        updateDrawables: function(b) {
            var e = sc.model.player.params,
                f = e.maxSp,
                e = e.getSp(),
                g = e - this.consumedSp,
                h = this.hook,
                f = Math.max(4, Math.ceil(e / 4) * 4),
                i = 8 + d.w;
            f > 4 && (i = i + (Math.floor(f / 4) - 1) * a.w);
            i = Math.floor((h.size.x - i) / 2);
            h = h.size.y;
            b.addGfx(this.gfx, i, 0, 152, 128, 4, h);
            for (var i = i + 4, j = 0; j < f;) {
                var k = j < e && e - j <= 4;
                j == 0 && e == 0 && (k = true);
                var k = k ? d : a,
                    l = ((g - j) / 4).limit(0, 1),
                    o = ((e - j) / 4).limit(0, 1),
                    m = k.w - k.start - k.end,
                    l = Math.floor(l * m),
                    o = Math.floor(o * m) - l,
                    m = m - l - o;
                l ? l = l + k.start : o ?
                    o = o + k.start : m = m + k.start;
                m ? m = m + k.end : o ? o = o + k.end : l = l + k.end;
                var n = 0;
                if (l) {
                    b.addGfx(this.gfx, i, 0, 152 + k.x + n, 128, l, h);
                    i = i + l;
                    n = n + l
                }
                if (o) {
                    b.addGfx(this.gfx, i, 0, 152 + k.x + n, 136, o, h);
                    i = i + o;
                    n = n + o
                }
                if (m) {
                    b.addGfx(this.gfx, i, 0, 152 + k.x + n, 144, m, h);
                    i = i + m
                }
                j = j + 4
            }
            b.addGfx(this.gfx, i, 0, 184, 128, 4, h)
        },
        _updatePos: function() {
            var a = ig.game.playerEntity;
            if (a) {
                var d = this.hook,
                    f = a.getCenter(b);
                ig.system.getScreenFromMapPos(b, Math.round(f.x), Math.round(f.y - a.coll.pos.z + a.coll.size.y / 2));
                this.hook.pos.x = b.x - d.size.x / 2;
                this.hook.pos.y =
                    b.y - d.size.y / 2
            }
        }
    })
});
ig.baked = !0;
