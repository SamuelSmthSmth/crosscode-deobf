ig.module("impact.feature.base.event-steps").requires("impact.base.utils", "impact.base.event", "impact.base.action").defines(function() {
    function b(a, b) {
        if (!a) return false;
        if (!b && a instanceof ig.ENTITY.Player) return true;
        if (!(a instanceof ig.ENTITY.NPC)) return false;
        if (a.characterName.startsWith("cross-worlds")) return true;
        if (b) return false;
        if (a.characterName.startsWith("main") || a.characterName.startsWith("antagonists")) return true
    }

    function a(a) {
        switch (a) {
            case "set":
                return "=";
            case "add":
                return "+=";
            case "sub":
                return "-=";
            case "mul":
                return "*=";
            case "div":
                return "/=";
            case "mod":
                return "%=";
            case "and":
                return "&=";
            case "or":
                return "|=";
            case "xor":
                return "XOR";
            case "append":
                return "+=";
            case "prepend":
                return "+="
        }
        return "???"
    }
    var d = /^(\d+)_(\d+)$/;
    ig.EVENT_STEP.SELECT_RANDOM = ig.EventStepBase.extend({
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
                if (a == "_end") return "END_SELECT_RANDOM";
                var b = d.exec(a);
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
                for (var c = this.options[b], d = 0; d < c.count; ++d) a.push(b +
                    "_" + d);
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
    ig.EVENT_STEP.SELECT_FIRST = ig.EventStepBase.extend({
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
    ig.EVENT_STEP.LABEL = ig.EventStepBase.extend({
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
    ig.EVENT_STEP.GOTO_LABEL = ig.EventStepBase.extend({
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
            assertContent(a,
                "name");
            this.name = a.name
        },
        getJumpLabelName: function() {
            return this.name
        }
    });
    ig.EVENT_STEP.GOTO_LABEL_WHILE = ig.EventStepBase.extend({
        name: null,
        condition: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Label to move to."
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition to jump to the label"
                }
            },
            label: function() {
                return "<b>GOTO_LABEL</b> <i>" + this.name + "</i> <b>WHILE</b> <i>" + this.condition + "</i>"
            }
        }),
        init: function(a) {
            assertContent(a, "name");
            this.name = a.name;
            this.condition = new ig.VarCondition(a.condition)
        },
        getJumpLabelName: function() {
            return this.condition.evaluate() ? this.name : null
        }
    });
    ig.EVENT_STEP.WAIT = ig.EventStepBase.extend({
        time: 0,
        _timer: 0,
        ignoreSlowDown: false,
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "NumberExpression",
                    _info: "Time to wait in seconds"
                },
                ignoreSlowDown: {
                    _type: "Boolean",
                    _info: "Ignore slow down rate on wait"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "time");
            this.time = a.time;
            this.ignoreSlowDown = a.ignoreSlowDown || false
        },
        start: function(a) {
            a._timer = ig.Event.getExpressionValue(this.time)
        },
        run: function(a) {
            a._timer =
                a._timer - (this.ignoreSlowDown ? ig.system.actualTick : ig.system.tick);
            return a._timer <= 0
        }
    });
    ig.EVENT_STEP.WAIT_RANDOM = ig.EventStepBase.extend({
        maxTime: 0,
        minTime: 0,
        _wm: new ig.Config({
            attributes: {
                minTime: {
                    _type: "NumberExpression",
                    _info: "Minimum time to wait"
                },
                maxTime: {
                    _type: "NumberExpression",
                    _info: "Maximum time to wait"
                },
                ignoreSlowDown: {
                    _type: "Boolean",
                    _info: "Ignore slow down rate on wait"
                }
            }
        }),
        init: function(a) {
            this.minTime = a.minTime;
            this.maxTime = a.maxTime;
            this.ignoreSlowDown = a.ignoreSlowDown || false
        },
        start: function(a) {
            var b = ig.Event.getExpressionValue(this.maxTime),
                c = ig.Event.getExpressionValue(this.minTime);
            a._timer = c + Math.random() * (b - c)
        },
        run: function(a) {
            a._timer = a._timer - (this.ignoreSlowDown ? ig.system.actualTick : ig.system.tick);
            return a._timer <= 0
        }
    });
    ig.EVENT_STEP.WAIT_UNTIL_TRUE = ig.EventStepBase.extend({
        condition: null,
        _timer: 0,
        ignoreSlowDown: false,
        _wm: new ig.Config({
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition to evaluate to true to continue"
                },
                maxTime: {
                    _type: "NumberExpression",
                    _info: "If defined: maximal wait this time",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "condition");
            this.condition = new ig.VarCondition(a.condition);
            this.maxTime = a.maxTime
        },
        start: function(a) {
            var b = ig.Event.getExpressionValue(this.maxTime);
            a._timer = b
        },
        run: function(a) {
            if (a._timer) {
                a._timer = a._timer - ig.system.tick;
                if (a._timer <= 0) return true
            }
            return this.condition.evaluate()
        }
    });
    ig.EVENT_STEP.WAIT_UNTIL_ACTION_DONE = ig.EventStepBase.extend({
        entity: 0,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to move",
                    _visualize: true,
                    _context: "Entity"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity");
            this.entity = a.entity
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            if (c) {
                a._actionEntity = c;
                a._currentAction = c.currentAction
            }
        },
        run: function(a) {
            return !a._actionEntity ? true : a._currentAction && a._actionEntity.currentAction == a._currentAction || a._actionEntity.respawn && a._actionEntity.respawn.timer ? false : true
        }
    });
    ig.EVENT_STEP.STOP_SKIP_MODE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            ig.system.skipMode = false
        }
    });
    ig.EVENT_STEP.SET_ENTITY_STATIC_TIME = ig.EventStepBase.extend({
        entity: null,
        value: true,
        global: false,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be changed"
                },
                value: {
                    _type: "Boolean",
                    _info: "true: Entity ignores world speed slow down. false: entity is slowed down."
                },
                global: {
                    _type: "Boolean",
                    _info: "If true, set static time globally"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity", "value");
            this.entity = a.entity;
            this.value =
                a.value;
            this.global = a.global
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            this.global ? c.coll.time.globalStatic = this.value : c.coll.time.animStatic = this.value
        }
    });
    ig.EVENT_STEP.SET_ENTITY_POS = ig.EventStepBase.extend({
        entity: null,
        position: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be changed"
                },
                position: {
                    _type: "Vec3",
                    _info: "New position of entity",
                    _pointSelect: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity", "position");
            this.entity = a.entity;
            this.position =
                a.position
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.entity, b);
            if (d) {
                var e = ig.Event.getVec3(this.position, c),
                    f = d.coll;
                d.setPos(e.x - f.size.x / 2, e.y - f.size.y / 2, e.z)
            }
        }
    });
    ig.EVENT_STEP.SET_ENTITY_POS_TO_ENTITY = ig.EventStepBase.extend({
        entity: null,
        position: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be placed"
                },
                refEntity: {
                    _type: "Entity",
                    _info: "Entity used to determine position"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to entity position"
                }
            }
        }),
        init: function(a) {
            this.entity =
                a.entity;
            this.refEntity = a.refEntity;
            this.offset = a.offset
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.entity, b),
                e = ig.Event.getEntity(this.refEntity, b);
            if (d && e) {
                e = e.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c);
                this.offset && Vec3.add(e, this.offset);
                var f = d.coll;
                d.setPos(e.x - f.size.x / 2, e.y - f.size.y / 2, e.z)
            }
        }
    });
    ig.EVENT_STEP.SET_ENTITY_ON_TOP_OTHER = ig.EventStepBase.extend({
        entity: null,
        groundEntity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be changed"
                },
                groundEntity: {
                    _type: "Entity",
                    _info: "Entity the first entity should stand on"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity", "groundEntity");
            this.entity = a.entity;
            this.groundEntity = a.groundEntity
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b),
                d = ig.Event.getEntity(this.groundEntity, b);
            c.setZPos(d.coll.pos.z + d.coll.size.z);
            c.coll.setGroundEntry(d.coll);
            c.coll.vel.z = 0
        }
    });
    var c = Vec3.create(),
        e = Vec2.create(),
        f = Vec2.create();
    Vec2.create();
    Vec2.create();
    ig.EVENT_STEP.ADJUST_ENTITY_POS = ig.EventStepBase.extend({
        entity: null,
        offset: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be changed"
                },
                offset: {
                    _type: "Vec3",
                    _info: "Offset applied to entity position ",
                    _rawZValue: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity", "offset");
            this.entity = a.entity;
            this.offset = a.offset
        },
        start: function(a, b) {
            var d = ig.Event.getEntity(this.entity, b),
                e = ig.Event.getVec3(this.offset, c);
            d.setPos(d.coll.pos.x + e.x, d.coll.pos.y + e.y, d.coll.pos.z + e.z)
        }
    });
    ig.EVENT_STEP.HIDE_ENTITY = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be hidden"
                },
                skipEffects: {
                    _type: "Boolean",
                    _info: "If true: Skip effects when showing entity"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity");
            this.entity = a.entity;
            this.skipEffects = a.skipEffects
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            c && !c._hidden && (this.skipEffects ? c.hide() : ig.game.requestEntityHide(c))
        }
    });
    ig.EVENT_STEP.SHOW_ENTITY = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be shown"
                },
                skipEffects: {
                    _type: "Boolean",
                    _info: "If true: Skip effects when showing entity"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity");
            this.entity = a.entity;
            this.skipEffects = a.skipEffects
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            c && c._hidden && c.show(this.skipEffects)
        }
    });
    ig.EVENT_STEP.SHOW_ANIMATION = ig.EventStepBase.extend({
        entity: null,
        anim: null,
        reset: false,
        followUp: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be changed",
                    _context: "Entity"
                },
                anim: {
                    _type: "EntityAnim",
                    _info: "Name of the new animation"
                },
                reset: {
                    _type: "Boolean",
                    _info: "Reset current animation state"
                },
                followUp: {
                    _type: "EntityAnim",
                    _info: "Animation that follows the set animation",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity", "anim");
            this.entity = a.entity;
            this.anim = a.anim;
            this.reset = a.reset || false;
            this.followUp = a.followUp || null
        },
        start: function(a, b) {
            ig.Event.getEntity(this.entity, b).setCurrentAnim(this.anim, this.reset, this.followUp, true)
        }
    });
    ig.EVENT_STEP.SHOW_EXTERN_ANIM = ig.EventStepBase.extend({
        entity: null,
        animSheet: null,
        animName: null,
        followUpSheet: null,
        followUpName: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be changed"
                },
                anim: {
                    _type: "Animation",
                    _info: "Animation to play"
                },
                followUp: {
                    _type: "Animation",
                    _info: "Animation to play after this animation",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "entity", "anim");
            this.entity = a.entity;
            this.animSheet = new ig.AnimationSheet(a.anim.sheet);
            this.animName = a.anim.name;
            if (a.followUp) {
                this.followUpSheet = new ig.AnimationSheet(a.followUp.sheet);
                this.followUpName = a.followUp.name
            }
        },
        clearCached: function() {
            this.animSheet.decreaseRef();
            this.followUpSheet && this.followUpSheet.decreaseRef()
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            if (c) {
                var d = sc.playerSkins.replaceAnim(this.animSheet),
                    e = sc.playerSkins.replaceAnim(this.followUpSheet);
                c.setCurrentAnim(d.anims[this.animName], true, e && e.anims[this.followUpName], true);
                c.animationFixed = true
            }
        }
    });
    ig.EVENT_STEP.CLEAR_ANIMATION = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to be changed"
                }
            }
        }),
        init: function(a) {
            this.entity = a.entity
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            if (c) c.animationFixed = false
        }
    });
    ig.EVENT_STEP.DO_ACTION = ig.EventStepBase.extend({
        entity: 0,
        action: null,
        wait: false,
        keepState: false,
        _actionEntity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to move",
                    _visualize: true,
                    _context: "Entity"
                },
                action: {
                    _type: "Action",
                    _info: "The action to perform",
                    _rec_visualize: ig.ACTION_STEP
                },
                repeating: {
                    _type: "Boolean",
                    _info: "Repeat Action"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until action is finished"
                },
                keepState: {
                    _type: "Boolean",
                    _info: "Don't reset entity state after action"
                },
                immediately: {
                    _type: "Boolean",
                    _info: "If true: execute action immediately not interrupting currently running action. Will only execute steps without wait duration."
                }
            },
            width: 500
        }),
        init: function(a) {
            assertContent(a, "entity", "action");
            this.entity = a.entity;
            this.action = new ig.Action("[GENERIC]", a.action, false, a.repeating);
            this.action.eventAction = true;
            this.wait = a.wait || false;
            this.keepState = a.keepState || false;
            this.immediately = a.immediately || false
        },
        clearCached: function() {
            this.action && this.action.clearCached()
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            a._actionEntity = c;
            if (this.immediately) {
                c.stashAction(true);
                c.setAction(this.action);
                c.forceExecuteAction();
                c.resumeStashedAction(true)
            } else c && c.setAction(this.action, this.keepState)
        },
        run: function(a) {
            return this.immediately || !a._actionEntity || !this.wait ? true : a._actionEntity.currentAction ==
                this.action || a._actionEntity.respawn && a._actionEntity.respawn.timer ? false : true
        }
    });
    ig.EVENT_STEP.WAIT_UNTIL_ON_GROUND = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to move",
                    _visualize: true,
                    _context: "Entity"
                }
            }
        }),
        init: function(a) {
            this.entity = a.entity
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            if (c) a._actionEntity = c
        },
        run: function(a) {
            if (!a._actionEntity) return true;
            a = a._actionEntity;
            return a.coll.vel.z >= 0 && !a.coll.zGravityFactor ? true : a.coll.pos.z ==
                a.coll.baseZPos
        }
    });
    ig.EVENT_STEP.GROUP_FACE_TO_ENTITY = ig.EventStepBase.extend({
        entity: 0,
        action: null,
        wait: false,
        keepState: false,
        _actionEntity: null,
        _wm: new ig.Config({
            attributes: {
                group: {
                    _type: "Array",
                    _info: "Entities to move face of",
                    _sub: {
                        _type: "Entity"
                    }
                },
                entity: {
                    _type: "Entity",
                    _info: "Entity to face",
                    _visualize: true
                },
                wait: {
                    _type: "Number",
                    _info: "Maximum time to wait before rotating face"
                },
                minWait: {
                    _type: "Number",
                    _info: "Minimum time to wait",
                    _optional: true
                },
                repeating: {
                    _type: "Boolean",
                    _info: "If true: execute repeating actions to constantly look at entity",
                    _optional: true
                }
            },
            width: 500
        }),
        init: function(a) {
            this.entity = a.entity;
            this.action = new ig.Action("[GENERIC]", [{
                type: "WAIT_RANDOM",
                minTime: a.minWait || 0,
                maxTime: a.wait || 0
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: this.entity,
                rotate: true
            }], false, a.repeating || false);
            this.action.eventAction = true;
            this.group = a.group
        },
        clearCached: function() {
            this.action && this.action.clearCached()
        },
        start: function(a, b) {
            for (var c = this.group.length; c--;) {
                var d = ig.Event.getEntity(this.group[c], b);
                d && d.setAction(this.action, false)
            }
        },
        run: function() {
            return true
        }
    });
    ig.EVENT_STEP.MASS_AVATAR_MOVE = ig.EventStepBase.extend({
        pointA: null,
        pointB: null,
        relativeSpeed: 1,
        postFace: null,
        forwardTime: 0,
        waitPerDistance: 0,
        _wm: new ig.Config({
            attributes: {
                pointA: {
                    _type: "Vec3",
                    _info: "point A to move to.",
                    _pointSelect: true
                },
                pointB: {
                    _type: "Vec3",
                    _info: "point B to move to. Will use closest point between A and B",
                    _pointSelect: true
                },
                relativeSpeed: {
                    _type: "Number",
                    _info: "Relative Speed of entities"
                },
                postFace: {
                    _type: "Face",
                    _info: "Direction to face after point is reached"
                },
                forwardTime: {
                    _type: "Number",
                    _info: "Time to move forward after point has been reached"
                },
                waitPerDistance: {
                    _type: "Number",
                    _info: "Seconds to wait per 100 pixel distance"
                }
            },
            width: 500
        }),
        init: function(a) {
            this.pointA = a.pointA;
            this.pointB = a.pointB;
            this.relativeSpeed = a.relativeSpeed;
            this.postFace = a.postFace;
            this.forwardTime = a.forwardTime;
            this.waitPerDistance = a.waitPerDistance
        },
        clearCached: function() {
            this.action && this.action.clearCached()
        },
        start: function() {
            for (var a = ig.Event.getVec3(this.pointA, c), d = ig.Event.getVec3(this.pointB, e), i = ig.game.shownEntities,
                    j = 1E3, k = -1E3, l = -1E3, o = 0; o < i.length; ++o) {
                var m = i[o];
                if (b(m)) var n = m.getCenter(f),
                    p = Line2.pointOnLineWeight(a, d, n, true),
                    j = Math.min(j, p),
                    k = Math.max(k, p),
                    l = Math.max(l, Line2.distanceLineToPoint(a, d, n))
            }
            for (o = 0; o < i.length; ++o) {
                m = i[o];
                if (b(m)) {
                    l = Vec3.create();
                    n = m.getCenter(f);
                    Line2.distanceLineToPoint(a, d, n);
                    p = Line2.pointOnLineWeight(a, d, n, true);
                    p = ((p - j) / (k - j)).limit(0, 1);
                    Line2.getWeightPoint(l, a, d, p);
                    n = Vec2.distance(l, n);
                    l.z = a.z;
                    n = new ig.Action("[GENERIC]", [{
                        type: "SET_COLL_TYPE",
                        value: "NONE"
                    }, {
                        type: "WAIT",
                        time: n / 100 * this.waitPerDistance
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: this.relativeSpeed
                    }, {
                        type: "MOVE_TO_POINT",
                        target: l,
                        precise: false
                    }, {
                        type: "SET_FACE",
                        face: this.postFace,
                        rotate: false
                    }, {
                        type: "MOVE_FORWARD",
                        time: this.forwardTime
                    }, {
                        type: "HIDE"
                    }], false, false);
                    n.eventAction = true;
                    m.setAction(n, false)
                }
            }
        },
        run: function() {
            return true
        }
    });
    ig.EVENT_STEP.MASS_AVATAR_FACE = ig.EventStepBase.extend({
        action: null,
        jumpDensity: 1,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to face",
                    _visualize: true
                },
                minWait: {
                    _type: "Number",
                    _info: "Minimum time to wait."
                },
                maxWait: {
                    _type: "Number",
                    _info: "Maximum time to wait."
                }
            },
            width: 500
        }),
        init: function(a) {
            this.action = new ig.Action("[GENERIC]", [{
                type: "WAIT_RANDOM",
                minTime: a.minWait || 0,
                maxTime: a.maxWait || 0
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: a.entity,
                rotate: true
            }], false, false);
            this.action.eventAction = true
        },
        clearCached: function() {
            this.action && this.action.clearCached()
        },
        start: function() {
            for (var a = ig.game.shownEntities, c = 0; c < a.length; ++c) {
                var d = a[c];
                b(d, true) && d.setAction(this.action,
                    false)
            }
        },
        run: function() {
            return true
        }
    });
    ig.EVENT_STEP.MASS_AVATAR_JUMP = ig.EventStepBase.extend({
        action: null,
        jumpDensity: 1,
        _wm: new ig.Config({
            attributes: {
                jumpHeight: {
                    _type: "String",
                    _info: "Height of jump",
                    _select: {
                        S: 100,
                        M: 150,
                        L: 180,
                        XL: 220,
                        XXL: 270
                    }
                },
                minWait: {
                    _type: "Number",
                    _info: "Minimum time to wait."
                },
                maxWait: {
                    _type: "Number",
                    _info: "Maximum time to wait."
                },
                jumpDensity: {
                    _type: "Number",
                    _info: "Number between 0-1: What percentage of avatars should do the jump - will be randomly selected"
                }
            },
            width: 500
        }),
        init: function(a) {
            this.action =
                new ig.Action("[GENERIC]", [{
                    type: "WAIT_RANDOM",
                    minTime: a.minWait || 0,
                    maxTime: a.maxWait || 0
                }, {
                    type: "SET_SLIP_THROUGH",
                    value: true
                }, {
                    type: "SET_SOUNDTYPE",
                    value: "none"
                }, {
                    type: "JUMP",
                    jumpHeight: a.jumpHeight,
                    wait: true,
                    ignoreSounds: true
                }], false, a.repeating || false);
            this.action.eventAction = true;
            this.jumpDensity = a.jumpDensity || 1
        },
        clearCached: function() {
            this.action && this.action.clearCached()
        },
        start: function() {
            for (var a = ig.game.shownEntities, c = [], d = 0; d < a.length; ++d) {
                var e = a[d];
                b(e, true) && c.push(e)
            }
            for (a = Math.floor(c.length *
                    this.jumpDensity); a--;) {
                d = Math.floor(Math.random() * c.length);
                e = c[d];
                c.splice(d, 1);
                e.setAction(this.action, false)
            }
        },
        run: function() {
            return true
        }
    });
    ig.EVENT_STEP.TELEPORT = ig.EventStepBase.extend({
        map: "",
        marker: "",
        _wm: new ig.Config({
            attributes: {
                map: {
                    _type: "Maps",
                    _info: "Map to be teleported to",
                    _context: "Map"
                },
                marker: {
                    _type: "Marker",
                    _info: "Marker on Map to be teleported to"
                }
            }
        }),
        init: function(a) {
            assertContent(a, "map");
            this.map = a.map;
            this.marker = a.marker
        },
        start: function() {
            ig.game.teleport(this.map, this.marker ?
                new ig.TeleportPosition(this.marker) : null)
        }
    });
    ig.EVENT_STEP.IF = ig.EventStepBase.extend({
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
            this.withElse =
                a.withElse
        },
        getBranchNames: function() {
            return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
        },
        getNext: function() {
            return this.condition.evaluate() ? this.branches.thenStep ? this.branches.thenStep : this._nextStep : this.branches.elseStep ? this.branches.elseStep : this._nextStep
        }
    });
    ig.EVENT_STEP.FORK_CONDITION = ig.EVENT_STEP.IF;
    ig.EVENT_STEP.CHANGE_VAR_NUMBER = ig.EventStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change"
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
                },
                map: {
                    _type: "Maps",
                    _info: "Change Var from within this map. Will replace map. prefix",
                    _context: "Map",
                    _optional: true
                }
            },
            label: function() {
                return "<b>VAR_NUMBER</b> <code>" + wmPrint("VarName", this.varName) + " " + a(this.changeType) + " " + wmPrint("NumberExpression", this.value) + "</code>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType",
                "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value;
            this.map = a.map
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            if (this.map) {
                a.startsWith("map.") && (a = a.substr(4));
                a = "maps." + this.map.toPath("", "").toCamel() + "." + a
            }
            var b = ig.Event.getExpressionValue(this.value);
            if (a) {
                b = b * 1;
                if (isNaN(b)) ig.log("CHANGE_VAR_NUMBER: Invalid value!");
                else if (ig.vars[this.changeType]) ig.vars[this.changeType](a, b);
                else ig.log("CHANGE_VAR_NUMBER: Invalid change type")
            } else ig.log("CHANGE_VAR_NUMBER: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.SET_RANDOM_VAR_NUMBER = ig.EventStepBase.extend({
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
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            a ? ig.vars.set(a, ~~(Math.random() * (this.max - this.min + 1)) + this.min) : ig.log("CHANGE_VAR_NUMBER: (Actor) Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.ROUND_VAR_NUMBER = ig.EventStepBase.extend({
        varName: null,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to round",
                    _withActor: true
                },
                roundType: {
                    _type: "String",
                    _info: "Type of round",
                    _select: {
                        round: 1,
                        floor: 1,
                        ceil: 1
                    }
                },
                digits: {
                    _type: "Integer",
                    _info: "Number of decimals to round to, 0 for whole number"
                }
            },
            label: function() {
                return "<b>ROUND_NUMBER</b> <code>" + wmPrint("VarName", this.varName) + "</code>  ; " + this.roundType + " ; " + this.digits + " digits"
            }
        }),
        init: function(a) {
            assertContent(a, "varName");
            this.varName = a.varName;
            this.roundType = a.roundType;
            this.digits = a.digits || 0
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            a ? this.roundType === "round" ? this.digits == 0 ? ig.vars.set(a, Math.round(ig.vars.get(a))) : ig.vars.set(a, Math.round(ig.vars.get(a) *
                Math.pow(10, this.digits)) / Math.pow(10, this.digits)) : this.roundType === "floor" ? this.digits == 0 ? ig.vars.set(a, Math.floor(ig.vars.get(a))) : ig.vars.set(a, Math.floor(ig.vars.get(a) * Math.pow(10, this.digits)) / Math.pow(10, this.digits)) : this.roundType === "ceil" && (this.digits == 0 ? ig.vars.set(a, Math.ceil(ig.vars.get(a))) : ig.vars.set(a, Math.ceil(ig.vars.get(a) * Math.pow(10, this.digits)) / Math.pow(10, this.digits))) : ig.log("CHANGE_VAR_NUMBER: (Actor) Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.SET_VAR_TIME = ig.EventStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to store current timestamp in milliseconds"
                }
            }
        }),
        init: function(a) {
            this.varName = a.varName
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            if (a) {
                var b = Date.now();
                ig.vars.set(a, b)
            } else ig.log("SET_VAR_TIME: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.CHANGE_VAR_VEC2 = ig.EventStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change"
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: {
                        set: 1,
                        add: 1,
                        sub: 1,
                        mul: 1,
                        div: 1
                    }
                },
                value: {
                    _type: "Vec2Expression",
                    _info: "Value to modify with"
                },
                map: {
                    _type: "Maps",
                    _info: "Change Var from within this map. Will replace map. prefix",
                    _context: "Map",
                    _optional: true
                }
            },
            label: function() {
                return "<b>VAR_VEC2</b> <i>" + wmPrint("VarName", this.varName) + " " + a(this.changeType) + " " + wmPrint("Vec2Expression", this.value) + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType",
                "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value;
            this.map = a.map
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            if (this.map) {
                a.startsWith("map.") && (a = a.substr(4));
                a = "maps." + this.map.toPath("", "").toCamel() + "." + a
            }
            var b = ig.Event.getExpressionValue(this.value);
            if (a)
                if (!b || b.y === void 0) ig.log("CHANGE_VAR_VEC2: value is not a Vec2!");
                else if (this.changeType == "set") ig.vars.set(a, b);
            else {
                var c = ig.vars.get(a);
                if (!c || c.y === void 0) ig.log("CHANGE_VAR_VEC2: dest is not a Vec2!");
                else {
                    switch (this.changeType) {
                        case "add":
                            Vec2.add(c, b);
                            break;
                        case "sub":
                            Vec2.sub(c, b);
                            break;
                        case "mul":
                            Vec2.mul(c, b);
                            break;
                        case "div":
                            Vec2.div(c, b)
                    }
                    ig.vars.set(a, c)
                }
            } else ig.log("CHANGE_VAR_VEC2: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.CHANGE_VAR_VEC3 = ig.EventStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change"
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: {
                        set: 1,
                        add: 1,
                        sub: 1,
                        mul: 1,
                        div: 1
                    }
                },
                value: {
                    _type: "Vec3Expression",
                    _info: "Value to modify with"
                },
                map: {
                    _type: "Maps",
                    _info: "Change Var from within this map. Will replace map. prefix",
                    _context: "Map",
                    _optional: true
                }
            },
            label: function() {
                return "<b>VAR_VEC3</b> <i>" + wmPrint("VarName", this.varName) + " " + a(this.changeType) + " " + wmPrint("Vec3Expression", this.value) + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value;
            this.map =
                a.map
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            if (this.map) {
                a.startsWith("map.") && (a = a.substr(4));
                a = "maps." + this.map.toPath("", "").toCamel() + "." + a
            }
            var b = ig.Event.getExpressionValue(this.value);
            if (a)
                if (!b || b.z === void 0) ig.log("CHANGE_VAR_VEC3: value is not a Vec3!");
                else if (this.changeType == "set") ig.vars.set(a, b);
            else {
                var c = ig.vars.get(a);
                if (!c || c.z === void 0) ig.log("CHANGE_VAR_VEC3: dest is not a Vec3!");
                else {
                    switch (this.changeType) {
                        case "add":
                            Vec3.add(c, b);
                            break;
                        case "sub":
                            Vec3.sub(c,
                                b);
                            break;
                        case "mul":
                            Vec3.mul(c, b);
                            break;
                        case "div":
                            Vec3.div(c, b)
                    }
                    ig.vars.set(a, c)
                }
            } else ig.log("CHANGE_VAR_VEC3: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.CHANGE_VAR_BOOL = ig.EventStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change"
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
                },
                map: {
                    _type: "Maps",
                    _info: "Change Var from within this map. Will replace map. prefix",
                    _context: "Map",
                    _optional: true
                }
            },
            label: function() {
                return "<b>VAR_BOOL</b> <code>" + wmPrint("VarName", this.varName) + " " + a(this.changeType) + " " + wmPrint("BooleanExpression", this.value) + "</code>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value;
            this.map = a.map
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            if (this.map) {
                a.startsWith("map.") && (a = a.substr(4));
                a = "maps." + this.map.toPath("",
                    "").toCamel() + "." + a
            }
            var b = ig.Event.getExpressionValue(this.value);
            if (a) {
                b = !!b;
                if (ig.vars[this.changeType]) ig.vars[this.changeType](a, b);
                else ig.log("CHANGE_VAR_BOOL: Invalid change type")
            } else ig.log("CHANGE_VAR_BOOL: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.CLEAR_TEMP_STORAGE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {},
            label: function() {
                return "<b>VAR CLEAR TEMP</b>"
            }
        }),
        init: function() {},
        start: function() {
            ig.vars.clearTemp()
        }
    });
    ig.EVENT_STEP.CHANGE_VAR_STRING = ig.EventStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change"
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
                },
                map: {
                    _type: "Maps",
                    _info: "Change Var from within this map. Will replace map. prefix",
                    _context: "Map",
                    _optional: true
                }
            },
            label: function() {
                var b, c;
                if (this.changeType == "prepend") {
                    b = wmPrint("StringExpression", this.value);
                    c = wmPrint("VarName", this.varName)
                } else {
                    b =
                        wmPrint("VarName", this.varName);
                    c = wmPrint("StringExpression", this.value)
                }
                return "<b>VAR_STRING</b> <i>" + b + " " + a(this.changeType) + " " + c + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = a.value;
            this.map = a.map
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            if (this.map) {
                a.startsWith("map.") && (a = a.substr(4));
                a = "maps." + this.map.toPath("", "").toCamel() + "." + a
            }
            var b = ig.Event.getExpressionValue(this.value);
            if (a) {
                b = "" + b;
                if (ig.vars[this.changeType]) ig.vars[this.changeType](a, b);
                else ig.log("CHANGE_VAR_STRING: Invalid change type")
            } else ig.log("CHANGE_VAR_STRING: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.CHANGE_VAR_LANG = ig.EventStepBase.extend({
        varName: null,
        changeType: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to change"
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: {
                        set: 1,
                        append: 1
                    }
                },
                value: {
                    _type: "LangLabel",
                    _info: "Value to modify with"
                },
                map: {
                    _type: "Maps",
                    _info: "Change Var from within this map. Will replace map. prefix",
                    _context: "Map",
                    _optional: true
                }
            },
            label: function() {
                return "<b>VAR_LANG</b> <i>" + wmPrint("VarName", this.varName) + " " + a(this.changeType) + " " + wmPrint("LangLabel", this.value) + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function(a) {
            assertContent(a, "varName", "changeType", "value");
            this.varName = a.varName;
            this.changeType = a.changeType;
            this.value = new ig.LangLabel(a.value);
            this.map = a.map
        },
        start: function() {
            var a = ig.Event.getVarName(this.varName);
            if (this.map) {
                a.startsWith("map.") && (a = a.substr(4));
                a = "maps." + this.map.toPath("", "").toCamel() + "." + a
            }
            var b = this.value.toString();
            if (a) {
                b = "" + b;
                if (ig.vars[this.changeType]) ig.vars[this.changeType](a, b);
                else ig.log("CHANGE_VAR_STRING: Invalid change type")
            } else ig.log("CHANGE_VAR_STRING: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.SET_ATTRIB_VEC2 = ig.EventStepBase.extend({
        actor: 0,
        name: null,
        value: null,
        _wm: new ig.Config({
            attributes: {
                actor: {
                    _type: "Actor",
                    _info: "Actor to change"
                },
                name: {
                    _type: "String",
                    _info: "Name of enemy attribute to set"
                },
                value: {
                    _type: "Vec2Expression",
                    _info: "Vec2 value to be set",
                    _pointSelect: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "actor", "name", "value");
            this.actor = a.actor;
            this.name = a.name;
            this.value = a.value
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.actor, b);
            if (c) {
                var d = ig.Event.getExpressionValue(this.value);
                c.setAttribute(this.name, d)
            }
        }
    });
    ig.EVENT_STEP.SET_ATTRIB_VEC3 = ig.EventStepBase.extend({
        actor: 0,
        name: null,
        value: null,
        _wm: new ig.Config({
            attributes: {
                actor: {
                    _type: "Actor",
                    _info: "Actor to change"
                },
                name: {
                    _type: "String",
                    _info: "Name of actor attribute to set"
                },
                value: {
                    _type: "Vec3Expression",
                    _info: "Vec3 value to be set",
                    _pointSelect: true
                }
            }
        }),
        init: ig.EVENT_STEP.SET_ATTRIB_VEC2.prototype.init,
        start: ig.EVENT_STEP.SET_ATTRIB_VEC2.prototype.start
    });
    ig.EVENT_STEP.SET_ATTRIB_STRING = ig.EventStepBase.extend({
        actor: 0,
        name: null,
        value: null,
        _wm: new ig.Config({
            attributes: {
                actor: {
                    _type: "Actor",
                    _info: "Actor to change"
                },
                name: {
                    _type: "String",
                    _info: "Name of enemy attribute to set"
                },
                value: {
                    _type: "StringExpression",
                    _info: "String value to be set"
                }
            }
        }),
        init: ig.EVENT_STEP.SET_ATTRIB_VEC2.prototype.init,
        start: ig.EVENT_STEP.SET_ATTRIB_VEC2.prototype.start
    });
    ig.EVENT_STEP.PLAY_SOUND = ig.EventStepBase.extend({
        sound: null,
        position: {
            x: 0,
            y: 0
        },
        loop: false,
        settings: null,
        name: null,
        speed: null,
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
                position: {
                    _type: "Vec2",
                    _info: "The position to play the sound at.",
                    _pointSelect: true,
                    _optional: true
                },
                name: {
                    _type: "String",
                    _info: "A name for the sound, is only valid if loop is true."
                },
                loop: {
                    _type: "Boolean",
                    _info: "True if the sound should loop. <i>EXPERIMENTAL!</i>"
                },
                offset: {
                    _type: "Number",
                    _info: "Offset to start the sound at. <i>EXPERIMENTAL!</i>"
                },
                startTime: {
                    _type: "Number",
                    _info: "Time to wait before playing the sound. <i>EXPERIMENTAL!</i>"
                },
                speed: {
                    _type: "Number",
                    _info: "Playback speed. 1=default speed. 0.5=half speed.",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "sound");
            this.sound = new ig.Sound(a.sound, a.volume || 1, a.variance || 0);
            this.position = a.position || null;
            this.settings = {
                offset: a.offset || 0,
                startTime: a.startTime || 0,
                speed: a.speed || 1
            };
            this.loop = a.loop || false;
            this.name = a.name || null
        },
        clearCached: function() {
            this.sound.clearCached()
        },
        start: function() {
            var a;
            if (this.name && this.loop) {
                a = this.sound.play(this.loop, this.settings);
                ig.soundManager.addNamedSound(this.name, a)
            } else a = this.sound.play(false, this.settings);
            a && this.position &&
                a.setFixPosition(this.position, null)
        }
    });
    ig.EVENT_STEP.STOP_SOUND = ig.EventStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "The of the sound to stop"
                }
            }
        }),
        init: function(a) {
            this.name = a.name || null
        },
        start: function() {
            this.name && ig.soundManager.stopNamedSounds(this.name)
        }
    });
    ig.EVENT_STEP.SET_MOVING_LAYER_STOP = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                stopped: {
                    _type: "Boolean",
                    _info: "If true: stop moving layers"
                }
            }
        }),
        init: function(a) {
            this.stopped = a.stopped ||
                false
        },
        start: function() {
            for (var a = ig.game.maps, b = a.length; b--;) a[b] instanceof ig.MAP.MovingParallax && a[b].setStopped(this.stopped)
        }
    });
    ig.ConsoleType = {
        LOG: function(a) {
            ig.log(a)
        },
        WARN: function(a) {
            ig.warn(a)
        },
        DEBUG: function(a) {
            ig.debug(a)
        }
    };
    ig.EVENT_STEP.CONSOLE_LOG = ig.EventStepBase.extend({
        text: null,
        consoleType: ig.ConsoleType.LOG,
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "String",
                    _info: "The text to display on the console. "
                },
                consoleType: {
                    _type: "String",
                    _info: "The type of the console log.",
                    _select: ig.ConsoleType
                }
            }
        }),
        init: function(a) {
            this.text = a.text || null;
            this.consoleType = a.consoleType || ig.ConsoleType.LOG
        },
        start: function() {
            if (this.text) ig.ConsoleType[this.consoleType](this.text)
        }
    })
});
ig.baked = !0;
