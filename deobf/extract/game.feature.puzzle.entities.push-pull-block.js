ig.module("game.feature.puzzle.entities.push-pull-block").requires("impact.base.actor-entity", "impact.base.entity", "game.feature.puzzle.components.push-pullable").defines(function() {
    Vec3.createC(0, 0, 0);
    sc.PUSH_PULL_TYPES = {};
    ig.ENTITY.PushPullBlock = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                pushPullType: {
                    _type: "String",
                    _info: "Type of push pull block",
                    _select: sc.PUSH_PULL_TYPES
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Block to spawn",
                    _popup: true
                }
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle"),
            hideHandle: null
        },
        pushPullable: null,
        squishRespawn: true,
        compressorSlow: 0.5,
        pushPullDirection: 0,
        bombSnap: true,
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1E3;
            this.coll.zBounciness = 0;
            this.coll.weight = -1;
            this.coll.shadow.size = 32;
            if (b = sc.PUSH_PULL_TYPES[c.pushPullType]) {
                this.terrain = b.terrain;
                Vec3.assign(this.coll.size, b.size);
                if (b.useStyleSheet) {
                    a = ig.mapStyle.get("puzzle");
                    b.anims.sheet.src = a.sheet
                }
                this.initAnimations(b.anims);
                this.pushPullDirection =
                    b.direction || sc.PUSH_PULL_DIRECTION.ALL
            }
            this.pushPullable = new sc.PushPullable(this)
        },
        show: function(b) {
            this.parent(b);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            this.pushPullable.setActive(true);
            if (!b) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showQuick", this)
            }
        },
        onHideRequest: function() {
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideQuick", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            });
            this.pushPullable.setActive(false)
        },
        onEffectEvent: function(b) {
            if (b.isDone() && this.effects.hideHandle) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },
        update: function() {
            this.pushPullable.onUpdate();
            this.parent()
        },
        deferredUpdate: function() {
            this.pushPullable.onDeferredUpdate();
            if (this.coll.pos.z == this.coll.baseZPos) {
                this.coll.zGravityFactor = 1;
                this.coll.zBounciness = 0.3
            }
        },
        resetPos: function(b, a) {
            this.pushPullable.resetPos(b, a)
        },
        onInteraction: function() {
            this.pushPullable.onInteraction()
        },
        onInteractionEnd: function() {
            this.pushPullable.onInteractionEnd()
        },
        onKill: function(b) {
            this.parent(b);
            this.pushPullable.onKill()
        },
        onMagnetStart: function() {
            if (!this.magnet && !this.pushPullable.isActive()) return false;
            this.magnet = true;
            this.coll.setType(ig.COLLTYPE.NPBLOCK);
            this.pushPullable.setActive(false);
            return true
        },
        onMagnetEnd: function(b) {
            this.magnet = false;
            b && this.effects.sheet.spawnOnTarget("boxThud", this);
            this.pushPullable.onMagnetEnd()
        }
    });
    sc.PUSH_PULL_TYPES.Large = {
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        terrain: ig.TERRAIN.METAL,
        useStyleSheet: true,
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 64,
                offX: 224,
                offY: 128
            },
            aboveZ: 1,
            wallY: 0.05,
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "moveV",
                time: 0.03,
                frames: [0, 0],
                framesGfxOffset: [0, 0, 0, 0],
                repeat: true
            }, {
                name: "moveH",
                time: 0.03,
                frames: [0, 0],
                framesGfxOffset: [0, 0, 0, 0],
                repeat: true
            }]
        }
    };
    sc.PUSH_PULL_TYPES.BergenLeftRight = {
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        terrain: ig.TERRAIN.WOOD,
        direction: sc.PUSH_PULL_DIRECTION.LEFT_RIGHT,
        anims: {
            sheet: {
                src: "media/entity/objects/puzzle-elements-1.png",
                width: 32,
                height: 64,
                offX: 32,
                offY: 32
            },
            aboveZ: 1,
            wallY: 0.05,
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "moveV",
                time: 0.03,
                frames: [0, 0],
                framesGfxOffset: [0, 0, 0, 0],
                repeat: true
            }, {
                name: "moveH",
                time: 0.03,
                frames: [0, 0],
                framesGfxOffset: [0, 0, 0, 0],
                repeat: true
            }]
        }
    };
    sc.PUSH_PULL_TYPES.BergenUpDown = {
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        terrain: ig.TERRAIN.WOOD,
        direction: sc.PUSH_PULL_DIRECTION.UP_DOWN,
        anims: {
            sheet: {
                src: "media/entity/objects/puzzle-elements-1.png",
                width: 32,
                height: 64,
                offX: 64,
                offY: 32
            },
            aboveZ: 1,
            wallY: 0.05,
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "moveV",
                time: 0.03,
                frames: [0, 0],
                framesGfxOffset: [0, 0, 0, 0],
                repeat: true
            }, {
                name: "moveH",
                time: 0.03,
                frames: [0, 0],
                framesGfxOffset: [0, 0, 0, 0],
                repeat: true
            }]
        }
    };
    sc.PUSH_PULL_TYPES.SmallTest = {
        size: {
            x: 16,
            y: 16,
            z: 16
        },
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/puzzle-elements-1.png",
                width: 16,
                height: 32
            },
            aboveZ: 1,
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "move",
                time: 0.05,
                frames: [0, 1, 2, 1],
                repeat: true
            }]
        },
        walkAnims: {
            idle: "default",
            move: "move"
        }
    };
    ig.ENTITY.WavePushPullBlock = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                pushPullType: {
                    _type: "String",
                    _info: "Type of push pull block",
                    _select: sc.PUSH_PULL_TYPES
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Block to spawn",
                    _popup: true
                }
            }
        }),
        pushPullable: null,
        phased: false,
        squishRespawn: true,
        compressorSlow: 0.5,
        bombSnap: true,
        effects: {
            sheet: new ig.EffectSheet("puzzle"),
            hideHandle: null
        },
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1E3;
            this.coll.zBounciness = 0;
            this.coll.weight = -1;
            this.coll.shadow.size =
                32;
            this.coll.setSize(32, 32, 32);
            b = ig.mapStyle.get("waveblock");
            this.initAnimations({
                sheet: {
                    src: b.sheet,
                    width: 32,
                    height: 64,
                    offX: b.x,
                    offY: b.y
                },
                aboveZ: 1,
                SUB: [{
                    name: "default",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "phasing",
                    time: 1,
                    frames: [0],
                    repeat: false,
                    renderMode: "lighter"
                }, {
                    name: "moveV",
                    time: 0.03,
                    frames: [0, 0],
                    framesGfxOffset: [0, 0, 0, 0],
                    repeat: true
                }, {
                    name: "moveH",
                    time: 0.03,
                    frames: [0, 0],
                    framesGfxOffset: [0, 0, 0, 0],
                    repeat: true
                }]
            });
            this.pushPullable = new sc.PushPullable(this)
        },
        show: function(b) {
            this.parent(b);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            this.pushPullable.setActive(true);
            if (!b) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showQuick", this)
            }
        },
        onHideRequest: function() {
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideQuick", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            });
            this.pushPullable.setActive(false)
        },
        onEffectEvent: function(b) {
            if (b.isDone() && this.effects.hideHandle) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },
        update: function() {
            this.pushPullable.onUpdate();
            this.parent()
        },
        deferredUpdate: function() {
            this.pushPullable.onDeferredUpdate();
            if (this.coll.pos.z == this.coll.baseZPos) {
                this.coll.zGravityFactor = 1;
                this.coll.zBounciness = 0.3
            }
        },
        onInteraction: function() {
            this.pushPullable.onInteraction()
        },
        onInteractionEnd: function() {
            this.pushPullable.onInteractionEnd()
        },
        onKill: function(b) {
            this.parent(b);
            this.pushPullable.onKill()
        },
        resetPos: function(b, a) {
            this.pushPullable.resetPos(b, a)
        },
        onEntityKillDetach: function() {
            if (this.phased) {
                this.phased =
                    false;
                this.setCurrentAnim("default")
            }
        },
        doTeleport: function() {
            this.phased = false;
            this.setCurrentAnim("default")
        },
        ballHit: function(b) {
            if (this.phased) return false;
            if (this.pushPullable.isActive()) {
                if (b.getElement() != sc.ELEMENT.WAVE || !(b.isBall && b.attackInfo.hasHint("CHARGED") || b instanceof sc.CompressedWaveEntity)) return false;
                this.phased = true;
                b.addEntityAttached(this);
                this.setCurrentAnim("phasing");
                return false
            }
        },
        onMagnetStart: function() {
            if (!this.magnet && !this.pushPullable.isActive()) return false;
            this.magnet =
                true;
            this.coll.setType(ig.COLLTYPE.NPBLOCK);
            this.pushPullable.setActive(false);
            return true
        },
        onMagnetEnd: function(b) {
            this.magnet = false;
            b && this.effects.sheet.spawnOnTarget("boxThud", this);
            this.pushPullable.onMagnetEnd()
        }
    })
});
ig.baked = !0;
