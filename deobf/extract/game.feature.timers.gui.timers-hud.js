ig.module("game.feature.timers.gui.timers-hud").requires("game.feature.gui.hud.right-hud").defines(function() {
    sc.TimersHudEntry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        millis: null,
        seconds: null,
        minutes: null,
        hours: null,
        hourPoint: null,
        timer: null,
        init: function(b) {
            this.parent();
            this.setSize(80, 8);
            this.timer = b;
            var b = 2,
                a = null;
            if (this.timer.millis) {
                this.millis = new sc.NumberGui(99, {
                    leadingZeros: 2
                });
                this.millis.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.millis.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                this.addChildGui(this.millis);
                this.millis.setPos(b, 0);
                b = b + 16;
                a = new ig.ImageGui(this.gfx, 112, 0, 3, 8);
                a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                a.setPos(b, 0);
                b = b + 3;
                this.addChildGui(a)
            }
            this.seconds = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.seconds.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.seconds.setPos(b, 0);
            b = b + 17;
            this.addChildGui(this.seconds);
            a = new ig.ImageGui(this.gfx,
                107, 0, 3, 8);
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(b, 0);
            b = b + 4;
            this.addChildGui(a);
            this.minutes = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.minutes.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.minutes.setPos(b, 0);
            b = b + 17;
            this.addChildGui(this.minutes);
            this.hourPoint = new ig.ImageGui(this.gfx, 107, 0, 3, 8);
            this.hourPoint.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hourPoint.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.hourPoint.setPos(b, 0);
            b = b + 4;
            this.addChildGui(this.hourPoint);
            this.hours = new sc.NumberGui(999, {
                leadingZeros: 2
            });
            this.hours.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hours.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.hours.setPos(b, 0);
            b = b + 18;
            this.addChildGui(this.hours);
            this.hook.size.x = b;
            this.updateTime()
        },
        update: function() {
            !sc.model.isPaused() && (!sc.model.isMenu() &&
                !this.hidden) && this.updateTime()
        },
        updateTime: function() {
            var b = 0,
                b = this.timer.mode == sc.TIMER_TYPES.COUNTDOWN ? this.timer.getRemainingTime() : this.timer.timer,
                a = Math.floor(b * 100) % 100,
                d = Math.floor(b % 60),
                c = Math.floor(b / 60) % 60,
                b = Math.floor(b / 60 / 60) % 60;
            this.millis && this.millis.setNumber(a);
            this.seconds.setNumber(d);
            this.minutes.setNumber(c);
            if (b > 0) {
                this.hours.setNumber(b);
                this.hours.doStateTransition("DEFAULT", true);
                this.hourPoint.doStateTransition("DEFAULT", true)
            } else {
                this.hours.doStateTransition("HIDDEN",
                    true);
                this.hourPoint.doStateTransition("HIDDEN", true)
            }
        }
    });
    sc.TimersHud = sc.RightHudBoxGui.extend({
        entry: null,
        _cutscene: false,
        init: function(b, a, d) {
            var c = "";
            if (a) c = a;
            else switch (b.mode) {
                case sc.TIMER_TYPES.COUNTER:
                    c = ig.lang.get("sc.gui.timer-hud.counter");
                    break;
                case sc.TIMER_TYPES.COUNTDOWN:
                    c = ig.lang.get("sc.gui.timer-hud.countdown")
            }
            this.parent(c);
            this._cutscene = d || false;
            this.entry = new sc.TimersHudEntry(b);
            this.pushContent(this.entry, !sc.model.isCutscene());
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.timers,
                this);
            this.hidden && !sc.model.isCutscene() && this.show()
        },
        update: function() {
            !this.hidden && this.contentEntries.length == 0 && this.hide()
        },
        delayedRemove: function() {
            sc.Model.removeObserver(sc.model, this);
            sc.Model.removeObserver(sc.timers, this);
            this.remove()
        },
        modelChanged: function(b, a, d) {
            b == sc.model ? b.isReset() ? this.delayedRemove() : b.isCutscene() || b.isQuickMenu() || sc.quests.hasQuestSolvedDialogs() ? this._cutscene ? this.show() : this.hide() : !b.isCutscene() && (!b.isQuickMenu() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) &&
                this.show() : b == sc.timers && (a == sc.TIMER_EVENT.DELETED ? this.entry.timer.name == d && this.delayedRemove() : a == sc.TIMER_EVENT.COUNTDOWN_DONE && this.entry.timer.name == d.name && d.temp && this.delayedRemove())
        }
    })
});
ig.baked = !0;
