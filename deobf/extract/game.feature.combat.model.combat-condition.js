ig.module("game.feature.combat.model.combat-condition").requires("game.feature.combat.model.combat-params").defines(function() {
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
        init: function(a) {
            assertContent(a, "max");
            this.max = a.max
        },
        check: function(a, b) {
            return b <= this.max
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        check: function(a) {
            a = a.params;
            return !a ? false : a.currentHp / a.getStat("hp") <= this.value
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
        init: function(a) {
            this.min = a.min
        },
        check: function(a) {
            return a.params.currentSp >= ig.Event.getExpressionValue(this.min)
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
        init: function(a) {
            this.min = a.min || 0;
            this.max = a.max || 100
        },
        check: function(b) {
            var d = b.getCenter(a),
                b = Vec2.distance(d, b.spawnPoint);
            return this.min <= b && b <= this.max
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
        init: function(a) {
            this.distance = a.distance || 48;
            this.throwing = a.throwing || false
        },
        check: function(a) {
            var b = a.getTarget();
            return !b ? false : ig.navigation.isTargetReachable(a, b, this.distance, this.throwing)
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
        init: function(a) {
            this.min = a.min || 0;
            this.max = a.max || 100
        },
        check: function(a) {
            var b = a.getTarget();
            if (!b) return false;
            a = a.distanceTo(b);
            return this.min <= a && a <= this.max
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
        init: function(a) {
            this.alsoOnGround = a.alsoOnGround || false
        },
        check: function(a) {
            var b = a.getTarget();
            if (!b) return false;
            var d = ig.EntityTools.getGroundEntity(b);
            return d == a || d instanceof ig.AnimationPartEntity && d.owner == a && (!this.alsoOnGround || b.coll.pos.z - b.coll.baseZPos <= ig.COLLISION.EPS) ? true : false
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
        init: function(a) {
            this.ignoreZ = a.ignoreZ || false
        },
        check: function(a) {
            var b = a.getTarget();
            return !b ? false : ig.CollTools.intersect(a.coll,
                b.coll, this.ignoreZ)
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
        init: function(a) {
            this.maxAngle = a.maxAngle || 0
        },
        check: function(b) {
            var d = b.getTarget();
            if (!d) return false;
            ig.CollTools.getDistVec2(d.coll, b.coll, a);
            return Vec2.angle(a, d.face) < this.maxAngle * Math.PI
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
        init: function(a) {
            this.maxAngle = a.maxAngle || 0
        },
        check: function(b) {
            var d = b.getTarget();
            if (!d) return false;
            ig.CollTools.getDistVec2(b.coll, d.coll, a);
            return Vec2.angle(a, b.face) < this.maxAngle * Math.PI
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
        init: function(a) {
            this.entity = a.entity;
            this.distance = a.distance || 100
        },
        check: function(a) {
            var b = ig.Event.getEntity(this.entity);
            return !b ? false : a.distanceTo(b) > this.distance
        }
    });
    var b = Vec2.create();
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
                    _select: ["X",
                        "Y", "Z"
                    ]
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
        init: function(a) {
            this.entity = a.entity;
            this.coordinate = a.coordinate;
            this.absolute = a.absolute;
            this.min = a.min || 0;
            this.max = a.max || 0;
            this.targetDelta = a.targetDelta || false
        },
        check: function(a) {
            var d =
                ig.Event.getEntity(this.entity);
            if (!d) return false;
            a = (this.targetDelta ? a.getTarget() : a) || a;
            d = ig.CollTools.getDistVec3(d.coll, a.coll, b);
            a = 0;
            a = this.coordinate == "X" ? d.x : this.coordinate == "Y" ? d.y : d.z;
            this.absolute && (a = Math.abs(a));
            return this.min <= a && a <= this.max
        }
    });
    var a = Vec2.create(),
        d = Vec2.create();
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
        init: function(a) {
            this.min = a.min || 0;
            this.max = a.max || 100
        },
        check: function(b) {
            var e = b.getTarget();
            if (!e) return false;
            b = b.getCenter(a);
            Vec2.sub(b, e.getCenter(d));
            e = Math.abs(b.x);
            return this.min <= e && e <= this.max
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        check: function(a) {
            var b = a.getTarget();
            return !b ? false : b.coll.pos.y -
                a.coll.pos.y <= this.value
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
        init: function(a) {
            this.zMin = a.zMin;
            this.zMax = a.zMax
        },
        check: function(a) {
            var b = a.getTarget();
            if (!b) return false;
            var d = b.coll.pos.z - a.coll.pos.z;
            return this.zMin <= b.coll.pos.z + b.coll.size.z - a.coll.pos.z && d <= this.zMax
        }
    });
    sc.COMBAT_CONDITION.TARGET_ALIVE =
        ig.Class.extend({
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function() {},
            check: function(a) {
                return (a = a.getTarget()) && (!a.isDefeated || !a.isDefeated())
            }
        });
    sc.COMBAT_CONDITION.HAS_TARGET = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return !!a.getTarget()
        }
    });
    sc.COMBAT_CONDITION.COLLAB_IS_ONGOING = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function() {
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
        init: function(a) {
            this.min = a.min;
            this.max = a.max
        },
        check: function(a) {
            a = a.getCombatantRoot().hpBreakReached || 0;
            return this.min != void 0 && this.min != null && a < this.min || this.max != void 0 && this.max != null && a > this.max ? false : true
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
        init: function(a) {
            this.min = a.min;
            this.max = a.max
        },
        check: function() {
            for (var a = sc.combat.activeCombatants[sc.COMBATANT_PARTY.ENEMY], b = 0, d = a.length; d--;) b = Math.max(b, a[d].hpBreakReached);
            return this.min != void 0 && this.min != null && b < this.min || this.max != void 0 && this.max != null &&
                b > this.max ? false : true
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
        init: function(a) {
            assertContent(a, "name");
            this.name = a.name
        },
        check: function(a) {
            return a.hasShield(this.name)
        }
    });
    sc.COMBAT_CONDITION.ON_GROUND = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return a.coll.baseZPos == a.coll.pos.z
        }
    });
    sc.COMBAT_CONDITION.HAS_GROUND_ENTITY = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return !!ig.EntityTools.getGroundEntity(a)
        }
    });
    sc.COMBAT_CONDITION.HAS_ENTITY_ON_TOP = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return ig.game.getEntitiesOnTop(a).length > 0
        }
    });
    sc.COMBAT_CONDITION.Z_BASE_UNCERTAIN = ig.Class.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return !a.coll._collData || a.coll._collData.zBaseUncertain
        }
    });
    sc.COMBAT_CONDITION.TARGET_TRAP_TIME_OVER =
        ig.Class.extend({
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
            init: function(a) {
                this.value = a.value
            },
            check: function(a) {
                a = a.getTarget();
                return !a || !a.combo ? false : a.combo.guardTrapTime > this.value
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
        init: function(a) {
            this.value =
                sc.ATTACK_TYPE[a.value]
        },
        check: function(a) {
            a = a.getTarget();
            return !a ? false : a.hitStable >= this.value
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
        init: function(a) {
            this.sticking = a.sticking || false;
            this.group = a.group;
            this.count = a.count || 0
        },
        check: function(a) {
            for (var a = a.entityAttached, b = a.length, d = 0; b--;) {
                var g = a[b];
                if (g instanceof sc.CombatProxyEntity && (!this.sticking || g.stickToSource) && !(this.group && g.group != this.group))
                    if (this.count) d++;
                    else return true
            }
            return this.count && d >= this.count ? true : false
        }
    });
    sc.COMBAT_CONDITION.ENTERED_STATE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return a.justEnteredState
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
        init: function(a) {
            this.state = a.state
        },
        check: function(a) {
            return a.currentState == this.state
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
        init: function(a) {
            this.count = a.count;
            this.sameType = a.sameType
        },
        check: function(a) {
            return sc.combat.getActiveCombatantCount(a.party, this.sameType ? a.enemyName :
                null) >= this.count
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
        init: function(a) {
            this.name = a.name;
            this.noResetOnPerformed = a.noResetOnPerformed || false
        },
        check: function(a, b, d, g) {
            var h = a.getCombatantRoot().trackers[this.name];
            return h && h.onConditionEval(a, b, d,
                g)
        },
        onReactionActivate: function(a) {
            var b = a.getCombatantRoot().trackers[this.name];
            if (b && b.onReactionActivate) b.onReactionActivate(a)
        },
        onPerformed: function(a) {
            var b = a.getCombatantRoot().trackers[this.name];
            if (b && b.onPerformed) b.onPerformed(a, this.noResetOnPerformed)
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
        init: function(a) {
            assertContent(a, "name", "time");
            this.name = a.name;
            this.time = a.time
        },
        check: function() {
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
        init: function(a) {
            assertContent(a, "tokens");
            for (var b in a.tokens) {
                this.names.push(b);
                this.times.push(a.tokens[b])
            }
        },
        check: function() {
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
        init: function(a) {
            assertContent(a, "condition");
            this.condition = a.condition;
            if (typeof this.condition == "string") this.condition = new ig.VarCondition(this.condition)
        },
        check: function(a) {
            ig.vars.pushEntityAccessor(a);
            var b;
            if (this.condition.actorAttrib) b = (b = a.getAttribCondition(this.condition.actorAttrib)) ?
                b.evaluate() : false;
            else b = this.condition ? this.condition.evaluate() : false;
            ig.vars.popEntityAccessor(a);
            return b
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
        init: function(a) {
            assertContent(a, "name");
            this.name = a.name
        },
        check: function(a) {
            return a.getAttribute(this.name)
        }
    });
    sc.COMBAT_CONDITION.BLOCKING_FREE_LINE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return sc.combat.isBlockingFreeLine(a)
        }
    });
    sc.COMBAT_CONDITION.BALL_CHARGE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a, b, d) {
            return d && d.attackInfo && d.attackInfo.hasHint("CHARGED")
        }
    });
    sc.COMBAT_CONDITION.BALL_SMALL = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a, b, d) {
            return d && d.damagingEntity.isBall && d.attackInfo && !d.attackInfo.hasHint("CHARGED")
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
        init: function(a) {
            this.entity = a.entity
        },
        check: function(a, b, d) {
            if (!d) return false;
            a = d.damagingEntity.getCombatantRoot();
            b = ig.Event.getEntity(this.entity);
            return a == b
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
        init: function(a) {
            this.min = a.min || 0
        },
        check: function(a, b, d) {
            return d && d.attackInfo.damageFactor >=
                this.min
        }
    });
    sc.COMBAT_CONDITION.HAS_BLOCKED_DAMAGE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return a.combo.blockedDamage > 0
        }
    });
    sc.COMBAT_CONDITION.HAS_BLOCKED_HITS = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return a.combo.guardedHits > 0
        }
    });
    sc.COMBAT_CONDITION.HAS_BLOCKED_ENTITY = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return a.hasBlockEntity()
        }
    });
    sc.COMBAT_CONDITION.PART_HIT =
        ig.Class.extend({
            partName: null,
            _wm: new ig.Config({
                attributes: {
                    partName: {
                        _type: "String",
                        _info: "Name of part that is hit"
                    }
                }
            }),
            init: function(a) {
                this.partName = a.partName
            },
            check: function(a, b, d) {
                return !d || !d.partEntity ? false : d.partEntity.partName == this.partName
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
        init: function(a) {
            this.hint = a.hint
        },
        check: function(a, b, d) {
            return d && d.attackInfo && d.attackInfo.hasHint(this.hint)
        }
    });
    sc.COMBAT_CONDITION.IS_BALL =
        ig.Class.extend({
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function() {},
            check: function(a, b, d) {
                return d && d.attackInfo.ballDamage
            }
        });
    sc.COMBAT_CONDITION.IS_SHIELDED = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a, b, d) {
            return d && d.shielded
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
        init: function(a) {
            this.element = sc.ELEMENT[a.element] || sc.ELEMENT.NEUTRAL
        },
        check: function(a, b, d) {
            return d && d.attackInfo.element == this.element
        }
    });
    sc.COMBAT_CONDITION.HIT_BY_PLAYER = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a, b, d) {
            return (a = d && d.damagingEntity) && a.getCombatantRoot ? a.getCombatantRoot().isPlayer : false
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
        init: function(a) {
            this.attribName = a.attribName;
            this.counter = a.counter || false
        },
        check: function(a, b, d) {
            if (a = sc.ELEMENT[a.getAttribute(this.attribName)]) {
                this.counter && (a = sc.ELEMENT_COUNTER[a]);
                return d && d.attackInfo.element == a
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
        init: function(a) {
            this.element =
                sc.ELEMENT[a.element] || sc.ELEMENT.NEUTRAL
        },
        check: function(a) {
            a = a.getCombatantRoot();
            return sc.combat.getElementMode(a) == this.element
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
        init: function(a) {
            this.min = a.min
        },
        check: function(a) {
            return a.stunData.hits >= this.min
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
        init: function(a) {
            this.min = a.min
        },
        check: function(a) {
            return a.stunData.time >= this.min
        },
        onPrePerformed: function(a) {
            a.resetStunData()
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
        init: function(a) {
            this.showMsg = a.showMsg || false
        },
        check: function(a) {
            return a.stunData.time >= a.stunData.stunEscapeTime
        },
        onPrePerformed: function(a) {
            a.resetStunData();
            this.showMsg && sc.combat.showCombatMessage(a, sc.COMBAT_MSG_TYPE.STUN_CANCEL)
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
        init: function(a) {
            this.min = a.min
        },
        check: function(a) {
            return a.stunData.damage / a.params.getStat("hp") >= this.min
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
        init: function(a) {
            this.poiFilter = sc.CombatPoI.initPoiFilter(a.poiFilter);
            this.distance = a.distance;
            this.checkPath = a.checkPath
        },
        check: function(a) {
            var b = sc.CombatPoI.getClosestPoI(this.poiFilter, a, this.distance, this.checkPath);
            a.lastPoICheck = b;
            return !!b
        }
    });
    sc.COMBAT_CONDITION.NAVIGATION_SUCCESS = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return a.nav && a.nav.path.failCount == 0
        }
    });
    sc.COMBAT_CONDITION.ON_NAV_NODE = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a) {
            return ig.navigation.isSearcherOnNode(a)
        }
    });
    sc.COMBAT_CONDITION.COMPRESSOR_DETOUR_CONDITION = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        check: function(a, b, d) {
            b = d && d.damagingEntity;
            return !b || !(b instanceof sc.CompressedShockEntity) ? false : b.wallBounces < a.hpBreakReached
        }
    })
});
ig.baked = !0;
