/**
 * game.feature.combat.combat-poi
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-poi")`.
 *
 * Combat "point of interest" filters: `sc.COMBAT_POI` (NAMED_ENTITY,
 * NAMED_ENTITIES, ACTIVE_ENEMIES) plus `sc.CombatPoI`, which resolves a
 * POI setting to the closest matching entity (optionally path-checked) for
 * enemy AI targeting.
 */
ig.module("game.feature.combat.combat-poi")
    .requires("game.feature.combat.model.combat-params")
    .defines(function () {

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

        getEntities: function (result, settings) {
            var name = ig.Event.getExpressionValue(settings.name);
            (name = ig.game.namedEntities[name]) && result.push(name)
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

        getEntities: function (result, settings) {
            var namePart = ig.Event.getExpressionValue(settings.namePart),
                name;
            for (name in ig.game.namedEntities) {
                var entity = ig.game.namedEntities[name];
                name.indexOf(namePart) != -1 && !entity._hidden && result.push(entity)
            }
        }
    };

    var selfModes = {
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
                    _select: selfModes,
                    _optional: true
                },
                allEnemies: {
                    _type: "Boolean",
                    _info: "If true, consider all enemies, not just active ones."
                }
            }
        },

        initSettings: function (settings) {
            settings.conditions && (settings.conditions = new sc.CombatConditions(settings.conditions));
            settings.self = selfModes[settings.self] || selfModes.ACCEPT
        },

        getEntities: function (result, settings, self) {
            var enemies = settings.allEnemies ? ig.game.getEntitiesByType(ig.ENTITY.Enemy) : sc.combat.activeCombatants[sc.COMBATANT_PARTY.ENEMY];
            for (var index = enemies.length, lastResort = null; index--;) {
                var enemy = enemies[index];
                if (enemy && !enemy.isDefeated() && !(settings.enemyTypes && settings.enemyTypes.indexOf(enemy.enemyName) == -1) && (!settings.conditions || settings.conditions.check(enemy, 0))) {
                    if (enemy == self) {
                        if (settings.self == selfModes.IGNORE) continue;
                        if (settings.self == selfModes.LAST_RESORT) {
                            lastResort = enemy;
                            continue
                        }
                    }
                    result.push(enemy)
                }
            }
            result.length == 0 && lastResort && result.push(lastResort)
        }
    };

    var poiResult = [],
        searchPos = Vec3.create();

    sc.CombatPoI = {
        initPoiFilter: function (settings) {
            if (!settings) return null;
            var filter = sc.COMBAT_POI[settings.type];
            filter && (filter.initSettings && !window.wm) && filter.initSettings(settings);
            return settings
        },

        getClosestPoI: function (settings, entity, radius, checkPath, preferFarther) {
            var filter = sc.COMBAT_POI[settings.type];
            if (!filter) return null;
            poiResult.length = 0;

            var candidates;
            if (filter.getEntities) {
                filter.getEntities(poiResult, settings, entity);
                candidates = poiResult
            } else if (filter.filterEntities) {
                var center = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, searchPos);
                center.z = center.z - 128;
                var nearby = ig.game.getEntitiesInCircle(center, radius, 1, 256);
                filter.filterEntities(poiResult, nearby, settings);
                candidates = poiResult
            }

            var closest = null,
                bestDistance = 0;
            for (var index = candidates.length; index--;) {
                var candidate = candidates[index];
                if (candidate) {
                    var distance = ig.CollTools.getGroundDistance(entity.coll, candidate.coll);
                    if (distance <= radius) {
                        preferFarther && (distance = radius - distance);
                        if (!closest || distance < bestDistance)
                            if (!checkPath || ig.navigation.isPathAvailable(entity, candidate)) {
                                closest = candidate;
                                bestDistance = distance
                            }
                    }
                }
            }
            return closest
        }
    }
});
ig.baked = !0;
