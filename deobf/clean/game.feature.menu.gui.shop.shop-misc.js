/**
 * game.feature.menu.gui.shop.shop-misc
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.shop.shop-misc")`.
 *
 * `sc.ShopHelper`: shared shop utilities — `getMaxBuyable` (how many of an
 * item the player can afford/buy, considering sell mode, arena coins,
 * current cart cost and the 99 stack cap) and `sortList` (ORDER / NAME /
 * RARITY sorting of cart entries using `getItemTypeOrderAddition`).
 */
ig.module("game.feature.menu.gui.shop.shop-misc")
    .requires("game.feature.inventory.inventory")
    .defines(function () {

    sc.ShopHelper = {
        getMaxBuyable: function (item, price, amount, maxAmount) {
            if (sc.menu.shopSellMode) return sc.model.player.getItemAmount(item);
            var totalPrice = price * amount,
                credits = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() : sc.model.player.credit,
                max = Math.min(maxAmount || 99, (maxAmount || 99) - sc.model.player.getItemAmount(item));
            return max = Math.min(max, Math.floor(Math.max(0, credits - sc.menu.getTotalCost() + totalPrice) / price))
        },

        sortList: function (list, sortType) {
            switch (sortType) {
                case sc.SORT_TYPE.ORDER:
                    list.sort(function (a, b) {
                        var inventory = sc.inventory,
                            aItem = inventory.getItem(a.item || a.id),
                            bItem = inventory.getItem(b.item || b.id),
                            aOrder = aItem.order + sc.ShopHelper.getItemTypeOrderAddition(aItem.type, aItem.equipType),
                            bOrder = bItem.order + sc.ShopHelper.getItemTypeOrderAddition(bItem.type, bItem.equipType);
                        return aOrder - bOrder
                    }.bind(this));
                    break;
                case sc.SORT_TYPE.NAME:
                    list.sort(function (a, b) {
                        var inventory = sc.inventory,
                            aName = ig.LangLabel.getText(inventory.getItem(a.item).name),
                            bName = ig.LangLabel.getText(inventory.getItem(b.item).name);
                        return aName.localeCompare(bName)
                    }.bind(this));
                    break;
                case sc.SORT_TYPE.RARITY:
                    list.sort(function (a, b) {
                        var inventory = sc.inventory,
                            aItem = inventory.getItem(a.item),
                            bItem = inventory.getItem(b.item);
                        if (aItem.rarity == bItem.rarity) {
                            var aOrder = aItem.order + sc.ShopHelper.getItemTypeOrderAddition(aItem.type, aItem.equipType),
                                bOrder = bItem.order + sc.ShopHelper.getItemTypeOrderAddition(bItem.type, bItem.equipType);
                            return aOrder - bOrder
                        }
                        return (aItem.rarity || 0) - (bItem.rarity || 0)
                    }.bind(this))
            }
        },

        getItemTypeOrderAddition: function (type, equipType) {
            switch (type) {
                case "CONS":
                    return -1E4;
                case "EQUIP":
                    switch (equipType) {
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
