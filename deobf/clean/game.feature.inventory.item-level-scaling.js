/**
 * @module game.feature.inventory.item-level-scaling
 *
 * Item stat scaling by level. Provides a level table (with base stat and HP
 * values every 5 levels) and helpers to adapt item parameters to a target
 * level, interpolating linearly between table entries.
 */
ig.module("game.feature.inventory.item-level-scaling").defines(function() {
    var LEVEL_TABLE = [{
            level: 1,
            base: 20,
            hp: 205
        }, {
            level: 6,
            base: 23,
            hp: 234
        }, {
            level: 11,
            base: 26,
            hp: 266
        }, {
            level: 16,
            base: 30,
            hp: 303
        }, {
            level: 21,
            base: 34,
            hp: 343
        }, {
            level: 26,
            base: 38,
            hp: 389
        }, {
            level: 31,
            base: 43,
            hp: 439
        }, {
            level: 36,
            base: 49,
            hp: 496
        }, {
            level: 41,
            base: 56,
            hp: 560
        }, {
            level: 46,
            base: 63,
            hp: 630
        }, {
            level: 51,
            base: 71,
            hp: 710
        }, {
            level: 56,
            base: 79,
            hp: 798
        }, {
            level: 61,
            base: 89,
            hp: 897
        }, {
            level: 66,
            base: 100,
            hp: 1008
        }, {
            level: 71,
            base: 113,
            hp: 1132
        }, {
            level: 76,
            base: 127,
            hp: 1270
        },
        {
            level: 81,
            base: 142,
            hp: 1425
        }, {
            level: 86,
            base: 159,
            hp: 1598
        }, {
            level: 91,
            base: 179,
            hp: 1792
        }, {
            level: 96,
            base: 200,
            hp: 2008
        }, {
            level: 99,
            base: 215,
            hp: 2150
        }
    ];
    sc.ItemLevelScaling = {
        adaptParams: function(params, fromLevel, toLevel) {
            var params = ig.copy(params),
                baseFactor = this.getFactor(fromLevel, toLevel, "base"),
                hpFactor = this.getFactor(fromLevel, toLevel, "hp");
            params.hp && (params.hp = Math.max(1, Math.round(params.hp * hpFactor)));
            params.attack && (params.attack = Math.round(params.attack * baseFactor).limit(0, 999));
            params.defense && (params.defense = Math.round(params.defense * baseFactor).limit(0, 999));
            params.focus && (params.focus = Math.round(params.focus * baseFactor).limit(0, 999));
            return params
        },
        getFactor: function(fromLevel,
            toLevel, statName) {
            return this.getAverageStat(toLevel, statName) / this.getAverageStat(fromLevel, statName)
        },
        getAverageStat: function(level, statName) {
            for (var level = level.limit(0, 99), i = LEVEL_TABLE.length; i--;) {
                var entry = LEVEL_TABLE[i];
                if (entry.level <= level) {
                    if (entry.level == level) return entry[statName];
                    var nextEntry = LEVEL_TABLE[i + 1];
                    return entry[statName] + (nextEntry[statName] - entry[statName]) * ((level - entry.level) / (nextEntry.level - entry.level))
                }
            }
            return 1
        },
        getLevelForAverageStat: function(baseStat) {
            for (var i = LEVEL_TABLE.length; i--;) {
                var entry = LEVEL_TABLE[i];
                if (entry.base <= baseStat) {
                    var nextEntry = LEVEL_TABLE[i + 1];
                    return !nextEntry ? 99 : Math.round(entry.level + (nextEntry.level - entry.level) * ((baseStat - entry.base) / (nextEntry.base - entry.base)))
                }
            }
            return 1
        }
    }
});
ig.baked = !0;
