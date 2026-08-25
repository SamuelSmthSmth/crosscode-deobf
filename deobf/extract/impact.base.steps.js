ig.module("impact.base.steps").defines(function() {
    function b(a, d, c, e) {
        for (var f = null, g = [], h = 0; h < a.length; h++) {
            var i = a[h].type,
                j = d[i];
            if (j) {
                j = new j(a[h]);
                if (i == "LABEL") {
                    if (c[j.name] && !window.wm) throw Error("Step Collection includes label '" + j.name + "' twice");
                    c[j.name] = j
                }
                for (i = 0; i < g.length; ++i) g[i]._nextStep = j;
                var g = [],
                    k = j.getBranchNames && j.getBranchNames();
                if (k) {
                    if (!j.branches) j.branches = {};
                    for (i = 0; i < k.length; ++i) {
                        var l = k[i],
                            o = a[h][l];
                        o || (o = []);
                        o = b(o, d, c, g);
                        j.branches[l] = o
                    }
                }
                g.push(j);
                f || (f = j)
            }
        }
        for (i =
            0; i < g.length; ++i) e.push(g[i]);
        return f
    }
    ig.StepHelpers = {
        constructSteps: function(a, d, c) {
            return b(a, d, c, [])
        },
        clearStepsCache: function(a) {
            if (a && !a._cacheIsCleared) {
                a.clearCached && a.clearCached();
                a._cacheIsCleared = true;
                a._nextStep && this.clearStepsCache(a._nextStep);
                if (a.branches)
                    for (var b in a.branches) a.branches[b] && this.clearStepsCache(a.branches[b])
            }
        }
    };
    ig.StepBase = ig.Class.extend({
        _nextStep: null,
        _cacheIsCleared: false,
        branches: void 0,
        init: function() {},
        start: function() {},
        run: function() {
            return true
        },
        getNext: function() {
            return this._nextStep
        },
        getJumpLabelName: null
    })
});
ig.baked = !0;
