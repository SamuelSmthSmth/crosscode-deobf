ig.module("game.feature.combat.entities.ball").requires("game.feature.combat.entities.projectile", "game.feature.combat.model.ball-behavior", "game.feature.combat.model.proxy", "game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity", "impact.feature.light.light").defines(function() {
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
        init: function(a) {
            this.data = a;
            a.animation.shapeType || (a.animation.shapeType = "YZ_EXPAND");
            a.animation.wallY = 1;
            a.animation = new ig.AnimationSheet(a.animation);
            a.effects && (a.effects = new ig.EffectSheet(a.effects));
            if (a.timeBoni)
                for (var b = a.timeBoni.length; b--;) {
                    var c = ig.copy(a.attack);
                    ig.merge(c, a.timeBoni[b]);
                    a.timeBoni[b] = c
                }
            if (a.behaviors)
                for (b = a.behaviors.length; b--;) a.behaviors[b] = new sc.BALL_BEHAVIOR[a.behaviors[b].type](a.behaviors[b])
        },
        getSize: function(a) {
            this.data.size ? Vec3.assign(a,
                this.data.size) : Vec3.assignC(a, 8, 8, 8);
            return a
        },
        clearCached: function() {
            this.data.effects && this.data.effects.decreaseRef();
            this.data.animation && this.data.animation.clearCached()
        },
        spawn: function(a, b, c, d, i) {
            i = {
                dir: i,
                ballInfo: this.data,
                params: d.getCombatantRoot().params,
                party: d.party,
                combatant: d
            };
            d.getCombatantRoot().isPlayer && sc.stats.addMap("player", "throws", 1);
            return ig.game.spawnEntity(ig.ENTITY.Ball, a, b, c, i)
        }
    });
    var b = Vec2.create(),
        a = Vec3.create(),
        d = Vec3.create();
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
        init: function(a, b, c, d) {
            this.parent(a, b, c, {
                vel: d.dir,
                combatant: d.combatant
            });
            this.party = d.party;
            this.params = d.params;
            this.setBallInfo(d.ballInfo);
            this.remainingHits = this.maxHits;
            this.timer = this.maxTime;
            this.totalTimer = 0
        },
        getTarget: function() {
            return this.target &&
                this.target.replaceTargets ? this.target.replaceTargets[0] : this.target
        },
        setBallInfo: function(b, c) {
            var d = this.coll;
            this.speed = b.speed;
            Vec2.length(d.vel, this.speed);
            var h = b.size;
            this.hitSideways = b.hitSideways;
            var i = Vec3.assign(a, d.size);
            h ? d.setSize(h.x, h.y, h.z) : d.setSize(8, 8, 8);
            d.setPos(d.pos.x - (this.coll.size.x - i.x) / 2, d.pos.y - (this.coll.size.y - i.y) / 2, d.pos.z);
            this.coll.shadow.size = b.shadow !== void 0 ? b.shadow : 4;
            this.coll.type = ig.COLLTYPE.PROJECTILE;
            if (this.combatant) this.target = this.combatant.getTarget(true);
            this.behaviors = b.behaviors || null;
            this.animSheet = b.animation;
            this.initAnimations(b.animation);
            this.coll.maxVel = b.speed;
            this.effects = b.effects;
            this.effectKeys = b.effectKeys || null;
            this.multiHit = b.multiHit || false;
            this.maxHits = b.maxBounce;
            this.maxTime = b.timer;
            this.noMoveRotate = b.noMoveRotate || false;
            if (b.destroyProxy) this.destroyProxySrc = sc.ProxyTools.prepareSrc(b.destroyProxy);
            if (b.bounceProxy) this.bounceProxySrc = sc.ProxyTools.prepareSrc(b.bounceProxy);
            if (b.timeConnect) this.coll.time.parent = this.combatant.coll;
            if (b.attack) {
                d = new sc.AttackInfo(this.params, b.attack, true);
                if (c && this.attackInfo) {
                    d.damageFactor = this.attackInfo.damageFactor;
                    d.defenseFactor = this.attackInfo.defenseFactor;
                    d.spFactor = this.attackInfo.spFactor
                }
                this.attackInfo = d
            }
            this.timeBoni.length = 0;
            if (b.timeBoni)
                for (d = 0; d < b.timeBoni.length; ++d) this.timeBoni[d] = {
                    time: b.timeBoni[d].time,
                    attackInfo: new sc.AttackInfo(this.params, b.timeBoni[d], true)
                };
            ig.EffectTools.clearEffects(this, "trail");
            b.trail && this.effects.spawnOnTarget(this.effectKeys && this.effectKeys.trail ||
                "ballTrail", this, {
                    duration: -1,
                    group: "trail"
                });
            this.lightHandle && this.lightHandle.stop();
            d = ig.LIGHT_SIZE[b.light || "XS"];
            if (d != ig.LIGHT_SIZE.NONE) {
                this.lightHandle = new ig.LightHandle(this, d, 0, 0, -1, 1, !b.noLightGlow);
                ig.light.addLightHandle(this.lightHandle)
            }
            if (this.behaviors) {
                this.behaviorData = {};
                for (d = this.behaviors.length; d--;) this.behaviors[d].onInit(this)
            }
        },
        grabPoint: function(a, b) {
            this.grab && Vec3.assign(this.coll.vel, this.grab.oldVel);
            var b = b || 1,
                c = Vec3.sub(a, this.coll.pos, d),
                h = Vec3.length(c) / (this.speed *
                    b);
            this.grab = {
                pos: Vec3.create(a),
                oldPos: Vec3.create(this.coll.pos),
                timer: new ig.WeightTimer(false, h, ig.TIMER_MODE.ONCE),
                oldVel: Vec3.create(this.coll.vel)
            };
            Vec3.assign(this.coll.vel, c);
            Vec3.length(this.coll.vel, 5);
            return h
        },
        changeSpeed: function(a, b) {
            this.speed = this.speed * a;
            this.coll.maxVel = this.speed;
            Vec2.length(this.coll.vel, this.speed);
            this.timer = this.timer / a;
            this.maxTime = this.maxTime / a;
            if (b) this.speedFactor = this.speedFactor * a
        },
        resetSpeed: function() {
            if (this.speedFactor != 1) {
                this.changeSpeed(1 / this.speedFactor);
                this.speedFactor = 1;
                return true
            }
            return false
        },
        changeDirection: function(a) {
            Vec2.assign(this.coll.vel, a);
            Vec2.length(this.coll.vel, this.speed)
        },
        onBounce: function(a, b) {
            if (this.bounceProxySrc) this._spawnBounceProxy(a, b);
            else if (this.effects) {
                var c = this.effects.spawnFixed(this.effectKeys && this.effectKeys.bounce || "ballBounce", a.x, a.y, this.coll.pos.z, null, {
                    angle: Vec2.clockangle(b.blockDir)
                });
                c && this.coll.time.parent && c.setTimeEntity(this.coll.time.parent.entity)
            }
        },
        destroy: function() {
            this.onProjectileKill(ig.PROJECTILE_KILL_TYPE.OTHER);
            this.kill()
        },
        _spawnBounceProxy: function(a, c) {
            var d = this.getCombatant(),
                h = sc.ProxyTools.getProxy(this.bounceProxySrc, d);
            if (h) {
                Vec2.assign(b, c.blockDir);
                Vec2.flip(b);
                h.spawn(a.x, a.y, this.coll.pos.z, d, b)
            }
        },
        onProjectileKill: function(a, b, c) {
            if (this.destroyProxySrc) {
                var h = this.getCombatant();
                if (b = sc.ProxyTools.getProxy(this.destroyProxySrc, h)) {
                    c = this.coll.vel;
                    a = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, d);
                    b.spawn(a.x, a.y, a.z, h, c)
                }
            } else if (b && this.bounceProxySrc) this._spawnBounceProxy(b, c);
            else if (a != ig.PROJECTILE_KILL_TYPE.OTHER &&
                this.effects) {
                if (a == ig.PROJECTILE_KILL_TYPE.WALL) {
                    a = this.effectKeys && this.effectKeys.wall || "ballWallKill";
                    this.effects.hasEffect(a) && (h = this.effects.spawnFixed(a, b.x, b.y, this.coll.pos.z, null, {
                        angle: Vec2.clockangle(c.blockDir)
                    }))
                } else {
                    b = this.getCenter();
                    a = this.effectKeys && this.effectKeys.air || "ballAirKill";
                    this.effects.hasEffect(a) && (h = this.effects.spawnFixed(a, b.x, b.y, this.coll.pos.z))
                }
                h && this.coll.time.parent && h.setTimeEntity(this.coll.time.parent.entity)
            }
        },
        onProjectileHit: function(a, b) {
            var c = false;
            if (!this.attackInfo || !this.attackInfo.hasNoEffect()) {
                if (a.ballHit) {
                    var d = a.ballHit(this, b);
                    (c = d) && !this.multiHit && this.destroy();
                    if (a.coll.type == ig.COLLTYPE.IGNORE && this.multiHit) this.skipBounce = true
                }
                if (this.attackInfo && a.damage && a.party != this.party) {
                    d = this.attackInfo;
                    this.party == sc.COMBATANT_PARTY.ENEMY && (c = true);
                    for (var i = 0; i < this.timeBoni.length && this.timeBoni[i].time > this.timer;) ++i;
                    if (i < this.timeBoni.length) d = this.timeBoni[i].attackInfo;
                    if (a.damage(this, d)) {
                        c = true;
                        this.multiHit || this.destroy()
                    }
                }
            }
            c &&
                this.combatant.getCombatantRoot().isPlayer && sc.stats.addMap("player", "throwHits", 1);
            return c
        },
        update: function() {
            if (this.grab) {
                this.grab.timer.tick();
                var a = this.grab.timer.get();
                Vec3.lerp(this.grab.oldPos, this.grab.pos, a, d);
                this.coll.setPos(d.x, d.y, d.z);
                if (this.grab.timer.done()) {
                    Vec3.assign(this.coll.vel, this.grab.oldVel);
                    this.grab = null
                }
            } else if (this.behaviors)
                for (a = this.behaviors.length; a--;) this.behaviors[a].onUpdate(this);
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
        getElement: function() {
            return this.attackInfo && this.attackInfo.element || sc.ELEMENT.NEUTRAL
        },
        getHitVel: function(a, b) {
            var d = b || {};
            this.grab ? Vec2.assign(d, this.grab.oldVel) : Vec2.assign(d, this.coll.vel);
            if (this.hitSideways) {
                Vec2.rotate90CW(d);
                var h = ig.CollTools.getDistVec2(this.coll, a.coll, c);
                Vec2.addMulF(h, a.coll.vel, -ig.system.tick);
                Vec2.dot(h, d) < 0 && Vec2.flip(d)
            }
            return d
        },
        resetBounceCount: function() {
            this.remainingHits = this.maxHits
        },
        resetTime: function(a) {
            this.timer = a || this.maxTime
        },
        cleanDirection: function(a) {
            Vec2.round(this.coll.vel, Math.PI * 2 * a)
        }
    });
    var c = Vec2.create()
});
ig.baked = !0;
