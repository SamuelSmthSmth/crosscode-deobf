/**
 * game.feature.model.base-model
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.model.base-model")`.
 *
 * `sc.Model`: the observer-pattern helper shared by every game model
 * (`sc.model`, `sc.options`, `sc.menu`, …). Models keep an `observers`
 * array; observers implement `modelChanged(model, message, data)`.
 */
ig.module("game.feature.model.base-model").defines(function () {

    sc.Model = {
        addObserver: function (model, observer) {
            if (!observer) throw Error("Given Observer is null!");
            model.observers.indexOf(observer) == -1 && model.observers.push(observer)
        },

        removeObserver: function (model, observer) {
            model.observers.erase(observer)
        },

        notifyObserver: function (model, message, data) {
            for (var i = 0; i < model.observers.length; ++i) model.observers[i].modelChanged(model, message, data)
        },

        isObserver: function (model, observer) {
            return model.observers.indexOf(observer) != -1
        },

        /** Reverse-look up the message constant name for a given numeric value. */
        getMessageName: function (object, value) {
            for (var key in object)
                if (object[key] == value) return key;
            return "INVALID"
        }
    }
});
ig.baked = !0;
