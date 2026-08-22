/**
 * game.feature.combat.combat-event-steps
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-event-steps")`.
 *
 * The combat `ig.EVENT_STEP.*` classes used in event/cutscene scripts:
 * spawn/kill/swap enemies, set targets & states, HP/SP manipulation, PvP
 * battle control, respawn points, `COMBAT_IF` branching, and proxy removal.
 * Also extends `ig.FX_FIRST/SECOND_TARGET_OPTION` with enemy/proxy targets.
 */
ig.module("game.feature.combat.combat-event-steps")
    .requires("impact.base.animation", "impact.base.action", "impact.base.entity", "game.feature.combat.entities.drop", "game.feature.combat.entities.combatant", "game.feature.combat.entities.combat-proxy", "impact.feature.effect.effect-steps")
    .defines(function () {

    ig.FX_FIRST_TARGET_OPTION.PROXY_OWNER = function (proxy) {
        return proxy.combatant
    };
    ig.FX_FIRST_TARGET_OPTION.PROXY_SRC = function (proxy) {
        return proxy.sourceEntity
    };
    ig.FX_FIRST_TARGET_OPTION.OWNER_ENEMY = function (entity) {
        return entity.ownerEnemy
    };
    ig.FX_SECOND_TARGET_OPTION.PROXY_OWNER = function (effect, proxy) {
        effect.target2 = proxy.combatant
    };
    ig.FX_SECOND_TARGET_OPTION.PROXY_SRC = function (effect, proxy) {
        effect.target2 = proxy.sourceEntity
    };
    ig.FX_SECOND_TARGET_OPTION.OWNER_ENEMY = function (effect, entity) {
        effect.target2 = entity.ownerEnemy
    };

    var tmpVec3 = Vec3.create();
    var tmpVec2 = Vec2.create();

    ig.EVENT_STEP.SPAWN_ENEMY = ig.EventStepBase.extend({
        position: null,
        enemyInfo: null,
        enemyType: null,
        targetPlayer: false,
        name: null,
        noEffects: false,
        _wm: new ig.Config({
            attributes: {
                position: {
                    _type: "Vec3",
                    _info: "Point to navigate to",
                    _visualize: true,
                    _pointSelect: true
                },
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy information",
                    _popup: true
                },
                targetPlayer: {
                    _type: "Boolean",
                    _info: "If true, automatically target player"
                },
                name: {
                    _type: "StringExpression",
                    _info: "Name of the enemy to access via action",
                    _optional: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn and despawn",
                    _popup: true,
                    _optional: true
                },
                startAction: {
                    _type: "Action",
                    _info: "Action that is immediately performed on enemy",
                    _rec_visualize: ig.ACTION_STEP,
                    _optional: true,
                    _popup: true
                },
                noEffects: {
                    _type: "Boolean",
                    _info: "If true: Do not show appear effect."
                }
            }
        }),
        init: function (data) {
            this.position = data.position;
            if (data.enemyInfo) this.enemyInfo = new sc.EnemyInfo(data.enemyInfo);
            this.targetPlayer = data.targetPlayer || false;
            this.name = data.name || null;
            this.spawnCondition = data.spawnCondition || null;
            this.noEffects = data.noEffects || false;
            if (data.startAction) this.startAction = new ig.Action("[GENERIC]", data.startAction, false)
        },
        clearCached: function () {
            this.enemyInfo && this.enemyInfo.clearCached();
            this.startAction && this.startAction.clearCached()
        },
        start: function () {
            var pos = ig.Event.getVec3(this.position, tmpVec3);
            var enemy = ig.game.spawnEntity(ig.ENTITY.Enemy, pos.x - this.enemyInfo.enemyType.size.x / 2, pos.y - this.enemyInfo.enemyType.size.y / 2, pos.z, {
                enemyInfo: this.enemyInfo.getSettings(),
                name: ig.Event.getExpressionValue(this.name),
                spawnCondition: this.spawnCondition
            }, !this.noEffects);
            this.targetPlayer && enemy.setTarget(ig.game.playerEntity, true);
            this.startAction && enemy.setAction(this.startAction)
        }
    });

    ig.EVENT_STEP.SPAWN_DESTRUCTIBLE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                position: {
                    _type: "Vec3",
                    _info: "spawn point",
                    _visualize: true,
                    _pointSelect: true
                },
                desType: {
                    _type: "String",
                    _info: "Type of destructible object",
                    _select: sc.DESTRUCTIBLE_TYPE,
                    _withNull: true
                },
                onDestructIncrease: {
                    _type: "VarName",
                    _info: "Variable to increase by one when destroyed",
                    _optional: true
                },
                onPreDestructIncrease: {
                    _type: "VarName",
                    _info: "Variable to increase by one when destroyed",
                    _optional: true
                },
                effect: {
                    _type: "Effect",
                    _info: "Optional Effect",
                    _optional: true,
                    _popup: true
                }
            }
        }),
        init: function (data) {
            this.position = data.position;
            this.desType = data.desType;
            this.onDestructIncrease = data.onDestructIncrease;
            this.onPreDestructIncrease = data.onPreDestructIncrease;
            if (data.effect) this.effect = new ig.EffectHandle(data.effect)
        },
        start: function () {
            var pos = ig.Event.getVec3(this.position, tmpVec3);
            var destructible = ig.game.spawnEntity(ig.ENTITY.Destructible, pos.x - 12, pos.y - 12, pos.z, {
                desType: this.desType,
                permaDestruct: false,
                blockNavMap: true,
                onDestructIncrease: this.onDestructIncrease,
                onPreDestructIncrease: this.onPreDestructIncrease
            }, false);
            this.effect && this.effect.spawnOnTarget(destructible)
        }
    });

    ig.EVENT_STEP.SPAWN_ENEMY_ON_ENTITY = ig.EventStepBase.extend({
        entity: null,
        enemyInfo: null,
        enemyType: null,
        targetPlayer: false,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to spawn enemy on"
                },
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy information",
                    _popup: true
                },
                targetPlayer: {
                    _type: "Boolean",
                    _info: "If true, automatically target player"
                },
                name: {
                    _type: "StringExpression",
                    _info: "Name of the enemy to access via action",
                    _optional: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn and despawn",
                    _popup: true,
                    _optional: true
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity;
            if (data.enemyInfo) this.enemyInfo = new sc.EnemyInfo(data.enemyInfo);
            this.targetPlayer = data.targetPlayer || false;
            this.name = data.name || null;
            this.spawnCondition = data.spawnCondition || null
        },
        clearCached: function () {
            this.enemyInfo && this.enemyInfo.clearCached()
        },
        start: function (data, source) {
            var host = ig.Event.getEntity(this.entity, source),
                hostPos = host.coll.pos,
                hostSize = host.coll.size,
                enemy = ig.game.spawnEntity(ig.ENTITY.Enemy, hostPos.x + hostSize.x / 2 - this.enemyInfo.enemyType.size.x / 2, hostPos.y + hostSize.y / 2 - this.enemyInfo.enemyType.size.y / 2, hostPos.z, {
                    enemyInfo: this.enemyInfo.getSettings(),
                    name: ig.Event.getExpressionValue(this.name),
                    spawnCondition: this.spawnCondition
                }, true);
            this.targetPlayer && enemy.setTarget(ig.game.playerEntity, true)
        }
    });

    ig.EVENT_STEP.SET_DAMAGE_NUMBERS = ig.EventStepBase.extend({
        visibility: false,
        _wm: new ig.Config({
            attributes: {
                visibility: {
                    _type: "Boolean",
                    _info: "If false, hide damage nummbers. Will be cleared on level change."
                }
            }
        }),
        init: function (data) {
            this.visibility = data.visibility
        },
        start: function () {
            sc.combat.hideDamageNumbers = !this.visibility
        }
    });

    ig.EVENT_STEP.KILL_ENEMIES = ig.EventStepBase.extend({
        enemyType: null,
        noRumble: false,
        _wm: new ig.Config({
            attributes: {
                enemyType: {
                    _type: "String",
                    _info: "If provided: only remove enemy of this type",
                    _optional: true,
                    _select: "enemies"
                },
                noRumble: {
                    _type: "Boolean",
                    _info: "If true, do not rumble screen on enemy kill",
                    _optional: true,
                    _default: "true"
                }
            }
        }),
        init: function (data) {
            this.enemyType = data.enemyType;
            this.noRumble = data.noRumble
        },
        start: function () {
            sc.combat.removeEnemies(this.enemyType, null, this.noRumble, true)
        }
    });

    ig.EVENT_STEP.SET_ENEMY_STATE = ig.EventStepBase.extend({
        enemy: 0,
        enemyState: 0,
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "Actor",
                    _info: "Enemy to change",
                    _context: "Entity"
                },
                enemyState: {
                    _type: "EnemyState",
                    _info: "State of Enemy to switch to"
                }
            }
        }),
        init: function (data) {
            this.enemy = data.enemy;
            this.enemyState = data.enemyState
        },
        start: function (data, source) {
            var enemy = ig.Event.getEntity(this.enemy, source);
            enemy && enemy.changeState(this.enemyState, true)
        }
    });

    ig.EVENT_STEP.SET_ENEMY_TARGET = ig.EventStepBase.extend({
        enemy: 0,
        target: 0,
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "Actor",
                    _info: "Enemy to change",
                    _context: "Entity"
                },
                target: {
                    _type: "Entity",
                    _info: "Entity to target",
                    _withNull: true
                }
            }
        }),
        init: function (data) {
            this.enemy = data.enemy;
            this.target = data.target
        },
        start: function (data, source) {
            var enemy = ig.Event.getEntity(this.enemy, source),
                target = ig.Event.getEntity(this.target, source);
            enemy && enemy.setTarget(target, true)
        }
    });

    ig.EVENT_STEP.SET_SCREEN_ENEMY_TARGET = ig.EventStepBase.extend({
        target: 0,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Entity",
                    _info: "Entity to target",
                    _withNull: true
                }
            }
        }),
        init: function (data) {
            this.target = data.target
        },
        start: function (data, source) {
            var target = ig.Event.getEntity(this.target, source);
            sc.combat.setScreenEnemiesTarget(target)
        }
    });

    ig.EVENT_STEP.SET_ALL_ENEMY_TARGET = ig.EventStepBase.extend({
        target: 0,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Entity",
                    _info: "Entity to target",
                    _withNull: true
                }
            }
        }),
        init: function (data) {
            this.target = data.target
        },
        start: function (data, source) {
            var target = ig.Event.getEntity(this.target, source);
            for (var entities = ig.game.entities, i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.Enemy && entity.setTarget(target, true)
            }
        }
    });

    ig.EVENT_STEP.REMOVE_ALL_ENEMY_TARGET = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {
            for (var entities = ig.game.entities, i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.Enemy && entity.setTarget(null, true)
            }
        }
    });

    ig.EVENT_STEP.RESET_SP = ig.EventStepBase.extend({
        target: 0,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Entity",
                    _info: "Entity to target",
                    _withNull: true
                },
                sp: {
                    _type: "Number",
                    _info: "How much SP to reset. 0.5=50%"
                }
            }
        }),
        init: function (data) {
            this.target = data.target;
            this.sp = data.sp
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.target, source);
            entity && entity.params && entity.params.setRelativeSp(this.sp)
        }
    });

    ig.EVENT_STEP.SET_RELATIVE_HP = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Entity",
                    _info: "Entity to set HP of"
                },
                value: {
                    _type: "Number",
                    _info: "Relative amount of HP entity should have. 1= FULL HP"
                }
            }
        }),
        init: function (data) {
            this.target = data.target;
            this.value = data.value
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.target, source);
            entity && entity.params && entity.params.setRelativeHp(this.value)
        }
    });

    ig.EVENT_STEP.REGEN_HP = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Entity",
                    _info: "Entity to target"
                },
                value: {
                    _type: "Number",
                    _info: "Relative amount of HP to regen. 1= FULL HP"
                },
                showNumbers: {
                    _type: "Boolean",
                    _info: "if true: do not show healing numbers"
                }
            }
        }),
        init: function (data) {
            this.value = {
                value: data.value
            };
            this.target = data.target;
            this.showNumbers = data.showNumbers
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.target, source);
            entity && entity.params && entity.heal(this.value, !this.showNumbers)
        }
    });

    ig.EVENT_STEP.SET_TYPED_ENEMY_TARGET = ig.EventStepBase.extend({
        target: 0,
        _wm: new ig.Config({
            attributes: {
                enemyType: {
                    _type: "String",
                    _info: "Type of enemy",
                    _select: "enemies"
                },
                target: {
                    _type: "Entity",
                    _info: "Entity to target",
                    _withNull: true
                }
            }
        }),
        init: function (data) {
            this.enemyType = data.enemyType;
            this.target = data.target
        },
        start: function (data, source) {
            var target = ig.Event.getEntity(this.target, source);
            for (var entities = ig.game.shownEntities, i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.Enemy && entity.enemyName == this.enemyType && entity.setTarget(target, true)
            }
        }
    });

    ig.EVENT_STEP.SET_ENEMIES_NAV_TOLERANT = ig.EventStepBase.extend({
        target: 0,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function (data) {
            this.enemyType = data.enemyType;
            this.target = data.target
        },
        start: function (data, source) {
            var target = ig.Event.getEntity(this.target, source);
            for (var entities = ig.game.shownEntities, i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.Enemy && entity.enemyName == this.enemyType && entity.setTarget(target, true)
            }
        }
    });

    ig.EVENT_STEP.SET_FINAL_DRAMATIC_EFFECT = ig.EventStepBase.extend({
        effectType: null,
        _wm: new ig.Config({
            attributes: {
                effectType: {
                    _type: "String",
                    _info: "Type of dramatic effect",
                    _select: sc.DRAMATIC_EFFECT,
                    _withNull: true
                }
            }
        }),
        init: function (data) {
            this.effectType = sc.DRAMATIC_EFFECT[data.effectType] || null
        },
        start: function () {
            sc.combat.setFinalDramaticEffect(this.effectType)
        }
    });

    ig.EVENT_STEP.SET_COMBAT_SPEED = ig.EventStepBase.extend({
        speed: 0,
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "Number",
                    _info: "Speed of combat, will scale frequency of enemy attacks",
                    _default: 1
                }
            }
        }),
        init: function (data) {
            this.speed = data.speed || 0
        },
        start: function () {
            sc.combat.setCombatSpeed(this.speed)
        }
    });

    ig.EVENT_STEP.MASS_REPLACE_ENTITIES_WITH_ENEMY = ig.EventStepBase.extend({
        regExp: null,
        spawnEnemyInfo: null,
        enemyType: null,
        target: null,
        _wm: new ig.Config({
            attributes: {
                regExp: {
                    _type: "String",
                    _info: "Regular Expression used on entityName to find entities"
                },
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy type to swap with entities",
                    _popup: true
                },
                target: {
                    _type: "Entity",
                    _info: "Set enemy target when spawned",
                    _optional: true
                }
            }
        }),
        init: function (data) {
            this.regExp = RegExp(data.regExp);
            this.enemyInfo = new sc.EnemyInfo(data.enemyInfo);
            this.target = data.target
        },
        clearCached: function () {
            this.enemyInfo && this.enemyInfo.clearCached()
        },
        start: function (data, source) {
            var target = this.target && ig.Event.getEntity(this.target, source);
            for (var entities = ig.game.shownEntities, i = entities.length; i--;) {
                var entity = entities[i];
                if (entity && entity.name && this.regExp.test(entity.name)) {
                    var enemy = ig.game.spawnEntity("Enemy", entity.coll.pos.x, entity.coll.pos.y, entity.coll.pos.z, {
                            enemyInfo: this.enemyInfo.getSettings()
                        }),
                        center = entity.getCenter(tmpVec2);
                    enemy.setPos(center.x - enemy.coll.size.x / 2, center.y - enemy.coll.size.y / 2, enemy.coll.pos.z);
                    entity.face && Vec2.assign(enemy.face, entity.face);
                    entity.kill();
                    enemy.initAnimations(true);
                    target && enemy.setTarget(target, true)
                }
            }
        }
    });

    ig.EVENT_STEP.SWAP_ENTITY_WITH_ENEMY = ig.EventStepBase.extend({
        entity: null,
        spawnEnemyInfo: null,
        enemyType: null,
        manualKill: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to swap with enemy",
                    _context: "Entity"
                },
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy to swap with entity",
                    _popup: true
                },
                manualKill: {
                    _type: "VarName",
                    _info: "Instead of killing the enemy, set specified variable to true.",
                    _optional: true
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity;
            this.enemyInfo = new sc.EnemyInfo(data.enemyInfo);
            this.manualKill = data.manualKill || null
        },
        clearCached: function () {
            this.enemyInfo && this.enemyInfo.clearCached()
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.entity, source);
            if (entity) {
                var enemy = ig.game.spawnEntity("Enemy", entity.coll.pos.x, entity.coll.pos.y, entity.coll.pos.z, {
                        enemyInfo: this.enemyInfo.getSettings(),
                        name: entity.name + "_EnemySwap",
                        manualKill: this.manualKill
                    }),
                    center = entity.getCenter(tmpVec2);
                enemy.setPos(center.x - enemy.coll.size.x / 2, center.y - enemy.coll.size.y / 2, enemy.coll.pos.z);
                entity.face && Vec2.assign(enemy.face, entity.face);
                entity.hide();
                ig.game.swapNamedEntities(entity, enemy);
                enemy.initAnimations(true)
            }
        }
    });

    ig.EVENT_STEP.SWAP_BACK_ENEMY_WITH_ENTITY = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to swap with enemy",
                    _context: "Entity"
                },
                expCollect: {
                    _type: "Boolean",
                    _info: "Manually kill enemy, collecting EXP etc."
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity;
            this.expCollect = data.expCollect
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.entity, source),
                enemy = ig.game.getEntityByName(entity.name + "_EnemySwap");
            if (enemy && entity) {
                var center = entity.getCenter(tmpVec2);
                ig.game.swapNamedEntities(enemy, entity);
                enemy.setPos(center.x - enemy.coll.size.x / 2, center.y - enemy.coll.size.y / 2, entity.coll.pos.z);
                enemy.face && Vec2.assign(enemy.face, entity.face);
                this.expCollect ? entity.doManualKill() : entity.kill();
                enemy.show()
            }
        }
    });

    ig.EVENT_STEP.SET_COMBAT_ACTIVE = ig.EventStepBase.extend({
        active: false,
        _wm: new ig.Config({
            attributes: {
                active: {
                    _type: "Boolean",
                    _info: "Activity status of combat"
                }
            }
        }),
        init: function (data) {
            this.active = data.active
        },
        start: function () {
            sc.combat.setActive(this.active)
        }
    });

    ig.EVENT_STEP.DO_ENEMY_ACTION = ig.EventStepBase.extend({
        enemy: null,
        actionName: null,
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "Actor",
                    _info: "Enemy to change",
                    _context: "Entity"
                },
                actionName: {
                    _type: "String",
                    _info: "Name of action to perform"
                },
                noStateReset: {
                    _type: "Boolean",
                    _info: "If true, do not reset state before switching to action. Also keeps actionAttached!"
                }
            }
        }),
        init: function (data) {
            this.enemy = data.enemy;
            this.actionName = data.actionName;
            this.noStateReset = data.noStateReset || false
        },
        start: function (data, source) {
            var enemy = ig.Event.getEntity(this.enemy, source);
            enemy && enemy.doEnemyAction && enemy.doEnemyAction(this.actionName, this.noStateReset)
        }
    });

    var COMBAT_STAT_TYPES = {
        RELATIVE_HP: {},
        CURRENT_HP: {},
        MAX_HP: {
            stat: "hp"
        },
        ATTACK: {
            stat: "attack"
        },
        DEFENSE: {
            stat: "defense"
        },
        FOCUS: {
            stat: "focus"
        }
    };

    ig.EVENT_STEP.SET_VAR_COMBAT_STAT = ig.EventStepBase.extend({
        varName: null,
        stat: null,
        entity: null,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to store relative hp in"
                },
                entity: {
                    _type: "Entity",
                    _info: "Combatant of which to fetch stat"
                },
                stat: {
                    _type: "String",
                    _info: "Type of Stat",
                    _select: COMBAT_STAT_TYPES
                }
            }
        }),
        init: function (data) {
            this.varName = data.varName;
            this.entity = data.entity;
            this.stat = COMBAT_STAT_TYPES[data.stat] || COMBAT_STAT_TYPES.RELATIVE_HP
        },
        start: function (data, source) {
            var varName = ig.Event.getVarName(this.varName);
            if (varName) {
                var entity = ig.Event.getEntity(this.entity, source);
                if (entity && entity.isCombatant) {
                    var value;
                    if (this.stat.stat) value = entity.params.getStat(this.stat.stat);
                    else if (this.stat == COMBAT_STAT_TYPES.RELATIVE_HP) value = entity.params.getHpFactor();
                    else if (this.stat == COMBAT_STAT_TYPES.CURRENT_HP) value = entity.params.currentHp;
                    ig.vars.set(varName, value)
                }
            } else ig.log("SET_VAR_TIME: Variable Name is not a String!")
        }
    });

    ig.EVENT_STEP.MANUAL_COMBATANT_KILL = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Combatant to manually kill"
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.entity, source);
            entity && entity.isCombatant && entity.doManualKill()
        }
    });

    ig.EVENT_STEP.MANUAL_COMBATANT_REVIVE = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Combatant to manually revive",
                    _context: "Entity"
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.entity, source);
            entity && entity.isCombatant && entity.doManualRevive(1)
        }
    });

    ig.EVENT_STEP.SET_COMBATANT_MANUAL_KILL = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Combatant to set manual kill variable to",
                    _context: "Entity"
                },
                varName: {
                    _type: "VarName",
                    _info: "Variable to set to true when combatant is killed"
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity;
            this.varName = data.varName
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.entity, source);
            if (entity && entity.isCombatant) entity.manualKill = this.varName
        }
    });

    ig.EVENT_STEP.START_PVP_BATTLE = ig.EventStepBase.extend({
        winPoints: 0,
        entity: null,
        _wm: new ig.Config({
            attributes: {
                winPoints: {
                    _type: "Integer",
                    _info: "Number of points to win PVP battle"
                },
                enemies: {
                    _type: "Array",
                    _info: "List of all enemies that participate in battle",
                    _sub: {
                        _type: "Entity"
                    }
                }
            }
        }),
        init: function (data) {
            this.winPoints = data.winPoints;
            this.enemies = data.enemies
        },
        start: function (data, source) {
            var enemies = [];
            for (var i = 0; i < this.enemies.length; i++) enemies.push(ig.Event.getEntity(this.enemies[i], source));
            sc.pvp.start(this.winPoints, enemies)
        }
    });

    ig.EVENT_STEP.PREPARE_PVP_ROUND = ig.EventStepBase.extend({
        autoContinue: false,
        _wm: new ig.Config({
            attributes: {
                autoContinue: {
                    _type: "Boolean",
                    _info: "If true, automatically stop preparation"
                }
            }
        }),
        init: function (data) {
            this.autoContinue = data.autoContinue || false
        },
        start: function () {
            sc.pvp.startNextRound(this.autoContinue)
        },
        run: function () {
            return !this.autoContinue || !sc.pvp.blocking
        }
    });

    ig.EVENT_STEP.START_PVP_ROUND = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {
            sc.pvp.finalizeRoundStart()
        }
    });

    ig.EVENT_STEP.STOP_PVP_BATTLE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {
            sc.pvp.stop()
        }
    });

    ig.EVENT_STEP.SET_RESPAWN_POINT = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Actor",
                    _info: "Entity to change",
                    _context: "Entity"
                },
                marker: {
                    _type: "Entity",
                    _info: "marker Entity to take position from"
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity;
            this.marker = data.marker
        },
        start: function (data, source) {
            var entity = ig.Event.getEntity(this.entity, source),
                marker = ig.Event.getEntity(this.marker, source);
            if (entity && marker) {
                Vec3.assign(entity.respawn.pos, marker.coll.pos);
                Vec2.addMulF(entity.respawn.pos, marker.coll.size, 0.5);
                Vec2.addMulF(entity.respawn.pos, entity.coll.size, -0.5)
            }
        }
    });

    ig.EVENT_STEP.COMBAT_IF = ig.EventStepBase.extend({
        conditions: null,
        withElse: false,
        branches: {},
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Combatant from which to evaluate combat if"
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Combat conditions for if statement"
                },
                withElse: {
                    _type: "Boolean",
                    _info: "With else case.",
                    _noLabel: true
                },
                tmpTarget: {
                    _type: "Entity",
                    _info: "Temp target to set temporarily while combat condition is evaluated",
                    _optional: true
                }
            },
            branchLabel: function (label) {
                switch (label) {
                    case "thenStep":
                        return null;
                    case "elseStep":
                        return "else";
                    case "_end":
                        return "endif"
                }
                return "???"
            }
        }),
        init: function (data) {
            this.entity = data.entity;
            this.tmpTarget = data.tmpTarget;
            this.conditions = new sc.CombatConditions(data.conditions);
            this.withElse = data.withElse
        },
        getBranchNames: function () {
            return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
        },
        getNext: function () {
            var entity = ig.Event.getEntity(this.entity),
                tmpTarget = this.tmpTarget && ig.Event.getEntity(this.tmpTarget),
                prevTmpTarget;
            if (tmpTarget) {
                prevTmpTarget = entity.tmpTarget;
                entity.tmpTarget = tmpTarget
            }
            var random = Math.random();
            var result;
            if (entity) result = this.conditions.check(entity, random);
            else console.log('COMBAT_IF: Entity "' + this.entity.name + '" not found.');
            if (entity && tmpTarget) entity.tmpTarget = prevTmpTarget;
            return result ? this.branches.thenStep ? this.branches.thenStep : this._nextStep : this.branches.elseStep ? this.branches.elseStep : this._nextStep
        }
    });

    ig.EVENT_STEP.REMOVE_PROXIES = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                group: {
                    _type: "String",
                    _info: "Only remove proxies with matching group string"
                }
            }
        }),
        init: function (data) {
            this.group = data.group || null
        },
        start: function () {
            for (var entities = ig.game.entities, i = entities.length; i--;) {
                var entity = entities[i];
                entity && (entity instanceof sc.CombatProxyEntity && entity.group == this.group) && entity.destroy()
            }
        }
    })
});
ig.baked = !0;
