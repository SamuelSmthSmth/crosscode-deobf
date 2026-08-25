ig.module("game.feature.combat.entities.stone").requires("game.feature.combat.entities.projectile", "game.feature.combat.model.proxy", "game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity", "impact.feature.light.light").defines(function() {
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
        init: function(a) {
            this.data = a;
            a.animation.shapeType || (a.animation.shapeType = "YZ_EXPAND");
            a.animation.wallY =
                1;
            a.animation = new ig.AnimationSheet(a.animation);
            a.effects && (a.effects = new ig.EffectSheet(a.effects))
        },
        getSize: function(a) {
            this.data.size ? Vec3.assign(a, this.data.size) : Vec3.assignC(a, 8, 8, 8);
            return a
        },
        clearCached: function() {
            this.data.effects && this.data.effects.decreaseRef();
            this.data.animation && this.data.animation.clearCached()
        },
        spawn: function(a, b, c, e, f) {
            f = {
                dir: f,
                stoneInfo: this.data,
                params: e.getCombatantRoot().params,
                party: e.party,
                combatant: e
            };
            e.getCombatantRoot().isPlayer && sc.stats.addMap("player",
                "throws", 1);
            return ig.game.spawnEntity(ig.ENTITY.Stone, a, b, c, f)
        }
    });
    Vec2.create();
    var b = Vec3.create();
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, {
                vel: e.dir,
                combatant: e.combatant
            });
            this.party = e.party;
            this.params = e.params;
            this.setStoneInfo(e.stoneInfo);
            this.coll.zGravityFactor =
                1
        },
        setStoneInfo: function(a) {
            var d = this.coll,
                c = ig.Event.getNumberVary(a.speed),
                e = ig.Event.getNumberVary(a.zVel);
            Vec2.length(d.vel, c);
            d.vel.z = e;
            d.maxVel = c;
            d.shadow.size = a.shadow || 16;
            d.zBounciness = a.zBounciness || 0;
            c = a.size;
            e = Vec3.assign(b, d.size);
            c ? d.setSize(c.x, c.y, c.z) : d.setSize(8, 8, 8);
            d.setPos(d.pos.x - (this.coll.size.x - e.x) / 2, d.pos.y - (this.coll.size.y - e.y) / 2, d.pos.z);
            this.coll.type = ig.COLLTYPE.PROJECTILE;
            this.coll.setSize(8, 8, 8);
            if (this.combatant) this.target = this.combatant.target;
            this.behaviors = a.behaviors ||
                null;
            this.animSheet = a.animation;
            this.initAnimations(a.animation);
            this.effects = a.effects;
            this.effectKeys = a.effectKeys || null;
            this.multiHit = a.multiHit || false;
            this.remainingHits = a.maxBounce;
            this.remainingGroundHits = a.groundBounce;
            if (a.attack) this.attackInfo = new sc.AttackInfo(this.params, a.attack, true);
            ig.EffectTools.clearEffects(this, "trail");
            d = this.effectKeys && this.effectKeys.trail || "stoneTrail";
            this.effects && this.effects.hasEffect(d) && this.effects.spawnOnTarget(d, this, {
                duration: -1,
                group: "trail"
            });
            this.lightHandle &&
                this.lightHandle.stop();
            this.lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE[a.light || "XS"], 0, 0.2, -1, 1, !a.noLightGlow);
            ig.light.addLightHandle(this.lightHandle)
        },
        onBounce: function(a, b) {
            this.effects && this.effects.spawnFixed(this.effectKeys && this.effectKeys.wallBounce || "stoneWallBounce", a.x, a.y, this.coll.pos.z, null, {
                angle: Vec2.clockangle(b.blockDir)
            })
        },
        onProjectileKill: function() {
            if (this.effects) {
                var a = this.effectKeys && this.effectKeys.kill || "stoneKill";
                if (this.effects.hasEffect(a)) {
                    var b = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER);
                    this.effects.spawnFixed(a, b.x, b.y, b.z, null)
                }
            }
        },
        onProjectileHit: function(a) {
            var b = false;
            if (this.attackInfo && a.damage && a.party != this.party) {
                var c = this.attackInfo,
                    b = true;
                if (a.damage(this, c) && !this.multiHit) {
                    this.onProjectileKill();
                    this.kill()
                }
            }
            b && this.combatant.isPlayer && sc.stats.addMap("player", "throwHits", 1);
            return b
        },
        onTouchGround: function() {
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
        getElement: function() {
            return this.attackInfo &&
                this.attackInfo.element || sc.ELEMENT.NEUTRAL
        }
    })
});
ig.baked = !0;
