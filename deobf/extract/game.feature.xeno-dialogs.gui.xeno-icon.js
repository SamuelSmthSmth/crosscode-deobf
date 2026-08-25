ig.module("game.feature.xeno-dialogs.gui.xeno-icon").requires("impact.feature.gui.gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui", "game.feature.interact.map-interact", "game.feature.msg.gui.msg-skip-hud").defines(function() {
    sc.XenoDialogIcon = ig.BoxGui.extend({
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
                },
                highlight: {
                    x: 16,
                    y: 112
                }
            }
        }),
        textGui: null,
        skipGui: null,
        xenoDialog: null,
        skipEntry: null,
        init: function() {
            this.parent(40, 40);
            this.hook.localAlpha = 0.7;
            this.hook.pos.y = 4;
            this.textGui = new sc.TextGui("This is a sample text.", {
                font: sc.fontsystem.smallFont,
                maxWidth: 140,
                speed: ig.TextBlock.SPEED.SLOW,
                linePadding: 0,
                optimize: true,
                bestRatio: 4
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.textGui.textBlock.onFinish =
                this.onTextFinish.bind(this);
            this.addChildGui(this.textGui);
            this.setSize(this.textGui.hook.size.x + 8, this.textGui.hook.size.y + 4);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y);
            this.doStateTransition("HIDDEN", true);
            this.skipGui = new sc.MsgSkipGui;
            this.addChildGui(this.skipGui);
            this.skipGui.doStateTransition("HIDDEN", true);
            this.skipGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.skipEntry = new sc.SkipInteractEntry(this, 20)
        },
        onTextFinish: function() {
            this.updateSkipIcon()
        },
        isTextFinished: function() {
            return this.textGui.textBlock.isFinished()
        },
        updateSkipIcon: function() {
            this.textGui.textBlock.isFinished() && this.skipEntry.isActive() ? this.skipGui.show() : this.skipGui.hide()
        },
        setText: function(b, a) {
            this.xenoDialog = a;
            this.textGui.setText(b || "This is an empty test");
            var d = this.xenoDialog.currentEvent ? 3 : 2,
                c = Math.max(30, this.textGui.hook.size.x + (this.xenoDialog.currentEvent ? 6 : 4) * 2);
            this.setSize(c, this.textGui.hook.size.y + d * 2);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y);
            this.skipGui.setPos(this.hook.size.x + 1, 0);
            sc.skipInteract.addEntry(this.skipEntry);
            this.currentTileOffset = this.xenoDialog.currentEvent ? "highlight" : "default";
            this.hook.localAlpha = this.xenoDialog.currentEvent ? 0.85 : 0.7;
            this.updateSkipIcon()
        },
        show: function() {
            this.textGui.reset();
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            sc.skipInteract.removeEntry(this.skipEntry);
            this.updateSkipIcon();
            this.doStateTransition("HIDDEN")
        },
        onSkipInteract: function(b) {
            b == sc.SKIP_INTERACT_MSG.SKIPPED && (this.textGui.textBlock.isFinished() ? this.xenoDialog._showNextMessage() : this.textGui.finish());
            this.updateSkipIcon()
        },
        setIconState: function() {},
        isActive: function(b) {
            return b != sc.INPUT_FORCER_ENTRIES.HIDDEN
        },
        remove: function() {
            this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;
