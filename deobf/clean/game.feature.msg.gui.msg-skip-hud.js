ig.module("game.feature.msg.gui.msg-skip-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.boxes", "game.feature.gui.base.text").defines(function() {
    sc.MsgSkipGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0,
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        box: null,
        personEntry: null,
        timer: 0,
        init: function() {
            this.parent();
            this.text = new sc.TextGui("\\i[skip-cutscene]", {});
            this.box = new sc.SmallBlackBoxGui(this.text.hook.size.x +
                4);
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(1, 0);
            this.hook.size.x = this.box.hook.size.x;
            this.hook.size.y = this.box.hook.size.y;
            this.hook.pivot.x = this.box.hook.pivot.x;
            this.hook.pivot.y = this.box.hook.pivot.y;
            this.addChildGui(this.box);
            this.addChildGui(this.text)
        },
        update: function() {
            this.timer = this.timer + ig.system.actualTick;
            var alpha = 0.75 + 0.25 * Math.sin(this.timer / 0.5 * 2 * Math.PI);
            this.box.hook.localAlpha = alpha;
            this.text.hook.localAlpha = alpha
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        }
    })
});
ig.baked = !0;
