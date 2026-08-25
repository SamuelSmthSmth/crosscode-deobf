ig.module("impact.feature.base.action-steps").requires("impact.base.action", "impact.base.actor-entity").defines(function() {
    function b(a) {
        return a instanceof ig.SoundHandle
    }
    var a = Vec2.create(),
        d = Vec2.create(),
        c = Vec2.create();
    ig.ACTION_STEP.LABEL = ig.ActionStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of the label"
                }
            },
            label: function() {
                return "<b>LABEL</b> <i>" + this.name + "</i>"
            }
        }),
        init: function(a) {
            assertContent(a, "name");
            this.name = a.name
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
                label: function() {
                    return "<b>GOTO_LABEL</b> <i>" + this.name + "</i>"
                }
            }),
            init: function(a) {
                assertContent(a, "name");
                this.name = a.name
            },
            getJumpLabelName: function() {
                return this.name
            }
        });
    var e = /^(\d+)_(\d+)$/;
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
            branchLabel: function(a) {
                if (a ==
                    "_end") return "END_SELECT_RANDOM";
                var b = e.exec(a);
                if (b) {
                    var a = b[1],
                        b = b[2],
                        c = "";
                    this.options[a].activeCondition && (c = c + ("(" + this.options[a].activeCondition + ")"));
                    return "Entry " + a + " #" + b + " " + c + " weight " + this.options[a].weight
                }
                return "???"
            }
        }),
        init: function(a) {
            for (var a = a.options || [], b = 0; b < a.length; ++b) {
                var c = {
                    count: a[b].count,
                    weight: a[b].weight,
                    activeCondition: new ig.VarCondition(a[b].activeCondition)
                };
                c.prob = c.count * c.weight;
                this.options[b] = c
            }
        },
        getBranchNames: function() {
            for (var a = [], b = 0; b < this.options.length; ++b)
                for (var c =
                        this.options[b], d = 0; d < c.count; ++d) a.push(b + "_" + d);
            return a
        },
        getNext: function() {
            for (var a = 0, b = this.options.length; b--;) this.options[b].activeCondition.evaluate() && (a = a + this.options[b].prob);
            a = Math.random() * a;
            for (b = this.options.length; b--;)
                if (this.options[b].activeCondition.evaluate())
                    if (a >= this.options[b].prob) a = a - this.options[b].prob;
                    else break;
            a = this.options[b];
            if (!a) return this._nextStep;
            a = Math.floor(a.count * Math.random());
            return this.branches[b + "_" + a] || this._nextStep
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
                branchLabel: function(a) {
                    if (a == "_end") return "END_SELECT_RANDOM";
                    var b;
                    b = "" + ("(" + this.options[a] + ")");
                    return "Entry " + a + " " + b
                }
            }),
            init: function(a) {
                for (var a = a.options || [], b = 0; b < a.length; ++b) {
                    var c = new ig.VarCondition(a[b]);
                    this.options[b] = c
                }
            },
            getBranchNames: function() {
                for (var a = [], b = 0; b < this.options.length; ++b) a.push(b);
                return a
            },
            getNext: function() {
                for (var a = 0; a < this.options.length; ++a)
                    if (this.options[a].evaluate()) return this.branches[a];
                return this._nextStep
            }
        });
    ig.ACTION_STEP.RESET_ACTOR = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.defaultConfig.apply(a)
        }
    });
    var f = {
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
                    _select: f
                }
            }
        }),
        init: function(a) {
            assertContent(a, "time");
            this.time = a.time;
            this.aggroTime = a.aggroTime || 0;
            this.assistSlow = a.assistSlow || false;
            this.guardTrap = f[a.guardTrap] || 0
        },
        start: function(a) {
            a.stepData.time =
                ig.Event.getExpressionValue(sc.newgame.hasHarderEnemies() && this.aggroTime ? this.aggroTime : this.time);
            if (this.assistSlow) a.stepData.time = a.stepData.time / sc.options.get("assist-attack-frequency");
            a.stepTimer = a.stepTimer + (a.stepData.time || 0)
        },
        run: function(a) {
            if (this.guardTrap) a.combo.guardTrapTime = a.combo.guardTrapTime + ig.system.tick;
            if (a.stepData.time >= 0 && a.stepTimer <= 0) {
                if (this.guardTrap == f.INCREASE_AND_CLEAR) a.combo.guardTrapTime = 0;
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
        init: function(a) {
            this.condition = new ig.VarCondition(a.condition);
            this.maxTime = a.maxTime
        },
        start: function(a) {
            if (this.maxTime) a.stepTimer = a.stepTimer + ig.Event.getExpressionValue(this.maxTime)
        },
        run: function(a) {
            return this.maxTime && a.stepTimer <= 0 ? true : this.condition.evaluate()
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
            init: function(a) {
                assertContent(a, "minTime", "maxTime");
                this.minTime = a.minTime;
                this.maxTime = a.maxTime
            },
            start: function(a) {
                a.stepTimer = a.stepTimer + (this.minTime + Math.random() * (this.maxTime - this.minTime))
            },
            run: function(a) {
                return a.stepTimer <= 0
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
            this.condition = new ig.VarCondition(a.condition);
            this.withElse = a.withElse
        },
        getBranchNames: function() {
            return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
        },
        getNext: function() {
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
        init: function(a) {
            this.maxTime = a.maxTime || 0;
            this.alsoBelowTarget = a.alsoBelowTarget || false
        },
        start: function(a) {
            a.stepTimer =
                a.stepTimer + this.maxTime
        },
        run: function(a) {
            if (this.maxTime && a.stepTimer <= 0 || a.coll.vel.z >= 0 && !a.coll.zGravityFactor) return true;
            if (this.alsoBelowTarget) {
                var b = a.getTarget();
                if (b && b.coll.pos.z > a.coll.pos.z) return true
            }
            return a.coll.pos.z == a.coll.baseZPos
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
        init: function(a) {
            this.maxTime = a.maxTime || 0;
            this.not = a.not || false
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime
        },
        run: function(a) {
            if (this.maxTime && a.stepTimer <= 0) return true;
            for (var a = ig.game.getEntitiesOnTop(a), b = a.length; b--;)
                if (a[b].isPlayer) return !this.not;
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
        init: function(a) {
            assertContent(a, "time");
            this.time = a.time;
            this.collideCancel = a.collideCancel;
            this.stopBeforeEdge = a.stopBeforeEdge;
            if (a.waitUntil) this.waitUntil = new ig.VarCondition(a.waitUntil);
            this.maxTargetDistance = a.maxTargetDistance || 0
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.time;
            if (this.maxTargetDistance) a.stepData.startRelativeVel = a.coll.relativeVel
        },
        run: function(a) {
            Vec2.assign(a.coll.accelDir, a.face);
            if (this.collideCancel && ig.CollTools.hasWallCollide(a.coll, this.collideCancel)) a.stepTimer = 0;
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(a.coll, true)) {
                Vec2.assignC(a.coll.accelDir,
                    0, 0);
                Vec2.assignC(a.coll.vel, 0, 0);
                if (this.collideCancel) a.stepTimer = 0
            }
            if (this.maxTargetDistance) {
                var b = a.getTarget();
                if (b) {
                    b = ig.CollTools.getMaxDistMoveFactor(a.coll, b.coll, this.maxTargetDistance);
                    if (b <= 0) {
                        Vec2.assignC(a.coll.accelDir, 0, 0);
                        Vec2.assignC(a.coll.vel, 0, 0)
                    } else if (b < 1) {
                        a.coll.relativeVel = a.coll.relativeVel * b;
                        Vec2.length(a.coll.vel, a.coll.maxVel * a.coll.relativeVel * b)
                    }
                }
            }
            if ((!this.waitUntil || this.waitUntil.evaluate()) && a.stepTimer <= 0) {
                if (this.maxTargetDistance) a.coll.relativeVel = a.stepData.startRelativeVel;
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
        init: function(a) {
            this.time = a.time;
            this.stopBeforeEdge = a.stopBeforeEdge
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.time
        },
        run: function(a) {
            Vec2.assign(a.coll.accelDir, 0, 0);
            if (this.stopBeforeEdge &&
                ig.CollTools.isPostMoveOverHole(a.coll, true)) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                Vec2.assignC(a.coll.vel, 0, 0)
            }
            return a.stepTimer <= 0
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
        init: function(a) {
            assertContent(a, "time");
            this.time = a.time;
            this.stopBeforeEdge = a.stopBeforeEdge
        },
        start: function(a) {
            a.stepTimer = +this.time;
            a.stepData.prevFaceFix = a.faceDirFixed;
            a.faceDirFixed = true
        },
        run: function(a) {
            Vec2.assign(a.coll.accelDir, a.face);
            Vec2.flip(a.coll.accelDir);
            if (a.stepTimer <= 0) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                a.faceDirFixed = a.stepData.prevFaceFix;
                return true
            }
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(a.coll, true)) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                Vec2.assignC(a.coll.vel, 0, 0)
            }
            return false
        }
    });
    var g = Vec2.create(),
        h = Vec2.create();
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
            init: function(a) {
                this.entity = a.entity;
                this.min = a.min;
                this.max = a.max;
                this.maxTime = a.maxTime;
                this.subRadius = a.subRadius
            },
            start: function(a) {
                a.stepTimer = a.stepTimer + this.maxTime
            },
            run: function(a) {
                var b = ig.Event.getEntity(this.entity);
                if (!b) return true;
                var c = Vec2.sub(b.getCenter(g), a.getCenter(h)),
                    d = Vec2.length(c);
                this.subRadius && (d = d - (a.coll.size.x / 2 + b.coll.size.x / 2));
                d < this.min && Vec2.mulC(c, -1);
                Vec2.assign(a.coll.accelDir, c);
                (b = this.min <= d && d <= this.max) && Vec2.assignC(a.coll.accelDir, 0, 0);
                return a.stepTimer <= 0 || b
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
        init: function(a) {
            this.entity = a.entity;
            this.offsets = a.offsets;
            this.maxTime = a.maxTime;
            this.forceTime = a.forceTime || false
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime;
            var b = ig.Event.getEntity(this.entity);
            if (b) {
                for (var b = ig.CollTools.getDistVec2(a.coll, b.coll, g), c = this.offsets.length, d = 0, e = 1E6; c--;) {
                    var f = this.offsets[c];
                    Vec2.add(b, f);
                    var h = Vec2.length(b);
                    Vec2.sub(b, f);
                    if (h < e) {
                        e = h;
                        d = c
                    }
                }
                a.offsetI = d
            }
        },
        run: function(a) {
            var b = ig.Event.getEntity(this.entity);
            if (!b) return true;
            var c = ig.CollTools.getDistVec2(a.coll, b.coll, g);
            Vec2.add(c, this.offsets[a.offsetI]);
            Vec2.assign(a.coll.accelDir, c);
            var d = Vec2.length(c);
            if (a.coll.maxVel * a.coll.relativeVel > d * 10) a.coll.relativeVel =
                d / a.coll.maxVel * 10;
            c = false;
            if (d < 1) {
                b = b.getCenter(g);
                Vec2.add(b, this.offsets[a.offsetI]);
                a.setPos(b.x - a.coll.size.x / 2, b.y - a.coll.size.y / 2, a.coll.pos.z);
                this.forceTime && this.maxTime ? Vec2.assignC(a.coll.accelDir, 0, 0) : c = true
            }
            this.maxTime && a.stepTimer <= 0 && (c = true);
            if (c) a.coll.relativeVel = a.stepData.startRelativeVel;
            return c
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
        init: function(a) {
            assertContent(a, "target");
            this.target = a.target;
            this.precise = a.precise || false;
            this.maxTime = a.maxTime || 0;
            this.forceTime = a.forceTime || false
        },
        start: function(a) {
            if (this.precise) a.stepData.startRelativeVel =
                a.coll.relativeVel;
            a.stepTimer = a.stepTimer + this.maxTime
        },
        run: function(a) {
            var b = ig.Action.getVec3(this.target, a, d);
            if (b) {
                b = Vec2.sub(b, a.getCenter());
                Vec2.assign(a.coll.accelDir, b);
                b = Vec2.length(b);
                if (this.precise && a.coll.maxVel * a.coll.relativeVel > b * 10) a.coll.relativeVel = b / a.coll.maxVel * 10;
                var c = false;
                if (b < (this.precise ? 2 : 8)) this.forceTime && this.maxTime ? Vec2.assignC(a.coll.accelDir, 0, 0) : c = true;
                this.maxTime && a.stepTimer <= 0 && (c = true);
                if (c && this.precise) a.coll.relativeVel = a.stepData.startRelativeVel;
                return c
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
        init: function(a) {
            this.entity = a.entity
        },
        start: function(a) {
            a.stepSync++
        },
        run: function(a) {
            var b = ig.Event.getEntity(this.entity);
            return !b ? null : b.stepSync >= a.stepSync
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.coll.vel.z = this.value;
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
        init: function(a) {
            this.value = a.value
        },
        start: function(b) {
            Vec2.assignC(b.coll.accelDir, 0, 0);
            var c = ig.Action.getVec2(this.value, b, a);
            c && Vec2.mul(b.coll.vel, c)
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.coll.float.height = this.value;
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
        init: function(a) {
            if (a.speed !== void 0) this.speed = a.speed;
            if (a.accel !== void 0) this.accel = a.accel;
            if (a.variance !== void 0) this.variance = a.variance
        },
        run: function(a) {
            if (this.speed !== null) a.coll.float.maxSpeed = this.speed;
            if (this.accel !== null) a.coll.float.accel = this.accel;
            if (this.variance !== null) a.coll.float.variance = this.variance;
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.fly.height = this.value;
            if (this.value == 0) a.coll.float.height = 0;
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.fly.keepHeight = this.value;
            return true
        }
    });
    ig.ACTION_STEP.FORCE_FLY_HEIGHT = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            var b = a.getTarget();
            if (b) {
                var c = 0,
                    c = a.fly.keepHeight ? a.fly.lastZ + a.fly.height : b.coll.pos.z + a.fly.height;
                a.setZPos(c)
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
        init: function(a) {
            this.distance = a.distance || 0;
            this.fixEntityZ = a.fixEntityZ || false
        },
        start: function(a) {
            var b = a.getTarget();
            if (b) a.stepData.zDelta = a.coll.pos.z - b.coll.pos.z
        },
        run: function(a) {
            var b = a.getTarget();
            if (!b || a.coll.pos.z == a.coll.baseZPos) return true;
            var c = a.coll.pos.z - b.coll.pos.z;
            if (a.stepData.zDelta > 0 ? c <= this.distance : c >= this.distance) {
                if (this.fixEntityZ) {
                    a.coll.pos.z = b.coll.pos.z + this.distance;
                    a.coll.vel.z = 0;
                    a.coll.zGravityFactor = 0
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
            init: function(a) {
                this.minWait = a.minWait || 0
            },
            start: function(a) {
                a.stepTimer = a.stepTimer + this.minWait
            },
            run: function(a) {
                return a.coll.vel.z <= 0 ? a.stepTimer <= 0 : false
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
        init: function(a) {
            this.minWait = a.minWait || 0
        },
        start: function(a) {
            a.stepTimer =
                a.stepTimer + this.minWait
        },
        run: function(a) {
            if (a.coll.vel.z <= 0) {
                a.coll.vel.z = 0;
                a.coll.zGravityFactor = 0;
                return a.stepTimer <= 0
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
        init: function(a) {
            assertContent(a, "target");
            this.target = a.target;
            this.precise = a.precise || false;
            this.maxFlySpeed = a.maxFlySpeed || 0;
            this.flyVariance = a.flyVariance || 0;
            this.keepFloating = a.keepFloating || false
        },
        start: function(a) {
            a.stepData.floatHeight = a.coll.float.height;
            a.stepData.floatVariance = a.coll.float.variance;
            a.stepData.floatMaxSpeed =
                a.coll.float.maxSpeed;
            a.stepData.floatHeightOnMove = a.floatHeightOnMove;
            a.stepData.jumpinEnabled = a.jumpingEnabled;
            a.stepData.prevDist = -1;
            if (this.precise) a.stepData.startRelativeVel = a.coll.relativeVel;
            a.jumpingEnabled = false;
            a.floatHeightOnMove = false
        },
        run: function(a) {
            var b = ig.Action.getVec3(this.target, a, d);
            if (b) {
                var c = a.coll,
                    e = Vec2.sub(b, a.getCenter()),
                    f = Vec2.length(e);
                if (this.precise && f < 2) {
                    Vec2.assign(c.accelDir, 0, 0);
                    Vec2.assign(c.vel, 0, 0)
                } else {
                    if (this.precise && c.maxVel * c.relativeVel > f * 10) c.relativeVel =
                        f / c.maxVel * 10;
                    f >= (this.precise ? 2 : 8) && Vec2.assign(c.accelDir, e)
                }
                if (a.stepData.prevDist) a.stepData.prevDist = a.stepData.prevDist != -1 && f > a.stepData.prevDist ? 0 : f;
                if (!a.stepData.prevDist) {
                    console.log("PREV DIST CANCEL!");
                    f = 0;
                    Vec2.assign(c.accelDir, 0, 0);
                    Vec2.assign(c.vel, 0, 0)
                }
                a.coll.float.height = b.z - c.baseZPos;
                a.coll.float.variance = this.flyVariance;
                a.coll.float.maxSpeed = this.maxFlySpeed;
                if (f < (this.precise ? 2 : 8) && Math.abs(b.z - c.pos.z) < 8) {
                    if (!this.keepFloating) {
                        a.coll.float.height = a.stepData.floatHeight;
                        a.coll.float.variance =
                            a.stepData.floatVariance;
                        a.coll.float.maxSpeed = a.stepData.maxSpeed;
                        a.floatHeightOnMove = a.stepData.floatHeightOnMove
                    }
                    a.jumpingEnabled = a.stepData.jumpingEnabled;
                    if (this.precise) c.relativeVel = a.stepData.startRelativeVel;
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
        init: function(a) {
            assertContent(a, "dir", "time");
            this.dir = a.dir;
            this.time = a.time;
            this.stopBeforeEdge = a.stopBeforeEdge
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.time
        },
        run: function(b) {
            var c = ig.Action.getVec2(this.dir, b, a);
            c && Vec2.assign(b.coll.accelDir, c);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(b.coll, true)) {
                Vec2.assignC(b.coll.accelDir, 0, 0);
                Vec2.assignC(b.coll.vel, 0, 0)
            }
            return b.stepTimer <= 0
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
            init: function(a) {
                assertContent(a, "target1", "target2");
                this.target1 = a.target1;
                this.target2 = a.target2
            },
            start: function(a) {
                var b = ig.Action.getVec2(this.target1, a, d),
                    e = ig.Action.getVec2(this.target2, a, c);
                if (b && e) {
                    var f = Math.random();
                    a.stepData.dest = Vec2.lerp(b, e, f, Vec2.create())
                } else a.stepData.dest = null
            },
            run: function(b) {
                if (b.stepData.dest) {
                    var c = Vec2.sub(b.stepData.dest, b.getCenter(), a);
                    Vec2.assign(b.coll.accelDir, c);
                    return Vec2.length(c) < 4
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
        init: function(a) {
            assertContent(a, "minTime", "maxTime");
            this.minTime = a.minTime;
            this.maxTime = a.maxTime;
            this.dirChanges = a.dirChanges || 1;
            this.stopBeforeEdge = a.stopBeforeEdge
        },
        start: function(a) {
            a.stepData.maxTime = this.minTime + Math.random() * (this.maxTime - this.minTime);
            a.stepTimer = a.stepTimer + a.stepData.maxTime;
            a.stepData.dirChangeTimer = 0
        },
        run: function(a) {
            if (a.stepTimer <= 0) return true;
            if (a.coll.partlyBlockTimer >
                0.2 || a.stepData.dirChangeTimer <= 0) {
                a.coll.partlyBlockTimer = 0;
                a.stepData.dirChangeTimer = a.stepData.dirChangeTimer + a.stepData.maxTime / this.dirChanges;
                var b = 0;
                do b = Vec2.normalize(Vec2.createC(Math.random() - 0.5, Math.random() - 0.5)); while (a.stepData.dir && Vec2.dot(a.stepData.dir, b) > 0.5);
                a.stepData.dir = b
            }
            a.stepData.dirChangeTimer = a.stepData.dirChangeTimer - ig.system.tick;
            Vec2.assign(a.coll.accelDir, a.stepData.dir);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(a.coll, true)) {
                Vec2.assignC(a.coll.accelDir,
                    0, 0);
                Vec2.assignC(a.coll.vel, 0, 0)
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
        init: function(a) {
            assertContent(a, "config");
            this.config = a.config
        },
        run: function(a) {
            a.setWalkAnims(this.config);
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
        init: function(a) {
            this.config = a.config
        },
        run: function(a) {
            (a = a.getTarget()) && a.setWalkAnims(this.config);
            return true
        }
    });
    var i = {
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
        init: function() {},
        run: function(a) {
            Vec2.assignC(a.coll.vel, 0, 0);
            Vec2.assignC(a.coll.accelDir, 0, 0);
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
                    _select: i
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
        init: function(a) {
            assertContent(a, "jumpHeight");
            this.jumpSpeed = i[a.jumpHeight];
            this.wait = a.wait || false;
            this.ignoreSounds = a.ignoreSounds || false
        },
        start: function(a) {
            if (!a.coll.groundConnect) {
                a.doJump(this.jumpSpeed, null, null, null, this.ignoreSounds);
                if (!this.wait) a.jumping = false
            }
        },
        run: function(a) {
            return a.coll.groundConnect ?
                true : this.wait ? a.coll.vel.z <= 0 && a.coll.pos.z - a.coll.baseZPos <= ig.COLLISION.EPS : true
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
        init: function(a) {
            this.target = a.target;
            this.forceDuration = a.forceDuration || 0;
            this.forceHeight = a.forceHeight || 0;
            this.ignoreSounds = a.ignoreSounds || false
        },
        start: function(b) {
            var e = ig.Action.getVec3(this.target, b, d),
                f = b.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c),
                f = Vec2.sub(e, f, a),
                g = Vec2.length(f),
                h = b.coll.maxVel *
                b.coll.relativeVel,
                i, j;
            if (this.forceHeight) {
                j = ig.CollTools.getJumpSpeedToHeight(b.coll, b.coll.pos.z + this.forceHeight);
                i = ig.CollTools.getJumpDuration(b.coll, e.z, j);
                h = g / i
            } else {
                if (this.forceDuration) {
                    i = this.forceDuration;
                    h = g / i
                } else i = g / h;
                j = ig.CollTools.getJumpSpeedForDuration(b.coll, e.z, i)
            }
            b.doJump(j, null, null, null, this.ignoreSounds);
            b.coll.friction.air = 0;
            Vec2.assign(b.coll.vel, f);
            Vec2.length(b.coll.vel, h);
            b.stepData.jumpSpeed = h;
            b.faceDirFixed || Vec2.assign(b.face, f)
        },
        run: function(b) {
            var c = ig.Action.getVec3(this.target,
                b, d);
            if (c) {
                var c = Vec2.sub(c, b.getCenter(a)),
                    e = Vec2.length(c),
                    f = b.stepData.jumpSpeed;
                b.stepData.jumpSpeed * ig.system.tick > e && (f = e * ig.system.tick);
                if (e < 2) Vec2.assign(b.coll.vel, 0, 0);
                else {
                    Vec2.length(c, f);
                    Vec2.assign(b.coll.vel, c)
                }
            } else return true;
            if (b.coll.vel.z <= 0 && b.coll.pos.z == b.coll.baseZPos) {
                Vec2.assignC(b.coll.vel, 0, 0);
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
        init: function(a) {
            assertContent(a, "value");
            this.value = ig.COLL_GROUND_CONNECT[a.value]
        },
        run: function(a) {
            a.coll.groundConnect = this.value;
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.jumpingEnabled = this.value;
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.zGravityFactor = this.value;
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
        init: function(a) {
            this.size = a.size;
            this.shiftOnCollision = a.shiftOnCollision || false
        },
        run: function(a) {
            a.coll.setSize(this.size.x, this.size.y, this.size.z, true, this.shiftOnCollision);
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.maxVel = ig.Event.getExpressionValue(this.value);
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.maxZVel = ig.Event.getExpressionValue(this.value);
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.relativeVel = ig.Event.getExpressionValue(this.value);
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.accelSpeed =
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.coll.time.animStatic = this.value;
            return true
        }
    });
    ig.ACTION_STEP.DETACH_TIME_PARENT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            a.coll.time.parent = null;
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.weight = this.value;
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.friction.ground = this.value;
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.friction.air = this.value;
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
        init: function(a) {
            this.value =
                a.value
        },
        run: function(a) {
            a.coll.friction.ignoreTerrain = this.value;
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
        init: function(a) {
            this.size = a.size;
            this.shadowType = a.shadowType;
            this.shadowScaleY =
                a.shadowScaleY
        },
        run: function(a) {
            a.coll.shadow.size = this.size;
            if (this.shadowType) a.coll.shadow.type = ig.COLL_SHADOW_TYPE[this.shadowType];
            if (this.shadowScaleY !== void 0) a.coll.shadow.scaleY = this.shadowScaleY;
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.coll.zBounciness =
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.coll.bounciness = this.value;
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
        init: function(a) {
            assertContent(a,
                "value");
            this.value = a.value
        },
        run: function(a) {
            a.faceDirFixed = this.value;
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
        init: function(a) {
            assertContent(a, "face");
            this.face = a.face;
            this.rotate =
                a.rotate || false;
            this.rotateSpeed = a.rotateSpeed || 3
        },
        start: function() {},
        run: function(b) {
            Vec2.assignC(b.coll.accelDir, 0, 0);
            var c = ig.Action.getFace(this.face, b, a);
            if (this.rotate) return Vec2.rotateToward(b.face, c, Math.PI * 2 * ig.system.tick * this.rotateSpeed);
            Vec2.assign(b.face, c);
            return true
        }
    });
    var j = {
        OWN_FACE: function(a) {
            return a.face
        },
        ENEMY_DIR: function(a) {
            var b = a.getTarget();
            return !b ? null : ig.CollTools.getDistVec2(a.coll, b.coll, d)
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
                    _select: j
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
        init: function(a) {
            this.faces = a.faces;
            this.rotate = a.rotate || false;
            this.rotateSpeed = a.rotateSpeed || 3;
            this.searchType =
                j[a.searchType] || j.OWN_FACE
        },
        start: function(b) {
            var c = null,
                d = -1;
            b.getTarget();
            var e = this.searchType(b);
            if (e)
                for (var f = this.faces.length; f--;) {
                    var g = ig.Action.getFace(this.faces[f], b, a),
                        g = Vec2.angle(g, e);
                    if (d == -1 || g < d) {
                        d = g;
                        c = this.faces[f]
                    }
                }
            b.stepData.bestFace = c
        },
        run: function(b) {
            Vec2.assignC(b.coll.accelDir, 0, 0);
            if (!b.stepData.bestFace) return true;
            var c = ig.Action.getFace(b.stepData.bestFace, b, a);
            if (this.rotate) return Vec2.rotateToward(b.face, c, Math.PI * 2 * ig.system.tick * this.rotateSpeed);
            Vec2.assign(b.face,
                c);
            return true
        }
    });
    ig.ACTION_STEP.SET_FACE_TO_VEL = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            Vec2.assign(a.face, a.coll.vel)
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
        init: function(a) {
            this.time = a.time;
            this.turn = a.turn;
            this.random = a.random || 0;
            this.towardTarget = a.towardTarget || false;
            this.notPastTarget = a.notPastTarget || false
        },
        start: function(b) {
            b.stepTimer = this.time;
            b.stepData.turn = this.turn *
                (1 - Math.random() * this.random);
            if (this.towardTarget) {
                var c = b.getTarget();
                if (c) {
                    c = ig.CollTools.getDistVec2(b.coll, c.coll, a);
                    if (Vec2.areClockwise(b.face, c)) b.stepData.turn = -b.stepData.turn;
                    if (this.notPastTarget) {
                        var c = Vec2.angle(b.face, c) / (Math.PI * 2),
                            d = Math.abs(b.stepData.turn);
                        if (c < d) b.stepData.turn = b.stepData.turn * (c / d)
                    }
                }
            }
        },
        run: function(a) {
            if (a.stepData.turn) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                var b = ig.system.tick;
                if (b > a.stepTimer) b = a.stepTimer;
                b < 0 && (b = 0);
                Vec2.rotate(a.face, (this.time ? a.stepData.turn *
                    b / this.time : a.stepData.turn) * Math.PI * 2)
            }
            return a.stepTimer <= 0
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
        init: function(a) {
            this.dir = a.dir
        },
        start: function(b) {
            Vec2.assignC(b.coll.accelDir, 0, 0);
            var c = ig.Action.getVec2(this.dir, b, a);
            c && Vec2.assign(b.face, c)
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
        init: function(a) {
            assertContent(a, "entity");
            this.entity = a.entity;
            this.rotate = a.rotate || false;
            this.rotateSpeed = a.rotateSpeed || 3
        },
        run: function(a) {
            Vec2.assignC(a.coll.accelDir, 0, 0);
            var b = ig.Event.getEntity(this.entity);
            if (!b) return true;
            b = Vec2.sub(b.getCenter(), a.getCenter());
            if (this.rotate) return Vec2.rotateToward(a.face,
                b, Math.PI * 2 * ig.system.tick * this.rotateSpeed);
            Vec2.assign(a.face, b);
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
        init: function(a) {
            assertContent(a, "value");
            assert(ig.COLLTYPE[a.value] != void 0, "Coll Type '" + a.value + "' unknown!");
            this.value = ig.COLLTYPE[a.value]
        },
        run: function(a) {
            a.coll.setType(this.value);
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
        init: function(a) {
            this.value = ig.COLLSHAPE[a.value]
        },
        run: function(a) {
            a.coll.shape = this.value;
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
        init: function(a) {
            assertContent(a, "value");
            this.value = a.value
        },
        run: function(a) {
            a.setSlipThrough(this.value);
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
        init: function(a) {
            assertContent(a, "anim");
            this.anim = a.anim;
            this.followUp = a.followUp || null;
            this.wait = a.wait || false;
            this.viaWalkConfig = a.viaWalkConfig || false
        },
        start: function(a) {
            this.viaWalkConfig ? a.setCurrentAnim(a.walkAnims[this.anim], true, this.followUp ? a.walkAnims[this.followUp] : null, true) : a.setCurrentAnim(this.anim, true, this.followUp, true);
            a.animationFixed = true
        },
        run: function(a) {
            if (!this.wait) return true;
            if (a.animState.loopCount >= 1) {
                a.animationFixed = false;
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_ANIM_LOOP_END = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {},
        run: function(a) {
            return a.animState.getFrame() == 0 || a.animState.hasStopped()
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
        init: function(a) {
            assertContent(a, "anim");
            this.partName =
                a.partName;
            this.anim = a.anim;
            this.followUp = a.followUp || null
        },
        start: function(a) {
            for (var b = null, a = a.coll.subColls, c = a.length; c--;)
                if (a[c].entity.partName == this.partName) {
                    b = a[c].entity;
                    break
                } if (b) {
                b.setCurrentAnim(this.anim, true, this.followUp, true);
                b.animationFixed = true
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
        init: function(a) {
            this.randAnims =
                a.randAnims
        },
        start: function(a) {
            var b = this.randAnims[Math.floor(Math.random() * this.randAnims.length)];
            a.setCurrentAnim(b, true, null, true);
            a.animationFixed = true
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
        init: function(a) {
            assertContent(a, "anim");
            this.animSheet = new ig.AnimationSheet(a.anim.sheet);
            this.animName = a.anim.name;
            if (a.followUp) {
                this.followUpSheet = new ig.AnimationSheet(a.followUp.sheet);
                this.followUpName = a.followUp.name
            }
            this.wait = a.wait || false
        },
        clearCached: function() {
            this.animSheet.decreaseRef();
            this.followUpSheet && this.followUpSheet.decreaseRef()
        },
        start: function(a) {
            var b = sc.playerSkins.replaceAnim(this.animSheet),
                c = sc.playerSkins.replaceAnim(this.followUpSheet);
            a.setCurrentAnim(b.anims[this.animName],
                true, c && c.anims[this.followUpName], true);
            a.animationFixed = true
        },
        run: function(a) {
            if (!this.wait) return true;
            if (a.animState.loopCount >= 1) {
                a.animationFixed = false;
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.CLEAR_ANIMATION = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            a.animationFixed = false;
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
        init: function(a) {
            this.size =
                a.size
        },
        start: function(a) {
            a.coll.setSize(this.size.x, this.size.y, this.size.z, true)
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
            label: function() {
                return wm.printVarChange(this, "CHANGE_VAR_NUMBER",
                    "NumberExpression")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value
        },
        run: function(a) {
            var a = ig.Action.getVarName(this.varName, a),
                b = ig.Event.getExpressionValue(this.value);
            if (a) {
                b = b * 1;
                if (isNaN(b)) ig.log("CHANGE_VAR_NUMBER: (Actor) Invalid value!");
                else {
                    if (ig.vars[this.changeType]) {
                        ig.vars[this.changeType](a, b);
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
            label: function() {
                return "<b>RANDOM_NUMBER</b> <code>" + wmPrint("VarName", this.varName) + " [" + wmPrint("Integer", this.min) + ", " + wmPrint("Integer", this.max) + "]</code>"
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "min", "max");
            this.varName =
                a.varName;
            this.min = a.min;
            this.max = a.max
        },
        run: function() {
            var a = ig.Event.getVarName(this.varName);
            if (a) {
                ig.vars.set(a, ~~(Math.random() * this.max) + this.min);
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
            label: function() {
                return wm.printVarChange(this, "CHANGE_VAR_BOOL", "BooleanExpression")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value
        },
        run: function(a) {
            var a = ig.Action.getVarName(this.varName, a),
                b = ig.Event.getExpressionValue(this.value);
            if (a) {
                b = !!b;
                if (ig.vars[this.changeType]) {
                    ig.vars[this.changeType](a, b);
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
            label: function() {
                return wm.printVarChange(this, "CHANGE_VAR_STRING", "StringExpression")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value
        },
        run: function(a) {
            var a = ig.Action.getVarName(this.varName, a),
                b = ig.Event.getExpressionValue(this.value);
            if (a) {
                b = "" + b;
                if (ig.vars[this.changeType]) {
                    ig.vars[this.changeType](a, b);
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
            label: function() {
                return wm.printVarChange(this, "CHANGE_VAR_LANG", "LangLabel")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = new ig.LangLabel(a.value)
        },
        run: function(a) {
            var a = ig.Action.getVarName(this.varName, a),
                b = this.value.toString();
            if (a) {
                b = "" + b;
                if (ig.vars[this.changeType]) {
                    ig.vars[this.changeType](a, b);
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
        init: function(a) {
            assertContent(a, "name", "value");
            this.name = a.name;
            this.value = a.value;
            if (a.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[a.changeConnected]
        },
        run: function(a) {
            var b = ig.Event.getExpressionValue(this.name),
                a = this.changeConnected && this.changeConnected(a) || a,
                c = ig.Event.getExpressionValue(this.value);
            a.setAttribute(b, c);
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
    var k = {
        set: function(a, b) {
            return b
        },
        append: function(a,
            b) {
            return a + b
        },
        prepend: function(a, b) {
            return b + a
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
                    _select: k,
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
        init: function(a) {
            this.name = a.name;
            this.value = a.value;
            this.changeType = k[a.changeType] || k.set;
            if (a.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[a.changeConnected]
        },
        run: function(a) {
            var b = ig.Event.getExpressionValue(this.name),
                a = this.changeConnected && this.changeConnected(a) || a,
                c = ig.Event.getExpressionValue(this.value),
                d = a.getAttribute(b) || "",
                c = this.changeType(d, c);
            a.setAttribute(b, c);
            return true
        }
    });
    var l = {
        set: function(a, b) {
            return b
        },
        add: function(a, b) {
            return a + b
        },
        sub: function(a, b) {
            return a - b
        },
        mul: function(a, b) {
            return a * b
        },
        div: function(a, b) {
            return a / b
        },
        mod: function(a, b) {
            return a % b
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
                    _select: l
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
        init: function(a) {
            this.attribName = a.attribName;
            this.changeOperator = l[a.changeType] || l.set;
            this.value = a.value || 0;
            if (a.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[a.changeConnected]
        },
        run: function(a) {
            var b = ig.Event.getExpressionValue(this.attribName),
                a = this.changeConnected && this.changeConnected(a) || a,
                c = a.getAttribute(b) || 0,
                d = ig.Event.getExpressionValue(this.value),
                c = this.changeOperator(c, d * 1);
            a.setAttribute(b, c);
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
                    _select: l
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
        init: function(a) {
            this.attribName = a.attribName;
            this.changeOperator = l[a.changeType] || l.set;
            this.minValue = a.minValue || 0;
            this.maxValue = a.maxValue || 0;
            if (a.changeConnected) this.changeConnected = ig.ACTOR_ATTRIB_CONNECTION[a.changeConnected]
        },
        run: function(a) {
            var a = this.changeConnected && this.changeConnected(a) || a,
                b = a.getAttribute(this.attribName) || 0,
                c = ig.Event.getExpressionValue(this.minValue),
                d = ig.Event.getExpressionValue(this.maxValue),
                c = c * 1,
                d = d * 1,
                c = c + Math.floor(Math.random() * (d - c + 1)),
                b = this.changeOperator(b,
                    c);
            a.setAttribute(this.attribName, b);
            return true
        }
    });
    var o = {
        TARGET: function(a) {
            return a.getTarget()
        },
        SELF: function(a) {
            return a
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
                    _select: o
                }
            }
        }),
        init: function(a) {
            this.name = a.name;
            this.target = o[a.target] || o.TARGET
        },
        start: function(a) {
            var b = this.target(a);
            b && a.setAttribute(this.name,
                Vec2.create(b.face))
        },
        run: function() {
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
                    _select: o
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
        init: function(a) {
            this.name = a.name;
            this.target = o[a.target] || o.TARGET;
            this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.offset = a.offset;
            this.faceDistance = a.faceDistance ||
                0;
            this.faceRound = a.faceRound || 0;
            this.selfFaceDistance = a.selfFaceDistance || 0;
            this.checkCollision = a.checkCollision || false
        },
        start: function(a) {
            var b = this.target(a);
            if (b) {
                var c = b.getAlignedPos(this.align, Vec3.create());
                this.offset && Vec3.add(c, this.offset);
                if (this.faceDistance) {
                    var d = Vec2.assign(g, b.face);
                    this.faceRound && ig.getRoundedFaceDir(d.x, d.y, this.faceRound, d);
                    Vec2.length(d, this.faceDistance);
                    Vec2.add(c, d)
                }
                if (this.selfFaceDistance) {
                    d = Vec2.assign(g, a.face);
                    Vec2.length(d, this.selfFaceDistance);
                    Vec2.add(c,
                        d)
                }
                this.checkCollision && !ig.navigation.isPositionFree(c, a, b, true) ? a.setAttribute(this.name, null) : a.setAttribute(this.name, c)
            }
        },
        run: function() {
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
        init: function(a) {
            assertContent(a, "sound");
            this.sound = new ig.Sound(a.sound, a.volume || 1, a.variance || 0);
            this.global = a.global || false;
            this.loop = a.loop || false;
            this.radius = a.radius || 0;
            this.speedVar = a.speedVar;
            this.speedVarFactor = a.speedVarFactor || 1;
            this.settings = {
                speed: a.speed || 1,
                fadeDuration: a.fadeDuration || 0
            }
        },
        clearCached: function() {
            this.sound.clearCached()
        },
        run: function(a) {
            var b =
                this.settings;
            if (this.speedVar) {
                var b = ig.copy(this.settings),
                    c = (ig.vars.get(this.speedVar) || 0) * this.speedVarFactor;
                b.speed = b.speed + c
            }
            b = this.global ? this.sound.play(this.loop, b) : ig.SoundHelper.playAtEntity(this.sound, a, this.loop, b, this.radius);
            this.loop && a.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.STOP_SOUNDS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            a.clearActionAttached(b);
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
        init: function(a) {
            for (var b = 0; b < a.sounds.length; ++b) {
                var c = a.sounds[b];
                this.sounds.push(new ig.Sound(c.sound, c.volume || 1, c.variance ||
                    0))
            }
            this.global = a.global || false;
            this.loop = a.loop || false;
            this.settings = {
                speed: a.speed || 1
            }
        },
        clearCached: function() {
            for (var a = this.sounds.length; a--;) this.sounds[a].clearCached()
        },
        run: function(a) {
            var b;
            b = this.sounds.random();
            b = this.global ? b.play(this.loop, this.settings) : ig.SoundHelper.playAtEntity(b, a, this.loop, this.settings);
            this.loop && a.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.HIDE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            a.hide();
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
        init: function(a) {
            this.entity = a.entity
        },
        run: function() {
            var a = ig.Event.getEntity(this.entity);
            a && a.hide();
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
        init: function(a) {
            this.newPos = a.newPos
        },
        start: function(a) {
            var b = ig.Action.getVec3(this.newPos, a, m),
                c = a.coll;
            a.setPos(b.x - c.size.x / 2, b.y - c.size.y / 2, b.z)
        }
    });
    ig.ACTION_STEP.ROUND_POSITION = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            var b = a.coll;
            a.setPos(Math.round(b.pos.x), Math.round(b.pos.y), b.pos.z)
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
        init: function(a) {
            this.zDelta = a.zDelta;
            this.zMultiply = a.zMultiply || 0
        },
        start: function(a) {
            var b = ig.Event.getNumberVary(this.zDelta),
                c = a.coll.pos.z;
            this.zMultiply && (c = c * this.zMultiply);
            a.setPos(void 0, void 0, c + b)
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
        init: function(a) {
            this.attrib =
                a.attrib
        },
        start: function(a) {
            var b = a.getAttribVec3(this.attrib);
            if (b) {
                b = Vec3.assign(m, b);
                b.x = b.x - a.coll.size.x / 2;
                b.y = b.y - a.coll.size.y / 2;
                a.setPos(b.x, b.y, b.z)
            }
        }
    });
    var m = Vec3.createC(0, 0, 0);
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
        init: function(a) {
            this.newPos = a.newPos;
            this.duration = a.duration || 0;
            this.keySpline = KEY_SPLINES[a.keySpline || "LINEAR"];
            this.timePerTile = a.timePerTile || false
        },
        start: function(a) {
            a.stepData.startPos = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
            if (this.timePerTile) {
                var b = ig.Action.getVec3(this.newPos, a, d);
                Vec3.sub(b, a.stepData.startPos);
                b = Vec3.length(b);
                a.stepData.duration = b / 16 * this.duration
            } else a.stepData.duration = this.duration;
            a.stepTimer = a.stepData.duration
        },
        run: function(a) {
            var b = 1 - (a.stepTimer / a.stepData.duration).limit(0, 1),
                b = this.keySpline.get(b),
                c = ig.Action.getVec3(this.newPos, a, d);
            Vec3.lerp(a.stepData.startPos, c, b, m);
            a.setPos(m.x - a.coll.size.x / 2, m.y - a.coll.size.y / 2, m.z, true);
            return b >= 1
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
        init: function(a) {
            this.delta = a.delta;
            this.duration = a.duration || 0;
            this.keySpline = KEY_SPLINES[a.keySpline || "LINEAR"]
        },
        start: function(a) {
            a.stepData.startPos = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
            a.stepData.duration = ig.Event.getNumberVary(this.duration);
            a.stepTimer = a.stepData.duration
        },
        run: function(a) {
            var b = 1 - (a.stepTimer / a.stepData.duration).limit(0, 1),
                c = this.keySpline.get(b),
                c = Vec3.addMulF(a.stepData.startPos, this.delta, c, d);
            a.setPos(c.x - a.coll.size.x / 2, c.y - a.coll.size.y / 2, c.z, true);
            return b >= 1
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
        init: function(a) {
            this.newZPos = a.newZPos || 0;
            this.duration = a.duration || 0;
            this.keySpline = KEY_SPLINES[a.keySpline || "LINEAR"]
        },
        start: function(a) {
            a.stepTimer = this.duration;
            a.stepData.zStartPos = a.coll.pos.z
        },
        run: function(a) {
            var b = 1 - (a.stepTimer / this.duration).limit(0, 1),
                b = this.keySpline.get(b);
            a.setZPos(a.stepData.zStartPos * (1 - b) + this.newZPos * b);
            return b >= 1
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
        init: function(a) {
            this.attrib = a.attrib;
            this.noStateReset = a.noStateReset || false;
            this.resumeStashed = a.resumeStashed || false
        },
        start: function(a) {
            var b = a.getAttribute(this.attrib);
            this.resumeStashed && a.stashed.action == b ? a.resumeStashedAction(this.noStateReset) :
                a.setAction(b, false, this.noStateReset)
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
        init: function(a) {
            this.name = a.name;
            this.spriteIdx = a.spriteIdx || 0;
            this.tileOffset = a.tileOffset || 0
        },
        start: function(a) {
            (new ig.AnimModification(a,
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
        init: function(a) {
            this.name = a.name
        },
        start: function(a) {
            ig.AnimModification.removeMods(a, this.name)
        }
    })
});
ig.baked = !0;
