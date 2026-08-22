/**
 * game.feature.combat.model.enemy-annotation
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.enemy-annotation")`.
 *
 * Enemy "annotation" lookup tables: the AI-visible labels (`sc.ENEMY_AGGRESSION`,
 * `sc.ENEMY_ANNO_ACTIVE/PASSIVE/WEAPON/EXTRA/ELEMENT`) plus `sc.EnemyAnno`,
 * the helper that reads an enemy's annotation to decide how the party AI
 * should react (dodge, keep distance, cross-counter, etc.), including a
 * random "does the AI understand this enemy yet" gate.
 */
ig.module("game.feature.combat.model.enemy-annotation")
    .defines(function () {

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
        useMelee: function (enemy) {
            return !enemy.annotate ? false : enemy.annotate.weapon == sc.ENEMY_ANNO_WEAPON.MELEE
        },

        useRanged: function (enemy) {
            return !enemy.annotate ? false : enemy.annotate.weapon == sc.ENEMY_ANNO_WEAPON.RANGED
        },

        isVulnerable: function (enemy, target) {
            return !enemy.annotate || target && !this.doesRandomlyUnderstand(enemy, target) ? false : enemy.annotate.passive == sc.ENEMY_ANNO_PASSIVE.VULNERABLE
        },

        isWeak: function (enemy, target) {
            return !enemy.annotate || target && !this.doesRandomlyUnderstand(enemy, target) ? false : enemy.annotate.passive == sc.ENEMY_ANNO_PASSIVE.WEAK
        },

        isImmune: function (enemy, target) {
            return !enemy.annotate || target && !this.doesRandomlyUnderstand(enemy, target) ? false : enemy.annotate.passive == sc.ENEMY_ANNO_PASSIVE.IMMUNE
        },

        needDodge: function (enemy, target) {
            return !enemy.annotate || target && !this.doesRandomlyUnderstand(enemy, target) ? false : enemy.annotate.active == sc.ENEMY_ANNO_ACTIVE.ATTACK || enemy.annotate.active == sc.ENEMY_ANNO_ACTIVE.WIDE_RANGE_ATTACK
        },

        keepFarDistance: function (enemy, target) {
            return !enemy.annotate || target && !this.doesRandomlyUnderstand(enemy, target) ? false : enemy.annotate.active == sc.ENEMY_ANNO_ACTIVE.WIDE_RANGE_ATTACK
        },

        isCrossCounterEffective: function (enemy) {
            return !enemy.annotate ? false : enemy.annotate.active == sc.ENEMY_ANNO_ACTIVE.PRE_ATTACK || enemy.annotate.active == sc.ENEMY_ANNO_ACTIVE.ATTACK
        },

        getElement: function (enemy) {
            return !enemy.annotate ? 0 : enemy.annotate.element - 1
        },

        doesRandomlyUnderstand: function (enemy, target, offset) {
            return Math.random() <= this.getUnderstandFactor(enemy, target, offset)
        },

        getUnderstandFactor: function (enemy, target, offset) {
            if (ig.perf.aiSmart) return 1;
            var aiExp = sc.combat.getEnemyAiExp(enemy, offset);
            var factor = Math.min(0.1 + target.model.level / 100, 0.5);
            factor = factor + aiExp * (1 - factor);
            var battleFactor = sc.party.ai.battle;
            battleFactor && (factor = battleFactor + (1 - battleFactor) * factor);
            return factor
        },

        hasExtra: function (enemy, flag) {
            return !enemy.annotate ? false : enemy.annotate.extra & flag
        },

        hasLookAway: function (enemy, target) {
            return !this.doesRandomlyUnderstand(enemy, target) || enemy.target != target ? false : this.hasExtra(enemy, sc.ENEMY_ANNO_EXTRA.LOOK_AWAY)
        },

        hasAttackBack: function (enemy, target) {
            return target && !this.doesRandomlyUnderstand(enemy, target) ? false : this.hasExtra(enemy, sc.ENEMY_ANNO_EXTRA.ATTACK_BACK)
        },

        hasAttackFront: function (enemy, target) {
            return target && !this.doesRandomlyUnderstand(enemy, target) ? false : this.hasExtra(enemy, sc.ENEMY_ANNO_EXTRA.ATTACK_FRONT)
        },

        shouldBePassive: function (enemy, target) {
            if (!this.doesRandomlyUnderstand(enemy, target, 4)) return false;
            if (this.isImmune(enemy) || enemy.target == target && this.hasExtra(enemy, sc.ENEMY_ANNO_EXTRA.BE_PASSIVE_IF_TARGETED) || this.hasExtra(enemy, sc.ENEMY_ANNO_EXTRA.BE_PASSIVE)) return true;
            if (this.hasExtra(enemy, sc.ENEMY_ANNO_EXTRA.VIRUS_SPECIAL_RULE)) {
                var virusElementCount = sc.combat.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, "arid.virus-cold") + sc.combat.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, "arid.virus-heat"),
                    virusNeutralCount = sc.combat.getActiveCombatantCount(sc.COMBATANT_PARTY.ENEMY, "arid.virus-neutral");
                if (virusElementCount > 0 && virusNeutralCount <= 2) return true
            }
            return false
        }
    }
});
ig.baked = !0;
