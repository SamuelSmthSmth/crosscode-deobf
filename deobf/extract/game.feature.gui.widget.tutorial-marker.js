ig.module("game.feature.gui.widget.tutorial-marker").requires("impact.base.image", "game.feature.gui.base.boxes").defines(function() {
    sc.TUT_BOX_POINTING_DIR = {
        BOTTOM_RIGHT: {
            alignX: ig.GUI_ALIGN.X_LEFT,
            alignY: ig.GUI_ALIGN.Y_TOP,
            flipped: false,
            scaleX: 1,
            scaleY: 1
        },
        BOTTOM_LEFT: {
            alignX: ig.GUI_ALIGN.X_RIGHT,
            alignY: ig.GUI_ALIGN.Y_TOP,
            flipped: true,
            scaleX: -1,
            scaleY: 1
        },
        TOP_RIGHT: {
            alignX: ig.GUI_ALIGN.X_LEFT,
            alignY: ig.GUI_ALIGN.Y_BOTTOM,
            flipped: true,
            scaleX: 1,
            scaleY: -1
        },
        TOP_LEFT: {
            alignX: ig.GUI_ALIGN.X_RIGHT,
            alignY: ig.GUI_ALIGN.Y_BOTTOM,
            flipped: false,
            scaleX: -1,
            scaleY: -1
        }
    };
    sc.TutorialPointingGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/message.png"),
        init: function(b, a) {
            this.parent();
            var b = b || sc.TUT_BOX_POINTING_DIR.TOP_LEFT,
                d = new sc.RegularBoxGui(b.flipped),
                a = new sc.TextGui(a, {
                    maxWidth: 200
                });
            d.setContent(a);
            d.setAlign(b.alignX, b.alignY);
            d.setPos(18, 18);
            this.addChildGui(d);
            var c = new ig.ImageGui(this.gfx, 56, 64, 32, 32);
            c.hook.setScale(b.scaleX, b.scaleY);
            c.setAlign(b.alignX, b.alignY);
            this.addChildGui(c);
            this.setSize(d.hook.size.x + 18, d.hook.size.y + 18);
            this.setPivot(this.hook.size.x * (1 - (b.scaleX + 1) / 2), this.hook.size.y * (1 - (b.scaleY + 1) / 2));
            this.doStateTransition("HIDDEN", true)
        }
    });
    sc.TutorialShadowGui = ig.GuiElementBase.extend({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 0.7
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 1,
                    scaleY: 1
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        init: function(b, a, d, c) {
            this.parent();
            this.x = b;
            this.y = a;
            this.width = d;
            this.height = c;
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(this.x + this.width / 2, this.y + this.height / 2);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            var a = this.hook.size.x,
                d = this.hook.size.y;
            b.addColor("black", 0, 0, a, this.y);
            b.addColor("black", 0, this.y, this.x, this.height);
            b.addColor("black", this.x + this.width, this.y, a - this.x - this.width,
                this.height);
            b.addColor("black", 0, this.y + this.height, a, d - this.y - this.height)
        }
    });
    sc.TutorialMarkerGui = ig.GuiElementBase.extend({
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
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        shadowGui: null,
        highlightGui: null,
        pointerGui: null,
        callback: null,
        screenInteract: null,
        sounds: {
            start: new ig.Sound("media/sound/hud/popup-2.ogg", 1)
        },
        init: function(b, a, d, c, e, f, g, h, i) {
            this.parent();
            this.hook.pauseGui = true;
            this.setSize(ig.system.width,
                ig.system.height);
            this.hook.zIndex = 2E3;
            this.stopTime = h;
            h = new sc.TutorialShadowGui(b, a, d, c);
            this.addChildGui(h);
            this.shadowGui = h;
            var j = new sc.WhiteLineBox(d + 2, c + 2);
            j.setPos(b - 1, a - 1);
            j.doStateTransition("HIDDEN", true);
            this.addChildGui(j);
            this.highlightGui = j;
            e = new sc.TutorialPointingGui(f, e);
            b = b + d * g;
            a = f.scaleY == 1 ? a + c : a - e.hook.size.y;
            f.scaleX == -1 && (b = b - e.hook.size.x);
            e.setPos(b, a);
            this.addChildGui(e);
            this.pointerGui = e;
            h.doStateTransition("DEFAULT");
            j.doStateTransition("DEFAULT");
            e.doStateTransition("DEFAULT",
                false, false, null, 0.1);
            if (this.stopTime) {
                ig.slowMotion.add(0, 0, "tutorialMsg");
                ig.soundManager.pushPaused();
                this.sounds.start.play()
            }
            this.callback = i;
            this.screenInteract = new sc.ScreenInteractEntry(this);
            this.screenInteract.autoCtrlIgnore = true;
            ig.interact.addEntry(this.screenInteract)
        },
        onInteraction: function() {
            ig.interact.removeEntry(this.screenInteract);
            this._close()
        },
        _close: function() {
            this.shadowGui.doStateTransition("HIDDEN");
            this.highlightGui.doStateTransition("HIDDEN");
            this.pointerGui.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            if (this.stopTime) {
                ig.soundManager.popPaused();
                ig.slowMotion.clearNamed("tutorialMsg", 0)
            }
            this.callback && this.callback()
        }
    })
});
ig.baked = !0;
