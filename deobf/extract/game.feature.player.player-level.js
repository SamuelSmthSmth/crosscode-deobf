ig.module("game.feature.player.player-level").defines(function() {
    function b(a, b) {
        var c = b - a,
            e = 1;
        switch (c) {
            case -5:
                e = 0.01;
                break;
            case -4:
                e = 0.0625;
                break;
            case -3:
                e = 0.125;
                break;
            case -2:
                e = 0.25;
                break;
            case -1:
                e = 0.5;
                break;
            case 0:
                e = 1;
                break;
            case 1:
                e = 1.1;
                break;
            case 2:
                e = 1.3;
                break;
            case 3:
                e = 1.5;
                break;
            case 4:
                e = 1.7;
                break;
            case 5:
                e = 1.9;
                break;
            case 6:
                e = 2.1;
                break;
            case 7:
                e = 2.3;
                break;
            case 8:
                e = 2.5;
                break;
            default:
                e = c < 0 ? 0.01 : 2.5
        }
        return e
    }
    sc.LEVEL_CURVES = {
        REGULAR: {
            getFactor: function(a, d) {
                return b(a, d) * (100 / (99 + a))
            }
        },
        STATIC_REGULAR: {
            getFactor: function(a,
                d) {
                return b(a, d)
            },
            ignorePartyCount: true
        },
        QUEST: {
            getFactor: function(a, b) {
                if (a <= b) return 1;
                switch (b - a) {
                    case -1:
                        return 1;
                    case -2:
                        return 1;
                    case -3:
                        return 1;
                    case -4:
                        return 0.8;
                    case -5:
                        return 0.6;
                    case -6:
                        return 0.4;
                    case -7:
                        return 0.2;
                    case -8:
                        return 0.1;
                    default:
                        return 0.05
                }
            },
            ignorePartyCount: true
        }
    };
    sc.PlayerLevelTools = {
        computeBaseParams: function(a, b, c) {
            for (var e in b) {
                var f = b[e].base,
                    g = b[e].increase,
                    h = Math.sin(Math.PI * 2 * (c / 4 + b[e].variance)),
                    i, j;
                i = (Math.pow(1.25, c / 10) - 1) / (Math.pow(1.25, 10) - 1);
                j = Math.log(1.25) /
                    10 * Math.pow(1.25, c / 10) / (Math.pow(1.25, 10) - 1);
                j = j * g * 0.5;
                a[e] = f + Math.floor(g * i + h * j)
            }
        },
        computeExp: function(a, b, c, e, f, g) {
            g = g || sc.LEVEL_CURVES.REGULAR;
            b = g.getFactor(b, c);
            a = f ? 0 : Math.max(1, Math.floor(a * b * (e != void 0 ? e : 1)));
            return a = a * sc.newgame.getEXPMultiplier()
        },
        updateEquipStats: function(a, b, c) {
            for (var e in a)
                if (a[e] >= 0) {
                    var f = sc.inventory.getItem(a[e]),
                        g = f.params;
                    b.hp = b.hp + Math.floor(g.hp || 0);
                    b.attack = b.attack + Math.floor(g.attack || 0);
                    b.defense = b.defense + Math.floor(g.defense || 0);
                    b.focus = b.focus + Math.floor(g.focus ||
                        0);
                    if (g.elemFactor)
                        for (var h = 4; h--;) {
                            var i = Math.round(b.elemFactor[h] * 100) + Math.round((g.elemFactor[h] || 1) * 100 - 100);
                            b.elemFactor[h] = Math.min(sc.MAX_MOD_VAL, i) / 100
                        }
                    var f = f.properties,
                        j;
                    for (j in f)
                        if (sc.MODIFIERS[j])
                            if (c[j]) {
                                g = c[j];
                                g = Math.round(g * 100) + Math.round(f[j] * 100 - 100);
                                c[j] = Math.min(sc.MAX_MOD_VAL, g) / 100
                            } else c[j] = f[j]
                }
        },
        autoequip: function(a, b, c, e, f, g) {
            if (b) {
                for (var h = 0, i = 0; i < b.length; ++i)
                    if (b[i].level)
                        if (b[i].level <= c) h = i;
                        else break;
                for (i = h; i < b.length; ++i) {
                    h = b[i];
                    if (!g && h.condition && !h.condition.evaluate()) break;
                    if (h.level && h.level <= e) {
                        var c = h.level,
                            j;
                        for (j in sc.MENU_EQUIP_BODYPART) {
                            var k = sc.MENU_EQUIP_BODYPART[j],
                                l = h[j];
                            if (l) {
                                f && a.addItem(l, 1, true);
                                a.setEquipment(k, l)
                            }
                        }
                    } else if (h.level > e) break
                }
                return c
            }
        },
        equip: function(a, b, c) {
            var e;
            switch (b) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    e = a.head;
                    a.head = c;
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    e = a.leftArm;
                    a.leftArm = c;
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    e = a.rightArm;
                    a.rightArm = c;
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    e = a.torso;
                    a.torso = c;
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    e =
                        a.feet;
                    a.feet = c
            }
            return e
        }
    }
});
ig.baked = !0;
