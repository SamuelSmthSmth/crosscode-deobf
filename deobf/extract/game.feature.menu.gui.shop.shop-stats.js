ig.module("game.feature.menu.gui.shop.shop-stats").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.trade.gui.equip-toggle-stats").defines(function() {
    sc.ShopEquipStats = sc.TradeToggleStats.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -181
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 5,
            height: 5,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "default": {
                    x: 116,
                    y: 425
                }
            }
        }),
        init: function() {
            this.parent(4, 0);
            this.setPos(5, 29);
            this.hook.size.x = 169;
            this.hook.size.y = this.hook.size.y - 1;
            this.hook.localAlpha = 1;
            this.compareText.setText(ig.lang.get("sc.gui.trade.nothing"));
            this.compareItem.setText(ig.lang.get("sc.gui.shop.noEquip"));
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            this.parent(b);
            b.addColor("#7E7E7E", 0, 12, this.hook.size.x, 1);
            b.addColor("#7E7E7E", 0, 38, this.hook.size.x, 1);
            b.addColor("#7E7E7E", 0, 162, this.hook.size.x, 1)
        },
        updateStatsView: function() {
            this._setParameters(sc.trade.equipID)
        },
        reset: function() {
            this.compareText.setText(ig.lang.get("sc.gui.trade.nothing"));
            this.compareItem.setText(ig.lang.get("sc.gui.shop.noEquip"));
            this.compareItem.setDrawCallback(null);
            this._resetParameters()
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        }
    })
});
ig.baked = !0;
