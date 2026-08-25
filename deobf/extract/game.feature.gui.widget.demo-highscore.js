ig.module("game.feature.gui.widget.demo-highscore").requires("impact.base.event", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers").defines(function() {
    function b(b) {
        return a(b / 60 / 60, 2) + ":" + a(b / 60, 2) + ":" + a(Math.floor(b) % 60, 2) + "." + a(b * 100 % 100, 2)
    }

    function a(a, b) {
        var e = "0000" + Math.floor(a);
        return e.length >= 4 + b ? Math.floor(a) : e.substr(e.length - b)
    }
    sc.DemoHighscoreEntry = ig.GuiElementBase.extend({
        nameGui: null,
        valueGui: null,
        name: null,
        value: null,
        init: function(d,
            c, e) {
            this.parent();
            this.hook.size.x = 200;
            this.hook.size.y = 18;
            this.nameGui = new sc.TextGui((e ? "\\c[3]" : "") + a(d, 2));
            this.nameGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.nameGui.setPos(10, 0);
            this.addChildGui(this.nameGui);
            this.valueGui = new sc.TextGui((e ? "\\c[3]" : "") + b(c));
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.valueGui);
            c = new ig.ColorGui("#222222", 200, 1);
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            c.setPos(5, 0);
            this.addChildGui(c);
            if (d % 2 == 1 && !e) {
                this.nameGui.hook.localAlpha = 0.6;
                this.valueGui.hook.localAlpha = 0.6
            }
        }
    });
    sc.DemoHighscore = ig.GuiElementBase.extend({
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
        msgBox: null,
        content: null,
        callback: null,
        screenInteract: null,
        second: false,
        init: function(a, b) {
            this.parent();
            this.hook.localAlpha = 0.8;
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y =
                ig.system.height;
            this.callback = a;
            this.second = b != void 0 ? b : false;
            this.screenInteract = new sc.ScreenInteractEntry(this);
            this.content = new ig.GuiElementBase;
            this.content.setSize(210, 218);
            this._createContent();
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
        },
        update: function() {
            !this.hook.removeAfterTransition &&
                ig.system.skipMode && this._close();
            this.parent()
        },
        updateDrawables: function(a) {
            a.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        onInteraction: function() {
            ig.interact.removeEntry(this.screenInteract);
            this._close()
        },
        _createContent: function() {
            var a = 2,
                b = new sc.TextGui(ig.lang.get("sc.gui.highscore.header" + (this.second ? "2" : "")));
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            b.setPos(0, a);
            this.content.addChildGui(b);
            a = a + (b.hook.size.y + 2);
            b = new sc.LineGui(200);
            b.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_TOP);
            b.setPos(0, a);
            this.content.addChildGui(b);
            for (var a = a + 4, b = this.second ? sc.model.highScoreObs : sc.model.highScore, e = 0; e < 10; e++) a = b[e] != void 0 ? this._createHighscoreEntryLine(a, e + 1, b[e], e == 0) : this._createHighscoreEntryLine(a, e + 1, 0, e == 0)
        },
        _createHighscoreEntryLine: function(a, b, e, f) {
            b = new sc.DemoHighscoreEntry(b, e, f);
            b.setPos(0, a);
            this.content.addChildGui(b);
            return a + b.hook.size.y + 1
        },
        _close: function() {
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            this.callback && this.callback()
        }
    });
    sc.DemoLastTime = ig.GuiElementBase.extend({
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
        msgBox: null,
        content: null,
        callback: null,
        screenInteract: null,
        newRecordDone: false,
        recordGui: null,
        second: false,
        init: function(a, b) {
            this.parent();
            this.hook.localAlpha = 0.8;
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.setPos(0, 80);
            this.callback = a;
            this.second = b != void 0 ? b : false;
            this.screenInteract = new sc.ScreenInteractEntry(this);
            this.content = new ig.GuiElementBase;
            this.content.setSize(180, 60);
            this._createContent();
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.msgBox.centerBox.hook.localAlpha = 0.9;
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
        },
        update: function() {
            !this.hook.removeAfterTransition && (this.newRecordDone && ig.system.skipMode) && this._close();
            this.parent()
        },
        onInteraction: function() {
            if (this.newRecordDone) {
                ig.interact.removeEntry(this.screenInteract);
                this._close()
            } else this.recordGui.finish()
        },
        _createContent: function() {
            var a = 2,
                c = new sc.TextGui(ig.lang.get("sc.gui.highscore.last-time" + (this.second ? "2" : "")));
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, a);
            this.content.addChildGui(c);
            a = a + (c.hook.size.y + 2);
            c = new sc.LineGui(170);
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, a);
            this.content.addChildGui(c);
            var a = a + 4,
                c = sc.model,
                e = new sc.TextGui("\\c[3]" + b(c.hsTimer));
            e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            e.setPos(0, a);
            this.content.addChildGui(e);
            a = a + (e.hook.size.y + 2);
            this.newRecordDone = true;
            e = this.second ? c.highScoreObs : c.highScore;
            if (e[0] != void 0 && c.hsTimer == e[0]) {
                this.recordGui = new sc.TextGui("\\c[3]" + ig.lang.get("sc.gui.highscore.new-record"), {
                    speed: ig.TextBlock.SPEED.NORMAL
                });
                this.recordGui.hook.transitions = {
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
                        time: 0,
                        timeFunction: KEY_SPLINES.EASE_IN
                    }
                };
                this.newRecordDone = false;
                this.recordGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                this.recordGui.setPos(0, a);
                this.recordGui.doStateTransition("HIDDEN", true);
                this.recordGui.doStateTransition("DEFAULT", false, false, function() {
                    this.newRecordDone = true
                }.bind(this), 0.3);
                this.content.addChildGui(this.recordGui)
            }
        },
        _close: function() {
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            this.callback && this.callback()
        }
    })
});
ig.baked = !0;
