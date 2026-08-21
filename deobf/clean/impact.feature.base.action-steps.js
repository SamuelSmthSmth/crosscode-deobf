/**
 * impact.feature.base.action-steps
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.base.action-steps")`.
 *
 * Every `ig.ACTION_STEP.*` step class used inside actor `ig.Action` scripts.
 * Each class provides `init(settings)` (parse the step's editor config),
 * plus `start(entity)` / `run(entity)` where `entity` is the acting
 * `ig.ActorEntity` (`entity.coll`, `entity.stepTimer`, `entity.stepData`…).
 * The `_wm` blocks are editor-only config metadata and are kept verbatim.
 */

ig.module("impact.feature.base.action-steps").requires("impact.base.action", "impact.base.actor-entity").defines(function () {
    function isSoundHandle(sound) {
        return sound instanceof ig.SoundHandle
    }

    var scratchVecA = Vec2.create(),
        scratchVecB = Vec2.create(),
        scratchVecC = Vec2.create();

    ig.ACTION_STEP.LABEL = ig.ActionStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of the label"
                }
            },
            label: function () {
                return "<b>LABEL</b> <i>" + this.name + "</i>"
            }
        }),
        init: function (settings) {
            assertContent(settings, "name");
            this.name = settings.name
        }
    });
    ig.ACTION_STEP.GOTO_LABEL =
        ig.ActionStepBase.extend({
            name: null,
            _wm: new ig.Config({
                attributes: {
                    name: {
                        _type: "String",
                        _info: "Label to move to."
                    }
                },
                label: function () {
                    return "<b>GOTO_LABEL</b> <i>" + this.name + "</i>"
                }
            }),
            init: function (settings) {
                assertContent(settings, "name");
                this.name = settings.name
            },
            getJumpLabelName: function () {
                return this.name
            }
        });

    var branchPattern = /^(\d+)_(\d+)$/;
    ig.ACTION_STEP.SELECT_RANDOM = ig.ActionStepBase.extend({
        options: [],
        branches: {},
        _wm: new ig.Config({
            attributes: {
                options: {
                    _type: "RandomDistribution",
                    _info: "RandomDistribution",
                    _noLabel: true
                }
            },
            branchLabel: function (branchName) {
                if (branchName == "_end") return "END_SELECT_RANDOM";
                var match = branchPattern.exec(branchName);
                if (match) {
                    var optionIndex = match[1],
                        entryIndex = match[2],
                        conditionText = "";
                    this.options[optionIndex].activeCondition && (conditionText = conditionText + ("(" + this.options[optionIndex].activeCondition + ")"));
                    return "Entry " + optionIndex + " #" + entryIndex + " " + conditionText + " weight " + this.options[optionIndex].weight
                }
                return "???"
            }
        }),
        init: function (settings) {
            for (var options = settings.options || [], i = 0; i < options.length; ++i) {
                var option = {
                    count: options[i].count,
                    weight: options[i].weight,
                    activeCondition: new ig.VarCondition(options[i].activeCondition)
                };
                option.prob = option.count * option.weight;
                this.options[i] = option
            }
        },
        getBranchNames: function () {
            for (var branchNames = [], i = 0; i < this.options.length; ++i)
                for (var option = this.options[i], j = 0; j < option.count; ++j) branchNames.push(i + "_" + j);
            return branchNames
        },
        getNext: function () {
            for (var totalProb = 0, i = this.options.length; i--;) this.options[i].activeCondition.evaluate() && (totalProb = totalProb + this.options[i].prob);
            totalProb = Math.random() * totalProb;
            for (i = this.options.length; i--;)
                if (this.options[i].activeCondition.evaluate())
                    if (totalProb >= this.options[i].prob) totalProb = totalProb - this.options[i].prob;
                    else break;
            var selected = this.options[i];
            if (!selected) return this._nextStep;
            selected = Math.floor(selected.count * Math.random());
            return this.branches[i + "_" + selected] || this._nextStep
        }
    });
    ig.ACTION_STEP.SELECT_FIRST =
        ig.ActionStepBase.extend({
            options: [],
            branches: {},
            _wm: new ig.Config({
                attributes: {
                    options: {
                        _type: "Array",
                        _info: "Face direction options",
                        _sub: {
                            _type: "VarCondition",
                            _popup: true
                        }
                    }
                },
                width: 600,
                branchLabel: function (branchName) {
                    if (branchName == "_end") return "END_SELECT_RANDOM";
                    var conditionText;
                    conditionText = "" + ("(" + this.options[branchName] + ")");
                    return "Entry " + branchName + " " + conditionText
                }
            }),
            init: function (settings) {
                for (var options = settings.options || [], i = 0; i < options.length; ++i) {
                    var condition = new ig.VarCondition(options[i]);
                    this.options[i] = condition
                }
            },
            getBranchNames: function () {
                for (var branchNames = [], i = 0; i < this.options.length; ++i) branchNames.push(i);
                return branchNames
            },
            getNext: function () {
                for (var i = 0; i < this.options.length; ++i)
                    if (this.options[i].evaluate()) return this.branches[i];
                return this._nextStep
            }
        });
    ig.ACTION_STEP.RESET_ACTOR = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function (entity) {
            entity.defaultConfig.apply(entity)
        }
    });

    var guardTrapModes = {
        INCREASE: 1,
        INCREASE_AND_CLEAR: 2
    };
    ig.ACTION_STEP.WAIT = ig.ActionStepBase.extend({
        time: 0,
        aggroTime: 0,
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "NumberExpression",
                    _info: "Time to wait. -1 = Wait forever (use WISELY)"
                },
                aggroTime: {
                    _type: "NumberExpression",
                    _info: "Only works when 'harder nemeies' new game option is selected",
                    _optional: true
                },
                assistSlow: {
                    _type: "Boolean",
                    _info: "If true: Slow down in Assist Mode",
                    _optional: true
                },
                guardTrap: {
                    _type: "String",
                    _info: "Select how guard trap time should be modified ",
                    _optional: true,
                    _select: guardTrapModes
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "time");
            this.time = settings.time;
            this.aggroTime = settings.aggroTime || 0;
            this.assistSlow = settings.assistSlow || false;
            this.guardTrap = guardTrapModes[settings.guardTrap] || 0
        },
        start: function (entity) {
            entity.stepData.time =
                ig.Event.getExpressionValue(sc.newgame.hasHarderEnemies() && this.aggroTime ? this.aggroTime : this.time);
            if (this.assistSlow) entity.stepData.time = entity.stepData.time / sc.options.get("assist-attack-frequency");
            entity.stepTimer = entity.stepTimer + (entity.stepData.time || 0)
        },
        run: function (entity) {
            if (this.guardTrap) entity.combo.guardTrapTime = entity.combo.guardTrapTime + ig.system.tick;
            if (entity.stepData.time >= 0 && entity.stepTimer <= 0) {
                if (this.guardTrap == guardTrapModes.INCREASE_AND_CLEAR) entity.combo.guardTrapTime = 0;
                return true
            }
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL = ig.ActionStepBase.extend({
        condition: null,
        _wm: new ig.Config({
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition that must be true before continued"
                },
                maxTime: {
                    _type: "NumberExpression",
                    _info: "If defined: maximal wait this time",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.condition = new ig.VarCondition(settings.condition);
            this.maxTime = settings.maxTime
        },
        start: function (entity) {
            if (this.maxTime) entity.stepTimer = entity.stepTimer + ig.Event.getExpressionValue(this.maxTime)
        },
        run: function (entity) {
            return this.maxTime && entity.stepTimer <= 0 ? true : this.condition.evaluate()
        }
    });
    ig.ACTION_STEP.WAIT_RANDOM =
        ig.ActionStepBase.extend({
            maxTime: 0,
            minTime: 0,
            _wm: new ig.Config({
                attributes: {
                    minTime: {
                        _type: "Number",
                        _info: "Minimum time to wait"
                    },
                    maxTime: {
                        _type: "Number",
                        _info: "Maximum time to wait"
                    }
                }
            }),
            init: function (settings) {
                assertContent(settings, "minTime", "maxTime");
                this.minTime = settings.minTime;
                this.maxTime = settings.maxTime
            },
            start: function (entity) {
                entity.stepTimer = entity.stepTimer + (this.minTime + Math.random() * (this.maxTime - this.minTime))
            },
            run: function (entity) {
                return entity.stepTimer <= 0
            }
        });
    ig.ACTION_STEP.IF = ig.ActionStepBase.extend({
        condition: null,
        withElse: false,
        branches: {},
        _wm: new ig.Config({
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for IF statement"
                },
                withElse: {
                    _type: "Boolean",
                    _info: "With else case.",
                    _noLabel: true
                }
            },
            branchLabel: function (branchName) {
                switch (branchName) {
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
        init: function (settings) {
            this.condition = new ig.VarCondition(settings.condition);
            this.withElse = settings.withElse
        },
        getBranchNames: function () {
            return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
        },
        getNext: function () {
            return this.condition.evaluate() ?
                this.branches.thenStep ? this.branches.thenStep : this._nextStep : this.branches.elseStep ? this.branches.elseStep : this._nextStep
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_ON_GROUND = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "If defined: maximal wait this time",
                    _optional: true
                },
                alsoBelowTarget: {
                    _type: "Boolean",
                    _info: "If true also cancel if below target",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
            this.alsoBelowTarget = settings.alsoBelowTarget || false
        },
        start: function (entity) {
            entity.stepTimer =
                entity.stepTimer + this.maxTime
        },
        run: function (entity) {
            if (this.maxTime && entity.stepTimer <= 0 || entity.coll.vel.z >= 0 && !entity.coll.zGravityFactor) return true;
            if (this.alsoBelowTarget) {
                var target = entity.getTarget();
                if (target && target.coll.pos.z > entity.coll.pos.z) return true
            }
            return entity.coll.pos.z == entity.coll.baseZPos
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_PLAYER_ON_TOP = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                not: {
                    _type: "Boolean",
                    _info: "If true, wait until player is NOT on top anymore"
                },
                maxTime: {
                    _type: "Number",
                    _info: "If defined: maximal wait this time",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.maxTime = settings.maxTime || 0;
            this.not = settings.not || false
        },
        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime
        },
        run: function (entity) {
            if (this.maxTime && entity.stepTimer <= 0) return true;
            for (var entitiesOnTop = ig.game.getEntitiesOnTop(entity), i = entitiesOnTop.length; i--;)
                if (entitiesOnTop[i].isPlayer) return !this.not;
            return this.not
        }
    });
    ig.ACTION_STEP.MOVE_FORWARD = ig.ActionStepBase.extend({
        target: Vec2.create(),
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Time to move forward"
                },
                collideCancel: {
                    _type: "Number",
                    _info: "If defined: if angle to collided wall is lower than this value, cancel step",
                    _optional: true
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving forward"
                },
                waitUntil: {
                    _type: "VarCondition",
                    _info: "If defined: continue moving forward until condition evaluates to true. Duration is minimum wait",
                    _optional: true
                },
                maxTargetDistance: {
                    _type: "Number",
                    _info: "If defined, make sure to not move further than this distance to target",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "time");
            this.time = settings.time;
            this.collideCancel = settings.collideCancel;
            this.stopBeforeEdge = settings.stopBeforeEdge;
            if (settings.waitUntil) this.waitUntil = new ig.VarCondition(settings.waitUntil);
            this.maxTargetDistance = settings.maxTargetDistance || 0
        },
        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.time;
            if (this.maxTargetDistance) entity.stepData.startRelativeVel = entity.coll.relativeVel
        },
        run: function (entity) {
            Vec2.assign(entity.coll.accelDir, entity.face);
            if (this.collideCancel && ig.CollTools.hasWallCollide(entity.coll, this.collideCancel)) entity.stepTimer = 0;
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir,
                    0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0);
                if (this.collideCancel) entity.stepTimer = 0
            }
            if (this.maxTargetDistance) {
                var target = entity.getTarget();
                if (target) {
                    var moveFactor = ig.CollTools.getMaxDistMoveFactor(entity.coll, target.coll, this.maxTargetDistance);
                    if (moveFactor <= 0) {
                        Vec2.assignC(entity.coll.accelDir, 0, 0);
                        Vec2.assignC(entity.coll.vel, 0, 0)
                    } else if (moveFactor < 1) {
                        entity.coll.relativeVel = entity.coll.relativeVel * moveFactor;
                        Vec2.length(entity.coll.vel, entity.coll.maxVel * entity.coll.relativeVel * moveFactor)
                    }
                }
            }
            if ((!this.waitUntil || this.waitUntil.evaluate()) && entity.stepTimer <= 0) {
                if (this.maxTargetDistance) entity.coll.relativeVel = entity.stepData.startRelativeVel;
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.SLIDE_OUT = ig.ActionStepBase.extend({
        target: Vec2.create(),
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Maximum Time to slide out"
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving forward"
                }
            }
        }),
        init: function (settings) {
            this.time = settings.time;
            this.stopBeforeEdge = settings.stopBeforeEdge
        },
        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.time
        },
        run: function (entity) {
            Vec2.assign(entity.coll.accelDir, 0, 0);
            if (this.stopBeforeEdge &&
                ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0)
            }
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.MOVE_BACKWARD = ig.ActionStepBase.extend({
        target: Vec2.create(),
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Time to move backward"
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving backward"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "time");
            this.time = settings.time;
            this.stopBeforeEdge = settings.stopBeforeEdge
        },
        start: function (entity) {
            entity.stepTimer = +this.time;
            entity.stepData.prevFaceFix = entity.faceDirFixed;
            entity.faceDirFixed = true
        },
        run: function (entity) {
            Vec2.assign(entity.coll.accelDir, entity.face);
            Vec2.flip(entity.coll.accelDir);
            if (entity.stepTimer <= 0) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                entity.faceDirFixed = entity.stepData.prevFaceFix;
                return true
            }
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0)
            }
            return false
        }
    });

    var scratchVecD = Vec2.create(),
        scratchVecE = Vec2.create();
    ig.ACTION_STEP.MOVE_TO_ENTITY_DISTANCE =
        ig.ActionStepBase.extend({
            entity: 0,
            min: 0,
            max: 0,
            maxTime: 0,
            subRadius: false,
            _wm: new ig.Config({
                attributes: {
                    entity: {
                        _type: "Entity",
                        _info: "Entity to move to"
                    },
                    min: {
                        _type: "Number",
                        _info: "Minimum distance"
                    },
                    max: {
                        _type: "Number",
                        _info: "Maximum distance"
                    },
                    maxTime: {
                        _type: "Number",
                        _info: "Maximum time to move"
                    },
                    subRadius: {
                        _type: "Boolean",
                        _info: "If true, substract radius of entity bounds from distance to be evaluated."
                    }
                }
            }),
            init: function (settings) {
                this.entity = settings.entity;
                this.min = settings.min;
                this.max = settings.max;
                this.maxTime = settings.maxTime;
                this.subRadius = settings.subRadius
            },
            start: function (entity) {
                entity.stepTimer = entity.stepTimer + this.maxTime
            },
            run: function (entity) {
                var target = ig.Event.getEntity(this.entity);
                if (!target) return true;
                var distVec = Vec2.sub(target.getCenter(scratchVecD), entity.getCenter(scratchVecE)),
                    distance = Vec2.length(distVec);
                this.subRadius && (distance = distance - (entity.coll.size.x / 2 + target.coll.size.x / 2));
                distance < this.min && Vec2.mulC(distVec, -1);
                Vec2.assign(entity.coll.accelDir, distVec);
                (target = this.min <= distance && distance <= this.max) && Vec2.assignC(entity.coll.accelDir, 0, 0);
                return entity.stepTimer <= 0 || target
            }
        });
    ig.ACTION_STEP.MOVE_TO_ENTITY_CLOSEST_OFFSET = ig.ActionStepBase.extend({
        entity: 0,
        min: 0,
        max: 0,
        maxTime: 0,
        subRadius: false,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to move to"
                },
                offsets: {
                    _type: "Array",
                    _info: "Minimum distance",
                    _sub: {
                        _type: "Vec2"
                    }
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time to move"
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "If true: wait at point until maxTime has been reached"
                }
            }
        }),
        init: function (settings) {
            this.entity = settings.entity;
            this.offsets = settings.offsets;
            this.maxTime = settings.maxTime;
            this.forceTime = settings.forceTime || false
        },
        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime;
            var target = ig.Event.getEntity(this.entity);
            if (target) {
                for (var distVec = ig.CollTools.getDistVec2(entity.coll, target.coll, scratchVecD), offsetCount = this.offsets.length, bestIndex = 0, bestDist = 1E6; offsetCount--;) {
                    var offset = this.offsets[offsetCount];
                    Vec2.add(distVec, offset);
                    var offsetDist = Vec2.length(distVec);
                    Vec2.sub(distVec, offset);
                    if (offsetDist < bestDist) {
                        bestDist = offsetDist;
                        bestIndex = offsetCount
                    }
                }
                entity.offsetI = bestIndex
            }
        },
        run: function (entity) {
            var target = ig.Event.getEntity(this.entity);
            if (!target) return true;
            var distVec = ig.CollTools.getDistVec2(entity.coll, target.coll, scratchVecD);
            Vec2.add(distVec, this.offsets[entity.offsetI]);
            Vec2.assign(entity.coll.accelDir, distVec);
            var distance = Vec2.length(distVec);
            if (entity.coll.maxVel * entity.coll.relativeVel > distance * 10) entity.coll.relativeVel =
                distance / entity.coll.maxVel * 10;
            var done = false;
            if (distance < 1) {
                target = target.getCenter(scratchVecD);
                Vec2.add(target, this.offsets[entity.offsetI]);
                entity.setPos(target.x - entity.coll.size.x / 2, target.y - entity.coll.size.y / 2, entity.coll.pos.z);
                this.forceTime && this.maxTime ? Vec2.assignC(entity.coll.accelDir, 0, 0) : done = true
            }
            this.maxTime && entity.stepTimer <= 0 && (done = true);
            if (done) entity.coll.relativeVel = entity.stepData.startRelativeVel;
            return done
        }
    });
    ig.ACTION_STEP.MOVE_TO_POINT = ig.ActionStepBase.extend({
        target: Vec3.create(),
        precise: false,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Vec3",
                    _info: "Point to go to",
                    _actorOption: true,
                    _visualize: true,
                    _pointSelect: true
                },
                precise: {
                    _type: "Boolean",
                    _info: "Reach the target precisely, slowing down accordingly"
                },
                maxTime: {
                    _type: "Number",
                    _info: "If defined: move at most this amount of seconds towards point",
                    _optional: true
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "If true: wait at point until maxTime has been reached"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "target");
            this.target = settings.target;
            this.precise = settings.precise || false;
            this.maxTime = settings.maxTime || 0;
            this.forceTime = settings.forceTime || false
        },
        start: function (entity) {
            if (this.precise) entity.stepData.startRelativeVel =
                entity.coll.relativeVel;
            entity.stepTimer = entity.stepTimer + this.maxTime
        },
        run: function (entity) {
            var point = ig.Action.getVec3(this.target, entity, scratchVecB);
            if (point) {
                var distVec = Vec2.sub(point, entity.getCenter());
                Vec2.assign(entity.coll.accelDir, distVec);
                var distance = Vec2.length(distVec);
                if (this.precise && entity.coll.maxVel * entity.coll.relativeVel > distance * 10) entity.coll.relativeVel = distance / entity.coll.maxVel * 10;
                var done = false;
                if (distance < (this.precise ? 2 : 8)) this.forceTime && this.maxTime ? Vec2.assignC(entity.coll.accelDir, 0, 0) : done = true;
                this.maxTime && entity.stepTimer <= 0 && (done = true);
                if (done && this.precise) entity.coll.relativeVel = entity.stepData.startRelativeVel;
                return done
            }
            return true
        }
    });
    ig.ACTION_STEP.SYNC_ACTION_WITH_ENTITY = ig.ActionStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Other entity to sync action with"
                }
            }
        }),
        init: function (settings) {
            this.entity = settings.entity
        },
        start: function (entity) {
            entity.stepSync++
        },
        run: function (entity) {
            var target = ig.Event.getEntity(this.entity);
            return !target ? null : target.stepSync >= entity.stepSync
        }
    });
    ig.ACTION_STEP.SET_Z_VEL = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "New Z Vel value. Positive for up movement"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.vel.z = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SCALE_VEL = ig.ActionStepBase.extend({
        value: Vec2.create(),
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Vec2",
                    _info: "Values multiplied with velocity",
                    _actorOption: true
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        start: function (entity) {
            Vec2.assignC(entity.coll.accelDir, 0, 0);
            var scale = ig.Action.getVec2(this.value, entity, scratchVecA);
            scale && Vec2.mul(entity.coll.vel, scale)
        }
    });
    ig.ACTION_STEP.SET_FLOAT_HEIGHT = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "New float height"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.float.height = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_FLOAT_PARAMS = ig.ActionStepBase.extend({
        speed: null,
        accel: null,
        variance: null,
        _wm: new ig.Config({
            attributes: {
                variance: {
                    _type: "Number",
                    _info: "New float variance (specifies how muchy entitie moves up and down during floating)",
                    _default: 4,
                    _optional: true
                },
                accel: {
                    _type: "Number",
                    _info: "New float acceleration",
                    _default: 1,
                    _optional: true
                },
                speed: {
                    _type: "Number",
                    _info: "New float speed",
                    _default: 300,
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            if (settings.speed !== void 0) this.speed = settings.speed;
            if (settings.accel !== void 0) this.accel = settings.accel;
            if (settings.variance !== void 0) this.variance = settings.variance
        },
        run: function (entity) {
            if (this.speed !== null) entity.coll.float.maxSpeed = this.speed;
            if (this.accel !== null) entity.coll.float.accel = this.accel;
            if (this.variance !== null) entity.coll.float.variance = this.variance;
            return true
        }
    });
    ig.ACTION_STEP.SET_FLY_HEIGHT = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "New float height"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        run: function (entity) {
            entity.fly.height = this.value;
            if (this.value == 0) entity.coll.float.height = 0;
            return true
        }
    });
    ig.ACTION_STEP.SET_FLY_KEEP_HEIGHT = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "If true: Entity will keep flight height and not adjust with target"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        run: function (entity) {
            entity.fly.keepHeight = this.value;
            return true
        }
    });
    ig.ACTION_STEP.FORCE_FLY_HEIGHT = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            var target = entity.getTarget();
            if (target) {
                var newZ = 0,
                    newZ = entity.fly.keepHeight ? entity.fly.lastZ + entity.fly.height : target.coll.pos.z + entity.fly.height;
                entity.setZPos(newZ)
            }
            return true
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_Z_DISTANCE = ig.ActionStepBase.extend({
        distance: 0,
        _wm: new ig.Config({
            attributes: {
                distance: {
                    _type: "Number",
                    _info: "Wait until z distance to target is below this value"
                },
                fixEntityZ: {
                    _type: "Boolean",
                    _info: "If true, make entity stay fixed at the destination height, no zVel or gravity"
                }
            }
        }),
        init: function (settings) {
            this.distance = settings.distance || 0;
            this.fixEntityZ = settings.fixEntityZ || false
        },
        start: function (entity) {
            var target = entity.getTarget();
            if (target) entity.stepData.zDelta = entity.coll.pos.z - target.coll.pos.z
        },
        run: function (entity) {
            var target = entity.getTarget();
            if (!target || entity.coll.pos.z == entity.coll.baseZPos) return true;
            var zDelta = entity.coll.pos.z - target.coll.pos.z;
            if (entity.stepData.zDelta > 0 ? zDelta <= this.distance : zDelta >= this.distance) {
                if (this.fixEntityZ) {
                    entity.coll.pos.z = target.coll.pos.z + this.distance;
                    entity.coll.vel.z = 0;
                    entity.coll.zGravityFactor = 0
                }
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_Z_ZENITH =
        ig.ActionStepBase.extend({
            minWait: 0,
            _wm: new ig.Config({
                attributes: {
                    minWait: {
                        _type: "Number",
                        _info: "Minimum Time to wait"
                    }
                }
            }),
            init: function (settings) {
                this.minWait = settings.minWait || 0
            },
            start: function (entity) {
                entity.stepTimer = entity.stepTimer + this.minWait
            },
            run: function (entity) {
                return entity.coll.vel.z <= 0 ? entity.stepTimer <= 0 : false
            }
        });
    ig.ACTION_STEP.STOP_Z_ZENITH = ig.ActionStepBase.extend({
        minWait: 0,
        _wm: new ig.Config({
            attributes: {
                minWait: {
                    _type: "Number",
                    _info: "Minimum Time to wait"
                }
            }
        }),
        init: function (settings) {
            this.minWait = settings.minWait || 0
        },
        start: function (entity) {
            entity.stepTimer =
                entity.stepTimer + this.minWait
        },
        run: function (entity) {
            if (entity.coll.vel.z <= 0) {
                entity.coll.vel.z = 0;
                entity.coll.zGravityFactor = 0;
                return entity.stepTimer <= 0
            }
            return false
        }
    });
    ig.ACTION_STEP.FLY_TO_POINT = ig.ActionStepBase.extend({
        target: Vec2.create(),
        precise: false,
        maxFlySpeed: 0,
        flyVariance: 0,
        keepFloating: false,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Vec3",
                    _info: "Point to go to",
                    _actorOption: true,
                    _visualize: true,
                    _pointSelect: true
                },
                maxFlySpeed: {
                    _type: "Number",
                    _info: "Max flight speed"
                },
                flyVariance: {
                    _type: "Number",
                    _info: "How much the entity will vary around flight height."
                },
                precise: {
                    _type: "Boolean",
                    _info: "Reach the target precisely, slowing down accordingly"
                },
                keepFloating: {
                    _type: "Boolean",
                    _info: "Keep floating in the air after step is over"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "target");
            this.target = settings.target;
            this.precise = settings.precise || false;
            this.maxFlySpeed = settings.maxFlySpeed || 0;
            this.flyVariance = settings.flyVariance || 0;
            this.keepFloating = settings.keepFloating || false
        },
        start: function (entity) {
            entity.stepData.floatHeight = entity.coll.float.height;
            entity.stepData.floatVariance = entity.coll.float.variance;
            entity.stepData.floatMaxSpeed =
                entity.coll.float.maxSpeed;
            entity.stepData.floatHeightOnMove = entity.floatHeightOnMove;
            entity.stepData.jumpinEnabled = entity.jumpingEnabled;
            entity.stepData.prevDist = -1;
            if (this.precise) entity.stepData.startRelativeVel = entity.coll.relativeVel;
            entity.jumpingEnabled = false;
            entity.floatHeightOnMove = false
        },
        run: function (entity) {
            var point = ig.Action.getVec3(this.target, entity, scratchVecB);
            if (point) {
                var coll = entity.coll,
                    distVec = Vec2.sub(point, entity.getCenter()),
                    distance = Vec2.length(distVec);
                if (this.precise && distance < 2) {
                    Vec2.assign(coll.accelDir, 0, 0);
                    Vec2.assign(coll.vel, 0, 0)
                } else {
                    if (this.precise && coll.maxVel * coll.relativeVel > distance * 10) coll.relativeVel =
                        distance / coll.maxVel * 10;
                    distance >= (this.precise ? 2 : 8) && Vec2.assign(coll.accelDir, distVec)
                }
                if (entity.stepData.prevDist) entity.stepData.prevDist = entity.stepData.prevDist != -1 && distance > entity.stepData.prevDist ? 0 : distance;
                if (!entity.stepData.prevDist) {
                    console.log("PREV DIST CANCEL!");
                    distance = 0;
                    Vec2.assign(coll.accelDir, 0, 0);
                    Vec2.assign(coll.vel, 0, 0)
                }
                entity.coll.float.height = point.z - coll.baseZPos;
                entity.coll.float.variance = this.flyVariance;
                entity.coll.float.maxSpeed = this.maxFlySpeed;
                if (distance < (this.precise ? 2 : 8) && Math.abs(point.z - coll.pos.z) < 8) {
                    if (!this.keepFloating) {
                        entity.coll.float.height = entity.stepData.floatHeight;
                        entity.coll.float.variance =
                            entity.stepData.floatVariance;
                        entity.coll.float.maxSpeed = entity.stepData.maxSpeed;
                        entity.floatHeightOnMove = entity.stepData.floatHeightOnMove
                    }
                    entity.jumpingEnabled = entity.stepData.jumpingEnabled;
                    if (this.precise) coll.relativeVel = entity.stepData.startRelativeVel;
                    return true
                }
                return false
            }
            return true
        }
    });
    ig.ACTION_STEP.MOVE_TO_DIR = ig.ActionStepBase.extend({
        dir: Vec2.create(),
        time: 0,
        _wm: new ig.Config({
            attributes: {
                dir: {
                    _type: "Vec2",
                    _info: "Direction to go to",
                    _actorOption: true
                },
                time: {
                    _type: "Number",
                    _info: "Amount of time to move along this point"
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving forward"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "dir", "time");
            this.dir = settings.dir;
            this.time = settings.time;
            this.stopBeforeEdge = settings.stopBeforeEdge
        },
        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.time
        },
        run: function (entity) {
            var dir = ig.Action.getVec2(this.dir, entity, scratchVecA);
            dir && Vec2.assign(entity.coll.accelDir, dir);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0)
            }
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.MOVE_TO_LINE =
        ig.ActionStepBase.extend({
            target1: Vec2.create(),
            target2: Vec2.create(),
            _wm: new ig.Config({
                attributes: {
                    target1: {
                        _type: "Vec2",
                        _info: "First Point of line",
                        _visualize: true,
                        _pointSelect: true
                    },
                    target2: {
                        _type: "Vec2",
                        _info: "Second Point of line",
                        _visualize: true,
                        _pointSelect: true
                    }
                }
            }),
            init: function (settings) {
                assertContent(settings, "target1", "target2");
                this.target1 = settings.target1;
                this.target2 = settings.target2
            },
            start: function (entity) {
                var pointA = ig.Action.getVec2(this.target1, entity, scratchVecB),
                    pointB = ig.Action.getVec2(this.target2, entity, scratchVecC);
                if (pointA && pointB) {
                    var weight = Math.random();
                    entity.stepData.dest = Vec2.lerp(pointA, pointB, weight, Vec2.create())
                } else entity.stepData.dest = null
            },
            run: function (entity) {
                if (entity.stepData.dest) {
                    var distVec = Vec2.sub(entity.stepData.dest, entity.getCenter(), scratchVecA);
                    Vec2.assign(entity.coll.accelDir, distVec);
                    return Vec2.length(distVec) < 4
                }
                return true
            }
        });
    ig.ACTION_STEP.MOVE_RANDOM = ig.ActionStepBase.extend({
        minTime: 0,
        maxTime: 10,
        dirChanges: 1,
        _wm: new ig.Config({
            attributes: {
                minTime: {
                    _type: "Number",
                    _info: "Minimum time to move"
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time to move"
                },
                dirChanges: {
                    _type: "Number",
                    _info: "How often to change direction while moving. Minimum is 1"
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving forward"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "minTime", "maxTime");
            this.minTime = settings.minTime;
            this.maxTime = settings.maxTime;
            this.dirChanges = settings.dirChanges || 1;
            this.stopBeforeEdge = settings.stopBeforeEdge
        },
        start: function (entity) {
            entity.stepData.maxTime = this.minTime + Math.random() * (this.maxTime - this.minTime);
            entity.stepTimer = entity.stepTimer + entity.stepData.maxTime;
            entity.stepData.dirChangeTimer = 0
        },
        run: function (entity) {
            if (entity.stepTimer <= 0) return true;
            if (entity.coll.partlyBlockTimer >
                0.2 || entity.stepData.dirChangeTimer <= 0) {
                entity.coll.partlyBlockTimer = 0;
                entity.stepData.dirChangeTimer = entity.stepData.dirChangeTimer + entity.stepData.maxTime / this.dirChanges;
                var newDir = 0;
                do newDir = Vec2.normalize(Vec2.createC(Math.random() - 0.5, Math.random() - 0.5)); while (entity.stepData.dir && Vec2.dot(entity.stepData.dir, newDir) > 0.5);
                entity.stepData.dir = newDir
            }
            entity.stepData.dirChangeTimer = entity.stepData.dirChangeTimer - ig.system.tick;
            Vec2.assign(entity.coll.accelDir, entity.stepData.dir);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir,
                    0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0)
            }
            return false
        }
    });
    ig.ACTION_STEP.SET_WALK_ANIMS = ig.ActionStepBase.extend({
        config: null,
        _wm: new ig.Config({
            attributes: {
                config: {
                    _type: "WalkAnimConfig",
                    _info: "Name of walk anim config"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "config");
            this.config = settings.config
        },
        run: function (entity) {
            entity.setWalkAnims(this.config);
            return true
        }
    });
    ig.ACTION_STEP.SET_TARGET_WALK_ANIMS = ig.ActionStepBase.extend({
        config: null,
        _wm: new ig.Config({
            attributes: {
                config: {
                    _type: "WalkAnimConfig",
                    _info: "Name of walk anim config"
                }
            }
        }),
        init: function (settings) {
            this.config = settings.config
        },
        run: function (entity) {
            (entity = entity.getTarget()) && entity.setWalkAnims(this.config);
            return true
        }
    });

    var jumpHeights = {
        S: 100,
        M: 150,
        L: 180,
        XL: 220,
        XXL: 270
    };
    ig.ACTION_STEP.STOP_XY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            Vec2.assignC(entity.coll.vel, 0, 0);
            Vec2.assignC(entity.coll.accelDir, 0, 0);
            return true
        }
    });
    ig.ACTION_STEP.JUMP = ig.ActionStepBase.extend({
        jumpSpeed: null,
        wait: false,
        ignoreSound: false,
        _wm: new ig.Config({
            attributes: {
                jumpHeight: {
                    _type: "String",
                    _info: "Height of jump",
                    _select: jumpHeights
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until entity landed on ground"
                },
                ignoreSounds: {
                    _type: "Boolean",
                    _info: "If true, don't play any sound when jumping up"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "jumpHeight");
            this.jumpSpeed = jumpHeights[settings.jumpHeight];
            this.wait = settings.wait || false;
            this.ignoreSounds = settings.ignoreSounds || false
        },
        start: function (entity) {
            if (!entity.coll.groundConnect) {
                entity.doJump(this.jumpSpeed, null, null, null, this.ignoreSounds);
                if (!this.wait) entity.jumping = false
            }
        },
        run: function (entity) {
            return entity.coll.groundConnect ?
                true : this.wait ? entity.coll.vel.z <= 0 && entity.coll.pos.z - entity.coll.baseZPos <= ig.COLLISION.EPS : true
        }
    });
    ig.ACTION_STEP.JUMP_TO_POINT = ig.ActionStepBase.extend({
        adjustAbove: 0,
        offset: null,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "Vec3",
                    _info: "Point to jump to",
                    _actorOption: true,
                    _visualize: true,
                    _pointSelect: true
                },
                forceDuration: {
                    _type: "Number",
                    _info: "If defined: force a specific jump duration, setting speed and velocity accordingly. Otherwise, jump height will adapted so point will be reached with current velocity",
                    _optional: true
                },
                forceHeight: {
                    _type: "Number",
                    _info: "If defined: force a minimum height for jump",
                    _optional: true
                },
                ignoreSounds: {
                    _type: "Boolean",
                    _info: "If true, don't play any sound when jumping up"
                }
            }
        }),
        init: function (settings) {
            this.target = settings.target;
            this.forceDuration = settings.forceDuration || 0;
            this.forceHeight = settings.forceHeight || 0;
            this.ignoreSounds = settings.ignoreSounds || false
        },
        start: function (entity) {
            var targetPos = ig.Action.getVec3(this.target, entity, scratchVecB),
                alignedPos = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, scratchVecC),
                distVec = Vec2.sub(targetPos, alignedPos, scratchVecA),
                distance = Vec2.length(distVec),
                jumpSpeed = entity.coll.maxVel * entity.coll.relativeVel,
                duration, jumpSpeedForDuration;
            if (this.forceHeight) {
                jumpSpeedForDuration = ig.CollTools.getJumpSpeedToHeight(entity.coll, entity.coll.pos.z + this.forceHeight);
                duration = ig.CollTools.getJumpDuration(entity.coll, targetPos.z, jumpSpeedForDuration);
                jumpSpeed = distance / duration
            } else {
                if (this.forceDuration) {
                    duration = this.forceDuration;
                    jumpSpeed = distance / duration
                } else duration = distance / jumpSpeed;
                jumpSpeedForDuration = ig.CollTools.getJumpSpeedForDuration(entity.coll, targetPos.z, duration)
            }
            entity.doJump(jumpSpeedForDuration, null, null, null, this.ignoreSounds);
            entity.coll.friction.air = 0;
            Vec2.assign(entity.coll.vel, distVec);
            Vec2.length(entity.coll.vel, jumpSpeed);
            entity.stepData.jumpSpeed = jumpSpeed;
            entity.faceDirFixed || Vec2.assign(entity.face, distVec)
        },
        run: function (entity) {
            var targetPos = ig.Action.getVec3(this.target,
                entity, scratchVecB);
            if (targetPos) {
                var distVec = Vec2.sub(targetPos, entity.getCenter(scratchVecA)),
                    distance = Vec2.length(distVec),
                    vel = entity.stepData.jumpSpeed;
                entity.stepData.jumpSpeed * ig.system.tick > distance && (vel = distance * ig.system.tick);
                if (distance < 2) Vec2.assign(entity.coll.vel, 0, 0);
                else {
                    Vec2.length(distVec, vel);
                    Vec2.assign(entity.coll.vel, distVec)
                }
            } else return true;
            if (entity.coll.vel.z <= 0 && entity.coll.pos.z == entity.coll.baseZPos) {
                Vec2.assignC(entity.coll.vel, 0, 0);
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.SET_GROUND_CONNECTED = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "Type of Ground connected",
                    _select: ig.COLL_GROUND_CONNECT
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = ig.COLL_GROUND_CONNECT[settings.value]
        },
        run: function (entity) {
            entity.coll.groundConnect = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_JUMPING = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "true if jumping is enabled"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.jumpingEnabled = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_Z_GRAVITY_FACTOR = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "The new z gravity factor"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.zGravityFactor = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_SIZE = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                size: {
                    _type: "Offset",
                    _info: "Set new size of entity, keeping XY center alignment. WARNING: MIGHT RESULT IN PHYSICS ISSUES! ONLY USE WHEN NO OVERLAPPING WITH SURROUNDING IS GUARANTEED!"
                },
                shiftOnCollision: {
                    _type: "Boolean",
                    _info: "If true: shift entity when colliding with walls on expansion. NOTE: MIGHT NOT ALWAYS WORK"
                }
            }
        }),
        init: function (settings) {
            this.size = settings.size;
            this.shiftOnCollision = settings.shiftOnCollision || false
        },
        run: function (entity) {
            entity.coll.setSize(this.size.x, this.size.y, this.size.z, true, this.shiftOnCollision);
            return true
        }
    });
    ig.ACTION_STEP.SET_SPEED = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "NumberExpression",
                    _info: "New speed value"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.maxVel = ig.Event.getExpressionValue(this.value);
            return true
        }
    });
    ig.ACTION_STEP.SET_MAX_ZVEL = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "NumberExpression",
                    _info: "New speed value"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.maxZVel = ig.Event.getExpressionValue(this.value);
            return true
        }
    });
    ig.ACTION_STEP.SET_RELATIVE_SPEED = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "NumberExpression",
                    _info: "Relative Speed value between 0 and 1"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.relativeVel = ig.Event.getExpressionValue(this.value);
            return true
        }
    });
    ig.ACTION_STEP.SET_ACCEL_SPEED = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "New accel speed value. Something between 1 = fast acceleration. 0 = basically no acceleration"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.accelSpeed =
                this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_STATIC_TIME = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "Value of static time"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.time.animStatic = this.value;
            return true
        }
    });
    ig.ACTION_STEP.DETACH_TIME_PARENT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            entity.coll.time.parent = null;
            return true
        }
    });
    ig.ACTION_STEP.SET_WEIGHT = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "New weight value"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.weight = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_FRICTION = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Friction. Value between 0 (slide) and 1 (brake fast)"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.friction.ground = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_AIR_FRICTION = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Air Friction. Value between 0 (slide) and 1 (brake fast)"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.friction.air = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_TERRAIN_FRICTION_IGNORE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "If true: ignore terrain friction."
                }
            }
        }),
        init: function (settings) {
            this.value =
                settings.value
        },
        run: function (entity) {
            entity.coll.friction.ignoreTerrain = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_SHADOW = ig.ActionStepBase.extend({
        size: 0,
        _wm: new ig.Config({
            attributes: {
                size: {
                    _type: "Number",
                    _info: "Size of shadow (in pixel diameter)"
                },
                shadowType: {
                    _type: "String",
                    _info: "Set size of shadow",
                    _select: ig.COLL_SHADOW_TYPE,
                    _optional: true
                },
                shadowScaleY: {
                    _type: "Number",
                    _info: "Y scaling for Shadow",
                    _default: 1,
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.size = settings.size;
            this.shadowType = settings.shadowType;
            this.shadowScaleY =
                settings.shadowScaleY
        },
        run: function (entity) {
            entity.coll.shadow.size = this.size;
            if (this.shadowType) entity.coll.shadow.type = ig.COLL_SHADOW_TYPE[this.shadowType];
            if (this.shadowScaleY !== void 0) entity.coll.shadow.scaleY = this.shadowScaleY;
            return true
        }
    });
    ig.ACTION_STEP.SET_Z_BOUNCINESS = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Z Bounciness. Value between 0 (none) and 1 (full Speed up again)"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.zBounciness =
                this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_BOUNCINESS = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Bounciness. Value between 0 (none) and 1 (full Speed up again)"
                }
            }
        }),
        init: function (settings) {
            this.value = settings.value
        },
        run: function (entity) {
            entity.coll.bounciness = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_FACE_FIX = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "Wether face direction is fixed or not"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings,
                "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.faceDirFixed = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_FACE = ig.ActionStepBase.extend({
        face: null,
        rotate: false,
        rotateSpeed: 3,
        _wm: new ig.Config({
            attributes: {
                face: {
                    _type: "Face",
                    _info: "Direction to face",
                    _actorOption: true
                },
                rotate: {
                    _type: "Boolean",
                    _info: "Rotate entity toward direction",
                    _default: true
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed of rotation. Full circles per second",
                    _default: 3
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "face");
            this.face = settings.face;
            this.rotate =
                settings.rotate || false;
            this.rotateSpeed = settings.rotateSpeed || 3
        },
        start: function () {},
        run: function (entity) {
            Vec2.assignC(entity.coll.accelDir, 0, 0);
            var dir = ig.Action.getFace(this.face, entity, scratchVecA);
            if (this.rotate) return Vec2.rotateToward(entity.face, dir, Math.PI * 2 * ig.system.tick * this.rotateSpeed);
            Vec2.assign(entity.face, dir);
            return true
        }
    });

    var faceSearchTypes = {
        OWN_FACE: function (entity) {
            return entity.face
        },
        ENEMY_DIR: function (entity) {
            var target = entity.getTarget();
            return !target ? null : ig.CollTools.getDistVec2(entity.coll, target.coll, scratchVecB)
        }
    };
    ig.ACTION_STEP.SET_CLOSEST_FACE = ig.ActionStepBase.extend({
        face: null,
        rotate: false,
        rotateSpeed: 3,
        _wm: new ig.Config({
            attributes: {
                searchType: {
                    _type: "String",
                    _info: "How to determine best face direction",
                    _select: faceSearchTypes
                },
                faces: {
                    _type: "Array",
                    _info: "Face direction options",
                    _sub: {
                        _type: "Face",
                        _select: ig.ActorEntity.FACE8
                    }
                },
                rotate: {
                    _type: "Boolean",
                    _info: "Rotate entity toward direction",
                    _default: true
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed of rotation. Full circles per second",
                    _default: 3
                }
            }
        }),
        init: function (settings) {
            this.faces = settings.faces;
            this.rotate = settings.rotate || false;
            this.rotateSpeed = settings.rotateSpeed || 3;
            this.searchType =
                faceSearchTypes[settings.searchType] || faceSearchTypes.OWN_FACE
        },
        start: function (entity) {
            var bestFace = null,
                bestAngle = -1;
            entity.getTarget();
            var searchDir = this.searchType(entity);
            if (searchDir)
                for (var i = this.faces.length; i--;) {
                    var faceDir = ig.Action.getFace(this.faces[i], entity, scratchVecA),
                        faceAngle = Vec2.angle(faceDir, searchDir);
                    if (bestAngle == -1 || faceAngle < bestAngle) {
                        bestAngle = faceAngle;
                        bestFace = this.faces[i]
                    }
                }
            entity.stepData.bestFace = bestFace
        },
        run: function (entity) {
            Vec2.assignC(entity.coll.accelDir, 0, 0);
            if (!entity.stepData.bestFace) return true;
            var faceDir = ig.Action.getFace(entity.stepData.bestFace, entity, scratchVecA);
            if (this.rotate) return Vec2.rotateToward(entity.face, faceDir, Math.PI * 2 * ig.system.tick * this.rotateSpeed);
            Vec2.assign(entity.face,
                faceDir);
            return true
        }
    });
    ig.ACTION_STEP.SET_FACE_TO_VEL = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function (entity) {
            Vec2.assign(entity.face, entity.coll.vel)
        }
    });
    ig.ACTION_STEP.ROTATE_FACE = ig.ActionStepBase.extend({
        time: 0,
        turn: 0,
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Amount of time to rotate Face"
                },
                turn: {
                    _type: "Number",
                    _info: "The amount to rotate the face clockwise. 1.0 = full rotation"
                },
                random: {
                    _type: "Number",
                    _info: "If defined, rotate face randomly. 1=100% random. 0.5= at least 50%, rest random"
                },
                towardTarget: {
                    _type: "Boolean",
                    _info: "If true: always rotate face to end up closer towards target direction if rotation is positive. If negative: will always rotate away!",
                    _optional: true
                },
                notPastTarget: {
                    _type: "Boolean",
                    _info: "If true: do not rotate past the target",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.time = settings.time;
            this.turn = settings.turn;
            this.random = settings.random || 0;
            this.towardTarget = settings.towardTarget || false;
            this.notPastTarget = settings.notPastTarget || false
        },
        start: function (entity) {
            entity.stepTimer = this.time;
            entity.stepData.turn = this.turn *
                (1 - Math.random() * this.random);
            if (this.towardTarget) {
                var target = entity.getTarget();
                if (target) {
                    var targetDir = ig.CollTools.getDistVec2(entity.coll, target.coll, scratchVecA);
                    if (Vec2.areClockwise(entity.face, targetDir)) entity.stepData.turn = -entity.stepData.turn;
                    if (this.notPastTarget) {
                        var angleToTarget = Vec2.angle(entity.face, targetDir) / (Math.PI * 2),
                            turnAmount = Math.abs(entity.stepData.turn);
                        if (angleToTarget < turnAmount) entity.stepData.turn = entity.stepData.turn * (angleToTarget / turnAmount)
                    }
                }
            }
        },
        run: function (entity) {
            if (entity.stepData.turn) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                var tick = ig.system.tick;
                if (tick > entity.stepTimer) tick = entity.stepTimer;
                tick < 0 && (tick = 0);
                Vec2.rotate(entity.face, (this.time ? entity.stepData.turn *
                    tick / this.time : entity.stepData.turn) * Math.PI * 2)
            }
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.SET_FACE_TO_DIR = ig.ActionStepBase.extend({
        dir: Vec2.create(),
        _wm: new ig.Config({
            attributes: {
                dir: {
                    _type: "Vec2",
                    _info: "Direction to go to",
                    _actorOption: true
                }
            }
        }),
        init: function (settings) {
            this.dir = settings.dir
        },
        start: function (entity) {
            Vec2.assignC(entity.coll.accelDir, 0, 0);
            var dir = ig.Action.getVec2(this.dir, entity, scratchVecA);
            dir && Vec2.assign(entity.face, dir)
        }
    });
    ig.ACTION_STEP.SET_FACE_TO_ENTITY = ig.ActionStepBase.extend({
        entity: null,
        rotate: false,
        rotateSpeed: 3,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to look at"
                },
                rotate: {
                    _type: "Boolean",
                    _info: "Rotate entity toward direction",
                    _default: true
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed of rotation. Full circles per second",
                    _default: 3
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "entity");
            this.entity = settings.entity;
            this.rotate = settings.rotate || false;
            this.rotateSpeed = settings.rotateSpeed || 3
        },
        run: function (entity) {
            Vec2.assignC(entity.coll.accelDir, 0, 0);
            var target = ig.Event.getEntity(this.entity);
            if (!target) return true;
            target = Vec2.sub(target.getCenter(), entity.getCenter());
            if (this.rotate) return Vec2.rotateToward(entity.face,
                target, Math.PI * 2 * ig.system.tick * this.rotateSpeed);
            Vec2.assign(entity.face, target);
            return true
        }
    });
    ig.ACTION_STEP.SET_COLL_TYPE = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "New collision type of entity",
                    _select: ig.COLLTYPE
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            assert(ig.COLLTYPE[settings.value] != void 0, "Coll Type '" + settings.value + "' unknown!");
            this.value = ig.COLLTYPE[settings.value]
        },
        run: function (entity) {
            entity.coll.setType(this.value);
            return true
        }
    });
    ig.ACTION_STEP.SET_COLL_SHAPE = ig.ActionStepBase.extend({
        value: 0,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "New collision shape of entity",
                    _select: ig.COLLSHAPE
                }
            }
        }),
        init: function (settings) {
            this.value = ig.COLLSHAPE[settings.value]
        },
        run: function (entity) {
            entity.coll.shape = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_SLIP_THROUGH = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "true if slip through is active (ignoring any kind of collision)"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "value");
            this.value = settings.value
        },
        run: function (entity) {
            entity.setSlipThrough(this.value);
            return true
        }
    });
    ig.ACTION_STEP.SHOW_ANIMATION = ig.ActionStepBase.extend({
        anim: null,
        followUp: null,
        wait: null,
        viaWalkConfig: false,
        _wm: new ig.Config({
            attributes: {
                anim: {
                    _type: "EntityAnim",
                    _info: "Animation to play"
                },
                followUp: {
                    _type: "EntityAnim",
                    _info: "Animation to play after this animation",
                    _optional: true
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait for animation to be finished"
                },
                viaWalkConfig: {
                    _type: "Boolean",
                    _info: "if true, fetch the animations via the entities walk config"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "anim");
            this.anim = settings.anim;
            this.followUp = settings.followUp || null;
            this.wait = settings.wait || false;
            this.viaWalkConfig = settings.viaWalkConfig || false
        },
        start: function (entity) {
            this.viaWalkConfig ? entity.setCurrentAnim(entity.walkAnims[this.anim], true, this.followUp ? entity.walkAnims[this.followUp] : null, true) : entity.setCurrentAnim(this.anim, true, this.followUp, true);
            entity.animationFixed = true
        },
        run: function (entity) {
            if (!this.wait) return true;
            if (entity.animState.loopCount >= 1) {
                entity.animationFixed = false;
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_ANIM_LOOP_END = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {},
        run: function (entity) {
            return entity.animState.getFrame() == 0 || entity.animState.hasStopped()
        }
    });
    ig.ACTION_STEP.SHOW_PART_ANIMATION = ig.ActionStepBase.extend({
        anim: null,
        followUp: null,
        wait: null,
        _wm: new ig.Config({
            attributes: {
                partName: {
                    _type: "String",
                    _info: "Name of part to change animation from"
                },
                anim: {
                    _type: "String",
                    _info: "Animation to play"
                },
                followUp: {
                    _type: "String",
                    _info: "Animation to play after this animation",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "anim");
            this.partName =
                settings.partName;
            this.anim = settings.anim;
            this.followUp = settings.followUp || null
        },
        start: function (entity) {
            for (var partEntity = null, subColls = entity.coll.subColls, i = subColls.length; i--;)
                if (subColls[i].entity.partName == this.partName) {
                    partEntity = subColls[i].entity;
                    break
                } if (partEntity) {
                partEntity.setCurrentAnim(this.anim, true, this.followUp, true);
                partEntity.animationFixed = true
            }
        }
    });
    ig.ACTION_STEP.SHOW_RANDOM_ANIMATION = ig.ActionStepBase.extend({
        randAnims: null,
        _wm: new ig.Config({
            attributes: {
                randAnims: {
                    _type: "EntityAnimArray",
                    _info: "A list of animations. One of them will be shown randomly"
                }
            }
        }),
        init: function (settings) {
            this.randAnims =
                settings.randAnims
        },
        start: function (entity) {
            var anim = this.randAnims[Math.floor(Math.random() * this.randAnims.length)];
            entity.setCurrentAnim(anim, true, null, true);
            entity.animationFixed = true
        }
    });
    ig.ACTION_STEP.SHOW_EXTERN_ANIM = ig.ActionStepBase.extend({
        animSheet: null,
        animName: null,
        followUpSheet: null,
        followUpName: null,
        wait: null,
        _wm: new ig.Config({
            attributes: {
                anim: {
                    _type: "Animation",
                    _info: "Animation to play"
                },
                followUp: {
                    _type: "Animation",
                    _info: "Animation to play after this animation",
                    _optional: true
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait for animation to be finished"
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "anim");
            this.animSheet = new ig.AnimationSheet(settings.anim.sheet);
            this.animName = settings.anim.name;
            if (settings.followUp) {
                this.followUpSheet = new ig.AnimationSheet(settings.followUp.sheet);
                this.followUpName = settings.followUp.name
            }
            this.wait = settings.wait || false
        },
        clearCached: function () {
            this.animSheet.decreaseRef();
            this.followUpSheet && this.followUpSheet.decreaseRef()
        },
        start: function (entity) {
            var animSheet = sc.playerSkins.replaceAnim(this.animSheet),
                followUpSheet = sc.playerSkins.replaceAnim(this.followUpSheet);
            entity.setCurrentAnim(animSheet.anims[this.animName],
                true, followUpSheet && followUpSheet.anims[this.followUpName], true);
            entity.animationFixed = true
        },
        run: function (entity) {
            if (!this.wait) return true;
            if (entity.animState.loopCount >= 1) {
                entity.animationFixed = false;
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.CLEAR_ANIMATION = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            entity.animationFixed = false;
            return true
        }
    });
    ig.ACTION_STEP.SET_COLL_SIZE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                size: {
                    _type: "Offset",
                    _info: "New size of coll entry"
                }
            }
        }),
        init: function (settings) {
            this.size =
                settings.size
        },
        start: function (entity) {
            entity.coll.setSize(this.size.x, this.size.y, this.size.z, true)
        }
    });
    ig.ACTION_STEP.CHANGE_VAR_NUMBER = ig.ActionStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change",
                    _withActor: true
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: {
                        set: 1,
                        add: 1,
                        sub: 1,
                        mul: 1,
                        div: 1,
                        mod: 1
                    }
                },
                value: {
                    _type: "NumberExpression",
                    _info: "Value to modify with"
                }
            },
            label: function () {
                return wm.printVarChange(this, "CHANGE_VAR_NUMBER",
                    "NumberExpression")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value
        },
        run: function (entity) {
            var varName = ig.Action.getVarName(this.varName, entity),
                value = ig.Event.getExpressionValue(this.value);
            if (varName) {
                value = value * 1;
                if (isNaN(value)) ig.log("CHANGE_VAR_NUMBER: (Actor) Invalid value!");
                else {
                    if (ig.vars[this.changeType]) {
                        ig.vars[this.changeType](varName, value);
                        return true
                    }
                    ig.log("CHANGE_VAR_NUMBER: (Actor) Invalid change type")
                }
            } else ig.log("CHANGE_VAR_NUMBER: (Actor) Variable Name is not a String!")
        }
    });
    ig.ACTION_STEP.SET_RANDOM_VAR_NUMBER = ig.ActionStepBase.extend({
        varName: null,
        min: 0,
        max: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change",
                    _withActor: true
                },
                min: {
                    _type: "Integer",
                    _info: "Start value"
                },
                max: {
                    _type: "Integer",
                    _info: "End value"
                }
            },
            label: function () {
                return "<b>RANDOM_NUMBER</b> <code>" + wmPrint("VarName", this.varName) + " [" + wmPrint("Integer", this.min) + ", " + wmPrint("Integer", this.max) + "]</code>"
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "min", "max");
            this.varName =
                settings.varName;
            this.min = settings.min;
            this.max = settings.max
        },
        run: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (varName) {
                ig.vars.set(varName, ~~(Math.random() * this.max) + this.min);
                return true
            }
            ig.log("CHANGE_VAR_NUMBER: (Actor) Variable Name is not a String!")
        }
    });
    ig.ACTION_STEP.CHANGE_VAR_BOOL = ig.ActionStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change",
                    _withActor: true
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: {
                        set: 1,
                        and: 1,
                        or: 1,
                        xor: 1
                    }
                },
                value: {
                    _type: "BooleanExpression",
                    _info: "Value to modify with"
                }
            },
            label: function () {
                return wm.printVarChange(this, "CHANGE_VAR_BOOL", "BooleanExpression")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value
        },
        run: function (entity) {
            var varName = ig.Action.getVarName(this.varName, entity),
                value = ig.Event.getExpressionValue(this.value);
            if (varName) {
                value = !!value;
                if (ig.vars[this.changeType]) {
                    ig.vars[this.changeType](varName, value);
                    return true
                }
                ig.log("CHANGE_VAR_BOOL: Invalid change type")
            } else ig.log("CHANGE_VAR_BOOL: Variable Name is not a String!")
        }
    });
    ig.ACTION_STEP.CHANGE_VAR_STRING = ig.ActionStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change",
                    _withActor: true
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: {
                        set: 1,
                        append: 1,
                        prepend: 2
                    }
                },
                value: {
                    _type: "StringExpression",
                    _info: "Value to modify with"
                }
            },
            label: function () {
                return wm.printVarChange(this, "CHANGE_VAR_STRING", "StringExpression")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value
        },
        run: function (entity) {
            var varName = ig.Action.getVarName(this.varName, entity),
                value = ig.Event.getExpressionValue(this.value);
            if (varName) {
                value = "" + value;
                if (ig.vars[this.changeType]) {
                    ig.vars[this.changeType](varName, value);
                    return true
                }
                ig.log("CHANGE_VAR_STRING: Invalid change type")
            } else ig.log("CHANGE_VAR_STRING: Variable Name is not a String!")
        }
    });
    ig.ACTION_STEP.CHANGE_VAR_LANG = ig.ActionStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change",
                    _withActor: true
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: {
                        set: 1,
                        append: 1,
                        prepend: 2
                    }
                },
                value: {
                    _type: "LangLabel",
                    _info: "Value to modify with"
                }
            },
            label: function () {
                return wm.printVarChange(this, "CHANGE_VAR_LANG", "LangLabel")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = new ig.LangLabel(settings.value)
        },
        run: function (entity) {
            var varName = ig.Action.getVarName(this.varName, entity),
                value = this.value.toString();
            if (varName) {
                value = "" + value;
                if (ig.vars[this.changeType]) {
                    ig.vars[this.changeType](varName, value);
                    return true
                }
                ig.log("CHANGE_VAR_LANG: Invalid change type")
            } else ig.log("CHANGE_VAR_LANG: Variable Name is not a String!")
        }
    });
    ig.ACTION_STEP.SET_ATTRIB_VEC2 = ig.ActionStepBase.extend({
        name: null,
        value: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "StringExpression",
                    _info: "Name of actor attribute to set"
                },
                value: {
                    _type: "Vec2Expression",
                    _info: "Vec2 value to be set",
                    _visualize: true,
                    _pointSelect: true
                },
                changeConnected: {
                    _type: "String",
                    _info: "Change attribute to an entity connected to this one",
                    _select: ig.ACTOR_ATTRIB_CONNECTION,
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "name", "value");
            this.name = settings.name;
            this.value = settings.value;
            if (settings.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[settings.changeConnected]
        },
        run: function (entity) {
            var name = ig.Event.getExpressionValue(this.name),
                entity = this.changeConnected && this.changeConnected(entity) || entity,
                value = ig.Event.getExpressionValue(this.value);
            entity.setAttribute(name, value);
            return true
        }
    });
    ig.ACTION_STEP.SET_ATTRIB_BOOL =
        ig.ActionStepBase.extend({
            name: null,
            value: null,
            _wm: new ig.Config({
                attributes: {
                    name: {
                        _type: "StringExpression",
                        _info: "Name of actor attribute to set"
                    },
                    value: {
                        _type: "BooleanExpression",
                        _info: "Bool value to be set"
                    },
                    changeConnected: {
                        _type: "String",
                        _info: "Change attribute to an entity connected to this one",
                        _select: ig.ACTOR_ATTRIB_CONNECTION,
                        _optional: true
                    }
                }
            }),
            init: ig.ACTION_STEP.SET_ATTRIB_VEC2.prototype.init,
            run: ig.ACTION_STEP.SET_ATTRIB_VEC2.prototype.run
        });

    var stringChangeOps = {
        set: function (current, value) {
            return value
        },
        append: function (current,
            value) {
            return current + value
        },
        prepend: function (current, value) {
            return value + current
        }
    };
    ig.ACTION_STEP.SET_ATTRIB_STRING = ig.ActionStepBase.extend({
        name: null,
        value: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "StringExpression",
                    _info: "Name of actor attribute to set"
                },
                value: {
                    _type: "StringExpression",
                    _info: "String value to be set"
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: stringChangeOps,
                    _optional: true
                },
                changeConnected: {
                    _type: "String",
                    _info: "Change attribute to an entity connected to this one",
                    _select: ig.ACTOR_ATTRIB_CONNECTION,
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.name = settings.name;
            this.value = settings.value;
            this.changeType = stringChangeOps[settings.changeType] || stringChangeOps.set;
            if (settings.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[settings.changeConnected]
        },
        run: function (entity) {
            var name = ig.Event.getExpressionValue(this.name),
                entity = this.changeConnected && this.changeConnected(entity) || entity,
                value = ig.Event.getExpressionValue(this.value),
                current = entity.getAttribute(name) || "",
                value = this.changeType(current, value);
            entity.setAttribute(name, value);
            return true
        }
    });

    var numberChangeOps = {
        set: function (current, value) {
            return value
        },
        add: function (current, value) {
            return current + value
        },
        sub: function (current, value) {
            return current - value
        },
        mul: function (current, value) {
            return current * value
        },
        div: function (current, value) {
            return current / value
        },
        mod: function (current, value) {
            return current % value
        }
    };
    ig.ACTION_STEP.SET_ATTRIB_NUMBER = ig.ActionStepBase.extend({
        attribName: null,
        changeOperator: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                attribName: {
                    _type: "StringExpression",
                    _info: "Name of Var"
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: numberChangeOps
                },
                value: {
                    _type: "NumberExpression",
                    _info: "Value to modify with"
                },
                changeConnected: {
                    _type: "String",
                    _info: "Change attribute to an entity connected to this one",
                    _select: ig.ACTOR_ATTRIB_CONNECTION,
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.attribName = settings.attribName;
            this.changeOperator = numberChangeOps[settings.changeType] || numberChangeOps.set;
            this.value = settings.value || 0;
            if (settings.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[settings.changeConnected]
        },
        run: function (entity) {
            var name = ig.Event.getExpressionValue(this.attribName),
                entity = this.changeConnected && this.changeConnected(entity) || entity,
                current = entity.getAttribute(name) || 0,
                value = ig.Event.getExpressionValue(this.value),
                current = this.changeOperator(current, value * 1);
            entity.setAttribute(name, current);
            return true
        }
    });
    ig.ACTION_STEP.SET_ATTRIB_NUMBER_RANDOM = ig.ActionStepBase.extend({
        attribName: null,
        _wm: new ig.Config({
            attributes: {
                attribName: {
                    _type: "String",
                    _info: "Name of Var"
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: numberChangeOps
                },
                minValue: {
                    _type: "NumberExpression",
                    _info: "Value to modify with"
                },
                maxValue: {
                    _type: "NumberExpression",
                    _info: "Value to modify with"
                },
                changeConnected: {
                    _type: "String",
                    _info: "Change attribute to an entity connected to this one",
                    _select: ig.ACTOR_ATTRIB_CONNECTION,
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.attribName = settings.attribName;
            this.changeOperator = numberChangeOps[settings.changeType] || numberChangeOps.set;
            this.minValue = settings.minValue || 0;
            this.maxValue = settings.maxValue || 0;
            if (settings.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[settings.changeConnected]
        },
        run: function (entity) {
            var entity = this.changeConnected && this.changeConnected(entity) || entity,
                current = entity.getAttribute(this.attribName) || 0,
                min = ig.Event.getExpressionValue(this.minValue),
                max = ig.Event.getExpressionValue(this.maxValue),
                min = min * 1,
                max = max * 1,
                random = min + Math.floor(Math.random() * (max - min + 1)),
                current = this.changeOperator(current,
                    random);
            entity.setAttribute(this.attribName, current);
            return true
        }
    });

    var attribTargetTypes = {
        TARGET: function (entity) {
            return entity.getTarget()
        },
        SELF: function (entity) {
            return entity
        }
    };
    ig.ACTION_STEP.SET_ATTRIB_FACE = ig.ActionStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of actor attribute to set"
                },
                target: {
                    _type: "String",
                    _info: "From what kind of entity to select",
                    _select: attribTargetTypes
                }
            }
        }),
        init: function (settings) {
            this.name = settings.name;
            this.target = attribTargetTypes[settings.target] || attribTargetTypes.TARGET
        },
        start: function (entity) {
            var target = this.target(entity);
            target && entity.setAttribute(this.name,
                Vec2.create(target.face))
        },
        run: function () {
            return true
        }
    });
    ig.ACTION_STEP.SET_ATTRIB_POS = ig.ActionStepBase.extend({
        name: null,
        value: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of actor attribute to set"
                },
                target: {
                    _type: "String",
                    _info: "From what kind of entity to select",
                    _select: attribTargetTypes
                },
                align: {
                    _type: "String",
                    _info: "Alignment on how to set pos from target",
                    _select: ig.ENTITY_ALIGN
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to position",
                    _optional: true
                },
                faceDistance: {
                    _type: "Number",
                    _info: "Distance applied along face direction of target"
                },
                faceRound: {
                    _type: "Integer",
                    _info: "If defined: round face direction to fixed number of directions",
                    _optional: true
                },
                selfFaceDistance: {
                    _type: "Number",
                    _info: "Distance applied along face direction of entity"
                },
                checkCollision: {
                    _type: "Boolean",
                    _info: "If true: Check navmap collision and only set if correct",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.name = settings.name;
            this.target = attribTargetTypes[settings.target] || attribTargetTypes.TARGET;
            this.align = ig.ENTITY_ALIGN[settings.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.offset = settings.offset;
            this.faceDistance = settings.faceDistance ||
                0;
            this.faceRound = settings.faceRound || 0;
            this.selfFaceDistance = settings.selfFaceDistance || 0;
            this.checkCollision = settings.checkCollision || false
        },
        start: function (entity) {
            var target = this.target(entity);
            if (target) {
                var pos = target.getAlignedPos(this.align, Vec3.create());
                this.offset && Vec3.add(pos, this.offset);
                if (this.faceDistance) {
                    var faceDir = Vec2.assign(scratchVecD, target.face);
                    this.faceRound && ig.getRoundedFaceDir(faceDir.x, faceDir.y, this.faceRound, faceDir);
                    Vec2.length(faceDir, this.faceDistance);
                    Vec2.add(pos, faceDir)
                }
                if (this.selfFaceDistance) {
                    faceDir = Vec2.assign(scratchVecD, entity.face);
                    Vec2.length(faceDir, this.selfFaceDistance);
                    Vec2.add(pos,
                        faceDir)
                }
                this.checkCollision && !ig.navigation.isPositionFree(pos, entity, target, true) ? entity.setAttribute(this.name, null) : entity.setAttribute(this.name, pos)
            }
        },
        run: function () {
            ig.Event.getExpressionValue(this.value);
            return true
        }
    });
    ig.ACTION_STEP.PLAY_SOUND = ig.ActionStepBase.extend({
        sound: null,
        global: false,
        loop: false,
        settings: null,
        _wm: new ig.Config({
            attributes: {
                sound: {
                    _type: "SoundT",
                    _info: "URL of sound."
                },
                volume: {
                    _type: "Number",
                    _info: "The volume. Value between 0 and 1.",
                    _default: 1
                },
                variance: {
                    _type: "Number",
                    _info: "Variance of sound source",
                    _optional: true
                },
                global: {
                    _type: "Boolean",
                    _info: "Play sound globally without 3D sound."
                },
                loop: {
                    _type: "Boolean",
                    _info: "Loop sound if true"
                },
                speed: {
                    _type: "Number",
                    _info: "Playback speed. 1=default speed. 0.5=half speed.",
                    _optional: true
                },
                fadeDuration: {
                    _type: "Number",
                    _info: "Fade duration of sound when canceled. Increase in case of sound artifacts",
                    _optional: true
                },
                radius: {
                    _type: "Number",
                    _info: "Radius up to which you can hear the sound",
                    _optional: true
                },
                speedVar: {
                    _type: "VarName",
                    _info: "Variable which value with increase the speed",
                    _optional: true
                },
                speedVarFactor: {
                    _type: "Number",
                    _info: "Factor multiplied with variable before being added to speed",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            assertContent(settings, "sound");
            this.sound = new ig.Sound(settings.sound, settings.volume || 1, settings.variance || 0);
            this.global = settings.global || false;
            this.loop = settings.loop || false;
            this.radius = settings.radius || 0;
            this.speedVar = settings.speedVar;
            this.speedVarFactor = settings.speedVarFactor || 1;
            this.settings = {
                speed: settings.speed || 1,
                fadeDuration: settings.fadeDuration || 0
            }
        },
        clearCached: function () {
            this.sound.clearCached()
        },
        run: function (entity) {
            var playSettings =
                this.settings;
            if (this.speedVar) {
                var playSettings = ig.copy(this.settings),
                    speedBoost = (ig.vars.get(this.speedVar) || 0) * this.speedVarFactor;
                playSettings.speed = playSettings.speed + speedBoost
            }
            playSettings = this.global ? this.sound.play(this.loop, playSettings) : ig.SoundHelper.playAtEntity(this.sound, entity, this.loop, playSettings, this.radius);
            this.loop && entity.addActionAttached(playSettings);
            return true
        }
    });
    ig.ACTION_STEP.STOP_SOUNDS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            entity.clearActionAttached(isSoundHandle);
            return true
        }
    });
    ig.ACTION_STEP.PLAY_RANDOM_SOUND = ig.ActionStepBase.extend({
        sounds: [],
        global: false,
        loop: false,
        settings: null,
        _wm: new ig.Config({
            attributes: {
                sounds: {
                    _type: "Array",
                    _info: "Sound to be played random",
                    _sub: {
                        _type: "SoundConfig"
                    }
                },
                global: {
                    _type: "Boolean",
                    _info: "Play sound globally without 3D sound."
                },
                loop: {
                    _type: "Boolean",
                    _info: "Loop sound if true"
                },
                speed: {
                    _type: "Number",
                    _info: "Playback speed. 1=default speed. 0.5=half speed.",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            for (var i = 0; i < settings.sounds.length; ++i) {
                var soundConfig = settings.sounds[i];
                this.sounds.push(new ig.Sound(soundConfig.sound, soundConfig.volume || 1, soundConfig.variance ||
                    0))
            }
            this.global = settings.global || false;
            this.loop = settings.loop || false;
            this.settings = {
                speed: settings.speed || 1
            }
        },
        clearCached: function () {
            for (var i = this.sounds.length; i--;) this.sounds[i].clearCached()
        },
        run: function (entity) {
            var sound;
            sound = this.sounds.random();
            sound = this.global ? sound.play(this.loop, this.settings) : ig.SoundHelper.playAtEntity(sound, entity, this.loop, this.settings);
            this.loop && entity.addActionAttached(sound);
            return true
        }
    });
    ig.ACTION_STEP.HIDE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            entity.hide();
            return true
        }
    });
    ig.ACTION_STEP.HIDE_OTHER = ig.ActionStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Other entity to hide"
                }
            }
        }),
        init: function (settings) {
            this.entity = settings.entity
        },
        run: function () {
            var target = ig.Event.getEntity(this.entity);
            target && target.hide();
            return true
        }
    });
    ig.ACTION_STEP.SET_POS = ig.ActionStepBase.extend({
        newPos: null,
        _wm: new ig.Config({
            attributes: {
                newPos: {
                    _type: "Vec3",
                    _info: "Position to move to.",
                    _pointSelect: true,
                    _visualize: true,
                    _actorOption: true
                }
            }
        }),
        init: function (settings) {
            this.newPos = settings.newPos
        },
        start: function (entity) {
            var pos = ig.Action.getVec3(this.newPos, entity, scratchVecC),
                coll = entity.coll;
            entity.setPos(pos.x - coll.size.x / 2, pos.y - coll.size.y / 2, pos.z)
        }
    });
    ig.ACTION_STEP.ROUND_POSITION = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function (entity) {
            var coll = entity.coll;
            entity.setPos(Math.round(coll.pos.x), Math.round(coll.pos.y), coll.pos.z)
        }
    });
    ig.ACTION_STEP.ADD_Z_POS_DELTA = ig.ActionStepBase.extend({
        zDelta: null,
        _wm: new ig.Config({
            attributes: {
                zDelta: {
                    _type: "NumberVary",
                    _info: "Delta to add to z pos instantly"
                },
                zMultiply: {
                    _type: "Number",
                    _info: "Factor by which current z value is multiplied",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.zDelta = settings.zDelta;
            this.zMultiply = settings.zMultiply || 0
        },
        start: function (entity) {
            var delta = ig.Event.getNumberVary(this.zDelta),
                zPos = entity.coll.pos.z;
            this.zMultiply && (zPos = zPos * this.zMultiply);
            entity.setPos(void 0, void 0, zPos + delta)
        }
    });
    ig.ACTION_STEP.TELEPORT_TO_ATTRIB_POS = ig.ActionStepBase.extend({
        newPos: null,
        _wm: new ig.Config({
            attributes: {
                attrib: {
                    _type: "String",
                    _info: "Name of attribute containing position to teleport to"
                }
            }
        }),
        init: function (settings) {
            this.attrib =
                settings.attrib
        },
        start: function (entity) {
            var pos = entity.getAttribVec3(this.attrib);
            if (pos) {
                pos = Vec3.assign(scratchVecC, pos);
                pos.x = pos.x - entity.coll.size.x / 2;
                pos.y = pos.y - entity.coll.size.y / 2;
                entity.setPos(pos.x, pos.y, pos.z)
            }
        }
    });

    var scratchVec3 = Vec3.createC(0, 0, 0);
    ig.ACTION_STEP.INTERPOLATE_POSITION = ig.ActionStepBase.extend({
        newPos: null,
        duration: 0,
        keySpline: null,
        timePerTile: false,
        _wm: new ig.Config({
            attributes: {
                newPos: {
                    _type: "Vec3",
                    _info: "Position to move to.",
                    _pointSelect: true,
                    _visualize: true,
                    _actorOption: true
                },
                duration: {
                    _type: "Number",
                    _info: "Time the movement should take."
                },
                keySpline: {
                    _type: "String",
                    _info: "The KEYSPLINE to use.",
                    _select: KEY_SPLINES
                },
                timePerTile: {
                    _type: "Boolean",
                    _info: "If true, then time is for movement over one tile, scaled by total distance",
                    _default: false
                }
            }
        }),
        init: function (settings) {
            this.newPos = settings.newPos;
            this.duration = settings.duration || 0;
            this.keySpline = KEY_SPLINES[settings.keySpline || "LINEAR"];
            this.timePerTile = settings.timePerTile || false
        },
        start: function (entity) {
            entity.stepData.startPos = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
            if (this.timePerTile) {
                var targetPos = ig.Action.getVec3(this.newPos, entity, scratchVecB);
                Vec3.sub(targetPos, entity.stepData.startPos);
                targetPos = Vec3.length(targetPos);
                entity.stepData.duration = targetPos / 16 * this.duration
            } else entity.stepData.duration = this.duration;
            entity.stepTimer = entity.stepData.duration
        },
        run: function (entity) {
            var progress = 1 - (entity.stepTimer / entity.stepData.duration).limit(0, 1),
                progress = this.keySpline.get(progress),
                targetPos = ig.Action.getVec3(this.newPos, entity, scratchVecB);
            Vec3.lerp(entity.stepData.startPos, targetPos, progress, scratchVec3);
            entity.setPos(scratchVec3.x - entity.coll.size.x / 2, scratchVec3.y - entity.coll.size.y / 2, scratchVec3.z, true);
            return progress >= 1
        }
    });
    ig.ACTION_STEP.INTERPOLATE_RELATIVE = ig.ActionStepBase.extend({
        delta: null,
        duration: 0,
        keySpline: null,
        timePerTile: false,
        _wm: new ig.Config({
            attributes: {
                delta: {
                    _type: "Offset",
                    _info: "Delta applied on current position",
                    _actorOption: true
                },
                duration: {
                    _type: "NumberVary",
                    _info: "Time the movement should take."
                },
                keySpline: {
                    _type: "String",
                    _info: "The KEYSPLINE to use.",
                    _select: KEY_SPLINES
                }
            }
        }),
        init: function (settings) {
            this.delta = settings.delta;
            this.duration = settings.duration || 0;
            this.keySpline = KEY_SPLINES[settings.keySpline || "LINEAR"]
        },
        start: function (entity) {
            entity.stepData.startPos = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
            entity.stepData.duration = ig.Event.getNumberVary(this.duration);
            entity.stepTimer = entity.stepData.duration
        },
        run: function (entity) {
            var progress = 1 - (entity.stepTimer / entity.stepData.duration).limit(0, 1),
                splineWeight = this.keySpline.get(progress),
                pos = Vec3.addMulF(entity.stepData.startPos, this.delta, splineWeight, scratchVecB);
            entity.setPos(pos.x - entity.coll.size.x / 2, pos.y - entity.coll.size.y / 2, pos.z, true);
            return progress >= 1
        }
    });
    ig.ACTION_STEP.Z_INTERPOLATE = ig.ActionStepBase.extend({
        newZPos: 0,
        duration: 0,
        keySpline: null,
        _wm: new ig.Config({
            attributes: {
                newZPos: {
                    _type: "Number",
                    _info: "New z post to move to."
                },
                duration: {
                    _type: "Number",
                    _info: "Time the movement should take."
                },
                keySpline: {
                    _type: "String",
                    _info: "The KEYSPLINE to use.",
                    _select: KEY_SPLINES
                }
            }
        }),
        init: function (settings) {
            this.newZPos = settings.newZPos || 0;
            this.duration = settings.duration || 0;
            this.keySpline = KEY_SPLINES[settings.keySpline || "LINEAR"]
        },
        start: function (entity) {
            entity.stepTimer = this.duration;
            entity.stepData.zStartPos = entity.coll.pos.z
        },
        run: function (entity) {
            var progress = 1 - (entity.stepTimer / this.duration).limit(0, 1),
                progress = this.keySpline.get(progress);
            entity.setZPos(entity.stepData.zStartPos * (1 - progress) + this.newZPos * progress);
            return progress >= 1
        }
    });
    ig.ACTION_STEP.DO_ATTRIB_ACTION = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                attrib: {
                    _type: "String",
                    _info: "Name of attribute that stores action"
                },
                noStateReset: {
                    _type: "Boolean",
                    _info: "If true, do not reset state before switching to action. Also keeps actionAttached!"
                },
                resumeStashed: {
                    _type: "Boolean",
                    _info: "If true, resume stashed action if available"
                }
            }
        }),
        init: function (settings) {
            this.attrib = settings.attrib;
            this.noStateReset = settings.noStateReset || false;
            this.resumeStashed = settings.resumeStashed || false
        },
        start: function (entity) {
            var stashedAction = entity.getAttribute(this.attrib);
            this.resumeStashed && entity.stashed.action == stashedAction ? entity.resumeStashedAction(this.noStateReset) :
                entity.setAction(stashedAction, false, this.noStateReset)
        }
    });
    ig.ACTION_STEP.ADD_ANIM_MOD = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name under which to access anim mod. Anim mods of same name will be removed."
                },
                spriteIdx: {
                    _type: "Integer",
                    _info: "Sprite filter for animation modification"
                },
                tileOffset: {
                    _type: "NumberExpression",
                    _info: "The KEYSPLINE to use.",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.name = settings.name;
            this.spriteIdx = settings.spriteIdx || 0;
            this.tileOffset = settings.tileOffset || 0
        },
        start: function (entity) {
            (new ig.AnimModification(entity,
                this.spriteIdx, this.name)).tileOffset = ig.Event.getExpressionValue(this.tileOffset)
        }
    });
    ig.ACTION_STEP.REMOVE_ANIM_MOD = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "If defined, only remove mod with given name",
                    _optional: true
                }
            }
        }),
        init: function (settings) {
            this.name = settings.name
        },
        start: function (entity) {
            ig.AnimModification.removeMods(entity, this.name)
        }
    })
});
ig.baked = !0;
