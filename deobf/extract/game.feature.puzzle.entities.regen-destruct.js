ig.module("game.feature.puzzle.entities.regen-destruct").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    sc.REGEN_DESTRUCT_TYPE = {};
    var b = Vec2.create();
    ig.ENTITY.RegenDestruct = ig.AnimatedEntity.extend({
        hitSide: null,
        conditionFunction: null,
        effects: {
            base: new ig.EffectSheet("puzzle.destructible"),
            boom: null,
            debris: null,
            regen: null,
            hide: null,
            boomHandle: null,
            regenHandle: null,
            hideHandle: null
        },
        blockNavMap: false,
        navBlocker: null,
        blinkTimer: 0,
        regenMaxTime: 0,
        regenTimer: 0,
        collType: null,
        collideCallback: null,
        zHeight: 0,
        onDestroyIncrease: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                desType: {
                    _type: "String",
                    _info: "Type of regen destructible object",
                    _select: sc.REGEN_DESTRUCT_TYPE,
                    _withNull: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for destructible to spawn",
                    _popup: true
                },
                activeCondition: {
                    _type: "VarCondition",
                    _info: "Condition for destructible to be active. Otherwise is always 'destroyed'",
                    _popup: true
                },
                onDestroyIncrease: {
                    _type: "VarName",
                    _info: "Variable to increase when destroyed'",
                    _optional: true
                },
                blockNavMap: {
                    _type: "Boolean",
                    _info: "If true, block path map and update when destroyed"
                },
                regenTime: {
                    _type: "Number",
                    _info: "Time in seconds for destruct to regenerate",
                    _default: 1
                }
            }
        }),
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.desTypeName = f.desType;
            b = ig.mapStyle.get("effect");
            if (a = ig.copy(sc.REGEN_DESTRUCT_TYPE[f.desType])) {
                this.coll.size = a.size;
                this.zHeight = a.size.z;
                this.collType = a.collType || ig.COLLTYPE.BLOCK;
                this.coll.setType(this.collType);
                this.coll.shadow.size = a.shadow || 0;
                if (a.zGravityFactor !== void 0) this.coll.zGravityFactor = a.zGravityFactor;
                this.hitSide = a.hitSide || [1, 1, 1, 1];
                this.hitSound = a.hitSound;
                this.conditionFunction = a.hitCondition;
                this.noBlinking = a.noBlinking || false;
                this.collideCallback = a.onCollision || null;
                this.terrain = a.terrain || null;
                if (a.debris) {
                    e = ig.copy(a.debris);
                    if (!e.sheet) e.sheet = b.sheet;
                    this.effects.debris = new ig.EffectHandle(e)
                }
                if (a.boom) this.effects.boom = new ig.EffectHandle(a.boom);
                if (a.regen) this.effects.regen = new ig.EffectHandle(a.regen);
                if (a.hide) this.effects.hide = new ig.EffectHandle(a.hide);
                b = ig.mapStyle.get("destruct");
                e = a.anims;
                if (b)
                    if (e.namedSheets)
                        for (var g in a.anims.namedSheets) {
                            if (!e.namedSheets[g].src) e.namedSheets[g].src = b.sheet
                        } else if (!e.sheet.src) e.sheet.src = b.sheet;
                this.initAnimations(e);
                this.setCurrentAnim("default")
            } else {
                this.coll.size.x = 32;
                this.coll.size.y = 32
            }
            this.onDestroyIncrease = f.onDestroyIncrease;
            this.blockNavMap = f.blockNavMap;
            this.blinkTimer = Math.random() *
                5 + 1;
            this.regenMaxTime = f.regenTime;
            this.activeCondition = new ig.VarCondition(f.activeCondition)
        },
        show: function(a) {
            this.parent(a);
            this.coll.setType(this.collType);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this);
            this.activeCondition.evaluate() || this.destroy(true, true)
        },
        onHideRequest: function() {
            if (this.navBlocker) {
                this.navBlocker.remove();
                this.navBlocker = null
            }
            this.coll.setType(ig.COLLTYPE.IGNORE);
            this.effects.hide ? this.effects.hideHandle = this.effects.hide.spawnOnTarget(this, {
                callback: this
            }) : this.hide()
        },
        onKill: function(a) {
            this.parent(a);
            this.navBlocker && this.navBlocker.remove();
            this.effects.debris && this.effects.debris.clearCached();
            this.effects.boom && this.effects.boom.clearCached();
            this.effects.regen && this.effects.regen.clearCached();
            this.effects.hide && this.effects.hide.clearCached()
        },
        startRegen: function() {
            this.setCurrentAnim("cut",
                true);
            if (this.regenMaxTime) this.regenTimer = this.regenMaxTime / sc.options.get("assist-puzzle-speed");
            else if (!this.regenerate()) this.regenTimer = 1E-5
        },
        isActive: function() {
            return this.activeCondition.evaluate() && !this.regenTimer
        },
        regenerate: function() {
            for (var a = ig.game.getEntitiesOnTop(this), b = a.length; b--;) {
                if (a[b] instanceof ig.ENTITY.SlidingBlock) return false;
                this.collType != ig.COLLTYPE.BLOCK && a[b].doQuickRespawn && a[b].doQuickRespawn()
            }
            this.coll.setType(this.collType);
            this.coll.size.z = this.zHeight;
            this.onDestroyIncrease &&
                ig.vars.sub(this.onDestroyIncrease, 1);
            if (this.animSheet.hasAnimation("transition")) {
                this.setCurrentAnim("transition", true);
                this.effects.regenHandle = this.effects.regen.spawnOnTarget(this, {
                    align: "CENTER",
                    spriteFilter: [1],
                    callback: this
                })
            } else {
                if (this.effects.regen) this.effects.regenHandle = this.effects.regen.spawnOnTarget(this, {
                    align: "CENTER",
                    callback: this
                });
                this.setCurrentAnim("regen", true, "default")
            }
            return true
        },
        regenComplete: function() {
            this.setCurrentAnim("default", true);
            this.blinkTimer = Math.random() *
                5 + 1;
            if (this.sprites.length > 1) {
                var a = this.sprites[1];
                a.setGfxCut(a.size.y + a.size.x, 0)
            }
        },
        update: function() {
            if (this.regenTimer && !this.effects.hideHandle)
                if (this.activeCondition.evaluate()) {
                    this.regenTimer = this.regenTimer - ig.system.tick;
                    if (this.regenTimer <= 0) {
                        this.regenTimer = 0;
                        if (!this.regenerate()) this.regenTimer = 1E-5
                    }
                } else this.regenTimer = 1E-5;
            else if (!this.effects.regenHandle && !this.effects.boomHandle && !this.effects.hideHandle) {
                if (this.blinkTimer <= 0) this.blinkTimer = Math.random() * 2 + 4;
                this.blinkTimer =
                    this.blinkTimer - ig.system.tick;
                if (!this.noBlinking && this.sprites.length > 1) {
                    var a = this.sprites[1],
                        b = a.size.y + a.size.z,
                        e = b,
                        f = 0;
                    if (this.blinkTimer < 1) {
                        e = Math.round((this.blinkTimer - 0.08) / 0.92 * b);
                        e < 0 && (e = 0);
                        f = Math.round((1 - this.blinkTimer / 0.92) * b);
                        f < 0 && (f = 0)
                    }
                    a.setGfxCut(e, f)
                }
            }
            this.parent()
        },
        onEffectEvent: function(a) {
            if (a == this.effects.hideHandle) {
                if (a.isDone()) {
                    this.effects.hideHandle = null;
                    this.hide()
                }
            } else if (a == this.effects.regenHandle) {
                if (this.effects.regenHandle.isDone()) {
                    this.effects.regenHandle =
                        null;
                    this.regenComplete()
                }
            } else if (a == this.effects.boomHandle && this.effects.boomHandle.isDone()) {
                this.effects.boomHandle = null;
                this.startRegen()
            }
        },
        ballHit: function(a) {
            if (this.regenTimer || (this.effects.boomHandle || this.effects.hideHandle) || !ig.EntityTools.isInScreen(this, 40)) return false;
            var c = a.getCollideSide(this, b),
                e = a.attackInfo && a.attackInfo.hasHint("CHARGED") ? sc.ATTACK_TYPE.MEDIUM : sc.ATTACK_TYPE.LIGHT,
                f = a.getHitCenter(this);
            if (!this.hitSide[c] || this.conditionFunction && !this.conditionFunction(a,
                    this)) {
                if (!this.hitSide[c]) {
                    this.effects.base.spawnOnTarget("shieldBlink", this, {
                        spriteFilter: [2]
                    });
                    ig.SoundHelper.playAtEntity(this.sounds.block, this)
                }
                return false
            }
            e = sc.ATTACK_TYPE.MASSIVE;
            sc.combat.showHitEffect(this, f, e, a.getElement(), false, false, true);
            if (this.effects.regenHandle) {
                this.effects.regenHandle.stop();
                this.effects.regenHandle = null
            }
            this.destroy();
            return true
        },
        destroy: function(a, b) {
            if (!this.regenTimer && !this.effects.boomHandle) {
                this.hitCount = 0;
                if (this.effects.regenHandle) {
                    this.effects.regenHandle.stop();
                    this.effects.regenHandle = null
                }
                this.onDestroyIncrease && ig.vars.add(this.onDestroyIncrease, 1);
                var e = this.getCenter();
                this.coll.setType(ig.COLLTYPE.BLOCK);
                this.coll.size.z = 0;
                if (b) this.startRegen();
                else if (this.animSheet.hasAnimation("transition") && this.effects.boom) {
                    this.setCurrentAnim("transition", true);
                    this.effects.boomHandle = this.effects.boom.spawnFixed(e.x, e.y, this.coll.pos.z + this.coll.size.z / 2, this, {
                        spriteFilter: [1],
                        callback: this
                    });
                    this.throwDebris()
                } else {
                    !a && this.effects.boom && this.effects.boom.spawnFixed(e.x,
                        e.y, this.coll.pos.z + this.coll.size.z / 2, this);
                    this.setCurrentAnim("destroy", true, "cut");
                    this.throwDebris();
                    this.startRegen()
                }
                this.sprites.length > 1 && this.sprites[1].setGfxCut(0, 0)
            }
        },
        varsChanged: function() {
            this._hidden || this.coll.size.z > 0 && !this.activeCondition.evaluate() && this.destroy(true)
        },
        collideWith: function(a, b) {
            this.coll.size.z > 0 && this.collideCallback && this.collideCallback(a, b, this)
        },
        throwDebris: function() {
            var a = this.getCenter();
            this.effects.debris && this.effects.debris.spawnFixed(a.x, a.y, this.coll.pos.z,
                null, {
                    angle: this.debrisAngle
                })
        },
        isBallDestroyer: function(a, b) {
            if (this.coll.type != ig.COLLTYPE.BLOCK) return false;
            var e = b.dir,
                e = Math.abs(e.x) > Math.abs(e.y) ? ig.ActorEntity.FACE4[e.x > 0 ? "WEST" : "EAST"] : ig.ActorEntity.FACE4[e.y > 0 ? "NORTH" : "SOUTH"];
            return this.hitSide[e]
        }
    });
    sc.REGEN_DESTRUCT_TYPE.iceBlock = {
        size: {
            x: 24,
            y: 24,
            z: 24
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "iceBlockBoomQuick"
        },
        regen: {
            sheet: "puzzle.destructible",
            name: "iceBlockRegen"
        },
        terrain: ig.TERRAIN.ICE,
        hitCondition: function(a) {
            return a.attackInfo &&
                a.attackInfo.element == sc.ELEMENT.HEAT
        },
        anims: {
            namedSheets: {
                fullIce: {
                    src: null,
                    width: 24,
                    height: 48,
                    offX: 96,
                    offY: 96
                },
                bottomIce: {
                    src: null,
                    width: 24,
                    height: 24,
                    offX: 144,
                    offY: 96
                }
            },
            SUB: [{
                sheet: "bottomIce",
                shapeType: "Z_FLAT",
                frames: [0],
                repeat: false,
                SUB: [{
                    name: "cut"
                }, {
                    name: "transition"
                }]
            }, {
                shapeType: "Z_EXPAND",
                sheet: "fullIce",
                SUB: [{
                    name: "default",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "default",
                    time: 1,
                    frames: [1],
                    repeat: false,
                    aboveZ: 1
                }, {
                    name: "transition",
                    time: 1,
                    frames: [0],
                    repeat: false
                }]
            }]
        }
    };
    var a = Vec2.create();
    sc.REGEN_DESTRUCT_TYPE.flame = {
        size: {
            x: 32,
            y: 32,
            z: 24
        },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: {
            sheet: "puzzle.flame",
            name: "boom"
        },
        hitCondition: function(a, b) {
            if (a.attackInfo && a.attackInfo.hasHint("ICE_DISK")) return true;
            b.setCurrentAnim("shuffle", true, "default", true);
            a.addIgnore && a.addIgnore(b);
            return false
        },
        onCollision: function(b, c, e) {
            if (c && b instanceof ig.ENTITY.Combatant) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                e.setCurrentAnim("shuffle", true, "default", true);
                sc.combat.showHitEffect(b, b.getAlignedPos(ig.ENTITY_ALIGN.CENTER),
                    sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.HEAT, false, false, false);
                b.cancelAction();
                var f = b.hasStun() ? "MEDIUM" : "HEAVY",
                    f = b.doDamageMovement(a, f, false, false);
                b.damageTimer = Math.max(b.damageTimer, f)
            }
            if (c && b.isWaterBubble && b.isWaterBubble()) {
                e.setCurrentAnim("shuffle", true, "default", true);
                Vec2.assign(a, c);
                Vec2.flip(a);
                b.steam(a, b.combatant || ig.game.playerEntity)
            }
        },
        anims: {
            namedSheets: {
                flame: {
                    src: "media/entity/effects/heat.png",
                    width: 32,
                    height: 48,
                    offX: 288,
                    offY: 288
                },
                bottom: {
                    src: null,
                    width: 16,
                    height: 16,
                    offX: 168,
                    offY: 96
                }
            },
            SUB: [{
                sheet: "bottom",
                shapeType: "Z_FLAT",
                frames: [0],
                repeat: false,
                offset: {
                    x: 0,
                    y: -8,
                    z: 0
                },
                SUB: [{
                    name: "default"
                }, {
                    name: "destroy"
                }, {
                    name: "cut"
                }, {
                    name: "regen"
                }, {
                    name: "shuffle"
                }]
            }, {
                sheet: "flame",
                offset: {
                    x: 0,
                    y: 0,
                    z: 8
                },
                SUB: [{
                    name: "default",
                    time: 0.1,
                    frames: [3, 4, 5, 6],
                    repeat: true
                }, {
                    name: "destroy",
                    time: 0.066,
                    frames: [2, 1, 0],
                    repeat: false
                }, {
                    name: "regen",
                    time: 0.066,
                    frames: [0, 1, 2],
                    repeat: false
                }, {
                    name: "shuffle",
                    time: 0.05,
                    frames: [0, 1, 2],
                    repeat: false
                }]
            }]
        }
    };
    sc.REGEN_DESTRUCT_TYPE.shock = {
        size: {
            x: 16,
            y: 16,
            z: 48
        },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: {
            sheet: "puzzle.tesla",
            name: "boom"
        },
        hitCondition: function(a, b) {
            if (a.getElement() == sc.ELEMENT.WAVE && a.attackInfo && a.attackInfo.hasHint("COMPRESSED")) return true;
            a.addIgnore && a.addIgnore(b);
            return false
        },
        onCollision: function(b, c) {
            if (c && b instanceof ig.ENTITY.Combatant) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                sc.combat.showHitEffect(b, b.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.SHOCK, false, false, false);
                b.cancelAction();
                var e = b.hasStun() ? "MEDIUM" : "HEAVY",
                    e = b.doDamageMovement(a, e, false, false);
                b.damageTimer = Math.max(b.damageTimer, e)
            }
            if (c && b instanceof sc.WaterBubbleEntity) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                b.steam(a, b.combatant || ig.game.playerEntity)
            }
        },
        anims: {
            namedSheets: {
                shock: {
                    src: "media/map/shockwave-dng.png",
                    width: 16,
                    height: 40,
                    offX: 16,
                    offY: 744
                },
                bottom: {
                    src: "media/map/shockwave-dng.png",
                    width: 16,
                    height: 16,
                    offX: 0,
                    offY: 768
                },
                ball: {
                    src: "media/map/shockwave-dng.png",
                    width: 16,
                    height: 16,
                    offX: 0,
                    offY: 736,
                    xCount: 1
                }
            },
            SUB: [{
                sheet: "bottom",
                shapeType: "Z_FLAT",
                frames: [0],
                repeat: false,
                SUB: [{
                    name: "default"
                }, {
                    name: "destroy"
                }, {
                    name: "cut"
                }, {
                    name: "regen"
                }]
            }, {
                sheet: "shock",
                offset: {
                    x: 0,
                    y: -8,
                    z: 0
                },
                renderMode: "lighter",
                SUB: [{
                    name: "default",
                    time: 0.05,
                    frames: [0, 1, 2, 3, 4, 5],
                    repeat: true
                }, {
                    name: "destroy",
                    time: 0.066,
                    frames: [4, 4, 4, 4],
                    framesAlpha: [0.8, 0.6, 0.3, 0],
                    repeat: false
                }, {
                    name: "regen",
                    time: 0.05,
                    frames: [0, 1, 2, 3, 4, 5],
                    framesAlpha: [0.2, 0.4, 0.6, 0.8],
                    repeat: false
                }]
            }, {
                sheet: "ball",
                shapeType: "Y_FLAT",
                SUB: [{
                    name: "default",
                    time: 0.1,
                    frames: [0, 0, 0, 0, 0, 0],
                    repeat: true,
                    framesSpriteOffset: [0, 0,
                        32, 0, 0, 33, 0, 0, 33, 0, 0, 32, 0, 0, 31, 0, 0, 31
                    ]
                }, {
                    name: "cut",
                    time: 0.5,
                    frames: [1],
                    repeat: false,
                    shapeType: "Z_FLAT"
                }, {
                    name: "destroy",
                    time: 0.05,
                    frames: [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    repeat: false,
                    framesSpriteOffset: [0, 0, 30, 0, 0, 28, 0, 0, 24, 0, 0, 18, 0, 0, 10, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0]
                }, {
                    name: "regen",
                    time: 0.05,
                    frames: [0, 0, 0, 0, 0, 0],
                    repeat: false,
                    framesSpriteOffset: [0, 0, 8, 0, 0, 16, 0, 0, 24, 0, 0, 28, 0, 0, 30, 0, 0, 31]
                }]
            }]
        }
    };
    sc.REGEN_DESTRUCT_TYPE.ferroHeat = {
        size: {
            x: 16,
            y: 16,
            z: 48
        },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: {
            sheet: "puzzle.ferro",
            name: "barHeatBreak"
        },
        regen: {
            sheet: "puzzle.ferro",
            name: "barRegen"
        },
        hide: {
            sheet: "puzzle.ferro",
            name: "barHide"
        },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(a, b) {
            if (a.getElement() == sc.ELEMENT.COLD && a.attackInfo && a.attackInfo.hasHint("FERRO")) return true;
            a.addIgnore && a.addIgnore(b);
            return false
        },
        onCollision: function(b, c) {
            if (c && b instanceof ig.ENTITY.Combatant) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                sc.combat.showHitEffect(b, b.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.HEAT, false,
                    false, false);
                b.cancelAction();
                var e = b.hasStun() ? "MEDIUM" : "HEAVY",
                    e = b.doDamageMovement(a, e, false, false);
                b.damageTimer = Math.max(b.damageTimer, e)
            }
            if (c && b instanceof sc.WaterBubbleEntity) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                b.steam(a, b.combatant || ig.game.playerEntity)
            }
        },
        anims: {
            namedSheets: {
                pillar: {
                    src: "media/entity/objects/ferro-barrier.png",
                    width: 24,
                    height: 48,
                    offX: 0,
                    offY: 0,
                    xCount: 6
                }
            },
            SUB: [{
                sheet: "pillar",
                offset: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                SUB: [{
                    name: "default",
                    time: 0.1,
                    frames: [0, 1, 2],
                    repeat: true,
                    tileOffset: 0
                }, {
                    name: "destroy",
                    time: 0.1,
                    frames: [0, 1, 2, 3],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }, {
                    name: "cut",
                    time: 0.1,
                    frames: [3],
                    repeat: false,
                    tileOffset: 12
                }, {
                    name: "regen",
                    time: 0.066,
                    frames: [3, 2, 1],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }]
            }]
        }
    };
    sc.REGEN_DESTRUCT_TYPE.ferroCold = {
        size: {
            x: 16,
            y: 16,
            z: 48
        },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: {
            sheet: "puzzle.ferro",
            name: "barColdBreak"
        },
        regen: {
            sheet: "puzzle.ferro",
            name: "barRegen"
        },
        hide: {
            sheet: "puzzle.ferro",
            name: "barHide"
        },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(a,
            b) {
            if (a.getElement() == sc.ELEMENT.HEAT && a.attackInfo && a.attackInfo.hasHint("FERRO")) return true;
            a.addIgnore && a.addIgnore(b);
            return false
        },
        onCollision: function(b, c) {
            if (c && b instanceof ig.ENTITY.Combatant) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                sc.combat.showHitEffect(b, b.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.COLD, false, false, false);
                b.cancelAction();
                var e = b.hasStun() ? "MEDIUM" : "HEAVY",
                    e = b.doDamageMovement(a, e, false, false);
                b.damageTimer = Math.max(b.damageTimer, e)
            }
            if (c && b instanceof sc.WaterBubbleEntity) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                b.steam(a, b.combatant || ig.game.playerEntity)
            }
        },
        anims: {
            namedSheets: {
                pillar: {
                    src: "media/entity/objects/ferro-barrier.png",
                    width: 24,
                    height: 48,
                    offX: 0,
                    offY: 0,
                    xCount: 6
                }
            },
            SUB: [{
                sheet: "pillar",
                offset: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                SUB: [{
                    name: "default",
                    time: 0.1,
                    frames: [0, 1, 2],
                    repeat: true,
                    tileOffset: 3
                }, {
                    name: "destroy",
                    time: 0.1,
                    frames: [0, 1, 2, 3],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }, {
                    name: "cut",
                    time: 0.1,
                    frames: [3],
                    repeat: false,
                    tileOffset: 12
                }, {
                    name: "regen",
                    time: 0.066,
                    frames: [3, 2, 1],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }]
            }]
        }
    };
    sc.REGEN_DESTRUCT_TYPE.ferroShock = {
        size: {
            x: 16,
            y: 16,
            z: 48
        },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: {
            sheet: "puzzle.ferro",
            name: "barShockBreak"
        },
        regen: {
            sheet: "puzzle.ferro",
            name: "barRegen"
        },
        hide: {
            sheet: "puzzle.ferro",
            name: "barHide"
        },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(a, b) {
            if (a.getElement() == sc.ELEMENT.WAVE && a.attackInfo && a.attackInfo.hasHint("FERRO")) return true;
            a.addIgnore && a.addIgnore(b);
            return false
        },
        onCollision: function(b,
            c) {
            if (c && b instanceof ig.ENTITY.Combatant) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                sc.combat.showHitEffect(b, b.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.SHOCK, false, false, false);
                b.cancelAction();
                var e = b.hasStun() ? "MEDIUM" : "HEAVY",
                    e = b.doDamageMovement(a, e, false, false);
                b.damageTimer = Math.max(b.damageTimer, e)
            }
            if (c && b instanceof sc.WaterBubbleEntity) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                b.steam(a, b.combatant || ig.game.playerEntity)
            }
        },
        anims: {
            namedSheets: {
                pillar: {
                    src: "media/entity/objects/ferro-barrier.png",
                    width: 24,
                    height: 48,
                    offX: 0,
                    offY: 0,
                    xCount: 6
                }
            },
            SUB: [{
                sheet: "pillar",
                offset: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                SUB: [{
                    name: "default",
                    time: 0.1,
                    frames: [0, 1, 2],
                    repeat: true,
                    tileOffset: 6
                }, {
                    name: "destroy",
                    time: 0.1,
                    frames: [0, 1, 2, 3],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }, {
                    name: "cut",
                    time: 0.1,
                    frames: [3],
                    repeat: false,
                    tileOffset: 12
                }, {
                    name: "regen",
                    time: 0.066,
                    frames: [3, 2, 1],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }]
            }]
        }
    };
    sc.REGEN_DESTRUCT_TYPE.ferroWave = {
        size: {
            x: 16,
            y: 16,
            z: 48
        },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: {
            sheet: "puzzle.ferro",
            name: "barWaveBreak"
        },
        regen: {
            sheet: "puzzle.ferro",
            name: "barRegen"
        },
        hide: {
            sheet: "puzzle.ferro",
            name: "barHide"
        },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(a, b) {
            if (a.getElement() == sc.ELEMENT.SHOCK && a.attackInfo && a.attackInfo.hasHint("FERRO")) return true;
            a.addIgnore && a.addIgnore(b);
            return false
        },
        onCollision: function(b, c) {
            if (c && b instanceof ig.ENTITY.Combatant) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                sc.combat.showHitEffect(b, b.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.WAVE, false,
                    false, false);
                b.cancelAction();
                var e = b.hasStun() ? "MEDIUM" : "HEAVY",
                    e = b.doDamageMovement(a, e, false, false);
                b.damageTimer = Math.max(b.damageTimer, e)
            }
            if (c && b instanceof sc.WaterBubbleEntity) {
                Vec2.assign(a, c);
                Vec2.flip(a);
                b.steam(a, b.combatant || ig.game.playerEntity)
            }
        },
        anims: {
            namedSheets: {
                pillar: {
                    src: "media/entity/objects/ferro-barrier.png",
                    width: 24,
                    height: 48,
                    offX: 0,
                    offY: 0,
                    xCount: 6
                }
            },
            SUB: [{
                sheet: "pillar",
                offset: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                SUB: [{
                    name: "default",
                    time: 0.1,
                    frames: [0, 1, 2],
                    repeat: true,
                    tileOffset: 9
                }, {
                    name: "destroy",
                    time: 0.1,
                    frames: [0, 1, 2, 3],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }, {
                    name: "cut",
                    time: 0.1,
                    frames: [3],
                    repeat: false,
                    tileOffset: 12
                }, {
                    name: "regen",
                    time: 0.066,
                    frames: [3, 2, 1],
                    repeat: false,
                    tileOffset: 12,
                    shapeType: "Y_FLAT"
                }]
            }]
        }
    };
    sc.COMBAT_POI.REGEN_DESTRUCT = {
        _wm: {
            attributes: {
                destructType: {
                    _type: "String",
                    _info: "Type of Regen Destruct",
                    _select: sc.REGEN_DESTRUCT_TYPE
                },
                active: {
                    _type: "Boolean",
                    _info: "If true: Regen panel has to be active "
                }
            }
        },
        filterEntities: function(a, b, e) {
            for (var f = e.active, e = e.destructType,
                    g = b.length; g--;) {
                var h = b[g];
                h instanceof ig.ENTITY.RegenDestruct && h.desTypeName == e && (!f || h.isActive()) && a.push(h)
            }
            return a
        }
    }
});
ig.baked = !0;
