/**
 * game.feature.puzzle.entities.spiderweb
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.spiderweb")`.
 *
 * `ig.Spiderweb`: an influencer callback (registered with
 * `ig.InfluencerCallbacks`) that slows down non-enemy combatants standing on
 * SPIDERWEB terrain while they are grounded, gradually ramping the slowdown.
 */
ig.module("game.feature.puzzle.entities.spiderweb")
    .requires("impact.feature.influencer.influencer", "impact.feature.terrain.terrain", "impact.feature.effect.effect-sheet")
    .defines(function () {

    ig.Spiderweb = ig.Class.extend({
        influence: null,
        timer: 0,
        effects: {
            sheet: new ig.EffectSheet("puzzle.quicksand"),
            handle: null
        },

        init: function () {},

        onUpdate: function (influencer, entity) {
            if (entity.party != sc.COMBATANT_PARTY.ENEMY) {
                var coll = entity.coll,
                    onWeb = entity.stepStats.centerTerrain == ig.TERRAIN.SPIDERWEB && coll.pos.z == coll.baseZPos;
                entity.isPlayer && sc.model.player.params.getModifier("SPIDER_SLOW_DOWN_GUARD") > 0 && (onWeb = false);
                coll.groundConnect != ig.COLL_GROUND_CONNECT.LOOSE && (onWeb = false);
                entity.respawn && entity.respawn.timer && (onWeb = false);
                if (!this.influence && onWeb) {
                    this.influence = new ig.InfluenceEntry;
                    influencer.addInfluence(this.influence);
                    this.timer = 0
                } else this.influence && !onWeb && this.endSpiderweb(influencer, 0.1);
                if (this.influence) {
                    this.timer = this.timer + ig.system.tick;
                    coll = (this.timer / 0.3).limit(0, 1);
                    this.influence.moveXYScale = 0.9 - coll * 0.6
                }
            }
        },

        endSpiderweb: function (influencer, fadeDuration) {
            fadeDuration ? this.influence.setFadeOut(fadeDuration) : influencer.removeInfluence(this.influence);
            this.influence = null
        }
    });

    ig.InfluencerCallbacks.addCallback(ig.Spiderweb)
});
ig.baked = !0;
