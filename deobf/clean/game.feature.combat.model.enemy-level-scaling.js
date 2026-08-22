/**
 * game.feature.combat.model.enemy-level-scaling
 * =============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.enemy-level-scaling")`.
 *
 * `sc.EnemyLevelScaling`: interpolates enemy base/hp/credits stats across the
 * level curve, and adapts a param block (or credit value) from one level to
 * another. The level table is data and kept value-identical.
 */
ig.module("game.feature.combat.model.enemy-level-scaling")
    .defines(function () {

    var levelTable = [{
            level: 1,
            base: 24,
            hp: 200,
            credits: 5
        }, {
            level: 6,
            base: 32,
            hp: 300,
            credits: 23
        }, {
            level: 11,
            base: 45,
            hp: 420,
            credits: 50
        }, {
            level: 16,
            base: 63,
            hp: 600,
            credits: 80
        }, {
            level: 21,
            base: 84,
            hp: 800,
            credits: 115
        }, {
            level: 26,
            base: 105,
            hp: 1100,
            credits: 160
        }, {
            level: 31,
            base: 132,
            hp: 1500,
            credits: 210
        }, {
            level: 36,
            base: 163,
            hp: 2E3,
            credits: 290
        }, {
            level: 41,
            base: 199,
            hp: 3E3,
            credits: 380
        }, {
            level: 46,
            base: 236,
            hp: 5E3,
            credits: 490
        }, {
            level: 51,
            base: 278,
            hp: 8E3,
            credits: 610
        }, {
            level: 56,
            base: 323,
            hp: 1E4,
            credits: 750
        }, {
            level: 61,
            base: 372,
            hp: 12E3,
            credits: 900
        }, {
            level: 66,
            base: 425,
            hp: 13100,
            credits: 1200
        }, {
            level: 71,
            base: 484,
            hp: 15E3,
            credits: 1500
        }, {
            level: 76,
            base: 547,
            hp: 16900,
            credits: 1900
        }, {
            level: 81,
            base: 614,
            hp: 19E3,
            credits: 2400
        }, {
            level: 86,
            base: 687,
            hp: 21200,
            credits: 3E3
        }, {
            level: 91,
            base: 766,
            hp: 23700,
            credits: 3800
        }, {
            level: 96,
            base: 850,
            hp: 26300,
            credits: 4800
        }, {
            level: 99,
            base: 928,
            hp: 28700,
            credits: 6E3
        }
    ];

    sc.EnemyLevelScaling = {
        getAverageStat: function (level, stat) {
            level = level.limit(0, 99);
            for (var index = levelTable.length; index--;) {
                var entry = levelTable[index];
                if (entry.level <= level) {
                    if (entry.level == level) return entry[stat];
                    var next = levelTable[index + 1];
                    return entry[stat] + (next[stat] - entry[stat]) * ((level - entry.level) / (next.level - entry.level))
                }
            }
            return 1
        },

        getLevelForAverageStat: function (base) {
            for (var index = levelTable.length; index--;) {
                var entry = levelTable[index];
                if (entry.base <= base) {
                    var next = levelTable[index + 1];
                    return !next ? 99 : Math.round(entry.level + (next.level - entry.level) * ((base - entry.base) / (next.base - entry.base)))
                }
            }
            return 1
        },

        getFactor: function (fromLevel, toLevel, stat) {
            return this.getAverageStat(toLevel, stat) / this.getAverageStat(fromLevel, stat)
        },

        adaptParams: function (params, fromLevel, toLevel) {
            var baseFactor = this.getFactor(fromLevel, toLevel, "base"),
                hpFactor = this.getFactor(fromLevel, toLevel, "hp"),
                result = ig.copy(params);
            result.hp = Math.max(1, Math.round(result.hp * hpFactor));
            result.attack = Math.round(result.attack * baseFactor).limit(1, 999);
            result.defense = Math.round(result.defense * baseFactor).limit(1, 999);
            result.focus = Math.round(result.focus * baseFactor).limit(1, 999);
            return result
        },

        adaptCredits: function (credits, fromLevel, toLevel) {
            var factor = this.getFactor(fromLevel, toLevel, "credits");
            return Math.round(credits * factor)
        }
    }
});
ig.baked = !0;
