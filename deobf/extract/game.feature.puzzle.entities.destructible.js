ig.module("game.feature.puzzle.entities.destructible").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    sc.DESTRUCTIBLE_TYPE = {};
    var b = Vec2.create();
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type =
                ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.permaDestruct = e.permaDestruct || false;
            this.onDestructIncrease = e.onDestructIncrease || null;
            this.onPreDestructIncrease = e.onPreDestructIncrease || null;
            b = ig.mapStyle.get("effect");
            if (a = sc.DESTRUCTIBLE_TYPE[e.desType]) {
                this.hitCount = a.hitCount;
                this.coll.size = a.size;
                if (a.collType) this.coll.type = a.collType;
                this.hitSide = a.hitSide || [1, 1, 1, 1];
                this.hitSound = a.hitSound;
                this.conditionFunction = a.hitCondition;
                this.effects.debrisAngle = (a.debrisAngle ||
                    0) * 2 * Math.PI;
                this.effects.debrisDelay = a.debrisDelay || 0.1;
                this.noBlinking = a.noBlinking || false;
                this.keyConsume = a.keyConsume;
                this.terrain = a.terrain || null;
                if (this.keyConsume || a.onlyPerma) this.permaDestruct = true;
                a.range && ig.merge(this.range, a.range);
                if (a.debris) {
                    c = ig.copy(a.debris);
                    if (!c.sheet) c.sheet = b.sheet;
                    this.effects.debris = new ig.EffectHandle(c)
                }
                if (a.boom) this.effects.boom = new ig.EffectHandle(a.boom);
                if (a.preBoom) this.effects.pre = new ig.EffectHandle(a.preBoom);
                if (e.enemyInfo && e.enemyInfo.type) this.enemyInfo =
                    new sc.EnemyInfo(e.enemyInfo);
                b = ig.mapStyle.get("destruct");
                a = ig.copy(a.anims);
                if (a.namedSheets)
                    for (var f in a.namedSheets) a.namedSheets[f].src = b.sheet;
                else if (!a.sheet.src) a.sheet.src = b.sheet;
                this.initAnimations(a)
            } else {
                this.coll.size.x = 32;
                this.coll.size.y = 32
            }
            this.blockNavMap = e.blockNavMap;
            if (!window.wm && this.permaDestruct && ig.vars.get(this.getDestructVarName())) {
                this.varState = 2;
                this.kill()
            }
            this.blinkTimer = Math.random() * 5 + 1
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast",
                    this, {})
            }
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this)
        },
        onKill: function(a) {
            this.parent(a);
            this.setVariables();
            this.navBlocker && this.navBlocker.remove();
            this.enemyInfo && this.enemyInfo.clearCached();
            this.effects.debris && this.effects.debris.clearCached();
            this.effects.boom && this.effects.boom.clearCached();
            this.effects.pre && this.effects.pre.clearCached()
        },
        onSave: function() {
            this.setVariables()
        },
        getDestructVarName: function() {
            return "map._entity" + this.mapId + "_destroyed"
        },
        update: function() {
            if (this.effects.boomHandle) {
                if (this.effects.debrisDelay >
                    0) {
                    this.effects.debrisDelay = this.effects.debrisDelay - ig.system.tick;
                    this.effects.debrisDelay <= 0 && this.throwDebris()
                }
            } else if (!this.effects.preHandle) {
                if (this.blinkTimer <= 0) this.blinkTimer = Math.random() * 2 + 4;
                this.blinkTimer = this.blinkTimer - ig.system.tick;
                if (!this.noBlinking && this.sprites.length > 1) {
                    var a = this.sprites[1],
                        b = a.size.y + a.size.z,
                        c = b,
                        e = 0;
                    if (this.blinkTimer < 1) {
                        c = Math.round((this.blinkTimer - 0.08) / 0.92 * b);
                        c < 0 && (c = 0);
                        e = Math.round((1 - this.blinkTimer / 0.92) * b);
                        e < 0 && (e = 0)
                    }
                    a.setGfxCut(c, e)
                }
            }
            if (this.range.killTimer >=
                0) {
                this.range.killTimer = this.range.killTimer - ig.system.tick;
                this.range.killTimer < 0 && this.destroy(true)
            }
            this.parent()
        },
        onEffectEvent: function(a) {
            if (a == this.effects.preHandle) {
                if (this.effects.preHandle.isDone()) {
                    this.effects.preHandle = null;
                    this.destroy()
                }
            } else if (a == this.effects.boomHandle && this.effects.boomHandle.isDone()) {
                if (this.effects.debrisDelay > 0) {
                    this.effects.debrisDelay = 0;
                    this.throwDebris()
                }
                this.kill()
            }
        },
        ballHit: function(a) {
            if (this.effects.preHandle || this.effects.boomHandle || (!a.attackInfo ||
                    !a.attackInfo.hasHint("BOMB")) && !ig.EntityTools.isInScreen(this, 40)) return false;
            var d = a.getCollideSide(this, b),
                c = a.attackInfo && a.attackInfo.hasHint("CHARGED"),
                e = c ? sc.ATTACK_TYPE.MEDIUM : sc.ATTACK_TYPE.LIGHT,
                f = a.getHitCenter(this);
            if (!this.hitSide[d] || this.conditionFunction && !this.conditionFunction(a)) {
                if (!this.hitSide[d]) {
                    this.effects.base.spawnOnTarget("shieldBlink", this, {
                        spriteFilter: [2]
                    });
                    ig.SoundHelper.playAtEntity(this.sounds.block, this)
                }
                return false
            }
            if (this.keyConsume) {
                if (!a.attackInfo || !a.attackInfo.hasHint(this.keyConsume)) return false;
                d = sc.AREA_ITEM_TYPE[this.keyConsume];
                if (sc.map.getAreaItemAmount(d) == 0) return true;
                d = sc.map.getAreaItemId(d);
                sc.model.player.removeItem(d, 1)
            }
            this.hitCount = this.hitCount - (c ? 2 : 1);
            this.hitCount <= 0 && (e = sc.ATTACK_TYPE.MASSIVE);
            sc.combat.showHitEffect(this, f, e, a.getElement(), false, false, true);
            this.hitCount <= 0 ? this.startDestruction() : this.hitSound && ig.SoundHelper.playAtEntity(this.hitSound, this);
            return true
        },
        startDestruction: function() {
            if (!this._killed && !this.effects.boomHandle && !this.effects.preHandle) {
                this.varState =
                    1;
                this.onPreDestructIncrease && ig.vars.add(this.onPreDestructIncrease, 1);
                this.hitCount = 0;
                this.effects.pre ? this.effects.preHandle = this.effects.pre.spawnOnTarget(this, {
                    align: "CENTER",
                    callback: this
                }) : this.destroy();
                this.range.key && this.invokeRangeKill(this.range.startDelay)
            }
        },
        destroy: function(a) {
            if (!this._killed && !this.effects.boomHandle) {
                this.hitCount = 0;
                this.setCurrentAnim("hit", true);
                var b = this.getCenter();
                this.coll.type = ig.COLLTYPE.IGNORE;
                a || this.setVariables();
                if (this.effects.boom) this.effects.boomHandle =
                    this.effects.boom.spawnFixed(b.x, b.y, this.coll.pos.z + this.coll.size.z / 2, this, {
                        callback: this
                    });
                else {
                    this.throwDebris();
                    this.kill()
                }
            }
        },
        setVariables: function() {
            if (this.varState == 1) {
                this.varState = 2;
                this.permaDestruct && ig.vars.set(this.getDestructVarName(), true);
                this.onDestructIncrease && ig.vars.add(this.onDestructIncrease, 1)
            }
        },
        invokeRangeKill: function(a) {
            for (var b = this.coll, c = this.range.padding, b = ig.game.getEntitiesInRectangle(b.pos.x - c, b.pos.y - c, b.pos.z - c, this.coll.size.x + 2 * c, this.coll.size.y + 2 * c, this.coll.size.z +
                    2 * c, this), c = b.length; c--;) {
                var e = b[c];
                if (e.onRangeKill) e.onRangeKill(this.range.key, a)
            }
        },
        onRangeKill: function(a, b) {
            if (!this.effects.boomHandle && !this.effects.preHandle && this.range.key == a && !(this.range.killTimer >= 0)) {
                this.range.killTimer = b;
                this.varState = 1;
                this.setVariables();
                this.invokeRangeKill(b + this.range.delay)
            }
        },
        throwDebris: function() {
            var a = this.getCenter();
            this.effects.debris && this.effects.debris.spawnFixed(a.x, a.y, this.coll.pos.z, null, {
                angle: this.debrisAngle
            });
            if (this.enemyInfo) {
                a = {
                    enemyInfo: this.enemyInfo.getSettings()
                };
                ig.game.spawnEntity("Enemy", this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, a).invincibleTimer = 0.05
            }
        },
        isBallDestroyer: function(a, b) {
            var c = b.dir,
                c = Math.abs(c.x) > Math.abs(c.y) ? ig.ActorEntity.FACE4[c.x > 0 ? "WEST" : "EAST"] : ig.ActorEntity.FACE4[c.y > 0 ? "NORTH" : "SOUTH"];
            return this.hitSide[c]
        }
    });
    sc.DESTRUCTIBLE_TYPE.boxMedium = {
        hitCount: 1,
        size: {
            x: 24,
            y: 24,
            z: 22
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "medium"
        },
        debris: {
            sheet: "cube-debris",
            name: "medium"
        },
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 64
            },
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
        size: {
            x: 24,
            y: 24,
            z: 22
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "medium"
        },
        debris: {
            sheet: "cube-debris",
            name: "medium"
        },
        hitSide: [1, 0, 0, 0],
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 64
            },
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
        size: {
            x: 24,
            y: 24,
            z: 22
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "medium"
        },
        debris: {
            sheet: "cube-debris",
            name: "medium"
        },
        hitSide: [0, 1, 0, 0],
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 64
            },
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
        size: {
            x: 24,
            y: 24,
            z: 22
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "medium"
        },
        debris: {
            sheet: "cube-debris",
            name: "medium"
        },
        hitSide: [0, 0, 1, 0],
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 64
            },
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
        size: {
            x: 24,
            y: 24,
            z: 22
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "medium"
        },
        debris: {
            sheet: "cube-debris",
            name: "medium"
        },
        hitSide: [0, 0, 0, 1],
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 64
            },
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
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "large"
        },
        debris: {
            sheet: "cube-debris",
            name: "large"
        },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 64
            },
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
        size: {
            x: 24,
            y: 24,
            z: 24
        },
        terrain: ig.TERRAIN.ICE,
        boom: {
            sheet: "puzzle.destructible",
            name: "iceBlockBoom"
        },
        hitCondition: function(a) {
            return a.attackInfo && a.attackInfo.element == sc.ELEMENT.HEAT
        },
        anims: {
            sheet: {
                src: null,
                width: 24,
                height: 48,
                offX: 96,
                offY: 96
            },
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
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "bombBlockBoom"
        },
        debris: {
            name: "bombBlockDebris"
        },
        hitCondition: function(a) {
            return a.attackInfo && a.attackInfo.hasHint("BOMB")
        },
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 48,
                offX: 0,
                offY: 64
            },
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
        size: {
            x: 32,
            y: 4,
            z: 48
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "bombBlockBoom"
        },
        debris: {
            name: "bombBlockDebrisWall"
        },
        debrisAngle: 0.5,
        hitCondition: function(a) {
            return a.attackInfo &&
                a.attackInfo.hasHint("BOMB")
        },
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 48,
                offX: 0,
                offY: 112
            },
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
        size: {
            x: 16,
            y: 32,
            z: 32
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "bombBlockBoom"
        },
        debris: {
            name: "bombBlockDebrisWall"
        },
        debrisAngle: 0.75,
        hitCondition: function(a) {
            return a.attackInfo && a.attackInfo.hasHint("BOMB")
        },
        anims: {
            sheet: {
                src: null,
                width: 16,
                height: 64,
                offX: 64,
                offY: 64
            },
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
        size: {
            x: 16,
            y: 32,
            z: 32
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "bombBlockBoom"
        },
        debris: {
            name: "bombBlockDebrisWall"
        },
        debrisAngle: 0.25,
        hitCondition: function(a) {
            return a.attackInfo && a.attackInfo.hasHint("BOMB")
        },
        anims: {
            sheet: {
                src: null,
                width: 16,
                height: 64,
                offX: 64,
                offY: 64
            },
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
        size: {
            x: 32,
            y: 4,
            z: 32
        },
        preBoom: {
            sheet: "puzzle.destructible",
            name: "keyDoorPre"
        },
        keyConsume: "DUNGEON_KEY",
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 32,
                offX: 96,
                offY: 48
            },
            offset: {
                x: 0,
                y: -4,
                z: 0
            },
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
        size: {
            x: 16,
            y: 16,
            z: 96
        },
        preBoom: {
            sheet: "puzzle.destructible",
            name: "keyPillarPre"
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "keyPillarBoom"
        },
        range: {
            key: "KEY_PILLAR",
            delay: 0.1,
            padding: 8,
            startDelay: 1
        },
        keyConsume: "DUNGEON_KEY",
        anims: {
            sheet: {
                src: null,
                width: 16,
                height: 48,
                offX: 176,
                offY: 48
            },
            pivot: {
                x: 8,
                y: 48
            },
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
        size: {
            x: 16,
            y: 16,
            z: 96
        },
        preBoom: {
            sheet: "puzzle.destructible",
            name: "keyPillarPre"
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "keyPillarBoom"
        },
        range: {
            key: "KEY_PILLAR",
            delay: 0.1,
            padding: 8
        },
        hitCondition: function() {
            return false
        },
        onlyPerma: true,
        noBlinking: true,
        anims: {
            namedSheets: {
                floor: {
                    src: null,
                    width: 16,
                    height: 16,
                    offX: 144,
                    offY: 80
                },
                ar: {
                    src: null,
                    width: 16,
                    height: 48,
                    offX: 160,
                    offY: 48
                }
            },
            SUB: [{
                name: "default",
                sheet: "floor",
                time: 1,
                frames: [0],
                repeat: false,
                shapeType: "Z_FLAT",
                pivot: {
                    x: 8,
                    y: 16
                }
            }, {
                name: "default",
                sheet: "ar",
                time: 0.05,
                frames: [0, 0, 0, 0, 0, 0],
                framesAlpha: [1, 1, 1, 0.8, 0.6, 0.8],
                repeat: true,
                renderMode: "lighter",
                pivot: {
                    x: 8,
                    y: 48
                }
            }]
        }
    };
    sc.DESTRUCTIBLE_TYPE.masterKeyWallColdDungeon = {
        hitCount: 1,
        size: {
            x: 64,
            y: 4,
            z: 64
        },
        preBoom: {
            sheet: "puzzle.destructible",
            name: "keyDoorMasterPre"
        },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: {
                src: "media/map/cold-dng.png",
                width: 64,
                height: 64,
                offX: 176,
                offY: 416,
                xCount: 1
            },
            offset: {
                x: 0,
                y: -4,
                z: 0
            },
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
        size: {
            x: 64,
            y: 4,
            z: 48
        },
        preBoom: {
            sheet: "puzzle.destructible",
            name: "keyDoorMasterPre"
        },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: {
                src: "media/map/heat-dng.png",
                width: 64,
                height: 48,
                offX: 320,
                offY: 544,
                xCount: 1
            },
            offset: {
                x: 0,
                y: -4,
                z: 0
            },
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
        size: {
            x: 64,
            y: 4,
            z: 48
        },
        preBoom: {
            sheet: "puzzle.destructible",
            name: "keyDoorMasterPre"
        },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: {
                src: "media/map/shockwave-dng.png",
                width: 64,
                height: 48,
                offX: 320,
                offY: 544,
                xCount: 1
            },
            offset: {
                x: 0,
                y: -4,
                z: 0
            },
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
        size: {
            x: 64,
            y: 4,
            z: 48
        },
        preBoom: {
            sheet: "puzzle.destructible",
            name: "keyDoorMasterPre"
        },
        keyConsume: "DUNGEON_MASTER_KEY",
        anims: {
            sheet: {
                src: "media/map/final-dungeon-outer.png",
                width: 64,
                height: 48,
                offX: 384,
                offY: 528,
                xCount: 2
            },
            offset: {
                x: 0,
                y: -4,
                z: 0
            },
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
        size: {
            x: 32,
            y: 8,
            z: 40
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "wallBlockBoom"
        },
        debris: {
            sheet: "area.autumn",
            name: "wallBoom"
        },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: {
                src: "media/map/autumn-outside.png",
                width: 32,
                height: 48,
                offX: 32,
                offY: 768
            },
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
        size: {
            x: 48,
            y: 8,
            z: 40
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "wallBlockBoom"
        },
        debris: {
            sheet: "area.autumn",
            name: "wallBoom"
        },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: {
                src: "media/map/autumn-outside.png",
                width: 48,
                height: 48,
                offX: 32,
                offY: 816
            },
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
        size: {
            x: 32,
            y: 8,
            z: 40
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "wallBlockBoom"
        },
        debris: {
            sheet: "area.autumn",
            name: "wallBoom"
        },
        hitSound: new ig.Sound("media/sound/battle/block-hit.ogg", 0.7),
        anims: {
            sheet: {
                src: "media/map/autumn-outside.png",
                width: 32,
                height: 48,
                offX: 32,
                offY: 864
            },
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
    }
});
ig.baked = !0;
