/**
 * game.feature.player.player-level
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.player-level")`.
 *
 * Leveling math: `sc.LEVEL_CURVES` (EXP multipliers by level difference,
 * with REGULAR / STATIC_REGULAR / QUEST variants) and `sc.PlayerLevelTools`
 * (base-param computation with growth curves, EXP computation, equipment
 * stat merging, autoequip and single-piece equip helpers).
 */
ig.module("game.feature.player.player-level").defines(function () {

    /** EXP multiplier for a given level difference (target - current). */
    function getLevelFactor(currentLevel, targetLevel) {
        var diff = targetLevel - currentLevel,
            factor = 1;
        switch (diff) {
            case -5:
                factor = 0.01;
                break;
            case -4:
                factor = 0.0625;
                break;
            case -3:
                factor = 0.125;
                break;
            case -2:
                factor = 0.25;
                break;
            case -1:
                factor = 0.5;
                break;
            case 0:
                factor = 1;
                break;
            case 1:
                factor = 1.1;
                break;
            case 2:
                factor = 1.3;
                break;
            case 3:
                factor = 1.5;
                break;
            case 4:
                factor = 1.7;
                break;
            case 5:
                factor = 1.9;
                break;
            case 6:
                factor = 2.1;
                break;
            case 7:
                factor = 2.3;
                break;
            case 8:
                factor = 2.5;
                break;
            default:
                factor = diff < 0 ? 0.01 : 2.5
        }
        return factor
    }

    sc.LEVEL_CURVES = {
        REGULAR: {
            getFactor: function (currentLevel, targetLevel) {
                return getLevelFactor(currentLevel, targetLevel) * (100 / (99 + currentLevel))
            }
        },
        STATIC_REGULAR: {
            getFactor: function (currentLevel, targetLevel) {
                return getLevelFactor(currentLevel, targetLevel)
            },
            ignorePartyCount: true
        },
        QUEST: {
            getFactor: function (currentLevel, targetLevel) {
                if (currentLevel <= targetLevel) return 1;
                switch (targetLevel - currentLevel) {
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
        /** Fill params with per-level values derived from base/increase/variance factor tables. */
        computeBaseParams: function (params, levelFactors, level) {
            for (var key in levelFactors) {
                var base = levelFactors[key].base,
                    increase = levelFactors[key].increase,
                    wave = Math.sin(Math.PI * 2 * (level / 4 + levelFactors[key].variance)),
                    growthFactor, varianceFactor;
                growthFactor = (Math.pow(1.25, level / 10) - 1) / (Math.pow(1.25, 10) - 1);
                varianceFactor = Math.log(1.25) / 10 * Math.pow(1.25, level / 10) / (Math.pow(1.25, 10) - 1);
                varianceFactor = varianceFactor * increase * 0.5;
                params[key] = base + Math.floor(increase * growthFactor + wave * varianceFactor)
            }
        },

        computeExp: function (baseExp, currentLevel, targetLevel, partyFactor, zeroExp, curve) {
            curve = curve || sc.LEVEL_CURVES.REGULAR;
            var factor = curve.getFactor(currentLevel, targetLevel);
            baseExp = zeroExp ? 0 : Math.max(1, Math.floor(baseExp * factor * (partyFactor != void 0 ? partyFactor : 1)));
            return baseExp = baseExp * sc.newgame.getEXPMultiplier()
        },

        /** Merge equipment item stats (and modifiers) into the player's params/modifiers. */
        updateEquipStats: function (equipment, params, modifiers) {
            for (var bodypart in equipment)
                if (equipment[bodypart] >= 0) {
                    var item = sc.inventory.getItem(equipment[bodypart]),
                        itemParams = item.params;
                    params.hp = params.hp + Math.floor(itemParams.hp || 0);
                    params.attack = params.attack + Math.floor(itemParams.attack || 0);
                    params.defense = params.defense + Math.floor(itemParams.defense || 0);
                    params.focus = params.focus + Math.floor(itemParams.focus || 0);
                    if (itemParams.elemFactor)
                        for (var element = 4; element--;) {
                            var elementSum = Math.round(params.elemFactor[element] * 100) + Math.round((itemParams.elemFactor[element] || 1) * 100 - 100);
                            params.elemFactor[element] = Math.min(sc.MAX_MOD_VAL, elementSum) / 100
                        }
                    var itemProps = item.properties,
                        modifier;
                    for (modifier in itemProps)
                        if (sc.MODIFIERS[modifier])
                            if (modifiers[modifier]) {
                                var modifierSum = modifiers[modifier];
                                modifierSum = Math.round(modifierSum * 100) + Math.round(itemProps[modifier] * 100 - 100);
                                modifiers[modifier] = Math.min(sc.MAX_MOD_VAL, modifierSum) / 100
                            } else modifiers[modifier] = itemProps[modifier]
                }
        },

        /** Walk the autoequip list and equip every item whose level requirement is met. */
        autoequip: function (player, equipList, minLevel, maxLevel, giveItems, ignoreConditions) {
            if (equipList) {
                for (var equipIndex = 0, index = 0; index < equipList.length; ++index)
                    if (equipList[index].level)
                        if (equipList[index].level <= minLevel) equipIndex = index;
                        else break;
                for (index = equipIndex; index < equipList.length; ++index) {
                    var entry = equipList[index];
                    if (!ignoreConditions && entry.condition && !entry.condition.evaluate()) break;
                    if (entry.level && entry.level <= maxLevel) {
                        var minLevel = entry.level,
                            bodypart;
                        for (bodypart in sc.MENU_EQUIP_BODYPART) {
                            var bodypartKey = sc.MENU_EQUIP_BODYPART[bodypart],
                                itemId = entry[bodypart];
                            if (itemId) {
                                giveItems && player.addItem(itemId, 1, true);
                                player.setEquipment(bodypartKey, itemId)
                            }
                        }
                    } else if (entry.level > maxLevel) break
                }
                return minLevel
            }
        },

        /** Equip itemId on the given bodypart; returns the previously equipped item. */
        equip: function (player, bodypart, itemId) {
            var oldItem;
            switch (bodypart) {
                case sc.MENU_EQUIP_BODYPART.HEAD:
                    oldItem = player.head;
                    player.head = itemId;
                    break;
                case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                    oldItem = player.leftArm;
                    player.leftArm = itemId;
                    break;
                case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                    oldItem = player.rightArm;
                    player.rightArm = itemId;
                    break;
                case sc.MENU_EQUIP_BODYPART.TORSO:
                    oldItem = player.torso;
                    player.torso = itemId;
                    break;
                case sc.MENU_EQUIP_BODYPART.FEET:
                    oldItem = player.feet;
                    player.feet = itemId
            }
            return oldItem
        }
    }
});
ig.baked = !0;
