/**
 * impact.base.steps
 * =================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.steps")`.
 *
 * Base classes for "steps" — the linear/branching instruction sequences that
 * drive events, cutscenes and actions. `constructSteps` builds a linked list of
 * step instances (with named LABELs and branches) from a raw JSON description.
 */
ig.module("impact.base.steps").defines(function () {

    /**
     * Recursively builds a chain of step instances from raw step data.
     *
     * @param {Array} stepList raw step objects
     * @param {Object} stepTypes map of type name -> step class
     * @param {Object} labels out: label name -> step instance
     * @param {Array} collected out: every created step, flattened
     * @returns {Object|null} the first step in the chain (or null if empty)
     */
    function constructSteps(stepList, stepTypes, labels, collected) {
        var first = null;
        var pending = []; // steps whose _nextStep still needs to be linked

        for (var idx = 0; idx < stepList.length; idx++) {
            var typeName = stepList[idx].type;
            var StepClass = stepTypes[typeName];

            if (StepClass) {
                var step = new StepClass(stepList[idx]);

                if (typeName == "LABEL") {
                    if (labels[step.name] && !window.wm) {
                        throw Error("Step Collection includes label '" + step.name + "' twice");
                    }
                    labels[step.name] = step;
                }

                // link all pending steps forward to this new step
                for (var j = 0; j < pending.length; ++j) {
                    pending[j]._nextStep = step;
                }

                pending = []; // start a fresh pending list

                // recursively construct any named branches
                var branchNames = step.getBranchNames && step.getBranchNames();
                if (branchNames) {
                    if (!step.branches) step.branches = {};
                    for (var k = 0; k < branchNames.length; ++k) {
                        var branchName = branchNames[k];
                        var branchData = stepList[idx][branchName];
                        if (!branchData) branchData = [];
                        step.branches[branchName] = constructSteps(branchData, stepTypes, labels, pending);
                    }
                }

                pending.push(step);
                if (!first) first = step;
            }
        }

        for (var m = 0; m < pending.length; ++m) collected.push(pending[m]);
        return first;
    }

    ig.StepHelpers = {
        constructSteps: function (stepList, stepTypes, labels) {
            return constructSteps(stepList, stepTypes, labels, []);
        },

        /** Recursively clear cached state on a step and all its branches. */
        clearStepsCache: function (step) {
            if (step && !step._cacheIsCleared) {
                if (step.clearCached) step.clearCached();
                step._cacheIsCleared = true;
                if (step._nextStep) this.clearStepsCache(step._nextStep);
                if (step.branches) {
                    for (var key in step.branches) {
                        if (step.branches[key]) this.clearStepsCache(step.branches[key]);
                    }
                }
            }
        },
    };

    ig.StepBase = ig.Class.extend({
        _nextStep: null,
        _cacheIsCleared: false,
        branches: undefined,

        init: function () {},
        start: function () {},
        run: function () {
            return true;
        },
        getNext: function () {
            return this._nextStep;
        },
        getJumpLabelName: null,
    });
});
