/**
 * @module game.feature.trade.trade-steps
 *
 * Event steps for the trading feature: resetting a trader's stock and
 * starting an NPC trade menu (with optional traded/canceled branches).
 */
ig.module("game.feature.trade.trade-steps").requires("impact.base.action", "impact.base.event").defines(function() {
    ig.EVENT_STEP.RESET_TRADER = ig.EventStepBase.extend({
        trader: null,
        _wm: new ig.Config({
            attributes: {
                trader: {
                    _type: "TraderSelect",
                    _info: "The trader to reset."
                }
            }
        }),
        init: function(settings) {
            this.trader = settings.trader
        },
        start: function() {
            sc.trade.resetTrader(this.trader)
        }
    });
    ig.EVENT_STEP.START_NPC_TRADE_MENU = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                withBranches: {
                    _type: "Boolean",
                    _info: "If true, use branches to determine whether things where traded or not."
                }
            },
            branchLabel: function(branchName) {
                switch (branchName) {
                    case "traded":
                        return "ON TRADE DONE";
                    case "canceled":
                        return "ON TRADE CANCELED";
                    case "_end":
                        return "end trade"
                }
                return "???"
            }
        }),
        init: function(settings) {
            this.withBranches = settings.withBranches || false
        },
        start: function(stepState, eventContext) {
            if (eventContext.callEntity instanceof ig.ENTITY.NPC) {
                stepState._stashedPersons = sc.model.message.hasPerson();
                stepState._stashedPersons && sc.model.message.stashPersons();
                eventContext.callEntity.startTradeMenu()
            }
        },
        run: function(stepState) {
            var tradeMenuClosed = !sc.model.isOnMapMenu();
            tradeMenuClosed && stepState._stashedPersons && sc.model.message.showStashedPersons();
            return tradeMenuClosed
        },
        getBranchNames: function() {
            return this.withBranches ? ["traded", "canceled"] : null
        },
        getNext: function() {
            return !this.withBranches ? this._nextStep : sc.trade.sessionTradeCount > 0 ? this.branches.traded || this._nextStep : this.branches.canceled || this._nextStep
        }
    })
});
ig.baked = !0;
