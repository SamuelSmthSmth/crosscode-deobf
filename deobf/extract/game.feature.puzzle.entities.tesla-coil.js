ig.module("game.feature.puzzle.entities.tesla-coil").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    function b(a, b) {
        return b.distance - a.distance
    }
    var a = Vec3.create();
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
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.weight = -1;
            this.coll.zGravityFactor = 1E3;
            if (a = sc.TESLA_COIL_TYPE[f.coilType] || sc.TESLA_COIL_TYPE.SOURCE) {
                Vec3.assign(this.coll.size, a.size);
                this.source = a.source;
                this.fast = a.fast || false;
                if (a.collType) this.coll.type = a.collType;
                this.dischargeAction = a.dischargeAction || null;
                b = a.anims;
                if (b.sheet.src) this.initAnimations(b);
                else if (e = ig.mapStyle.get("tesla")) {
                    b = ig.copy(a.anims);
                    b.sheet.src = e.sheet;
                    b.sheet.offX = b.sheet.offX + e.x;
                    b.sheet.offY = b.sheet.offY + e.y;
                    this.initAnimations(b)
                }
                this.setCurrentAnim("off")
            }
            this.varOnCharge =
                f.varOnCharge || null;
            this.varOnDischarge = f.varOnDischarge || null;
            this.effectAlign = f.align || null
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            a.isDone() && this.hide()
        },
        onActionEndDetach: function() {
            this.kill()
        },
        extendCharge: function(a) {
            this.chargeHitExceptions = a;
            this.chargeTimer = 0.1
        },
        dischargeAction: null,
        discharge: function(d) {
            this.varOnDischarge && ig.vars.set(this.varOnDischarge, true);
            this.sprites.length > 1 && this.sprites[1].setGfxCut(0, 0);
            this.setCurrentAnim("flash", true, "off", true);
            var c = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
            c.z = c.z - 32;
            for (var e = ig.game.getEntitiesInCircle(c, 96, 1, 160, null, null, null, this, d), c = e.length, f = []; c--;) {
                var g = e[c];
                if (g instanceof ig.ENTITY.TeslaCoil && !g.source || g instanceof ig.ENTITY.OneTimeSwitch && g.switchType == "teslaSwitch") {
                    var h = ig.CollTools.getGroundDistance(g.coll,
                        this.coll);
                    f.push({
                        ent: g,
                        distance: h
                    })
                }
            }
            if (f.length) {
                f.sort(b);
                for (c = f.length; c--;) {
                    e = false;
                    for (g = c + 1; !e && g < f.length; ++g) {
                        h = ig.CollTools.getGroundDistance(f[c].ent.coll, f[g].ent.coll);
                        h < f[c].distance && (e = true)
                    }
                    e ? f.splice(c, 1) : d.push(f[c].ent)
                }
                for (c = f.length; c--;) {
                    h = f[c].ent;
                    if (h instanceof ig.ENTITY.TeslaCoil) h.dischargeAction ? h.dischargeAction(d, this.effectAlign) : h.extendCharge(d);
                    else if (h instanceof ig.ENTITY.OneTimeSwitch) {
                        e = h.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
                        e = new sc.CircleHitForce(ig.game.playerEntity, {
                            attack: {
                                type: "MASSIVE",
                                element: "HEAT",
                                damageFactor: 0,
                                spFactor: 0,
                                hints: ["LIGHTNING"]
                            },
                            pos: Vec3.createC(e.x, e.y, e.z),
                            radius: 4,
                            zHeight: 4,
                            duration: 0.1,
                            expandRadius: 0,
                            alwaysFull: true,
                            party: "OTHER",
                            centralAngle: 1
                        });
                        sc.combat.addCombatForce(e)
                    }
                    this.effects.sheet.spawnOnTarget("lightning", h, {
                        align: ig.ENTITY_ALIGN.TOP,
                        target2: this,
                        target2Align: ig.ENTITY_ALIGN.TOP
                    })
                }
            } else this.effects.sheet.spawnOnTarget("fail", this, {
                align: ig.ENTITY_ALIGN.TOP
            })
        },
        update: function() {
            if (this.chargeTimer) {
                this.chargeTimer = this.chargeTimer -
                    ig.system.tick;
                if (this.chargeTimer <= 0) {
                    this.chargeTimer = 0;
                    if (this.effects.handle) {
                        this.effects.handle.stop();
                        this.effects.handle = null
                    }
                    this.discharge(this.chargeHitExceptions || [this]);
                    this.chargeHitExceptions = null
                } else this.source && this.sprites.length >= 2 && this.sprites[1].setGfxCut(48 - 27 * (1 - this.chargeTimer / (this.fast ? 0.5 : 1)), 0)
            }
            this.parent()
        },
        ballHit: function(a) {
            if (!this.source) return false;
            var b = a.getHitCenter(this),
                e = a.getElement();
            if (!this.chargeTimer && e == sc.ELEMENT.SHOCK && a.attackInfo && a.attackInfo.hasHint("COMPRESSED")) {
                this.varOnCharge &&
                    ig.vars.set(this.varOnCharge, true);
                this.chargeTimer = this.fast ? 0.5 : 1;
                this.setCurrentAnim("charge");
                this.effects.handle = this.effects.sheet.spawnOnTarget("charging", this, {
                    duration: -1,
                    align: ig.ENTITY_ALIGN.TOP
                });
                this.effects.sheet.spawnFixed("chargeStart", b.x, b.y, b.z, this)
            }
            sc.combat.showHitEffect(this, b, sc.ATTACK_TYPE.NONE, a.getElement(), false, false, true);
            return true
        }
    });
    sc.TESLA_COIL_TYPE.SOURCE = {
        size: {
            x: 16,
            y: 16,
            z: 32
        },
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
        size: {
            x: 16,
            y: 16,
            z: 32
        },
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
        size: {
            x: 16,
            y: 16,
            z: 32
        },
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
            offset: {
                x: 4,
                y: 0,
                z: -16
            },
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
        size: {
            x: 16,
            y: 16,
            z: 32
        },
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
            offset: {
                x: -4,
                y: 0,
                z: -16
            },
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
        size: {
            x: 16,
            y: 16,
            z: 16
        },
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
        size: {
            x: 16,
            y: 16,
            z: 16
        },
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
            offset: {
                x: 0,
                y: 0,
                z: -8
            },
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
        size: {
            x: 16,
            y: 16,
            z: 16
        },
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
            offset: {
                x: 0,
                y: 0,
                z: -8
            },
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
        size: {
            x: 16,
            y: 16,
            z: 16
        },
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
                frames: [1,
                    1, 1, 1, 1, 1, 1, 1
                ],
                framesAlpha: [1, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2],
                repeat: false,
                renderMode: "lighter"
            }]
        }
    };
    sc.TESLA_COIL_TYPE.GROUND_DISCHARGE = {
        size: {
            x: 16,
            y: 16,
            z: 16
        },
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
        dischargeAction: function(b, c) {
            this.setCurrentAnim("flash",
                true, "off", true);
            this.effects.sheet.spawnOnTarget("groundShock", this, {
                align: c || ig.ENTITY_ALIGN.BOTTOM
            });
            var e = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a),
                e = new sc.CircleHitForce(ig.game.playerEntity, {
                    attack: {
                        type: "MASSIVE",
                        element: "SHOCK",
                        damageFactor: 1,
                        spFactor: 0,
                        hints: ["GROUND_SHOCK"]
                    },
                    pos: Vec3.createC(e.x, e.y, e.z),
                    radius: 16,
                    zHeight: 48,
                    duration: 0.2,
                    expandRadius: 64,
                    alwaysFull: true,
                    party: "OTHER",
                    centralAngle: 1
                });
            sc.combat.addCombatForce(e)
        }
    };
    sc.TESLA_COIL_TYPE.WHALE_DISCHARGE = {
        size: {
            x: 16,
            y: 16,
            z: 16
        },
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
            offset: {
                x: 0,
                y: -8,
                z: 0
            },
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
            var b = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a),
                b = new sc.CircleHitForce(ig.game.playerEntity, {
                    attack: {
                        type: "MASSIVE",
                        element: "SHOCK",
                        damageFactor: 1,
                        spFactor: 0,
                        hints: ["GROUND_SHOCK"]
                    },
                    pos: Vec3.createC(b.x, b.y, b.z - 16),
                    radius: 16,
                    zHeight: 16,
                    duration: 0.2,
                    expandRadius: 64,
                    alwaysFull: true,
                    party: "PLAYER",
                    centralAngle: 1
                });
            sc.combat.addCombatForce(b)
        }
    };
    sc.TESLA_COIL_TYPE.GROUND_DISCHARGE_FISH = {
        size: {
            x: 16,
            y: 16,
            z: 16
        },
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
        dischargeAction: function(b, c) {
            this.setCurrentAnim("flash", true, "off", true);
            this.effects.sheet.spawnOnTarget("groundShock", this, {
                align: c || ig.ENTITY_ALIGN.BOTTOM
            });
            var e = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a),
                e = new sc.CircleHitForce(ig.game.playerEntity, {
                    attack: {
                        type: "NONE",
                        element: "NEUTRAL",
                        damageFactor: 1,
                        spFactor: 0,
                        hints: ["DISCHARGE_FISH"],
                        hitInvincible: true,
                        limiter: "SIGNAL"
                    },
                    pos: Vec3.createC(e.x, e.y, e.z - 32),
                    radius: 128,
                    zHeight: 96,
                    duration: 0,
                    expandRadius: 0,
                    alwaysFull: true,
                    party: "OTHER",
                    centralAngle: 1
                });
            sc.combat.addCombatForce(e)
        }
    }
});
ig.baked = !0;
