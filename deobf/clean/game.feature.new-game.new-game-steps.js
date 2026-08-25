/**
 * @module game.feature.new-game.new-game-steps
 *
 * Event step for applying New Game Plus carry-over data when
 * starting at Rhombus Square. Delegates to the NewGamePlusModel
 * to restore levels, items, and other carried-over state.
 */
ig.module("game.feature.new-game.new-game-steps").requires("impact.base.action", "impact.base.event", "game.feature.new-game.new-game-model").defines(function() {
    ig.EVENT_STEP.APPLY_NEW_GAME_DATA = ig.EventStepBase.extend({
        _wm: new ig.Config({attributes: {atRhombus: {_type: "Boolean", _info: "If true, apply data for when you start at Rhombus"}}}),
        init: function(settings) {this.atRhombus = settings.atRhombus},
        start: function() {sc.newgame.applyStoreData(this.atRhombus)}
    })
});
ig.baked = !0;