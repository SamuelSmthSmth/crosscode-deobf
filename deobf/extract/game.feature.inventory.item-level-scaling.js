ig.module("game.feature.inventory.item-level-scaling").defines(function() {
    var b = [{
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
        adaptParams: function(a, b, c) {
            var a = ig.copy(a),
                e = this.getFactor(b, c, "base"),
                b = this.getFactor(b, c, "hp");
            a.hp && (a.hp = Math.max(1, Math.round(a.hp * b)));
            a.attack && (a.attack = Math.round(a.attack * e).limit(0, 999));
            a.defense && (a.defense = Math.round(a.defense * e).limit(0, 999));
            a.focus && (a.focus = Math.round(a.focus * e).limit(0, 999));
            return a
        },
        getFactor: function(a,
            b, c) {
            return this.getAverageStat(b, c) / this.getAverageStat(a, c)
        },
        getAverageStat: function(a, d) {
            for (var a = a.limit(0, 99), c = b.length; c--;) {
                var e = b[c];
                if (e.level <= a) {
                    if (e.level == a) return e[d];
                    c = b[c + 1];
                    return e[d] + (c[d] - e[d]) * ((a - e.level) / (c.level - e.level))
                }
            }
            return 1
        },
        getLevelForAverageStat: function(a) {
            for (var d = b.length; d--;) {
                var c = b[d];
                if (c.base <= a) {
                    d = b[d + 1];
                    return !d ? 99 : Math.round(c.level + (d.level - c.level) * ((a - c.base) / (d.base - c.base)))
                }
            }
            return 1
        }
    }
});
ig.baked = !0;
