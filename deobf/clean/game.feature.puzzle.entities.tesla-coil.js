ig.module("game.feature.puzzle.entities.tesla-coil").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    function compareByDistance(a, b) {
        return b.distance - a.distance;
    }
    var tmpVec = Vec3.create();
    sc.TESLA_COIL_TYPE = {};
    ig.ENTITY.TeslaCoil = ig.AnimatedEntity.extend({
        chargeTimer: 0,
        chargeHitExceptions: null,
        source: false,
        fast: false,
        effects: {
            sheet: new ig.EffectSheet("puzzle.tesla"),
            handle: null
        },
        effectAlign: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                coilType: {
                    _type: "String",
                    _info: "Type of TeslaCoil",
                    _select: sc.TESLA_COIL_TYPE
                },
                varOnCharge: {
                    _type: "VarName",
                    _info: "Var set to true when tesla coil begins charging",
                    _optional: true
                },
                varOnDischarge: {
                    _type: "VarName",
                    _info: "Var set to true when tesla coil discharges",
                    _optional: true
                },
                align: {
                    _type: "String",
                    _info: "Alignment of effect relative to target",
                    _select: ig.ENTITY_ALIGN,
                    _optional: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                }
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.weight = -1;
            this.coll.zGravityFactor = 1E3;
            var coilType = sc.TESLA_COIL_TYPE[settings.coilType] || sc.TESLA_COIL_TYPE.SOURCE;
            if (coilType) {
                Vec3.assign(this.coll.size, coilType.size);
                this.source = coilType.source;
                this.fast = coilType.fast || false;
                if (coilType.collType) this.coll.type = coilType.collType;
                this.dischargeAction = coilType.dischargeAction || null;
                var anims = coilType.anims;
                if (anims.sheet.src) this.initAnimations(anims);
                else {
                    var mapStyle = ig.mapStyle.get("tesla");
                    if (mapStyle) {
                        anims = ig.copy(coilType.anims);
                        anims.sheet.src = mapStyle.sheet;
                        anims.sheet.offX = anims.sheet.offX + mapStyle.x;
                        anims.sheet.offY = anims.sheet.offY + mapStyle.y;
                        this.initAnimations(anims);
                    }
                }
                this.setCurrentAnim("off");
            }
            this.varOnCharge = settings.varOnCharge || null;
            this.varOnDischarge = settings.varOnDischarge || null;
            this.effectAlign = settings.align || null;
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {});
            }
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                callback: this
            });
        },
        onEffectEvent: function(effect) {
            if (effect.isDone()) this.hide();
        },
        onActionEndDetach: function() {
            this.kill();
        },
        extendCharge: function(exceptions) {
            this.chargeHitExceptions = exceptions;
            this.chargeTimer = 0.1;
        },
        dischargeAction: null,
        discharge: function(chargeExceptions) {
            if (this.varOnDischarge) ig.vars.set(this.varOnDischarge, true);
            if (this.sprites.length > 1) this.sprites[1].setGfxCut(0, 0);
            this.setCurrentAnim("flash", true, "off", true);
            var bottom = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec);
            bottom.z = bottom.z - 32;
            var entities = ig.game.getEntitiesInCircle(bottom, 96, 1, 160, null, null, null, this, chargeExceptions),
                hits = [];
            for (var i = entities.length; i--;) {
                var entity = entities[i];
                if (entity instanceof ig.ENTITY.TeslaCoil && !entity.source || entity instanceof ig.ENTITY.OneTimeSwitch && entity.switchType == "teslaSwitch") {
                    var distance = ig.CollTools.getGroundDistance(entity.coll, this.coll);
                    hits.push({
                        ent: entity,
                        distance: distance
                    });
                }
            }
            if (hits.length) {
                hits.sort(compareByDistance);
                for (i = hits.length; i--;) {
                    var occluded = false;
                    for (var j = i + 1; !occluded && j < hits.length; ++j) {
                        var dist = ig.CollTools.getGroundDistance(hits[i].ent.coll, hits[j].ent.coll);
                        if (dist < hits[i].distance) occluded = true;
                    }
                    if (occluded) hits.splice(i, 1);
                    else chargeExceptions.push(hits[i].ent);
                }
                for (i = hits.length; i--;) {
                    var hitEntity = hits[i].ent;
                    if (hitEntity instanceof ig.ENTITY.TeslaCoil) {
                        if (hitEntity.dischargeAction) hitEntity.dischargeAction(chargeExceptions, this.effectAlign);
                        else hitEntity.extendCharge(chargeExceptions);
                    } else if (hitEntity instanceof ig.ENTITY.OneTimeSwitch) {
                        var pos = hitEntity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec),
                            hitForce = new sc.CircleHitForce(ig.game.playerEntity, {
                                attack: {
                                    type: "MASSIVE",
                                    element: "HEAT",
                                    damageFactor: 0,
                                    spFactor: 0,
                                    hints: ["LIGHTNING"]
                                },
                                pos: Vec3.createC(pos.x, pos.y, pos.z),
                                radius: 4,
                                zHeight: 4,
                                duration: 0.1,
                                expandRadius: 0,
                                alwaysFull: true,
                                party: "OTHER",
                                centralAngle: 1
                            });
                        sc.combat.addCombatForce(hitForce);
                    }
                    this.effects.sheet.spawnOnTarget("lightning", hitEntity, {
                        align: ig.ENTITY_ALIGN.TOP,
                        target2: this,
                        target2Align: ig.ENTITY_ALIGN.TOP
                    });
                }
            } else this.effects.sheet.spawnOnTarget("fail", this, {
                align: ig.ENTITY_ALIGN.TOP
            });
        },
        update: function() {
            if (this.chargeTimer) {
                this.chargeTimer = this.chargeTimer - ig.system.tick;
                if (this.chargeTimer <= 0) {
                    this.chargeTimer = 0;
                    if (this.effects.handle) {
                        this.effects.handle.stop();
                        this.effects.handle = null;
                    }
                    this.discharge(this.chargeHitExceptions || [this]);
                    this.chargeHitExceptions = null;
                } else if (this.source && this.sprites.length >= 2)
                    this.sprites[1].setGfxCut(48 - 27 * (1 - this.chargeTimer / (this.fast ? 0.5 : 1)), 0);
            }
            this.parent();
        },
        ballHit: function(ball) {
            if (!this.source) return false;
            var hitCenter = ball.getHitCenter(this),
                element = ball.getElement();
            if (!this.chargeTimer && element == sc.ELEMENT.SHOCK && ball.attackInfo && ball.attackInfo.hasHint("COMPRESSED")) {
                if (this.varOnCharge) ig.vars.set(this.varOnCharge, true);
                this.chargeTimer = this.fast ? 0.5 : 1;
                this.setCurrentAnim("charge");
                this.effects.handle = this.effects.sheet.spawnOnTarget("charging", this, {
                    duration: -1,
                    align: ig.ENTITY_ALIGN.TOP
                });
                this.effects.sheet.spawnFixed("chargeStart", hitCenter.x, hitCenter.y, hitCenter.z, this);
            }
            sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
            return true;
        }
    });
    sc.TESLA_COIL_TYPE.SOURCE = {
        size: { x: 16, y: 16, z: 32 },
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 0,
                offY: 0,
                xCount: 2
            },
            wallY: 1,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [1],
                repeat: true,
                renderMode: "lighter"
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        },
        source: true
    };
    sc.TESLA_COIL_TYPE.SOURCE_FAST = {
        size: { x: 16, y: 16, z: 32 },
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 0,
                offY: 0,
                xCount: 2
            },
            wallY: 1,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [1],
                repeat: true,
                renderMode: "lighter"
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        },
        source: true,
        fast: true
    };
    sc.TESLA_COIL_TYPE.SOURCE_LOOSE = {
        size: { x: 16, y: 16, z: 32 },
        anims: {
            sheet: {
                src: "media/entity/objects/tesla-loose.png",
                width: 24,
                height: 64,
                offX: 24,
                offY: 0,
                xCount: 2
            },
            wallY: 0.125,
            offset: { x: 4, y: 0, z: -16 },
            shapeType: "Z_EXPAND",
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [1],
                repeat: true,
                renderMode: "lighter"
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        },
        source: true
    };
    sc.TESLA_COIL_TYPE.SOURCE_LOOSE_FLIP = {
        size: { x: 16, y: 16, z: 32 },
        anims: {
            sheet: {
                src: "media/entity/objects/tesla-loose.png",
                width: 24,
                height: 64,
                offX: 24,
                offY: 0,
                xCount: 2
            },
            wallY: 0.125,
            offset: { x: -4, y: 0, z: -16 },
            flipX: true,
            shapeType: "Z_EXPAND",
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "charge",
                time: 0.1,
                frames: [1],
                repeat: true,
                renderMode: "lighter"
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        },
        source: true
    };
    sc.TESLA_COIL_TYPE.EXTENDER = {
        size: { x: 16, y: 16, z: 16 },
        anims: {
            sheet: {
                src: null,
                width: 16,
                height: 32,
                offX: 16,
                offY: 48,
                xCount: 2
            },
            wallY: 0.5,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        }
    };
    sc.TESLA_COIL_TYPE.EXTENDER_LOOSE = {
        size: { x: 16, y: 16, z: 16 },
        anims: {
            sheet: {
                src: "media/entity/objects/tesla-loose.png",
                width: 16,
                height: 40,
                offX: 88,
                offY: 0,
                xCount: 2
            },
            wallY: 0.5,
            shapeType: "Z_EXPAND",
            offset: { x: 0, y: 0, z: -8 },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        }
    };
    sc.TESLA_COIL_TYPE.EXTENDER_LOOSE_FLIP = {
        size: { x: 16, y: 16, z: 16 },
        anims: {
            sheet: {
                src: "media/entity/objects/tesla-loose.png",
                width: 16,
                height: 40,
                offX: 88,
                offY: 0,
                xCount: 2
            },
            wallY: 0.5,
            flipX: true,
            shapeType: "Z_EXPAND",
            offset: { x: 0, y: 0, z: -8 },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        }
    };
    sc.TESLA_COIL_TYPE.EXTENDER_IGNORE = {
        size: { x: 16, y: 16, z: 16 },
        collType: ig.COLLTYPE.IGNORE,
        anims: {
            sheet: {
                src: null,
                width: 16,
                height: 32,
                offX: 16,
                offY: 48,
                xCount: 2
            },
            wallY: 0.5,
            shapeType: "Y_FLAT",
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        }
    };
    sc.TESLA_COIL_TYPE.GROUND_DISCHARGE = {
        size: { x: 16, y: 16, z: 16 },
        anims: {
            sheet: {
                src: null,
                width: 16,
                height: 32,
                offX: 16,
                offY: 80,
                xCount: 2
            },
            wallY: 1,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        },
        dischargeAction: function(chargeExceptions, align) {
            this.setCurrentAnim("flash", true, "off", true);
            this.effects.sheet.spawnOnTarget("groundShock", this, {
                align: align || ig.ENTITY_ALIGN.BOTTOM
            });
            var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec),
                hitForce = new sc.CircleHitForce(ig.game.playerEntity, {
                    attack: {
                        type: "MASSIVE",
                        element: "SHOCK",
                        damageFactor: 1,
                        spFactor: 0,
                        hints: ["GROUND_SHOCK"]
                    },
                    pos: Vec3.createC(pos.x, pos.y, pos.z),
                    radius: 16,
                    zHeight: 48,
                    duration: 0.2,
                    expandRadius: 64,
                    alwaysFull: true,
                    party: "OTHER",
                    centralAngle: 1
                });
            sc.combat.addCombatForce(hitForce);
        }
    };
    sc.TESLA_COIL_TYPE.WHALE_DISCHARGE = {
        size: { x: 16, y: 16, z: 16 },
        anims: {
            sheet: {
                src: "media/entity/objects/tesla-loose.png",
                width: 16,
                height: 24,
                offX: 88,
                offY: 0,
                xCount: 2
            },
            wallY: 1,
            offset: { x: 0, y: -8, z: 0 },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        },
        dischargeAction: function() {
            this.setCurrentAnim("flash", true, "off", true);
            this.effects.sheet.spawnOnTarget("groundShock", this, {
                align: ig.ENTITY_ALIGN.BOTTOM
            });
            var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec),
                hitForce = new sc.CircleHitForce(ig.game.playerEntity, {
                    attack: {
                        type: "MASSIVE",
                        element: "SHOCK",
                        damageFactor: 1,
                        spFactor: 0,
                        hints: ["GROUND_SHOCK"]
                    },
                    pos: Vec3.createC(pos.x, pos.y, pos.z - 16),
                    radius: 16,
                    zHeight: 16,
                    duration: 0.2,
                    expandRadius: 64,
                    alwaysFull: true,
                    party: "PLAYER",
                    centralAngle: 1
                });
            sc.combat.addCombatForce(hitForce);
        }
    };
    sc.TESLA_COIL_TYPE.GROUND_DISCHARGE_FISH = {
        size: { x: 16, y: 16, z: 16 },
        anims: {
            sheet: {
                src: null,
                width: 16,
                height: 32,
                offX: 16,
                offY: 80,
                xCount: 2
            },
            wallY: 1,
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0],
                repeat: true
            }, {
                name: "flash",
                time: 0.1,
                frames: [0],
                repeat: false
            }, {
                name: "flash",
                time: 0.05,
                frames: [1, 1, 1, 1, 1, 1, 1, 1],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        },
        dischargeAction: function(chargeExceptions, align) {
            this.setCurrentAnim("flash", true, "off", true);
            this.effects.sheet.spawnOnTarget("groundShock", this, {
                align: align || ig.ENTITY_ALIGN.BOTTOM
            });
            var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec),
                hitForce = new sc.CircleHitForce(ig.game.playerEntity, {
                    attack: {
                        type: "NONE",
                        element: "NEUTRAL",
                        damageFactor: 1,
                        spFactor: 0,
                        hints: ["DISCHARGE_FISH"],
                        hitInvincible: true,
                        limiter: "SIGNAL"
                    },
                    pos: Vec3.createC(pos.x, pos.y, pos.z - 32),
                    radius: 128,
                    zHeight: 96,
                    duration: 0,
                    expandRadius: 0,
                    alwaysFull: true,
                    party: "OTHER",
                    centralAngle: 1
                });
            sc.combat.addCombatForce(hitForce);
        }
    };
});
ig.baked = !0;
