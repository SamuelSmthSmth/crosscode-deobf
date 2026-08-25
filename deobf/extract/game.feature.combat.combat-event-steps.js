ig.module("game.feature.combat.combat-event-steps").requires("impact.base.animation", "impact.base.action", "impact.base.entity", "game.feature.combat.entities.drop", "game.feature.combat.entities.combatant", "game.feature.combat.entities.combat-proxy", "impact.feature.effect.effect-steps").defines(function() {
    ig.FX_FIRST_TARGET_OPTION.PROXY_OWNER = function(a) {
        return a.combatant
    };
    ig.FX_FIRST_TARGET_OPTION.PROXY_SRC = function(a) {
        return a.sourceEntity
    };
    ig.FX_FIRST_TARGET_OPTION.OWNER_ENEMY = function(a) {
        return a.ownerEnemy
    };
    ig.FX_SECOND_TARGET_OPTION.PROXY_OWNER = function(a, b) {
        a.target2 = b.combatant
    };
    ig.FX_SECOND_TARGET_OPTION.PROXY_SRC = function(a, b) {
        a.target2 = b.sourceEntity
    };
    ig.FX_SECOND_TARGET_OPTION.OWNER_ENEMY = function(a, b) {
        a.target2 = b.ownerEnemy
    };
    var b = Vec3.create();
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
        init: function(a) {
            this.position = a.position;
            if (a.enemyInfo) this.enemyInfo = new sc.EnemyInfo(a.enemyInfo);
            this.targetPlayer = a.targetPlayer || false;
            this.name = a.name || null;
            this.spawnCondition = a.spawnCondition || null;
            this.noEffects = a.noEffects || false;
            if (a.startAction) this.startAction = new ig.Action("[GENERIC]", a.startAction, false)
        },
        clearCached: function() {
            this.enemyInfo && this.enemyInfo.clearCached();
            this.startAction && this.startAction.clearCached()
        },
        start: function() {
            var a =
                ig.Event.getVec3(this.position, b),
                a = ig.game.spawnEntity(ig.ENTITY.Enemy, a.x - this.enemyInfo.enemyType.size.x / 2, a.y - this.enemyInfo.enemyType.size.y / 2, a.z, {
                    enemyInfo: this.enemyInfo.getSettings(),
                    name: ig.Event.getExpressionValue(this.name),
                    spawnCondition: this.spawnCondition
                }, !this.noEffects);
            this.targetPlayer && a.setTarget(ig.game.playerEntity, true);
            this.startAction && a.setAction(this.startAction)
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
        init: function(a) {
            this.position = a.position;
            this.desType =
                a.desType;
            this.onDestructIncrease = a.onDestructIncrease;
            this.onPreDestructIncrease = a.onPreDestructIncrease;
            if (a.effect) this.effect = new ig.EffectHandle(a.effect)
        },
        start: function() {
            var a = ig.Event.getVec3(this.position, b),
                a = ig.game.spawnEntity(ig.ENTITY.Destructible, a.x - 12, a.y - 12, a.z, {
                    desType: this.desType,
                    permaDestruct: false,
                    blockNavMap: true,
                    onDestructIncrease: this.onDestructIncrease,
                    onPreDestructIncrease: this.onPreDestructIncrease
                }, false);
            this.effect && this.effect.spawnOnTarget(a)
        }
    });
    ig.EVENT_STEP.SPAWN_ENEMY_ON_ENTITY =
        ig.EventStepBase.extend({
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
            init: function(a) {
                this.entity = a.entity;
                if (a.enemyInfo) this.enemyInfo = new sc.EnemyInfo(a.enemyInfo);
                this.targetPlayer = a.targetPlayer || false;
                this.name = a.name || null;
                this.spawnCondition = a.spawnCondition || null
            },
            clearCached: function() {
                this.enemyInfo && this.enemyInfo.clearCached()
            },
            start: function(a, b) {
                var d = ig.Event.getEntity(this.entity, b),
                    g = d.coll.pos,
                    d = d.coll.size,
                    g = ig.game.spawnEntity(ig.ENTITY.Enemy, g.x + d.x / 2 - this.enemyInfo.enemyType.size.x / 2, g.y + d.y / 2 - this.enemyInfo.enemyType.size.y /
                        2, g.z, {
                            enemyInfo: this.enemyInfo.getSettings(),
                            name: ig.Event.getExpressionValue(this.name),
                            spawnCondition: this.spawnCondition
                        }, true);
                this.targetPlayer && g.setTarget(ig.game.playerEntity, true)
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
        init: function(a) {
            this.visibility = a.visibility
        },
        start: function() {
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
        init: function(a) {
            this.enemyType = a.enemyType;
            this.noRumble = a.noRumble
        },
        start: function() {
            sc.combat.removeEnemies(this.enemyType, null, this.noRumble, true)
        }
    });
    ig.EVENT_STEP.SET_ENEMY_STATE =
        ig.EventStepBase.extend({
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
            init: function(a) {
                this.enemy = a.enemy;
                this.enemyState = a.enemyState
            },
            start: function(a, b) {
                var d = ig.Event.getEntity(this.enemy, b);
                d && d.changeState(this.enemyState, true)
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
        init: function(a) {
            this.enemy = a.enemy;
            this.target = a.target
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.enemy, b),
                g = ig.Event.getEntity(this.target, b);
            d && d.setTarget(g, true)
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
        init: function(a) {
            this.target = a.target
        },
        start: function(a,
            b) {
            var d = ig.Event.getEntity(this.target, b);
            sc.combat.setScreenEnemiesTarget(d)
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
        init: function(a) {
            this.target = a.target
        },
        start: function(a, b) {
            for (var d = ig.Event.getEntity(this.target, b), g = ig.game.entities, h = g.length; h--;) {
                var i = g[h];
                i instanceof ig.ENTITY.Enemy && i.setTarget(d, true)
            }
        }
    });
    ig.EVENT_STEP.REMOVE_ALL_ENEMY_TARGET = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            for (var a = ig.game.entities, b = a.length; b--;) {
                var d = a[b];
                d instanceof ig.ENTITY.Enemy && d.setTarget(null, true)
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
        init: function(a) {
            this.target = a.target;
            this.sp = a.sp
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.target, b);
            d && d.params && d.params.setRelativeSp(this.sp)
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
        init: function(a) {
            this.target = a.target;
            this.value = a.value
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.target, b);
            d && d.params && d.params.setRelativeHp(this.value)
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
        init: function(a) {
            this.value = {
                value: a.value
            };
            this.target = a.target;
            this.showNumbers = a.showNumbers
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.target, b);
            d && d.params && d.heal(this.value, !this.showNumbers)
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
        init: function(a) {
            this.enemyType = a.enemyType;
            this.target = a.target
        },
        start: function(a, b) {
            for (var d = ig.Event.getEntity(this.target, b), g = ig.game.shownEntities, h = g.length; h--;) {
                var i = g[h];
                i instanceof ig.ENTITY.Enemy && i.enemyName == this.enemyType && i.setTarget(d, true)
            }
        }
    });
    ig.EVENT_STEP.SET_ENEMIES_NAV_TOLERANT = ig.EventStepBase.extend({
        target: 0,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function(a) {
            this.enemyType = a.enemyType;
            this.target = a.target
        },
        start: function(a, b) {
            for (var d = ig.Event.getEntity(this.target, b), g = ig.game.shownEntities, h = g.length; h--;) {
                var i = g[h];
                i instanceof ig.ENTITY.Enemy && i.enemyName == this.enemyType && i.setTarget(d, true)
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
        init: function(a) {
            this.effectType = sc.DRAMATIC_EFFECT[a.effectType] ||
                null
        },
        start: function() {
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
        init: function(a) {
            this.speed = a.speed || 0
        },
        start: function() {
            sc.combat.setCombatSpeed(this.speed)
        }
    });
    var a = Vec2.create();
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
        init: function(a) {
            this.regExp = RegExp(a.regExp);
            this.enemyInfo = new sc.EnemyInfo(a.enemyInfo);
            this.target = a.target
        },
        clearCached: function() {
            this.enemyInfo && this.enemyInfo.clearCached()
        },
        start: function(b, d) {
            for (var f =
                    this.target && ig.Event.getEntity(this.target, d), g = ig.game.shownEntities, h = g.length; h--;) {
                var i = g[h];
                if (i && i.name && this.regExp.test(i.name)) {
                    var j = {
                            enemyInfo: this.enemyInfo.getSettings()
                        },
                        j = ig.game.spawnEntity("Enemy", i.coll.pos.x, i.coll.pos.y, i.coll.pos.z, j),
                        k = i.getCenter(a);
                    j.setPos(k.x - j.coll.size.x / 2, k.y - j.coll.size.y / 2, j.coll.pos.z);
                    i.face && Vec2.assign(j.face, i.face);
                    i.kill();
                    j.initAnimations(true);
                    f && j.setTarget(f, true)
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
        init: function(a) {
            this.entity = a.entity;
            this.enemyInfo = new sc.EnemyInfo(a.enemyInfo);
            this.manualKill = a.manualKill || null
        },
        clearCached: function() {
            this.enemyInfo &&
                this.enemyInfo.clearCached()
        },
        start: function(b, d) {
            var f = ig.Event.getEntity(this.entity, d);
            if (f) {
                var g = {
                        enemyInfo: this.enemyInfo.getSettings(),
                        name: f.name + "_EnemySwap",
                        manualKill: this.manualKill
                    },
                    g = ig.game.spawnEntity("Enemy", f.coll.pos.x, f.coll.pos.y, f.coll.pos.z, g),
                    h = f.getCenter(a);
                g.setPos(h.x - g.coll.size.x / 2, h.y - g.coll.size.y / 2, g.coll.pos.z);
                f.face && Vec2.assign(g.face, f.face);
                f.hide();
                ig.game.swapNamedEntities(f, g);
                g.initAnimations(true)
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
        init: function(a) {
            this.entity = a.entity;
            this.expCollect = a.expCollect
        },
        start: function(b, d) {
            var f = ig.Event.getEntity(this.entity, d),
                g = ig.game.getEntityByName(f.name + "_EnemySwap");
            if (g && f) {
                var h = f.getCenter(a);
                ig.game.swapNamedEntities(g, f);
                g.setPos(h.x - g.coll.size.x / 2, h.y - g.coll.size.y / 2, f.coll.pos.z);
                g.face && Vec2.assign(g.face,
                    f.face);
                this.expCollect ? f.doManualKill() : f.kill();
                g.show()
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
        init: function(a) {
            this.active = a.active
        },
        start: function() {
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
        init: function(a) {
            this.enemy = a.enemy;
            this.actionName = a.actionName;
            this.noStateReset = a.noStateReset || false
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.enemy, b);
            d && d.doEnemyAction && d.doEnemyAction(this.actionName, this.noStateReset)
        }
    });
    var d = {
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
                    _select: d
                }
            }
        }),
        init: function(a) {
            this.varName = a.varName;
            this.entity = a.entity;
            this.stat = d[a.stat] || d.RELATIVE_HP
        },
        start: function(a, b) {
            var f = ig.Event.getVarName(this.varName);
            if (f) {
                var g =
                    ig.Event.getEntity(this.entity, b);
                if (g && g.isCombatant) {
                    var h;
                    if (this.stat.stat) h = g.params.getStat(this.stat.stat);
                    else if (this.stat == d.RELATIVE_HP) h = g.params.getHpFactor();
                    else if (this.stat == d.CURRENT_HP) h = g.params.currentHp;
                    ig.vars.set(f, h)
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
        init: function(a) {
            this.entity =
                a.entity
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.entity, b);
            d && d.isCombatant && d.doManualKill()
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
        init: function(a) {
            this.entity = a.entity
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.entity, b);
            d && d.isCombatant && d.doManualRevive(1)
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
        init: function(a) {
            this.entity = a.entity;
            this.varName = a.varName
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.entity, b);
            if (d && d.isCombatant) d.manualKill = this.varName
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
        init: function(a) {
            this.winPoints = a.winPoints;
            this.enemies = a.enemies
        },
        start: function(a, b) {
            for (var d = [], g = 0; g < this.enemies.length; g++) d.push(ig.Event.getEntity(this.enemies[g], b));
            sc.pvp.start(this.winPoints, d)
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
        init: function(a) {
            this.autoContinue = a.autoContinue || false
        },
        start: function() {
            sc.pvp.startNextRound(this.autoContinue)
        },
        run: function() {
            return !this.autoContinue || !sc.pvp.blocking
        }
    });
    ig.EVENT_STEP.START_PVP_ROUND = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.pvp.finalizeRoundStart()
        }
    });
    ig.EVENT_STEP.STOP_PVP_BATTLE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.pvp.stop()
        }
    });
    ig.EVENT_STEP.SET_RESPAWN_POINT =
        ig.EventStepBase.extend({
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
            init: function(a) {
                this.entity = a.entity;
                this.marker = a.marker
            },
            start: function(a, b) {
                var d = ig.Event.getEntity(this.entity, b),
                    g = ig.Event.getEntity(this.marker, b);
                if (d && g) {
                    Vec3.assign(d.respawn.pos, g.coll.pos);
                    Vec2.addMulF(d.respawn.pos, g.coll.size, 0.5);
                    Vec2.addMulF(d.respawn.pos, d.coll.size, -0.5)
                }
            }
        });
    ig.EVENT_STEP.COMBAT_IF =
        ig.EventStepBase.extend({
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
                branchLabel: function(a) {
                    switch (a) {
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
            init: function(a) {
                this.entity = a.entity;
                this.tmpTarget = a.tmpTarget;
                this.conditions = new sc.CombatConditions(a.conditions);
                this.withElse = a.withElse
            },
            getBranchNames: function() {
                return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
            },
            getNext: function() {
                var a = ig.Event.getEntity(this.entity),
                    b = this.tmpTarget && ig.Event.getEntity(this.tmpTarget),
                    d;
                if (b) {
                    d = a.tmpTarget;
                    a.tmpTarget = b
                }
                var g = Math.random();
                if (a) var h = this.conditions.check(a, g);
                else console.log('COMBAT_IF: Entity "' +
                    this.entity.name + '" not found.');
                if (a && b) a.tmpTarget = d;
                return h ? this.branches.thenStep ? this.branches.thenStep : this._nextStep : this.branches.elseStep ? this.branches.elseStep : this._nextStep
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
        init: function(a) {
            this.group = a.group || null
        },
        start: function() {
            for (var a = ig.game.entities, b = a.length; b--;) {
                var d = a[b];
                d && (d instanceof sc.CombatProxyEntity &&
                    d.group == this.group) && d.destroy()
            }
        }
    })
});
ig.baked = !0;
