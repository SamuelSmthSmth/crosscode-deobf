ig.module("game.feature.combat.model.enemy-level-scaling").defines(function() {
    var b = [{
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
        },
        {
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
        getAverageStat: function(a, d) {
            for (var a = a.limit(0, 99), c = b.length; c--;) {
                var e =
                    b[c];
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
        },
        getFactor: function(a, b, c) {
            return this.getAverageStat(b, c) / this.getAverageStat(a, c)
        },
        adaptParams: function(a, b, c) {
            var e = this.getFactor(b, c, "base"),
                b = this.getFactor(b, c, "hp"),
                a = ig.copy(a);
            a.hp = Math.max(1,
                Math.round(a.hp * b));
            a.attack = Math.round(a.attack * e).limit(1, 999);
            a.defense = Math.round(a.defense * e).limit(1, 999);
            a.focus = Math.round(a.focus * e).limit(1, 999);
            return a
        },
        adaptCredits: function(a, b, c) {
            b = this.getFactor(b, c, "credits");
            return Math.round(a * b)
        }
    }
});
ig.baked = !0;
