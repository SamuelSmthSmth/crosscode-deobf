ig.module("game.feature.gui.base.slick-box").requires("impact.feature.gui.base.box", "impact.feature.gui.gui").defines(function() {
    sc.SlickTitleGui = ig.BoxGui.extend({
        text: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 1,
                    offsetX: -32
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 9,
            left: 0,
            top: 0,
            right: 8,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 64
                }
            }
        }),
        init: function(b, a, d) {
            b = new sc.TextGui(b, {
                font: sc.fontsystem.tinyFont
            });
            d = d || b.hook.size.x + this.tile.right + 8;
            this.parent(d, 9, a);
            this.hook.pivot.y = this.hook.size.y;
            b.setPos(!a ? 2 : 1, 0);
            a && b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(b)
        }
    });
    sc.SlickBoxRawGui = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 12,
            height: 12,
            left: 0,
            top: 4,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 24,
                    y: 64
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleX: 1,
                    scaleY: 0,
                    offsetX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function(b, a, d) {
            this.parent(b, a, d);
            this.hook.localAlpha = 0.5
        }
    });
    sc.SlickBoxGui = sc.SlickBoxRawGui.extend({
        paddingX: 0,
        paddingY: 0,
        minWidth: 0,
        subGui: null,
        init: function(b, a, d, c, e) {
            this.paddingX = d || 0;
            this.paddingY = c || 0;
            this.minWidth = e || 0;
            this.parent(0, 0, a);
            this.setContent(b)
        },
        setContent: function(b) {
            this.subGui = b;
            b.hook.align.x = this.flipped ? ig.GUI_ALIGN.X_RIGHT : ig.GUI_ALIGN.X_LEFT;
            b.setPos(2, this.paddingY);
            var a = b.hook.size.x + this.paddingX + 2;
            if (this.minWidth &&
                a < this.minWidth) a = this.minWidth;
            this.setSize(a, b.hook.size.y + this.paddingY * 2);
            this.removeAllChildren();
            this.addChildGui(b)
        }
    });
    sc.SlickBigSideGui = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 16,
            left: 0,
            top: 16,
            right: 0,
            bottom: 16,
            offsets: {
                "default": {
                    x: 40,
                    y: 64
                }
            }
        }),
        init: function(b, a) {
            this.parent(16, b, a);
            this.hook.localAlpha = 0.5
        }
    });
    sc.SlickSmallSideGui = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 8,
            height: 32,
            left: 0,
            top: 8,
            right: 0,
            bottom: 8,
            offsets: {
                "default": {
                    x: 40,
                    y: 64
                }
            }
        }),
        init: function(b, a) {
            this.parent(8, b, a);
            this.hook.localAlpha = 0.5
        }
    })
});
ig.baked = !0;
