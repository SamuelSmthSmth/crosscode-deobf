ig.module("game.feature.menu.gui.shop.shop-misc").requires("game.feature.inventory.inventory").defines(function() {
    sc.ShopHelper = {
        getMaxBuyable: function(b, a, d, c) {
            if (sc.menu.shopSellMode) return sc.model.player.getItemAmount(b);
            var a = a * d,
                e = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() : sc.model.player.credit,
                b = Math.min(c || 99, (c || 99) - sc.model.player.getItemAmount(b));
            return b = Math.min(b, Math.floor(Math.max(0, e - sc.menu.getTotalCost() + a) / d))
        },
        sortList: function(b, a) {
            switch (a) {
                case sc.SORT_TYPE.ORDER:
                    b.sort(function(a,
                        b) {
                        var e = sc.inventory,
                            f = e.getItem(a.item || a.id),
                            e = e.getItem(b.item || b.id),
                            f = f.order + sc.ShopHelper.getItemTypeOrderAddition(f.type, f.equipType),
                            e = e.order + sc.ShopHelper.getItemTypeOrderAddition(e.type, e.equipType);
                        return f - e
                    }.bind(this));
                    break;
                case sc.SORT_TYPE.NAME:
                    b.sort(function(a, b) {
                        var e = sc.inventory,
                            f = ig.LangLabel.getText(e.getItem(a.item).name),
                            e = ig.LangLabel.getText(e.getItem(b.item).name);
                        return f.localeCompare(e)
                    }.bind(this));
                    break;
                case sc.SORT_TYPE.RARITY:
                    b.sort(function(a, b) {
                        var e = sc.inventory,
                            f = e.getItem(a.item),
                            e = e.getItem(b.item);
                        if (f.rarity == e.rarity) {
                            f = f.order + sc.ShopHelper.getItemTypeOrderAddition(f.type, f.equipType);
                            e = e.order + sc.ShopHelper.getItemTypeOrderAddition(e.type, e.equipType);
                            return f - e
                        }
                        return (f.rarity || 0) - (e.rarity || 0)
                    }.bind(this))
            }
        },
        getItemTypeOrderAddition: function(b, a) {
            switch (b) {
                case "CONS":
                    return -1E4;
                case "EQUIP":
                    switch (a) {
                        case "ARM":
                            return 2E4;
                        case "TORSO":
                            return 3E4;
                        case "FEET":
                            return 4E4
                    }
                    return 1E4;
                case "TRADE":
                    return 5E4;
                case "KEY":
                    return 6E4
            }
        }
    }
});
ig.baked = !0;
