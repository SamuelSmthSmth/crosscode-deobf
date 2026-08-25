ig.module("game.feature.model.base-model").defines(function() {
    sc.Model = {
        addObserver: function(b, a) {
            if (!a) throw Error("Given Observer is null!");
            b.observers.indexOf(a) == -1 && b.observers.push(a)
        },
        removeObserver: function(b, a) {
            b.observers.erase(a)
        },
        notifyObserver: function(b, a, d) {
            for (var c = 0; c < b.observers.length; ++c) b.observers[c].modelChanged(b, a, d)
        },
        isObserver: function(b, a) {
            return b.observers.indexOf(a) != -1
        },
        getMessageName: function(b, a) {
            for (var d in b)
                if (b[d] == a) return d;
            return "INVALID"
        }
    }
});
ig.baked = !0;
