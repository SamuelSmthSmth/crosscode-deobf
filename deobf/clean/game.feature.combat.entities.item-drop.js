/**
 * game.feature.combat.entities.item-drop
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.item-drop")`.
 *
 * `sc.ItemDropEntity`: a dropped item that bounces on the ground then flies
 * to the player (or pre-collects). Defines `sc.ITEM_DROP_TYPE`, its spawn
 * helpers (`spawnDrops`, `spawnGenericDrops`), rarity icons/glow animations,
 * and collect/catch sounds.
 */
ig.module("game.feature.combat.entities.item-drop")
    .requires("impact.feature.effect.effect-sheet", "impact.base.entity")
    .defines(function () {

    var iconMap = {
        "item-default": 0,
        "item-helm": 1,
        "item-sword": 2,
        "item-belt": 3,
        "item-shoe": 4,
        "item-items": 5,
        "item-key": 6,
        "item-trade": 7
    };

    sc.ITEM_DROP_TYPE = {
        ENEMY: {},
        PROP: {},
        EVENT_PROP: {
            preCollect: true
        },
        CHEST: {
            fly: true,
            preCollect: true
        }
    };

    var areaItemKeys = {
        DUNGEON_KEY: 0,
        DUNGEON_MASTER_KEY: 1
    };

    sc.ItemDropEntity = ig.AnimatedEntity.extend({
        gfx: new ig.Image("media/entity/enemy/item-drops.png"),
        effects: new ig.EffectSheet("marble"),
        sounds: {
            start: new ig.Sound("media/sound/drops/drop-start.ogg", 0.9),
            "catch": new ig.Sound("media/sound/drops/drop-catch.ogg", 0.6),
            catchLow: new ig.Sound("media/sound/drops/drop-low-white.ogg", 1),
            catchNormal: new ig.Sound("media/sound/drops/drop-normal-bronze.ogg", 1),
            catchRare: new ig.Sound("media/sound/drops/drop-rare-silver.ogg", 1),
            catchLegendary: new ig.Sound("media/sound/drops/drop-legendary-gold.ogg", 1),
            catchUnique: new ig.Sound("media/sound/drops/drop-unique-purple.ogg", 1)
        },

        flying: false,
        target: null,
        timer: 0,
        startPos: Vec2.create(),
        startZPos: 0,
        maxTime: 0,
        maxHeight: 0,
        item: 0,
        amount: 0,
        collected: false,
        dropType: null,
        fromCombatant: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.dropType = settings.dropType || sc.ITEM_DROP_TYPE.ENEMY;
            this.coll.setType(ig.COLLTYPE.IGNORE);
            this.coll.setSize(16, 4, 12);
            this.coll.shadow.size = 8;
            this.coll.zBounciness = 1;
            this.coll.bounciness = 0;
            this.coll.maxVel = 250;
            this.coll.friction.ground = 0.1;
            this.coll.friction.air = 0.1;
            this.coll.accelSpeed = 2;
            this.coll.zGravityFactor = 0.6;
            if (this.dropType.fly) {
                this.coll.float.height = 24;
                this.coll.float.variance = 4
            }
            settings.vel && Vec2.assign(this.coll.vel, settings.vel);
            this.coll.vel.z = 80 + Math.random() * 50;
            this.target = settings.target;
            this.item = settings.item;
            this.amount = settings.amount;

            var itemData = sc.inventory.getItem(this.item),
                rarity = itemData.rarity,
                icon = iconMap[itemData.icon] || 0,
                areaItemKey = void 0,
                areaItemType;
            (areaItemType = sc.map.getAreaItemType(this.item)) && (areaItemKey = areaItemKeys[areaItemType]);

            areaItemKey === void 0 ? this.initAnimations({
                namedSheets: {
                    icons: {
                        src: "media/entity/enemy/item-drops.png",
                        width: 16,
                        height: 16,
                        xCount: 8
                    },
                    rotation: {
                        src: "media/entity/enemy/item-drops.png",
                        width: 16,
                        height: 16,
                        offY: 96
                    }
                },
                time: 0.03,
                repeat: true,
                SUB: [{
                    name: "default",
                    sheet: "icons",
                    frames: [icon],
                    tileOffset: 8 * rarity
                }, {
                    name: "rotStart",
                    sheet: "rotation",
                    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9],
                    repeat: false,
                    tileOffset: 10 * rarity
                }, {
                    name: "rotating",
                    sheet: "rotation",
                    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    tileOffset: 10 * rarity
                }]
            }) : this.initAnimations({
                namedSheets: {
                    icons: {
                        src: "media/entity/enemy/item-drops.png",
                        width: 16,
                        height: 24,
                        offY: 192
                    },
                    glow: {
                        src: "media/entity/enemy/item-drops.png",
                        width: 16,
                        height: 16,
                        offY: 192,
                        offX: 96
                    }
                },
                time: 0.03,
                repeat: true,
                shapeType: "Y_FLAT",
                SUB: [{
                    name: "default",
                    sheet: "icons",
                    frames: [areaItemKey]
                }, {
                    name: "rotStart",
                    sheet: "icons",
                    frames: [areaItemKey]
                }, {
                    name: "preRotating",
                    sheet: "glow",
                    frames: [0],
                    time: 0.1
                }, {
                    name: "rotating",
                    sheet: "glow",
                    frames: [1, 2, 3, 2]
                }]
            });

            if (this.dropType.fly) {
                this.setCurrentAnim("default");
                this.effects.spawnOnTarget("itemAppear", this)
            } else this.setCurrentAnim("rotStart", true, "default", true);

            var lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.XS, 0, 0, -1, 1);
            ig.light.addLightHandle(lightHandle);
            this.timer = 0;
            this.dropType.fly || ig.SoundHelper.playAtEntity(this.sounds.start, this)
        },

        collectItem: function (source) {
            if (!this.collected) {
                this.collected = true;
                sc.model.player.addItem(this.item, this.amount, false, source);
                this.dropType != sc.ITEM_DROP_TYPE.CHEST && sc.stats.addMap("items", "dropsTotal", this.amount);
                this.dropType == sc.ITEM_DROP_TYPE.PROP ? sc.stats.addMap("items", "dropsProps", this.amount) : this.dropType == sc.ITEM_DROP_TYPE.ENEMY && sc.stats.addMap("items", "dropsEnemies", this.amount)
            }
        },

        onKill: function (data) {
            this.collectItem();
            var rarity = sc.inventory.getItem(this.item).rarity;
            rarity == sc.ITEMS_RARITY.LOW ? ig.SoundHelper.playAtEntity(this.sounds.catchLow, ig.game.playerEntity) : rarity == sc.ITEMS_RARITY.NORMAL ? ig.SoundHelper.playAtEntity(this.sounds.catchNormal, ig.game.playerEntity) : rarity == sc.ITEMS_RARITY.RARE ? ig.SoundHelper.playAtEntity(this.sounds.catchRare, ig.game.playerEntity) : rarity == sc.ITEMS_RARITY.LEGENDARY ? ig.SoundHelper.playAtEntity(this.sounds.catchLegendary, ig.game.playerEntity) : rarity == sc.ITEMS_RARITY.UNIQUE ? ig.SoundHelper.playAtEntity(this.sounds.catchUnique, ig.game.playerEntity) : rarity == sc.ITEMS_RARITY.BACKER && ig.SoundHelper.playAtEntity(this.sounds.catchUnique, ig.game.playerEntity);
            this.parent(data)
        },

        onSave: function () {
            this.collectItem()
        },

        update: function () {
            this.timer = this.timer + ig.system.tick;
            this.dropType.preCollect && this.timer >= 0.2 && this.collectItem(true);
            if (this.flying) {
                var progress = Math.min(1, this.timer / this.maxTime),
                    arc = 1 - (2 * progress - 1) * (2 * progress - 1),
                    targetCenter = this.target.getCenter();
                this.coll.setPos(this.startPos.x * (1 - progress) + (targetCenter.x - this.coll.size.x / 2) * progress, this.startPos.y * (1 - progress) + (targetCenter.y - this.coll.size.y / 2) * progress, this.startZPos * (1 - progress) + (this.target.coll.pos.z + this.target.coll.size.z + 1) * progress + arc * this.maxHeight);
                this.coll.baseZPos = 0;
                this.timer >= this.maxTime && this.kill()
            } else if (this.coll.pos.z < ig.game.minLevelZ) this.startRegularFly();
            else {
                var distance = Vec2.length(Vec2.sub(this.target.getCenter(), this.coll.pos)),
                    waitTime = this.dropType.fly ? 1 : 0.7;
                (this.dropType.fly || distance < 48) && this.timer > waitTime && this.startFlying(0.4, 12)
            }
            this.parent()
        },

        onTouchGround: function () {
            if (!this.flying) {
                if (this.coll.vel.z < 100) this.coll.vel.z = 100;
                this.timer > 1.3 && this.startRegularFly()
            }
        },

        startRegularFly: function () {
            var time;
            time = 0.5 + (Vec2.length(Vec2.sub(this.target.getCenter(), this.coll.pos)) / 200).limit(0, 1) * 0.5;
            this.startFlying(time, time * 120)
        },

        startFlying: function (maxTime, maxHeight) {
            this.maxTime = maxTime;
            this.maxHeight = maxHeight;
            this.setCurrentAnim("preRotating", true, "rotating");
            this.flying = true;
            Vec2.assign(this.startPos, this.coll.pos);
            this.startZPos = this.coll.pos.z;
            this.timer = 0;
            this.effects.spawnOnTarget("line", this, {
                duration: -1
            })
        }
    });

    var posScratch = Vec3.create();

    sc.ItemDropEntity.spawnDrops = function (entity, align, target, item, amount, dropType) {
        dropType = dropType || sc.ITEM_DROP_TYPE.ENEMY;
        var pos = entity.getAlignedPos(align, posScratch);
        var vel = Vec2.create();
        var settings = {
            target: target,
            item: item,
            amount: 1,
            dropType: dropType,
            vel: vel
        };
        if (amount == 1) {
            if (!dropType.fly) {
                Vec2.assignC(vel, 0, 40);
                Vec2.rotate(vel, Math.random() * Math.PI * 2)
            }
            ig.game.spawnEntity(sc.ItemDropEntity, pos.x - 8, pos.y - 2, pos.z, settings)
        } else {
            var count = amount;
            for (Vec2.assignC(vel, dropType.fly ? 20 : 40, 0); count--;) {
                ig.game.spawnEntity(sc.ItemDropEntity, pos.x - 8, pos.y - 2, pos.z, settings);
                Vec2.rotate(vel, Math.PI * 2 * (1 / amount) * (0.8 + Math.random() * 0.4))
            }
        }
    }
});
ig.baked = !0;
