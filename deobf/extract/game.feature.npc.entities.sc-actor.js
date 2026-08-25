ig.module("game.feature.npc.entities.sc-actor").requires("impact.base.actor-entity", "impact.feature.effect.effect-sheet").defines(function() {
    function b(a, b) {
        var c = ig.terrain.getTerrain(a, true, true),
            e = sc.ACTOR_SOUND[b] || sc.ACTOR_SOUND.none;
        return e[c] || e[ig.TERRAIN_DEFAULT]
    }
    sc.ACTOR_SOUND = {};
    sc.ACTOR_SOUND.none = {};
    sc.ACTOR_SOUND.none[ig.TERRAIN_DEFAULT] = {};
    sc.ACTOR_SOUND["default"] = {};
    sc.ACTOR_SOUND["default"][ig.TERRAIN_DEFAULT] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/land.ogg",
            1, 0.1),
        step1: new ig.Sound("media/sound/move/step-2.ogg", 0.5, 0.1),
        step2: new ig.Sound("media/sound/move/step-1.ogg", 0.5, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.CARDBOARD] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/cardboard-land.ogg", 0.5, 0.1),
        step1: new ig.Sound("media/sound/move/cardboard-step-2.ogg", 0.5, 0.1),
        step2: new ig.Sound("media/sound/move/cardboard-step-1.ogg", 0.5, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.EARTH] = {
        jump: new ig.Sound("media/sound/move/jump.ogg",
            0.4, 0.1),
        land: new ig.Sound("media/sound/move/grass-land.ogg", 1, 0.1),
        step1: new ig.Sound("media/sound/move/earth-step-1.ogg", 1, 0.1),
        step2: new ig.Sound("media/sound/move/earth-step-2.ogg", 1, 0.1),
        stepFx: "dust"
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.GRASS] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/grass-land.ogg", 1, 0.1),
        step1: new ig.Sound("media/sound/move/grass-step-2.ogg", 1, 0.1),
        step2: new ig.Sound("media/sound/move/grass-step-1.ogg", 1, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.WOOD] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/wooden-land.ogg", 0.5, 0.1),
        step1: new ig.Sound("media/sound/move/wooden-step-2.ogg", 0.5, 0.1),
        step2: new ig.Sound("media/sound/move/wooden-step-1.ogg", 0.5, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.STONE] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/stone-land.ogg", 0.7, 0.1),
        step1: new ig.Sound("media/sound/move/stone-step-2.ogg", 0.8, 0.1),
        step2: new ig.Sound("media/sound/move/stone-step-1.ogg",
            0.8, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.METALSOLID] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/metal-solid-land.ogg", 0.7, 0.1),
        step1: new ig.Sound("media/sound/move/metal-solid-step-2.ogg", 0.8, 0.1),
        step2: new ig.Sound("media/sound/move/metal-solid-step-1.ogg", 0.8, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.METAL_HOLLOW] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/pipe-land.ogg", 0.7, 0.1),
        step1: new ig.Sound("media/sound/move/pipe-step-1.ogg",
            0.7, 0.1),
        step2: new ig.Sound("media/sound/move/pipe-step-2.ogg", 0.7, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.SNOW] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/snow-land.ogg", 0.6, 0.1),
        step1: new ig.Sound("media/sound/move/snow-step-1.ogg", 0.5, 0.1),
        step2: new ig.Sound("media/sound/move/snow-step-2.ogg", 0.5, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.ICE] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/ice-land.ogg",
            1, 0.1),
        step1: new ig.Sound("media/sound/move/ice-step-1.ogg", 1, 0.1),
        step2: new ig.Sound("media/sound/move/ice-step-2.ogg", 1, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.SAND] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/snow-land.ogg", 0.6, 0.1),
        step1: new ig.Sound("media/sound/move/snow-step-1.ogg", 0.5, 0.1),
        step2: new ig.Sound("media/sound/move/snow-step-2.ogg", 0.5, 0.1),
        stepFx: "dust"
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.QUICKSAND] = {
        jump: new ig.Sound("media/sound/move/jump.ogg",
            0.4, 0.1),
        land: new ig.Sound("media/sound/move/snow-land.ogg", 0.6, 0.1),
        step1: new ig.Sound("media/sound/move/snow-step-1.ogg", 0.5, 0.1),
        step2: new ig.Sound("media/sound/move/snow-step-2.ogg", 0.5, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.SHALLOW_WATER] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/ice-land.ogg", 1, 0.1),
        step1: new ig.Sound("media/sound/move/water-step-01.ogg", 0.3, 0.1),
        step2: new ig.Sound("media/sound/move/water-step-02.ogg", 0.3, 0.1),
        stepFx: "water"
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.LASER] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/laser-land.ogg", 0.7, 0.1),
        step1: new ig.Sound("media/sound/move/laser-step-1.ogg", 0.7, 0.1),
        step2: new ig.Sound("media/sound/move/laser-step-2.ogg", 0.7, 0.1),
        stepFx: "laser"
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.CRYSTAL] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/dark-crystal-land.ogg", 0.6, 0.1),
        step1: new ig.Sound("media/sound/move/dark-crystal-step-01.ogg",
            0.4, 0.1),
        step2: new ig.Sound("media/sound/move/dark-crystal-step-02.ogg", 0.4, 0.1)
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.BEACH_SAND] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/snow-land.ogg", 0.6, 0.1),
        step1: new ig.Sound("media/sound/move/snow-step-1.ogg", 0.5, 0.1),
        step2: new ig.Sound("media/sound/move/snow-step-2.ogg", 0.5, 0.1),
        stepFx: "beachSand",
        stepFaceAlign: true
    };
    sc.ACTOR_SOUND["default"][ig.TERRAIN.BEACH_WATER] = {
        jump: new ig.Sound("media/sound/move/jump.ogg",
            0.4, 0.1),
        land: new ig.Sound("media/sound/move/ice-land.ogg", 1, 0.1),
        step1: new ig.Sound("media/sound/move/water-step-01.ogg", 0.4, 0.15),
        step2: new ig.Sound("media/sound/move/water-step-02.ogg", 0.4, 0.15),
        stepFx: "beach",
        cancelOnChange: true
    };
    sc.ACTOR_SOUND.defaultQuiet = {};
    sc.ACTOR_SOUND.defaultQuiet[ig.TERRAIN_DEFAULT] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.2, 0.1),
        land: new ig.Sound("media/sound/move/land.ogg", 0.5, 0.1)
    };
    sc.ACTOR_SOUND.giantMachine = {};
    sc.ACTOR_SOUND.giantMachine[ig.TERRAIN_DEFAULT] = {
        jump: new ig.Sound("media/sound/boss/crab/robot-jump.ogg", 0.8),
        land: new ig.Sound("media/sound/boss/crab/robot-land.ogg", 0.8)
    };
    sc.ACTOR_SOUND.colDngBoss = {};
    sc.ACTOR_SOUND.colDngBoss[ig.TERRAIN_DEFAULT] = {
        jump: new ig.Sound("media/sound/boss/crab/robot-jump.ogg", 0.8),
        land: new ig.Sound("media/sound/boss/drill-boss/drill-boss-walk-2.ogg", 0.8)
    };
    sc.ACTOR_SOUND.slime = {};
    sc.ACTOR_SOUND.slime[ig.TERRAIN_DEFAULT] = {
        jump: new ig.Sound("media/sound/battle/blubb.ogg", 0.6),
        land: new ig.Sound("media/sound/battle/blubb-3.ogg",
            0.6)
    };
    sc.ACTOR_DUST = {
        NONE: 0,
        DEFAULT: 1
    };
    sc.ActorEntity = ig.ActorEntity.extend({
        soundType: "default",
        dustType: sc.ACTOR_DUST.NONE,
        stepFx: {
            frames: 0,
            lastFrame: 0,
            effects: new ig.EffectSheet("stepFx"),
            prevTerrain: null,
            prevEffect: null
        },
        nav: {
            path: null,
            failTimer: 0,
            lastFailCount: 0
        },
        tooHighToFall: false,
        stepStats: {
            terrain: 0,
            centerTerrain: 0
        },
        influencer: null,
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.nav.path = ig.navigation.getNavPath(this);
            this.influencer = new ig.Influencer(this)
        },
        update: function() {
            this.stepStats.terrain =
                ig.terrain.getTerrain(this.coll, true);
            this.stepStats.centerTerrain = ig.terrain.getTerrain(this.coll, false);
            if (this.stepFx.prevEffect && this.stepFx.prevTerrain != this.stepStats.terrain) {
                this.stepFx.prevEffect.stop();
                this.stepFx.prevEffect = null
            }
            this.onTerrainUpdate();
            this.influencer.onUpdate();
            var a = this.nav;
            if (a.path.failCount) {
                a.failTimer = a.failTimer + ig.system.tick;
                if (a.path.failCount != a.lastFailCount) {
                    a.lastFailCount = a.path.failCount;
                    this.onNavigationFailed(a.failTimer)
                }
            } else a.failTimer = 0;
            this.parent();
            if (!this.jumping && !this.animationFixed && this.stepFx.frames && !Vec2.isZero(this.coll.accelDir) && this.coll.relativeVel >= ig.ACTOR_RUN_THRESHOLD) {
                a = this.animState.getFrame();
                if (a != this.stepFx.lastFrame) {
                    var d = b(this.coll, this.soundType),
                        c = false;
                    if (a == this.stepFx.frames[0]) {
                        c = true;
                        ig.SoundHelper.playAtEntity(d.step1, this, null, null, 700);
                        this.onMoveEffect && this.onMoveEffect("step")
                    }
                    if (a == this.stepFx.frames[1]) {
                        c = true;
                        ig.SoundHelper.playAtEntity(d.step2, this, null, null, 700);
                        this.onMoveEffect && this.onMoveEffect("step")
                    }
                    if (c &&
                        d.stepFx && !ig.CollTools.isPostMoveOverHole(this.coll, true)) {
                        c = this.stepFx.effects.spawnOnTarget(d.stepFx, this, d.stepFaceAlign ? {
                            rotateFace: -1
                        } : null);
                        if (d.cancelOnChange) {
                            this.stepFx.prevEffect = c;
                            this.stepFx.prevTerrain = this.stepStats.terrain
                        }
                    }
                    this.stepFx.lastFrame = a
                }
            } else this.stepFx.lastFrame = -1
        },
        onTerrainUpdate: function() {},
        onMoveEffect: null,
        onJump: function(a, d) {
            var c = b(this.coll, this.soundType);
            d || ig.SoundHelper.playAtEntity(c.jump, this, null, null, 700);
            c = this.getCenter();
            ig.game.effects.dust.spawnFixed("medium",
                c.x, c.y, this.coll.pos.z);
            this.onMoveEffect && this.onMoveEffect("jump")
        },
        onTouchGround: function(a) {
            this.parent(a);
            if ((this.tooHighToFall || this.coll.pos.z >= ig.game.minLevelZ) && (!this.coll.ignoreCollision && !this.coll.float.height) && this.dustType === sc.ACTOR_DUST.DEFAULT) {
                var d = this.getCenter();
                if (a < 0) {
                    var c = b(this.coll, this.soundType);
                    ig.SoundHelper.playAtEntity(c.land, this, null, null, 700);
                    c.stepFx && this.stepFx.effects.spawnOnTarget(c.stepFx, this)
                }
                if (a < -150) {
                    (a = this.tooHighToFall ? ig.game.effects.dust.spawnFixed("giantHole",
                        d.x, d.y, this.coll.pos.z) : this.coll.size.x > 100 ? ig.game.effects.dust.spawnFixed("giant", d.x, d.y, this.coll.pos.z) : this.coll.size.x > 20 ? ig.game.effects.dust.spawnFixed("large", d.x, d.y, this.coll.pos.z) : ig.game.effects.dust.spawnFixed("medium", d.x, d.y, this.coll.pos.z)) && a.setTimeEntity(this);
                    this.onMoveEffect && this.onMoveEffect("land")
                }
            }
        },
        onNavigationFailed: function() {},
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            this.influencer.onPostSpriteUpdate()
        }
    });
    ig.ACTOR_CONFIGS.SCACTOR = {
        classType: sc.ActorEntity,
        KEYS: {
            stepSfxFrames: 0,
            soundType: "default",
            dustType: "DEFAULT"
        },
        fromDataFix: function() {
            typeof this.dustType == "string" && (this.dustType = sc.ACTOR_DUST[this.dustType])
        },
        apply: function(a) {
            a.stepFx.frames = this.stepSfxFrames;
            a.soundType = this.soundType;
            a.dustType = this.dustType
        },
        load: function(a) {
            this.stepSfxFrames = a.stepFx.frames;
            this.soundType = a.soundType;
            this.dustType = a.dustType
        }
    }
});
ig.baked = !0;
