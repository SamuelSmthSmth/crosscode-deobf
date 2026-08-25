ig.module("game.feature.combat.entities.drop").requires("impact.feature.effect.effect-sheet", "impact.base.entity").defines(function() {
    var b = Vec3.create();
    sc.DROP_TYPE = {
        HP: 1,
        SP: 2,
        ITEM: 3,
        COIN: 4
    };
    Vec2.create();
    sc.DropEntity = ig.AnimatedEntity.extend({
        effects: new ig.EffectSheet("drops"),
        animSheet: new ig.AnimationSheet({
            namedSheets: {
                small: {
                    src: "media/entity/enemy/drops.png",
                    width: 8,
                    height: 8
                },
                medium: {
                    src: "media/entity/enemy/drops.png",
                    width: 8,
                    height: 8,
                    offX: 48
                },
                big: {
                    src: "media/entity/enemy/drops.png",
                    width: 16,
                    height: 16,
                    offY: 8
                },
                coin: {
                    src: "media/entity/enemy/drops.png",
                    width: 8,
                    height: 8,
                    offX: 96
                }
            },
            time: 0.03,
            repeat: true,
            SUB: [{
                name: "healSmall",
                sheet: "small",
                frames: [0, 1, 2, 3, 4, 5]
            }, {
                name: "healMedium",
                sheet: "medium",
                frames: [0, 1, 2, 3, 4, 5]
            }, {
                name: "healBig",
                sheet: "big",
                frames: [0, 1, 2, 3, 4, 5]
            }, {
                name: "coin",
                sheet: "coin",
                frames: [0, 1, 2, 3, 2, 1]
            }, {
                name: "coinFlip",
                sheet: "coin",
                frames: [0, 1, 2, 3]
            }]
        }),
        timer: 0,
        fallTimer: 1,
        target: null,
        dropType: 0,
        effectValue: 0,
        varIncrease: null,
        circleEffect: null,
        pickupEffect: null,
        isGeneric: false,
        init: function(a,
            b, e, f) {
            this.parent(a, b, e, f);
            this.coll.setType(ig.COLLTYPE.IGNORE);
            this.coll.setSize(8, 8, 8);
            this.coll.shadow.size = 8;
            this.coll.zBounciness = 1;
            this.coll.bounciness = 0;
            this.coll.maxVel = 250;
            this.coll.friction.ground = 0.1;
            this.coll.friction.air = 0.1;
            this.coll.accelSpeed = 2;
            this.coll.zGravityFactor = 0.6;
            Vec2.assignC(this.coll.vel, 0, 40);
            Vec2.rotate(this.coll.vel, Math.random() * Math.PI * 2);
            this.coll.vel.z = 150 + Math.random() * 70;
            this.dropType = sc.DROP_TYPE[f.dropType] || sc.DROP_TYPE.HP;
            this.effectValue = f.value;
            this.varIncrease =
                f.varIncrease;
            this.isGeneric = f.isGeneric;
            this.circleEffect = f.circleEffect;
            this.pickupEffect = f.pickupEffect;
            this.timer = 11;
            this.isGeneric ? this.dropType == sc.DROP_TYPE.COIN && this.setCurrentAnim("coin") : this.effectValue >= 0.5 ? this.setCurrentAnim("healBig") : this.effectValue >= 0.2 ? this.setCurrentAnim("healMedium") : this.setCurrentAnim("healSmall");
            a = new ig.LightHandle(this, ig.LIGHT_SIZE.XS, 0, 0, -1, 1);
            ig.light.addLightHandle(a);
            f.target && this.followTarget(f.target)
        },
        update: function() {
            if (this.target || !sc.model.isCutscene()) {
                this.timer =
                    this.timer - ig.system.tick;
                if (this.target) {
                    var a = this.target.coll.pos.z + 12 - this.coll.pos.z;
                    this.coll.float.height = this.target.coll.pos.z + 12 - this.coll.baseZPos;
                    ig.CollTools.getDistVec2(this.coll, this.target.coll, this.coll.accelDir);
                    if (Vec2.length(this.coll.accelDir) < 16) Math.abs(a) < 16 || this.fallTimer <= 0 ? this.isGeneric ? this.doGenericPickUp(this.target) : this.doHeal(this.target) : this.fallTimer = this.fallTimer - ig.system.tick
                } else this.timer <= 10.4 && !this.target && this.findTarget();
                if (!this.varIncrease) {
                    if (this.timer <=
                        0.4) this.animState.alpha = this.timer / 0.4;
                    this.timer <= 0 && this.kill()
                }
            }
            this.parent()
        },
        doGenericPickUp: function(a) {
            this.pickupEffect && this.effects.spawnOnTarget(this.pickupEffect, a);
            this.varIncrease && ig.vars.add(this.varIncrease, 1);
            a = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, b);
            this.effects.spawnFixed(this.circleEffect || "circle", a.x, a.y, a.z);
            this.kill()
        },
        doHeal: function(a) {
            this.effects.spawnOnTarget("circle", this);
            this.effects.spawnOnTarget("healing", a);
            a.heal(new sc.HealInfo(null, {
                value: this.effectValue
            }));
            a = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, b);
            this.effects.spawnFixed("circle", a.x, a.y, a.z);
            this.kill()
        },
        followTarget: function(a) {
            if (this.timer < 2) this.timer = 2;
            this.target = a;
            this.coll.setType(ig.COLLTYPE.NONE);
            this.coll.float.variance = 3;
            this.coll.float.maxSpeed = 1E3;
            this.coll.float.accel = 12;
            this.coll.friction.air = 0.4;
            this.effects.spawnOnTarget("line", this, {
                duration: -1
            });
            this.effects.spawnOnTarget(this.circleEffect || "circle", this)
        },
        findTarget: function() {
            ig.game.playerEntity && ig.game.playerEntity.distanceTo(this) <
                120 && this.followTarget(ig.game.playerEntity)
        },
        onTouchGround: function() {
            if (this.coll.vel.z < 80) this.coll.vel.z = 80
        }
    });
    var a = Vec3.create();
    sc.DropEntity.spawnDrops = function(b, c, e, f, g, h) {
        e = {
            dropType: e,
            value: 0,
            target: g,
            varIncrease: h
        };
        for (b = b.getAlignedPos(c, a); f > ig.COLLISION.EPS;) {
            c = f >= 0.6 ? 0.5 : f >= 0.2 ? 0.2 : Math.min(0.1, f);
            e.value = c;
            ig.game.spawnEntity(sc.DropEntity, b.x, b.y, b.z, e);
            f = f - c
        }
    };
    sc.DropEntity.spawnGenericDrops = function(b, c, e) {
        c = {
            dropType: e.type,
            value: 1,
            target: c,
            varIncrease: e.varIncrease,
            circleEffect: e.circleEffect,
            pickupEffect: e.pickupEffect,
            isGeneric: true
        };
        b = b.getAlignedPos(e.align, a);
        for (e = ~~(Math.random() * (e.max - e.min + 1)) + e.min; e > 0;) {
            c.value = 1;
            ig.game.spawnEntity(sc.DropEntity, b.x, b.y, b.z, c);
            e--
        }
    }
});
ig.baked = !0;
