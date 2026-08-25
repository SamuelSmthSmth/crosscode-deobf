ig.module("game.feature.msg.gui.message-board").requires("impact.feature.gui.gui", "game.feature.gui.base.boxes", "game.feature.gui.base.text").defines(function() {
    sc.MsgBoardContentGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        text: null,
        init: function() {
            this.parent();
            var a = 230;
            ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth && (a = 202);
            this.text =
                new sc.TextGui("WHATEVER", {
                    maxWidth: a,
                    textAlign: ig.Font.ALIGN.LEFT,
                    bestRatio: 10,
                    optimize: true
                });
            this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.text);
            this.doStateTransition("HIDDEN", true)
        },
        setContent: function(a, c, e, f) {
            var g = 0,
                h = 0;
            this.text.setTextAlign(c);
            this.text.setTextSpeed(e);
            this.text.textBlock.onFinish = f;
            this.text.setPos(0, h);
            this.text.setText(a);
            h = h + this.text.hook.size.y;
            g = Math.max(g, this.text.hook.size.x);
            this.setSize(g, h);
            this.doStateTransition("HIDDEN",
                true);
            this.doStateTransition("DEFAULT", false, false, null, e == ig.TextBlock.SPEED.IMMEDIATE ? b : 0)
        },
        isFinished: function() {
            return this.text.textBlock.isFinished()
        },
        skip: function() {
            this.text.finish()
        }
    });
    var b = 0.1,
        a = Vec2.create();
    sc.MsgBoardGui = ig.GuiElementBase.extend({
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
                    scaleY: 0.1,
                    scaleX: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        box: null,
        content: null,
        side: null,
        sizeTransition: {
            start: Vec2.create(),
            end: Vec2.create(),
            timer: 0
        },
        init: function() {
            this.parent();
            this.box = new sc.ArrowBoxGui(8, 8, sc.ArrowBoxGui.POINTER.NONE);
            this.addChildGui(this.box);
            this.content = new sc.MsgBoardContentGui;
            this.content.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.content);
            this.setSide(null)
        },
        setSide: function(a) {
            this.side = a;
            var b = 0,
                e = -80;
            if (a) {
                e = 56;
                b = 96;
                a == sc.MESSAGE_SIDES.LEFT && (b = -b)
            }
            if (this.hook.pos.x != b || this.hook.pos.y != e) this.hook.currentStateName == "HIDDEN" ? this.setPos(b, e) : this.doPosTranstition(b, e, 0.3, KEY_SPLINES.EASE_IN_OUT)
        },
        hasSide: function() {
            return this.side
        },
        setContent: function(a, c, e, f, g) {
            this.content.setContent(a, c, e, f);
            this.setSide(g);
            a = this.content.hook.size;
            c = a.x + 20;
            e = a.y + 12;
            g = 250;
            ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].fixedMsgWidth && (g = 220);
            c = Math.max(g, c);
            e = Math.max(36, e);
            this.content.setPos((c - a.x) / 2, (e - a.y) / 2);
            if (this.hook.currentStateName == "HIDDEN") {
                this.doStateTransition("DEFAULT");
                this.setSize(c, e)
            } else if (this.hook.size.x != c || this.hook.size.y != e) {
                Vec2.assign(this.sizeTransition.start,
                    this.hook.size);
                Vec2.assignC(this.sizeTransition.end, c, e);
                this.sizeTransition.timer = b
            }
            this.content.isFinished() && f()
        },
        skip: function() {
            this.content.skip()
        },
        setSize: function(a, b) {
            this.parent(a, b);
            this.setPivot(a / 2, b / 2);
            this.box.setSize(a, b)
        },
        update: function() {
            if (this.sizeTransition.timer) {
                this.sizeTransition.timer = this.sizeTransition.timer - ig.system.actualTick;
                if (this.sizeTransition.timer < 0) this.sizeTransition.timer = 0;
                var d = 1 - this.sizeTransition.timer / b,
                    d = KEY_SPLINES.EASE_IN_OUT.get(d),
                    d = Vec2.lerp(this.sizeTransition.start,
                        this.sizeTransition.end, d, a);
                this.setSize(this.sizeTransition.end.x, d.y)
            }
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a)
        }
    })
});
ig.baked = !0;
