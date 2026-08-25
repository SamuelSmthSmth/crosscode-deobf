ig.module("impact.base.action").requires("impact.base.steps").defines(function() {
    ig.ACTION_STEP = {};
    ig.ActionStepBase = ig.StepBase;
    ig.Action = ig.Class.extend({
        name: "",
        rootStep: null,
        labeledSteps: {},
        eventAction: false,
        parallelMove: false,
        repeating: false,
        hint: null,
        init: function(b, a, d, c) {
            this.name = b;
            this.parallelMove = d || false;
            this.repeating = c || false;
            this.rootStep = ig.StepHelpers.constructSteps(a, ig.ACTION_STEP, this.labeledSteps)
        },
        clearCached: function() {
            ig.StepHelpers.clearStepsCache(this.rootStep)
        },
        inlineStart: function(b,
            a) {
            if (b.stepTimer > 0) b.stepTimer = 0;
            var d = b.currentAction;
            a.start(b);
            if (d == b.currentAction) b.currentActionStep = a
        },
        run: function(b) {
            this.parallelMove || Vec2.assignC(b.coll.accelDir, 0, 0);
            var a = b.currentActionStep;
            if (!a) {
                a = this.rootStep;
                if (!a) return true;
                if (b.stepTimer > 0) b.stepTimer = 0;
                var d = b.currentAction;
                a.start(b);
                if (d != b.currentAction) return false;
                b.currentActionStep = a
            }
            for (var d = b.currentAction, c = 1E4; a && a.run(b);) {
                if (b.stepTimer > 0) b.stepTimer = 0;
                if (!b.currentAction) {
                    a = null;
                    break
                }
                if (d != b.currentAction ||
                    a != b.currentActionStep) return false;
                var e = null;
                if (a.getJumpLabelName) {
                    var f = a.getJumpLabelName(b);
                    if (f) {
                        e = this.labeledSteps[f];
                        if (!e) throw Error("Label '" + f + "' not found.");
                    }
                }
                e || (e = a.getNext(b));
                c--;
                if (c <= 0) throw Error("Ridiculous number of steps execute in one action tick!! Infinite Loop? Action Name: " + this.name + ", Entity Group: " + b.group + ", Entity Name: " + b.name + ", Enemy Name: " + b.enemyName);
                a = e;
                (b.currentActionStep = a) && a.start(b);
                if (d != b.currentAction || a != b.currentActionStep) return false
            }
            b.currentActionStep =
                a;
            b.stepTimer = b.stepTimer < 0 ? 0 : b.stepTimer - b.coll.getTick(true);
            (a = !a && !this.repeating) && !this.parallelMove && Vec2.assignC(b.coll.accelDir, 0, 0);
            return a
        }
    });
    ig.Action.getVarName = function(b, a) {
        return b && b.actorAttrib ? a.getAttribString(b.actorAttrib) : ig.Event.getVarName(b)
    };
    ig.Action.getVec2 = function(b, a, d) {
        return b && b.actorAttrib ? Vec2.assign(d, a.getAttribVec2(b.actorAttrib)) : ig.Event.getVec2(b, d)
    };
    ig.Action.getVec3 = function(b, a, d) {
        return b && b.actorAttrib ? Vec3.assign(d, a.getAttribVec3(b.actorAttrib)) :
            ig.Event.getVec3(b, d)
    };
    ig.Action.getFace = function(b, a, d) {
        return b && b.actorAttrib ? Vec2.assign(d, a.getAttribVec2(b.actorAttrib)) : ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[b] || 0, d)
    }
});
ig.baked = !0;
