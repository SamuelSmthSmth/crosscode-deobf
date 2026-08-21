/**
 * impact.base.action
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.action")`.
 *
 * "Actions" are named, potentially looping/parallel sequences of steps (see
 * impact.base.steps). `ig.Action` runs its step chain against an entity, driving
 * behaviour such as movement, attacks and cutscene actions. Steps register in
 * `ig.ACTION_STEP`.
 */
ig.module("impact.base.action").requires("impact.base.steps").defines(function () {

    ig.ACTION_STEP = {};
    ig.ActionStepBase = ig.StepBase;

    ig.Action = ig.Class.extend({
        name: "",
        rootStep: null,
        labeledSteps: {},  // jump label name -> step
        eventAction: false,
        parallelMove: false,
        repeating: false,
        hint: null,

        /**
         * @param {string} name
         * @param {Array} stepList raw step data
         * @param {boolean} [parallelMove]
         * @param {boolean} [repeating]
         */
        init: function (name, stepList, parallelMove, repeating) {
            this.name = name;
            this.parallelMove = parallelMove || false;
            this.repeating = repeating || false;
            this.rootStep = ig.StepHelpers.constructSteps(stepList, ig.ACTION_STEP, this.labeledSteps);
        },

        clearCached: function () {
            ig.StepHelpers.clearStepsCache(this.rootStep);
        },

        /** Start a step on an entity without disturbing the current action timer. */
        inlineStart: function (entity, step) {
            if (entity.stepTimer > 0) entity.stepTimer = 0;
            var prevAction = entity.currentAction;
            step.start(entity);
            if (prevAction == entity.currentAction) entity.currentActionStep = step;
        },

        /**
         * Advance the action's step chain by one tick.
         * @returns {boolean} true when the action has finished
         */
        run: function (entity) {
            if (!this.parallelMove) Vec2.assignC(entity.coll.accelDir, 0, 0);

            var step = entity.currentActionStep;
            if (!step) {
                step = this.rootStep;
                if (!step) return true;
                if (entity.stepTimer > 0) entity.stepTimer = 0;
                var prevAction = entity.currentAction;
                step.start(entity);
                if (prevAction != entity.currentAction) return false;
                entity.currentActionStep = step;
            }

            for (var prevAction = entity.currentAction, guard = 10000; step && step.run(entity);) {
                if (entity.stepTimer > 0) entity.stepTimer = 0;

                if (!entity.currentAction) {
                    step = null;
                    break;
                }
                if (prevAction != entity.currentAction || step != entity.currentActionStep) return false;

                var nextStep = null;
                if (step.getJumpLabelName) {
                    var label = step.getJumpLabelName(entity);
                    if (label) {
                        nextStep = this.labeledSteps[label];
                        if (!nextStep) throw Error("Label '" + label + "' not found.");
                    }
                }
                if (!nextStep) nextStep = step.getNext(entity);

                guard--;
                if (guard <= 0) {
                    throw Error("Ridiculous number of steps execute in one action tick!! Infinite Loop? " +
                        "Action Name: " + this.name + ", Entity Group: " + entity.group +
                        ", Entity Name: " + entity.name + ", Enemy Name: " + entity.enemyName);
                }

                step = nextStep;
                if (entity.currentActionStep = step) step.start(entity);
                if (prevAction != entity.currentAction || step != entity.currentActionStep) return false;
            }

            entity.currentActionStep = step;
            entity.stepTimer = entity.stepTimer < 0 ? 0 : entity.stepTimer - entity.coll.getTick(true);

            var finished = !step && !this.repeating;
            if (finished && !this.parallelMove) Vec2.assignC(entity.coll.accelDir, 0, 0);
            return finished;
        },
    });

    // --- static value-resolving helpers (attribute-backed or event-backed) ---

    ig.Action.getVarName = function (value, entity) {
        return value && value.actorAttrib ? entity.getAttribString(value.actorAttrib) : ig.Event.getVarName(value);
    };

    ig.Action.getVec2 = function (value, entity, out) {
        return value && value.actorAttrib ? Vec2.assign(out, entity.getAttribVec2(value.actorAttrib)) : ig.Event.getVec2(value, out);
    };

    ig.Action.getVec3 = function (value, entity, out) {
        return value && value.actorAttrib ? Vec3.assign(out, entity.getAttribVec3(value.actorAttrib)) : ig.Event.getVec3(value, out);
    };

    ig.Action.getFace = function (value, entity, out) {
        return value && value.actorAttrib
            ? Vec2.assign(out, entity.getAttribVec2(value.actorAttrib))
            : ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[value] || 0, out);
    };
});
