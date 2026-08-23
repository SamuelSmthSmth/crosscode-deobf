/**
 * game.feature.puzzle.puzzle-steps
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.puzzle-steps")`.
 *
 * Action and event steps for puzzle mechanics: destroying destructibles,
 * push-pull alignment, wave teleport, bombing, bubble shooting, boss
 * platform shockwaves, tesla coil / element shield placement, and more.
 */
ig.module("game.feature.puzzle.puzzle-steps")
    .requires("impact.base.action", "impact.base.event", "impact.base.entity")
    .defines(function () {

    var posScratch = Vec3.create(),
        posScratchB = Vec3.create(),
        vecScratch = Vec2.create();

    ig.EVENT_STEP.DESTROY_DESTRUCTIBLE = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Destructible to destroy"
                }
            }
        }),

        init: function (settings) {
            this.entity = settings.entity || null
        },

        start: function (entity, event) {
            var destructible = ig.Event.getEntity(this.entity, event);
            destructible && destructible.startDestruction && destructible.startDestruction()
        }
    });

    ig.ACTION_STEP.ALIGN_PUSH_PULL_POS = ig.ActionStepBase.extend({
        component: null,
        duration: 0,

        init: function (settings) {
            this.component = settings.component;
            this.duration = settings.duration
        },

        start: function (entity) {
            entity.stepData.startPos = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
            entity.stepData.duration = this.duration;
            entity.stepTimer = entity.stepData.duration
        },

        run: function (entity) {
            var progress = 1 - (entity.stepTimer / entity.stepData.duration).limit(0, 1);
            this.component.getGripPosAndFace(posScratch);
            Vec3.lerp(entity.stepData.startPos, posScratch, progress, posScratch);
            entity.setPos(posScratch.x - entity.coll.size.x / 2, posScratch.y - entity.coll.size.y / 2, posScratch.z, true);
            return progress >= 1
        }
    });

    ig.EVENT_STEP.RESET_PUSH_PULL_POS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Pushpull entity"
                },
                pos: {
                    _type: "Vec3",
                    _info: "If defined, reset to this position",
                    _actorOption: true,
                    _visualize: true,
                    _pointSelect: true,
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.entity = settings.entity;
            this.pos = settings.pos || null
        },

        start: function (entity, event) {
            var block = ig.Event.getEntity(this.entity, event);
            if (block) {
                var targetPos = null;
                this.pos && (targetPos = ig.Event.getVec3(this.pos, posScratch));
                block.resetPos && block.resetPos(targetPos)
            }
        }
    });

    ig.ACTION_STEP.DO_WAVE_TELEPORT = ig.ActionStepBase.extend({
        entity: null,

        init: function (settings) {
            this.entity = settings.entity
        },

        start: function () {
            this.entity.doTeleport()
        }
    });

    ig.ACTION_STEP.THROW_BOMB = ig.ActionStepBase.extend({
        gfx: null,
        offset: null,
        align: null,
        speed: null,
        zVel: null,
        timeAdvance: null,
        _wm: new ig.Config({
            attributes: {
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                speed: {
                    _type: "Number",
                    _info: "The XY speed of the thrown bomb",
                    _optional: true
                },
                zVel: {
                    _type: "Number",
                    _info: "The z speed of the thrown bomb",
                    _optional: true
                },
                timeAdvance: {
                    _type: "Number",
                    _info: "Time in seconds the timer of the bomb should be advanced"
                }
            }
        }),

        init: function (settings) {
            this.offset = settings.offset;
            this.align = settings.align;
            this.speed = settings.speed;
            this.zVel = settings.zVel;
            this.timeAdvance = settings.timeAdvance || 0;
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.gfx = new ig.Image(puzzleStyle.sheet)
        },

        clearCached: function () {
            this.gfx.decreaseRef()
        },

        start: function (entity) {
            var pos = entity.getAlignedPos(this.align, posScratch);
            this.offset && Vec3.add(pos, this.offset);
            var bomb = ig.game.spawnEntity(sc.BombEntity, pos.x, pos.y, pos.z, {});
            bomb.start(entity.face, entity, this.speed, this.zVel);
            bomb.timer = bomb.timer - this.timeAdvance
        }
    });

    var rainPositions = [];

    ig.ACTION_STEP.RAIN_BOMB = ig.ActionStepBase.extend({
        gfx: null,
        count: null,
        offset: null,
        align: null,
        area: null,
        zVary: null,
        _wm: new ig.Config({
            attributes: {
                count: {
                    _type: "Integer",
                    _info: "Number of bombs"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                area: {
                    _type: "Vec2",
                    _info: "Area on which to rain the bombs randomly"
                },
                zVary: {
                    _type: "Number",
                    _info: "Value to +- vary the z height"
                }
            }
        }),

        init: function (settings) {
            this.count = settings.count;
            this.offset = settings.offset;
            this.align = settings.align;
            this.area = settings.area;
            this.zVary = settings.zVary || 0;
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.gfx = new ig.Image(puzzleStyle.sheet)
        },

        clearCached: function () {
            this.gfx.decreaseRef()
        },

        start: function (entity) {
            var basePos = entity.getAlignedPos(this.align, posScratch);
            this.offset && Vec3.add(basePos, this.offset);
            for (var i = this.count; i--;) {
                var attempts = 5;
                do {
                    var tooClose = false,
                        spawnPos = Vec2.assignC(vecScratch, 0, 0);
                    spawnPos.x = (Math.random() - 0.5) * this.area.x;
                    spawnPos.y = (Math.random() - 0.5) * this.area.y;
                    for (var j = rainPositions.length; j--;)
                        if (Vec2.distance(rainPositions[j], spawnPos) < 48) {
                            tooClose = true;
                            break
                        }
                } while (attempts-- && tooClose);
                rainPositions.push(Vec2.create(spawnPos));
                var zJitter = (Math.random() - 0.5) * this.zVary,
                    bomb = ig.game.spawnEntity(sc.BombEntity, basePos.x + spawnPos.x, basePos.y + spawnPos.y, basePos.z + zJitter, {});
                bomb.noHeatFocus = true;
                bomb.coll.zBounciness = 0.25
            }
            rainPositions.length = 0
        }
    });

    ig.EVENT_STEP.SPAWN_BOMB = ig.EventStepBase.extend({
        gfx: null,
        pos: null,
        offset: null,
        align: null,
        area: null,
        zVary: null,
        _wm: new ig.Config({
            attributes: {
                point: {
                    _type: "Vec3",
                    _info: "Where to spawn bomb",
                    _visualize: true,
                    _pointSelect: true
                },
                zHeight: {
                    _type: "Number",
                    _info: "From how height the bomb will fall"
                },
                zVary: {
                    _type: "Number",
                    _info: "Value to +- vary the z height"
                }
            }
        }),

        init: function (settings) {
            this.point = settings.point;
            this.zHeight = settings.zHeight;
            this.zVary = settings.zVary || 0;
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.gfx = new ig.Image(puzzleStyle.sheet)
        },

        clearCached: function () {
            this.gfx.decreaseRef()
        },

        start: function () {
            var pos = ig.Event.getVec3(this.point, posScratch);
            pos.z = pos.z + (this.zHeight + (Math.random() - 0.5) * this.zVary);
            var bomb = ig.game.spawnEntity(sc.BombEntity, pos.x, pos.y, pos.z, {});
            bomb.noHeatFocus = true;
            bomb.coll.zBounciness = 0.25
        }
    });

    ig.EVENT_STEP.SPAWN_BUBBLE = ig.EventStepBase.extend({
        offset: null,
        _wm: new ig.Config({
            attributes: {
                point: {
                    _type: "Vec3",
                    _info: "Where to spawn bubble",
                    _visualize: true,
                    _pointSelect: true
                }
            }
        }),

        init: function (settings) {
            this.point = settings.point
        },

        start: function () {
            var pos = ig.Event.getVec3(this.point, posScratch);
            ig.game.spawnEntity(sc.WaterBubbleEntity, pos.x, pos.y, pos.z, {})
        }
    });

    ig.EVENT_STEP.DESTROY_BOMBS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        clearCached: function () {},

        start: function () {
            for (var bombs = ig.game.getEntitiesByType(sc.BombEntity), i = bombs.length; i--;) bombs[i].explode()
        }
    });

    ig.ACTION_STEP.SHOOT_BUBBLE = ig.ActionStepBase.extend({
        gfx: null,
        offset: null,
        align: null,
        speed: null,
        zVel: null,
        timeAdvance: null,
        _wm: new ig.Config({
            attributes: {
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                duration: {
                    _type: "Number",
                    _info: "Time in seconds until bubble explodes",
                    _default: 3
                }
            }
        }),

        init: function (settings) {
            this.offset = settings.offset;
            this.align = ig.ENTITY_ALIGN[settings.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.gfx = new ig.Image("media/entity/objects/object-effects.png");
            this.duration = settings.duration || 3
        },

        clearCached: function () {
            this.gfx.decreaseRef()
        },

        start: function (entity) {
            var pos = entity.getAlignedPos(this.align, posScratch);
            this.offset && Vec3.add(pos, this.offset);
            ig.game.spawnEntity(sc.WaterBubbleEntity, pos.x, pos.y, pos.z, {
                combatant: entity.getCombatantRoot(),
                target: entity.getTarget(),
                targetTime: this.duration
            })
        }
    });

    ig.ACTION_STEP.SET_ELEMENT_POLE_TIMER = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Minimum time that currently targeted element pole should have, if temporary"
                }
            }
        }),

        init: function (settings) {
            this.time = settings.time
        },

        start: function (entity) {
            var target = entity.tmpTarget;
            target && target instanceof ig.ENTITY.ElementPole && target.resetTimer(this.time)
        }
    });

    ig.ACTION_STEP.PLACE_WAVE_TELEPORT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                }
            }
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align]
        },

        start: function (entity) {
            var pos = entity.getAlignedPos(this.align, posScratch);
            pos.x = pos.x - 8;
            pos.y = pos.y - 8;
            var teleport = ig.game.spawnEntity(ig.ENTITY.WaveTeleport, pos.x, pos.y, pos.z, {});
            entity.addActionAttached(teleport)
        }
    });

    var TESLA_COIL_TYPES = {
        EXTENDER_LOOSE: ["EXTENDER_LOOSE", "EXTENDER_LOOSE_FLIP"],
        SOURCE_LOOSE: ["SOURCE_LOOSE", "SOURCE_LOOSE_FLIP"],
        WHALE_DISCHARGE: ["WHALE_DISCHARGE"]
    };

    ig.ACTION_STEP.PLACE_TESLA_COIL = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                teslaType: {
                    _type: "String",
                    _info: "Type of Teslacoil",
                    _select: TESLA_COIL_TYPES
                }
            }
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align];
            this.teslaType = TESLA_COIL_TYPES[settings.teslaType] || TESLA_COIL_TYPES.EXTENDER_LOOSE
        },

        start: function (entity) {
            var pos = entity.getAlignedPos(this.align, posScratch);
            pos.x = pos.x - 8;
            pos.y = pos.y - 8;
            var coilType = this.teslaType.random(),
                coil = ig.game.spawnEntity(ig.ENTITY.TeslaCoil, pos.x, pos.y, pos.z, {
                    coilType: coilType
                });
            entity.addActionAttached(coil)
        }
    });

    ig.ACTION_STEP.PLACE_ELEMENT_SHIELD = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                element: {
                    _type: "String",
                    _info: "Element of Shield Ball",
                    _select: ["HEAT", "COLD", "SHOCK", "WAVE"]
                }
            }
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align];
            this.element = settings.element
        },

        start: function (entity) {
            var pos = entity.getAlignedPos(this.align, posScratch),
                shield = ig.game.spawnEntity(sc.ElementShieldBallEntity, pos.x, pos.y, pos.z, {
                    element: this.element
                }, true);
            entity.addActionAttached(shield)
        }
    });

    ig.ACTION_STEP.WAIT_UNTIL_ELEMENT_SHIELD_USED = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align];
            this.element = settings.element
        },

        run: function (entity) {
            for (var attached = entity.actionAttached, i = attached.length; i--;)
                if (attached[i] instanceof sc.ElementShieldBallEntity && !attached[i].isDestroyed()) return false;
            return true
        }
    });

    ig.ACTION_STEP.STOP_PLAYER_ELEMENT_SHIELD = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align];
            this.element = settings.element
        },

        start: function () {
            sc.ElementShieldEntity.clearRunningShields(ig.game.playerEntity)
        }
    });

    ig.EVENT_STEP.STOP_PLAYER_ELEMENT_SHIELD = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align];
            this.element = settings.element
        },

        start: function () {
            sc.ElementShieldEntity.clearRunningShields(ig.game.playerEntity)
        }
    });

    ig.ACTION_STEP.DO_PLATFORM_SHOCKWAVE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to start shockwave",
                    _select: ig.ENTITY_ALIGN
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to position"
                },
                height: {
                    _type: "Number",
                    _info: "How high platforms should move"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of height movement"
                },
                range: {
                    _type: "Number",
                    _info: "Total range of impact"
                },
                expandSpeed: {
                    _type: "Number",
                    _info: "How fast to expand shockwave along xy (pixels per seconds)"
                },
                minDistance: {
                    _type: "Number",
                    _info: "Minimum distance to center for platform to move"
                },
                color: {
                    _type: "String",
                    _info: "Color to blink while going up",
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.align = ig.ENTITY_ALIGN[settings.align];
            this.offset = settings.offset || null;
            this.height = settings.height || 24;
            this.range = settings.range || 600;
            this.duration = settings.duration || 1;
            this.expandSpeed = settings.expandSpeed || 200;
            this.minDistance = settings.minDistance || 0;
            this.color = settings.color || null
        },

        start: function (entity) {
            var pos = entity.getAlignedPos(this.align, posScratch);
            this.offset && Vec3.add(pos, this.offset);
            sc.BossPlatforms.startImpact(pos, this.height, this.range, this.expandSpeed, this.duration, this.minDistance, this.color)
        }
    });

    ig.EVENT_STEP.FIX_SHOCKWAVE_PLATFORMS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                pointA: {
                    _type: "Vec3",
                    _info: "Point of first platform to be fixed",
                    _visualize: true,
                    _pointSelect: true
                },
                pointB: {
                    _type: "Vec3",
                    _info: "If defined: Rise all platforms overlapping with the bounding box of A and B",
                    _visualize: true,
                    _pointSelect: true,
                    _optional: true
                },
                height: {
                    _type: "Number",
                    _info: "How high platforms should be fixed"
                },
                minHeight: {
                    _type: "Number",
                    _info: "If defined, will vary height randomly between this value and height",
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.pointA = settings.pointA || null;
            this.pointB = settings.pointB || null;
            this.height = settings.height || 24;
            this.minHeight = settings.minHeight || null
        },

        start: function () {
            if (this.pointA)
                for (var min = ig.Event.getVec3(this.pointA, posScratch), max = this.pointB ? ig.Event.getVec3(this.pointB, posScratchB) : min, xMin = Math.min(min.x, max.x), xMax = Math.max(min.x, max.x), yMin = Math.min(min.y, max.y), yMax = Math.max(min.y, max.y), platforms = ig.game.getEntitiesInRectangle(xMin - 1, yMin - 1, min.z - 1, xMax - xMin + 2, yMax - yMin + 2, 2), j = platforms.length; j--;)
                    if (platforms[j] instanceof ig.ENTITY.BossPlatform) {
                        var height = this.height;
                        this.minHeight && (height = Math.round(height - (this.height - this.minHeight) * Math.random()));
                        platforms[j].setFixedHeight(height)
                    }
        }
    });

    ig.EVENT_STEP.RELEASE_FIXED_PLATFORMS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        start: function () {
            sc.BossPlatforms.releaseHeightFix()
        }
    })
});
ig.baked = !0;