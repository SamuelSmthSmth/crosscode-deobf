/**
 * game.feature.npc.entities.sc-actor
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.npc.entities.sc-actor")`.
 *
 * Base class for all NPC/actor-type entities in CrossCode. Extends
 * `ig.ActorEntity` with terrain-aware step sounds, dust effects on land,
 * navigation path tracking, and an `ig.Influencer` for element/status
 * influence handling. Also defines the `sc.ACTOR_SOUND` terrain→sound
 * lookup table and the `sc.ACTOR_DUST` enum.
 */
ig.module("game.feature.npc.entities.sc-actor").requires(
    "impact.base.actor-entity",
    "impact.feature.effect.effect-sheet"
).defines(function () {

    /**
     * Look up the sound set for a given collider's current terrain.
     * @param {ig.CollEntry} coll
     * @param {string} soundType — key into sc.ACTOR_SOUND
     * @returns {object} terrain-specific sound set (jump, land, step1, step2, …)
     */
    function getTerrainSound(coll, soundType) {
        var terrain = ig.terrain.getTerrain(coll, true, true);
        var soundSet = sc.ACTOR_SOUND[soundType] || sc.ACTOR_SOUND.none;
        return soundSet[terrain] || soundSet[ig.TERRAIN_DEFAULT];
    }

    /* ── Terrain sound tables ───────────────────────────────────── */

    sc.ACTOR_SOUND = {};
    sc.ACTOR_SOUND.none = {};
    sc.ACTOR_SOUND.none[ig.TERRAIN_DEFAULT] = {};
    sc.ACTOR_SOUND["default"] = {};
    sc.ACTOR_SOUND["default"][ig.TERRAIN_DEFAULT] = {
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/land.ogg", 1, 0.1),
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
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
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
        step2: new ig.Sound("media/sound/move/stone-step-1.ogg", 0.8, 0.1)
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
        step1: new ig.Sound("media/sound/move/pipe-step-1.ogg", 0.7, 0.1),
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
        land: new ig.Sound("media/sound/move/ice-land.ogg", 1, 0.1),
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
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
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
        step1: new ig.Sound("media/sound/move/dark-crystal-step-01.ogg", 0.4, 0.1),
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
        jump: new ig.Sound("media/sound/move/jump.ogg", 0.4, 0.1),
        land: new ig.Sound("media/sound/move/ice-land.ogg", 1, 0.1),
        step1: new ig.Sound("media/sound/move/water-step-01.ogg", 0.4, 0.15),
        step2: new ig.Sound("media/sound/move/water-step-02.ogg", 0.4, 0.15),
        stepFx: "beach",
        cancelOnChange: true
    };

    /* Special sound sets */
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
        land: new ig.Sound("media/sound/battle/blubb-3.ogg", 0.6)
    };

    /* ── Dust types ─────────────────────────────────────────────── */

    sc.ACTOR_DUST = {
        NONE: 0,
        DEFAULT: 1
    };

    /* ── sc.ActorEntity ─────────────────────────────────────────── */

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.nav.path = ig.navigation.getNavPath(this);
            this.influencer = new ig.Influencer(this);
        },

        update: function () {
            this.stepStats.terrain = ig.terrain.getTerrain(this.coll, true);
            this.stepStats.centerTerrain = ig.terrain.getTerrain(this.coll, false);

            // Stop the previous step fx if terrain changed.
            if (this.stepFx.prevEffect && this.stepFx.prevTerrain != this.stepStats.terrain) {
                this.stepFx.prevEffect.stop();
                this.stepFx.prevEffect = null;
            }

            this.onTerrainUpdate();
            this.influencer.onUpdate();

            // Track navigation failure duration.
            var nav = this.nav;
            if (nav.path.failCount) {
                nav.failTimer += ig.system.tick;
                if (nav.path.failCount != nav.lastFailCount) {
                    nav.lastFailCount = nav.path.failCount;
                    this.onNavigationFailed(nav.failTimer);
                }
            } else {
                nav.failTimer = 0;
            }

            this.parent();

            // Step sounds & dust effects.
            if (!this.jumping && !this.animationFixed && this.stepFx.frames &&
                !Vec2.isZero(this.coll.accelDir) &&
                this.coll.relativeVel >= ig.ACTOR_RUN_THRESHOLD) {

                var currentFrame = this.animState.getFrame();
                if (currentFrame != this.stepFx.lastFrame) {
                    var terrainSound = getTerrainSound(this.coll, this.soundType);
                    var played = false;

                    if (currentFrame == this.stepFx.frames[0]) {
                        played = true;
                        ig.SoundHelper.playAtEntity(terrainSound.step1, this, null, null, 700);
                        this.onMoveEffect && this.onMoveEffect("step");
                    }
                    if (currentFrame == this.stepFx.frames[1]) {
                        played = true;
                        ig.SoundHelper.playAtEntity(terrainSound.step2, this, null, null, 700);
                        this.onMoveEffect && this.onMoveEffect("step");
                    }
                    if (played && terrainSound.stepFx &&
                        !ig.CollTools.isPostMoveOverHole(this.coll, true)) {

                        var fx = this.stepFx.effects.spawnOnTarget(
                            terrainSound.stepFx, this,
                            terrainSound.stepFaceAlign ? { rotateFace: -1 } : null
                        );
                        if (terrainSound.cancelOnChange) {
                            this.stepFx.prevEffect = fx;
                            this.stepFx.prevTerrain = this.stepStats.terrain;
                        }
                    }
                    this.stepFx.lastFrame = currentFrame;
                }
            } else {
                this.stepFx.lastFrame = -1;
            }
        },

        /** Override point for subclasses (e.g. NPC respawn-on-fall). */
        onTerrainUpdate: function () {},

        /** Callback for step/jump/land sounds (set by subclasses as needed). */
        onMoveEffect: null,

        /** Play jump sound + dust. @param {number} velZ @param {boolean} [silent] */
        onJump: function (velZ, silent) {
            var terrainSound = getTerrainSound(this.coll, this.soundType);
            silent || ig.SoundHelper.playAtEntity(terrainSound.jump, this, null, null, 700);
            var center = this.getCenter();
            ig.game.effects.dust.spawnFixed("medium", center.x, center.y, this.coll.pos.z);
            this.onMoveEffect && this.onMoveEffect("jump");
        },

        onTouchGround: function (velZ) {
            this.parent(velZ);
            if ((this.tooHighToFall || this.coll.pos.z >= ig.game.minLevelZ) &&
                (!this.coll.ignoreCollision && !this.coll.float.height) &&
                this.dustType === sc.ACTOR_DUST.DEFAULT) {

                var center = this.getCenter();

                if (velZ < 0) {
                    var terrainSound = getTerrainSound(this.coll, this.soundType);
                    ig.SoundHelper.playAtEntity(terrainSound.land, this, null, null, 700);
                    terrainSound.stepFx && this.stepFx.effects.spawnOnTarget(terrainSound.stepFx, this);
                }
                if (velZ < -150) {
                    var dust = this.tooHighToFall
                        ? ig.game.effects.dust.spawnFixed("giantHole", center.x, center.y, this.coll.pos.z)
                        : this.coll.size.x > 100
                            ? ig.game.effects.dust.spawnFixed("giant", center.x, center.y, this.coll.pos.z)
                            : this.coll.size.x > 20
                                ? ig.game.effects.dust.spawnFixed("large", center.x, center.y, this.coll.pos.z)
                                : ig.game.effects.dust.spawnFixed("medium", center.x, center.y, this.coll.pos.z);
                    dust && dust.setTimeEntity(this);
                    this.onMoveEffect && this.onMoveEffect("land");
                }
            }
        },

        /** Override point for navigation-failure handling. */
        onNavigationFailed: function () {},

        /** Forward the influencer's post-sprite-update call. */
        updateSprites: function () {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            this.influencer.onPostSpriteUpdate();
        }
    });

    /* ── ACTOR_CONFIGS entry ────────────────────────────────────── */

    ig.ACTOR_CONFIGS.SCACTOR = {
        classType: sc.ActorEntity,
        KEYS: {
            stepSfxFrames: 0,
            soundType: "default",
            dustType: "DEFAULT"
        },
        fromDataFix: function () {
            typeof this.dustType == "string" && (this.dustType = sc.ACTOR_DUST[this.dustType]);
        },
        apply: function (entity) {
            entity.stepFx.frames = this.stepSfxFrames;
            entity.soundType = this.soundType;
            entity.dustType = this.dustType;
        },
        load: function (entity) {
            this.stepSfxFrames = entity.stepFx.frames;
            this.soundType = entity.soundType;
            this.dustType = entity.dustType;
        }
    };
});
ig.baked = !0;