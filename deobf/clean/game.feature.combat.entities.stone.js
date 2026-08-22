/**
 * game.feature.combat.entities.stone
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.stone")`.
 *
 * Thrown "stone" projectile: `sc.StoneInfo` (the `sc.PROXY_TYPE.STONE`
 * spawner) and `ig.ENTITY.Stone`, a `Projectile` subclass with wall/ground
 * bounces, trail/light effects, and hit handling.
 */
ig.module("game.feature.combat.entities.stone")
    .requires("game.feature.combat.entities.projectile", "game.feature.combat.model.proxy", "game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity", "impact.feature.light.light")
    .defines(function () {

    sc.StoneInfo = sc.PROXY_TYPE.STONE = sc.ProxySpawnerBase.extend({
        data: null,

        _wm: new ig.Config({
            attributes: {
                animation: {
                    _type: "AnimSheet",
                    _info: "Animation sheet of ball. Needs one entry with name 'default'",
                    _popup: true
                },
                size: {
                    _type: "Offset",
                    _info: "Size of projectile",
                    _optional: true
                },
                shadow: {
                    _type: "Number",
                    _info: "Shadow size"
                },
                effects: {
                    _type: "String",
                    _info: "Effect sheet for effects",
                    _select: "effects",
                    _withNull: true
                },
                effectKeys: {
                    _type: "EffectKeys",
                    _info: "What keys to use in the effect sheet",
                    _optional: true
                },
                maxBounce: {
                    _type: "Integer",
                    _info: "Number of times the stone can bounce on walls"
                },
                groundBounce: {
                    _type: "Integer",
                    _info: "How often stone can bounce on ground before being destroyed"
                },
                attack: {
                    _type: "AttackInfo",
                    _info: "How the ball will hit its target"
                },
                speed: {
                    _type: "NumberVary",
                    _info: "Speed of ball",
                    _default: 300
                },
                zVel: {
                    _type: "NumberVary",
                    _info: "Z Vel when thrown"
                },
                zBounciness: {
                    _type: "Number",
                    _info: "Amount of z bounciness"
                },
                multiHit: {
                    _type: "Boolean",
                    _info: "True if stone can hit multiple targets"
                },
                light: {
                    _type: "String",
                    _info: "Size of light shown for this ball",
                    _optional: true,
                    _select: ig.LIGHT_SIZE
                },
                noLightGlow: {
                    _type: "Boolean",
                    _info: "If true, don't make light glow for stone"
                }
            }
        }),

        init: function (data) {
            this.data = data;
            data.animation.shapeType || (data.animation.shapeType = "YZ_EXPAND");
            data.animation.wallY = 1;
            data.animation = new ig.AnimationSheet(data.animation);
            data.effects && (data.effects = new ig.EffectSheet(data.effects))
        },

        getSize: function (size) {
            this.data.size ? Vec3.assign(size, this.data.size) : Vec3.assignC(size, 8, 8, 8);
            return size
        },

        clearCached: function () {
            this.data.effects && this.data.effects.decreaseRef();
            this.data.animation && this.data.animation.clearCached()
        },

        spawn: function (x, y, z, source, dir) {
            var settings = {
                dir: dir,
                stoneInfo: this.data,
                params: source.getCombatantRoot().params,
                party: source.party,
                combatant: source
            };
            source.getCombatantRoot().isPlayer && sc.stats.addMap("player", "throws", 1);
            return ig.game.spawnEntity(ig.ENTITY.Stone, x, y, z, settings)
        }
    });

    Vec2.create();

    var sizeScratch = Vec3.create();

    Vec3.create();

    ig.ENTITY.Stone = ig.ENTITY.Projectile.extend({
        party: 0,
        target: null,
        params: null,
        attackInfo: null,
        multiHit: false,
        remainingGroundHits: 0,
        effects: null,
        effectKeys: null,
        lightHandle: null,
        grab: null,
        behaviors: null,
        behaviorData: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, {
                vel: settings.dir,
                combatant: settings.combatant
            });
            this.party = settings.party;
            this.params = settings.params;
            this.setStoneInfo(settings.stoneInfo);
            this.coll.zGravityFactor = 1
        },

        setStoneInfo: function (stoneInfo) {
            var coll = this.coll,
                speed = ig.Event.getNumberVary(stoneInfo.speed),
                zVel = ig.Event.getNumberVary(stoneInfo.zVel);
            Vec2.length(coll.vel, speed);
            coll.vel.z = zVel;
            coll.maxVel = speed;
            coll.shadow.size = stoneInfo.shadow || 16;
            coll.zBounciness = stoneInfo.zBounciness || 0;

            var size = stoneInfo.size,
                oldSize = Vec3.assign(sizeScratch, coll.size);
            size ? coll.setSize(size.x, size.y, size.z) : coll.setSize(8, 8, 8);
            coll.setPos(coll.pos.x - (this.coll.size.x - oldSize.x) / 2, coll.pos.y - (this.coll.size.y - oldSize.y) / 2, coll.pos.z);

            this.coll.type = ig.COLLTYPE.PROJECTILE;
            this.coll.setSize(8, 8, 8);
            if (this.combatant) this.target = this.combatant.target;
            this.behaviors = stoneInfo.behaviors || null;
            this.animSheet = stoneInfo.animation;
            this.initAnimations(stoneInfo.animation);
            this.effects = stoneInfo.effects;
            this.effectKeys = stoneInfo.effectKeys || null;
            this.multiHit = stoneInfo.multiHit || false;
            this.remainingHits = stoneInfo.maxBounce;
            this.remainingGroundHits = stoneInfo.groundBounce;
            if (stoneInfo.attack) this.attackInfo = new sc.AttackInfo(this.params, stoneInfo.attack, true);

            ig.EffectTools.clearEffects(this, "trail");
            var trailKey = this.effectKeys && this.effectKeys.trail || "stoneTrail";
            this.effects && this.effects.hasEffect(trailKey) && this.effects.spawnOnTarget(trailKey, this, {
                duration: -1,
                group: "trail"
            });
            this.lightHandle && this.lightHandle.stop();
            this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE[stoneInfo.light || "XS"], 0, 0.2, -1, 1, !stoneInfo.noLightGlow);
            ig.light.addLightHandle(this.lightHandle)
        },

        onBounce: function (pos, res) {
            this.effects && this.effects.spawnFixed(this.effectKeys && this.effectKeys.wallBounce || "stoneWallBounce", pos.x, pos.y, this.coll.pos.z, null, {
                angle: Vec2.clockangle(res.blockDir)
            })
        },

        onProjectileKill: function () {
            if (this.effects) {
                var effectKey = this.effectKeys && this.effectKeys.kill || "stoneKill";
                if (this.effects.hasEffect(effectKey)) {
                    var pos = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER);
                    this.effects.spawnFixed(effectKey, pos.x, pos.y, pos.z, null)
                }
            }
        },

        onProjectileHit: function (other) {
            var hit = false;
            if (this.attackInfo && other.damage && other.party != this.party) {
                var attackInfo = this.attackInfo;
                hit = true;
                if (other.damage(this, attackInfo) && !this.multiHit) {
                    this.onProjectileKill();
                    this.kill()
                }
            }
            hit && this.combatant.isPlayer && sc.stats.addMap("player", "throwHits", 1);
            return hit
        },

        onTouchGround: function () {
            if (!this.remainingGroundHits) {
                this.onProjectileKill();
                this.kill()
            }
            if (this.coll.vel.z < 10) {
                this.onProjectileKill();
                this.kill()
            }
            this.remainingGroundHits--
        },

        getElement: function () {
            return this.attackInfo && this.attackInfo.element || sc.ELEMENT.NEUTRAL
        }
    })
});
ig.baked = !0;
