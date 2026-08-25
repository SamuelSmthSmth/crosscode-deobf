/**
 * @module game.feature.arena.arena-challenges
 *
 * Defines arena challenge modifiers that restrict player abilities
 * during arena rounds. Each challenge toggles a player core ability
 * (melee, ranged, dash, guard, combat arts, items, HP regen) or
 * applies special rules (Lea Must Die, environmental hazards, PvP,
 * weapon adjustment).
 */
ig.module("game.feature.arena.arena-challenges").requires("impact.base.game").defines(function() {
    sc.ARENA_CHALLENGES = {};
    sc.ArenaChallengeBase = ig.Class.extend({
        state: false,
        icon: 0,
        init: function(iconIndex, toggleCallback) {
            this.icon = iconIndex || 0;
            this.callback = toggleCallback
        },
        toggle: function(forcedState) {
            this.state = forcedState != void 0 ? forcedState : !this.state;
            this.callback && this.callback()
        }
    });
    sc.ArenaChallengePlayerBase = sc.ArenaChallengeBase.extend({
        core: null,
        init: function(coreName, iconIndex) {
            this.parent(iconIndex, this.onToggle.bind(this));
            this.core = coreName
        },
        onToggle: function() {
            sc.model.player.setCore(sc.PLAYER_CORE[this.core], !this.state)
        }
    });
    sc.ARENA_CHALLENGES.NO_MELEE = new sc.ArenaChallengePlayerBase("CLOSE_COMBAT", 2);
    sc.ARENA_CHALLENGES.NO_RANGED = new sc.ArenaChallengePlayerBase("THROWING", 3);
    sc.ARENA_CHALLENGES.NO_DASH = new sc.ArenaChallengePlayerBase("DASH", 4);
    sc.ARENA_CHALLENGES.NO_GUARD = new sc.ArenaChallengePlayerBase("GUARD", 5);
    sc.ARENA_CHALLENGES.NO_COMBAT_ARTS = new sc.ArenaChallengePlayerBase("SPECIAL", 6);
    sc.ARENA_CHALLENGES.NO_HP_REGEN = new sc.ArenaChallengeBase(9);
    sc.ARENA_CHALLENGES.NO_ITEMS = new sc.ArenaChallengeBase(7, function() {
        sc.quickmodel.setItemBlock(this.state)
    });
    sc.ARENA_CHALLENGES.LEA_MUST_DIE = new sc.ArenaChallengeBase(8);
    sc.ARENA_CHALLENGES.ENVIRO_HAZARD = new sc.ArenaChallengeBase(10);
    sc.ARENA_CHALLENGES.PVP_BATTLE = new sc.ArenaChallengeBase(12);
    sc.ARENA_CHALLENGES.WEAPON_ADJUST = new sc.ArenaChallengeBase(13)
});
ig.baked = !0;