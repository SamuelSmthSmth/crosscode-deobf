ig.module("game.feature.puzzle.entities.regen-destruct").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    sc.REGEN_DESTRUCT_TYPE = {};
    var tmpVec = Vec2.create();
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
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.desTypeName = settings.desType;
            var effectStyle = ig.mapStyle.get("effect"),
                type = ig.copy(sc.REGEN_DESTRUCT_TYPE[settings.desType]);
            if (type) {
                this.coll.size = type.size;
                this.zHeight = type.size.z;
                this.collType = type.collType || ig.COLLTYPE.BLOCK;
                this.coll.setType(this.collType);
                this.coll.shadow.size = type.shadow || 0;
                if (type.zGravityFactor !== void 0) this.coll.zGravityFactor = type.zGravityFactor;
                this.hitSide = type.hitSide || [1, 1, 1, 1];
                this.hitSound = type.hitSound;
                this.conditionFunction = type.hitCondition;
                this.noBlinking = type.noBlinking || false;
                this.collideCallback = type.onCollision || null;
                this.terrain = type.terrain || null;
                if (type.debris) {
                    var debris = ig.copy(type.debris);
                    if (!debris.sheet) debris.sheet = effectStyle.sheet;
                    this.effects.debris = new ig.EffectHandle(debris);
                }
                if (type.boom) this.effects.boom = new ig.EffectHandle(type.boom);
                if (type.regen) this.effects.regen = new ig.EffectHandle(type.regen);
                if (type.hide) this.effects.hide = new ig.EffectHandle(type.hide);
                var destructStyle = ig.mapStyle.get("destruct"),
                    anims = type.anims;
                if (destructStyle)
                    if (anims.namedSheets)
                        for (var key in type.anims.namedSheets) {
                            if (!anims.namedSheets[key].src) anims.namedSheets[key].src = destructStyle.sheet;
                        } else if (!anims.sheet.src) anims.sheet.src = destructStyle.sheet;
                this.initAnimations(anims);
                this.setCurrentAnim("default");
            } else {
                this.coll.size.x = 32;
                this.coll.size.y = 32;
            }
            this.onDestroyIncrease = settings.onDestroyIncrease;
            this.blockNavMap = settings.blockNavMap;
            this.blinkTimer = Math.random() * 5 + 1;
            this.regenMaxTime = settings.regenTime;
            this.activeCondition = new ig.VarCondition(settings.activeCondition);
        },
        show: function(show) {
            this.parent(show);
            this.coll.setType(this.collType);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null;
            }
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {});
            }
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this);
            if (!this.activeCondition.evaluate()) this.destroy(true, true);
        },
        onHideRequest: function() {
            if (this.navBlocker) {
                this.navBlocker.remove();
                this.navBlocker = null;
            }
            this.coll.setType(ig.COLLTYPE.IGNORE);
            if (this.effects.hide) this.effects.hideHandle = this.effects.hide.spawnOnTarget(this, {
                callback: this
            });
            else this.hide();
        },
        onKill: function(entity) {
            this.parent(entity);
            if (this.navBlocker) this.navBlocker.remove();
            if (this.effects.debris) this.effects.debris.clearCached();
            if (this.effects.boom) this.effects.boom.clearCached();
            if (this.effects.regen) this.effects.regen.clearCached();
            if (this.effects.hide) this.effects.hide.clearCached();
        },
        startRegen: function() {
            this.setCurrentAnim("cut", true);
            if (this.regenMaxTime) this.regenTimer = this.regenMaxTime / sc.options.get("assist-puzzle-speed");
            else if (!this.regenerate()) this.regenTimer = 1E-5;
        },
        isActive: function() {
            return this.activeCondition.evaluate() && !this.regenTimer;
        },
        regenerate: function() {
            for (var entities = ig.game.getEntitiesOnTop(this), i = entities.length; i--;) {
                if (entities[i] instanceof ig.ENTITY.SlidingBlock) return false;
                if (this.collType != ig.COLLTYPE.BLOCK && entities[i].doQuickRespawn) entities[i].doQuickRespawn();
            }
            this.coll.setType(this.collType);
            this.coll.size.z = this.zHeight;
            if (this.onDestroyIncrease) ig.vars.sub(this.onDestroyIncrease, 1);
            if (this.animSheet.hasAnimation("transition")) {
                this.setCurrentAnim("transition", true);
                this.effects.regenHandle = this.effects.regen.spawnOnTarget(this, {
                    align: "CENTER",
                    spriteFilter: [1],
                    callback: this
                });
            } else {
                if (this.effects.regen) this.effects.regenHandle = this.effects.regen.spawnOnTarget(this, {
                    align: "CENTER",
                    callback: this
                });
                this.setCurrentAnim("regen", true, "default");
            }
            return true;
        },
        regenComplete: function() {
            this.setCurrentAnim("default", true);
            this.blinkTimer = Math.random() * 5 + 1;
            if (this.sprites.length > 1) {
                var sprite = this.sprites[1];
                sprite.setGfxCut(sprite.size.y + sprite.size.x, 0);
            }
        },
        update: function() {
            if (this.regenTimer && !this.effects.hideHandle)
                if (this.activeCondition.evaluate()) {
                    this.regenTimer = this.regenTimer - ig.system.tick;
                    if (this.regenTimer <= 0) {
                        this.regenTimer = 0;
                        if (!this.regenerate()) this.regenTimer = 1E-5;
                    }
                } else this.regenTimer = 1E-5;
            else if (!this.effects.regenHandle && !this.effects.boomHandle && !this.effects.hideHandle) {
                if (this.blinkTimer <= 0) this.blinkTimer = Math.random() * 2 + 4;
                this.blinkTimer = this.blinkTimer - ig.system.tick;
                if (!this.noBlinking && this.sprites.length > 1) {
                    var sprite = this.sprites[1],
                        fullSize = sprite.size.y + sprite.size.z,
                        topCut = fullSize,
                        bottomCut = 0;
                    if (this.blinkTimer < 1) {
                        topCut = Math.round((this.blinkTimer - 0.08) / 0.92 * fullSize);
                        if (topCut < 0) topCut = 0;
                        bottomCut = Math.round((1 - this.blinkTimer / 0.92) * fullSize);
                        if (bottomCut < 0) bottomCut = 0;
                    }
                    sprite.setGfxCut(topCut, bottomCut);
                }
            }
            this.parent();
        },
        onEffectEvent: function(effect) {
            if (effect == this.effects.hideHandle) {
                if (effect.isDone()) {
                    this.effects.hideHandle = null;
                    this.hide();
                }
            } else if (effect == this.effects.regenHandle) {
                if (this.effects.regenHandle.isDone()) {
                    this.effects.regenHandle = null;
                    this.regenComplete();
                }
            } else if (effect == this.effects.boomHandle && this.effects.boomHandle.isDone()) {
                this.effects.boomHandle = null;
                this.startRegen();
            }
        },
        ballHit: function(ball) {
            if (this.regenTimer || (this.effects.boomHandle || this.effects.hideHandle) || !ig.EntityTools.isInScreen(this, 40)) return false;
            var side = ball.getCollideSide(this, tmpVec),
                attackType = ball.attackInfo && ball.attackInfo.hasHint("CHARGED") ? sc.ATTACK_TYPE.MEDIUM : sc.ATTACK_TYPE.LIGHT,
                hitCenter = ball.getHitCenter(this);
            if (!this.hitSide[side] || (this.conditionFunction && !this.conditionFunction(ball, this))) {
                if (!this.hitSide[side]) {
                    this.effects.base.spawnOnTarget("shieldBlink", this, {
                        spriteFilter: [2]
                    });
                    ig.SoundHelper.playAtEntity(this.sounds.block, this);
                }
                return false;
            }
            attackType = sc.ATTACK_TYPE.MASSIVE;
            sc.combat.showHitEffect(this, hitCenter, attackType, ball.getElement(), false, false, true);
            if (this.effects.regenHandle) {
                this.effects.regenHandle.stop();
                this.effects.regenHandle = null;
            }
            this.destroy();
            return true;
        },
        destroy: function(silent, instant) {
            if (!this.regenTimer && !this.effects.boomHandle) {
                this.hitCount = 0;
                if (this.effects.regenHandle) {
                    this.effects.regenHandle.stop();
                    this.effects.regenHandle = null;
                }
                if (this.onDestroyIncrease) ig.vars.add(this.onDestroyIncrease, 1);
                var center = this.getCenter();
                this.coll.setType(ig.COLLTYPE.BLOCK);
                this.coll.size.z = 0;
                if (instant) this.startRegen();
                else if (this.animSheet.hasAnimation("transition") && this.effects.boom) {
                    this.setCurrentAnim("transition", true);
                    this.effects.boomHandle = this.effects.boom.spawnFixed(center.x, center.y, this.coll.pos.z + this.coll.size.z / 2, this, {
                        spriteFilter: [1],
                        callback: this
                    });
                    this.throwDebris();
                } else {
                    if (!silent && this.effects.boom) this.effects.boom.spawnFixed(center.x, center.y, this.coll.pos.z + this.coll.size.z / 2, this);
                    this.setCurrentAnim("destroy", true, "cut");
                    this.throwDebris();
                    this.startRegen();
                }
                if (this.sprites.length > 1) this.sprites[1].setGfxCut(0, 0);
            }
        },
        varsChanged: function() {
            if (!this._hidden && this.coll.size.z > 0 && !this.activeCondition.evaluate()) this.destroy(true);
        },
        collideWith: function(entity, other) {
            if (this.coll.size.z > 0 && this.collideCallback) this.collideCallback(entity, other, this);
        },
        throwDebris: function() {
            var center = this.getCenter();
            if (this.effects.debris) this.effects.debris.spawnFixed(center.x, center.y, this.coll.pos.z, null, {
                angle: this.debrisAngle
            });
        },
        isBallDestroyer: function(ball, trace) {
            if (this.coll.type != ig.COLLTYPE.BLOCK) return false;
            var dir = trace.dir,
                side = Math.abs(dir.x) > Math.abs(dir.y) ? ig.ActorEntity.FACE4[dir.x > 0 ? "WEST" : "EAST"] : ig.ActorEntity.FACE4[dir.y > 0 ? "NORTH" : "SOUTH"];
            return this.hitSide[side];
        }
    });
    sc.REGEN_DESTRUCT_TYPE.iceBlock = {
        size: { x: 24, y: 24, z: 24 },
        boom: { sheet: "puzzle.destructible", name: "iceBlockBoomQuick" },
        regen: { sheet: "puzzle.destructible", name: "iceBlockRegen" },
        terrain: ig.TERRAIN.ICE,
        hitCondition: function(source) {
            return source.attackInfo && source.attackInfo.element == sc.ELEMENT.HEAT;
        },
        anims: {
            namedSheets: {
                fullIce: { src: null, width: 24, height: 48, offX: 96, offY: 96 },
                bottomIce: { src: null, width: 24, height: 24, offX: 144, offY: 96 }
            },
            SUB: [{
                sheet: "bottomIce",
                shapeType: "Z_FLAT",
                frames: [0],
                repeat: false,
                SUB: [{ name: "cut" }, { name: "transition" }]
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
    var collisionVec = Vec2.create();
    sc.REGEN_DESTRUCT_TYPE.flame = {
        size: { x: 32, y: 32, z: 24 },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: { sheet: "puzzle.flame", name: "boom" },
        hitCondition: function(source, self) {
            if (source.attackInfo && source.attackInfo.hasHint("ICE_DISK")) return true;
            self.setCurrentAnim("shuffle", true, "default", true);
            if (source.addIgnore) source.addIgnore(self);
            return false;
        },
        onCollision: function(entity, other, self) {
            if (other && entity instanceof ig.ENTITY.Combatant) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                self.setCurrentAnim("shuffle", true, "default", true);
                sc.combat.showHitEffect(entity, entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.HEAT, false, false, false);
                entity.cancelAction();
                var tier = entity.hasStun() ? "MEDIUM" : "HEAVY",
                    tier = entity.doDamageMovement(collisionVec, tier, false, false);
                entity.damageTimer = Math.max(entity.damageTimer, tier);
            }
            if (other && entity.isWaterBubble && entity.isWaterBubble()) {
                self.setCurrentAnim("shuffle", true, "default", true);
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                entity.steam(collisionVec, entity.combatant || ig.game.playerEntity);
            }
        },
        anims: {
            namedSheets: {
                flame: { src: "media/entity/effects/heat.png", width: 32, height: 48, offX: 288, offY: 288 },
                bottom: { src: null, width: 16, height: 16, offX: 168, offY: 96 }
            },
            SUB: [{
                sheet: "bottom",
                shapeType: "Z_FLAT",
                frames: [0],
                repeat: false,
                offset: { x: 0, y: -8, z: 0 },
                SUB: [{ name: "default" }, { name: "destroy" }, { name: "cut" }, { name: "regen" }, { name: "shuffle" }]
            }, {
                sheet: "flame",
                offset: { x: 0, y: 0, z: 8 },
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
        size: { x: 16, y: 16, z: 48 },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: { sheet: "puzzle.tesla", name: "boom" },
        hitCondition: function(source, self) {
            if (source.getElement() == sc.ELEMENT.WAVE && source.attackInfo && source.attackInfo.hasHint("COMPRESSED")) return true;
            if (source.addIgnore) source.addIgnore(self);
            return false;
        },
        onCollision: function(entity, other) {
            if (other && entity instanceof ig.ENTITY.Combatant) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                sc.combat.showHitEffect(entity, entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.SHOCK, false, false, false);
                entity.cancelAction();
                var tier = entity.hasStun() ? "MEDIUM" : "HEAVY",
                    tier = entity.doDamageMovement(collisionVec, tier, false, false);
                entity.damageTimer = Math.max(entity.damageTimer, tier);
            }
            if (other && entity instanceof sc.WaterBubbleEntity) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                entity.steam(collisionVec, entity.combatant || ig.game.playerEntity);
            }
        },
        anims: {
            namedSheets: {
                shock: { src: "media/map/shockwave-dng.png", width: 16, height: 40, offX: 16, offY: 744 },
                bottom: { src: "media/map/shockwave-dng.png", width: 16, height: 16, offX: 0, offY: 768 },
                ball: { src: "media/map/shockwave-dng.png", width: 16, height: 16, offX: 0, offY: 736, xCount: 1 }
            },
            SUB: [{
                sheet: "bottom",
                shapeType: "Z_FLAT",
                frames: [0],
                repeat: false,
                SUB: [{ name: "default" }, { name: "destroy" }, { name: "cut" }, { name: "regen" }]
            }, {
                sheet: "shock",
                offset: { x: 0, y: -8, z: 0 },
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
                    framesSpriteOffset: [0, 0, 32, 0, 0, 33, 0, 0, 33, 0, 0, 32, 0, 0, 31, 0, 0, 31]
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
        size: { x: 16, y: 16, z: 48 },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: { sheet: "puzzle.ferro", name: "barHeatBreak" },
        regen: { sheet: "puzzle.ferro", name: "barRegen" },
        hide: { sheet: "puzzle.ferro", name: "barHide" },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(source, self) {
            if (source.getElement() == sc.ELEMENT.COLD && source.attackInfo && source.attackInfo.hasHint("FERRO")) return true;
            if (source.addIgnore) source.addIgnore(self);
            return false;
        },
        onCollision: function(entity, other) {
            if (other && entity instanceof ig.ENTITY.Combatant) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                sc.combat.showHitEffect(entity, entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.HEAT, false, false, false);
                entity.cancelAction();
                var tier = entity.hasStun() ? "MEDIUM" : "HEAVY",
                    tier = entity.doDamageMovement(collisionVec, tier, false, false);
                entity.damageTimer = Math.max(entity.damageTimer, tier);
            }
            if (other && entity instanceof sc.WaterBubbleEntity) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                entity.steam(collisionVec, entity.combatant || ig.game.playerEntity);
            }
        },
        anims: {
            namedSheets: {
                pillar: { src: "media/entity/objects/ferro-barrier.png", width: 24, height: 48, offX: 0, offY: 0, xCount: 6 }
            },
            SUB: [{
                sheet: "pillar",
                offset: { x: 0, y: 0, z: 0 },
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
        size: { x: 16, y: 16, z: 48 },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: { sheet: "puzzle.ferro", name: "barColdBreak" },
        regen: { sheet: "puzzle.ferro", name: "barRegen" },
        hide: { sheet: "puzzle.ferro", name: "barHide" },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(source, self) {
            if (source.getElement() == sc.ELEMENT.HEAT && source.attackInfo && source.attackInfo.hasHint("FERRO")) return true;
            if (source.addIgnore) source.addIgnore(self);
            return false;
        },
        onCollision: function(entity, other) {
            if (other && entity instanceof ig.ENTITY.Combatant) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                sc.combat.showHitEffect(entity, entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.COLD, false, false, false);
                entity.cancelAction();
                var tier = entity.hasStun() ? "MEDIUM" : "HEAVY",
                    tier = entity.doDamageMovement(collisionVec, tier, false, false);
                entity.damageTimer = Math.max(entity.damageTimer, tier);
            }
            if (other && entity instanceof sc.WaterBubbleEntity) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                entity.steam(collisionVec, entity.combatant || ig.game.playerEntity);
            }
        },
        anims: {
            namedSheets: {
                pillar: { src: "media/entity/objects/ferro-barrier.png", width: 24, height: 48, offX: 0, offY: 0, xCount: 6 }
            },
            SUB: [{
                sheet: "pillar",
                offset: { x: 0, y: 0, z: 0 },
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
        size: { x: 16, y: 16, z: 48 },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: { sheet: "puzzle.ferro", name: "barShockBreak" },
        regen: { sheet: "puzzle.ferro", name: "barRegen" },
        hide: { sheet: "puzzle.ferro", name: "barHide" },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(source, self) {
            if (source.getElement() == sc.ELEMENT.WAVE && source.attackInfo && source.attackInfo.hasHint("FERRO")) return true;
            if (source.addIgnore) source.addIgnore(self);
            return false;
        },
        onCollision: function(entity, other) {
            if (other && entity instanceof ig.ENTITY.Combatant) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                sc.combat.showHitEffect(entity, entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.SHOCK, false, false, false);
                entity.cancelAction();
                var tier = entity.hasStun() ? "MEDIUM" : "HEAVY",
                    tier = entity.doDamageMovement(collisionVec, tier, false, false);
                entity.damageTimer = Math.max(entity.damageTimer, tier);
            }
            if (other && entity instanceof sc.WaterBubbleEntity) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                entity.steam(collisionVec, entity.combatant || ig.game.playerEntity);
            }
        },
        anims: {
            namedSheets: {
                pillar: { src: "media/entity/objects/ferro-barrier.png", width: 24, height: 48, offX: 0, offY: 0, xCount: 6 }
            },
            SUB: [{
                sheet: "pillar",
                offset: { x: 0, y: 0, z: 0 },
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
        size: { x: 16, y: 16, z: 48 },
        noBlinking: true,
        collType: ig.COLLTYPE.NPFENCE,
        boom: { sheet: "puzzle.ferro", name: "barWaveBreak" },
        regen: { sheet: "puzzle.ferro", name: "barRegen" },
        hide: { sheet: "puzzle.ferro", name: "barHide" },
        shadow: 16,
        zGravityFactor: 0,
        hitCondition: function(source, self) {
            if (source.getElement() == sc.ELEMENT.SHOCK && source.attackInfo && source.attackInfo.hasHint("FERRO")) return true;
            if (source.addIgnore) source.addIgnore(self);
            return false;
        },
        onCollision: function(entity, other) {
            if (other && entity instanceof ig.ENTITY.Combatant) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                sc.combat.showHitEffect(entity, entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), sc.ATTACK_TYPE.LIGHT, sc.ELEMENT.WAVE, false, false, false);
                entity.cancelAction();
                var tier = entity.hasStun() ? "MEDIUM" : "HEAVY",
                    tier = entity.doDamageMovement(collisionVec, tier, false, false);
                entity.damageTimer = Math.max(entity.damageTimer, tier);
            }
            if (other && entity instanceof sc.WaterBubbleEntity) {
                Vec2.assign(collisionVec, other);
                Vec2.flip(collisionVec);
                entity.steam(collisionVec, entity.combatant || ig.game.playerEntity);
            }
        },
        anims: {
            namedSheets: {
                pillar: { src: "media/entity/objects/ferro-barrier.png", width: 24, height: 48, offX: 0, offY: 0, xCount: 6 }
            },
            SUB: [{
                sheet: "pillar",
                offset: { x: 0, y: 0, z: 0 },
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
        filterEntities: function(result, entities, settings) {
            for (var active = settings.active, name = settings.destructType, i = entities.length; i--;) {
                var entity = entities[i];
                if (entity instanceof ig.ENTITY.RegenDestruct && entity.desTypeName == name && (!active || entity.isActive())) result.push(entity);
            }
            return result;
        }
    };
});
ig.baked = !0;