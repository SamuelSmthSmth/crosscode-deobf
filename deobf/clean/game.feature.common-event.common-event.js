/**
 * game.feature.common-event.common-event
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.common-event.common-event")`.
 *
 * The common-event system: a database of reusable cutscene-triggered events
 * with frequency/probability controls, repeat policies, and type-based
 * filtering. `sc.CommonEvents` is the game addon that stores, loads, and
 * fires events; `sc.CommonEvent` is a single event entry. Event types
 * include CALL, ENEMY_ATTACKS, ENEMY_DEFEATED, BATTLE_OVER, COOLDOWN_START,
 * LEVEL_UP, MENU_LEAVE, QUEST_ACCEPTED, PARTY_MEMBER_EVENT, DUNGEON_TRANSITION,
 * SOCIAL_ACTION, MAP_ENTERED, and FORCE_UPDATE.
 */
ig.module("game.feature.common-event.common-event").requires(
    "impact.feature.storage.storage",
    "game.feature.party.party"
).defines(function () {

    /** Custom sort: numerical ascending. */
    function numericSort(a, b) {
        return a - b;
    }

    /** Combat rank labels (lowest to highest). */
    var RANK_LABELS = ["D", "E", "C", "B", "A", "S"];

    /** Dungeon transition direction labels. */
    var TRANSITION_DIRS = ["ENTER", "LEAVE"];

    /** Frequencies that have a probability weight. */
    var WEIGHTED_FREQUENCIES = ["REGULAR", "SOMETIMES", "RARE"];

    /** Scratch array reused by selectEvent. */
    var candidateList = [];

    /* ── sc.COMMON_EVENT_TYPE ───────────────────────────────────── */

    sc.COMMON_EVENT_TYPE = {
        /** Direct call from a script. */
        CALL: {
            _wm: new ig.Config({ attributes: {} }),
            check: function () { return true; }
        },

        /** Triggered when enemies start attacking the player. */
        ENEMY_ATTACKS: {
            _wm: new ig.Config({
                attributes: {
                    enemies: {
                        _type: "Array",
                        _info: "Types of enemy attacking",
                        _sub: { _type: "String", _select: "enemies" },
                        _optional: true
                    },
                    levelGapAbove: {
                        _type: "Integer",
                        _info: "LevelGap: Enemy Level - Player Level",
                        _optional: true
                    },
                    levelGapBelow: {
                        _type: "Integer",
                        _info: "LevelGap: Enemy Level - Player Level",
                        _optional: true
                    },
                    playerStarted: {
                        _type: "Boolean",
                        _info: "If defined: only trigger when player started battle if true or if not player started if false",
                        _optional: true
                    },
                    battleStarted: {
                        _type: "Boolean",
                        _info: "If defined => true: only trigger when start of battle, false: only trigger when enemies join during battle",
                        _optional: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function (typeDetails, eventData) {
                if (typeDetails.enemies && !eventData.enemies.intersect(typeDetails.enemies)) return false;
                if (typeDetails.levelGapAbove !== void 0 && eventData.levelGap < typeDetails.levelGapAbove) return false;
                if (typeDetails.levelGapBelow !== void 0 && eventData.levelGap > typeDetails.levelGapBelow) return false;
                if (typeDetails.playerStarted !== void 0 && typeDetails.playerStarted != eventData.playerStarted) return false;
                if (typeDetails.battleStarted !== void 0 && typeDetails.battleStarted != eventData.battleStarted) return false;
                return true;
            }
        },

        /** Triggered when a specific enemy type is defeated. */
        ENEMY_DEFEATED: {
            _wm: new ig.Config({
                attributes: {
                    enemy: {
                        _type: "String",
                        _info: "Type of enemy defeated",
                        _select: "enemies",
                        _optional: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function (typeDetails, eventData) {
                return !typeDetails.enemy || typeDetails.enemy == eventData.enemy;
            }
        },

        /** Triggered at the end of a battle. */
        BATTLE_OVER: {
            _wm: new ig.Config({
                attributes: {
                    killCount: {
                        _type: "Integer",
                        _info: "Minimum amount of killed enemies"
                    },
                    rank: {
                        _type: "String",
                        _info: "Minimum rank at cooldown",
                        _select: RANK_LABELS,
                        _optional: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function (typeDetails, eventData) {
                if (typeDetails.killCount > eventData.killCount) return false;
                if (typeDetails.rank) {
                    var requiredRank = sc.model.getCombatRankByLabel(typeDetails.rank);
                    return eventData.rank >= requiredRank;
                }
                return true;
            }
        },

        /** Triggered when combat cooldown starts. */
        COOLDOWN_START: {
            _wm: new ig.Config({
                attributes: {
                    enemies: {
                        _type: "Array",
                        _info: "Type of enemy defeated",
                        _sub: { _type: "String", _select: "enemies" },
                        _optional: true
                    },
                    killCount: {
                        _type: "Integer",
                        _info: "Minimum amount of killed enemies"
                    },
                    rank: {
                        _type: "String",
                        _info: "Minimum rank at cooldown",
                        _select: RANK_LABELS,
                        _optional: true
                    },
                    rankReached: {
                        _type: "String",
                        _info: "Rank that was reached since last cooldown",
                        _select: RANK_LABELS,
                        _optional: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function (typeDetails, eventData) {
                if (typeDetails.enemies && !eventData.enemies.intersect(typeDetails.enemies)) return false;
                if (typeDetails.rankReached) {
                    var requiredRank = sc.model.getCombatRankByLabel(typeDetails.rankReached);
                    if (eventData.rank < requiredRank || eventData.prevRank >= requiredRank) return false;
                }
                if (typeDetails.rank) {
                    requiredRank = sc.model.getCombatRankByLabel(typeDetails.rank);
                    return eventData.rank >= requiredRank;
                }
                return true;
            }
        },

        /** Triggered when the player levels up. */
        LEVEL_UP: {
            _wm: new ig.Config({
                attributes: {
                    level: { _type: "Integer", _info: "Minimum Level reached" }
                }
            }),
            cutsceneCheck: true,
            check: function (typeDetails, eventData) {
                return typeDetails.level >= eventData.rank;
            }
        },

        /** Triggered when leaving the pause menu. */
        MENU_LEAVE: {
            _wm: new ig.Config({ attributes: {} }),
            check: function () { return true; }
        },

        /** Triggered when a quest is accepted (can trigger all matching). */
        QUEST_ACCEPTED: {
            _wm: new ig.Config({ attributes: {} }),
            triggerAll: true,
            check: function () { return true; }
        },

        /** Triggered on party member events (dies, revived, equipment). */
        PARTY_MEMBER_EVENT: {
            _wm: new ig.Config({
                attributes: {
                    member: {
                        _type: "String",
                        _info: "Party member that just DIED",
                        _select: sc.PARTY_OPTIONS
                    },
                    eventType: {
                        _type: "String",
                        _info: "Type of party member event",
                        _select: ["DIES", "REVIVED", "EQUIP_UPDATE"]
                    }
                }
            }),
            cutsceneCheck: true,
            check: function (typeDetails, eventData) {
                return eventData.member.indexOf(typeDetails.member) == -1
                    ? false
                    : typeDetails.eventType == eventData.eventType;
            }
        },

        /** Triggered on dungeon transitions (enter/leave map or area). */
        DUNGEON_TRANSITION: {
            _wm: new ig.Config({
                attributes: {
                    mapTransition: {
                        _type: "String",
                        _info: "If defined: react on map dungeon change",
                        _select: TRANSITION_DIRS,
                        _withNull: true
                    },
                    areaTransition: {
                        _type: "String",
                        _info: "If defined: react on area dungeon change",
                        _select: TRANSITION_DIRS,
                        _withNull: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function (typeDetails, eventData) {
                return (!typeDetails.mapTransition || typeDetails.mapTransition == eventData.mapTransition) &&
                    (!typeDetails.areaTransition || typeDetails.areaTransition == eventData.areaTransition);
            }
        },

        /** Triggered on social actions (contact/invite/remove). */
        SOCIAL_ACTION: {
            _wm: new ig.Config({
                attributes: {
                    member: {
                        _type: "String",
                        _info: "Party member that we do the social action with",
                        _select: sc.PARTY_OPTIONS,
                        _optional: true
                    },
                    actionType: {
                        _type: "String",
                        _info: "Type of social action",
                        _select: sc.SOCIAL_ACTION
                    }
                }
            }),
            check: function (typeDetails, eventData) {
                return typeDetails.member && typeDetails.member != eventData.member
                    ? false
                    : sc.SOCIAL_ACTION[typeDetails.actionType] == eventData.actionType;
            },
            startEvent: function (event, data) {
                return sc.Cutscene.startMenuEvent(event, data);
            }
        },

        /** Triggered when entering a map. */
        MAP_ENTERED: {
            _wm: new ig.Config({ attributes: {} }),
            cutsceneCheck: true,
            check: function () { return true; }
        },

        /** Force-update: triggers all matching events regardless. */
        FORCE_UPDATE: {
            _wm: new ig.Config({ attributes: {} }),
            triggerAll: true,
            check: function () { return true; }
        }
    };

    /* ── Frequency & repeat enums ────────────────────────────────── */

    sc.COMMON_EVENT_FREQUENCY = {
        ALWAYS: {},
        REGULAR: { prop: 1 },
        SOMETIMES: { prop: 0.5 },
        RARE: { prop: 0.2 }
    };

    sc.COMMON_EVENT_REPEAT = {
        REPEAT: 1,
        ONCE: 2
    };

    /* ── sc.CommonEvents — the game addon ────────────────────────── */

    sc.CommonEvents = ig.GameAddon.extend({
        events: {},
        eventsByType: {},
        runData: {},
        delayedTriggerStack: [],
        delayedTriggerTimer: 0,

        init: function () {
            ig.storage.register(this);
            window.wm && ig.database.register(
                "commonEvents", "CommonEnumEditor", "Common Events"
            );
            this._loadCommonEvents();
        },

        onReset: function () {
            this.runData = {};
        },

        /** Persist run counts for ONCE events. */
        onStorageSave: function (data) {
            var saved = {};
            for (var name in this.runData) {
                var entry = this.runData[name];
                if (this.events[name] && this.events[name].repeat == sc.COMMON_EVENT_REPEAT.ONCE) {
                    saved[name] = ig.copy(entry);
                }
            }
            data.commonEvents = { runData: saved };
        },

        /** Restore run counts from storage. */
        onStoragePreLoad: function (data) {
            data = data.commonEvents || {};
            this.runData = ig.copy(data.runData || {});
            for (var name in this.runData) {
                if (this.runData[name].runCount) {
                    this.runData[name].trigger = this.runData[name].runCount;
                    delete this.runData[name].runCount;
                }
            }
        },

        /**
         * Process the delayed trigger queue. Events with cutsceneCheck
         * are deferred by 0.2s so they don't fire mid-transition.
         */
        onDeferredUpdate: function () {
            if (this.delayedTriggerTimer) {
                if (sc.model.isCutscene() || sc.model.isTeleport()) {
                    this.delayedTriggerTimer = 0;
                    this.delayedTriggerStack.length = 0;
                }
                this.delayedTriggerTimer -= ig.system.actualTick;
                if (this.delayedTriggerTimer <= 0) {
                    this.delayedTriggerTimer = 0;
                    for (var i = this.delayedTriggerStack.length; i--;) {
                        var entry = this.delayedTriggerStack[i];
                        this._forcedTriggerEvent(
                            entry.type, entry.eventData,
                            sc.model.message.isSideMessageVisible()
                        );
                    }
                    this.delayedTriggerStack.length = 0;
                }
            }
        },

        /** Load all common events from the database. */
        _loadCommonEvents: function () {
            this.events = {};
            var db = ig.database.get("commonEvents");
            ig.LangLabel.setOriginFile("data/database.json");
            for (var name in db) {
                var event = new sc.CommonEvent(name, db[name]);
                this.events[name] = event;
                var type = event.type;
                this.eventsByType[type] || (this.eventsByType[type] = []);
                this.eventsByType[type].push(event);
            }
            ig.LangLabel.setOriginFile(null);
        },

        /**
         * Trigger common events by type. If the type has cutsceneCheck,
         * the event is deferred; otherwise it fires immediately.
         * @param {string} type — key into sc.COMMON_EVENT_TYPE
         * @param {object} eventData
         * @returns {ig.Event|null}
         */
        triggerEvent: function (type, eventData) {
            if (sc.autoControl.isActive()) return null;
            if (sc.COMMON_EVENT_TYPE[type].cutsceneCheck) {
                this.delayedTriggerTimer = 0.2;
                this.delayedTriggerStack.push({ type: type, eventData: ig.copy(eventData) });
            } else {
                return this._forcedTriggerEvent(type, eventData);
            }
            return null;
        },

        /** @returns {boolean} whether any entries were removed */
        cancelEvent: function (type) {
            var removed = false;
            for (var i = this.delayedTriggerStack.length; i--;) {
                if (this.delayedTriggerStack[i].type == type) {
                    this.delayedTriggerStack.splice(i, 1);
                    removed = true;
                }
            }
            return removed;
        },

        /** Start a named common event from a script call. */
        startCallEvent: function (name) {
            var event = this.events[name];
            if (event && this._checkEventExecution(event, {}, Math.random())) {
                return this._startCommonEvent(event);
            }
        },

        /** Get the event object for a named inline call. */
        getInlineCallEvent: function (name) {
            var event = this.events[name];
            return !event ? null : event.getEvent();
        },

        /** Get the input data for an inline call event. */
        getInlineCallData: function (name) {
            var event = this.events[name];
            if (!event) return null;
            var data = event.getCallData(this.getRunCount(event));
            this.increaseTriggerCount(event);
            return data;
        },

        /** Fire a deferred-trigger event, optionally filtering for side messages. */
        _forcedTriggerEvent: function (type, eventData, isSideMsgVisible) {
            var typeDef = sc.COMMON_EVENT_TYPE[type];
            var result = null;
            var excludeList = [];

            do {
                var event = this.selectEvent(type, eventData, excludeList, isSideMsgVisible);
                if (event) {
                    excludeList.push(event);
                    result = this._startCommonEvent(event);
                }
            } while (typeDef.triggerAll && event);

            return result;
        },

        /**
         * Check whether an event should execute: passes its type check,
         * hasn't exhausted its ONCE count, and passes its frequency roll.
         */
        _checkEventExecution: function (event, eventData, roll) {
            if (!event.check(eventData)) return false;
            if (event.repeat == sc.COMMON_EVENT_REPEAT.ONCE &&
                this.getTriggerCount(event) >= event.loopCount) return false;
            if (event.frequency.prop && event.frequency.prop < roll) return false;
            if (this.getRunCount(event) == 0) {
                this.increaseTriggerCount(event);
                return false;
            }
            return true;
        },

        _startCommonEvent: function (event) {
            var result = event.start(this.getRunCount(event));
            this.increaseTriggerCount(event);
            return result;
        },

        /**
         * Select the best-matching event of a given type. Respects
         * frequency weights, ONCE-vs-REPEAT tie-breaking, and the
         * overrideSideMessage flag.
         */
        selectEvent: function (type, eventData, excludeList, isSideMsgVisible) {
            var events = this.eventsByType[type];
            if (!events) return null;

            var randomRoll = Math.random();
            candidateList.length = 0;

            var bestTriggerCount = -1;
            for (var i = 0; i < events.length; ++i) {
                var event = events[i];

                if (excludeList.indexOf(event) == -1 &&
                    (!isSideMsgVisible || event.overrideSideMessage) &&
                    this._checkEventExecution(event, eventData, randomRoll)) {

                    if (!event.frequency.prop) return event; // ALWAYS — fire immediately.

                    // For ONCE events, prefer the one with the lowest trigger count.
                    if (event.repeat != sc.COMMON_EVENT_REPEAT.ONCE && bestTriggerCount != -1) {
                        // already have an ONCE candidate, skip repeats.
                    } else {
                        var triggerCount = this.getTriggerCount(event);
                        if (event.repeat == sc.COMMON_EVENT_REPEAT.ONCE &&
                            (bestTriggerCount == -1 || triggerCount < bestTriggerCount)) {
                            candidateList.length = 0;
                            bestTriggerCount = triggerCount;
                        }
                        if (bestTriggerCount == -1 || triggerCount == bestTriggerCount) {
                            candidateList.push(event);
                        }
                    }
                }
            }

            return candidateList[Math.floor(Math.random() * candidateList.length)];
        },

        /**
         * How many times this event should run on the current trigger.
         * For events with `runOnTrigger`, returns the 1-based position
         * of the current trigger count in the runOnTrigger array, or 0
         * if the current count isn't listed.
         */
        getRunCount: function (event) {
            if (!event.runOnTrigger) return 1;
            var nextTrigger = this.getTriggerCount(event) + 1;
            return event.runOnTrigger.indexOf(nextTrigger) + 1;
        },

        getTriggerCount: function (event) {
            return this.runData[event.name] && this.runData[event.name].trigger || 0;
        },

        increaseTriggerCount: function (event) {
            this.runData[event.name] || (this.runData[event.name] = { trigger: 0 });
            var entry = this.runData[event.name];
            entry.trigger = entry.trigger + 1 || 1;
            if (event.repeat != sc.COMMON_EVENT_REPEAT.ONCE) {
                entry.trigger = entry.trigger % event.loopCount;
            }
        }
    });

    /* ── sc.CommonEvent — a single event entry ───────────────────── */

    sc.CommonEvent = ig.Class.extend({
        name: null,
        type: null,
        typeDetails: null,
        frequency: null,
        repeat: null,
        runOnTrigger: null,
        loopCount: 0,
        condition: null,
        event: null,

        init: function (name, data) {
            this.name = name;
            if (data.type) {
                this.type = data.type.type;
                this.typeDetails = data.type;
            }
            this.frequency = sc.COMMON_EVENT_FREQUENCY[data.frequency];
            this.repeat = sc.COMMON_EVENT_REPEAT[data.repeat];
            this.condition = new ig.VarCondition(data.condition);
            this.eventType = ig.EVENT_TYPE[data.eventType] || ig.EVENT_TYPE.PARALLEL;
            this.runOnTrigger = data.runOnTrigger || null;
            this.overrideSideMessage = data.overrideSideMessage || false;

            if (this.runOnTrigger) {
                this.runOnTrigger.sort(numericSort);
                this.loopCount = this.runOnTrigger.last();
            } else {
                this.loopCount = 1;
            }

            this.event = new ig.Event({
                steps: data.event,
                input: {
                    runCount: { _type: "Number" }
                }
            });
            this.event.common = true;
        },

        check: function (eventData) {
            if (!this.condition.evaluate()) return false;
            return sc.COMMON_EVENT_TYPE[this.type].check(this.typeDetails, eventData);
        },

        start: function (runCount) {
            var callData = this.getCallData(runCount);
            var typeDef = sc.COMMON_EVENT_TYPE[this.type];
            return typeDef.startEvent
                ? typeDef.startEvent(this.event, callData)
                : sc.Cutscene.startEvent(this.eventType, this.event, callData);
        },

        getEvent: function () {
            return this.event;
        },

        /** @param {number} runCount */
        getCallData: function (runCount) {
            return { runCount: runCount };
        }
    });

    /* ── Register the singleton addon ────────────────────────────── */

    ig.addGameAddon(function () {
        return sc.commonEvents = new sc.CommonEvents;
    });
});
ig.baked = !0;