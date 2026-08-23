ig.module("game.feature.puzzle.entities.destructible").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    sc.DESTRUCTIBLE_TYPE = {};
    var tmpVec = Vec2.create();
    ig.ENTITY.Destructible = ig.AnimatedEntity.extend({
        enemyInfo: null,
        permaDestruct: null,
        onDestructIncrease: null,
        onPreDestructIncrease: null,
        hitSide: null,
        hitCount: 0,
        conditionFunction: null,
        sounds: {
            hit: new ig.Sound("media/sound/battle/block-hit.ogg", 1),
            block: new ig.Sound("media/sound/battle/hit-block.ogg", 0.5)
        },
        effects: {
            base: new ig.EffectSheet("puzzle.destructible"),
            pre: null,
            boom: null,
            debris: null,
            debrisAngle: 0,
            debrisDelay: 0,
            preHandle: null,
            boomHandle: null
        },
        range: {
            key: null,
            delay: 0,
            killTimer: -1,
            padding: 0
        },
        keyConsume: null,
        hitSound: null,
        blockNavMap: false,
        navBlocker: null,
        blinkTimer: 0,
        noBlinking: false,
        varState: 0,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                desType: {
                    _type: "String",
                    _info: "Type of destructible object",
                    _select: sc.DESTRUCTIBLE_TYPE,
                    _withNull: true
                },
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy to spawn after destruction",
                    _popup: true,
                    _withNull: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                blockNavMap: {
                    _type: "Boolean",
                    __info: "If true, block path map and update when destroyed"
                },
                permaDestruct: {
                    _type: "Boolean",
                    _info: "If true, then destructible stays destroyed after reentering map"
                },
                onDestructIncrease: {
                    _type: "VarName",
                    _info: "Variable to increase by one when destroyed",
                    _optional: true
                },
                onPreDestructIncrease: {
                    _type: "VarName",
                    _info: "Variable to increase by one when destroyed",
                    _optional: true
                }
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.permaDestruct = settings.permaDestruct || false;
            this.onDestructIncrease = settings.onDestructIncrease || null;
            this.onPreDestructIncrease = settings.onPreDestructIncrease || null;
            var effectStyle = ig.mapStyle.get("effect"),
                type = sc.DESTRUCTIBLE_TYPE[settings.desType];
            if (type) {
                this.hitCount = type.hitCount;
                this.coll.size = type.size;
                if (type.collType) this.coll.type = type.collType;
                this.hitSide = type.hitSide || [1, 1, 1, 1];
                this.hitSound = type.hitSound;
                this.conditionFunction = type.hitCondition;
                this.effects.debrisAngle = (type.debrisAngle || 0) * 2 * Math.PI;
                this.effects.debrisDelay = type.debrisDelay || 0.1;
                this.noBlinking = type.noBlinking || false;
                this.keyConsume = type.keyConsume;
                this.terrain = type.terrain || null;
                if (this.keyConsume || type.onlyPerma) this.permaDestruct = true;
                if (type.range) ig.merge(this.range, type.range);
                if (type.debris) {
                    var debris = ig.copy(type.debris);
                    if (!debris.sheet) debris.sheet = effectStyle.sheet;
                    this.effects.debris = new ig.EffectHandle(debris);
                }
                if (type.boom) this.effects.boom = new ig.EffectHandle(type.boom);
                if (type.preBoom) this.effects.pre = new ig.EffectHandle(type.preBoom);
                if (settings.enemyInfo && settings.enemyInfo.type) this.enemyInfo = new sc.EnemyInfo(settings.enemyInfo);
                var destructStyle = ig.mapStyle.get("destruct");
                type = ig.copy(type.anims);
                if (type.namedSheets)
                    for (var key in type.namedSheets) type.namedSheets[key].src = destructStyle.sheet;
                else if (!type.sheet.src) type.sheet.src = destructStyle.sheet;
                this.initAnimations(type);
            } else {
                this.coll.size.x = 32;
                this.coll.size.y = 32;
            }
            this.blockNavMap = settings.blockNavMap;
            if (!window.wm && this.permaDestruct && ig.vars.get(this.getDestructVarName())) {
                this.varState = 2;
                this.kill();
            }
            this.blinkTimer = Math.random() * 5 + 1;
        },
        show: function(show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {});
            }
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this);
        },
        onKill: function(entity) {
            this.parent(entity);
            this.setVariables();
            if (this.navBlocker) this.navBlocker.remove();
            if (this.enemyInfo) this.enemyInfo.clearCached();
            if (this.effects.debris) this.effects.debris.clearCached();
            if (this.effects.boom) this.effects.boom.clearCached();
            if (this.effects.pre) this.effects.pre.clearCached();
        },
        onSave: function() {
            this.setVariables();
        },
        getDestructVarName: function() {
            return "map._entity" + this.mapId + "_destroyed";
        },
        update: function() {
            if (this.effects.boomHandle) {
                if (this.effects.debrisDelay > 0) {
                    this.effects.debrisDelay = this.effects.debrisDelay - ig.system.tick;
                    if (this.effects.debrisDelay <= 0) this.throwDebris();
                }
            } else if (!this.effects.preHandle) {
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
            if (this.range.killTimer >= 0) {
                this.range.killTimer = this.range.killTimer - ig.system.tick;
                if (this.range.killTimer < 0) this.destroy(true);
            }
            this.parent();
        },
        onEffectEvent: function(effect) {
            if (effect == this.effects.preHandle) {
                if (this.effects.preHandle.isDone()) {
                    this.effects.preHandle = null;
                    this.destroy();
                }
            } else if (effect == this.effects.boomHandle && this.effects.boomHandle.isDone()) {
                if (this.effects.debrisDelay > 0) {
                    this.effects.debrisDelay = 0;
                    this.throwDebris();
                }
                this.kill();
            }
        },
        ballHit: function(ball) {
            if (this.effects.preHandle || this.effects.boomHandle || ((!ball.attackInfo || !ball.attackInfo.hasHint("BOMB")) && !ig.EntityTools.isInScreen(this, 40))) return false;
            var side = ball.getCollideSide(this, tmpVec),
                isCharged = ball.attackInfo && ball.attackInfo.hasHint("CHARGED"),
                attackType = isCharged ? sc.ATTACK_TYPE.MEDIUM : sc.ATTACK_TYPE.LIGHT,
                hitCenter = ball.getHitCenter(this);
            if (!this.hitSide[side] || (this.conditionFunction && !this.conditionFunction(ball))) {
                if (!this.hitSide[side]) {
                    this.effects.base.spawnOnTarget("shieldBlink", this, {
                        spriteFilter: [2]
                    });
                    ig.SoundHelper.playAtEntity(this.sounds.block, this);
                }
                return false;
            }
            if (this.keyConsume) {
                if (!ball.attackInfo || !ball.attackInfo.hasHint(this.keyConsume)) return false;
                var itemType = sc.AREA_ITEM_TYPE[this.keyConsume];
                if (sc.map.getAreaItemAmount(itemType) == 0) return true;
                itemType = sc.map.getAreaItemId(itemType);
                sc.model.player.removeItem(itemType, 1);
            }
            this.hitCount = this.hitCount - (isCharged ? 2 : 1);
            if (this.hitCount <= 0) attackType = sc.ATTACK_TYPE.MASSIVE;
            sc.combat.showHitEffect(this, hitCenter, attackType, ball.getElement(), false, false, true);
            if (this.hitCount <= 0) this.startDestruction();
            else if (this.hitSound) ig.SoundHelper.playAtEntity(this.hitSound, this);
            return true;
        },
        startDestruction: function() {
            if (!this._killed && !this.effects.boomHandle && !this.effects.preHandle) {
                this.varState = 1;
                if (this.onPreDestructIncrease) ig.vars.add(this.onPreDestructIncrease, 1);
                this.hitCount = 0;
                if (this.effects.pre) this.effects.preHandle = this.effects.pre.spawnOnTarget(this, {
                    align: "CENTER",
                    callback: this
                });
                else this.destroy();
                if (this.range.key) this.invokeRangeKill(this.range.startDelay);
            }
        },
        destroy: function(silent) {
            if (!this._killed && !this.effects.boomHandle) {
                this.hitCount = 0;
                this.setCurrentAnim("hit", true);
                var center = this.getCenter();
                this.coll.type = ig.COLLTYPE.IGNORE;
                if (!silent) this.setVariables();
                if (this.effects.boom) this.effects.boomHandle = this.effects.boom.spawnFixed(center.x, center.y, this.coll.pos.z + this.coll.size.z / 2, this, {
                    callback: this
                });
                else {
                    this.throwDebris();
                    this.kill();
                }
            }
        },
        setVariables: function() {
            if (this.varState == 1) {
                this.varState = 2;
                if (this.permaDestruct) ig.vars.set(this.getDestructVarName(), true);
                if (this.onDestructIncrease) ig.vars.add(this.onDestructIncrease, 1);
            }
        },
        invokeRangeKill: function(delay) {
            var coll = this.coll,
                padding = this.range.padding,
                entities = ig.game.getEntitiesInRectangle(coll.pos.x - padding, coll.pos.y - padding, coll.pos.z - padding, this.coll.size.x + 2 * padding, this.coll.size.y + 2 * padding, this.coll.size.z + 2 * padding, this);
            for (var i = entities.length; i--;) {
                var entity = entities[i];
                if (entity.onRangeKill) entity.onRangeKill(this.range.key, delay);
            }
        },
        onRangeKill: function(key, delay) {
            if (!this.effects.boomHandle && !this.effects.preHandle && this.range.key == key && !(this.range.killTimer >= 0)) {
                this.range.killTimer = delay;
                this.varState = 1;
                this.setVariables();
                this.invokeRangeKill(delay + this.range.delay);
            }
        },
        throwDebris: function() {
            var center = this.getCenter();
            if (this.effects.debris) this.effects.debris.spawnFixed(center.x, center.y, this.coll.pos.z, null, {
                angle: this.debrisAngle
            });
            if (this.enemyInfo) {
                var settings = {
                    enemyInfo: this.enemyInfo.getSettings()
                };
                ig.game.spawnEntity("Enemy", this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, settings).invincibleTimer = 0.05;
            }
        },
        isBallDestroyer: function(ball, trace) {
            var dir = trace.dir,
                side = Math.abs(dir.x) > Math.abs(dir.y) ? ig.ActorEntity.FACE4[dir.x > 0 ? "WEST" : "EAST"] : ig.ActorEntity.FACE4[dir.y > 0 ? "NORTH" : "SOUTH"];
            return this.hitSide[side];
        }
    });
    sc.DESTRUCTIBLE_TYPE.boxMedium = {
        hitCount: 1,
        size: { x: 24, y: 24, z: 22 },
        boom: { sheet: "puzzle.destructible", name: "medium" },
        debris: { sheet: "cube-debris", name: "medium" },
        anims: {
            sheet: { src: null, width: 24, height: 48, offX: 64 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.boxMedNorth = {
        hitCount: 1,
        size: { x: 24, y: 24, z: 22 },
        boom: { sheet: "puzzle.destructible", name: "medium" },
        debris: { sheet: "cube-debris", name: "medium" },
        hitSide: [1, 0, 0, 0],
        anims: {
            sheet: { src: null, width: 24, height: 48, offX: 64 },
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
                name: "default",
                time: 1,
                frames: [2],
                repeat: false,
                aboveZ: 1
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.boxMedEast = {
        hitCount: 1,
        size: { x: 24, y: 24, z: 22 },
        boom: { sheet: "puzzle.destructible", name: "medium" },
        debris: { sheet: "cube-debris", name: "medium" },
        hitSide: [0, 1, 0, 0],
        anims: {
            sheet: { src: null, width: 24, height: 48, offX: 64 },
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
                name: "default",
                time: 1,
                frames: [5],
                repeat: false,
                aboveZ: 1
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.boxMedSouth = {
        hitCount: 1,
        size: { x: 24, y: 24, z: 22 },
        boom: { sheet: "puzzle.destructible", name: "medium" },
        debris: { sheet: "cube-debris", name: "medium" },
        hitSide: [0, 0, 1, 0],
        anims: {
            sheet: { src: null, width: 24, height: 48, offX: 64 },
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
                name: "default",
                time: 1,
                frames: [3],
                repeat: false,
                aboveZ: 1
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.boxMedWest = {
        hitCount: 1,
        size: { x: 24, y: 24, z: 22 },
        boom: { sheet: "puzzle.destructible", name: "medium" },
        debris: { sheet: "cube-debris", name: "medium" },
        hitSide: [0, 0, 0, 1],
        anims: {
            sheet: { src: null, width: 24, height: 48, offX: 64 },
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
                name: "default",
                time: 1,
                frames: [4],
                repeat: false,
                aboveZ: 1
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.boxLarge = {
        hitCount: 2,
        size: { x: 32, y: 32, z: 32 },
        boom: { sheet: "puzzle.destructible", name: "large" },
        debris: { sheet: "cube-debris", name: "large" },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: { src: null, width: 32, height: 64 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.iceBlock = {
        hitCount: 1,
        size: { x: 24, y: 24, z: 24 },
        terrain: ig.TERRAIN.ICE,
        boom: { sheet: "puzzle.destructible", name: "iceBlockBoom" },
        hitCondition: function(source) {
            return source.attackInfo && source.attackInfo.element == sc.ELEMENT.HEAT;
        },
        anims: {
            sheet: { src: null, width: 24, height: 48, offX: 96, offY: 96 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.bombBlock = {
        hitCount: 1,
        size: { x: 32, y: 32, z: 32 },
        boom: { sheet: "puzzle.destructible", name: "bombBlockBoom" },
        debris: { name: "bombBlockDebris" },
        hitCondition: function(source) {
            return source.attackInfo && source.attackInfo.hasHint("BOMB");
        },
        anims: {
            sheet: { src: null, width: 32, height: 48, offX: 0, offY: 64 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.bombWallNorth = {
        hitCount: 1,
        size: { x: 32, y: 4, z: 48 },
        boom: { sheet: "puzzle.destructible", name: "bombBlockBoom" },
        debris: { name: "bombBlockDebrisWall" },
        debrisAngle: 0.5,
        hitCondition: function(source) {
            return source.attackInfo && source.attackInfo.hasHint("BOMB");
        },
        anims: {
            sheet: { src: null, width: 32, height: 48, offX: 0, offY: 112 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.bombWallEast = {
        hitCount: 1,
        size: { x: 16, y: 32, z: 32 },
        boom: { sheet: "puzzle.destructible", name: "bombBlockBoom" },
        debris: { name: "bombBlockDebrisWall" },
        debrisAngle: 0.75,
        hitCondition: function(source) {
            return source.attackInfo && source.attackInfo.hasHint("BOMB");
        },
        anims: {
            sheet: { src: null, width: 16, height: 64, offX: 64, offY: 64 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.bombWallWest = {
        hitCount: 1,
        size: { x: 16, y: 32, z: 32 },
        boom: { sheet: "puzzle.destructible", name: "bombBlockBoom" },
        debris: { name: "bombBlockDebrisWall" },
        debrisAngle: 0.25,
        hitCondition: function(source) {
            return source.attackInfo && source.attackInfo.hasHint("BOMB");
        },
        anims: {
            sheet: { src: null, width: 16, height: 64, offX: 64, offY: 64 },
            flipX: true,
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.keyWallNorth = {
        hitCount: 1,
        size: { x: 32, y: 4, z: 32 },
        preBoom: { sheet: "puzzle.destructible", name: "keyDoorPre" },
        keyConsume: "DUNGEON_KEY",
        anims: {
            sheet: { src: null, width: 32, height: 32, offX: 96, offY: 48 },
            offset: { x: 0, y: -4, z: 0 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.keyPillar = {
        hitCount: 1,
        collType: ig.COLLTYPE.FENCE,
        size: { x: 16, y: 16, z: 96 },
        preBoom: { sheet: "puzzle.destructible", name: "keyPillarPre" },
        boom: { sheet: "puzzle.destructible", name: "keyPillarBoom" },
        range: {
            key: "KEY_PILLAR",
            delay: 0.1,
            padding: 8,
            startDelay: 1
        },
        keyConsume: "DUNGEON_KEY",
        anims: {
            sheet: { src: null, width: 16, height: 48, offX: 176, offY: 48 },
            pivot: { x: 8, y: 48 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.keyPillarAR = {
        hitCount: 1,
        collType: ig.COLLTYPE.FENCE,
        size: { x: 16, y: 16, z: 96 },
        preBoom: { sheet: "puzzle.destructible", name: "keyPillarPre" },
        boom: { sheet: "puzzle.destructible", name: "keyPillarBoom" },
        range: {
            key: "KEY_PILLAR",
            delay: 0.1,
            padding: 8
        },
        hitCondition: function() {
            return false;
        },
        onlyPerma: true,
        noBlinking: true,
        anims: {
            namedSheets: {
                floor: { src: null, width: 16, height: 16, offX: 144, offY: 80 },
                ar: { src: null, width: 16, height: 48, offX: 160, offY: 48 }
            },
            SUB: [{
                name: "default",
                sheet: "floor",
                time: 1,
                frames: [0],
                repeat: false,
                shapeType: "Z_FLAT",
                pivot: { x: 8, y: 16 }
            }, {
                name: "default",
                sheet: "ar",
                time: 0.05,
                frames: [0, 0, 0, 0, 0, 0],
                framesAlpha: [1, 1, 1, 0.8, 0.6, 0.8],
                repeat: true,
                renderMode: "lighter",
                pivot: { x: 8, y: 48 }
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.masterKeyWallColdDungeon = {
        hitCount: 1,
        size: { x: 64, y: 4, z: 64 },
        preBoom: { sheet: "puzzle.destructible", name: "keyDoorMasterPre" },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: { src: "media/map/cold-dng.png", width: 64, height: 64, offX: 176, offY: 416, xCount: 1 },
            offset: { x: 0, y: -4, z: 0 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.masterKeyWallHeatDungeon = {
        hitCount: 1,
        size: { x: 64, y: 4, z: 48 },
        preBoom: { sheet: "puzzle.destructible", name: "keyDoorMasterPre" },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: { src: "media/map/heat-dng.png", width: 64, height: 48, offX: 320, offY: 544, xCount: 1 },
            offset: { x: 0, y: -4, z: 0 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.masterKeyWallTreeDungeon = {
        hitCount: 1,
        size: { x: 64, y: 4, z: 48 },
        preBoom: { sheet: "puzzle.destructible", name: "keyDoorMasterPre" },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: { src: "media/map/shockwave-dng.png", width: 64, height: 48, offX: 320, offY: 544, xCount: 1 },
            offset: { x: 0, y: -4, z: 0 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.masterKeyWallFinalDungeon = {
        hitCount: 1,
        size: { x: 64, y: 4, z: 48 },
        preBoom: { sheet: "puzzle.destructible", name: "keyDoorMasterPre" },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: { src: "media/map/final-dungeon-outer.png", width: 64, height: 48, offX: 384, offY: 528, xCount: 2 },
            offset: { x: 0, y: -4, z: 0 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.autumnWall = {
        hitCount: 1,
        size: { x: 32, y: 8, z: 40 },
        boom: { sheet: "puzzle.destructible", name: "wallBlockBoom" },
        debris: { sheet: "area.autumn", name: "wallBoom" },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: { src: "media/map/autumn-outside.png", width: 32, height: 48, offX: 32, offY: 768 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.autumnWall2 = {
        hitCount: 1,
        size: { x: 48, y: 8, z: 40 },
        boom: { sheet: "puzzle.destructible", name: "wallBlockBoom" },
        debris: { sheet: "area.autumn", name: "wallBoom" },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: { src: "media/map/autumn-outside.png", width: 48, height: 48, offX: 32, offY: 816 },
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
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.autumnWall3 = {
        hitCount: 1,
        size: { x: 32, y: 8, z: 40 },
        boom: { sheet: "puzzle.destructible", name: "wallBlockBoom" },
        debris: { sheet: "area.autumn", name: "wallBoom" },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: { src: "media/map/autumn-outside.png", width: 32, height: 48, offX: 32, offY: 864 },
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
            }]
        }
    };
});
ig.baked = !0;