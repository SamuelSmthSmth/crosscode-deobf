ig.module("game.feature.credits.credit-loadable").requires("impact.base.game", "impact.base.loader").defines(function() {
    sc.CreditSectionLoadable = ig.Loadable.extend({
        cacheType: "Credit",
        data: null,
        lowestFloor: 0,
        init: function(b) {
            this.parent(b)
        },
        loadInternal: function(b) {
            $.ajax({
                dataType: "json",
                url: ig.root + b.toPath("data/credits/", ".json") + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function() {
            this.data = null;
            this.loadingFinished(false)
        },
        onload: function(b) {
            this.data =
                b;
            this.loadingFinished(true)
        }
    });
    sc.CreditsManager = ig.GameAddon.extend({
        speed: 1,
        init: function() {
            this.parent("CreditsManager")
        },
        reset: function() {
            this.speed = 1
        },
        onTeleport: function() {
            this.reset()
        },
        onReset: function() {
            this.reset()
        }
    });
    ig.addGameAddon(function() {
        return sc.credits = new sc.CreditsManager
    })
});
ig.baked = !0;
