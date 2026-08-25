ig.module("game.feature.msg.entities.event-trigger").requires("impact.base.entity").defines(function() {
    sc.Cutscene = {
        getLookAtEventSteps: function(a, b) {
            a = ig.copy(a);
            a.unshift(this._getLookAction({
                player: true
            }, b));
            a.unshift(this._getLookAction({
                party: "Member2"
            }, b));
            a.unshift(this._getLookAction({
                party: "Member3"
            }, b));
            a.unshift({
                type: "SET_CAMERA_TARGET",
                entity: b,
                speed: "FAST",
                transition: "EASE_IN_OUT"
            });
            return a
        },
        _getLookAction: function(a, b) {
            return {
                type: "DO_ACTION",
                entity: a,
                action: [{
                    type: "SET_FACE_TO_ENTITY",
                    entity: b,
                    rotate: true
                }, {
                    type: "SET_FACE_FIX",
                    value: true
                }, {
                    type: "SET_RELATIVE_SPEED",
                    value: 0.3
                }, {
                    type: "MOVE_TO_ENTITY_DISTANCE",
                    entity: b,
                    min: 24,
                    max: 40,
                    subRadius: false,
                    maxTime: 0.3
                }]
            }
        },
        startCutscene: function(a, b, c) {
            return ig.game.events.callEvent(a, ig.EventRunType.BLOCKING, this.onEventStart.bind(this), this.onEventEnd.bind(this), b, c)
        },
        startCombatCutscene: function(a, b, c) {
            return ig.game.events.callEvent(a, ig.EventRunType.BLOCKING, this.onCombatEventStart.bind(this), this.onEventEnd.bind(this), b, c)
        },
        onEventStart: function() {
            sc.model.enterCutscene(false)
        },
        onCombatEventStart: function() {
            sc.model.enterCutscene(true)
        },
        onEventEnd: function() {
            sc.model.enterGame()
        },
        startMenuEvent: function(a, b) {
            var c = ig.game.events.callEvent(a, ig.EventRunType.BLOCKING, this.onMenuEventStart.bind(this), this.onMenuEventEnd.bind(this), b);
            c.pauseParallel = true;
            return c
        },
        onMenuEventStart: function() {
            sc.model.message.setMenuMode(true)
        },
        onMenuEventEnd: function() {
            sc.model.message.setMenuMode(false);
            sc.model.message.onSceneEnd(false)
        },
        startAutoControlEvent: function(a, b, c) {
            a = ig.game.events.callEvent(a,
                ig.EventRunType.INTERRUPTABLE, this.onAutoControlStart.bind(this), this.onAutoControlEnd.bind(this), b, c);
            a.pauseParallel = true;
            return a
        },
        onAutoControlStart: function() {
            sc.autoControl.setActive(true)
        },
        onAutoControlEnd: function() {
            sc.autoControl.setActive(false)
        },
        startEvent: function(a, b, c, e) {
            return a == ig.EVENT_TYPE.CUTSCENE ? sc.Cutscene.startCutscene(b, c, e) : a == ig.EVENT_TYPE.COMBAT_CUTSCENE ? sc.Cutscene.startCombatCutscene(b, c, e) : a == ig.EVENT_TYPE.AUTO_CONTROL ? sc.Cutscene.startAutoControlEvent(b, c, e) : a == ig.EVENT_TYPE.INTERRUPTABLE ?
                ig.game.events.callEvent(b, ig.EventRunType.INTERRUPTABLE, void 0, void 0, c, e) : ig.game.events.callEvent(b, ig.EventRunType.PARALLEL, void 0, void 0, c, e)
        }
    };
    ig.EVENT_TYPE = {
        PARALLEL: 1,
        CUTSCENE: 2,
        INTERRUPTABLE: 3,
        AUTO_CONTROL: 4,
        COMBAT_CUTSCENE: 5
    };
    ig.EVENT_TRIGGER_TYPE = {
        ALWAYS: 0,
        ONCE_PER_ENTRY: 1,
        ONCE: 2
    };
    ig.LANG_CONTEXT.EventTrigger = function(a) {
        return "EVENT[" + (a.settings.name || "") + "]"
    };
    ig.ENTITY.EventTrigger = ig.Entity.extend({
        eventType: null,
        startCondition: null,
        endCondition: null,
        event: null,
        eventCall: null,
        triggerVar: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                eventType: {
                    _type: "String",
                    _info: "Type of event. Cutscenes will stop the movement of the player and can't be executed in parallel. Auto Control events will take over the player's control.",
                    _select: ig.EVENT_TYPE
                },
                startCondition: {
                    _type: "VarCondition",
                    _info: "Condition for the event to start",
                    _popup: true
                },
                endCondition: {
                    _type: "VarCondition",
                    _info: "Condition for the event to not start (even if start condition is true)",
                    _popup: true,
                    _default: "false"
                },
                event: {
                    _type: "Event",
                    _info: "Event to be performed",
                    _popup: true
                },
                triggerType: {
                    _type: "String",
                    _info: "How often should this event be run?",
                    _select: ig.EVENT_TRIGGER_TYPE
                },
                loadCondition: {
                    _type: "EventLoadCondition",
                    _info: "If true: condition is checked on map entry and event is only loaded if ture. onStart => Use start conditions, custom => use custom conditions",
                    _optional: true
                }
            },
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(255,0,0, 0.5)",
            noZLine: true
        }),
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(16, 16, 0);
            this.eventType = ig.EVENT_TYPE[e.eventType] || ig.EVENT_TYPE.PARALLEL;
            this.startCondition = new ig.VarCondition(e.startCondition);
            this.endCondition = new ig.VarCondition(e.endCondition);
            if (a = ig.EVENT_TRIGGER_TYPE[e.triggerType || "ALWAYS"]) this.triggerVar = (a == ig.EVENT_TRIGGER_TYPE.ONCE ? "map." : "tmp.") + "_entity" + this.mapId + "_triggered";
            a = true;
            (b = e.loadCondition) && (this.endCondition.evaluate() ? a = false : this.triggerVar && ig.vars.get(this.triggerVar) ? a = false : b.onStart && !this.startCondition.evaluate() ?
                a = false : b.custom && ((new ig.VarCondition(b.custom)).evaluate() || (a = false)));
            if (e.event && a) this.event = new ig.Event({
                name: this.name,
                steps: e.event
            })
        },
        onKill: function(a) {
            this.parent(a);
            this.event && this.event.clearCached();
            if ((this.eventType == ig.EVENT_TYPE.CUTSCENE || this.eventType == ig.EVENT_TYPE.COMBAT_CUTSCENE) && this.eventCall && this.eventCall.isRunning()) sc.Cutscene.onEventEnd()
        },
        update: function() {
            if (ig.game.isEventStartReady()) {
                if ((!this.eventCall || !this.eventCall.isRunning()) && this.startCondition.evaluate() &&
                    !this.endCondition.evaluate()) {
                    if (this.triggerVar && ig.vars.get(this.triggerVar) || ig.game.isTeleporting()) return;
                    if (!this.event) throw Error("Tried to start Event that has not been loaded! Event name: " + this.name);
                    this.eventCall = sc.Cutscene.startEvent(this.eventType, this.event)
                }
                this.eventCall && this.eventCall.isRunning() && !this.eventCall.isBlocked() && this.triggerVar && ig.vars.set(this.triggerVar, true)
            }
        },
        varsChanged: function() {
            sc.model.isMenu() || this.update()
        }
    });
    var b = {
        IGNORE: 0,
        ABOVE: 1,
        BELOW: 2
    };
    ig.LANG_CONTEXT.LocationEvent =
        function(a) {
            return "LOCAL_EVENT[" + (a.settings.name || "") + "]"
        };
    ig.ENTITY.LocationEvent = ig.Entity.extend({
        startCondition: null,
        event: null,
        triggerVar: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                startCondition: {
                    _type: "VarCondition",
                    _info: "Condition for the event to start",
                    _popup: true
                },
                event: {
                    _type: "Event",
                    _info: "Event to be performed when entity is in screen (always parallel)",
                    _popup: true
                },
                radius: {
                    _type: "Number",
                    _info: "If specified, only trigger when distance to entity is below the given radius",
                    _optional: true
                },
                heightCompare: {
                    _type: "String",
                    info: "How height comparison matters",
                    _select: b
                }
            },
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(255,0,122, 0.5)",
            drawCircle: function(a) {
                return a.radius || 0
            },
            noZLine: true
        }),
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.setSize(16, 16, 0);
            this.startCondition = new ig.VarCondition(e.startCondition);
            this.triggerVar = "map.locEvent.trig" + this.mapId;
            this.radius = e.radius || 0;
            this.heightCompare = b[e.heightCompare] || 0;
            if (e.event) this.event =
                new ig.Event({
                    name: this.name,
                    steps: e.event
                });
            ig.vars.get(this.triggerVar) ? this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC) : this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.ON_SCREEN)
        },
        onKill: function(a) {
            this.parent(a);
            this.event && this.event.clearCached()
        },
        update: function() {
            if (!sc.model.isCombatActive() && !sc.model.message.isSideMessageVisible() && sc.model.isGame() && sc.model.isRunning() && ig.EntityTools.isInScreen(this, -48, -32) && this.startCondition.evaluate()) {
                var a = ig.game.playerEntity.coll;
                if (!(this.radius &&
                        ig.CollTools.getScreenDistance(this.coll, a) > this.radius) && (!this.heightCompare || !(this.heightCompare == b.ABOVE && a.pos.z < this.coll.pos.z || this.heightCompare == b.BELOW && a.pos.z > this.coll.pos.z))) {
                    this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
                    if (!ig.vars.get(this.triggerVar)) {
                        ig.vars.set(this.triggerVar, 1);
                        sc.Cutscene.startEvent(ig.EVENT_TYPE.PARALLEL, this.event)
                    }
                }
            }
        }
    })
});
ig.baked = !0;
