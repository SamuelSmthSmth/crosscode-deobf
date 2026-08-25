/**
 * @module game.feature.timers.gui.timers-hud
 *
 * HUD display for timers. Shows a right-side box with the timer label and a
 * time readout (hours:minutes:seconds and optional milliseconds), updating
 * live and hiding/showing based on game state.
 */
ig.module("game.feature.timers.gui.timers-hud").requires("game.feature.gui.hud.right-hud").defines(function() {
    sc.TimersHudEntry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        millis: null,
        seconds: null,
        minutes: null,
        hours: null,
        hourPoint: null,
        timer: null,
        init: function(timer) {
            this.parent();
            this.setSize(80, 8);
            this.timer = timer;
            var xPos = 2,
                separator = null;
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
                this.millis.setPos(xPos, 0);
                xPos = xPos + 16;
                separator = new ig.ImageGui(this.gfx, 112, 0, 3, 8);
                separator.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                separator.setPos(xPos, 0);
                xPos = xPos + 3;
                this.addChildGui(separator)
            }
            this.seconds = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.seconds.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.seconds.setPos(xPos, 0);
            xPos = xPos + 17;
            this.addChildGui(this.seconds);
            separator = new ig.ImageGui(this.gfx,
                107, 0, 3, 8);
            separator.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            separator.setPos(xPos, 0);
            xPos = xPos + 4;
            this.addChildGui(separator);
            this.minutes = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.minutes.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.minutes.setPos(xPos, 0);
            xPos = xPos + 17;
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
            this.hourPoint.setPos(xPos, 0);
            xPos = xPos + 4;
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
            this.hours.setPos(xPos, 0);
            xPos = xPos + 18;
            this.addChildGui(this.hours);
            this.hook.size.x = xPos;
            this.updateTime()
        },
        update: function() {
            !sc.model.isPaused() && (!sc.model.isMenu() &&
                !this.hidden) && this.updateTime()
        },
        updateTime: function() {
            var time = 0,
                time = this.timer.mode == sc.TIMER_TYPES.COUNTDOWN ? this.timer.getRemainingTime() : this.timer.timer,
                millis = Math.floor(time * 100) % 100,
                seconds = Math.floor(time % 60),
                minutes = Math.floor(time / 60) % 60,
                time = Math.floor(time / 60 / 60) % 60;
            this.millis && this.millis.setNumber(millis);
            this.seconds.setNumber(seconds);
            this.minutes.setNumber(minutes);
            if (time > 0) {
                this.hours.setNumber(time);
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
        init: function(timer, label, isCutscene) {
            var label = "";
            if (label) label = label;
            else switch (timer.mode) {
                case sc.TIMER_TYPES.COUNTER:
                    label = ig.lang.get("sc.gui.timer-hud.counter");
                    break;
                case sc.TIMER_TYPES.COUNTDOWN:
                    label = ig.lang.get("sc.gui.timer-hud.countdown")
            }
            this.parent(label);
            this._cutscene = isCutscene || false;
            this.entry = new sc.TimersHudEntry(timer);
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
        modelChanged: function(model, msg, data) {
            model == sc.model ? model.isReset() ? this.delayedRemove() : model.isCutscene() || model.isQuickMenu() || sc.quests.hasQuestSolvedDialogs() ? this._cutscene ? this.show() : this.hide() : !model.isCutscene() && (!model.isQuickMenu() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) &&
                this.show() : model == sc.timers && (msg == sc.TIMER_EVENT.DELETED ? this.entry.timer.name == data && this.delayedRemove() : msg == sc.TIMER_EVENT.COUNTDOWN_DONE && this.entry.timer.name == data.name && data.temp && this.delayedRemove())
        }
    })
});
ig.baked = !0;
