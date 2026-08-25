ig.module("game.feature.gui.base.misc").requires("impact.feature.interact.gui.focus-gui", "impact.feature.gui.gui").defines(function() {
    sc.DebugFocusGui = ig.FocusGui.extend({
        color: "#00FF00",
        overColor: "#FF0000",
        focusColor: "#0000FF",
        init: function(b, a) {
            this.parent();
            this.hook.size.x = b || 20;
            this.hook.size.y = a || 20;
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2
        },
        updateDrawables: function(b) {
            var a = null,
                a = this.focus ? this.focusColor : this.hook.mouseOver ? this.overColor : this.color;
            b.addColor(a,
                0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.5)
        }
    });
    sc.SlopeLine_Color = {
        WHITE: {
            x: 88,
            y: 458
        },
        BLUE: {
            x: 105,
            y: 458
        },
        ORANGE: {
            x: 122,
            y: 458
        },
        GREY: {
            x: 576,
            y: 0
        },
        DARK_GREY: {
            x: 592,
            y: 0
        }
    };
    sc.SlopeLine = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        pixel: 0,
        right: true,
        down: true,
        height: 0,
        timer: 0,
        time: 0,
        visible: true,
        _tempPixel: 0,
        _animating: 0,
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
        init: function(b,
            a, d, c) {
            this.parent();
            this.color = c || sc.SlopeLine_Color.WHITE;
            this._tempPixel = this.pixel = b;
            this.right = a != void 0 ? a : true;
            this.down = d != void 0 ? d : true
        },
        update: function() {
            if (this.timer < this.time) {
                this.timer = this.timer + ig.system.actualTick;
                if (this.timer >= this.time) {
                    this.timer = this.time;
                    if (this._animating == 2) this.visible = false;
                    this._animating = 0
                }
            }
            if (this._animating == 0) this._tempPixel = this.pixel;
            else if (this._animating == 1) this._tempPixel = Math.ceil(Math.max(0, this.timer) / this.time * this.pixel);
            else if (this._animating ==
                2) this._tempPixel = Math.ceil((1 - Math.max(0, this.timer) / this.time) * this.pixel)
        },
        updateDrawables: function(b) {
            if (this.visible) {
                var a = 0,
                    d = Math.ceil(Math.abs(this._tempPixel) / 16),
                    c = this._tempPixel,
                    e = 16;
                if (!this.right || !this.down) b.addTransform().setScale(this.right ? 1 : -1, this.down ? 1 : -1);
                for (; d--;) {
                    c < 16 && (e = c);
                    b.addGfx(this.gfx, a, a, this.color.x, this.color.y, e, e);
                    a = a + 16;
                    c = Math.max(0, c - 16)
                }(!this.right || !this.down) && b.undoTransform()
            }
        },
        show: function(b, a) {
            if (b) {
                this.timer = 0 - (a || 0);
                this.time = b || 0.3
            } else this.time =
                this.timer = 0.1;
            this._animating = 1;
            this.visible = true
        },
        hide: function(b, a) {
            if (b) {
                this.timer = 0 - (a || 0);
                this.time = b || 0.3;
                this._animating = 2
            } else {
                this.timer = this.time = 0;
                this.visible = false;
                this._animating = 0
            }
        }
    });
    sc.LabeledNumberGuy = ig.GuiElementBase.extend({
        numberGui: null,
        init: function(b, a, d, c) {
            this.parent();
            b = new sc.TextGui(b);
            this.addChildGui(b);
            this.numberGui = new sc.NumberGui(d, c);
            this.numberGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.numberGui.setPos(0, 3);
            this.addChildGui(this.numberGui);
            this.setSize(a + this.numberGui.hook.size.x, Math.max(b.hook.size.y, this.numberGui.hook.size.y))
        },
        setNumber: function(b, a) {
            this.numberGui.setNumber(b, a)
        }
    })
});
ig.baked = !0;
