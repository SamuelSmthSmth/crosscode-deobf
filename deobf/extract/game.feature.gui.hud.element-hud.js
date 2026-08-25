ig.module("game.feature.gui.hud.element-hud").requires("impact.feature.gui.gui", "game.feature.combat.model.combat-params", "game.feature.model.options-model").defines(function() {
    var b = [sc.ELEMENT.HEAT, sc.ELEMENT.COLD, sc.ELEMENT.SHOCK, sc.ELEMENT.WAVE],
        a = Vec2.createC(0, 0);
    sc.ElementHudGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        timer: 0,
        icons: [],
        init: function() {
            this.parent();
            this.setSize(64, 64);
            this.hook.zIndex = 1181;
            this.hook.pauseGui = true;
            for (var a = 0; a < b.length; ++a) {
                var c = new sc.ElementHudIconGui(f[b[a]]);
                this.icons.push(c);
                this.addChildGui(c)
            }
            this.doStateTransition("HIDDEN", true);
            sc.Model.addObserver(sc.model.player, this)
        },
        modelChanged: function(a, b) {
            b == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE && sc.options.get("element-select")
        },
        showElement: function(a) {
            for (var c = 0; c < b.length; ++c) this.icons[c].show(a, a == b[c]);
            this.timer = 0.5;
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            for (var a =
                    0; a < b.length; ++a) this.icons[a].hide();
            this.doStateTransition("HIDDEN")
        },
        update: function() {
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                this.timer <= 0 && this.hide()
            }
            this._updatePos(true)
        },
        _updatePos: function() {
            var b = ig.game.playerEntity;
            if (b) {
                b = b.coll;
                ig.system.getScreenFromMapPos(a, Math.round(b.pos.x + b.size.x / 2), Math.round(b.pos.y - b.pos.z - b.size.z / 2 + b.size.y / 2));
                this.hook.pos.x = a.x - this.hook.size.x / 2;
                this.hook.pos.y = a.y - this.hook.size.y / 2
            }
        }
    });
    var d = {
            alignX: ig.GUI_ALIGN.X_CENTER,
            alignY: ig.GUI_ALIGN.Y_TOP,
            tile: 0,
            rotate: 0,
            pShowX: 16,
            pShowY: 32,
            pHideX: 16,
            pHideY: 0
        },
        c = {
            alignX: ig.GUI_ALIGN.X_RIGHT,
            alignY: ig.GUI_ALIGN.Y_CENTER,
            tile: 1,
            rotate: 0.25,
            pShowX: 0,
            pShowY: 16,
            pHideX: 32,
            pHideY: 16
        },
        e = {
            alignX: ig.GUI_ALIGN.X_LEFT,
            alignY: ig.GUI_ALIGN.Y_CENTER,
            tile: 3,
            rotate: 0.75,
            pShowX: 32,
            pShowY: 16,
            pHideX: 0,
            pHideY: 16
        },
        f = {};
    f[sc.ELEMENT.HEAT] = {
        alignX: ig.GUI_ALIGN.X_CENTER,
        alignY: ig.GUI_ALIGN.Y_BOTTOM,
        tile: 2,
        rotate: 0.5,
        pShowX: 16,
        pShowY: 0,
        pHideX: 16,
        pHideY: 32
    };
    f[sc.ELEMENT.COLD] = d;
    f[sc.ELEMENT.SHOCK] = c;
    f[sc.ELEMENT.WAVE] = e;
    sc.ElementHudIconGui =
        ig.GuiElementBase.extend({
            transitions: {
                DEFAULT: {
                    state: {},
                    time: 0.15,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        scaleX: 0,
                        scaleY: 0
                    },
                    time: 0.15,
                    timeFunction: KEY_SPLINES.EASE_IN
                }
            },
            gfx: new ig.Image("media/gui/status-gui.png"),
            iconDir: null,
            currentElement: 0,
            bigSize: false,
            init: function(a) {
                this.parent();
                this.iconDir = a;
                this.setSize(32, 32);
                this.setAlign(a.alignX, a.alignY);
                this.doStateTransition("HIDDEN", true)
            },
            show: function(a, b) {
                this.currentElement = a;
                this.bigSize = b;
                a != sc.ELEMENT.NEUTRAL ? this.setPivot(this.iconDir.pShowX,
                    this.iconDir.pShowY) : this.setPivot(this.iconDir.pHideX, this.iconDir.pHideY);
                this.doStateTransition("HIDDEN", true);
                this.doStateTransition("DEFAULT")
            },
            hide: function() {
                this.currentElement != sc.ELEMENT.NEUTRAL ? this.setPivot(this.iconDir.pHideX, this.iconDir.pHideY) : this.setPivot(this.iconDir.pShowX, this.iconDir.pShowY);
                this.doStateTransition("HIDDEN")
            },
            updateDrawables: function(a) {
                !this.bigSize && this.iconDir.rotate && a.addTransform().setPivot(16, 16).setRotate(this.iconDir.rotate * 2 * Math.PI);
                var b = f[this.currentElement],
                    c, d = 0,
                    e;
                if (this.bigSize) {
                    b = 128 + b.tile * 32;
                    c = 224;
                    e = 32
                } else {
                    b = b ? 136 + (1 + b.tile) * 24 : 136;
                    c = 200;
                    e = 24;
                    d = 4
                }
                a.addGfx(this.gfx, d, 0, b, c, e, e);
                !this.bigSize && this.iconDir.rotate && a.undoTransform()
            }
        })
});
ig.baked = !0;
