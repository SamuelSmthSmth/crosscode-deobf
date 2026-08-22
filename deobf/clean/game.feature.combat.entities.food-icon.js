/**
 * game.feature.combat.entities.food-icon
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.food-icon")`.
 *
 * `sc.FoodIconEntity`: the food item sprite shown above a combatant while it
 * eats — hold / bubble / done states, with the sprite fading in/out over a
 * short timer. `sc.FOOD_SPRITE` maps food ids to their item-hold tile index.
 */
ig.module("game.feature.combat.entities.food-icon")
    .requires("impact.base.entity", "impact.base.entity-pool")
    .defines(function () {

    sc.FOOD_ICON_STATE = {
        HOLD: 0,
        BUBBLE: 1,
        DONE: 2
    };

    var foodNames = ["SANDWICH", "GREEN_TEA", "CROISSANT", "BAGUETTE", "RED_WINE", "ICE_CREAM_S", "ICE_CREAM_M", "ICE_CREAM_L", "WATER", "SPICY_BUN", "FRUIT_SALAT", "RICE_CRACKER", "VEGGIE_STICKS", "STEAK", "SALTY_ICE_CREAM", "CHILLI", "CHILLI_DOG", "COLD_PLATE", "LEMONADE", "PEANUTS", "HOT_SAUCE", "PISTACHIO", "ESPRESSO", "COFFEE", "KEBAB", "KEBAB2", "KEBAB3", "RISOTTO",
        "BEAR_BEER", "GRAB_MEAD", "FOX_SAKE", "WHALE_WINE", "ONE_UP", "BURGER", "SUSHI", "SUSHIBURGER", "RISING_STAR", "DK_PEPPER", "SPAETZLE", "MAULTASCHE", "DURIAN", "PENGO_POP", "BEAT_ZERO", "WEREWOLF_STICK", "MOONCAKE", "GUACAMOLE_TOAST", "WILLI_BUN", "PUMPKIN_SPICE"
    ];

    sc.FOOD_SPRITE = {};
    for (var i = 0; i < foodNames.length; ++i) sc.FOOD_SPRITE[foodNames[i]] = i;

    Vec3.create();

    var tileSrc = {};

    sc.FoodIconEntity = ig.Entity.extend({
        icon: 0,
        combatant: null,
        offset: Vec2.create(),
        state: sc.FOOD_ICON_STATE.HOLD,
        foodSheet: new ig.TileSheet("media/entity/player/item-hold.png", 16, 16, 0, 0),
        bubbleGfx: new ig.Image("media/entity/map-gui/hit-numbers.png"),
        timer: 0,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.friction.ground = 0;
            this.coll.time.globalStatic = true;
            this.coll.setSize(0, 0, 0);
            this.icon = settings.icon;
            this.combatant = settings.combatant;
            this.combatant.addActionAttached(this);
            this.timer = 0.1
        },

        initSprites: function () {
            this.setSpriteCount(this.digitCount, true)
        },

        deferredUpdate: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    if (this.state == sc.FOOD_ICON_STATE.DONE) {
                        this.combatant.removeActionAttached(this);
                        this.kill()
                    }
                }
            }
            if (this.combatant) {
                var coll = this.combatant.coll;
                this.setPos(coll.pos.x + coll.size.x / 2, coll.pos.y + coll.size.y, coll.pos.z)
            }
        },

        setState: function (state, offset) {
            this.state = state;
            offset ? Vec2.assign(this.offset, offset) : Vec2.assignC(this.offset, 0, 0);
            this.setSpriteCount(0);
            this.timer = 0.1
        },

        onActionEndDetach: function () {
            this.kill()
        },

        updateSprites: function () {
            var scale = this.timer / 0.1;
            this.state != sc.FOOD_ICON_STATE.DONE && (scale = 1 - scale);

            var sprite,
                drawX = 0,
                drawY = 0;
            if (this.state != sc.FOOD_ICON_STATE.HOLD) {
                this.setSpriteCount(2, true);
                sprite = this.sprites[0];
                sprite.setPos(this.coll.pos.x - 12 + this.offset.x, this.coll.pos.y + 2, this.coll.pos.z + 28 + 2 + this.offset.y);
                sprite.setSize(24, 0, 32);
                sprite.setPivot(12, 16);
                sprite.setImageSrc(this.bubbleGfx, 0, 288);
                sprite.setAlpha(0.8);
                sprite.setTransform(scale, scale, 0);
                sprite = this.sprites[1];
                drawX = 0;
                drawY = 38
            } else {
                this.setSpriteCount(1);
                sprite = this.sprites[0];
                drawX = -10;
                drawY = 17
            }

            drawX = drawX + this.offset.x;
            drawY = drawY + this.offset.y;
            sprite.setPos(this.coll.pos.x + drawX - 8, this.coll.pos.y + 4, this.coll.pos.z + drawY + 4);
            sprite.setSize(16, 0, 16);
            sprite.setPivot(8, 8);
            var tilePos = this.foodSheet.getTileSrc(tileSrc, this.icon);
            sprite.setImageSrc(this.foodSheet.image, tilePos.x, tilePos.y);
            sprite.setTransform(scale, scale, 0)
        }
    })
});
ig.baked = !0;
