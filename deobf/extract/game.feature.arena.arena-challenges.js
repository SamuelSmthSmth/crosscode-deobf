ig.module("game.feature.arena.arena-challenges").requires("impact.base.game").defines(function() {
    sc.ARENA_CHALLENGES = {};
    sc.ArenaChallengeBase = ig.Class.extend({
        state: false,
        icon: 0,
        init: function(b, a) {
            this.icon = b || 0;
            this.callback = a
        },
        toggle: function(b) {
            this.state = b != void 0 ? b : !this.state;
            this.callback && this.callback()
        }
    });
    sc.ArenaChallengePlayerBase = sc.ArenaChallengeBase.extend({
        core: null,
        init: function(b, a) {
            this.parent(a, this.onToggle.bind(this));
            this.core = b
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
