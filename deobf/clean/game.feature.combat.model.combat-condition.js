/**
 * game.feature.combat.model.combat-condition
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.combat-condition")`.
 *
 * The `sc.COMBAT_CONDITION.*` registry: small predicate classes used inside
 * `sc.CombatConditions` (enemy choice trees and reaction gates). Each has an
 * editor `_wm` config, an `init(config)` and a `check(entity, …)` that returns
 * true/false. Conditions may carry `onPerformed`/`onPrePerformed`/
 * `onReactionActivate` hooks consumed by `CombatConditions`.
 */
ig.module("game.feature.combat.model.combat-condition")
    .requires("game.feature.combat.model.combat-params")
    .defines(function () {

    // Shared scratch vectors (declared here for readability; the compiled
    // source declares them partway down — `var` hoisting makes that equivalent).
    var tmpVecA = Vec2.create();      // (was `a`)
    var tmpVecB = Vec2.create();      // (was `d`)
    var tmpCoordVec = Vec2.create();  // (was `b`, reused for coord deltas)

    sc.COMBAT_CONDITION = {};

    sc.COMBAT_CONDITION.RANDOM = ig.Class.extend({
        max: 0,
        _wm: new ig.Config({
            attributes: {
                max: {
                    _type: "Number",
                    _info: "Maximum random value. Range 0-1. 1 = 100% likely to happen."
                }
            }
        }),
        init: function (config) {
            assertContent(config, "max");
            this.max = config.max
        },
        check: function (entity, random) {
            return random <= this.max
        }
    });

    sc.COMBAT_CONDITION.HP_BELOW = ig.Class.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Relative HP are below the given value. Range: 0-1. 0.5 => below 50%"
                }
            }
        }),
        init: function (config) {
            assertContent(config, "value");
            this.value = config.value
        },
        check: function (entity) {
            var params = entity.params;
            return !params ? false : params.currentHp / params.getStat("hp") <= this.value
        }
    });

    sc.COMBAT_CONDITION.HAS_SP = ig.Class.extend({
        min: 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "NumberExpression",
                    _info: "Number of SP that is required"
                }
            }
        }),
        init: function (config) {
            this.min = config.min
        },
        check: function (entity) {
            return entity.params.currentSp >= ig.Event.getExpressionValue(this.min)
        }
    });

    sc.COMBAT_CONDITION.SPAWN_POINT_DISTANCE = ig.Class.extend({
        min: 0,
        max: 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Minimum distance to spawn point in pixels"
                },
                max: {
                    _type: "Number",
                    _info: "Maximum distance to spawn point in pixels"
                }
            }
        }),
        init: function (config) {
            this.min = config.min || 0;
            this.max = config.max || 100
        },
        check: function (entity) {
            var center = entity.getCenter(tmpVecA),
                distance = Vec2.distance(center, entity.spawnPoint);
            return this.min <= distance && distance <= this.max
        }
    });

    sc.COMBAT_CONDITION.TARGET_REACHABLE = ig.Class.extend({
        distance: 0,
        throwing: false,
        _wm: new ig.Config({
            attributes: {
                distance: {
                    _type: "Number",
                    _info: "Maximum distance to target in pixels."
                },
                throwing: {
                    _type: "Boolean",
                    _info: "Plan to throw stuff at target => cliffs in between are ok."
                }
            }
        }),
        init: function (config) {
            this.distance = config.distance || 48;
            this.throwing = config.throwing || false
        },
        check: function (entity) {
            var target = entity.getTarget();
            return !target ? false : ig.navigation.isTargetReachable(entity, target, this.distance, this.throwing)
        }
    });

    sc.COMBAT_CONDITION.TARGET_DISTANCE = ig.Class.extend({
        min: 0,
        max: 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Min distance to target in pixels."
                },
                max: {
                    _type: "Number",
                    _info: "max distance to target in pixels."
                }
            }
        }),
        init: function (config) {
            this.min = config.min || 0;
            this.max = config.max || 100
        },
        check: function (entity) {
            var target = entity.getTarget();
            if (!target) return false;
            var distance = entity.distanceTo(target);
            return this.min <= distance && distance <= this.max
        }
    });

    sc.COMBAT_CONDITION.TARGET_STANDING_ON_SELF = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                alsoOnGround: {
                    _type: "Boolean",
                    _info: "If true, make sure target is properly standing"
                }
            }
        }),
        init: function (config) {
            this.alsoOnGround = config.alsoOnGround || false
        },
        check: function (entity) {
            var target = entity.getTarget();
            if (!target) return false;
            var ground = ig.EntityTools.getGroundEntity(target);
            return ground == entity || ground instanceof ig.AnimationPartEntity && ground.owner == entity && (!this.alsoOnGround || target.coll.pos.z - target.coll.baseZPos <= ig.COLLISION.EPS) ? true : false
        }
    });

    sc.COMBAT_CONDITION.TARGET_OVERLAP = ig.Class.extend({
        ignoreZ: false,
        _wm: new ig.Config({
            attributes: {
                ignoreZ: {
                    _type: "Boolean",
                    _info: "If true, do not check overlapping with z coords"
                }
            }
        }),
        init: function (config) {
            this.ignoreZ = config.ignoreZ || false
        },
        check: function (entity) {
            var target = entity.getTarget();
            return !target ? false : ig.CollTools.intersect(entity.coll, target.coll, this.ignoreZ)
        }
    });

    sc.COMBAT_CONDITION.TARGET_FACE = ig.Class.extend({
        maxAngle: 0,
        _wm: new ig.Config({
            attributes: {
                maxAngle: {
                    _type: "Number",
                    _info: "How much the face direction of the target diverges from distance vector. 0.5 = 45 degree"
                }
            }
        }),
        init: function (config) {
            this.maxAngle = config.maxAngle || 0
        },
        check: function (entity) {
            var target = entity.getTarget();
            if (!target) return false;
            ig.CollTools.getDistVec2(target.coll, entity.coll, tmpVecA);
            return Vec2.angle(tmpVecA, target.face) < this.maxAngle * Math.PI
        }
    });

    sc.COMBAT_CONDITION.FACING_TARGET = ig.Class.extend({
        maxAngle: 0,
        _wm: new ig.Config({
            attributes: {
                maxAngle: {
                    _type: "Number",
                    _info: "How much the OWN face direction diverges from distance to target vector. 0.5 = 45 degree"
                }
            }
        }),
        init: function (config) {
            this.maxAngle = config.maxAngle || 0
        },
        check: function (entity) {
            var target = entity.getTarget();
            if (!target) return false;
            ig.CollTools.getDistVec2(entity.coll, target.coll, tmpVecA);
            return Vec2.angle(tmpVecA, entity.face) < this.maxAngle * Math.PI
        }
    });

    sc.COMBAT_CONDITION.ENTITY_DISTANCE_OVER = ig.Class.extend({
        entity: null,
        distance: 0,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity distance is messured from."
                },
                distance: {
                    _type: "Number",
                    _info: "Distance value"
                }
            }
        }),
        init: function (config) {
            this.entity = config.entity;
            this.distance = config.distance || 100
        },
        check: function (entity) {
            var other = ig.Event.getEntity(this.entity);
            return !other ? false : entity.distanceTo(other) > this.distance
        }
    });

    sc.COMBAT_CONDITION.ENTITY_COORD_DELTA_WITHIN = ig.Class.extend({
        entity: null,
        distance: 0,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity distance is messured from."
                },
                coordinate: {
                    _type: "String",
                    _info: "Coordinate to evaluate distance from",
                    _select: ["X", "Y", "Z"]
                },
                absolute: {
                    _type: "Boolean",
                    _info: "If true, compare absolute delta. Otherwise it's COMBATANT POS - SELECTED ENTITY POS"
                },
                min: {
                    _type: "Number",
                    _info: "Minimum value"
                },
                max: {
                    _type: "Number",
                    _info: "Maximum value"
                },
                targetDelta: {
                    _type: "Boolean",
                    _info: "If true: Calculate delta TARGET POS - SELECTED ENTITY POS"
                }
            }
        }),
        init: function (config) {
            this.entity = config.entity;
            this.coordinate = config.coordinate;
            this.absolute = config.absolute;
            this.min = config.min || 0;
            this.max = config.max || 0;
            this.targetDelta = config.targetDelta || false
        },
        check: function (entity) {
            var other = ig.Event.getEntity(this.entity);
            if (!other) return false;
            var subject = (this.targetDelta ? entity.getTarget() : entity) || entity;
            var delta = ig.CollTools.getDistVec3(other.coll, subject.coll, tmpCoordVec);
            var value = 0;
            value = this.coordinate == "X" ? delta.x : this.coordinate == "Y" ? delta.y : delta.z;
            this.absolute && (value = Math.abs(value));
            return this.min <= value && value <= this.max
        }
    });

    sc.COMBAT_CONDITION.TARGET_X_DISTANCE = ig.Class.extend({
        min: 0,
        max: 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Min X distance to target in pixels."
                },
                max: {
                    _type: "Number",
                    _info: "max X distance to target in pixels."
                }
            }
        }),
        init: function (config) {
            this.min = config.min || 0;
            this.max = config.max || 100
        },
        check: function (entity) {
            var target = entity.getTarget();
            if (!target) return false;
            var selfCenter = entity.getCenter(tmpVecA);
            Vec2.sub(selfCenter, target.getCenter(tmpVecB));
            var dx = Math.abs(selfCenter.x);
            return this.min <= dx && dx <= this.max
        }
    });

    sc.COMBAT_CONDITION.TARGET_Y_DISTANCE_BELOW = ig.Class.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "value",
                    _info: "Value the y distance needs to be below of"
                }
            }
        }),
        init: function (config) {
            assertContent(config, "value");
            this.value = config.value
        },
        check: function (entity) {
            var target = entity.getTarget();
            return !target ? false : target.coll.pos.y - entity.coll.pos.y <= this.value
        }
    });

    sc.COMBAT_CONDITION.TARGET_Z_DISTANCE = ig.Class.extend({
        zMin: 0,
        zMax: 0,
        _wm: new ig.Config({
            attributes: {
                zMin: {
                    _type: "Number",
                    _info: "Min Z distance to target in pixels."
                },
                zMax: {
                    _type: "Number",
                    _info: "max Z distance to target in pixels."
                }
            }
        }),
        init: function (config) {
            this.zMin = config.zMin;
            this.zMax = config.zMax
        },
        check: function (entity) {
            var target = entity.getTarget();
            if (!target) return false;
            var zDelta = target.coll.pos.z - entity.coll.pos.z;
            return this.zMin <= target.coll.pos.z + target.coll.size.z - entity.coll.pos.z && zDelta <= this.zMax
        }
    });

    sc.COMBAT_CONDITION.TARGET_ALIVE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return (entity = entity.getTarget()) && (!entity.isDefeated || !entity.isDefeated())
        }
    });

    sc.COMBAT_CONDITION.HAS_TARGET = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return !!entity.getTarget()
        }
    });

    sc.COMBAT_CONDITION.COLLAB_IS_ONGOING = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function () {
            return sc.combat.hasCollabs()
        }
    });

    sc.COMBAT_CONDITION.HP_BREAK = ig.Class.extend({
        min: void 0,
        max: void 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "If defined: HP Break has to be at least this value.",
                    _optional: true
                },
                max: {
                    _type: "Number",
                    _info: "If defined: HP Break has to be at most this value.",
                    _optional: true
                }
            }
        }),
        init: function (config) {
            this.min = config.min;
            this.max = config.max
        },
        check: function (entity) {
            var hpBreak = entity.getCombatantRoot().hpBreakReached || 0;
            return this.min != void 0 && this.min != null && hpBreak < this.min || this.max != void 0 && this.max != null && hpBreak > this.max ? false : true
        }
    });

    sc.COMBAT_CONDITION.HP_BREAK_GLOBAL = ig.Class.extend({
        min: void 0,
        max: void 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "If defined: HP Break has to be at least this value.",
                    _optional: true
                },
                max: {
                    _type: "Number",
                    _info: "If defined: HP Break has to be at most this value.",
                    _optional: true
                }
            }
        }),
        init: function (config) {
            this.min = config.min;
            this.max = config.max
        },
        check: function () {
            var enemies = sc.combat.activeCombatants[sc.COMBATANT_PARTY.ENEMY],
                maxBreak = 0;
            for (var i = enemies.length; i--;) maxBreak = Math.max(maxBreak, enemies[i].hpBreakReached);
            return this.min != void 0 && this.min != null && maxBreak < this.min || this.max != void 0 && this.max != null && maxBreak > this.max ? false : true
        }
    });

    sc.COMBAT_CONDITION.HAS_SHIELD = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of shield that has to be active"
                }
            }
        }),
        init: function (config) {
            assertContent(config, "name");
            this.name = config.name
        },
        check: function (entity) {
            return entity.hasShield(this.name)
        }
    });

    sc.COMBAT_CONDITION.ON_GROUND = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return entity.coll.baseZPos == entity.coll.pos.z
        }
    });

    sc.COMBAT_CONDITION.HAS_GROUND_ENTITY = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return !!ig.EntityTools.getGroundEntity(entity)
        }
    });

    sc.COMBAT_CONDITION.HAS_ENTITY_ON_TOP = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return ig.game.getEntitiesOnTop(entity).length > 0
        }
    });

    sc.COMBAT_CONDITION.Z_BASE_UNCERTAIN = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return !entity.coll._collData || entity.coll._collData.zBaseUncertain
        }
    });

    sc.COMBAT_CONDITION.TARGET_TRAP_TIME_OVER = ig.Class.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Value trap time needs to be over. 0 for ANY trap time value",
                    _optional: true
                }
            }
        }),
        init: function (config) {
            this.value = config.value
        },
        check: function (entity) {
            var target = entity.getTarget();
            return !target || !target.combo ? false : target.combo.guardTrapTime > this.value
        }
    });

    sc.COMBAT_CONDITION.TARGET_HIT_STABLE_ABOVE = ig.Class.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "Hit Stable target needs to be above of",
                    _select: sc.ATTACK_TYPE
                }
            }
        }),
        init: function (config) {
            this.value = sc.ATTACK_TYPE[config.value]
        },
        check: function (entity) {
            var target = entity.getTarget();
            return !target ? false : target.hitStable >= this.value
        }
    });

    sc.COMBAT_CONDITION.HAS_PROXY = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                sticking: {
                    _type: "Boolean",
                    _info: "If true: only proxies sticking to source"
                },
                group: {
                    _type: "String",
                    _info: "If true: only proxies matching this group"
                },
                count: {
                    _type: "Number",
                    _info: "If defined: need at least that amount of maxing proxies",
                    _optional: true
                }
            }
        }),
        init: function (config) {
            this.sticking = config.sticking || false;
            this.group = config.group;
            this.count = config.count || 0
        },
        check: function (entity) {
            var attached = entity.entityAttached,
                attachedCount = attached.length,
                matches = 0;
            while (attachedCount--) {
                var attachedEntity = attached[attachedCount];
                if (attachedEntity instanceof sc.CombatProxyEntity && (!this.sticking || attachedEntity.stickToSource) && !(this.group && attachedEntity.group != this.group))
                    if (this.count) matches++;
                    else return true
            }
            return this.count && matches >= this.count ? true : false
        }
    });

    sc.COMBAT_CONDITION.ENTERED_STATE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return entity.justEnteredState
        }
    });

    sc.COMBAT_CONDITION.CURRENT_STATE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                state: {
                    _type: "EnemyStateRef",
                    _info: "State enemy is currently in"
                }
            }
        }),
        init: function (config) {
            this.state = config.state
        },
        check: function (entity) {
            return entity.currentState == this.state
        }
    });

    sc.COMBAT_CONDITION.ENEMY_COUNT = ig.Class.extend({
        count: 0,
        sameType: 0,
        _wm: new ig.Config({
            attributes: {
                count: {
                    _type: "Number",
                    _info: "Minimum amount of enemies"
                },
                sameType: {
                    _type: "Boolean",
                    _info: "Only count same enemy type"
                }
            }
        }),
        init: function (config) {
            this.count = config.count;
            this.sameType = config.sameType
        },
        check: function (entity) {
            return sc.combat.getActiveCombatantCount(entity.party, this.sameType ? entity.enemyName : null) >= this.count
        }
    });

    sc.COMBAT_CONDITION.TRACKER_READY = ig.Class.extend({
        name: 0,
        noResetOnPerformed: false,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "TrackerRef",
                    _info: "Name of Tracker"
                },
                noResetOnPerformed: {
                    _type: "Boolean",
                    _info: "Do not reset tracker after action/reaction has been performed",
                    _optional: true
                }
            }
        }),
        init: function (config) {
            this.name = config.name;
            this.noResetOnPerformed = config.noResetOnPerformed || false
        },
        check: function (entity, argA, argB, argC) {
            var tracker = entity.getCombatantRoot().trackers[this.name];
            return tracker && tracker.onConditionEval(entity, argA, argB, argC)
        },
        onReactionActivate: function (entity) {
            var tracker = entity.getCombatantRoot().trackers[this.name];
            if (tracker && tracker.onReactionActivate) tracker.onReactionActivate(entity)
        },
        onPerformed: function (entity) {
            var tracker = entity.getCombatantRoot().trackers[this.name];
            if (tracker && tracker.onPerformed) tracker.onPerformed(entity, this.noResetOnPerformed)
        }
    });

    sc.COMBAT_CONDITION.ACTION_TOKEN = ig.Class.extend({
        name: 0,
        time: 0,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of action token that has to be available."
                },
                time: {
                    _type: "Number",
                    _info: "Time to block action token if available."
                }
            }
        }),
        init: function (config) {
            assertContent(config, "name", "time");
            this.name = config.name;
            this.time = config.time
        },
        check: function () {
            return sc.combat.getActionToken(this.name, this.time)
        }
    });

    sc.COMBAT_CONDITION.MULTI_TOKEN = ig.Class.extend({
        names: [],
        times: [],
        _wm: new ig.Config({
            attributes: {
                names: {
                    _type: "JSON",
                    _info: "An array of names, one for each token."
                },
                times: {
                    _type: "JSON",
                    _info: "An array of waiting times, one for each token."
                }
            }
        }),
        init: function (config) {
            assertContent(config, "tokens");
            for (var key in config.tokens) {
                this.names.push(key);
                this.times.push(config.tokens[key])
            }
        },
        check: function () {
            return sc.combat.getMultiToken(this.names, this.times)
        }
    });

    sc.COMBAT_CONDITION.VAR_CONDITION = ig.Class.extend({
        condition: 0,
        _wm: new ig.Config({
            attributes: {
                condition: {
                    _type: "ActorVarCondition",
                    _info: "VarCondition that has to be true."
                }
            }
        }),
        init: function (config) {
            assertContent(config, "condition");
            this.condition = config.condition;
            if (typeof this.condition == "string") this.condition = new ig.VarCondition(this.condition)
        },
        check: function (entity) {
            ig.vars.pushEntityAccessor(entity);
            var result;
            if (this.condition.actorAttrib) result = (result = entity.getAttribCondition(this.condition.actorAttrib)) ? result.evaluate() : false;
            else result = this.condition ? this.condition.evaluate() : false;
            ig.vars.popEntityAccessor(entity);
            return result
        }
    });

    sc.COMBAT_CONDITION.ATTRIB_IS_TRUE = ig.Class.extend({
        name: 0,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of actor attrib"
                }
            }
        }),
        init: function (config) {
            assertContent(config, "name");
            this.name = config.name
        },
        check: function (entity) {
            return entity.getAttribute(this.name)
        }
    });

    sc.COMBAT_CONDITION.BLOCKING_FREE_LINE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return sc.combat.isBlockingFreeLine(entity)
        }
    });

    sc.COMBAT_CONDITION.BALL_CHARGE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity, argA, hitData) {
            return hitData && hitData.attackInfo && hitData.attackInfo.hasHint("CHARGED")
        }
    });

    sc.COMBAT_CONDITION.BALL_SMALL = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity, argA, hitData) {
            return hitData && hitData.damagingEntity.isBall && hitData.attackInfo && !hitData.attackInfo.hasHint("CHARGED")
        }
    });

    sc.COMBAT_CONDITION.ATTACK_FROM_ENTITY = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Check if incoming attack originates from this entity"
                }
            }
        }),
        init: function (config) {
            this.entity = config.entity
        },
        check: function (entity, argA, hitData) {
            if (!hitData) return false;
            var root = hitData.damagingEntity.getCombatantRoot();
            var expected = ig.Event.getEntity(this.entity);
            return root == expected
        }
    });

    sc.COMBAT_CONDITION.DAMAGE_FACTOR = ig.Class.extend({
        min: void 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Minimum value of attack damage factor",
                    _default: 1
                }
            }
        }),
        init: function (config) {
            this.min = config.min || 0
        },
        check: function (entity, argA, hitData) {
            return hitData && hitData.attackInfo.damageFactor >= this.min
        }
    });

    sc.COMBAT_CONDITION.HAS_BLOCKED_DAMAGE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return entity.combo.blockedDamage > 0
        }
    });

    sc.COMBAT_CONDITION.HAS_BLOCKED_HITS = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return entity.combo.guardedHits > 0
        }
    });

    sc.COMBAT_CONDITION.HAS_BLOCKED_ENTITY = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return entity.hasBlockEntity()
        }
    });

    sc.COMBAT_CONDITION.PART_HIT = ig.Class.extend({
        partName: null,
        _wm: new ig.Config({
            attributes: {
                partName: {
                    _type: "String",
                    _info: "Name of part that is hit"
                }
            }
        }),
        init: function (config) {
            this.partName = config.partName
        },
        check: function (entity, argA, hitData) {
            return !hitData || !hitData.partEntity ? false : hitData.partEntity.partName == this.partName
        }
    });

    sc.COMBAT_CONDITION.HAS_HINT = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                hint: {
                    _type: "String",
                    _info: "Hint Value"
                }
            }
        }),
        init: function (config) {
            this.hint = config.hint
        },
        check: function (entity, argA, hitData) {
            return hitData && hitData.attackInfo && hitData.attackInfo.hasHint(this.hint)
        }
    });

    sc.COMBAT_CONDITION.IS_BALL = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity, argA, hitData) {
            return hitData && hitData.attackInfo.ballDamage
        }
    });

    sc.COMBAT_CONDITION.IS_SHIELDED = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity, argA, hitData) {
            return hitData && hitData.shielded
        }
    });

    sc.COMBAT_CONDITION.ELEMENT_HIT = ig.Class.extend({
        element: null,
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element required",
                    _select: sc.ELEMENT
                }
            }
        }),
        init: function (config) {
            this.element = sc.ELEMENT[config.element] || sc.ELEMENT.NEUTRAL
        },
        check: function (entity, argA, hitData) {
            return hitData && hitData.attackInfo.element == this.element
        }
    });

    sc.COMBAT_CONDITION.HIT_BY_PLAYER = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity, argA, hitData) {
            return (entity = hitData && hitData.damagingEntity) && entity.getCombatantRoot ? entity.getCombatantRoot().isPlayer : false
        }
    });

    sc.COMBAT_CONDITION.ELEMENT_HIT_ATTRIB = ig.Class.extend({
        element: null,
        _wm: new ig.Config({
            attributes: {
                attribName: {
                    _type: "String",
                    _info: "Attrib name which contains Element String that must match hit element"
                },
                counter: {
                    _type: "Boolean",
                    _info: "If true, use counter element of element in attrib"
                }
            }
        }),
        init: function (config) {
            this.attribName = config.attribName;
            this.counter = config.counter || false
        },
        check: function (entity, argA, hitData) {
            var element = sc.ELEMENT[entity.getAttribute(this.attribName)];
            if (element) {
                this.counter && (element = sc.ELEMENT_COUNTER[element]);
                return hitData && hitData.attackInfo.element == element
            }
        }
    });

    sc.COMBAT_CONDITION.ELEMENT_MODE = ig.Class.extend({
        element: null,
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element of the combatant is currently in",
                    _select: sc.ELEMENT
                }
            }
        }),
        init: function (config) {
            this.element = sc.ELEMENT[config.element] || sc.ELEMENT.NEUTRAL
        },
        check: function (entity) {
            entity = entity.getCombatantRoot();
            return sc.combat.getElementMode(entity) == this.element
        }
    });

    sc.COMBAT_CONDITION.COMBO_HITS = ig.Class.extend({
        min: 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Minimum amount of hits of combo attack that enemy is stuck in"
                }
            }
        }),
        init: function (config) {
            this.min = config.min
        },
        check: function (entity) {
            return entity.stunData.hits >= this.min
        }
    });

    sc.COMBAT_CONDITION.COMBO_TIME = ig.Class.extend({
        min: 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Minimum amount of time (in SECONDS) of combo attack that enemy is stuck in"
                }
            }
        }),
        init: function (config) {
            this.min = config.min
        },
        check: function (entity) {
            return entity.stunData.time >= this.min
        },
        onPrePerformed: function (entity) {
            entity.resetStunData()
        }
    });

    sc.COMBAT_CONDITION.STUN_ESCAPE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                showMsg: {
                    _type: "Boolean",
                    _info: "If true, show stunEscape message on success"
                }
            }
        }),
        init: function (config) {
            this.showMsg = config.showMsg || false
        },
        check: function (entity) {
            return entity.stunData.time >= entity.stunData.stunEscapeTime
        },
        onPrePerformed: function (entity) {
            entity.resetStunData();
            this.showMsg && sc.combat.showCombatMessage(entity, sc.COMBAT_MSG_TYPE.STUN_CANCEL)
        }
    });

    sc.COMBAT_CONDITION.COMBO_DAMAGE = ig.Class.extend({
        min: 0,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Amount of damage (relative to HP) of combo attack that enemy is stuck in"
                }
            }
        }),
        init: function (config) {
            this.min = config.min
        },
        check: function (entity) {
            return entity.stunData.damage / entity.params.getStat("hp") >= this.min
        }
    });

    sc.COMBAT_CONDITION.POI_IS_CLOSE = ig.Class.extend({
        poiFilter: 0,
        distance: 0,
        _wm: new ig.Config({
            attributes: {
                poiFilter: {
                    _type: "PoiFilter",
                    _info: "Kind of POI searched"
                },
                distance: {
                    _type: "Number",
                    _info: "Maximum distance to POI"
                },
                checkPath: {
                    _type: "Boolean",
                    _info: "If true: check if path to POI is available"
                }
            }
        }),
        init: function (config) {
            this.poiFilter = sc.CombatPoI.initPoiFilter(config.poiFilter);
            this.distance = config.distance;
            this.checkPath = config.checkPath
        },
        check: function (entity) {
            var poi = sc.CombatPoI.getClosestPoI(this.poiFilter, entity, this.distance, this.checkPath);
            entity.lastPoICheck = poi;
            return !!poi
        }
    });

    sc.COMBAT_CONDITION.NAVIGATION_SUCCESS = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return entity.nav && entity.nav.path.failCount == 0
        }
    });

    sc.COMBAT_CONDITION.ON_NAV_NODE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity) {
            return ig.navigation.isSearcherOnNode(entity)
        }
    });

    sc.COMBAT_CONDITION.COMPRESSOR_DETOUR_CONDITION = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        check: function (entity, argA, hitData) {
            var damagingEntity = hitData && hitData.damagingEntity;
            return !damagingEntity || !(damagingEntity instanceof sc.CompressedShockEntity) ? false : damagingEntity.wallBounces < entity.hpBreakReached
        }
    })
});
ig.baked = !0;
