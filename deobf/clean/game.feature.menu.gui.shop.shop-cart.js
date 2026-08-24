/**
 * game.feature.menu.gui.shop.shop-cart
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.shop.shop-cart")`.
 *
 * `sc.ShopCart`: the bottom-left cart panel — credits/coins, current cost
 * (or profit in sell mode) and remaining rest totals, plus the checkout
 * hotkey button. `sc.ShopCartEntry`: one labeled number row with the
 * credit/coin icon.
 */
ig.module("game.feature.menu.gui.shop.shop-cart")
    .requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box")
    .defines(function () {

    sc.ShopCart = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 16,
            height: 9,
            left: 4,
            top: 4,
            right: 4,
            bottom: 4,
            offsets: {
                "default": {
                    x: 512,
                    y: 457
                }
            }
        }),
        credits: null,
        value: null,
        rest: null,
        checkout: null,
        enabled: true,

        init: function () {
            this.parent(125, 88);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(180, 26);
            var y = 5,
                title = new sc.TextGui(ig.lang.get("sc.gui.shop.cart"), {
                    font: sc.fontsystem.tinyFont
                });
            title.setPos(4, y);
            this.addChildGui(title);
            y = y + 13;
            this.credits = new sc.ShopCartEntry(ig.lang.get("sc.gui.shop." + (sc.menu.shopCoinMode ? "coins" : "credits")) + ":");
            this.credits.setPos(0, y);
            this.addChildGui(this.credits);
            y = y + 13;
            this.value = new sc.ShopCartEntry(ig.lang.get("sc.gui.shop.cost") + ":");
            this.value.setPos(0, y);
            this.value.number.noZero = true;
            this.value.hideSymbol = true;
            this.value.number.signed = true;
            this.value.number.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.addChildGui(this.value);
            y = y + 16;
            this.rest = new sc.ShopCartEntry(ig.lang.get("sc.gui.shop.rest") + ":");
            this.rest.setPos(0, y);
            this.addChildGui(this.rest);
            this.checkout = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.shop.checkout"));
            this.checkout.onButtonPress = this.onCheckoutPress.bind(this);
            this.checkout.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.checkout.setPos(3, 3);
            this.addChildGui(this.checkout);
            this.doStateTransition("HIDDEN", true)
        },

        resetNumbers: function (animate) {
            var credits = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() : sc.model.player.credit;
            this.credits.setNumber(credits, animate);
            this.value.setNumber(0, animate);
            this.rest.setNumber(credits, animate);
            credits < 0 ? this.rest.number.setColor(sc.GUI_NUMBER_COLOR.RED) : this.rest.number.setColor(sc.GUI_NUMBER_COLOR.WHITE);
            this.checkout.setActive(false)
        },

        updateValue: function (value) {
            var cost = value || 0;
            if (value == void 0) {
                for (var cart = sc.menu.shopCart, i = cart.length; i--;) cost = cost + cart[i].price * cart[i].amount;
                this.value.setNumber(-cost)
            }
            var rest = 0;
            if (sc.menu.shopSellMode) {
                this.value.number.setColor(sc.GUI_NUMBER_COLOR.GREEN);
                rest = sc.model.player.credit + cost;
                this.value.setNumber(cost)
            } else {
                rest = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() - cost : sc.model.player.credit - cost;
                this.value.number.setColor(sc.GUI_NUMBER_COLOR.RED);
                this.value.setNumber(-cost)
            }
            this.rest.setNumber(rest);
            this.value.number.showPlus = sc.menu.shopSellMode && cost;
            if (rest < 0) {
                this.rest.number.setColor(sc.GUI_NUMBER_COLOR.RED);
                this.checkout.setActive(false)
            } else {
                sc.menu.shopCart.length == 0 ? this.checkout.setActive(false) : this.enabled && this.checkout.setActive(true);
                this.rest.number.setColor(sc.GUI_NUMBER_COLOR.WHITE)
            }
        },

        updateDrawables: function (renderer) {
            this.parent(renderer);
            renderer.addColor("#7E7E7E", 0, 12, this.hook.size.x, 1);
            renderer.addColor("#FFF", 3, 42, this.hook.size.x - 6, 1)
        },

        show: function () {
            this.resetNumbers(true);
            if (sc.menu.shopSellMode) {
                this.value.text.setText(ig.lang.get("sc.gui.shop.profit") + ":");
                this.rest.text.setText(ig.lang.get("sc.gui.shop.total") + ":")
            } else {
                this.value.text.setText(ig.lang.get("sc.gui.shop.cost") + ":");
                this.rest.text.setText(ig.lang.get("sc.gui.shop.rest") + ":")
            }
            sc.menu.buttonInteract.addGlobalButton(this.checkout, this.onCheckoutCheck.bind(this), true);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            sc.menu.buttonInteract.removeGlobalButton(this.checkout);
            this.doStateTransition("HIDDEN")
        },

        setCheckout: function (enabled) {
            (this.enabled = enabled) ? sc.menu.shopCart.length >= 1 && this.checkout.setActive(true) : this.checkout.setActive(false)
        },

        onCheckoutPress: function () {
            sc.menu.openCheckout()
        },

        onCheckoutCheck: function () {
            return sc.control.menuHotkeyHelp2()
        }
    });

    sc.ShopCartEntry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        text: null,
        number: null,
        hideSymbol: false,

        init: function (label) {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(120, 8);
            this.text = new sc.TextGui(label, {
                font: sc.fontsystem.tinyFont
            });
            this.text.setPos(0, 0);
            this.addChildGui(this.text);
            this.number = new sc.NumberGui(9999999, {
                transitionTime: 0.1
            });
            this.number.setPos(41, 0);
            this.addChildGui(this.number)
        },

        updateDrawables: function (renderer) {
            this.hideSymbol || (sc.menu.shopCoinMode ? renderer.addGfx(this.gfx, this.hook.size.x - 15, -1, 500, 224, 12, 12) : renderer.addGfx(this.gfx, this.hook.size.x - 13, 0, 490, 224, 10, 8))
        },

        setNumber: function (value, animate) {
            this.number.setNumber(value, animate)
        }
    })
});
ig.baked = !0;
