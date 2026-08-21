/**
 * game.feature.player.player-steps
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.player-steps")`.
 *
 * Event and action steps that drive the player from cutscenes/events:
 * skill learning, element switching, camera targeting (with automatic
 * undo-on-action-end via `sc.PlayerCameraFocusHandle`), item consumption,
 * food icons, proxy balls and the save-variable "player.model.value".
 */
ig.module("game.feature.player.player-steps").requires(
    "impact.base.animation",
    "impact.base.action",
    "impact.base.entity",
    "game.feature.player.player-config",
    "game.feature.combat.model.combat-params",
    "impact.feature.camera.camera",
    "game.feature.combat.entities.food-icon",
    "game.feature.party.party"
).defines(function () {

    /** Detach a focus handle already attached to the action for the given add flag. */
    function detachCameraFocusHandle(action, add) {
        for (var attached = action.actionAttached, index = attached.length; index--;) {
            var handle = attached[index];
            if (handle instanceof sc.PlayerCameraFocusHandle) {
                handle.add != add && attached.splice(index, 1);
                return true
            }
        }
        return false
    }
    var PLAYER_VALUE_TYPES = {
        NONE: 0,
        MONEY: 1
    };
    ig.EVENT_STEP.SAVE_PLAYER_MODEL_VALUE = ig.EventStepBase.extend({
        modelType: null,
        _wm: new ig.Config({
            attributes: {
                modelType: {
                    _type: "String",
                    _info: "Mode value to set",
                    _select: PLAYER_VALUE_TYPES
                }
            },
            label: function () {
                return "<i>SET</i> " + this.modelType + " TO <b>player.model.value</b>"
            }
        }),
        init: function (data) {
            this.modelType = PLAYER_VALUE_TYPES[data.modelType] || PLAYER_VALUE_TYPES.NONE
        },
        start: function () {
            var value = void 0;
            switch (this.modelType) {
                case PLAYER_VALUE_TYPES.MONEY:
                    value = sc.model.player.credit >= 1E3
            }
            value != void 0 && ig.vars.set("player.model.value", value)
        }
    });
    ig.EVENT_STEP.ADD_PLAYER_CAMERA_TARGET =
        ig.EventStepBase.extend({
            entity: null,
            _wm: new ig.Config({
                attributes: {
                    entity: {
                        _type: "Entity",
                        _info: "Entity to target"
                    },
                    speed: {
                        _type: "String",
                        _info: "Speed of camera transition",
                        _select: ig.Camera.SPEED_OPTIONS,
                        _optional: true
                    }
                }
            }),
            init: function (data) {
                this.entity = data.entity;
                this.speed = data.speed
            },
            start: function (entity, settings) {
                var target = ig.Event.getEntity(this.entity, settings);
                target && ig.game.playerEntity.addCameraTarget(target, this.speed)
            }
        });
    ig.EVENT_STEP.REMOVE_PLAYER_CAMERA_TARGET = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to target"
                },
                speed: {
                    _type: "String",
                    _info: "Speed of camera transition",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _optional: true
                }
            }
        }),
        init: function (data) {
            this.entity = data.entity;
            this.speed = data.speed
        },
        start: function (entity, settings) {
            var target = ig.Event.getEntity(this.entity, settings);
            target && ig.game.playerEntity.removeCameraTarget(target, this.speed)
        }
    });
    ig.EVENT_STEP.REMOVE_ALL_PLAYER_CAMERAS = ig.EventStepBase.extend({
        speed: null,
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "String",
                    _info: "Speed of camera transition",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _optional: true
                }
            }
        }),
        init: function (data) {
            this.speed = data.speed
        },
        start: function () {
            ig.game.playerEntity.removeAllCameraTargets(this.speed)
        }
    });
    ig.EVENT_STEP.LEARN_SKILL = ig.EventStepBase.extend({
        skill: null,
        _wm: new ig.Config({
            attributes: {
                skill: {
                    _type: "Integer",
                    _info: "Skill ID"
                }
            }
        }),
        init: function (data) {
            this.skill = data.skill
        },
        start: function () {
            sc.model.player.learnSkill(this.skill)
        }
    });
    ig.EVENT_STEP.DO_INLINE_LEVELUP = ig.EventStepBase.extend({
        skill: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function () {
            if (sc.model.player.hasLevelUp()) {
                sc.model.enterGame();
                ig.game.playerEntity.levelUpNotifier.runLevelUpScene(ig.game.playerEntity, sc.model.player, true)
            }
        },
        run: function () {
            if (sc.model.isRunning()) {
                sc.model.enterCutscene();
                return true
            }
            return false
        }
    });
    var ELEMENT_RESET_OPTIONS = {
        NEUTRAL: 0,
        HEAT: 1,
        COLD: 2,
        SHOCK: 3,
        WAVE: 4,
        ALL_AVAILABLE: 5
    };
    ig.EVENT_STEP.RESET_SKILL_TREE = ig.EventStepBase.extend({
        element: null,
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "element to reset",
                    _select: ELEMENT_RESET_OPTIONS,
                    _default: ELEMENT_RESET_OPTIONS.ALL_AVAILABLE
                }
            },
            label: function () {
                return "RESET <b>" + this.element + "</b> SKILLTREE"
            }
        }),
        init: function (data) {
            this.element = ELEMENT_RESET_OPTIONS[data.element || "NEUTRAL"]
        },
        start: function () {
            if (this.element >= 5)
                for (var element = 0; element < 5; element++) sc.model.player.hasElement(element) && sc.model.player.resetSkillTree(element);
            else sc.model.player.resetSkillTree(this.element)
        }
    });
    ig.EVENT_STEP.SET_ELEMENT_LOAD = ig.EventStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Value of load. 0=empty, 1=full (instant elemental overload)"
                }
            }
        }),
        init: function (data) {
            this.value = data.value || 0
        },
        start: function () {
            sc.model.player.setElementLoad(this.value)
        }
    });
    ig.EVENT_STEP.SWITCH_PLAYER_CONFIG = ig.EventStepBase.extend({
        name: null,
        config: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of player config",
                    _select: sc.PARTY_OPTIONS
                }
            }
        }),
        init: function (data) {
            this.name = data.name;
            this.config = new sc.PlayerConfig(this.name)
        },
        clearCached: function () {
            this.config.decreaseRef()
        },
        start: function () {
            sc.model.player.setConfig(this.config)
        }
    });
    ig.EVENT_STEP.WAIT_UNTIL_PLAYER_CHARGED = ig.EventStepBase.extend({
        level: null,
        _wm: new ig.Config({
            attributes: {
                level: {
                    _type: "Number",
                    _info: "Wait until this level of charge has been reached"
                }
            }
        }),
        init: function (data) {
            this.level = data.level
        },
        run: function () {
            return this.level <= ig.game.playerEntity.getCurrentChargeLevel()
        }
    });
    ig.EVENT_STEP.SWITCH_ELEMENT_MODE = ig.EventStepBase.extend({
        element: null,
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element to switch to",
                    _select: sc.ELEMENT
                },
                skipEffect: {
                    _type: "Boolean",
                    _info: "If true: do no show effects of changing elements"
                }
            }
        }),
        init: function (data) {
            this.element = sc.ELEMENT[data.element] || sc.ELEMENT.NEUTRAL;
            this.skipEffect = data.skipEffect
        },
        start: function () {
            sc.model.player.setElementMode(this.element, true, this.skipEffect)
        }
    });
    ig.EVENT_STEP.SWITCH_TO_ELEMENT_WITH_COMBAT_ART = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                artType: {
                    _type: "String",
                    _info: "Type of combat art",
                    _select: ["THROW", "ATTACK", "DASH", "GUARD"],
                    _optional: true
                },
                level: {
                    _type: "Integer",
                    _info: "Minimum Level"
                },
                skipEffect: {
                    _type: "Boolean",
                    _info: "If true: do no show effects of changing elements"
                }
            }
        }),
        init: function (data) {
            this.artType = data.artType ||
                null;
            this.level = data.level;
            this.skipEffect = data.skipEffect
        },
        start: function () {
            for (var element in sc.ELEMENT)
                if (sc.model.player.getCombatArtLevel(this.artType, sc.ELEMENT[element]) >= this.level) {
                    sc.model.player.setElementMode(sc.ELEMENT[element], true, this.skipEffect);
                    break
                }
        }
    });
    ig.EVENT_STEP.SET_VAR_COMBAT_ART_TYPE_WITH_MIN_LEVEL = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Will include the type of combat art THROW, ATTACK, DASH or GUARD"
                },
                level: {
                    _type: "Integer",
                    _info: "Minimum Level of combat art"
                }
            }
        }),
        init: function (data) {
            this.varName = data.varName || null;
            this.level = data.level
        },
        start: function () {
            for (var elementMode = sc.model.player.currentElementMode, artTypes = ["THROW", "ATTACK", "DASH", "GUARD"], varName = ig.Event.getVarName(this.varName), index = 0; index < artTypes.length; ++index) {
                var artType = artTypes[index];
                if (sc.model.player.getCombatArtLevel(artType, elementMode) >= this.level) {
                    ig.vars.set(varName, artType);
                    break
                }
            }
        }
    });
    ig.EVENT_STEP.HIDE_PETS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                hide: {
                    _type: "Boolean",
                    _info: "If true: hide pets"
                }
            }
        }),
        init: function (data) {
            this.hide = data.hide
        },
        start: function () {
            ig.game.playerEntity.hidePets =
                this.hide
        }
    });
    var posVec = Vec3.create(),
        dirVec = Vec2.create();
    ig.ACTION_STEP.SHOOT_PROXY_PLAYER = ig.ActionStepBase.extend({
        proxySrc: null,
        elementProxy: null,
        align: 0,
        startDist: 0,
        _wm: new ig.Config({
            attributes: {
                proxy: {
                    _type: "ProxyRef",
                    _info: "Ball the entity will shoot",
                    _optional: true
                },
                elementProxy: {
                    _type: "String",
                    _info: "Ball the entity will shoot",
                    _optional: true,
                    _select: ["QUICK", "CHARGED"]
                },
                align: {
                    _type: "String",
                    _info: "If defined: use specified alignment to shoot ball",
                    _optional: true,
                    _select: ig.ENTITY_ALIGN
                },
                startDist: {
                    _type: "Number",
                    _info: "If defined: start projectile with given distance from center",
                    _optional: true
                }
            }
        }),
        init: function (data) {
            data.elementProxy ? this.elementProxy = data.elementProxy : this.proxySrc = sc.ProxyTools.prepareSrc(data.proxy);
            if (data.align) this.align = ig.ENTITY_ALIGN[data.align];
            this.startDist = data.startDist || 0
        },
        run: function (entity) {
            var ball;
            if (this.elementProxy)
                if (this.elementProxy == "CHARGED" && entity.overrideBall) ball = entity.overrideBall;
                else {
                    ball = sc.combat.getElementMode(entity);
                    ball = sc.PlayerConfig.getElementBall(entity, ball, this.elementProxy == "CHARGED")
                }
            else ball = sc.ProxyTools.getProxy(this.proxySrc,
                entity);
            if (ball) {
                if (this.align) entity.getAlignedPos(this.align, posVec);
                else {
                    var jumpHeight = entity.maxJumpHeight === void 0 ? -1 : entity.maxJumpHeight;
                    posVec.x = entity.coll.pos.x + entity.coll.size.x / 2;
                    posVec.y = entity.coll.pos.y + entity.coll.size.y / 2;
                    posVec.z = jumpHeight < 0 ? entity.coll.pos.z : Math.min(entity.coll.pos.z, jumpHeight);
                    posVec.z = posVec.z + Constants.BALL_HEIGHT
                }
                var throwDir = entity.throwDirData || entity.face;
                if (this.startDist) {
                    Vec2.assign(dirVec, throwDir);
                    Vec2.length(dirVec, this.startDist);
                    Vec2.add(posVec, dirVec)
                }
                ball.spawn(posVec.x, posVec.y, posVec.z, entity, throwDir)
            }
            return true
        }
    });
    ig.ACTION_STEP.SET_PLAYER_ACTION_BLOCK = ig.ActionStepBase.extend({
        blockTypes: null,
        _wm: new ig.Config({
            attributes: {
                blockData: {
                    _type: "Object",
                    _info: "Block Time Data"
                }
            }
        }),
        init: function (data) {
            assertContent(data, "blockData");
            this.blockData = data.blockData
        },
        run: function (entity) {
            entity.setActionBlocked && entity.setActionBlocked(this.blockData);
            return true
        }
    });
    ig.ACTION_STEP.SET_PLAYER_ANIM_SHEET = ig.ActionStepBase.extend({
        animSheet: null,
        _wm: new ig.Config({
            attributes: {
                animSheet: {
                    _type: "AnimSheetRef",
                    _info: "Animations of enemy"
                }
            }
        }),
        init: function (data) {
            this.animSheet = new ig.AnimationSheet(data.animSheet)
        },
        clearCached: function () {
            this.animSheet.decreaseRef()
        },
        run: function (entity) {
            entity.replaceAnimSheet &&
                entity.replaceAnimSheet(sc.playerSkins.replaceAnim(this.animSheet));
            return true
        }
    });
    ig.ACTION_STEP.CLEAR_PLAYER_ANIM_SHEET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        run: function (entity) {
            entity.replaceAnimSheet && entity.replaceAnimSheet(null);
            return true
        }
    });
    ig.ACTION_STEP.SET_PLAYER_INVINCIBLE = ig.ActionStepBase.extend({
        factor: false,
        _wm: new ig.Config({
            attributes: {
                factor: {
                    _type: "Number",
                    _info: "Factor multiplied with base invincibility",
                    _default: 1
                }
            }
        }),
        init: function (data) {
            this.factor = data.factor ||
                1
        },
        run: function (entity) {
            var invincibleTime = (3 + entity.params.getStat("focus") / 250) * (1 + entity.params.getModifier("DASH_INVINC"));
            entity.stunEscapeDash && (invincibleTime = invincibleTime + 12);
            invincibleTime = invincibleTime / 60 * this.factor;
            entity.isPlayer || (invincibleTime = invincibleTime + 0.2);
            entity.invincibleTimer = invincibleTime;
            return true
        }
    });
    ig.ACTION_STEP.PLAYER_ADJUST_FACE = ig.ActionStepBase.extend({
        time: 0,
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Duration over which to adjust face"
                }
            }
        }),
        init: function (data) {
            this.time = data.time || 0
        },
        start: function (entity) {
            entity.stepTimer = entity.stepTimer + this.time
        },
        run: function (entity) {
            var root = entity.getCombatantRoot();
            root.isPlayer && root.gui.crosshair.active && root.gui.crosshair.getDir(entity.face);
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.PLAYER_ADJUST_MOVE_DIR = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function (entity) {
            if (entity.isPlayer) {
                sc.control.moveDir(dirVec, 1);
                Vec2.isZero(dirVec) || Vec2.assign(entity.face, dirVec)
            }
        }
    });
    ig.ACTION_STEP.PLAYER_MOVE_TO_DIR = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Duration for which player will move along pressed direction"
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed in which player will rotate to pressed direction. In rotations per seconds.",
                    _default: 0.2,
                    _optional: true
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving forward"
                },
                allowStop: {
                    _type: "Boolean",
                    _info: "If true: allow player to stop if no direction is pressed"
                }
            }
        }),
        init: function (data) {
            this.time = data.time || 0;
            this.rotateSpeed = data.rotateSpeed || 0;
            this.stopBeforeEdge = data.stopBeforeEdge;
            this.allowStop = data.allowStop
        },
        start: function (entity) {
            entity.stepTimer = entity.stepTimer +
                this.time
        },
        run: function (entity) {
            var shouldStop = false;
            if (entity.isPlayer) {
                sc.control.moveDir(dirVec, 1);
                Vec2.isZero(dirVec) ? this.allowStop && (shouldStop = true) : this.rotateSpeed ? Vec2.rotateToward(entity.face, dirVec, this.rotateSpeed * Math.PI * 2 * ig.system.tick) : Vec2.assign(entity.face, dirVec)
            }
            shouldStop ? Vec2.assignC(entity.coll.accelDir, 0, 0) : Vec2.assign(entity.coll.accelDir, entity.face);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0)
            }
            return entity.stepTimer <= 0
        }
    });

    /** Action-attached handle that reverses a camera-target change on action end. */
    sc.PlayerCameraFocusHandle = ig.Class.extend({
        add: false,
        speed: null,
        init: function (add, speed) {
            this.add = add;
            this.speed = speed
        },
        onActionEndDetach: function (entity) {
            this.add ? ig.game.playerEntity.removeCameraTarget(entity, this.speed) : ig.game.playerEntity.addCameraTarget(entity, this.speed)
        }
    });
    ig.ACTION_STEP.ADD_PLAYER_CAMERA_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "String",
                    _info: "Speed of camera transition",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _optional: true
                },
                actionDetached: {
                    _type: "Boolean",
                    _info: "If true: Do NOT undo change when action is cancelled"
                },
                onlyAfterRemove: {
                    _type: "Boolean",
                    _info: "If true: Only add target if it was previously removed within the action. Use this if the goal is to temporary remove a camera target."
                }
            }
        }),
        init: function (data) {
            this.speed = data.speed;
            this.actionDetached = data.actionDetached;
            this.onlyAfterRemove = data.onlyAfterRemove || false
        },
        start: function (entity) {
            if (!ig.game.playerEntity.hasCameraTarget(entity)) {
                var shouldAdd = !this.onlyAfterRemove && !this.actionAttached;
                if (!this.actionDetached)
                    if (detachCameraFocusHandle(entity, true)) shouldAdd = true;
                    else if (!this.onlyAfterRemove) {
                    var handle = new sc.PlayerCameraFocusHandle(true, this.speed);
                    entity.addActionAttached(handle)
                }
                shouldAdd && ig.game.playerEntity.addCameraTarget(entity, this.speed)
            }
        }
    });
    ig.ACTION_STEP.REMOVE_PLAYER_CAMERA_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "String",
                    _info: "Speed of camera transition",
                    _select: ig.Camera.SPEED_OPTIONS,
                    _optional: true
                },
                actionDetached: {
                    _type: "Boolean",
                    _info: "If true: Do NOT undo change when action is cancelled"
                }
            }
        }),
        init: function (data) {
            this.speed = data.speed;
            this.actionDetached = data.actionDetached
        },
        start: function (entity) {
            if (ig.game.playerEntity.hasCameraTarget(entity)) {
                ig.game.playerEntity.removeCameraTarget(entity,
                    this.speed);
                if (!this.actionDetached && !detachCameraFocusHandle(entity, false)) {
                    var handle = new sc.PlayerCameraFocusHandle(false, this.speed);
                    entity.addActionAttached(handle)
                }
            }
        }
    });
    ig.ACTION_STEP.ADD_PLAYER_SHIELD = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                perfectGuard: {
                    _type: "Boolean",
                    _info: "If true: add perfect guard"
                }
            }
        }),
        init: function (data) {
            var shieldData = {
                type: "PLAYER",
                settings: {
                    baseFactor: 1,
                    strength: "REGULAR",
                    hitResist: "HEAVY",
                    stableOverride: "MASSIVE",
                    range: 0.5
                }
            };
            this.shield = new sc.COMBAT_SHIELDS[shieldData.type](shieldData.settings);
            this.perfectGuard = data.perfectGuard ||
                null
        },
        clearCached: function () {
            this.shield && this.shield.clearCached()
        },
        run: function (entity) {
            var root = entity.getCombatantRoot(),
                perfectGuardWindow = 0;
            this.perfectGuard && (perfectGuardWindow = 0.1 * (1 + root.params.getModifier("PERFECT_GUARD_WINDOW")));
            var guardArea = root.params.getModifier("GUARD_AREA");
            this.shield.range = guardArea >= 1 ? 1 : 0.5;
            this.shield.strength = guardArea >= 2 ? sc.SHIELD_STRENGTH.BLOCK_ABOVE : sc.SHIELD_STRENGTH.REGULAR;
            var shieldHandle = root.addShield(this.shield, perfectGuardWindow);
            entity.addActionAttached(shieldHandle);
            return true
        }
    });
    var ITEM_CONSUME_END_HANDLE = {
        onActionEndDetach: function () {
            sc.model.player.endItemConsume(false)
        }
    };
    ig.ACTION_STEP.START_ITEM_CONSUME =
        ig.ActionStepBase.extend({
            item: null,
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function () {},
            start: function (entity) {
                sc.model.player.startItemConsume();
                entity.addActionAttached(ITEM_CONSUME_END_HANDLE)
            }
        });
    ig.ACTION_STEP.SHOW_FOOD_ICON = ig.ActionStepBase.extend({
        icon: null,
        _wm: new ig.Config({
            attributes: {
                icon: {
                    _type: "String",
                    _info: "The icon to display",
                    _select: sc.FOOD_SPRITE
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset position of sprite",
                    _optional: true
                }
            }
        }),
        init: function (data) {
            this.icon = sc.FOOD_SPRITE[data.icon] || 0;
            this.offset = data.offset || null
        },
        start: function (entity) {
            var iconEntity =
                ig.game.spawnEntity(sc.FoodIconEntity, 0, 0, 0, {
                    icon: this.icon,
                    combatant: entity
                });
            this.offset && iconEntity.setState(sc.FOOD_ICON_STATE.HOLD, this.offset)
        }
    });
    ig.ACTION_STEP.CHANGE_FOOD_ICON = ig.ActionStepBase.extend({
        state: null,
        _wm: new ig.Config({
            attributes: {
                state: {
                    _type: "String",
                    _info: "New state of food icon",
                    _select: sc.FOOD_ICON_STATE
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset position of sprite",
                    _optional: true
                }
            }
        }),
        init: function (data) {
            this.state = sc.FOOD_ICON_STATE[data.state];
            this.offset = data.offset || null
        },
        start: function (entity) {
            for (var attached =
                    entity.actionAttached, index = attached.length; index--;) attached[index] instanceof sc.FoodIconEntity && attached[index].setState(this.state, this.offset)
        }
    });
    ig.ACTION_STEP.CONSUME_ITEM = ig.ActionStepBase.extend({
        item: null,
        _wm: new ig.Config({
            attributes: {
                item: {
                    _type: "Item",
                    _info: "The item to consume."
                }
            }
        }),
        init: function (data) {
            this.item = data.item || 0
        },
        start: function (entity) {
            sc.model.player.useItem(this.item);
            sc.model.player.endItemConsume(true);
            entity.removeActionAttached(ITEM_CONSUME_END_HANDLE)
        }
    });
    ig.ACTION_STEP.PLAY_PET_SOUND = ig.ActionStepBase.extend({
        item: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function () {},
        start: function (entity) {
            entity instanceof sc.PlayerPetEntity && entity.petSkin.petSound && ig.SoundHelper.playAtEntity(entity.petSkin.petSound, entity, false)
        }
    })
});
ig.baked = !0;
