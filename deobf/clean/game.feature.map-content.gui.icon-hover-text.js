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
        init: function(text, offsetY, showOnNear, subText) {
            this.parent(134, 20);
            this.hook.localAlpha = 0.6;
            this.hook.pos.y = 4 + (offsetY || 0);
            this.showOnNear = showOnNear || false;
            showOnNear = offsetY = 0;
            if (subText) {
                showOnNear = new sc.TextGui(subText, {
                    font: sc.fontsystem.smallFont,
                    maxWidth: 134
                });
                showOnNear.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.addChildGui(showOnNear);
                offsetY = showOnNear.hook.size.y + 1;
                showOnNear = showOnNear.hook.size.x
            }
            text = new sc.TextGui(text, {
                font: sc.fontsystem.smallFont,
                maxWidth: 134
            });
            text.setAlign(ig.GUI_ALIGN.X_CENTER, subText ? ig.GUI_ALIGN.Y_TOP :
                ig.GUI_ALIGN.Y_CENTER);
            text.setPos(0, offsetY);
            this.addChildGui(text);
            if (text.hook.size.x > showOnNear) showOnNear = text.hook.size.x;
            this.setSize(Math.max(40, showOnNear + 8), text.hook.size.y + 4 + offsetY);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y);
            this.doStateTransition("HIDDEN", true)
        },
        setIconState: function(state) {
            state == sc.INTERACT_ENTRY_STATE.FOCUS || this.showOnNear && state == sc.INTERACT_ENTRY_STATE.NEAR ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")
        },
        isActive: function(state) {
            return state == sc.INTERACT_ENTRY_STATE.FOCUS
        },
        remove: function() {
            this.doStateTransition("HIDDEN",
                false, true)
        }
    })
});
ig.baked = !0;
