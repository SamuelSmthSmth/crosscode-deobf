ig.module("impact.feature.navigation.navigation-steps").requires("impact.feature.navigation.navigation", "impact.base.action", "impact.base.event").defines(function() {
    function b(a, b, c) {
        if (!c) return true;
        if (a.maxTime && b.stepTimer <= 0 && !b.jumping) {
            c.interrupt();
            return true
        }
        return c.moveEntity() && !a.forceTime
    }
    var a = Vec3.create(),
        d = {
            ENEMY: function(a, b, c, d) {
                if (b = b.getTarget()) {
                    a.toEntity(b, c, void 0, d);
                    return true
                }
            },
            PROXY_OWNER: function(a, b, c, d) {
                if (b.combatant) {
                    a.toEntity(b.combatant, c, void 0, d);
                    return true
                }
            },
            PROXY_SRC: function(a, b, c, d) {
                if (b.sourceEntity) {
                    a.toEntity(b.sourceEntity, c, void 0, d);
                    return true
                }
            },
            COLLAB_ENTITY: function(a, b, c, d) {
                if (b.collabAttribs && b.collabAttribs.entity) {
                    a.toEntity(b.collabAttribs.entity, c, void 0, d);
                    return true
                }
            },
            COLLAB_POINT: function(a, b, c, d) {
                if (b.collabAttribs && b.collabAttribs.point) {
                    a.toPoint(b.collabAttribs.point, c, d);
                    return true
                }
            }
        };
    ig.ACTION_STEP.NAVIGATE_TO_TARGET = ig.ActionStepBase.extend({
        maxTime: 0,
        forceTime: false,
        distance: 0,
        planOnly: false,
        targetType: 0,
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation"
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "Keep moving, never stop until maxTime has been reached"
                },
                distance: {
                    _type: "Number",
                    _info: "The maximum amount of distance to the target"
                },
                planOnly: {
                    _type: "Boolean",
                    _info: "If true, only plan navigation, but don't execute it"
                },
                targetType: {
                    _type: "String",
                    _info: "Type of target",
                    _select: d
                },
                precise: {
                    _type: "Boolean",
                    _info: "Reach the target precisely, slowing down accordingly"
                }
            }
        }),
        init: function(a) {
            this.maxTime = a.maxTime || 0;
            this.distance =
                a.distance || 0;
            this.forceTime = a.forceTime || false;
            this.planOnly = a.planOnly || false;
            this.targetType = d[a.targetType] || d.ENEMY;
            this.precise = a.precise || false
        },
        start: function(a) {
            a.stepData.path = null;
            var b = a.nav ? a.nav.path : ig.navigation.getNavPath(a);
            if (this.targetType(b, a, this.distance, this.precise)) {
                a.stepTimer = a.stepTimer + this.maxTime;
                a.stepData.path = b
            }
        },
        run: function(a) {
            return this.planOnly ? true : b(this, a, a.stepData.path)
        }
    });
    var c = {
        ENEMY: function(a, b, c, d) {
            if (b = b.getTarget()) {
                a.runAway(b, c, d);
                return true
            }
        },
        COLLAB_ENTITY: function(a, b, c, d) {
            if (b.collabAttribs && b.collabAttribs.entity) {
                a.runAway(b.collabAttribs.entity, c, d);
                return true
            }
        }
    };
    ig.ACTION_STEP.NAVIGATE_ESCAPE_TARGET = ig.ActionStepBase.extend({
        maxTime: 0,
        maxTimeAggro: 0,
        distance: 0,
        throwing: false,
        planOnly: false,
        targetType: 0,
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation"
                },
                maxTimeAggro: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation, when harder enemies is true.",
                    _optional: true
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "Keep moving, never stop until maxTime has been reached"
                },
                distance: {
                    _type: "Number",
                    _info: "The minimum amount of distance to the target"
                },
                throwing: {
                    _type: "Boolean",
                    _info: "True if after escape, entity should be able to throw at target"
                },
                planOnly: {
                    _type: "Boolean",
                    _info: "If true, only plan navigation, but don't execute it"
                },
                targetType: {
                    _type: "String",
                    _info: "Type of target",
                    _select: c
                }
            }
        }),
        init: function(a) {
            this.maxTime = a.maxTime || 0;
            this.maxTimeAggro = a.maxTimeAggro || 0;
            this.forceTime = a.forceTime || false;
            this.distance = a.distance || 0;
            this.throwing = a.throwing || false;
            this.planOnly = a.planOnly || false;
            this.targetType = c[a.targetType] || c.ENEMY
        },
        start: function(a) {
            a.stepData.path = null;
            var b = a.nav ? a.nav.path : ig.navigation.getNavPath(a);
            if (this.targetType(b, a, this.distance, this.throwing)) {
                a.stepTimer = a.stepTimer + (sc.newgame.hasHarderEnemies() && this.maxTimeAggro ? this.maxTimeAggro : this.maxTime);
                a.stepData.path = b
            }
        },
        run: function(a) {
            return this.planOnly ? true : b(this, a, a.stepData.path)
        }
    });
    ig.ACTION_STEP.NAVIGATE_SIDEWAYS_TARGET =
        ig.ActionStepBase.extend({
            maxTime: 0,
            distance: 0,
            distVariance: 0,
            throwing: false,
            planOnly: false,
            _wm: new ig.Config({
                attributes: {
                    maxTime: {
                        _type: "Number",
                        _info: "Maximum time spent on navigation"
                    },
                    maxTimeAggro: {
                        _type: "Number",
                        _info: "Maximum time spent on navigation, when harder enemies is true.",
                        _optional: true
                    },
                    forceTime: {
                        _type: "Boolean",
                        _info: "Keep moving, never stop until maxTime has been reached"
                    },
                    distance: {
                        _type: "Number",
                        _info: "The minimum amount of distance to move"
                    },
                    distVariance: {
                        _type: "Number",
                        _info: "The maximum amount of distance to move"
                    },
                    keepDirection: {
                        _type: "Boolean",
                        _info: "If true: always move close to face direction."
                    },
                    throwing: {
                        _type: "Boolean",
                        _info: "True if after sideway movement, entity should be able to throw at target"
                    },
                    planOnly: {
                        _type: "Boolean",
                        _info: "If true, only plan navigation, but don't execute it"
                    },
                    forceMinTargetDistance: {
                        _type: "Number",
                        _info: "If defined always force this minimum distance to the target",
                        _optional: true
                    },
                    precise: {
                        _type: "Boolean",
                        _info: "Reach the target precisely, slowing down accordingly"
                    }
                }
            }),
            init: function(a) {
                this.maxTime =
                    a.maxTime || 0;
                this.maxTimeAggro = a.maxTimeAggro || 0;
                this.forceTime = a.forceTime || false;
                this.distance = a.distance || 0;
                this.distVariance = a.distVariance || 0;
                this.throwing = a.throwing || false;
                this.planOnly = a.planOnly || false;
                this.keepDirection = a.keepDirection || false;
                this.forceMinTargetDistance = a.forceMinTargetDistance || 0;
                this.forceMaxTargetDistance = a.forceMaxTargetDistance || 0;
                this.precise = a.precise || false
            },
            start: function(a) {
                a.stepData.path = null;
                var b = a.getTarget();
                if (b) {
                    a.stepTimer = a.stepTimer + (sc.newgame.hasHarderEnemies() &&
                        this.maxTimeAggro ? this.maxTimeAggro : this.maxTime);
                    var c = a.nav ? a.nav.path : ig.navigation.getNavPath(a),
                        b = a.getTarget();
                    c.sideways(b, this.distance, this.distVariance, this.throwing, this.keepDirection, this.forceMinTargetDistance, this.forceMaxTargetDistance, this.precise);
                    a.stepData.path = c
                }
            },
            run: function(a) {
                return this.planOnly ? true : b(this, a, a.stepData.path)
            }
        });
    var e = {
        KEEP: 0,
        CLOCKWISE: 1,
        COUNTERCLOCKWISE: 2
    };
    ig.ACTION_STEP.NAVIGATE_RANGE_TARGET = ig.ActionStepBase.extend({
        maxTime: 0,
        maxTimeAggro: 0,
        distance: 0,
        throwing: false,
        planOnly: false,
        targetType: 0,
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation"
                },
                maxTimeAggro: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation, when harder enemies is true.",
                    _optional: true
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "Keep moving, never stop until maxTime has been reached"
                },
                moveDist: {
                    _type: "Number",
                    _info: "The (maximum) movement dist"
                },
                minMoveDist: {
                    _type: "Number",
                    _info: "The minimum movement dist",
                    _optional: true
                },
                targetDistGoal: {
                    _type: "Number",
                    _info: "Preferred distance to target"
                },
                throwing: {
                    _type: "Boolean",
                    _info: "True if after escape, entity should be able to throw at target"
                },
                avoidSideway: {
                    _type: "Boolean",
                    _info: "If true: avoid sideway motion by reducing movement distance"
                },
                planOnly: {
                    _type: "Boolean",
                    _info: "If true, only plan navigation, but don't execute it"
                },
                direction: {
                    _type: "String",
                    _info: "Which direciton to go sideway in",
                    _select: e,
                    _withNull: true
                }
            }
        }),
        init: function(a) {
            this.maxTime = a.maxTime || 0;
            this.maxTimeAggro = a.maxTimeAggro || 0;
            this.forceTime =
                a.forceTime || false;
            this.moveDist = a.moveDist || 0;
            this.minMoveDist = a.minMoveDist || 0;
            this.targetDistGoal = a.targetDistGoal || 0;
            this.throwing = a.throwing || false;
            this.avoidSideway = a.avoidSideway || false;
            this.planOnly = a.planOnly || false;
            this.targetType = c[a.targetType] || c.ENEMY;
            this.direction = e[a.direction]
        },
        start: function(a) {
            a.stepData.path = null;
            var b = a.nav ? a.nav.path : ig.navigation.getNavPath(a),
                c = a.getTarget();
            if (c) {
                if (this.direction) {
                    ig.CollTools.getDistVec2(a.coll, c.coll, b.lastSideWayDir);
                    this.direction ==
                        e.COUNTERCLOCKWISE ? Vec2.rotate90CCW(b.lastSideWayDir) : Vec2.rotate90CW(b.lastSideWayDir)
                }
                b.moveRange(c, this.moveDist, this.minMoveDist, this.targetDistGoal, this.throwing, this.avoidSideway);
                a.stepTimer = a.stepTimer + (sc.newgame.hasHarderEnemies() && this.maxTimeAggro ? this.maxTimeAggro : this.maxTime);
                a.stepData.path = b
            }
        },
        run: function(a) {
            return this.planOnly ? true : b(this, a, a.stepData.path)
        }
    });
    ig.ACTION_STEP.NAVIGATE_TO_ENTITY = ig.ActionStepBase.extend({
        entity: null,
        maxTime: 0,
        distance: 0,
        ignoreBelow: 0,
        planOnly: false,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to move to"
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation"
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "Keep moving, never stop until maxTime has been reached"
                },
                distance: {
                    _type: "Number",
                    _info: "The entity will move as close as to this distance "
                },
                ignoreBelow: {
                    _type: "Number",
                    _info: "The entity will not move if distance is below this value"
                },
                planOnly: {
                    _type: "Boolean",
                    _info: "If true, only plan navigation, but don't execute it"
                },
                precise: {
                    _type: "Boolean",
                    _info: "Reach the target precisely, slowing down accordingly"
                },
                assistSlow: {
                    _type: "Boolean",
                    _info: "If true: Slow down in Assist Mode"
                }
            }
        }),
        init: function(a) {
            this.entity = a.entity;
            this.maxTime = a.maxTime || 0;
            this.forceTime = a.forceTime || false;
            this.distance = a.distance || 0;
            this.ignoreBelow = a.ignoreBelow || 0;
            this.planOnly = a.planOnly || false;
            this.precise = a.precise || false;
            this.assistSlow = a.assistSlow || false
        },
        start: function(a) {
            var b = ig.Event.getEntity(this.entity);
            a.stepData.path = null;
            if (b &&
                !(a.distanceTo(b) < this.ignoreBelow)) {
                var c = this.maxTime;
                this.assistSlow && (c = c / sc.options.get("assist-attack-frequency"));
                a.stepTimer = a.stepTimer + c;
                c = a.nav ? a.nav.path : ig.navigation.getNavPath(a);
                c.toEntity(b, this.distance, void 0, this.precise);
                a.stepData.path = c
            }
        },
        run: function(a) {
            return this.planOnly ? true : b(this, a, a.stepData.path)
        }
    });
    ig.ACTION_STEP.NAVIGATE_ESCAPE_ENTITY = ig.ActionStepBase.extend({
        entity: null,
        maxTime: 0,
        distance: 0,
        throwing: false,
        planOnly: false,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to escape from"
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation"
                },
                distance: {
                    _type: "Number",
                    _info: "The minimum amount of distance to the target"
                },
                throwing: {
                    _type: "Boolean",
                    _info: "True if after escape, entity should be able to throw at target"
                },
                planOnly: {
                    _type: "Boolean",
                    _info: "If true, only plan navigation, but don't execute it"
                }
            }
        }),
        init: function(a) {
            this.entity = a.entity;
            this.maxTime = a.maxTime || 0;
            this.distance = a.distance || 0;
            this.throwing = a.throwing || false;
            this.planOnly =
                a.planOnly || false
        },
        start: function(a) {
            var b = ig.Event.getEntity(this.entity);
            a.stepData.path = null;
            if (b) {
                a.stepTimer = a.stepTimer + this.maxTime;
                var c = a.nav ? a.nav.path : ig.navigation.getNavPath(a);
                c.runAway(b, this.distance, this.throwing);
                a.stepData.path = c
            }
        },
        run: function(a) {
            return this.planOnly ? true : b(this, a, a.stepData.path)
        }
    });
    ig.ACTION_STEP.NAVIGATE_DODGE = ig.ActionStepBase.extend({
        maxTime: 0,
        distance: 0,
        planOnly: false,
        dodgeType: null,
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation"
                },
                distance: {
                    _type: "Number",
                    _info: "The minimum amount of distance to the target"
                },
                planOnly: {
                    _type: "Boolean",
                    _info: "If true, only plan navigation, but don't execute it"
                },
                dodgeType: {
                    _type: "String",
                    _info: "Type of dodging.",
                    _select: ig.NAV_DODGE_TYPE
                }
            }
        }),
        init: function(a) {
            this.maxTime = a.maxTime || 0;
            this.distance = a.distance || 0;
            this.planOnly = a.planOnly || false;
            this.dodgeType = ig.NAV_DODGE_TYPE[a.dodgeType] || ig.NAV_DODGE_TYPE[a.NEUTRAL]
        },
        start: function(a) {
            var b = a.threat || a.getTarget();
            a.stepData.path = null;
            if (b) {
                a.stepTimer =
                    a.stepTimer + this.maxTime;
                var c = a.nav ? a.nav.path : ig.navigation.getNavPath(a);
                c.dodge(b, this.distance, this.dodgeType);
                a.stepData.path = c
            }
        },
        run: function(a) {
            return this.planOnly ? true : b(this, a, a.stepData.path)
        }
    });
    ig.ACTION_STEP.NAVIGATE_TO_POINT = ig.ActionStepBase.extend({
        target: true,
        maxTime: 0,
        distance: 0,
        precise: false,
        planOnly: false,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Vec3",
                    _info: "Point to navigate to",
                    _actorOption: true,
                    _visualize: true,
                    _pointSelect: true
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation. If 0=keep executing until done."
                },
                distance: {
                    _type: "Number",
                    _info: "The maximum amount of distance to the target"
                },
                precise: {
                    _type: "Boolean",
                    _info: "Reach the target precisely, slowing down accordingly"
                },
                planOnly: {
                    _type: "Boolean",
                    _info: "If true, only plan navigation, but don't execute it"
                },
                teleportOnFail: {
                    _type: "Boolean",
                    _info: "If navigation fails, teleport entity to target pos"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "target");
            this.target = a.target;
            this.maxTime = a.maxTime || 0;
            this.distance = a.distance || 0;
            this.precise = a.precise || false;
            this.planOnly =
                a.planOnly || false;
            this.teleportOnFail = a.teleportOnFail || false
        },
        start: function(b) {
            b.stepTimer = b.stepTimer + this.maxTime;
            var c = ig.Action.getVec3(this.target, b, a);
            if (c) {
                var d = b.nav ? b.nav.path : ig.navigation.getNavPath(b);
                d.toPoint(c, this.distance, this.precise);
                b.stepData.path = d;
                b.setRespawnPoint && b.setRespawnPoint(c)
            } else b.stepData.path = null
        },
        run: function(c) {
            if (this.planOnly) return true;
            var d = b(this, c, c.stepData.path);
            if (this.teleportOnFail && (c.nav.path.failCount > 0 || this.maxTime && c.stepTimer <= 0) && c &&
                c.doQuickRespawn && c.setRespawnPoint) {
                d = ig.Action.getVec3(this.target, c, a);
                c.setRespawnPoint(d);
                c.doQuickRespawn(0, true);
                return true
            }
            return d
        }
    });
    ig.ACTION_STEP.DO_NAVIGATION = ig.ActionStepBase.extend({
        maxTime: 0,
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time spent on navigation"
                }
            }
        }),
        init: function(a) {
            this.maxTime = a.maxTime || 0
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime
        },
        run: function(a) {
            return !a.nav ? true : b(this, a, a.nav.path)
        }
    });
    ig.ACTION_STEP.CANCEL_IF_NAVIGATION_FAILED =
        ig.ActionStepBase.extend({
            time: 0,
            _wm: new ig.Config({
                attributes: {
                    time: {
                        _type: "Number",
                        _info: "Time to wait before canceling"
                    }
                }
            }),
            init: function(a) {
                this.time = a.time;
                if (this.time == void 0) this.time = 0.5
            },
            start: function(a) {
                a.stepTimer = a.stepTimer + this.time
            },
            run: function(a) {
                if (!a.nav || a.nav.path.failCount == 0) return true;
                if (a.stepTimer > 0) return false;
                a.cancelAction();
                return true
            }
        });
    ig.ACTION_STEP.SET_ATTRIB_CLOSE_TARGET_POS = ig.ActionStepBase.extend({
        name: null,
        distance: 0,
        searchType: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of actor attribute to set"
                },
                searchType: {
                    _type: "Number",
                    _info: "Determines where position is searched relative to target",
                    _select: ig.NAV_CLOSE_POINT_SEARCH
                },
                distance: {
                    _type: "Number",
                    _info: "Preferred distance to target. Might end up being smaller"
                },
                centralAngle: {
                    _type: "Number",
                    _info: "How much to circle around preferred position. 1 = full circle",
                    _default: 0.7
                },
                dirRotate: {
                    _type: "Number",
                    _info: "Additional rotation to preferred placement direction (relative to target)",
                    _optional: true
                },
                throwing: {
                    _type: "Boolean",
                    _info: "True entity should be able to throw at target from found position"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to position",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            this.name = a.name;
            this.searchType = ig.NAV_CLOSE_POINT_SEARCH[a.searchType] || ig.NAV_CLOSE_POINT_SEARCH.RANDOM;
            this.distance = a.distance || 32;
            this.centralAngle = a.centralAngle || 0.7;
            this.dirRotate = a.dirRotate || 0;
            this.throwing = a.throwing || false;
            this.offset = a.offset || null
        },
        run: function(b) {
            var c = Vec3.create(),
                d = b.getTarget();
            if (d) {
                ig.navigation.getClosePosition(c,
                    b.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a), b.coll.size, d, null, this.distance, this.centralAngle, this.dirRotate, this.searchType, this.throwing);
                this.offset && Vec3.add(c, this.offset);
                b.setAttribute(this.name, c)
            }
            return true
        }
    });
    ig.ACTION_STEP.SET_ATTRIB_TARGET_DELTA_POS = ig.ActionStepBase.extend({
        name: null,
        distance: 0,
        searchType: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of actor attribute to set"
                },
                searchType: {
                    _type: "Number",
                    _info: "Determines where position is searched relative to target",
                    _select: ig.NAV_CLOSE_POINT_SEARCH
                },
                distance: {
                    _type: "Number",
                    _info: "Preferred distance to target. Might end up being smaller"
                },
                centralAngle: {
                    _type: "Number",
                    _info: "How much to circle around preferred position. 1 = full circle",
                    _default: 0.7
                },
                dirRotate: {
                    _type: "Number",
                    _info: "Additional rotation to preferred placement direction (relative to target)",
                    _optional: true
                },
                throwing: {
                    _type: "Boolean",
                    _info: "True entity should be able to throw at target from found position"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to position",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            this.name = a.name;
            this.searchType = ig.NAV_CLOSE_POINT_SEARCH[a.searchType] || ig.NAV_CLOSE_POINT_SEARCH.RANDOM;
            this.distance = a.distance || 32;
            this.centralAngle = a.centralAngle || 0.7;
            this.dirRotate = a.dirRotate || 0;
            this.throwing = a.throwing || false;
            this.offset = a.offset || null
        },
        run: function(b) {
            var c = Vec3.create(),
                d = b.getTarget();
            if (d) {
                ig.navigation.getClosePosition(c, b.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a), b.coll.size, d, null, this.distance, this.centralAngle, this.dirRotate, this.searchType,
                    this.throwing);
                this.offset && Vec3.add(c, this.offset);
                b.setAttribute(this.name, c)
            }
            return true
        }
    });
    ig.ACTION_STEP.SET_ATTRIB_NAV_TARGET_POS = ig.ActionStepBase.extend({
        name: null,
        distance: 0,
        searchType: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of actor attribute to set"
                }
            }
        }),
        init: function(a) {
            this.name = a.name
        },
        run: function(a) {
            if (a.nav && a.nav.path && a.nav.path.targetPos) {
                a.setAttribute(this.name, a.nav.path.targetPos);
                return true
            }
        }
    })
});
ig.baked = !0;
