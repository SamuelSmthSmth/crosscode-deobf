/**
 * game.feature.combat.entities.drop
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.drop")`.
 *
 * `sc.DropEntity`: HP/SP/coin/item drops that pop out of enemies, fall to the
 * ground, and can home toward the player. `spawnDrops` splits a value into
 * heal-sized chunks; `spawnGenericDrops` spawns a randomized count.
 */
ig.module("game.feature.combat.entities.drop")
    .requires("impact.feature.effect.effect-sheet", "impact.base.entity")
    .defines(function () {

    var dropPosScratch = Vec3.create();

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
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
            this.dropType = sc.DROP_TYPE[settings.dropType] || sc.DROP_TYPE.HP;
            this.effectValue = settings.value;
            this.varIncrease = settings.varIncrease;
            this.isGeneric = settings.isGeneric;
            this.circleEffect = settings.circleEffect;
            this.pickupEffect = settings.pickupEffect;
            this.timer = 11;
            this.isGeneric ? this.dropType == sc.DROP_TYPE.COIN && this.setCurrentAnim("coin") : this.effectValue >= 0.5 ? this.setCurrentAnim("healBig") : this.effectValue >= 0.2 ? this.setCurrentAnim("healMedium") : this.setCurrentAnim("healSmall");
            var lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.XS, 0, 0, -1, 1);
            ig.light.addLightHandle(lightHandle);
            settings.target && this.followTarget(settings.target)
        },

        update: function () {
            if (this.target || !sc.model.isCutscene()) {
                this.timer = this.timer - ig.system.tick;
                if (this.target) {
                    var heightDiff = this.target.coll.pos.z + 12 - this.coll.pos.z;
                    this.coll.float.height = this.target.coll.pos.z + 12 - this.coll.baseZPos;
                    ig.CollTools.getDistVec2(this.coll, this.target.coll, this.coll.accelDir);
                    if (Vec2.length(this.coll.accelDir) < 16) Math.abs(heightDiff) < 16 || this.fallTimer <= 0 ? this.isGeneric ? this.doGenericPickUp(this.target) : this.doHeal(this.target) : this.fallTimer = this.fallTimer - ig.system.tick
                } else this.timer <= 10.4 && !this.target && this.findTarget();
                if (!this.varIncrease) {
                    if (this.timer <= 0.4) this.animState.alpha = this.timer / 0.4;
                    this.timer <= 0 && this.kill()
                }
            }
            this.parent()
        },

        doGenericPickUp: function (target) {
            this.pickupEffect && this.effects.spawnOnTarget(this.pickupEffect, target);
            this.varIncrease && ig.vars.add(this.varIncrease, 1);
            var pos = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, dropPosScratch);
            this.effects.spawnFixed(this.circleEffect || "circle", pos.x, pos.y, pos.z);
            this.kill()
        },

        doHeal: function (target) {
            this.effects.spawnOnTarget("circle", this);
            this.effects.spawnOnTarget("healing", target);
            target.heal(new sc.HealInfo(null, {
                value: this.effectValue
            }));
            var pos = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, dropPosScratch);
            this.effects.spawnFixed("circle", pos.x, pos.y, pos.z);
            this.kill()
        },

        followTarget: function (target) {
            if (this.timer < 2) this.timer = 2;
            this.target = target;
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

        findTarget: function () {
            ig.game.playerEntity && ig.game.playerEntity.distanceTo(this) < 120 && this.followTarget(ig.game.playerEntity)
        },

        onTouchGround: function () {
            if (this.coll.vel.z < 80) this.coll.vel.z = 80
        }
    });

    var spawnPosScratch = Vec3.create();

    sc.DropEntity.spawnDrops = function (entity, align, dropType, totalValue, target, varIncrease) {
        var settings = {
            dropType: dropType,
            value: 0,
            target: target,
            varIncrease: varIncrease
        };
        for (var pos = entity.getAlignedPos(align, spawnPosScratch); totalValue > ig.COLLISION.EPS;) {
            var chunk = totalValue >= 0.6 ? 0.5 : totalValue >= 0.2 ? 0.2 : Math.min(0.1, totalValue);
            settings.value = chunk;
            ig.game.spawnEntity(sc.DropEntity, pos.x, pos.y, pos.z, settings);
            totalValue = totalValue - chunk
        }
    };

    sc.DropEntity.spawnGenericDrops = function (entity, target, dropSettings) {
        var settings = {
            dropType: dropSettings.type,
            value: 1,
            target: target,
            varIncrease: dropSettings.varIncrease,
            circleEffect: dropSettings.circleEffect,
            pickupEffect: dropSettings.pickupEffect,
            isGeneric: true
        };
        var pos = entity.getAlignedPos(dropSettings.align, spawnPosScratch);
        for (var count = ~~(Math.random() * (dropSettings.max - dropSettings.min + 1)) + dropSettings.min; count > 0;) {
            settings.value = 1;
            ig.game.spawnEntity(sc.DropEntity, pos.x, pos.y, pos.z, settings);
            count--
        }
    }
});
ig.baked = !0;
