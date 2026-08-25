ig.module("game.feature.combat.combat-poi").requires("game.feature.combat.model.combat-params").defines(function() {
    sc.COMBAT_POI = {};
    sc.COMBAT_POI.NAMED_ENTITY = {
        _wm: {
            attributes: {
                name: {
                    _type: "StringExpression",
                    _info: "Name of entity to be searched"
                }
            }
        },
        getEntities: function(a, b) {
            var d = ig.Event.getExpressionValue(b.name);
            (d = ig.game.namedEntities[d]) && a.push(d)
        }
    };
    sc.COMBAT_POI.NAMED_ENTITIES = {
        _wm: {
            attributes: {
                namePart: {
                    _type: "StringExpression",
                    _info: "String included within name."
                }
            }
        },
        getEntities: function(a,
            b) {
            var d = ig.Event.getExpressionValue(b.namePart),
                g;
            for (g in ig.game.namedEntities) {
                var h = ig.game.namedEntities[g];
                g.indexOf(d) != -1 && !h._hidden && a.push(h)
            }
        }
    };
    var b = {
        ACCEPT: 1,
        IGNORE: 2,
        LAST_RESORT: 3
    };
    sc.COMBAT_POI.ACTIVE_ENEMIES = {
        _wm: {
            attributes: {
                enemyTypes: {
                    _type: "Array",
                    _info: "Types of enemy supported",
                    _sub: {
                        _type: "EnemySearch"
                    },
                    _optional: true
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Combat condition to further filter enemies",
                    _optional: true
                },
                self: {
                    _type: "String",
                    _info: "How to handle self enemy",
                    _select: b,
                    _optional: true
                },
                allEnemies: {
                    _type: "Boolean",
                    _info: "If true, consider all enemies, not just active ones."
                }
            }
        },
        initSettings: function(a) {
            a.conditions && (a.conditions = new sc.CombatConditions(a.conditions));
            a.self = b[a.self] || b.ACCEPT
        },
        getEntities: function(a, d, f) {
            var g;
            g = d.allEnemies ? ig.game.getEntitiesByType(ig.ENTITY.Enemy) : sc.combat.activeCombatants[sc.COMBATANT_PARTY.ENEMY];
            for (var h = g.length, i = null; h--;) {
                var j = g[h];
                if (j && !j.isDefeated() && !(d.enemyTypes && d.enemyTypes.indexOf(j.enemyName) == -1) &&
                    (!d.conditions || d.conditions.check(j, 0))) {
                    if (j == f) {
                        if (d.self == b.IGNORE) continue;
                        if (d.self == b.LAST_RESORT) {
                            i = j;
                            continue
                        }
                    }
                    a.push(j)
                }
            }
            a.length == 0 && i && a.push(i)
        }
    };
    var a = [],
        d = Vec3.create();
    sc.CombatPoI = {
        initPoiFilter: function(a) {
            if (!a) return null;
            var b = sc.COMBAT_POI[a.type];
            b && (b.initSettings && !window.wm) && b.initSettings(a);
            return a
        },
        getClosestPoI: function(b, e, f, g, h) {
            var i = sc.COMBAT_POI[b.type];
            if (!i) return null;
            a.length = 0;
            var j;
            if (i.getEntities) {
                i.getEntities(a, b, e);
                j = a
            } else if (i.filterEntities) {
                j = e.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM,
                    d);
                j.z = j.z - 128;
                j = ig.game.getEntitiesInCircle(j, f, 1, 256);
                i.filterEntities(a, j, b);
                j = a
            }
            for (var b = j.length, i = null, k = 0; b--;) {
                var l = j[b];
                if (l) {
                    var o = ig.CollTools.getGroundDistance(e.coll, l.coll);
                    if (o <= f) {
                        h && (o = f - o);
                        if (!i || o < k)
                            if (!g || ig.navigation.isPathAvailable(e, l)) {
                                i = l;
                                k = o
                            }
                    }
                }
            }
            return i
        }
    }
});
ig.baked = !0;
