ig.module("game.feature.puzzle.puzzle-steps").requires("impact.base.action", "impact.base.event", "impact.base.entity").defines(function() {
    var b = Vec3.create(),
        a = Vec3.create(),
        d = Vec2.create();
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
        init: function(a) {
            this.entity = a.entity || null
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b);
            c && c.startDestruction && c.startDestruction()
        }
    });
    ig.ACTION_STEP.ALIGN_PUSH_PULL_POS = ig.ActionStepBase.extend({
        component: null,
        duration: 0,
        init: function(a) {
            this.component = a.component;
            this.duration = a.duration
        },
        start: function(a) {
            a.stepData.startPos = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
            a.stepData.duration = this.duration;
            a.stepTimer = a.stepData.duration
        },
        run: function(a) {
            var c = 1 - (a.stepTimer / a.stepData.duration).limit(0, 1);
            this.component.getGripPosAndFace(b);
            Vec3.lerp(a.stepData.startPos, b, c, b);
            a.setPos(b.x - a.coll.size.x / 2, b.y - a.coll.size.y / 2, b.z, true);
            return c >= 1
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
        init: function(a) {
            this.entity = a.entity;
            this.pos = a.pos || null
        },
        start: function(a, c) {
            var d = ig.Event.getEntity(this.entity, c);
            if (d) {
                var e = null;
                this.pos && (e = ig.Event.getVec3(this.pos, b));
                d.resetPos && d.resetPos(e)
            }
        }
    });
    ig.ACTION_STEP.DO_WAVE_TELEPORT =
        ig.ActionStepBase.extend({
            entity: null,
            init: function(a) {
                this.entity = a.entity
            },
            start: function() {
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
        init: function(a) {
            this.offset = a.offset;
            this.align = a.align;
            this.speed = a.speed;
            this.zVel = a.zVel;
            this.timeAdvance = a.timeAdvance || 0;
            a = ig.mapStyle.get("puzzle2");
            this.gfx = new ig.Image(a.sheet)
        },
        clearCached: function() {
            this.gfx.decreaseRef()
        },
        start: function(a) {
            var c = a.getAlignedPos(this.align, b);
            this.offset && Vec3.add(c,
                this.offset);
            c = ig.game.spawnEntity(sc.BombEntity, c.x, c.y, c.z, {});
            c.start(a.face, a, this.speed, this.zVel);
            c.timer = c.timer - this.timeAdvance
        }
    });
    var c = [];
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
        init: function(a) {
            this.count = a.count;
            this.offset = a.offset;
            this.align = a.align;
            this.area = a.area;
            this.zVary = a.zVary || 0;
            a = ig.mapStyle.get("puzzle2");
            this.gfx = new ig.Image(a.sheet)
        },
        clearCached: function() {
            this.gfx.decreaseRef()
        },
        start: function(a) {
            a = a.getAlignedPos(this.align, b);
            this.offset && Vec3.add(a, this.offset);
            for (var e = this.count; e--;) {
                var h =
                    5;
                do {
                    var i = false,
                        j = Vec2.assignC(d, 0, 0);
                    j.x = (Math.random() - 0.5) * this.area.x;
                    j.y = (Math.random() - 0.5) * this.area.y;
                    for (var k = c.length; k--;)
                        if (Vec2.distance(c[k], j) < 48) {
                            i = true;
                            break
                        }
                } while (h-- && i);
                c.push(Vec2.create(j));
                h = (Math.random() - 0.5) * this.zVary;
                j = ig.game.spawnEntity(sc.BombEntity, a.x + j.x, a.y + j.y, a.z + h, {});
                j.noHeatFocus = true;
                j.coll.zBounciness = 0.25
            }
            c.length = 0
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
        init: function(a) {
            this.point = a.point;
            this.zHeight = a.zHeight;
            this.zVary = a.zVary || 0;
            a = ig.mapStyle.get("puzzle2");
            this.gfx = new ig.Image(a.sheet)
        },
        clearCached: function() {
            this.gfx.decreaseRef()
        },
        start: function() {
            var a = ig.Event.getVec3(this.point, b);
            a.z = a.z + (this.zHeight + (Math.random() - 0.5) * this.zVary);
            a = ig.game.spawnEntity(sc.BombEntity,
                a.x, a.y, a.z, {});
            a.noHeatFocus = true;
            a.coll.zBounciness = 0.25
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
        init: function(a) {
            this.point = a.point
        },
        start: function() {
            var a = ig.Event.getVec3(this.point, b);
            ig.game.spawnEntity(sc.WaterBubbleEntity, a.x, a.y, a.z, {})
        }
    });
    ig.EVENT_STEP.DESTROY_BOMBS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        clearCached: function() {},
        start: function() {
            for (var a = ig.game.getEntitiesByType(sc.BombEntity), b = a.length; b--;) a[b].explode()
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
        init: function(a) {
            this.offset = a.offset;
            this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.gfx = new ig.Image("media/entity/objects/object-effects.png");
            this.duration = a.duration || 3
        },
        clearCached: function() {
            this.gfx.decreaseRef()
        },
        start: function(a) {
            var c = a.getAlignedPos(this.align, b);
            this.offset && Vec3.add(c, this.offset);
            ig.game.spawnEntity(sc.WaterBubbleEntity, c.x, c.y, c.z, {
                combatant: a.getCombatantRoot(),
                target: a.getTarget(),
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
        init: function(a) {
            this.time = a.time
        },
        start: function(a) {
            (a = a.tmpTarget) && a instanceof ig.ENTITY.ElementPole && a.resetTimer(this.time)
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
        init: function(a) {
            this.align = ig.ENTITY_ALIGN[a.align]
        },
        start: function(a) {
            var c = a.getAlignedPos(this.align, b);
            c.x = c.x - 8;
            c.y = c.y - 8;
            c = ig.game.spawnEntity(ig.ENTITY.WaveTeleport, c.x, c.y, c.z, {});
            a.addActionAttached(c)
        }
    });
    var e = {
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
                    _select: e
                }
            }
        }),
        init: function(a) {
            this.align = ig.ENTITY_ALIGN[a.align];
            this.teslaType = e[a.teslaType] || e.EXTENDER_LOOSE
        },
        start: function(a) {
            var c = a.getAlignedPos(this.align, b);
            c.x = c.x - 8;
            c.y = c.y - 8;
            var d = this.teslaType.random(),
                c = ig.game.spawnEntity(ig.ENTITY.TeslaCoil, c.x, c.y, c.z, {
                    coilType: d
                });
            a.addActionAttached(c)
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
        init: function(a) {
            this.align = ig.ENTITY_ALIGN[a.align];
            this.element = a.element
        },
        start: function(a) {
            var c = a.getAlignedPos(this.align, b),
                c = ig.game.spawnEntity(sc.ElementShieldBallEntity, c.x, c.y, c.z, {
                    element: this.element
                }, true);
            a.addActionAttached(c)
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_ELEMENT_SHIELD_USED = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function(a) {
            this.align = ig.ENTITY_ALIGN[a.align];
            this.element = a.element
        },
        run: function(a) {
            for (var a = a.actionAttached, b = a.length; b--;)
                if (a[b] instanceof sc.ElementShieldBallEntity && !a[b].isDestroyed()) return false;
            return true
        }
    });
    ig.ACTION_STEP.STOP_PLAYER_ELEMENT_SHIELD = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function(a) {
            this.align = ig.ENTITY_ALIGN[a.align];
            this.element = a.element
        },
        start: function() {
            sc.ElementShieldEntity.clearRunningShields(ig.game.playerEntity)
        }
    });
    ig.EVENT_STEP.STOP_PLAYER_ELEMENT_SHIELD =
        ig.EventStepBase.extend({
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function(a) {
                this.align = ig.ENTITY_ALIGN[a.align];
                this.element = a.element
            },
            start: function() {
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
        init: function(a) {
            this.align = ig.ENTITY_ALIGN[a.align];
            this.offset = a.offset || null;
            this.height =
                a.height || 24;
            this.range = a.range || 600;
            this.duration = a.duration || 1;
            this.expandSpeed = a.expandSpeed || 200;
            this.minDistance = a.minDistance || 0;
            this.color = a.color || null
        },
        start: function(a) {
            a = a.getAlignedPos(this.align, b);
            this.offset && Vec3.add(a, this.offset);
            sc.BossPlatforms.startImpact(a, this.height, this.range, this.expandSpeed, this.duration, this.minDistance, this.color)
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
        init: function(a) {
            this.pointA = a.pointA || null;
            this.pointB = a.pointB || null;
            this.height = a.height || 24;
            this.minHeight = a.minHeight ||
                null
        },
        start: function() {
            if (this.pointA)
                for (var c = ig.Event.getVec3(this.pointA, b), d = this.pointB ? ig.Event.getVec3(this.pointB, a) : c, e = Math.min(c.x, d.x), i = Math.max(c.x, d.x), j = Math.min(c.y, d.y), d = Math.max(c.y, d.y), c = ig.game.getEntitiesInRectangle(e - 1, j - 1, c.z - 1, i - e + 2, d - j + 2, 2), e = c.length; e--;)
                    if (c[e] instanceof ig.ENTITY.BossPlatform) {
                        i = this.height;
                        this.minHeight && (i = Math.round(i - (this.height - this.minHeight) * Math.random()));
                        c[e].setFixedHeight(i)
                    }
        }
    });
    ig.EVENT_STEP.RELEASE_FIXED_PLATFORMS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.BossPlatforms.releaseHeightFix()
        }
    })
});
ig.baked = !0;
