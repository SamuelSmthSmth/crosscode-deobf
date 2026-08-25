ig.module("game.feature.puzzle.entities.spiderweb").requires("impact.feature.influencer.influencer", "impact.feature.terrain.terrain", "impact.feature.effect.effect-sheet").defines(function() {
    ig.Spiderweb = ig.Class.extend({
        influence: null,
        timer: 0,
        effects: {
            sheet: new ig.EffectSheet("puzzle.quicksand"),
            handle: null
        },
        init: function() {},
        onUpdate: function(b, a) {
            if (a.party != sc.COMBATANT_PARTY.ENEMY) {
                var d = a.coll,
                    c = a.stepStats.centerTerrain == ig.TERRAIN.SPIDERWEB && d.pos.z == d.baseZPos;
                a.isPlayer && sc.model.player.params.getModifier("SPIDER_SLOW_DOWN_GUARD") >
                    0 && (c = false);
                d.groundConnect != ig.COLL_GROUND_CONNECT.LOOSE && (c = false);
                a.respawn && a.respawn.timer && (c = false);
                if (!this.influence && c) {
                    this.influence = new ig.InfluenceEntry;
                    b.addInfluence(this.influence);
                    this.timer = 0
                } else this.influence && !c && this.endSpiderweb(b, 0.1);
                if (this.influence) {
                    this.timer = this.timer + ig.system.tick;
                    d = (this.timer / 0.3).limit(0, 1);
                    this.influence.moveXYScale = 0.9 - d * 0.6
                }
            }
        },
        endSpiderweb: function(b, a) {
            a ? this.influence.setFadeOut(a) : b.removeInfluence(this.influence);
            this.influence = null
        }
    });
    ig.InfluencerCallbacks.addCallback(ig.Spiderweb)
});
ig.baked = !0;
