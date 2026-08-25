ig.module("game.feature.common-event.common-event").requires("impact.feature.storage.storage", "game.feature.party.party").defines(function() {
    function b(a, b) {
        return a - b
    }
    var a = ["D", "E", "C", "B", "A", "S"],
        d = ["ENTER", "LEAVE"];
    sc.COMMON_EVENT_TYPE = {
        CALL: {
            _wm: new ig.Config({
                attributes: {}
            }),
            check: function() {
                return true
            }
        },
        ENEMY_ATTACKS: {
            _wm: new ig.Config({
                attributes: {
                    enemies: {
                        _type: "Array",
                        _info: "Types of enemy attacking",
                        _sub: {
                            _type: "String",
                            _select: "enemies"
                        },
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
            check: function(a,
                b) {
                return a.enemies && !b.enemies.intersect(a.enemies) || a.levelGapAbove !== void 0 && b.levelGap < a.levelGapAbove || a.levelGapBelow !== void 0 && b.levelGap > a.levelGapBelow || a.playerStarted !== void 0 && a.playerStarted != b.playerStarted || a.battleStarted !== void 0 && a.battleStarted != b.battleStarted ? false : true
            }
        },
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
            check: function(a, b) {
                return !a.enemy || a.enemy == b.enemy
            }
        },
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
                        _select: a,
                        _optional: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function(a, b) {
                if (a.killCount > b.killCount) return false;
                if (a.rank) {
                    var c = sc.model.getCombatRankByLabel(a.rank);
                    return b.rank >= c
                }
                return true
            }
        },
        COOLDOWN_START: {
            _wm: new ig.Config({
                attributes: {
                    enemies: {
                        _type: "Array",
                        _info: "Type of enemy defeated",
                        _sub: {
                            _type: "String",
                            _select: "enemies"
                        },
                        _optional: true
                    },
                    killCount: {
                        _type: "Integer",
                        _info: "Minimum amount of killed enemies"
                    },
                    rank: {
                        _type: "String",
                        _info: "Minimum rank at cooldown",
                        _select: a,
                        _optional: true
                    },
                    rankReached: {
                        _type: "String",
                        _info: "Rank that was reached since last cooldown",
                        _select: a,
                        _optional: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function(a, b) {
                if (a.enemies && !b.enemies.intersect(a.enemies)) return false;
                if (a.rankReached) {
                    var c = sc.model.getCombatRankByLabel(a.rankReached);
                    if (b.rank < c || b.prevRank >= c) return false
                }
                if (a.rank) {
                    c = sc.model.getCombatRankByLabel(a.rank);
                    return b.rank >= c
                }
                return true
            }
        },
        LEVEL_UP: {
            _wm: new ig.Config({
                attributes: {
                    level: {
                        _type: "Integer",
                        _info: "Minimum Level reached"
                    }
                }
            }),
            cutsceneCheck: true,
            check: function(a, b) {
                return a.level >= b.rank
            }
        },
        MENU_LEAVE: {
            _wm: new ig.Config({
                attributes: {}
            }),
            check: function() {
                return true
            }
        },
        QUEST_ACCEPTED: {
            _wm: new ig.Config({
                attributes: {}
            }),
            triggerAll: true,
            check: function() {
                return true
            }
        },
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
            check: function(a, b) {
                return b.member.indexOf(a.member) == -1 ? false : a.eventType == b.eventType
            }
        },
        DUNGEON_TRANSITION: {
            _wm: new ig.Config({
                attributes: {
                    mapTransition: {
                        _type: "String",
                        _info: "If defined: react on map dungeon change",
                        _select: d,
                        _withNull: true
                    },
                    areaTransition: {
                        _type: "String",
                        _info: "If defined: react on area dungeon change",
                        _select: d,
                        _withNull: true
                    }
                }
            }),
            cutsceneCheck: true,
            check: function(a,
                b) {
                return (!a.mapTransition || a.mapTransition == b.mapTransition) && (!a.areaTransition || a.areaTransition == b.areaTransition)
            }
        },
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
            check: function(a, b) {
                return a.member && a.member != b.member ? false : sc.SOCIAL_ACTION[a.actionType] == b.actionType
            },
            startEvent: function(a,
                b) {
                return sc.Cutscene.startMenuEvent(a, b)
            }
        },
        MAP_ENTERED: {
            _wm: new ig.Config({
                attributes: {}
            }),
            cutsceneCheck: true,
            check: function() {
                return true
            }
        },
        FORCE_UPDATE: {
            _wm: new ig.Config({
                attributes: {}
            }),
            triggerAll: true,
            check: function() {
                return true
            }
        }
    };
    sc.COMMON_EVENT_FREQUENCY = {
        ALWAYS: {},
        REGULAR: {
            prop: 1
        },
        SOMETIMES: {
            prop: 0.5
        },
        RARE: {
            prop: 0.2
        }
    };
    sc.COMMON_EVENT_REPEAT = {
        REPEAT: 1,
        ONCE: 2
    };
    var c = ["REGULAR", "SOMETIMES", "RARE"],
        e = [];
    sc.CommonEvents = ig.GameAddon.extend({
        events: {},
        eventsByType: {},
        runData: {},
        delayedTriggerStack: [],
        delayedTriggerTimer: 0,
        init: function() {
            ig.storage.register(this);
            window.wm && ig.database.register("commonEvents", "CommonEnumEditor", "Common Events");
            this._loadCommonEvents()
        },
        onReset: function() {
            this.runData = {}
        },
        onStorageSave: function(a) {
            var b = {},
                c;
            for (c in this.runData) {
                var d = this.runData[c];
                this.events[c] && this.events[c].repeat == sc.COMMON_EVENT_REPEAT.ONCE && (b[c] = ig.copy(d))
            }
            a.commonEvents = {
                runData: b
            }
        },
        onStoragePreLoad: function(a) {
            a = a.commonEvents || {};
            this.runData = ig.copy(a.runData || {});
            for (var b in this.runData)
                if (this.runData[b].runCount) {
                    this.runData[b].trigger =
                        this.runData[b].runCount;
                    delete this.runData[b].runCount
                }
        },
        onDeferredUpdate: function() {
            if (this.delayedTriggerTimer) {
                if (sc.model.isCutscene() || sc.model.isTeleport()) {
                    this.delayedTriggerTimer = 0;
                    this.delayedTriggerStack.length = 0
                }
                this.delayedTriggerTimer = this.delayedTriggerTimer - ig.system.actualTick;
                if (this.delayedTriggerTimer <= 0) {
                    this.delayedTriggerTimer = 0;
                    for (var a = this.delayedTriggerStack.length; a--;) {
                        var b = this.delayedTriggerStack[a];
                        this._forcedTriggerEvent(b.type, b.eventData, sc.model.message.isSideMessageVisible())
                    }
                    this.delayedTriggerStack.length =
                        0
                }
            }
        },
        _loadCommonEvents: function() {
            this.events = {};
            var a = ig.database.get("commonEvents");
            ig.LangLabel.setOriginFile("data/database.json");
            for (var b in a) {
                var c = new sc.CommonEvent(b, a[b]);
                this.events[b] = c;
                var d = c.type;
                this.eventsByType[d] || (this.eventsByType[d] = []);
                this.eventsByType[d].push(c)
            }
            ig.LangLabel.setOriginFile(null)
        },
        triggerEvent: function(a, b) {
            if (sc.autoControl.isActive()) return null;
            if (sc.COMMON_EVENT_TYPE[a].cutsceneCheck) {
                this.delayedTriggerTimer = 0.2;
                this.delayedTriggerStack.push({
                    type: a,
                    eventData: ig.copy(b)
                })
            } else return this._forcedTriggerEvent(a, b);
            return null
        },
        cancelEvent: function(a) {
            for (var b = false, c = this.delayedTriggerStack.length; c--;)
                if (this.delayedTriggerStack[c].type == a) {
                    this.delayedTriggerStack.splice(c, 1);
                    b = true
                } return b
        },
        startCallEvent: function(a) {
            if ((a = this.events[a]) && this._checkEventExecution(a, {}, Math.random())) return this._startCommonEvent(a)
        },
        getInlineCallEvent: function(a) {
            a = this.events[a];
            return !a ? null : a.getEvent()
        },
        getInlineCallData: function(a) {
            a = this.events[a];
            if (!a) return null;
            var b = a.getCallData(this.getRunCount(a));
            this.increaseTriggerCount(a);
            return b
        },
        _forcedTriggerEvent: function(a, b, c) {
            var d = sc.COMMON_EVENT_TYPE[a],
                e = null,
                k = [];
            do {
                var l = this.selectEvent(a, b, k, c);
                if (l) {
                    k.push(l);
                    e = this._startCommonEvent(l)
                }
            } while (d.triggerAll && l);
            return e
        },
        _checkEventExecution: function(a, b, c) {
            if (!a.check(b) || a.repeat == sc.COMMON_EVENT_REPEAT.ONCE && this.getTriggerCount(a) >= a.loopCount || a.frequency.prop && a.frequency.prop < c) return false;
            if (this.getRunCount(a) == 0) {
                this.increaseTriggerCount(a);
                return false
            }
            return true
        },
        _startCommonEvent: function(a) {
            var b = a.start(this.getRunCount(a));
            this.increaseTriggerCount(a);
            return b
        },
        selectEvent: function(a, b, d, i) {
            a = this.eventsByType[a];
            if (!a) return null;
            var j = c.length,
                k = Math.random();
            e.length = 0;
            for (var l = -1, j = 0; j < a.length; ++j) {
                var o = a[j];
                if (d.indexOf(o) == -1 && (!i || o.overrideSideMessage) && this._checkEventExecution(o, b, k)) {
                    if (!o.frequency.prop) return o;
                    if (!(o.repeat != sc.COMMON_EVENT_REPEAT.ONCE && l != -1)) {
                        var m = this.getTriggerCount(o);
                        if (o.repeat == sc.COMMON_EVENT_REPEAT.ONCE &&
                            (l == -1 || m < l)) {
                            e.length = 0;
                            l = m
                        }(l == -1 || m == l) && e.push(o)
                    }
                }
            }
            return e[Math.floor(Math.random() * e.length)]
        },
        getRunCount: function(a) {
            if (!a.runOnTrigger) return 1;
            var b = this.getTriggerCount(a) + 1;
            return a.runOnTrigger.indexOf(b) + 1
        },
        getTriggerCount: function(a) {
            return this.runData[a.name] && this.runData[a.name].trigger || 0
        },
        increaseTriggerCount: function(a) {
            this.runData[a.name] || (this.runData[a.name] = {
                trigger: 0
            });
            var b = this.runData[a.name];
            b.trigger = b.trigger + 1 || 1;
            a.repeat != sc.COMMON_EVENT_REPEAT.ONCE && (b.trigger =
                b.trigger % a.loopCount)
        }
    });
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
        init: function(a, c) {
            this.name = a;
            if (c.type) {
                this.type = c.type.type;
                this.typeDetails = c.type
            }
            this.frequency = sc.COMMON_EVENT_FREQUENCY[c.frequency];
            this.repeat = sc.COMMON_EVENT_REPEAT[c.repeat];
            this.condition = new ig.VarCondition(c.condition);
            this.eventType = ig.EVENT_TYPE[c.eventType] || ig.EVENT_TYPE.PARALLEL;
            this.runOnTrigger = c.runOnTrigger ||
                null;
            this.overrideSideMessage = c.overrideSideMessage || false;
            if (this.runOnTrigger) {
                this.runOnTrigger.sort(b);
                this.loopCount = this.runOnTrigger.last()
            } else this.loopCount = 1;
            this.event = new ig.Event({
                steps: c.event,
                input: {
                    runCount: {
                        _type: "Number"
                    }
                }
            });
            this.event.common = true
        },
        check: function(a) {
            return !this.condition.evaluate() ? false : sc.COMMON_EVENT_TYPE[this.type].check(this.typeDetails, a)
        },
        start: function(a) {
            var a = this.getCallData(a),
                b = sc.COMMON_EVENT_TYPE[this.type];
            return b.startEvent ? b.startEvent(this.event,
                a) : sc.Cutscene.startEvent(this.eventType, this.event, a)
        },
        getEvent: function() {
            return this.event
        },
        getCallData: function(a) {
            return {
                runCount: a
            }
        }
    });
    ig.addGameAddon(function() {
        return sc.commonEvents = new sc.CommonEvents
    })
});
ig.baked = !0;
