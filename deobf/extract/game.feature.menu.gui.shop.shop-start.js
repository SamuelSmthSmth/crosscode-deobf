ig.module("game.feature.menu.gui.shop.shop-start").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.gui.base.button").defines(function() {
    sc.ShopStartMenu = ig.BoxGui.extend({
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
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetY: 10
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_SCALE: {
                state: {
                    alpha: 0,
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        buy: null,
        sell: null,
        buttongroup: null,
        init: function() {
            this.parent(162, 71);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setSize(162, 71);
            this.setPos(0, -1);
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.addPressCallback(this.onButtonPress.bind(this));
            this.buy = new sc.ButtonGui(ig.lang.get("sc.gui.shop.buy"), 150);
            this.buy.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.buy.setPos(0, 8);
            this.buy.setData(0);
            this.addChildGui(this.buy);
            this.sell = new sc.ButtonGui(ig.lang.get("sc.gui.shop.sell"), 150);
            this.sell.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.sell.setPos(0, 8);
            this.sell.setData(1);
            this.addChildGui(this.sell);
            var b = ig.database.get("shops")[sc.menu.shopID];
            sc.MENU_SHOP_TYPES[b.shopType] == sc.MENU_SHOP_TYPES.BUY && this.sell.setActive(false);
            this.buttongroup.addFocusGui(this.buy, 0, 0);
            this.buttongroup.addFocusGui(this.sell, 0, 1);
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
            sc.menu.setInfoText("", true);
            this.doStateTransition("DEFAULT")
        },
        hide: function(b, a) {
            sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
            this.doStateTransition(b ? "HIDDEN_SCALE" : "HIDDEN", a)
        },
        onButtonPress: function(b) {
            b.data == 0 ? sc.menu.setShopState(sc.MENU_SHOP_STATE.BUY) : b.data == 1 && sc.menu.setShopState(sc.MENU_SHOP_STATE.SELL)
        }
    });
    sc.ShopStartTitle = ig.BoxGui.extend({
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
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetY: -10
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_SCALE: {
                state: {
                    alpha: 0,
                    scaleX: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        text: null,
        init: function() {
            this.parent(20, 20);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.setPos(0, 50);
            this.text = new sc.TextGui;
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.text);
            this.doStateTransition("HIDDEN",
                true)
        },
        show: function() {
            var b = ig.database.get("shops")[sc.menu.shopID],
                b = b ? ig.LangLabel.getText(b.name) : "Unknown Shop Name";
            this.text.setText(" - " + b + " - ");
            this.setSize(this.text.hook.size.x + 12, 20);
            this.doStateTransition("DEFAULT")
        },
        hide: function(b, a) {
            this.doStateTransition(b ? "HIDDEN_SCALE" : "HIDDEN", a)
        }
    })
});
ig.baked = !0;
