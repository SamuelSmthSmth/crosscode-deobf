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
        init: function(b) {
            this.trader = b.trader
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
            branchLabel: function(b) {
                switch (b) {
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
        init: function(b) {
            this.withBranches = b.withBranches || false
        },
        start: function(b, a) {
            if (a.callEntity instanceof ig.ENTITY.NPC) {
                b._stashedPersons = sc.model.message.hasPerson();
                b._stashedPersons && sc.model.message.stashPersons();
                a.callEntity.startTradeMenu()
            }
        },
        run: function(b) {
            var a = !sc.model.isOnMapMenu();
            a && b._stashedPersons && sc.model.message.showStashedPersons();
            return a
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
