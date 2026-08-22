/**
 * game.feature.combat.entities.ball
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.ball")`.
 *
 * The thrown "ball" combat projectile: `sc.BallInfo` (the `sc.PROXY_TYPE.BALL`
 * spawner) and `ig.ENTITY.Ball`, a `Projectile` with steering behaviors, time
 * bonuses, grab/fling, wall/air kill effects, and bounce proxies.
 */
ig.module("game.feature.combat.entities.ball")
    .requires("game.feature.combat.entities.projectile", "game.feature.combat.model.ball-behavior", "game.feature.combat.model.proxy", "game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity", "impact.feature.light.light")
    .defines(function () {

    sc.BallInfo = sc.PROXY_TYPE.BALL = sc.ProxySpawnerBase.extend({
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
                effects: {
                    _type: "String",
                    _info: "Effect sheet for effects",
                    _select: "effects",
                    _withNull: true
                },
                effectKeys: {
                    _type: "EffectKets",
                    _info: "What keys to use in the effect sheet",
                    _optional: true
                },
                speed: {
                    _type: "Number",
                    _info: "Speed of ball",
                    _default: 300
                },
                maxBounce: {
                    _type: "Integer",
                    _info: "Number of times the ball can bounce on walls"
                },
                timer: {
                    _type: "Number",
                    _info: "The time until ball will disappear"
                },
                attack: {
                    _type: "AttackInfo",
                    _info: "How the ball will hit its target"
                },
                timeBoni: {
                    _type: "BallBoni",
                    _info: "Damage boni depending on time the ball is alive"
                },
                behaviors: {
                    _type: "BallBehaviors",
                    _info: "Additional Behaviors of the ball"
                },
                trail: {
                    _type: "Boolean",
                    _info: "True if ball should show a trail"
                },
                multiHit: {
                    _type: "Boolean",
                    _info: "True if ball can hit multiple targets"
                },
                light: {
                    _type: "String",
                    _info: "Size of light shown for this ball",
                    _optional: true,
                    _select: ig.LIGHT_SIZE
                },
                noLightGlow: {
                    _type: "Boolean",
                    _info: "If true, don't make light glow for ball"
                },
                destroyProxy: {
                    _type: "ProxyRef",
                    _info: "Proxy to be spawned when ball is destroyed",
                    _optional: true
                },
                bounceProxy: {
                    _type: "ProxyRef",
                    _info: "Proxy to be spawned when ball bounces on wall",
                    _optional: true
                },
                timeConnect: {
                    _type: "Boolean",
                    _info: "If true: connect proxy to time of owner.",
                    _optional: true
                },
                hitSideways: {
                    _type: "Boolean",
                    _info: "If true: Make combatant fly sideways when hit",
                    _optional: true
                },
                noMoveRotate: {
                    _type: "Boolean",
                    _info: "If true: Do not rotate sprite along movement direction",
                    _optional: true
                },
                shadow: {
                    _type: "Number",
                    _info: "Size of shadow. Otherwise will be 4. Set 0 to hide shadow.",
                    _optional: true
                }
            }
        }),

        init: function (data) {
            this.data = data;
            data.animation.shapeType || (data.animation.shapeType = "YZ_EXPAND");
            data.animation.wallY = 1;
            data.animation = new ig.AnimationSheet(data.animation);
            data.effects && (data.effects = new ig.EffectSheet(data.effects));
            if (data.timeBoni)
                for (var index = data.timeBoni.length; index--;) {
                    var bonus = ig.copy(data.attack);
                    ig.merge(bonus, data.timeBoni[index]);
                    data.timeBoni[index] = bonus
                }
            if (data.behaviors)
                for (index = data.behaviors.length; index--;) data.behaviors[index] = new sc.BALL_BEHAVIOR[data.behaviors[index].type](data.behaviors[index])
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
                ballInfo: this.data,
                params: source.getCombatantRoot().params,
                party: source.party,
                combatant: source
            };
            source.getCombatantRoot().isPlayer && sc.stats.addMap("player", "throws", 1);
            return ig.game.spawnEntity(ig.ENTITY.Ball, x, y, z, settings)
        }
    });

    var dirScratch = Vec2.create(),
        sizeScratch = Vec3.create(),
        posScratch = Vec3.create();

    ig.ENTITY.Ball = ig.ENTITY.Projectile.extend({
        isBall: true,
        party: 0,
        target: null,
        params: null,
        attackInfo: null,
        multiHit: false,
        maxTime: 0,
        timer: 1.5,
        timeBoni: [],
        effects: null,
        effectKeys: null,
        speed: 0,
        speedFactor: 1,
        lightHandle: null,
        grab: null,
        destroyProxySrc: null,
        bounceProxySrc: null,
        behaviors: null,
        behaviorData: null,
        hitSideways: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, {
                vel: settings.dir,
                combatant: settings.combatant
            });
            this.party = settings.party;
            this.params = settings.params;
            this.setBallInfo(settings.ballInfo);
            this.remainingHits = this.maxHits;
            this.timer = this.maxTime;
            this.totalTimer = 0
        },

        getTarget: function () {
            return this.target && this.target.replaceTargets ? this.target.replaceTargets[0] : this.target
        },

        setBallInfo: function (ballInfo, keepAttack) {
            var coll = this.coll;
            this.speed = ballInfo.speed;
            Vec2.length(coll.vel, this.speed);
            var size = ballInfo.size;
            this.hitSideways = ballInfo.hitSideways;
            var oldSize = Vec3.assign(sizeScratch, coll.size);
            size ? coll.setSize(size.x, size.y, size.z) : coll.setSize(8, 8, 8);
            coll.setPos(coll.pos.x - (this.coll.size.x - oldSize.x) / 2, coll.pos.y - (this.coll.size.y - oldSize.y) / 2, coll.pos.z);
            this.coll.shadow.size = ballInfo.shadow !== void 0 ? ballInfo.shadow : 4;
            this.coll.type = ig.COLLTYPE.PROJECTILE;
            if (this.combatant) this.target = this.combatant.getTarget(true);
            this.behaviors = ballInfo.behaviors || null;
            this.animSheet = ballInfo.animation;
            this.initAnimations(ballInfo.animation);
            this.coll.maxVel = ballInfo.speed;
            this.effects = ballInfo.effects;
            this.effectKeys = ballInfo.effectKeys || null;
            this.multiHit = ballInfo.multiHit || false;
            this.maxHits = ballInfo.maxBounce;
            this.maxTime = ballInfo.timer;
            this.noMoveRotate = ballInfo.noMoveRotate || false;
            if (ballInfo.destroyProxy) this.destroyProxySrc = sc.ProxyTools.prepareSrc(ballInfo.destroyProxy);
            if (ballInfo.bounceProxy) this.bounceProxySrc = sc.ProxyTools.prepareSrc(ballInfo.bounceProxy);
            if (ballInfo.timeConnect) this.coll.time.parent = this.combatant.coll;
            if (ballInfo.attack) {
                var attackInfo = new sc.AttackInfo(this.params, ballInfo.attack, true);
                if (keepAttack && this.attackInfo) {
                    attackInfo.damageFactor = this.attackInfo.damageFactor;
                    attackInfo.defenseFactor = this.attackInfo.defenseFactor;
                    attackInfo.spFactor = this.attackInfo.spFactor
                }
                this.attackInfo = attackInfo
            }
            this.timeBoni.length = 0;
            if (ballInfo.timeBoni)
                for (var index = 0; index < ballInfo.timeBoni.length; ++index) this.timeBoni[index] = {
                    time: ballInfo.timeBoni[index].time,
                    attackInfo: new sc.AttackInfo(this.params, ballInfo.timeBoni[index], true)
                };
            ig.EffectTools.clearEffects(this, "trail");
            ballInfo.trail && this.effects.spawnOnTarget(this.effectKeys && this.effectKeys.trail || "ballTrail", this, {
                duration: -1,
                group: "trail"
            });
            this.lightHandle && this.lightHandle.stop();
            var lightSize = ig.LIGHT_SIZE[ballInfo.light || "XS"];
            if (lightSize != ig.LIGHT_SIZE.NONE) {
                this.lightHandle = new ig.LightHandle(this, lightSize, 0, 0, -1, 1, !ballInfo.noLightGlow);
                ig.light.addLightHandle(this.lightHandle)
            }
            if (this.behaviors) {
                this.behaviorData = {};
                for (var behaviorIndex = this.behaviors.length; behaviorIndex--;) this.behaviors[behaviorIndex].onInit(this)
            }
        },

        grabPoint: function (pos, speedFactor) {
            this.grab && Vec3.assign(this.coll.vel, this.grab.oldVel);
            speedFactor = speedFactor || 1;
            var delta = Vec3.sub(pos, this.coll.pos, posScratch),
                duration = Vec3.length(delta) / (this.speed * speedFactor);
            this.grab = {
                pos: Vec3.create(pos),
                oldPos: Vec3.create(this.coll.pos),
                timer: new ig.WeightTimer(false, duration, ig.TIMER_MODE.ONCE),
                oldVel: Vec3.create(this.coll.vel)
            };
            Vec3.assign(this.coll.vel, delta);
            Vec3.length(this.coll.vel, 5);
            return duration
        },

        changeSpeed: function (factor, keepSpeedFactor) {
            this.speed = this.speed * factor;
            this.coll.maxVel = this.speed;
            Vec2.length(this.coll.vel, this.speed);
            this.timer = this.timer / factor;
            this.maxTime = this.maxTime / factor;
            if (keepSpeedFactor) this.speedFactor = this.speedFactor * factor
        },

        resetSpeed: function () {
            if (this.speedFactor != 1) {
                this.changeSpeed(1 / this.speedFactor);
                this.speedFactor = 1;
                return true
            }
            return false
        },

        changeDirection: function (dir) {
            Vec2.assign(this.coll.vel, dir);
            Vec2.length(this.coll.vel, this.speed)
        },

        onBounce: function (pos, res) {
            if (this.bounceProxySrc) this._spawnBounceProxy(pos, res);
            else if (this.effects) {
                var effect = this.effects.spawnFixed(this.effectKeys && this.effectKeys.bounce || "ballBounce", pos.x, pos.y, this.coll.pos.z, null, {
                    angle: Vec2.clockangle(res.blockDir)
                });
                effect && this.coll.time.parent && effect.setTimeEntity(this.coll.time.parent.entity)
            }
        },

        destroy: function () {
            this.onProjectileKill(ig.PROJECTILE_KILL_TYPE.OTHER);
            this.kill()
        },

        _spawnBounceProxy: function (pos, res) {
            var combatant = this.getCombatant(),
                proxy = sc.ProxyTools.getProxy(this.bounceProxySrc, combatant);
            if (proxy) {
                Vec2.assign(dirScratch, res.blockDir);
                Vec2.flip(dirScratch);
                proxy.spawn(pos.x, pos.y, this.coll.pos.z, combatant, dirScratch)
            }
        },

        onProjectileKill: function (killType, pos, res) {
            if (this.destroyProxySrc) {
                var combatant = this.getCombatant(),
                    proxy = sc.ProxyTools.getProxy(this.destroyProxySrc, combatant);
                if (proxy) {
                    var vel = this.coll.vel,
                        spawnPos = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, posScratch);
                    proxy.spawn(spawnPos.x, spawnPos.y, spawnPos.z, combatant, vel)
                }
            } else if (pos && this.bounceProxySrc) this._spawnBounceProxy(pos, res);
            else if (killType != ig.PROJECTILE_KILL_TYPE.OTHER && this.effects) {
                var effect = null;
                if (killType == ig.PROJECTILE_KILL_TYPE.WALL) {
                    var wallEffectKey = this.effectKeys && this.effectKeys.wall || "ballWallKill";
                    this.effects.hasEffect(wallEffectKey) && (effect = this.effects.spawnFixed(wallEffectKey, pos.x, pos.y, this.coll.pos.z, null, {
                        angle: Vec2.clockangle(res.blockDir)
                    }))
                } else {
                    var center = this.getCenter();
                    var airEffectKey = this.effectKeys && this.effectKeys.air || "ballAirKill";
                    this.effects.hasEffect(airEffectKey) && (effect = this.effects.spawnFixed(airEffectKey, center.x, center.y, this.coll.pos.z))
                }
                effect && this.coll.time.parent && effect.setTimeEntity(this.coll.time.parent.entity)
            }
        },

        onProjectileHit: function (other, blockDir) {
            var hit = false;
            if (!this.attackInfo || !this.attackInfo.hasNoEffect()) {
                if (other.ballHit) {
                    var attackInfo = other.ballHit(this, blockDir);
                    (hit = attackInfo) && !this.multiHit && this.destroy();
                    if (other.coll.type == ig.COLLTYPE.IGNORE && this.multiHit) this.skipBounce = true
                }
                if (this.attackInfo && other.damage && other.party != this.party) {
                    attackInfo = this.attackInfo;
                    this.party == sc.COMBATANT_PARTY.ENEMY && (hit = true);
                    for (var index = 0; index < this.timeBoni.length && this.timeBoni[index].time > this.timer;) ++index;
                    if (index < this.timeBoni.length) attackInfo = this.timeBoni[index].attackInfo;
                    if (other.damage(this, attackInfo)) {
                        hit = true;
                        this.multiHit || this.destroy()
                    }
                }
            }
            hit && this.combatant.getCombatantRoot().isPlayer && sc.stats.addMap("player", "throwHits", 1);
            return hit
        },

        update: function () {
            if (this.grab) {
                this.grab.timer.tick();
                var progress = this.grab.timer.get();
                Vec3.lerp(this.grab.oldPos, this.grab.pos, progress, posScratch);
                this.coll.setPos(posScratch.x, posScratch.y, posScratch.z);
                if (this.grab.timer.done()) {
                    Vec3.assign(this.coll.vel, this.grab.oldVel);
                    this.grab = null
                }
            } else if (this.behaviors)
                for (progress = this.behaviors.length; progress--;) this.behaviors[progress].onUpdate(this);
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.onProjectileKill(ig.PROJECTILE_KILL_TYPE.AIR);
                    this.kill()
                }
            }
            this.totalTimer = this.totalTimer + ig.system.tick;
            this.parent()
        },

        getElement: function () {
            return this.attackInfo && this.attackInfo.element || sc.ELEMENT.NEUTRAL
        },

        getHitVel: function (other, out) {
            var vel = out || {};
            this.grab ? Vec2.assign(vel, this.grab.oldVel) : Vec2.assign(vel, this.coll.vel);
            if (this.hitSideways) {
                Vec2.rotate90CW(vel);
                var distVec = ig.CollTools.getDistVec2(this.coll, other.coll, distScratch);
                Vec2.addMulF(distVec, other.coll.vel, -ig.system.tick);
                Vec2.dot(distVec, vel) < 0 && Vec2.flip(vel)
            }
            return vel
        },

        resetBounceCount: function () {
            this.remainingHits = this.maxHits
        },

        resetTime: function (time) {
            this.timer = time || this.maxTime
        },

        cleanDirection: function (angleStep) {
            Vec2.round(this.coll.vel, Math.PI * 2 * angleStep)
        }
    });

    var distScratch = Vec2.create()
});
ig.baked = !0;
