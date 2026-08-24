/**
 * game.feature.menu.gui.shop.shop-list
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.shop.shop-list")`.
 *
 * `sc.ShopListMenu`: the buy/sell item list panel — builds the per-page
 * list from the shop offers (or the sell-mode item pages), handles the
 * +/- count steppers (right/left with press-repeater), cost/owned
 * readouts and affordability greying. `sc.ShopPageCounter`: the page
 * title with left/right page-cycle buttons. `sc.ShopItemButton`: one
 * shop row (item, owned count, count-in-cart, price, level).
 */
ig.module("game.feature.menu.gui.shop.shop-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "impact.feature.interact.press-repeater", "game.feature.gui.base.boxes", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.shop.shop-misc")
    .defines(function () {

    sc.ShopListMenu = sc.MenuPanel.extend({
        buttongroup: null,
        pagesCache: [],
        list: null,
        repeater: null,
        _prevSortType: sc.SORT_TYPE.ORDER,
        _amp: 0,
        _ampTimer: 0,
        _ampDir: null,

        init: function () {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.setSize(252, 241);
            this.setPos(5, 14);
            this.setPivot(126, 0);
            this.hook.transitions = {
                DEFAULT: {
                    state: {
                        alpha: 1
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -257
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.list = new sc.ItemListBox(1);
            this.list.quantity.setText(ig.lang.get("sc.gui.shop.cost"));
            this.list.quantity.setPos(60, 0);
            this.list.setSize(252, 230);
            this.list.setPos(0, 3);
            this.buttongroup = this.list.list.buttonGroup;
            this.buttongroup.addSelectionCallback(function (button) {
                if (button.data && button.data != 1) {
                    sc.menu.setInfoText(button.data.description ? button.data.description : button.data);
                    if (button.data.id) {
                        var item = sc.inventory.getItem(button.data.id);
                        item.equipType != void 0 ? sc.menu.setItemInfo(button.data.id) : sc.menu.resetItemInfo();
                        item.isBuff ? sc.menu.setBuffText(sc.inventory.getBuffString(button.data.id), false, button.data.id) : sc.menu.setBuffText("", false)
                    } else sc.menu.resetItemInfo()
                }
            }.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true);
                sc.menu.setBuffText("", true);
                sc.menu.resetItemInfo()
            }.bind(this));
            this.buttongroup.addPressCallback(this.onPressCallback.bind(this));
            this.buttongroup.isNonMouseMenuInput = function () {
                return sc.control.menuConfirm() || sc.control.downDown() || sc.control.upDown()
            }.bind(this);
            this.addChildGui(this.list);
            var ownedLabel = new sc.TextGui(ig.lang.get("sc.gui.shop.owned"), {
                font: sc.fontsystem.tinyFont
            });
            ownedLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            ownedLabel.setPos(5, 0);
            this.list.addChildGui(ownedLabel);
            this.repeater = new ig.PressRepeater;
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            if (this.buttongroup.isActive() && !ig.interact.isBlocked()) {
                if (this._ampTimer > 0) {
                    this._ampTimer = this._ampTimer - ig.system.actualTick;
                    if (this._ampTimer <= 0) this._amp = this._ampTimer = 0
                }
                switch (this.getRepeaterValue()) {
                    case "right":
                        this.stepRight();
                        break;
                    case "left":
                        this.stepLeft()
                }
            }
        },

        show: function () {
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
            sc.menu.shopSellMode ? this.list.quantity.setText(ig.lang.get("sc.gui.shop.price")) : this.list.quantity.setText(ig.lang.get("sc.gui.shop.cost"));
            sc.menu.shopPage = 0;
            this.createBuyList(true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive, sc.SORT_TYPE.ORDER);
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
            this.doStateTransition("HIDDEN")
        },

        getRepeaterValue: function () {
            sc.control.rightDown() ? this.repeater.setDown("right") : sc.control.leftDown() && this.repeater.setDown("left");
            return this.repeater.getPressed()
        },

        getActiveElement: function () {
            return ig.input.mouseGuiActive ? sc.menu.buttonInteract.mouseOverGui : this.buttongroup.getCurrentElement()
        },

        stepRight: function () {
            this.changeCount(1)
        },

        stepLeft: function () {
            this.changeCount(-1)
        },

        changeCount: function (delta) {
            var button = this.getActiveElement();
            if (button && button.active && button.data && button.data.id) {
                var maxOwn = ig.database.get("shops")[sc.menu.shopID].maxOwn || 99,
                    item = button.data.id,
                    price = button.price,
                    count = sc.menu.getItemQuantity(item, price),
                    max = sc.ShopHelper.getMaxBuyable(item, count, price, maxOwn);
                if (!(count == 0 && delta == -1) && !(count == max && delta == 1)) {
                    this.playSound(delta, true);
                    sc.menu.updateCart(item, count + delta, price);
                    button.setCountNumber(count + delta, count == 0);
                    this.updateListEntries()
                }
            }
        },

        playSound: function (direction, amplify) {
            this._ampTimer = 0.3;
            if (this._ampDir != direction) this._amp = 0;
            this._ampDir = direction;
            this._amp = Math.min(0.2, this._amp + 0.04);
            direction == 1 ? sc.BUTTON_SOUND.shop_up.play(null, {
                speed: 1 + (amplify ? this._amp : 0)
            }) : sc.BUTTON_SOUND.shop_down.play(null, {
                speed: 1 - (amplify ? this._amp : 0)
            })
        },

        updateListEntries: function (resetCounts) {
            for (var player = sc.model.player, credits = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() : player.credit, cartCost = sc.menu.getTotalCost(), rest = credits - cartCost, children = this.list.getChildren(), i = children.length, maxOwn = ig.database.get("shops")[sc.menu.shopID].maxOwn || 99; i--;) {
                var button = children[i].gui;
                if (!sc.menu.shopSellMode) {
                    var count = sc.menu.getItemQuantity(button.data.id, button.price);
                    player.getItemAmountWithEquip(button.data.id) >= maxOwn ? button.setActive(false) : !count && button.price > rest ? button.setActive(false) : button.setActive(true)
                }
                if (resetCounts) {
                    button.setCountNumber(0, true);
                    button.owned.setNumber(sc.menu.shopSellMode ? player.getItemAmount(button.data.id) : player.getItemAmountWithEquip(button.data.id))
                }
            }
        },

        updateShopPage: function (sortType) {
            this.createBuyList(true, ig.input.mouseGuiActive, !ig.input.mouseGuiActive, sortType || sc.SORT_TYPE.ORDER)
        },

        createBuyList: function (refocus, mouseActive, hardFocus, sortType) {
            refocus = refocus || false;
            mouseActive = mouseActive || false;
            hardFocus = hardFocus || false;
            this._prevSortType = sortType = sortType || sc.SORT_TYPE.ORDER;
            this.buttongroup.clear();
            this.list.clear(refocus);
            var entries = null;
            if (sc.menu.shopSellMode) {
                entries = sc.SELL_PAGES[sc.menu.shopPage];
                entries = entries.type == "EQUIP" ? sc.model.player.getEquipSubList(entries.equipType, false, sortType) : sc.model.player.getItemSubList(entries.type, sortType)
            } else {
                entries = ig.database.get("shops")[sc.menu.shopID].pages;
                entries = ig.copy(entries[sc.menu.shopPage].content);
                sc.ShopHelper.sortList(entries, sortType)
            }
            sc.menu.shopSellMode ? this.scrapSellList(entries) : this.scrapBuyList(entries);
            if (refocus) {
                mouseActive ? this.buttongroup.setCurrentFocus(0, 0) : this.buttongroup.focusCurrentButton(0, 0, false, hardFocus);
                this.list.list.scrollToY(0, true)
            }
            this.getRepeaterValue()
        },

        scrapSellList: function (entries) {
            for (var item = null, label = null, owned = 0, price = 0, level = 0, i = 0; i < entries.length; i++) {
                var entry = entries[i],
                    itemDef = sc.inventory.getItem(entry),
                    owned = sc.model.player.getItemAmount(entry),
                    price = Math.floor(itemDef.cost / 2),
                    name = new ig.LangLabel(itemDef.name),
                    label = "\\i[" + (itemDef.icon + sc.inventory.getRaritySuffix(itemDef.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(itemDef.name),
                    description = ig.LangLabel.getText(itemDef.description),
                    level = 0;
                itemDef.type == sc.ITEMS_TYPES.EQUIP && (level = itemDef.level || 1);
                item = new sc.ShopItemButton(label, entry, description, owned, price, level);
                price == 0 && item.setActive(false);
                var count = sc.menu.getItemQuantity(entry, price);
                count > 0 && item.setCountNumber(count, true);
                this.list.addButton(item)
            }
            this.getRepeaterValue()
        },

        scrapBuyList: function (entries) {
            for (var button = null, itemDef = null, owned = 0, level = 0, i = 0, isCoinMode = sc.menu.shopCoinMode, rest = (isCoinMode ? sc.arena.getTotalArenaCoins() : sc.model.player.credit) - sc.menu.getTotalCost(), maxOwn = ig.database.get("shops")[sc.menu.shopID].maxOwn || 99, k = 0; k < entries.length; k++)
                if (!entries[k].condition || (new ig.VarCondition(entries[k].condition)).evaluate()) {
                    var item = entries[k].item;
                    itemDef = sc.inventory.getItem(item);
                    owned = sc.model.player.getItemAmountWithEquip(item);
                    level = 0;
                    itemDef.type == sc.ITEMS_TYPES.EQUIP && (level = itemDef.level || 1);
                    var price = entries[k].price || (isCoinMode ? itemDef.coins : itemDef.cost),
                        count = sc.menu.getItemQuantity(item, price),
                        name = new ig.LangLabel(itemDef.name),
                        label = "\\i[" + (itemDef.icon + sc.inventory.getRaritySuffix(itemDef.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(itemDef.name),
                        description = ig.LangLabel.getText(itemDef.description),
                        button = new sc.ShopItemButton(label, item, description, owned, price, level);
                    count > 0 && button.setCountNumber(count, true);
                    ig.database.get("shops")[sc.menu.shopID].maxOwn != void 0 && (owned = sc.stats.getMap("items", item));
                    (rest < price && !sc.menu.getItemQuantity(item, price) || owned >= maxOwn) && button.setActive(false);
                    this.list.addButton(button)
                }
        },

        onPressCallback: function (button) {
            sc.menu.openShopQuantitySelect(button)
        },

        onBackButtonPress: function () {
            sc.menu.shopCart.length >= 1 ? sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.shop.leaveWithCartItems"), sc.DIALOG_INFO_ICON.WARNING, function (result) {
                result.data == 0 && this.leaveList()
            }.bind(this)) : this.leaveList()
        },

        leaveList: function () {
            sc.menu.popBackCallback();
            sc.menu.shopCart.length = 0;
            sc.menu.setShopState(sc.MENU_SHOP_STATE.START)
        }
    });

    sc.ShopPageCounter = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -257
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        pageText: null,
        cycleLeft: null,
        cycleRight: null,

        init: function () {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(158, 21);
            this.setPos(52, 29);
            this.hook.localAlpha = 0.5;
            this.pageText = new sc.TextGui("");
            this.pageText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.pageText);
            this.cycleLeft = new sc.ButtonGui("\\i[arrow-left]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleLeft.keepMouseFocus = true;
            this.cycleLeft.setPos(-27, 0);
            this.cycleLeft.onButtonPress = function () {
                sc.menu.shopSellMode ? this.cycleSellPages(-1) : this.cycleOffers(-1)
            }.bind(this);
            this.addChildGui(this.cycleLeft);
            this.cycleRight = new sc.ButtonGui("\\i[arrow-right]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleRight.keepMouseFocus = true;
            this.cycleRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.cycleRight.setPos(-27, 0);
            this.cycleRight.onButtonPress = function () {
                sc.menu.shopSellMode ? this.cycleSellPages(1) : this.cycleOffers(1)
            }.bind(this);
            this.addChildGui(this.cycleRight);
            this.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (renderer) {
            renderer.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },

        show: function () {
            sc.menu.buttonInteract.addGlobalButton(this.cycleLeft, this.onLeftPressCheck.bind(this), true);
            sc.menu.buttonInteract.addGlobalButton(this.cycleRight, this.onRightPressCheck.bind(this), true);
            this.doStateTransition("DEFAULT");
            var pages = null;
            if (sc.menu.shopSellMode) {
                pages = sc.SELL_PAGES;
                this.pageText.setText(ig.lang.get("sc.gui.shop.sellPages." + pages[sc.menu.shopPage].lang))
            } else {
                pages = ig.database.get("shops")[sc.menu.shopID].pages;
                this.pageText.setText(ig.LangLabel.getText(pages[sc.menu.shopPage].title))
            }
            if (pages.length == 1) {
                this.cycleLeft.setActive(false);
                this.cycleRight.setActive(false);
                this.cycleLeft.setText("\\i[arrow-left-off]");
                this.cycleRight.setText("\\i[arrow-right-off]")
            } else {
                this.cycleLeft.setActive(true);
                this.cycleRight.setActive(true);
                this.cycleLeft.setText("\\i[arrow-left]");
                this.cycleRight.setText("\\i[arrow-right]")
            }
        },

        hide: function () {
            sc.menu.buttonInteract.removeGlobalButton(this.cycleLeft);
            sc.menu.buttonInteract.removeGlobalButton(this.cycleRight);
            this.doStateTransition("HIDDEN")
        },

        cycleSellPages: function (direction) {
            var pages = sc.SELL_PAGES,
                page = sc.menu.shopPage + direction;
            direction < 0 ? page < 0 && (page = pages.length - 1) : direction > 0 && page >= pages.length && (page = 0);
            sc.menu.setShopPage(page);
            this.pageText.setText(ig.lang.get("sc.gui.shop.sellPages." + pages[sc.menu.shopPage].lang))
        },

        cycleOffers: function (direction) {
            var pages = ig.database.get("shops")[sc.menu.shopID].pages;
            if (pages.length != 1) {
                var page = sc.menu.shopPage + direction;
                direction < 0 ? page < 0 && (page = pages.length - 1) : direction > 0 && page >= pages.length && (page = 0);
                sc.menu.setShopPage(page);
                this.pageText.setText(ig.LangLabel.getText(pages[sc.menu.shopPage].title))
            }
        },

        onLeftPressCheck: function () {
            return sc.control.menuCircleLeft()
        },

        onRightPressCheck: function () {
            return sc.control.menuCircleRight()
        }
    });

    sc.ShopItemButton = sc.ListBoxButton.extend({
        symbolGfx: new ig.Image("media/gui/menu.png"),
        cost: null,
        owned: null,
        count: null,
        symbol: null,
        level: 0,

        init: function (label, item, description, owned, price, level) {
            this.parent(label, 142, 106, item, description);
            this.price = price || 0;
            this.level = level || 0;
            this.owned = new sc.NumberGui(99, {
                transitionTime: 0.1
            });
            this.owned.setNumber(owned, true);
            this.owned.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.owned.setPos(4, 7);
            this.addChildGui(this.owned);
            this.cost = new sc.NumberGui(999999);
            this.cost.setNumber(price, true);
            this.cost.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.cost.setPos(54, 7);
            this.addChildGui(this.cost);
            this.count = new sc.NumberGui(99, {
                noZero: true,
                transitionTime: 0.1
            });
            this.count.setColor(sc.GUI_NUMBER_COLOR.GREEN);
            this.count.setNumber(0, true);
            this.count.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.count.setPos(28, 7);
            this.addChildGui(this.count);
            this.symbol = new ig.ImageGui(this.symbolGfx, 136, 448, 6, 6);
            this.symbol.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.symbol.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.symbol.setPos(46, 8);
            this.addChildGui(this.symbol);
            this.symbol.doStateTransition("HIDDEN", true);
            this.setLevel(level)
        },

        setCountNumber: function (count, animate) {
            this.count.setNumber(count, animate);
            count >= 1 ? this.symbol.doStateTransition("DEFAULT", true, false) : this.symbol.doStateTransition("HIDDEN", true)
        },

        keepButtonPressed: function () {
            this.keepPressed = true;
            this.setPressed(true);
            this.button.keepPressed = true;
            this.button.setPressed(true)
        },

        unPressButton: function () {
            this.keepPressed = false;
            this.setPressed(false);
            this.button.keepPressed = false;
            this.button.setPressed(false)
        }
    })
});
ig.baked = !0;
