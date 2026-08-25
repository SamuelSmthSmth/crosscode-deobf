ig.module("game.feature.gui.widget.tutorial-start-gui").requires("impact.base.image", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group", "game.feature.gui.base.compact-choice-box").defines(function() {
    sc.TutorialStartHeaderGui = ig.GuiElementBase.extend({
        init: function(b, a) {
            this.parent();
            var d = new sc.TextGui(ig.lang.get(b.title), {
                font: sc.fontsystem.tinyFont
            });
            d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(d);
            var c = new sc.TextGui(a);
            c.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, d.hook.size.y);
            this.addChildGui(c);
            this.setSize(Math.max(d.hook.size.x, c.hook.size.x), d.hook.size.y + c.hook.size.y)
        }
    });
    sc.TutorialStartContentGui = ig.GuiElementBase.extend({
        init: function(b, a) {
            this.parent();
            var d = null,
                c = 0;
            if (a) {
                d = new ig.ImageGui(a);
                d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.addChildGui(d);
                c = c + (d.hook.size.y + 2)
            }
            var e = new sc.TextGui(b, {
                maxWidth: d && d.hook.size.x || 400,
                textAlign: ig.Font.ALIGN.CENTER
            });
            e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            e.setPos(0, c);
            this.addChildGui(e);
            c = c + e.hook.size.y;
            this.setSize(Math.max(d && d.hook.size.x, e.hook.size.x), c)
        }
    });
    sc.TutorialStartGui = ig.GuiElementBase.extend({
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
        titleBox: null,
        contentText: null,
        contentImage: null,
        centerBox: null,
        decisionBox: null,
        screenInteract: null,
        pausePushed: false,
        sounds: {
            start: new ig.Sound("media/sound/hud/popup.ogg", 1)
        },
        init: function(b,
            a, d, c, e) {
            this.parent();
            this.hook.localAlpha = 0.5;
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.pauseGui = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.callback = e;
            this.titleBox = new sc.CenterBoxGui(new sc.TutorialStartHeaderGui(b, a));
            this.titleBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.titleBox.setPos(0, 24);
            this.addChildGui(this.titleBox);
            this.contentText = d;
            if (c) {
                this.contentImage = new ig.Image(c);
                this.contentImage.addLoadListener(this)
            } else this.buildContent();
            this.decisionBox = new sc.CompactChoiceBoxGui([{
                key: "show",
                label: ig.lang.get(b.yes)
            }, {
                key: "skip",
                label: ig.lang.get(b.no)
            }], 200, this.onChoice.bind(this));
            this.decisionBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.decisionBox.setPos(0, 24);
            this.addChildGui(this.decisionBox);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            this.startPause();
            sc.model.clearTopMessage();
            sc.model.addChoiceGui(this)
        },
        onLoadableComplete: function() {
            this.buildContent()
        },
        buildContent: function() {
            if (this.titleBox) {
                var b =
                    new sc.TutorialStartContentGui(this.contentText, this.contentImage);
                this.msgBox = new sc.CenterBoxGui(b);
                this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                this.msgBox.setPos(0, -3);
                this.addChildGui(this.msgBox)
            }
        },
        onDetach: function() {
            this.clearPause();
            this.contentImage && this.contentImage.decreaseRef()
        },
        startPause: function() {
            this.pausePushed = true;
            ig.slowMotion.add(0, 0, "tutorial");
            ig.slowMotion.forceUpdate();
            this.sounds.start.play()
        },
        clearPause: function() {
            if (this.pausePushed) {
                this.pausePushed =
                    false;
                ig.slowMotion.clearNamed("tutorial", 0);
                ig.slowMotion.forceUpdate()
            }
        },
        _close: function() {
            sc.model.removeChoiceGui(this);
            this.titleBox.doStateTransition("HIDDEN");
            this.msgBox && this.msgBox.doStateTransition("HIDDEN");
            this.decisionBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            this.clearPause();
            this.titleBox = null
        },
        updateDrawables: function(b) {
            b.addColor("black", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        onChoice: function(b) {
            this._close();
            this.callback && this.callback(b == "show")
        }
    })
});
ig.baked = !0;
