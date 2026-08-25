ig.module("impact.base.event").requires("impact.base.steps").defines(function() {
    ig.EventRunType = {
        INTERRUPTABLE: 0,
        PARALLEL: 1,
        BLOCKING: 2
    };
    ig.EventManager = ig.Class.extend({
        runningEventCalls: [],
        blockingEventCall: null,
        blockedEventCallQueue: [],
        init: function() {},
        callEvent: function(b, a, d, c, e, f, g) {
            b = new ig.EventCall(b, e, a, d, c, f, g);
            if (!this.blockingEventCall || a != ig.EventRunType.BLOCKING) this._startEventCall(b);
            else {
                b.blocked = true;
                this.blockedEventCallQueue.push(b)
            }
            return b
        },
        getBlockingEventCall: function() {
            return this.blockingEventCall
        },
        hasBlockingEventCallHint: function(b) {
            return this.blockingEventCall && this.blockingEventCall.hasHint(b)
        },
        isInterruptible: function() {
            for (var b = this.runningEventCalls.length; b--;)
                if (this.runningEventCalls[b].runType != ig.EventRunType.INTERRUPTABLE) return false;
            return true
        },
        update: function() {
            for (var b = 0; b < this.runningEventCalls.length;) {
                var a = this.runningEventCalls[b];
                if (ig.game.paused && !a.pauseParallel) ++b;
                else if (a.update()) {
                    this.runningEventCalls.splice(b, 1);
                    this._endEventCall(a)
                } else ++b
            }
        },
        clearQueue: function() {
            this.blockedEventCallQueue.length =
                0
        },
        clear: function() {
            for (var b = this.runningEventCalls.length; b--;) this.runningEventCalls.splice(b, 1);
            this.blockingEventCall = null;
            this.blockedEventCallQueue = []
        },
        _startEventCall: function(b) {
            b.blocked = false;
            this.runningEventCalls.push(b);
            if (b.runType == ig.EventRunType.BLOCKING) this.blockingEventCall = b;
            if (b.onStart) b.onStart(b)
        },
        _endEventCall: function(b) {
            b.setDone();
            if (b.runType == ig.EventRunType.BLOCKING) this.blockedEventCallQueue.length ? this._startEventCall(this.blockedEventCallQueue.shift()) : this.blockingEventCall =
                null
        }
    });
    ig.EventCall = ig.Class.extend({
        runType: 0,
        done: false,
        blocked: false,
        stack: [],
        eventAttached: [],
        pauseParallel: false,
        onStart: null,
        onEnd: null,
        callEntity: null,
        data: null,
        init: function(b, a, d, c, e, f, g) {
            this.runType = d || 0;
            this.onStart = c || null;
            this.onEnd = e || null;
            this.callEntity = f;
            this.data = g || null;
            b && this.callInlineEvent(b, a)
        },
        hasHint: function(b) {
            return this.stack[0] && this.stack[0].event.hasHint(b)
        },
        callInlineEvent: function(b, a) {
            var d = b.setupInput(a);
            this.stack.push({
                event: b,
                currentStep: null,
                stepData: {},
                vars: d
            });
            return this.stack[this.stack.length - 1]
        },
        addEventAttached: function(b) {
            this.eventAttached.push(b)
        },
        setDone: function() {
            this.done = true;
            for (var b = 0; b < this.eventAttached.length; ++b) this.eventAttached[b].onEventEndDetach(this);
            this.eventAttached = [];
            if (this.onEnd) this.onEnd(this)
        },
        isBlocked: function() {
            return this.blocked
        },
        isRunning: function() {
            return !this.done
        },
        performStep: function(b) {
            do {
                if (!b.currentStep) b.currentStep = b.event.rootStep;
                var a = b.currentStep;
                if (!a) break;
                a.start && a.start(b.stepData, this);
                if (a.getInlineEvent) {
                    b = a.getInlineEvent();
                    a = this.callInlineEvent(b, a.getInlineEventInput());
                    ig.vars.setupCallScope(a.vars);
                    b = a
                }
            } while (!b.currentStep);
            return b
        },
        update: function() {
            var b = this.stack[this.stack.length - 1];
            ig.vars.setupCallScope(b.vars);
            for (b.currentStep || (b = this.performStep(b)); b.currentStep && b.currentStep.run(b.stepData);) {
                var a = null;
                if (b.currentStep.getJumpLabelName) {
                    var d = b.currentStep.getJumpLabelName(b.stepData);
                    if (d) {
                        a = b.event.labeledSteps[d];
                        if (!a) throw Error("Label '" + d + "' not found.");
                    }
                }
                a || (a = b.currentStep.getNext(b.stepData));
                b.currentStep = a;
                if (b.currentStep) b = this.performStep(b);
                else {
                    this.stack.pop();
                    if (d = this.stack[this.stack.length - 1]) {
                        b = d;
                        ig.vars.setupCallScope(b.vars);
                        b.currentStep = b.currentStep.getNext(b.stepData);
                        b.currentStep && (b = this.performStep(b))
                    }
                }
            }
            ig.vars.setupCallScope(null);
            return !b || !b.currentStep
        }
    });
    ig.EventStepBase = ig.StepBase;
    ig.EVENT_STEP = {};
    ig.Event = ig.Class.extend({
        name: null,
        rootStep: null,
        labeledSteps: {},
        hints: [],
        init: function(b) {
            this.name = b.name || "[UNNAMED]";
            this.inputSignature = b.input || {};
            this.rootStep = ig.StepHelpers.constructSteps(b.steps, ig.EVENT_STEP, this.labeledSteps)
        },
        addHint: function(b) {
            this.hints.push(b)
        },
        hasHint: function(b) {
            return this.hints.indexOf(b) !== -1
        },
        clearCached: function() {
            ig.StepHelpers.clearStepsCache(this.rootStep)
        },
        setupInput: function(b) {
            var a = {},
                d;
            for (d in this.inputSignature) switch (this.inputSignature[d]._type) {
                case "StringExpression":
                case "String":
                case "BooleanExpression":
                case "Boolean":
                case "NumberExpression":
                case "Number":
                    a[d] =
                        ig.Event.getExpressionValue(b[d]);
                    break;
                case "Vec2":
                    a[d] = ig.Event.getVec2(b[d], Vec2.create());
                    break;
                case "Vec3":
                    a[d] = ig.Event.getVec3(b[d], Vec3.create());
                    break;
                case "VarName":
                    a[d] = ig.Event.getVarName(b[d]);
                    break;
                case "Entity":
                    a[d] = b[d];
                    break;
                case "LangLabel":
                    a[d] = ig.LangLabel.getText(b[d]);
                    break;
                default:
                    throw Error("Event: could not initialize input of type '" + this.inputSignature[d]._type + "'");
            }
            return a
        }
    });
    ig.Event.getNumberVary = function(b) {
        return b && b.base ? b.base + (Math.random() - 0.5) * 2 * (b.vary || 0) :
            b
    };
    ig.Event.getEntity = function(b, a) {
        if (!b) return null;
        if (b instanceof ig.Entity) return b;
        if (b.player) return ig.game.playerEntity;
        if (b.self) return a && a.callEntity || null;
        if (b.name) return ig.game.getEntityByName(b.name);
        for (var d = ig.ENTITY_FETCH_KEYS.length; d--;) {
            var c = ig.ENTITY_FETCH_KEYS[d];
            if (b[c]) return ig.ENTITY_FETCH_MAP[c].fetch(b[c])
        }
        return null
    };
    ig.ENTITY_FETCH_MAP = {};
    ig.ENTITY_FETCH_KEYS = [];
    ig.Event.registerEntityFetchType = function(b, a, d) {
        ig.ENTITY_FETCH_MAP[b] = {
            fetch: a,
            editor: d
        };
        ig.ENTITY_FETCH_KEYS.push(b)
    };
    ig.Event.registerEntityFetchType("varName", function(b) {
        b = ig.Event.getVarName(b);
        b = ig.vars.get(b);
        return ig.game.namedEntities[b]
    }, {
        _type: "VarName",
        _info: "Variable from which to fetch entity name"
    });
    ig.Event.getVec2 = function(b, a) {
        var d = ig.Event.getExpressionValue(b);
        return Vec2.assign(a, d)
    };
    ig.Event.getVec3 = function(b, a) {
        var d = ig.Event.getExpressionValue(b),
            c = d.x,
            e = d.y,
            d = d.lvl ? ig.game.getHeightFromLevelOffset(d.lvl) : d.z || 0;
        return Vec3.assignC(a, c, e, d)
    };
    ig.Event.getVarName = function(b) {
        b && b.indirect &&
            (b = ig.vars.get(b.indirect));
        return typeof b == "string" ? b : null
    };
    ig.Event.getExpressionValue = function(b) {
        if (b && b.indirect) {
            b = ig.vars.get(b.indirect);
            return ig.vars.get(b)
        }
        return b && b.varName ? ig.vars.get(b.varName) : b
    }
});
ig.baked = !0;
