/**
 * impact.feature.navigation.navigation-steps
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.navigation.navigation-steps")`.
 *
 * Action steps that drive `ig.NavigationEntity` pathfinding: navigate toward /
 * away from / around a target (entity or point), dodge, plus steps that stash
 * computed positions into actor attributes (SET_ATTRIB_*).
 */
ig.module("impact.feature.navigation.navigation-steps")
    .requires("impact.feature.navigation.navigation", "impact.base.action", "impact.base.event")
    .defines(function () {

    /**
     * Shared runner: done when there is no path; interrupt the path when the
     * step's maxTime ran out (and the entity isn't mid-jump); otherwise keep
     * moving while the path allows it (unless forceTime keeps the step alive).
     */
    function advanceNavigation(step, entity, path) {
        if (!path) return true;
        if (step.maxTime && entity.stepTimer <= 0 && !entity.jumping) {
            path.interrupt();
            return true;
        }
        return path.moveEntity() && !step.forceTime;
    }

    var scratchVec3 = Vec3.create(),

        /** Resolves which entity/point a NAVIGATE_TO step should aim at. */
        targetType = {
            ENEMY: function (path, entity, distance, precise) {
                if (entity = entity.getTarget()) {
                    path.toEntity(entity, distance, void 0, precise);
                    return true;
                }
            },
            PROXY_OWNER: function (path, entity, distance, precise) {
                if (entity.combatant) {
                    path.toEntity(entity.combatant, distance, void 0, precise);
                    return true;
                }
            },
            PROXY_SRC: function (path, entity, distance, precise) {
                if (entity.sourceEntity) {
                    path.toEntity(entity.sourceEntity, distance, void 0, precise);
                    return true;
                }
            },
            COLLAB_ENTITY: function (path, entity, distance, precise) {
                if (entity.collabAttribs && entity.collabAttribs.entity) {
                    path.toEntity(entity.collabAttribs.entity, distance, void 0, precise);
                    return true;
                }
            },
            COLLAB_POINT: function (path, entity, distance, precise) {
                if (entity.collabAttribs && entity.collabAttribs.point) {
                    path.toPoint(entity.collabAttribs.point, distance, precise);
                    return true;
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
                    _select: targetType
                },
                precise: {
                    _type: "Boolean",
                    _info: "Reach the target precisely, slowing down accordingly"
                }
            }
        }),

        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
            this.distance = settings.distance || 0;
            this.forceTime = settings.forceTime || false;
            this.planOnly = settings.planOnly || false;
            this.targetType = targetType[settings.targetType] || targetType.ENEMY;
            this.precise = settings.precise || false;
        },

        start: function (entity) {
            entity.stepData.path = null;
            var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity);
            if (this.targetType(path, entity, this.distance, this.precise)) {
                entity.stepTimer = entity.stepTimer + this.maxTime;
                entity.stepData.path = path;
            }
        },

        run: function (entity) {
            return this.planOnly ? true : advanceNavigation(this, entity, entity.stepData.path);
        }
    });

    /** Resolves which entity a NAVIGATE_ESCAPE step should flee from. */
    var escapeTargetType = {
        ENEMY: function (path, entity, distance, throwing) {
            if (entity = entity.getTarget()) {
                path.runAway(entity, distance, throwing);
                return true;
            }
        },
        COLLAB_ENTITY: function (path, entity, distance, throwing) {
            if (entity.collabAttribs && entity.collabAttribs.entity) {
                path.runAway(entity.collabAttribs.entity, distance, throwing);
                return true;
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
                    _select: escapeTargetType
                }
            }
        }),

        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
            this.maxTimeAggro = settings.maxTimeAggro || 0;
            this.forceTime = settings.forceTime || false;
            this.distance = settings.distance || 0;
            this.throwing = settings.throwing || false;
            this.planOnly = settings.planOnly || false;
            this.targetType = escapeTargetType[settings.targetType] || escapeTargetType.ENEMY;
        },

        start: function (entity) {
            entity.stepData.path = null;
            var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity);
            if (this.targetType(path, entity, this.distance, this.throwing)) {
                entity.stepTimer = entity.stepTimer + (sc.newgame.hasHarderEnemies() && this.maxTimeAggro ? this.maxTimeAggro : this.maxTime);
                entity.stepData.path = path;
            }
        },

        run: function (entity) {
            return this.planOnly ? true : advanceNavigation(this, entity, entity.stepData.path);
        }
    });

    ig.ACTION_STEP.NAVIGATE_SIDEWAYS_TARGET = ig.ActionStepBase.extend({
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

        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
            this.maxTimeAggro = settings.maxTimeAggro || 0;
            this.forceTime = settings.forceTime || false;
            this.distance = settings.distance || 0;
            this.distVariance = settings.distVariance || 0;
            this.throwing = settings.throwing || false;
            this.planOnly = settings.planOnly || false;
            this.keepDirection = settings.keepDirection || false;
            this.forceMinTargetDistance = settings.forceMinTargetDistance || 0;
            this.forceMaxTargetDistance = settings.forceMaxTargetDistance || 0;
            this.precise = settings.precise || false;
        },

        start: function (entity) {
            entity.stepData.path = null;
            var target = entity.getTarget();
            if (target) {
                entity.stepTimer = entity.stepTimer + (sc.newgame.hasHarderEnemies() && this.maxTimeAggro ? this.maxTimeAggro : this.maxTime);
                var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity),
                    target = entity.getTarget();
                path.sideways(target, this.distance, this.distVariance, this.throwing, this.keepDirection, this.forceMinTargetDistance, this.forceMaxTargetDistance, this.precise);
                entity.stepData.path = path;
            }
        },

        run: function (entity) {
            return this.planOnly ? true : advanceNavigation(this, entity, entity.stepData.path);
        }
    });

    /** Sideways direction presets for NAVIGATE_RANGE_TARGET. */
    var rangeDirection = {
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
                    _select: rangeDirection,
                    _withNull: true
                }
            }
        }),

        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
            this.maxTimeAggro = settings.maxTimeAggro || 0;
            this.forceTime = settings.forceTime || false;
            this.moveDist = settings.moveDist || 0;
            this.minMoveDist = settings.minMoveDist || 0;
            this.targetDistGoal = settings.targetDistGoal || 0;
            this.throwing = settings.throwing || false;
            this.avoidSideway = settings.avoidSideway || false;
            this.planOnly = settings.planOnly || false;
            this.targetType = escapeTargetType[settings.targetType] || escapeTargetType.ENEMY;
            this.direction = rangeDirection[settings.direction];
        },

        start: function (entity) {
            entity.stepData.path = null;
            var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity),
                target = entity.getTarget();
            if (target) {
                if (this.direction) {
                    ig.CollTools.getDistVec2(entity.coll, target.coll, path.lastSideWayDir);
                    this.direction == rangeDirection.COUNTERCLOCKWISE ? Vec2.rotate90CCW(path.lastSideWayDir) : Vec2.rotate90CW(path.lastSideWayDir);
                }
                path.moveRange(target, this.moveDist, this.minMoveDist, this.targetDistGoal, this.throwing, this.avoidSideway);
                entity.stepTimer = entity.stepTimer + (sc.newgame.hasHarderEnemies() && this.maxTimeAggro ? this.maxTimeAggro : this.maxTime);
                entity.stepData.path = path;
            }
        },

        run: function (entity) {
            return this.planOnly ? true : advanceNavigation(this, entity, entity.stepData.path);
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

        init: function (settings) {
            this.entity = settings.entity;
            this.maxTime = settings.maxTime || 0;
            this.forceTime = settings.forceTime || false;
            this.distance = settings.distance || 0;
            this.ignoreBelow = settings.ignoreBelow || 0;
            this.planOnly = settings.planOnly || false;
            this.precise = settings.precise || false;
            this.assistSlow = settings.assistSlow || false;
        },

        start: function (entity) {
            var target = ig.Event.getEntity(this.entity);
            entity.stepData.path = null;
            if (target && !(entity.distanceTo(target) < this.ignoreBelow)) {
                var maxTime = this.maxTime;
                this.assistSlow && (maxTime = maxTime / sc.options.get("assist-attack-frequency"));
                entity.stepTimer = entity.stepTimer + maxTime;
                var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity);
                path.toEntity(target, this.distance, void 0, this.precise);
                entity.stepData.path = path;
            }
        },

        run: function (entity) {
            return this.planOnly ? true : advanceNavigation(this, entity, entity.stepData.path);
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

        init: function (settings) {
            this.entity = settings.entity;
            this.maxTime = settings.maxTime || 0;
            this.distance = settings.distance || 0;
            this.throwing = settings.throwing || false;
            this.planOnly = settings.planOnly || false;
        },

        start: function (entity) {
            var target = ig.Event.getEntity(this.entity);
            entity.stepData.path = null;
            if (target) {
                entity.stepTimer = entity.stepTimer + this.maxTime;
                var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity);
                path.runAway(target, this.distance, this.throwing);
                entity.stepData.path = path;
            }
        },

        run: function (entity) {
            return this.planOnly ? true : advanceNavigation(this, entity, entity.stepData.path);
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

        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
            this.distance = settings.distance || 0;
            this.planOnly = settings.planOnly || false;
            this.dodgeType = ig.NAV_DODGE_TYPE[settings.dodgeType] || ig.NAV_DODGE_TYPE[settings.NEUTRAL];
        },

        start: function (entity) {
            var threat = entity.threat || entity.getTarget();
            entity.stepData.path = null;
            if (threat) {
                entity.stepTimer = entity.stepTimer + this.maxTime;
                var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity);
                path.dodge(threat, this.distance, this.dodgeType);
                entity.stepData.path = path;
            }
        },

        run: function (entity) {
            return this.planOnly ? true : advanceNavigation(this, entity, entity.stepData.path);
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

        init: function (settings) {
            assertContent(settings, "target");
            this.target = settings.target;
            this.maxTime = settings.maxTime || 0;
            this.distance = settings.distance || 0;
            this.precise = settings.precise || false;
            this.planOnly = settings.planOnly || false;
            this.teleportOnFail = settings.teleportOnFail || false;
        },

        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime;
            var point = ig.Action.getVec3(this.target, entity, scratchVec3);
            if (point) {
                var path = entity.nav ? entity.nav.path : ig.navigation.getNavPath(entity);
                path.toPoint(point, this.distance, this.precise);
                entity.stepData.path = path;
                entity.setRespawnPoint && entity.setRespawnPoint(point);
            } else {
                entity.stepData.path = null;
            }
        },

        run: function (entity) {
            if (this.planOnly) return true;
            var running = advanceNavigation(this, entity, entity.stepData.path);
            if (this.teleportOnFail &&
                (entity.nav.path.failCount > 0 || this.maxTime && entity.stepTimer <= 0) &&
                entity && entity.doQuickRespawn && entity.setRespawnPoint) {
                var point = ig.Action.getVec3(this.target, entity, scratchVec3);
                entity.setRespawnPoint(point);
                entity.doQuickRespawn(0, true);
                return true;
            }
            return running;
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

        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
        },

        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime;
        },

        run: function (entity) {
            return !entity.nav ? true : advanceNavigation(this, entity, entity.nav.path);
        }
    });

    ig.ACTION_STEP.CANCEL_IF_NAVIGATION_FAILED = ig.ActionStepBase.extend({
        time: 0,

        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Time to wait before canceling"
                }
            }
        }),

        init: function (settings) {
            this.time = settings.time;
            if (this.time == void 0) this.time = 0.5;
        },

        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.time;
        },

        run: function (entity) {
            if (!entity.nav || entity.nav.path.failCount == 0) return true;
            if (entity.stepTimer > 0) return false;
            entity.cancelAction();
            return true;
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

        init: function (settings) {
            this.name = settings.name;
            this.searchType = ig.NAV_CLOSE_POINT_SEARCH[settings.searchType] || ig.NAV_CLOSE_POINT_SEARCH.RANDOM;
            this.distance = settings.distance || 32;
            this.centralAngle = settings.centralAngle || 0.7;
            this.dirRotate = settings.dirRotate || 0;
            this.throwing = settings.throwing || false;
            this.offset = settings.offset || null;
        },

        run: function (entity) {
            var pos = Vec3.create(),
                target = entity.getTarget();
            if (target) {
                ig.navigation.getClosePosition(pos,
                    entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, scratchVec3), entity.coll.size, target, null, this.distance, this.centralAngle, this.dirRotate, this.searchType, this.throwing);
                this.offset && Vec3.add(pos, this.offset);
                entity.setAttribute(this.name, pos);
            }
            return true;
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

        init: function (settings) {
            this.name = settings.name;
            this.searchType = ig.NAV_CLOSE_POINT_SEARCH[settings.searchType] || ig.NAV_CLOSE_POINT_SEARCH.RANDOM;
            this.distance = settings.distance || 32;
            this.centralAngle = settings.centralAngle || 0.7;
            this.dirRotate = settings.dirRotate || 0;
            this.throwing = settings.throwing || false;
            this.offset = settings.offset || null;
        },

        run: function (entity) {
            var pos = Vec3.create(),
                target = entity.getTarget();
            if (target) {
                ig.navigation.getClosePosition(pos,
                    entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, scratchVec3), entity.coll.size, target, null, this.distance, this.centralAngle, this.dirRotate, this.searchType, this.throwing);
                this.offset && Vec3.add(pos, this.offset);
                entity.setAttribute(this.name, pos);
            }
            return true;
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

        init: function (settings) {
            this.name = settings.name;
        },

        run: function (entity) {
            if (entity.nav && entity.nav.path && entity.nav.path.targetPos) {
                entity.setAttribute(this.name, entity.nav.path.targetPos);
                return true;
            }
        }
    });
});
ig.baked = !0;
