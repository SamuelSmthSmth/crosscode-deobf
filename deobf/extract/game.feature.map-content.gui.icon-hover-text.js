ig.module("game.feature.map-content.gui.icon-hover-text").requires("impact.feature.gui.gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui", "game.feature.interact.map-interact").defines(function() {
    sc.IconHoverTextGui = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1,
                    offsetY: 8
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 0.4,
                    scaleY: 0.5,
                    alpha: 0,
                    offsetY: 8
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 4,
            height: 4,
            left: 6,
            top: 6,
            right: 6,
            bottom: 6,
            offsets: {
                "default": {
                    x: 0,
                    y: 112
                }
            }
        }),
        showOnNear: false,
        init: function(b, a, d, c) {
            this.parent(134, 20);
            this.hook.localAlpha = 0.6;
            this.hook.pos.y = 4 + (a || 0);
            this.showOnNear = d || false;
            d = a = 0;
            if (c) {
                d = new sc.TextGui(c, {
                    font: sc.fontsystem.smallFont,
                    maxWidth: 134
                });
                d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.addChildGui(d);
                a = d.hook.size.y + 1;
                d = d.hook.size.x
            }
            b = new sc.TextGui(b, {
                font: sc.fontsystem.smallFont,
                maxWidth: 134
            });
            b.setAlign(ig.GUI_ALIGN.X_CENTER, c ? ig.GUI_ALIGN.Y_TOP :
                ig.GUI_ALIGN.Y_CENTER);
            b.setPos(0, a);
            this.addChildGui(b);
            if (b.hook.size.x > d) d = b.hook.size.x;
            this.setSize(Math.max(40, d + 8), b.hook.size.y + 4 + a);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y);
            this.doStateTransition("HIDDEN", true)
        },
        setIconState: function(b) {
            b == sc.INTERACT_ENTRY_STATE.FOCUS || this.showOnNear && b == sc.INTERACT_ENTRY_STATE.NEAR ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")
        },
        isActive: function(b) {
            return b == sc.INTERACT_ENTRY_STATE.FOCUS
        },
        remove: function() {
            this.doStateTransition("HIDDEN",
                false, true)
        }
    })
});
ig.baked = !0;
