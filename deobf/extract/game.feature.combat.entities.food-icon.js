ig.module("game.feature.combat.entities.food-icon").requires("impact.base.entity", "impact.base.entity-pool").defines(function() {
    sc.FOOD_ICON_STATE = {
        HOLD: 0,
        BUBBLE: 1,
        DONE: 2
    };
    var b = ["SANDWICH", "GREEN_TEA", "CROISSANT", "BAGUETTE", "RED_WINE", "ICE_CREAM_S", "ICE_CREAM_M", "ICE_CREAM_L", "WATER", "SPICY_BUN", "FRUIT_SALAT", "RICE_CRACKER", "VEGGIE_STICKS", "STEAK", "SALTY_ICE_CREAM", "CHILLI", "CHILLI_DOG", "COLD_PLATE", "LEMONADE", "PEANUTS", "HOT_SAUCE", "PISTACHIO", "ESPRESSO", "COFFEE", "KEBAB", "KEBAB2", "KEBAB3", "RISOTTO",
        "BEAR_BEER", "GRAB_MEAD", "FOX_SAKE", "WHALE_WINE", "ONE_UP", "BURGER", "SUSHI", "SUSHIBURGER", "RISING_STAR", "DK_PEPPER", "SPAETZLE", "MAULTASCHE", "DURIAN", "PENGO_POP", "BEAT_ZERO", "WEREWOLF_STICK", "MOONCAKE", "GUACAMOLE_TOAST", "WILLI_BUN", "PUMPKIN_SPICE"
    ];
    sc.FOOD_SPRITE = {};
    for (var a = 0; a < b.length; ++a) sc.FOOD_SPRITE[b[a]] = a;
    Vec3.create();
    var d = {};
    sc.FoodIconEntity = ig.Entity.extend({
        icon: 0,
        combatant: null,
        offset: Vec2.create(),
        state: sc.FOOD_ICON_STATE.HOLD,
        foodSheet: new ig.TileSheet("media/entity/player/item-hold.png",
            16, 16, 0, 0),
        bubbleGfx: new ig.Image("media/entity/map-gui/hit-numbers.png"),
        timer: 0,
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.friction.ground = 0;
            this.coll.time.globalStatic = true;
            this.coll.setSize(0, 0, 0);
            this.icon = g.icon;
            this.combatant = g.combatant;
            this.combatant.addActionAttached(this);
            this.timer = 0.1
        },
        initSprites: function() {
            this.setSpriteCount(this.digitCount, true)
        },
        deferredUpdate: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <=
                    0) {
                    this.timer = 0;
                    if (this.state == sc.FOOD_ICON_STATE.DONE) {
                        this.combatant.removeActionAttached(this);
                        this.kill()
                    }
                }
            }
            if (this.combatant) {
                var a = this.combatant.coll;
                this.setPos(a.pos.x + a.size.x / 2, a.pos.y + a.size.y, a.pos.z)
            }
        },
        setState: function(a, b) {
            this.state = a;
            b ? Vec2.assign(this.offset, b) : Vec2.assignC(this.offset, 0, 0);
            this.setSpriteCount(0);
            this.timer = 0.1
        },
        onActionEndDetach: function() {
            this.kill()
        },
        updateSprites: function() {
            var a = this.timer / 0.1;
            this.state != sc.FOOD_ICON_STATE.DONE && (a = 1 - a);
            var b, f = 0,
                g = 0;
            if (this.state !=
                sc.FOOD_ICON_STATE.HOLD) {
                this.setSpriteCount(2, true);
                b = this.sprites[0];
                b.setPos(this.coll.pos.x - 12 + this.offset.x, this.coll.pos.y + 2, this.coll.pos.z + 28 + 2 + this.offset.y);
                b.setSize(24, 0, 32);
                b.setPivot(12, 16);
                b.setImageSrc(this.bubbleGfx, 0, 288);
                b.setAlpha(0.8);
                b.setTransform(a, a, 0);
                b = this.sprites[1];
                f = 0;
                g = 38
            } else {
                this.setSpriteCount(1);
                b = this.sprites[0];
                f = -10;
                g = 17
            }
            f = f + this.offset.x;
            g = g + this.offset.y;
            b.setPos(this.coll.pos.x + f - 8, this.coll.pos.y + 4, this.coll.pos.z + g + 4);
            b.setSize(16, 0, 16);
            b.setPivot(8, 8);
            f = this.foodSheet.getTileSrc(d, this.icon);
            b.setImageSrc(this.foodSheet.image, f.x, f.y);
            b.setTransform(a, a, 0)
        }
    })
});
ig.baked = !0;
