ig.module("game.feature.gui.widget.click-box").requires("impact.base.image", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group").defines(function() {
    sc.CenterMsgBoxGui = ig.GuiElementBase.extend({
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
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        bgColor: null,
        msgBox: null,
        textGui: null,
        textDone: false,
        screenInteract: null,
        callback: null,
        init: function(b, a, d, c, e, f) {
            this.parent();
            this.hook.localAlpha =
                c;
            this.hook.zIndex = f ? 2E3 : 90;
            this.hook.pauseGui = f;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.textGui = new sc.TextGui(b, a);
            this.bgColor = d;
            this.msgBox = new sc.CenterBoxGui(this.textGui);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            this.textGui.textBlock.onFinish = this._onTextFinish.bind(this);
            this.textDone = this.textGui.textBlock.isFinished();
            this.callback = e;
            this.screenInteract = new sc.ScreenInteractEntry(this);
            ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
        },
        setBoxOffset: function(b, a) {
            this.msgBox.hook.pos.x = b;
            this.msgBox.hook.pos.y = a
        },
        _onTextFinish: function() {
            this.textDone = true
        },
        onInteraction: function() {
            if (this.textDone) {
                ig.interact.removeEntry(this.screenInteract);
                this._close()
            } else this.textGui.finish()
        },
        _close: function() {
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            this.callback &&
                this.callback()
        },
        update: function() {
            !this.hook.removeAfterTransition && (this.textDone && ig.system.skipMode) && this._close();
            this.parent()
        },
        updateDrawables: function(b) {
            this.bgColor && b.addColor(this.bgColor, 0, 0, this.hook.size.x, this.hook.size.y)
        }
    })
});
ig.baked = !0;
