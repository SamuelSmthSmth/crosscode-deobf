/**
 * impact.base.event
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.event")`.
 *
 * The event system. "Events" are named step chains (see impact.base.steps) with
 * typed inputs, used for cutscenes and gameplay scripts. `ig.EventManager` runs
 * event calls (interruptible / parallel / blocking); `ig.EventCall` is a single
 * running instance with an inline-event stack; `ig.Event` is the event definition.
 */
ig.module("impact.base.event").requires("impact.base.steps").defines(function () {

    ig.EventRunType = {
        INTERRUPTABLE: 0,
        PARALLEL: 1,
        BLOCKING: 2,
    };

    ig.EventManager = ig.Class.extend({
        runningEventCalls: [],
        blockingEventCall: null,
        blockedEventCallQueue: [],

        init: function () {},

        /**
         * Start a new event call.
         * NOTE: faithful parameter order — `onEnd` comes before `onStart` in the
         * original signature.
         * @param {ig.Event} event
         * @param {number} runType ig.EventRunType.*
         * @param {Function} onEnd
         * @param {Function} onStart
         * @param {Object} input event input values
         * @param {Object} callEntity the entity the event is attached to
         * @param {Object} data arbitrary extra data
         */
        callEvent: function (event, runType, onEnd, onStart, input, callEntity, data) {
            var eventCall = new ig.EventCall(event, input, runType, onStart, onEnd, callEntity, data);
            if (!this.blockingEventCall || runType != ig.EventRunType.BLOCKING) {
                this._startEventCall(eventCall);
            } else {
                eventCall.blocked = true;
                this.blockedEventCallQueue.push(eventCall);
            }
            return eventCall;
        },

        getBlockingEventCall: function () {
            return this.blockingEventCall;
        },

        hasBlockingEventCallHint: function (hint) {
            return this.blockingEventCall && this.blockingEventCall.hasHint(hint);
        },

        /** True if no non-interruptible event is currently running. */
        isInterruptible: function () {
            for (var i = this.runningEventCalls.length; i--;) {
                if (this.runningEventCalls[i].runType != ig.EventRunType.INTERRUPTABLE) return false;
            }
            return true;
        },

        update: function () {
            for (var i = 0; i < this.runningEventCalls.length;) {
                var eventCall = this.runningEventCalls[i];
                if (ig.game.paused && !eventCall.pauseParallel) {
                    ++i;
                } else if (eventCall.update()) {
                    this.runningEventCalls.splice(i, 1);
                    this._endEventCall(eventCall);
                } else {
                    ++i;
                }
            }
        },

        clearQueue: function () {
            this.blockedEventCallQueue.length = 0;
        },

        clear: function () {
            for (var i = this.runningEventCalls.length; i--;) this.runningEventCalls.splice(i, 1);
            this.blockingEventCall = null;
            this.blockedEventCallQueue = [];
        },

        _startEventCall: function (eventCall) {
            eventCall.blocked = false;
            this.runningEventCalls.push(eventCall);
            if (eventCall.runType == ig.EventRunType.BLOCKING) this.blockingEventCall = eventCall;
            if (eventCall.onStart) eventCall.onStart(eventCall);
        },

        _endEventCall: function (eventCall) {
            eventCall.setDone();
            if (eventCall.runType == ig.EventRunType.BLOCKING) {
                if (this.blockedEventCallQueue.length) {
                    this._startEventCall(this.blockedEventCallQueue.shift());
                } else {
                    this.blockingEventCall = null;
                }
            }
        },
    });

    ig.EventCall = ig.Class.extend({
        runType: 0,
        done: false,
        blocked: false,
        stack: [],          // inline-event call frames
        eventAttached: [],  // entities attached to this event
        pauseParallel: false,
        onStart: null,
        onEnd: null,
        callEntity: null,
        data: null,

        /**
         * @param {ig.Event} event
         * @param {Object} input
         * @param {number} runType
         * @param {Function} onStart
         * @param {Function} onEnd
         * @param {Object} callEntity
         * @param {Object} data
         */
        init: function (event, input, runType, onStart, onEnd, callEntity, data) {
            this.runType = runType || 0;
            this.onStart = onStart || null;
            this.onEnd = onEnd || null;
            this.callEntity = callEntity;
            this.data = data || null;
            if (event) this.callInlineEvent(event, input);
        },

        hasHint: function (hint) {
            return this.stack[0] && this.stack[0].event.hasHint(hint);
        },

        /** Push a new inline event onto the call stack. Returns the new frame. */
        callInlineEvent: function (event, input) {
            var vars = event.setupInput(input);
            this.stack.push({
                event: event,
                currentStep: null,
                stepData: {},
                vars: vars,
            });
            return this.stack[this.stack.length - 1];
        },

        addEventAttached: function (entity) {
            this.eventAttached.push(entity);
        },

        setDone: function () {
            this.done = true;
            for (var i = 0; i < this.eventAttached.length; ++i) {
                this.eventAttached[i].onEventEndDetach(this);
            }
            this.eventAttached = [];
            if (this.onEnd) this.onEnd(this);
        },

        isBlocked: function () {
            return this.blocked;
        },

        isRunning: function () {
            return !this.done;
        },

        /**
         * Ensure the frame has a current step, resolving inline events.
         * @returns {Object} the (possibly new) current frame
         */
        performStep: function (frame) {
            do {
                if (!frame.currentStep) frame.currentStep = frame.event.rootStep;
                var step = frame.currentStep;
                if (!step) break;
                if (step.start) step.start(frame.stepData, this);
                if (step.getInlineEvent) {
                    var inlineEvent = step.getInlineEvent();
                    var newFrame = this.callInlineEvent(inlineEvent, step.getInlineEventInput());
                    ig.vars.setupCallScope(newFrame.vars);
                    frame = newFrame;
                }
            } while (!frame.currentStep);
            return frame;
        },

        /**
         * Advance the event by one tick.
         * @returns {boolean} true when the whole event has finished
         */
        update: function () {
            var frame = this.stack[this.stack.length - 1];
            ig.vars.setupCallScope(frame.vars);

            for (frame.currentStep || (frame = this.performStep(frame));
                 frame.currentStep && frame.currentStep.run(frame.stepData);) {

                var nextStep = null;
                if (frame.currentStep.getJumpLabelName) {
                    var label = frame.currentStep.getJumpLabelName(frame.stepData);
                    if (label) {
                        nextStep = frame.event.labeledSteps[label];
                        if (!nextStep) throw Error("Label '" + label + "' not found.");
                    }
                }
                if (!nextStep) nextStep = frame.currentStep.getNext(frame.stepData);
                frame.currentStep = nextStep;

                if (frame.currentStep) {
                    frame = this.performStep(frame);
                } else {
                    // Inline event finished — pop back to the parent frame.
                    this.stack.pop();
                    var parentFrame = this.stack[this.stack.length - 1];
                    if (parentFrame) {
                        frame = parentFrame;
                        ig.vars.setupCallScope(frame.vars);
                        frame.currentStep = frame.currentStep.getNext(frame.stepData);
                        if (frame.currentStep) frame = this.performStep(frame);
                    }
                }
            }

            ig.vars.setupCallScope(null);
            return !frame || !frame.currentStep;
        },
    });

    ig.EventStepBase = ig.StepBase;
    ig.EVENT_STEP = {};

    ig.Event = ig.Class.extend({
        name: null,
        rootStep: null,
        labeledSteps: {},
        hints: [],
        inputSignature: {},

        init: function (data) {
            this.name = data.name || "[UNNAMED]";
            this.inputSignature = data.input || {};
            this.rootStep = ig.StepHelpers.constructSteps(data.steps, ig.EVENT_STEP, this.labeledSteps);
        },

        addHint: function (hint) {
            this.hints.push(hint);
        },

        hasHint: function (hint) {
            return this.hints.indexOf(hint) !== -1;
        },

        clearCached: function () {
            ig.StepHelpers.clearStepsCache(this.rootStep);
        },

        /**
         * Convert raw input values into typed local variables, per inputSignature.
         */
        setupInput: function (input) {
            var vars = {};
            for (var key in this.inputSignature) {
                switch (this.inputSignature[key]._type) {
                    case "StringExpression":
                    case "String":
                    case "BooleanExpression":
                    case "Boolean":
                    case "NumberExpression":
                    case "Number":
                        vars[key] = ig.Event.getExpressionValue(input[key]);
                        break;
                    case "Vec2":
                        vars[key] = ig.Event.getVec2(input[key], Vec2.create());
                        break;
                    case "Vec3":
                        vars[key] = ig.Event.getVec3(input[key], Vec3.create());
                        break;
                    case "VarName":
                        vars[key] = ig.Event.getVarName(input[key]);
                        break;
                    case "Entity":
                        vars[key] = input[key];
                        break;
                    case "LangLabel":
                        vars[key] = ig.LangLabel.getText(input[key]);
                        break;
                    default:
                        throw Error("Event: could not initialize input of type '" + this.inputSignature[key]._type + "'");
                }
            }
            return vars;
        },
    });

    // --- static value-resolving helpers ---

    ig.Event.getNumberVary = function (value) {
        return value && value.base ? value.base + (Math.random() - 0.5) * 2 * (value.vary || 0) : value;
    };

    /** Resolve an entity reference (player/self/name/fetch-key) to an entity. */
    ig.Event.getEntity = function (value, eventCall) {
        if (!value) return null;
        if (value instanceof ig.Entity) return value;
        if (value.player) return ig.game.playerEntity;
        if (value.self) return (eventCall && eventCall.callEntity) || null;
        if (value.name) return ig.game.getEntityByName(value.name);
        for (var i = ig.ENTITY_FETCH_KEYS.length; i--;) {
            var key = ig.ENTITY_FETCH_KEYS[i];
            if (value[key]) return ig.ENTITY_FETCH_MAP[key].fetch(value[key]);
        }
        return null;
    };

    ig.ENTITY_FETCH_MAP = {};
    ig.ENTITY_FETCH_KEYS = [];

    ig.Event.registerEntityFetchType = function (key, fetch, editor) {
        ig.ENTITY_FETCH_MAP[key] = { fetch: fetch, editor: editor };
        ig.ENTITY_FETCH_KEYS.push(key);
    };

    ig.Event.registerEntityFetchType("varName", function (varName) {
        varName = ig.Event.getVarName(varName);
        varName = ig.vars.get(varName);
        return ig.game.namedEntities[varName];
    }, {
        _type: "VarName",
        _info: "Variable from which to fetch entity name",
    });

    ig.Event.getVec2 = function (value, out) {
        var expr = ig.Event.getExpressionValue(value);
        return Vec2.assign(out, expr);
    };

    ig.Event.getVec3 = function (value, out) {
        var expr = ig.Event.getExpressionValue(value);
        var x = expr.x;
        var y = expr.y;
        var z = expr.lvl ? ig.game.getHeightFromLevelOffset(expr.lvl) : (expr.z || 0);
        return Vec3.assignC(out, x, y, z);
    };

    ig.Event.getVarName = function (value) {
        if (value && value.indirect) value = ig.vars.get(value.indirect);
        return typeof value == "string" ? value : null;
    };

    ig.Event.getExpressionValue = function (value) {
        if (value && value.indirect) {
            value = ig.vars.get(value.indirect);
            return ig.vars.get(value);
        }
        return value && value.varName ? ig.vars.get(value.varName) : value;
    };
});
