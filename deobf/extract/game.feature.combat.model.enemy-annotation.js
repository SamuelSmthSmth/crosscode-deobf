ig.module("game.feature.combat.model.enemy-annotation").defines(function() {
    sc.ENEMY_AGGRESSION = {
        THREAT: 0,
        TEMP_THREAT: 1,
        PEACEFUL: 2
    };
    sc.ENEMY_ANNO_ACTIVE = {
        NONE: 0,
        PRE_ATTACK: 1,
        ATTACK: 2,
        WIDE_RANGE_ATTACK: 3,
        POST_ATTACK: 4
    };
    sc.ENEMY_ANNO_PASSIVE = {
        NONE: 0,
        VULNERABLE: 1,
        WEAK: 2,
        IMMUNE: 3
    };
    sc.ENEMY_ANNO_WEAPON = {
        ANY: 0,
        MELEE: 1,
        RANGED: 2
    };
    sc.ENEMY_ANNO_EXTRA = {
        ATTACK_BACK: 1,
        ATTACK_FRONT: 2,
        LOOK_AWAY: 4,
        BE_PASSIVE: 8,
        BE_PASSIVE_IF_TARGETED: 16,
        VIRUS_SPECIAL_RULE: 32
    };
    sc.ENEMY_ANNO_ELEMENT = {
        ANY: 0,
        NEUTRAL: 1,
        HEAT: 2,
        COLD: 3,
        SHOCK: 4,
        WAVE: 5
    };
    ig.perf.aiSmart = false;
    sc.EnemyAnno = {
        useMelee: function(b) {
            return !b.annotate ? false : b.annotate.weapon == sc.ENEMY_ANNO_WEAPON.MELEE
        },
        useRanged: function(b) {
            return !b.annotate ? false : b.annotate.weapon == sc.ENEMY_ANNO_WEAPON.RANGED
        },
        isVulnerable: function(b, a) {
            return !b.annotate || a && !this.doesRandomlyUnderstand(b, a) ? false : b.annotate.passive == sc.ENEMY_ANNO_PASSIVE.VULNERABLE
        },
        isWeak: function(b, a) {
            return !b.annotate || a && !this.doesRandomlyUnderstand(b, a) ? false : b.annotate.passive == sc.ENEMY_ANNO_PASSIVE.WEAK
        },
        isImmune: function(b, a) {
            return !b.annotate || a && !this.doesRandomlyUnderstand(b, a) ? false : b.annotate.passive == sc.ENEMY_ANNO_PASSIVE.IMMUNE
        },
        needDodge: function(b, a) {
            return !b.annotate || a && !this.doesRandomlyUnderstand(b, a) ? false : b.annotate.active == sc.ENEMY_ANNO_ACTIVE.ATTACK || b.annotate.active == sc.ENEMY_ANNO_ACTIVE.WIDE_RANGE_ATTACK
        },
        keepFarDistance: function(b, a) {
            return !b.annotate || a && !this.doesRandomlyUnderstand(b, a) ? false : b.annotate.active == sc.ENEMY_ANNO_ACTIVE.WIDE_RANGE_ATTACK
        },
        isCrossCounterEffective: function(b) {
            return !b.annotate ?
                false : b.annotate.active == sc.ENEMY_ANNO_ACTIVE.PRE_ATTACK || b.annotate.active == sc.ENEMY_ANNO_ACTIVE.ATTACK
        },
        getElement: function(b) {
            return !b.annotate ? 0 : b.annotate.element - 1
        },
        doesRandomlyUnderstand: function(b, a, d) {
            return Math.random() <= this.getUnderstandFactor(b, a, d)
        },
        getUnderstandFactor: function(b, a, d) {
            if (ig.perf.aiSmart) return 1;
            b = sc.combat.getEnemyAiExp(b, d);
            a = Math.min(0.1 + a.model.level / 100, 0.5);
            a = a + b * (1 - a);
            (b = sc.party.ai.battle) && (a = b + (1 - b) * a);
            return a
        },
        hasExtra: function(b, a) {
            return !b.annotate ? false :
                b.annotate.extra & a
        },
        hasLookAway: function(b, a) {
            return !this.doesRandomlyUnderstand(b, a) || b.target != a ? false : this.hasExtra(b, sc.ENEMY_ANNO_EXTRA.LOOK_AWAY)
        },
        hasAttackBack: function(b, a) {
            return a && !this.doesRandomlyUnderstand(b, a) ? false : this.hasExtra(b, sc.ENEMY_ANNO_EXTRA.ATTACK_BACK)
        },
        hasAttackFront: function(b, a) {
            return a && !this.doesRandomlyUnderstand(b, a) ? false : this.hasExtra(b, sc.ENEMY_ANNO_EXTRA.ATTACK_FRONT)
        },
        shouldBePassive: function(b, a) {
            if (!this.doesRandomlyUnderstand(b, a, 4)) return false;
            if (this.isImmune(b) ||
                b.target == a && this.hasExtra(b, sc.ENEMY_ANNO_EXTRA.BE_PASSIVE_IF_TARGETED) || this.hasExtra(b, sc.ENEMY_ANNO_EXTRA.BE_PASSIVE)) return true;
            if (this.hasExtra(b, sc.ENEMY_ANNO_EXTRA.VIRUS_SPECIAL_RULE)) {
                var d = sc.combat.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, "arid.virus-cold") + sc.combat.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, "arid.virus-heat"),
                    c = sc.combat.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, "arid.virus-neutral");
                if (d > 0 && c <= 2) return true
            }
            return false
        }
    }
});
ig.baked = !0;
