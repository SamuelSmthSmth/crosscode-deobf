/**
 * @module game.feature.timers.timers-model
 *
 * Timer system: named timers that count up (COUNTER) or down (COUNTDOWN)
 * while the game is running, with optional area restriction, temporary
 * lifecycles, quest task reset on expiry, save/load support, HUD boxes,
 * and a var accessor for events.
 */
ig.module("game.feature.timers.timers-model").requires("impact.base.game", "game.feature.model.base-model", "game.feature.timers.gui.timers-hud").defines(function() {
    function padNumber(value, digits) {
        var padded = "0000" + Math.floor(value);
        return padded.length >= 4 + digits ? Math.floor(value) : padded.substr(padded.length - digits)
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
                for (var name in this.timers) {
                    var timer = this.timers[name];
                    if (timer.mode == sc.TIMER_TYPES.COUNTDOWN && timer.done()) break;
                    timer.tick();
                    if (timer.mode == sc.TIMER_TYPES.COUNTDOWN && timer.done()) {
                        ig.game.varsChangedDeferred();
                        timer.temp && delete this.timers[name];
                        sc.Model.notifyObserver(this, sc.TIMER_EVENT.COUNTDOWN_DONE, timer)
                    }
                }
        },
        onReset: function() {
            for (var name in this.timers) sc.Model.notifyObserver(this, sc.TIMER_EVENT.DELETED,
                name);
            this.timers = {}
        },
        onLevelLoadStart: function() {
            for (var name in this.timers) {
                var timer = this.timers[name];
                if (timer.temp) {
                    delete this.timers[name];
                    timer.quest && sc.quests.resetQuestTask(timer.quest.quest, timer.quest.index);
                    sc.Model.notifyObserver(this, sc.TIMER_EVENT.DELETED, name);
                    ig.game.varsChangedDeferred()
                }
            }
        },
        addTimer: function(name, mode, duration, area, temp, showGui, millis, quest, label, isCutscene) {
            if (this.timers[name]) throw Error("Timer with name " + name + " is already in use!");
            mode = new sc.TimerEntry(name, mode, duration, area, temp, millis, quest);
            this.timers[name] = mode;
            if (showGui) {
                sc.gui.rightHudPanel.addHudBox(new sc.TimersHud(mode, label,
                    isCutscene), 1);
                sc.Model.notifyObserver(this, sc.TIMER_EVENT.ADD_GUI, mode)
            }
            ig.game.varsChangedDeferred()
        },
        stopTimer: function(name) {
            if (this.timers[name]) {
                this.timers[name].stop();
                ig.game.varsChangedDeferred()
            }
        },
        resumeTimer: function(name) {
            if (this.timers[name]) {
                this.timers[name].resume();
                ig.game.varsChangedDeferred()
            }
        },
        resetTimer: function(name, mode, duration) {
            if (this.timers[name]) {
                this.timers[name].reset(mode, duration);
                ig.game.varsChangedDeferred()
            }
        },
        removeTimer: function(name) {
            if (!this.timers[name]) return null;
            var timer = this.timers[name];
            delete this.timers[name];
            sc.Model.notifyObserver(this,
                sc.TIMER_EVENT.DELETED, name);
            ig.game.varsChangedDeferred();
            return timer
        },
        getRemainingTimerTime: function(name, notNull) {
            return !this.timers[name] ? notNull ? 0 : null : this.timers[name].getRemainingTime()
        },
        getPassedTime: function(name) {
            return !this.timers[name] ? null : this.timers[name].timer
        },
        formatTime: function(time, showMillis) {
            var millis = Math.floor(time * 100) % 100,
                seconds = Math.floor(time % 60),
                minutes = Math.floor(time / 60) % 60,
                hours = Math.floor(time / 60 / 60) % 60;
            return (hours > 0 ? padNumber(hours, 2) + ":" : "") + padNumber(minutes, 2) + ":" + padNumber(seconds, 2) + (showMillis ? "." + millis : "")
        },
        onVarAccess: function(path, parts) {
            if (parts[0] == "timers" && parts[1]) switch (parts[2]) {
                case "time":
                    return this.getPassedTime(parts[1]);
                case "remainingTime":
                    return this.getRemainingTimerTime(parts[1]);
                case "remainingTimeNotNull":
                    return this.getRemainingTimerTime(parts[1], true);
                case "formatTime":
                    return !this.timers[parts[1]] ? "????" : this.formatTime(this.getPassedTime(parts[1]), this.timers[parts[1]].millis);
                case "formatRemainingTime":
                    return !this.timers[parts[1]] ? "????" : this.formatTime(this.getRemainingTimerTime(parts[1]), this.timers[parts[1]].millis)
            }
            throw Error("Unsupported var access path: " + path);
        },
        onStorageSave: function(storageData) {
            var savedTimers = {},
                name;
            for (name in this.timers) {
                var timer = this.timers;
                if (timer.temp) {
                    timer.quest && sc.quests.resetQuestTask(timer.quest.quest, timer.quest.index);
                    sc.Model.notifyObserver(this, sc.TIMER_EVENT.DELETED, name)
                } else savedTimers[name] = this.timers[name].getSaveData()
            }
            storageData.timers = savedTimers
        },
        onStoragePreLoad: function(storageData) {
            this.onReset();
            var storageData = storageData.timers || {},
                name;
            for (name in storageData) {
                var timerData = storageData[name];
                this.timers[name] = new sc.TimerEntry(timerData.name || null, timerData.mode || sc.TIMER_TYPES.COUNTER, timerData.duration || 0, timerData.area || null, timerData.temp || false, timerData.millis || true, timerData.quest || null);
                this.timers[name].timer = timerData.timer || 0;
                this.timers[name].stopped = timerData.stopped || false
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
            init: function(name, mode, duration, area, temp, millis, quest) {
                this.name = name || "";
                this.mode = mode || 0;
                this.duration = duration || 0;
                this.area = area || null;
                this.temp = temp || false;
                this.millis = millis;
                this.quest = quest || null
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
            reset: function(mode, duration) {
                if (mode != void 0) this.mode = mode;
                if (duration != void 0) this.duration = duration;
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
                var saveData = {};
                saveData.name = this.name;
                saveData.mode = this.mode;
                saveData.timer = this.timer;
                saveData.duration = this.duration;
                saveData.millis = this.millis;
                saveData.temp = this.temp;
                saveData.stopped = this.stopped;
                if (this.area) saveData.area = this.area;
                this.quest && (saveData.quest = {
                    quest: this.quest.quest,
                    index: this.quest.index
                });
                return saveData
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
