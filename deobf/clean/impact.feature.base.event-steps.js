/**
 * impact.feature.base.event-steps
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.base.event-steps")`.
 *
 * Every `ig.EVENT_STEP.*` step class used inside event scripts. Each class
 * provides `init(settings)` (parse the step's editor config), then
 * `start(stepData, event)` / `run(stepData)` where `stepData` is the running
 * step's state and `event` is the event context passed to `ig.Event.getEntity`.
 * The `_wm` blocks are editor-only config metadata and are kept verbatim.
 */

ig.module("impact.feature.base.event-steps").requires("impact.base.utils", "impact.base.event", "impact.base.action").defines(function () {
    /**
     * True for entities that count as "avatars" (mass-reaction helpers):
     * the player, NPCs, and characters whose name starts with "cross-worlds",
     * "main" or "antagonists". `excludeCrossWorlds` filters the cross-worlds
     * group out (used by the face/jump mass steps).
     */
    function isAvatar(entity, excludeCrossWorlds) {
        if (!entity) return false;
        if (!excludeCrossWorlds && entity instanceof ig.ENTITY.Player) return true;
        if (!(entity instanceof ig.ENTITY.NPC)) return false;
        if (entity.characterName.startsWith("cross-worlds")) return true;
        if (excludeCrossWorlds) return false;
        if (entity.characterName.startsWith("main") || entity.characterName.startsWith("antagonists")) return true
    }

    /** The operator symbol shown for a CHANGE_VAR change type in the editor. */
    function getChangeSymbol(changeType) {
        switch (changeType) {
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

    var branchPattern = /^(\d+)_(\d+)$/;
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
                for (var option = this.options[i], j = 0; j < option.count; ++j) branchNames.push(i +
                    "_" + j);
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
    ig.EVENT_STEP.LABEL = ig.EventStepBase.extend({
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
    ig.EVENT_STEP.GOTO_LABEL = ig.EventStepBase.extend({
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
            assertContent(settings,
                "name");
            this.name = settings.name
        },
        getJumpLabelName: function () {
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
            label: function () {
                return "<b>GOTO_LABEL</b> <i>" + this.name + "</i> <b>WHILE</b> <i>" + this.condition + "</i>"
            }
        }),
        init: function (settings) {
            assertContent(settings, "name");
            this.name = settings.name;
            this.condition = new ig.VarCondition(settings.condition)
        },
        getJumpLabelName: function () {
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
        init: function (settings) {
            assertContent(settings, "time");
            this.time = settings.time;
            this.ignoreSlowDown = settings.ignoreSlowDown || false
        },
        start: function (stepData) {
            stepData._timer = ig.Event.getExpressionValue(this.time)
        },
        run: function (stepData) {
            stepData._timer =
                stepData._timer - (this.ignoreSlowDown ? ig.system.actualTick : ig.system.tick);
            return stepData._timer <= 0
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
        init: function (settings) {
            this.minTime = settings.minTime;
            this.maxTime = settings.maxTime;
            this.ignoreSlowDown = settings.ignoreSlowDown || false
        },
        start: function (stepData) {
            var maxTime = ig.Event.getExpressionValue(this.maxTime),
                minTime = ig.Event.getExpressionValue(this.minTime);
            stepData._timer = minTime + Math.random() * (maxTime - minTime)
        },
        run: function (stepData) {
            stepData._timer = stepData._timer - (this.ignoreSlowDown ? ig.system.actualTick : ig.system.tick);
            return stepData._timer <= 0
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
        init: function (settings) {
            assertContent(settings, "condition");
            this.condition = new ig.VarCondition(settings.condition);
            this.maxTime = settings.maxTime
        },
        start: function (stepData) {
            var maxTime = ig.Event.getExpressionValue(this.maxTime);
            stepData._timer = maxTime
        },
        run: function (stepData) {
            if (stepData._timer) {
                stepData._timer = stepData._timer - ig.system.tick;
                if (stepData._timer <= 0) return true
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
        init: function (settings) {
            assertContent(settings, "entity");
            this.entity = settings.entity
        },
        start: function (stepData, event) {
            var actionEntity = ig.Event.getEntity(this.entity, event);
            if (actionEntity) {
                stepData._actionEntity = actionEntity;
                stepData._currentAction = actionEntity.currentAction
            }
        },
        run: function (stepData) {
            return !stepData._actionEntity ? true : stepData._currentAction && stepData._actionEntity.currentAction == stepData._currentAction || stepData._actionEntity.respawn && stepData._actionEntity.respawn.timer ? false : true
        }
    });
    ig.EVENT_STEP.STOP_SKIP_MODE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {
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
        init: function (settings) {
            assertContent(settings, "entity", "value");
            this.entity = settings.entity;
            this.value =
                settings.value;
            this.global = settings.global
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            this.global ? entity.coll.time.globalStatic = this.value : entity.coll.time.animStatic = this.value
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
        init: function (settings) {
            assertContent(settings, "entity", "position");
            this.entity = settings.entity;
            this.position =
                settings.position
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            if (entity) {
                var pos = ig.Event.getVec3(this.position, scratchVec3),
                    coll = entity.coll;
                entity.setPos(pos.x - coll.size.x / 2, pos.y - coll.size.y / 2, pos.z)
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
        init: function (settings) {
            this.entity =
                settings.entity;
            this.refEntity = settings.refEntity;
            this.offset = settings.offset
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event),
                refEntity = ig.Event.getEntity(this.refEntity, event);
            if (entity && refEntity) {
                refEntity = refEntity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, scratchVec3);
                this.offset && Vec3.add(refEntity, this.offset);
                var coll = entity.coll;
                entity.setPos(refEntity.x - coll.size.x / 2, refEntity.y - coll.size.y / 2, refEntity.z)
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
        init: function (settings) {
            assertContent(settings, "entity", "groundEntity");
            this.entity = settings.entity;
            this.groundEntity = settings.groundEntity
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event),
                groundEntity = ig.Event.getEntity(this.groundEntity, event);
            entity.setZPos(groundEntity.coll.pos.z + groundEntity.coll.size.z);
            entity.coll.setGroundEntry(groundEntity.coll);
            entity.coll.vel.z = 0
        }
    });

    var scratchVec3 = Vec3.create(),
        scratchVecA = Vec2.create(),
        scratchVecB = Vec2.create();
    // (The original also allocates two throwaway scratch vectors here.)
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
        init: function (settings) {
            assertContent(settings, "entity", "offset");
            this.entity = settings.entity;
            this.offset = settings.offset
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event),
                offset = ig.Event.getVec3(this.offset, scratchVec3);
            entity.setPos(entity.coll.pos.x + offset.x, entity.coll.pos.y + offset.y, entity.coll.pos.z + offset.z)
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
        init: function (settings) {
            assertContent(settings, "entity");
            this.entity = settings.entity;
            this.skipEffects = settings.skipEffects
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            entity && !entity._hidden && (this.skipEffects ? entity.hide() : ig.game.requestEntityHide(entity))
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
        init: function (settings) {
            assertContent(settings, "entity");
            this.entity = settings.entity;
            this.skipEffects = settings.skipEffects
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            entity && entity._hidden && entity.show(this.skipEffects)
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
        init: function (settings) {
            assertContent(settings, "entity", "anim");
            this.entity = settings.entity;
            this.anim = settings.anim;
            this.reset = settings.reset || false;
            this.followUp = settings.followUp || null
        },
        start: function (stepData, event) {
            ig.Event.getEntity(this.entity, event).setCurrentAnim(this.anim, this.reset, this.followUp, true)
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
        init: function (settings) {
            assertContent(settings, "entity", "anim");
            this.entity = settings.entity;
            this.animSheet = new ig.AnimationSheet(settings.anim.sheet);
            this.animName = settings.anim.name;
            if (settings.followUp) {
                this.followUpSheet = new ig.AnimationSheet(settings.followUp.sheet);
                this.followUpName = settings.followUp.name
            }
        },
        clearCached: function () {
            this.animSheet.decreaseRef();
            this.followUpSheet && this.followUpSheet.decreaseRef()
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            if (entity) {
                var animSheet = sc.playerSkins.replaceAnim(this.animSheet),
                    followUpSheet = sc.playerSkins.replaceAnim(this.followUpSheet);
                entity.setCurrentAnim(animSheet.anims[this.animName], true, followUpSheet && followUpSheet.anims[this.followUpName], true);
                entity.animationFixed = true
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
        init: function (settings) {
            this.entity = settings.entity
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            if (entity) entity.animationFixed = false
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
        init: function (settings) {
            assertContent(settings, "entity", "action");
            this.entity = settings.entity;
            this.action = new ig.Action("[GENERIC]", settings.action, false, settings.repeating);
            this.action.eventAction = true;
            this.wait = settings.wait || false;
            this.keepState = settings.keepState || false;
            this.immediately = settings.immediately || false
        },
        clearCached: function () {
            this.action && this.action.clearCached()
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            stepData._actionEntity = entity;
            if (this.immediately) {
                entity.stashAction(true);
                entity.setAction(this.action);
                entity.forceExecuteAction();
                entity.resumeStashedAction(true)
            } else entity && entity.setAction(this.action, this.keepState)
        },
        run: function (stepData) {
            return this.immediately || !stepData._actionEntity || !this.wait ? true : stepData._actionEntity.currentAction ==
                this.action || stepData._actionEntity.respawn && stepData._actionEntity.respawn.timer ? false : true
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
        init: function (settings) {
            this.entity = settings.entity
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            if (entity) stepData._actionEntity = entity
        },
        run: function (stepData) {
            if (!stepData._actionEntity) return true;
            var entity = stepData._actionEntity;
            return entity.coll.vel.z >= 0 && !entity.coll.zGravityFactor ? true : entity.coll.pos.z ==
                entity.coll.baseZPos
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
        init: function (settings) {
            this.entity = settings.entity;
            this.action = new ig.Action("[GENERIC]", [{
                type: "WAIT_RANDOM",
                minTime: settings.minWait || 0,
                maxTime: settings.wait || 0
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: this.entity,
                rotate: true
            }], false, settings.repeating || false);
            this.action.eventAction = true;
            this.group = settings.group
        },
        clearCached: function () {
            this.action && this.action.clearCached()
        },
        start: function (stepData, event) {
            for (var i = this.group.length; i--;) {
                var entity = ig.Event.getEntity(this.group[i], event);
                entity && entity.setAction(this.action, false)
            }
        },
        run: function () {
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
        init: function (settings) {
            this.pointA = settings.pointA;
            this.pointB = settings.pointB;
            this.relativeSpeed = settings.relativeSpeed;
            this.postFace = settings.postFace;
            this.forwardTime = settings.forwardTime;
            this.waitPerDistance = settings.waitPerDistance
        },
        clearCached: function () {
            this.action && this.action.clearCached()
        },
        start: function () {
            for (var pointA = ig.Event.getVec3(this.pointA, scratchVec3), pointB = ig.Event.getVec3(this.pointB, scratchVecA), shownEntities = ig.game.shownEntities,
                    minWeight = 1E3, maxWeight = -1E3, maxDist = -1E3, i = 0; i < shownEntities.length; ++i) {
                var entity = shownEntities[i];
                if (isAvatar(entity)) var center = entity.getCenter(scratchVecB),
                    weight = Line2.pointOnLineWeight(pointA, pointB, center, true),
                    minWeight = Math.min(minWeight, weight),
                    maxWeight = Math.max(maxWeight, weight),
                    maxDist = Math.max(maxDist, Line2.distanceLineToPoint(pointA, pointB, center))
            }
            for (i = 0; i < shownEntities.length; ++i) {
                entity = shownEntities[i];
                if (isAvatar(entity)) {
                    var dest = Vec3.create();
                    center = entity.getCenter(scratchVecB);
                    Line2.distanceLineToPoint(pointA, pointB, center);
                    weight = Line2.pointOnLineWeight(pointA, pointB, center, true);
                    weight = ((weight - minWeight) / (maxWeight - minWeight)).limit(0, 1);
                    Line2.getWeightPoint(dest, pointA, pointB, weight);
                    var distance = Vec2.distance(dest, center);
                    dest.z = pointA.z;
                    var action = new ig.Action("[GENERIC]", [{
                        type: "SET_COLL_TYPE",
                        value: "NONE"
                    }, {
                        type: "WAIT",
                        time: distance / 100 * this.waitPerDistance
                    }, {
                        type: "SET_RELATIVE_SPEED",
                        value: this.relativeSpeed
                    }, {
                        type: "MOVE_TO_POINT",
                        target: dest,
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
                    action.eventAction = true;
                    entity.setAction(action, false)
                }
            }
        },
        run: function () {
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
        init: function (settings) {
            this.action = new ig.Action("[GENERIC]", [{
                type: "WAIT_RANDOM",
                minTime: settings.minWait || 0,
                maxTime: settings.maxWait || 0
            }, {
                type: "SET_FACE_TO_ENTITY",
                entity: settings.entity,
                rotate: true
            }], false, false);
            this.action.eventAction = true
        },
        clearCached: function () {
            this.action && this.action.clearCached()
        },
        start: function () {
            for (var shownEntities = ig.game.shownEntities, i = 0; i < shownEntities.length; ++i) {
                var entity = shownEntities[i];
                isAvatar(entity, true) && entity.setAction(this.action,
                    false)
            }
        },
        run: function () {
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
        init: function (settings) {
            this.action =
                new ig.Action("[GENERIC]", [{
                    type: "WAIT_RANDOM",
                    minTime: settings.minWait || 0,
                    maxTime: settings.maxWait || 0
                }, {
                    type: "SET_SLIP_THROUGH",
                    value: true
                }, {
                    type: "SET_SOUNDTYPE",
                    value: "none"
                }, {
                    type: "JUMP",
                    jumpHeight: settings.jumpHeight,
                    wait: true,
                    ignoreSounds: true
                }], false, settings.repeating || false);
            this.action.eventAction = true;
            this.jumpDensity = settings.jumpDensity || 1
        },
        clearCached: function () {
            this.action && this.action.clearCached()
        },
        start: function () {
            for (var shownEntities = ig.game.shownEntities, avatars = [], i = 0; i < shownEntities.length; ++i) {
                var entity = shownEntities[i];
                isAvatar(entity, true) && avatars.push(entity)
            }
            for (var count = Math.floor(avatars.length *
                    this.jumpDensity); count--;) {
                i = Math.floor(Math.random() * avatars.length);
                entity = avatars[i];
                avatars.splice(i, 1);
                entity.setAction(this.action, false)
            }
        },
        run: function () {
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
        init: function (settings) {
            assertContent(settings, "map");
            this.map = settings.map;
            this.marker = settings.marker
        },
        start: function () {
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
            this.withElse =
                settings.withElse
        },
        getBranchNames: function () {
            return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
        },
        getNext: function () {
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
            label: function () {
                return "<b>VAR_NUMBER</b> <code>" + wmPrint("VarName", this.varName) + " " + getChangeSymbol(this.changeType) + " " + wmPrint("NumberExpression", this.value) + "</code>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType",
                "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value;
            this.map = settings.map
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (this.map) {
                varName.startsWith("map.") && (varName = varName.substr(4));
                varName = "maps." + this.map.toPath("", "").toCamel() + "." + varName
            }
            var value = ig.Event.getExpressionValue(this.value);
            if (varName) {
                value = value * 1;
                if (isNaN(value)) ig.log("CHANGE_VAR_NUMBER: Invalid value!");
                else if (ig.vars[this.changeType]) ig.vars[this.changeType](varName, value);
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
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            varName ? ig.vars.set(varName, ~~(Math.random() * (this.max - this.min + 1)) + this.min) : ig.log("CHANGE_VAR_NUMBER: (Actor) Variable Name is not a String!")
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
            label: function () {
                return "<b>ROUND_NUMBER</b> <code>" + wmPrint("VarName", this.varName) + "</code>  ; " + this.roundType + " ; " + this.digits + " digits"
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName");
            this.varName = settings.varName;
            this.roundType = settings.roundType;
            this.digits = settings.digits || 0
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            varName ? this.roundType === "round" ? this.digits == 0 ? ig.vars.set(varName, Math.round(ig.vars.get(varName))) : ig.vars.set(varName, Math.round(ig.vars.get(varName) *
                Math.pow(10, this.digits)) / Math.pow(10, this.digits)) : this.roundType === "floor" ? this.digits == 0 ? ig.vars.set(varName, Math.floor(ig.vars.get(varName))) : ig.vars.set(varName, Math.floor(ig.vars.get(varName) * Math.pow(10, this.digits)) / Math.pow(10, this.digits)) : this.roundType === "ceil" && (this.digits == 0 ? ig.vars.set(varName, Math.ceil(ig.vars.get(varName))) : ig.vars.set(varName, Math.ceil(ig.vars.get(varName) * Math.pow(10, this.digits)) / Math.pow(10, this.digits))) : ig.log("CHANGE_VAR_NUMBER: (Actor) Variable Name is not a String!")
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
        init: function (settings) {
            this.varName = settings.varName
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (varName) {
                var timestamp = Date.now();
                ig.vars.set(varName, timestamp)
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
            label: function () {
                return "<b>VAR_VEC2</b> <i>" + wmPrint("VarName", this.varName) + " " + getChangeSymbol(this.changeType) + " " + wmPrint("Vec2Expression", this.value) + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType",
                "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value;
            this.map = settings.map
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (this.map) {
                varName.startsWith("map.") && (varName = varName.substr(4));
                varName = "maps." + this.map.toPath("", "").toCamel() + "." + varName
            }
            var value = ig.Event.getExpressionValue(this.value);
            if (varName)
                if (!value || value.y === void 0) ig.log("CHANGE_VAR_VEC2: value is not a Vec2!");
                else if (this.changeType == "set") ig.vars.set(varName, value);
            else {
                var current = ig.vars.get(varName);
                if (!current || current.y === void 0) ig.log("CHANGE_VAR_VEC2: dest is not a Vec2!");
                else {
                    switch (this.changeType) {
                        case "add":
                            Vec2.add(current, value);
                            break;
                        case "sub":
                            Vec2.sub(current, value);
                            break;
                        case "mul":
                            Vec2.mul(current, value);
                            break;
                        case "div":
                            Vec2.div(current, value)
                    }
                    ig.vars.set(varName, current)
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
            label: function () {
                return "<b>VAR_VEC3</b> <i>" + wmPrint("VarName", this.varName) + " " + getChangeSymbol(this.changeType) + " " + wmPrint("Vec3Expression", this.value) + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value;
            this.map =
                settings.map
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (this.map) {
                varName.startsWith("map.") && (varName = varName.substr(4));
                varName = "maps." + this.map.toPath("", "").toCamel() + "." + varName
            }
            var value = ig.Event.getExpressionValue(this.value);
            if (varName)
                if (!value || value.z === void 0) ig.log("CHANGE_VAR_VEC3: value is not a Vec3!");
                else if (this.changeType == "set") ig.vars.set(varName, value);
            else {
                var current = ig.vars.get(varName);
                if (!current || current.z === void 0) ig.log("CHANGE_VAR_VEC3: dest is not a Vec3!");
                else {
                    switch (this.changeType) {
                        case "add":
                            Vec3.add(current, value);
                            break;
                        case "sub":
                            Vec3.sub(current,
                                value);
                            break;
                        case "mul":
                            Vec3.mul(current, value);
                            break;
                        case "div":
                            Vec3.div(current, value)
                    }
                    ig.vars.set(varName, current)
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
            label: function () {
                return "<b>VAR_BOOL</b> <code>" + wmPrint("VarName", this.varName) + " " + getChangeSymbol(this.changeType) + " " + wmPrint("BooleanExpression", this.value) + "</code>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value;
            this.map = settings.map
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (this.map) {
                varName.startsWith("map.") && (varName = varName.substr(4));
                varName = "maps." + this.map.toPath("",
                    "").toCamel() + "." + varName
            }
            var value = ig.Event.getExpressionValue(this.value);
            if (varName) {
                value = !!value;
                if (ig.vars[this.changeType]) ig.vars[this.changeType](varName, value);
                else ig.log("CHANGE_VAR_BOOL: Invalid change type")
            } else ig.log("CHANGE_VAR_BOOL: Variable Name is not a String!")
        }
    });
    ig.EVENT_STEP.CLEAR_TEMP_STORAGE = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {},
            label: function () {
                return "<b>VAR CLEAR TEMP</b>"
            }
        }),
        init: function () {},
        start: function () {
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
            label: function () {
                var left, right;
                if (this.changeType == "prepend") {
                    left = wmPrint("StringExpression", this.value);
                    right = wmPrint("VarName", this.varName)
                } else {
                    left =
                        wmPrint("VarName", this.varName);
                    right = wmPrint("StringExpression", this.value)
                }
                return "<b>VAR_STRING</b> <i>" + left + " " + getChangeSymbol(this.changeType) + " " + right + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = settings.value;
            this.map = settings.map
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (this.map) {
                varName.startsWith("map.") && (varName = varName.substr(4));
                varName = "maps." + this.map.toPath("", "").toCamel() + "." + varName
            }
            var value = ig.Event.getExpressionValue(this.value);
            if (varName) {
                value = "" + value;
                if (ig.vars[this.changeType]) ig.vars[this.changeType](varName, value);
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
            label: function () {
                return "<b>VAR_LANG</b> <i>" + wmPrint("VarName", this.varName) + " " + getChangeSymbol(this.changeType) + " " + wmPrint("LangLabel", this.value) + "</i>" + (this.map ? " (" + this.map + ")" : "")
            }
        }),
        init: function (settings) {
            assertContent(settings, "varName", "changeType", "value");
            this.varName = settings.varName;
            this.changeType = settings.changeType;
            this.value = new ig.LangLabel(settings.value);
            this.map = settings.map
        },
        start: function () {
            var varName = ig.Event.getVarName(this.varName);
            if (this.map) {
                varName.startsWith("map.") && (varName = varName.substr(4));
                varName = "maps." + this.map.toPath("", "").toCamel() + "." + varName
            }
            var value = this.value.toString();
            if (varName) {
                value = "" + value;
                if (ig.vars[this.changeType]) ig.vars[this.changeType](varName, value);
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
        init: function (settings) {
            assertContent(settings, "actor", "name", "value");
            this.actor = settings.actor;
            this.name = settings.name;
            this.value = settings.value
        },
        start: function (stepData, event) {
            var entity = ig.Event.getEntity(this.actor, event);
            if (entity) {
                var value = ig.Event.getExpressionValue(this.value);
                entity.setAttribute(this.name, value)
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
        init: function (settings) {
            assertContent(settings, "sound");
            this.sound = new ig.Sound(settings.sound, settings.volume || 1, settings.variance || 0);
            this.position = settings.position || null;
            this.settings = {
                offset: settings.offset || 0,
                startTime: settings.startTime || 0,
                speed: settings.speed || 1
            };
            this.loop = settings.loop || false;
            this.name = settings.name || null
        },
        clearCached: function () {
            this.sound.clearCached()
        },
        start: function () {
            var sound;
            if (this.name && this.loop) {
                sound = this.sound.play(this.loop, this.settings);
                ig.soundManager.addNamedSound(this.name, sound)
            } else sound = this.sound.play(false, this.settings);
            sound && this.position &&
                sound.setFixPosition(this.position, null)
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
        init: function (settings) {
            this.name = settings.name || null
        },
        start: function () {
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
        init: function (settings) {
            this.stopped = settings.stopped ||
                false
        },
        start: function () {
            for (var maps = ig.game.maps, i = maps.length; i--;) maps[i] instanceof ig.MAP.MovingParallax && maps[i].setStopped(this.stopped)
        }
    });

    /** Console output types selectable for CONSOLE_LOG. */
    ig.ConsoleType = {
        LOG: function (text) {
            ig.log(text)
        },
        WARN: function (text) {
            ig.warn(text)
        },
        DEBUG: function (text) {
            ig.debug(text)
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
        init: function (settings) {
            this.text = settings.text || null;
            this.consoleType = settings.consoleType || ig.ConsoleType.LOG
        },
        start: function () {
            if (this.text) ig.ConsoleType[this.consoleType](this.text)
        }
    })
});
ig.baked = !0;
