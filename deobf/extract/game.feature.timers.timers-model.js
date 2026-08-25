ig.module("game.feature.timers.timers-model").requires("impact.base.game", "game.feature.model.base-model", "game.feature.timers.gui.timers-hud").defines(function() {
    function b(a, b) {
        var c = "0000" + Math.floor(a);
        return c.length >= 4 + b ? Math.floor(a) : c.substr(c.length - b)
    }
    sc.TIMER_TYPES = {
        COUNTER: 0,
        COUNTDOWN: 1
    };
    sc.TimersModel = ig.GameAddon.extend({
        observers: [],
        timers: {},
        init: function() {
            this.parent("Timers");
            ig.storage.register(this);
            ig.vars.registerVarAccessor("timers", this, "VarTimersEditor")
        },
        onPostUpdate: function() {
            if ((sc.model.isGame() ||
                    !sc.model.isCutscene()) && !sc.model.isPaused() && !sc.model.isMenu() && !sc.model.isQuickMenu() && (sc.model.isRunning() || sc.model.isMenu()))
                for (var a in this.timers) {
                    var b = this.timers[a];
                    if (b.mode == sc.TIMER_TYPES.COUNTDOWN && b.done()) break;
                    b.tick();
                    if (b.mode == sc.TIMER_TYPES.COUNTDOWN && b.done()) {
                        ig.game.varsChangedDeferred();
                        b.temp && delete this.timers[a];
                        sc.Model.notifyObserver(this, sc.TIMER_EVENT.COUNTDOWN_DONE, b)
                    }
                }
        },
        onReset: function() {
            for (var a in this.timers) sc.Model.notifyObserver(this, sc.TIMER_EVENT.DELETED,
                a);
            this.timers = {}
        },
        onLevelLoadStart: function() {
            for (var a in this.timers) {
                var b = this.timers[a];
                if (b.temp) {
                    delete this.timers[a];
                    b.quest && sc.quests.resetQuestTask(b.quest.quest, b.quest.index);
                    sc.Model.notifyObserver(this, sc.TIMER_EVENT.DELETED, a);
                    ig.game.varsChangedDeferred()
                }
            }
        },
        addTimer: function(a, b, c, e, f, g, h, i, j, k) {
            if (this.timers[a]) throw Error("Timer with name " + a + " is already in use!");
            b = new sc.TimerEntry(a, b, c, e, f, h, i);
            this.timers[a] = b;
            if (g) {
                sc.gui.rightHudPanel.addHudBox(new sc.TimersHud(b, j,
                    k), 1);
                sc.Model.notifyObserver(this, sc.TIMER_EVENT.ADD_GUI, b)
            }
            ig.game.varsChangedDeferred()
        },
        stopTimer: function(a) {
            if (this.timers[a]) {
                this.timers[a].stop();
                ig.game.varsChangedDeferred()
            }
        },
        resumeTimer: function(a) {
            if (this.timers[a]) {
                this.timers[a].resume();
                ig.game.varsChangedDeferred()
            }
        },
        resetTimer: function(a, b, c) {
            if (this.timers[a]) {
                this.timers[a].reset(b, c);
                ig.game.varsChangedDeferred()
            }
        },
        removeTimer: function(a) {
            if (!this.timers[a]) return null;
            var b = this.timers[a];
            delete this.timers[a];
            sc.Model.notifyObserver(this,
                sc.TIMER_EVENT.DELETED, a);
            ig.game.varsChangedDeferred();
            return b
        },
        getRemainingTimerTime: function(a, b) {
            return !this.timers[a] ? b ? 0 : null : this.timers[a].getRemainingTime()
        },
        getPassedTime: function(a) {
            return !this.timers[a] ? null : this.timers[a].timer
        },
        formatTime: function(a, d) {
            var c = Math.floor(a * 100) % 100,
                e = Math.floor(a % 60),
                f = Math.floor(a / 60) % 60,
                g = Math.floor(a / 60 / 60) % 60;
            return (g > 0 ? b(g, 2) + ":" : "") + b(f, 2) + ":" + b(e, 2) + (d ? "." + c : "")
        },
        onVarAccess: function(a, b) {
            if (b[0] == "timers" && b[1]) switch (b[2]) {
                case "time":
                    return this.getPassedTime(b[1]);
                case "remainingTime":
                    return this.getRemainingTimerTime(b[1]);
                case "remainingTimeNotNull":
                    return this.getRemainingTimerTime(b[1], true);
                case "formatTime":
                    return !this.timers[b[1]] ? "????" : this.formatTime(this.getPassedTime(b[1]), this.timers[b[1]].millis);
                case "formatRemainingTime":
                    return !this.timers[b[1]] ? "????" : this.formatTime(this.getRemainingTimerTime(b[1]), this.timers[b[1]].millis)
            }
            throw Error("Unsupported var access path: " + a);
        },
        onStorageSave: function(a) {
            var b = {},
                c;
            for (c in this.timers) {
                var e = this.timers;
                if (e.temp) {
                    e.quest && sc.quests.resetQuestTask(e.quest.quest, e.quest.index);
                    sc.Model.notifyObserver(this, sc.TIMER_EVENT.DELETED, c)
                } else b[c] = this.timers[c].getSaveData()
            }
            a.timers = b
        },
        onStoragePreLoad: function(a) {
            this.onReset();
            var a = a.timers || {},
                b;
            for (b in a) {
                var c = a[b];
                this.timers[b] = new sc.TimerEntry(c.name || null, c.mode || sc.TIMER_TYPES.COUNTER, c.duration || 0, c.area || null, c.temp || false, c.millis || true, c.quest || null);
                this.timers[b].timer = c.timer || 0;
                this.timers[b].stopped = c.stopped || false
            }
        }
    });
    sc.TimerEntry =
        ig.Class.extend({
            name: null,
            mode: sc.TIMER_TYPES.COUNTER,
            timer: 0,
            duration: 0,
            temp: false,
            millis: true,
            area: null,
            quest: null,
            stopped: false,
            init: function(a, b, c, e, f, g, h) {
                this.name = a || "";
                this.mode = b || 0;
                this.duration = c || 0;
                this.area = e || null;
                this.temp = f || false;
                this.millis = g;
                this.quest = h || null
            },
            tick: function() {
                if (!this.stopped && !(this.area && this.area != sc.map.currentArea.path)) {
                    if (ig.game.firstUpdateLoop) this.timer = this.timer + ig.system.rawTick;
                    if (this.duration && this.timer >= this.duration) {
                        this.timer = this.duration;
                        this.stopped = true
                    }
                }
            },
            stop: function() {
                this.stopped = true
            },
            resume: function() {
                this.stopped = false
            },
            reset: function(a, b) {
                if (a != void 0) this.mode = a;
                if (b != void 0) this.duration = b;
                this.timer = 0;
                this.stopped = false
            },
            getRemainingTime: function() {
                return !this.duration ? 0 : Math.max(this.duration - this.timer, 0)
            },
            done: function() {
                return !this.duration ? false : this.timer >= this.duration
            },
            getSaveData: function() {
                var a = {};
                a.name = this.name;
                a.mode = this.mode;
                a.timer = this.timer;
                a.duration = this.duration;
                a.millis = this.millis;
                a.temp = this.temp;
                a.stopped = this.stopped;
                if (this.area) a.area = this.area;
                this.quest && (a.quest = {
                    quest: this.quest.quest,
                    index: this.quest.index
                });
                return a
            }
        });
    sc.TIMER_EVENT = {};
    sc.TIMER_EVENT.COUNTDOWN_DONE = 0;
    sc.TIMER_EVENT.DELETED = 1;
    sc.TIMER_EVENT.ADD_GUI = 2;
    ig.addGameAddon(function() {
        return sc.timers = new sc.TimersModel
    })
});
ig.baked = !0;
