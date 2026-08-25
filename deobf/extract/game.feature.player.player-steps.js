ig.module("game.feature.player.player-steps").requires("impact.base.animation", "impact.base.action", "impact.base.entity", "game.feature.player.player-config", "game.feature.combat.model.combat-params", "impact.feature.camera.camera", "game.feature.combat.entities.food-icon", "game.feature.party.party").defines(function() {
    function b(a, b) {
        for (var c = a.actionAttached, d = c.length; d--;) {
            var e = c[d];
            if (e instanceof sc.PlayerCameraFocusHandle) {
                e.add != b && c.splice(d, 1);
                return true
            }
        }
        return false
    }
    var a = {
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
                    _select: a
                }
            },
            label: function() {
                return "<i>SET</i> " + this.modelType + " TO <b>player.model.value</b>"
            }
        }),
        init: function(b) {
            this.modelType = a[b.modelType] || a.NONE
        },
        start: function() {
            var b = void 0;
            switch (this.modelType) {
                case a.MONEY:
                    b = sc.model.player.credit >= 1E3
            }
            b != void 0 && ig.vars.set("player.model.value", b)
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
            init: function(a) {
                this.entity = a.entity;
                this.speed = a.speed
            },
            start: function(a, b) {
                var c = ig.Event.getEntity(this.entity, b);
                c && ig.game.playerEntity.addCameraTarget(c, this.speed)
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
        init: function(a) {
            this.entity = a.entity;
            this.speed = a.speed
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            c && ig.game.playerEntity.removeCameraTarget(c, this.speed)
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
        init: function(a) {
            this.speed = a.speed
        },
        start: function() {
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
        init: function(a) {
            this.skill = a.skill
        },
        start: function() {
            sc.model.player.learnSkill(this.skill)
        }
    });
    ig.EVENT_STEP.DO_INLINE_LEVELUP = ig.EventStepBase.extend({
        skill: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            if (sc.model.player.hasLevelUp()) {
                sc.model.enterGame();
                ig.game.playerEntity.levelUpNotifier.runLevelUpScene(ig.game.playerEntity, sc.model.player, true)
            }
        },
        run: function() {
            if (sc.model.isRunning()) {
                sc.model.enterCutscene();
                return true
            }
            return false
        }
    });
    var d = {
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
                    _select: d,
                    _default: d.ALL_AVAILABLE
                }
            },
            label: function() {
                return "RESET <b>" + this.element + "</b> SKILLTREE"
            }
        }),
        init: function(a) {
            this.element = d[a.element || "NEUTRAL"]
        },
        start: function() {
            if (this.element >= 5)
                for (var a = 0; a < 5; a++) sc.model.player.hasElement(a) && sc.model.player.resetSkillTree(a);
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
        init: function(a) {
            this.value = a.value || 0
        },
        start: function() {
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
        init: function(a) {
            this.name = a.name;
            this.config = new sc.PlayerConfig(this.name)
        },
        clearCached: function() {
            this.config.decreaseRef()
        },
        start: function() {
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
        init: function(a) {
            this.level = a.level
        },
        run: function() {
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
        init: function(a) {
            this.element = sc.ELEMENT[a.element] || sc.ELEMENT.NEUTRAL;
            this.skipEffect = a.skipEffect
        },
        start: function() {
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
        init: function(a) {
            this.artType = a.artType ||
                null;
            this.level = a.level;
            this.skipEffect = a.skipEffect
        },
        start: function() {
            for (var a in sc.ELEMENT)
                if (sc.model.player.getCombatArtLevel(this.artType, sc.ELEMENT[a]) >= this.level) {
                    sc.model.player.setElementMode(sc.ELEMENT[a], true, this.skipEffect);
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
        init: function(a) {
            this.varName = a.varName || null;
            this.level = a.level
        },
        start: function() {
            for (var a = sc.model.player.currentElementMode, b = ["THROW", "ATTACK", "DASH", "GUARD"], c = ig.Event.getVarName(this.varName), d = 0; d < b.length; ++d) {
                var e = b[d];
                if (sc.model.player.getCombatArtLevel(e, a) >= this.level) {
                    ig.vars.set(c, e);
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
        init: function(a) {
            this.hide = a.hide
        },
        start: function() {
            ig.game.playerEntity.hidePets =
                this.hide
        }
    });
    var c = Vec3.create(),
        e = Vec2.create();
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
        init: function(a) {
            a.elementProxy ? this.elementProxy = a.elementProxy : this.proxySrc = sc.ProxyTools.prepareSrc(a.proxy);
            if (a.align) this.align = ig.ENTITY_ALIGN[a.align];
            this.startDist = a.startDist || 0
        },
        run: function(a) {
            var b;
            if (this.elementProxy)
                if (this.elementProxy == "CHARGED" && a.overrideBall) b = a.overrideBall;
                else {
                    b = sc.combat.getElementMode(a);
                    b = sc.PlayerConfig.getElementBall(a, b, this.elementProxy == "CHARGED")
                }
            else b = sc.ProxyTools.getProxy(this.proxySrc,
                a);
            if (b) {
                if (this.align) a.getAlignedPos(this.align, c);
                else {
                    var d = a.maxJumpHeight === void 0 ? -1 : a.maxJumpHeight;
                    c.x = a.coll.pos.x + a.coll.size.x / 2;
                    c.y = a.coll.pos.y + a.coll.size.y / 2;
                    c.z = d < 0 ? a.coll.pos.z : Math.min(a.coll.pos.z, d);
                    c.z = c.z + Constants.BALL_HEIGHT
                }
                d = a.throwDirData || a.face;
                if (this.startDist) {
                    Vec2.assign(e, d);
                    Vec2.length(e, this.startDist);
                    Vec2.add(c, e)
                }
                b.spawn(c.x, c.y, c.z, a, d)
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
        init: function(a) {
            assertContent(a, "blockData");
            this.blockData = a.blockData
        },
        run: function(a) {
            a.setActionBlocked && a.setActionBlocked(this.blockData);
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
        init: function(a) {
            this.animSheet = new ig.AnimationSheet(a.animSheet)
        },
        clearCached: function() {
            this.animSheet.decreaseRef()
        },
        run: function(a) {
            a.replaceAnimSheet &&
                a.replaceAnimSheet(sc.playerSkins.replaceAnim(this.animSheet));
            return true
        }
    });
    ig.ACTION_STEP.CLEAR_PLAYER_ANIM_SHEET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            a.replaceAnimSheet && a.replaceAnimSheet(null);
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
        init: function(a) {
            this.factor = a.factor ||
                1
        },
        run: function(a) {
            var b = (3 + a.params.getStat("focus") / 250) * (1 + a.params.getModifier("DASH_INVINC"));
            a.stunEscapeDash && (b = b + 12);
            b = b / 60 * this.factor;
            a.isPlayer || (b = b + 0.2);
            a.invincibleTimer = b;
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
        init: function(a) {
            this.time = a.time || 0
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.time
        },
        run: function(a) {
            var b = a.getCombatantRoot();
            b.isPlayer && b.gui.crosshair.active && b.gui.crosshair.getDir(a.face);
            return a.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.PLAYER_ADJUST_MOVE_DIR = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            if (a.isPlayer) {
                sc.control.moveDir(e, 1);
                Vec2.isZero(e) || Vec2.assign(a.face, e)
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
        init: function(a) {
            this.time = a.time || 0;
            this.rotateSpeed = a.rotateSpeed || 0;
            this.stopBeforeEdge = a.stopBeforeEdge;
            this.allowStop = a.allowStop
        },
        start: function(a) {
            a.stepTimer = a.stepTimer +
                this.time
        },
        run: function(a) {
            var b = false;
            if (a.isPlayer) {
                sc.control.moveDir(e, 1);
                Vec2.isZero(e) ? this.allowStop && (b = true) : this.rotateSpeed ? Vec2.rotateToward(a.face, e, this.rotateSpeed * Math.PI * 2 * ig.system.tick) : Vec2.assign(a.face, e)
            }
            b ? Vec2.assignC(a.coll.accelDir, 0, 0) : Vec2.assign(a.coll.accelDir, a.face);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(a.coll, true)) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                Vec2.assignC(a.coll.vel, 0, 0)
            }
            return a.stepTimer <= 0
        }
    });
    sc.PlayerCameraFocusHandle = ig.Class.extend({
        add: false,
        speed: null,
        init: function(a, b) {
            this.add = a;
            this.speed = b
        },
        onActionEndDetach: function(a) {
            this.add ? ig.game.playerEntity.removeCameraTarget(a, this.speed) : ig.game.playerEntity.addCameraTarget(a, this.speed)
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
        init: function(a) {
            this.speed = a.speed;
            this.actionDetached = a.actionDetached;
            this.onlyAfterRemove = a.onlyAfterRemove || false
        },
        start: function(a) {
            if (!ig.game.playerEntity.hasCameraTarget(a)) {
                var c = !this.onlyAfterRemove && !this.actionAttached;
                if (!this.actionDetached)
                    if (b(a, true)) c = true;
                    else if (!this.onlyAfterRemove) {
                    var d = new sc.PlayerCameraFocusHandle(true, this.speed);
                    a.addActionAttached(d)
                }
                c && ig.game.playerEntity.addCameraTarget(a, this.speed)
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
        init: function(a) {
            this.speed = a.speed;
            this.actionDetached = a.actionDetached
        },
        start: function(a) {
            if (ig.game.playerEntity.hasCameraTarget(a)) {
                ig.game.playerEntity.removeCameraTarget(a,
                    this.speed);
                if (!this.actionDetached && !b(a, false)) {
                    var c = new sc.PlayerCameraFocusHandle(false, this.speed);
                    a.addActionAttached(c)
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
        init: function(a) {
            var b = {
                type: "PLAYER",
                settings: {
                    baseFactor: 1,
                    strength: "REGULAR",
                    hitResist: "HEAVY",
                    stableOverride: "MASSIVE",
                    range: 0.5
                }
            };
            this.shield = new sc.COMBAT_SHIELDS[b.type](b.settings);
            this.perfectGuard = a.perfectGuard ||
                null
        },
        clearCached: function() {
            this.shield && this.shield.clearCached()
        },
        run: function(a) {
            var b = a.getCombatantRoot(),
                c = 0;
            this.perfectGuard && (c = 0.1 * (1 + b.params.getModifier("PERFECT_GUARD_WINDOW")));
            var d = b.params.getModifier("GUARD_AREA");
            this.shield.range = d >= 1 ? 1 : 0.5;
            this.shield.strength = d >= 2 ? sc.SHIELD_STRENGTH.BLOCK_ABOVE : sc.SHIELD_STRENGTH.REGULAR;
            b = b.addShield(this.shield, c);
            a.addActionAttached(b);
            return true
        }
    });
    var f = {
        onActionEndDetach: function() {
            sc.model.player.endItemConsume(false)
        }
    };
    ig.ACTION_STEP.START_ITEM_CONSUME =
        ig.ActionStepBase.extend({
            item: null,
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function() {},
            start: function(a) {
                sc.model.player.startItemConsume();
                a.addActionAttached(f)
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
        init: function(a) {
            this.icon = sc.FOOD_SPRITE[a.icon] || 0;
            this.offset = a.offset || null
        },
        start: function(a) {
            a =
                ig.game.spawnEntity(sc.FoodIconEntity, 0, 0, 0, {
                    icon: this.icon,
                    combatant: a
                });
            this.offset && a.setState(sc.FOOD_ICON_STATE.HOLD, this.offset)
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
        init: function(a) {
            this.state = sc.FOOD_ICON_STATE[a.state];
            this.offset = a.offset || null
        },
        start: function(a) {
            for (var a =
                    a.actionAttached, b = a.length; b--;) a[b] instanceof sc.FoodIconEntity && a[b].setState(this.state, this.offset)
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
        init: function(a) {
            this.item = a.item || 0
        },
        start: function(a) {
            sc.model.player.useItem(this.item);
            sc.model.player.endItemConsume(true);
            a.removeActionAttached(f)
        }
    });
    ig.ACTION_STEP.PLAY_PET_SOUND = ig.ActionStepBase.extend({
        item: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a instanceof sc.PlayerPetEntity && a.petSkin.petSound && ig.SoundHelper.playAtEntity(a.petSkin.petSound, a, false)
        }
    })
});
ig.baked = !0;
