ig.module("game.feature.combat.entities.item-drop").requires("impact.feature.effect.effect-sheet", "impact.base.entity").defines(function() {
    var b = {
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
    var a = {
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
            catchUnique: new ig.Sound("media/sound/drops/drop-unique-purple.ogg",
                1)
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
        init: function(c, d, f, g) {
            this.parent(c, d, f, g);
            this.dropType = g.dropType || sc.ITEM_DROP_TYPE.ENEMY;
            this.coll.setType(ig.COLLTYPE.IGNORE);
            this.coll.setSize(16, 4, 12);
            this.coll.shadow.size = 8;
            this.coll.zBounciness = 1;
            this.coll.bounciness = 0;
            this.coll.maxVel = 250;
            this.coll.friction.ground = 0.1;
            this.coll.friction.air = 0.1;
            this.coll.accelSpeed = 2;
            this.coll.zGravityFactor =
                0.6;
            if (this.dropType.fly) {
                this.coll.float.height = 24;
                this.coll.float.variance = 4
            }
            g.vel && Vec2.assign(this.coll.vel, g.vel);
            this.coll.vel.z = 80 + Math.random() * 50;
            this.target = g.target;
            this.item = g.item;
            this.amount = g.amount;
            d = sc.inventory.getItem(this.item);
            c = d.rarity;
            d = b[d.icon] || 0;
            f = void 0;
            (g = sc.map.getAreaItemType(this.item)) && (f = a[g]);
            f === void 0 ? this.initAnimations({
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
                    frames: [d],
                    tileOffset: 8 * c
                }, {
                    name: "rotStart",
                    sheet: "rotation",
                    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9],
                    repeat: false,
                    tileOffset: 10 * c
                }, {
                    name: "rotating",
                    sheet: "rotation",
                    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    tileOffset: 10 * c
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
                    frames: [f]
                }, {
                    name: "rotStart",
                    sheet: "icons",
                    frames: [f]
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
            c = new ig.LightHandle(this, ig.LIGHT_SIZE.XS, 0, 0, -1, 1);
            ig.light.addLightHandle(c);
            this.timer = 0;
            this.dropType.fly || ig.SoundHelper.playAtEntity(this.sounds.start,
                this)
        },
        collectItem: function(a) {
            if (!this.collected) {
                this.collected = true;
                sc.model.player.addItem(this.item, this.amount, false, a);
                this.dropType != sc.ITEM_DROP_TYPE.CHEST && sc.stats.addMap("items", "dropsTotal", this.amount);
                this.dropType == sc.ITEM_DROP_TYPE.PROP ? sc.stats.addMap("items", "dropsProps", this.amount) : this.dropType == sc.ITEM_DROP_TYPE.ENEMY && sc.stats.addMap("items", "dropsEnemies", this.amount)
            }
        },
        onKill: function(a) {
            this.collectItem();
            var b = sc.inventory.getItem(this.item).rarity;
            b == sc.ITEMS_RARITY.LOW ?
                ig.SoundHelper.playAtEntity(this.sounds.catchLow, ig.game.playerEntity) : b == sc.ITEMS_RARITY.NORMAL ? ig.SoundHelper.playAtEntity(this.sounds.catchNormal, ig.game.playerEntity) : b == sc.ITEMS_RARITY.RARE ? ig.SoundHelper.playAtEntity(this.sounds.catchRare, ig.game.playerEntity) : b == sc.ITEMS_RARITY.LEGENDARY ? ig.SoundHelper.playAtEntity(this.sounds.catchLegendary, ig.game.playerEntity) : b == sc.ITEMS_RARITY.UNIQUE ? ig.SoundHelper.playAtEntity(this.sounds.catchUnique, ig.game.playerEntity) : b == sc.ITEMS_RARITY.BACKER && ig.SoundHelper.playAtEntity(this.sounds.catchUnique,
                    ig.game.playerEntity);
            this.parent(a)
        },
        onSave: function() {
            this.collectItem()
        },
        update: function() {
            this.timer = this.timer + ig.system.tick;
            this.dropType.preCollect && this.timer >= 0.2 && this.collectItem(true);
            if (this.flying) {
                var a = Math.min(1, this.timer / this.maxTime),
                    b = 1 - (2 * a - 1) * (2 * a - 1),
                    d = this.target.getCenter();
                this.coll.setPos(this.startPos.x * (1 - a) + (d.x - this.coll.size.x / 2) * a, this.startPos.y * (1 - a) + (d.y - this.coll.size.y / 2) * a, this.startZPos * (1 - a) + (this.target.coll.pos.z + this.target.coll.size.z + 1) * a + b * this.maxHeight);
                this.coll.baseZPos = 0;
                this.timer >= this.maxTime && this.kill()
            } else if (this.coll.pos.z < ig.game.minLevelZ) this.startRegularFly();
            else {
                a = Vec2.length(Vec2.sub(this.target.getCenter(), this.coll.pos));
                b = this.dropType.fly ? 1 : 0.7;
                (this.dropType.fly || a < 48) && this.timer > b && this.startFlying(0.4, 12)
            }
            this.parent()
        },
        onTouchGround: function() {
            if (!this.flying) {
                if (this.coll.vel.z < 100) this.coll.vel.z = 100;
                this.timer > 1.3 && this.startRegularFly()
            }
        },
        startRegularFly: function() {
            var a;
            a = 0.5 + (Vec2.length(Vec2.sub(this.target.getCenter(),
                this.coll.pos)) / 200).limit(0, 1) * 0.5;
            this.startFlying(a, a * 120)
        },
        startFlying: function(a, b) {
            this.maxTime = a;
            this.maxHeight = b;
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
    var d = Vec3.create();
    sc.ItemDropEntity.spawnDrops = function(a, b, f, g, h, i) {
        i = i || sc.ITEM_DROP_TYPE.ENEMY;
        a = a.getAlignedPos(b, d);
        b = Vec2.create();
        f = {
            target: f,
            item: g,
            amount: 1,
            dropType: i,
            vel: b
        };
        if (h == 1) {
            if (!i.fly) {
                Vec2.assignC(b, 0, 40);
                Vec2.rotate(b, Math.random() * Math.PI * 2)
            }
            ig.game.spawnEntity(sc.ItemDropEntity, a.x - 8, a.y - 2, a.z, f)
        } else {
            g = h;
            for (Vec2.assignC(b, i.fly ? 20 : 40, 0); g--;) {
                ig.game.spawnEntity(sc.ItemDropEntity, a.x - 8, a.y - 2, a.z, f);
                Vec2.rotate(b, Math.PI * 2 * (1 / h) * (0.8 + Math.random() * 0.4))
            }
        }
    }
});
ig.baked = !0;
