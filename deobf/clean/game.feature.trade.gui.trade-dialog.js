ig.module("game.feature.trade.gui.trade-dialog").requires("game.feature.trade.trade-model", "impact.base.image", "impact.feature.gui.base.basic-gui", "impact.feature.gui.gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.TradeItem = sc.ListBoxButton.extend({
        helperGfx: new ig.Image("media/gui/menu.png"),
        requiredGui: null,
        amount: null,
        crossGui: null,
        isTrade: false,
        required: 0,
        init: function(label, itemID, description, amount, required, isTrade, level) {
            this.parent(label, 142, 56, itemID, description);
            this.blockedSound = null;
            this.button.submitSound = null;
            this.isTrade = isTrade || false;
            this.required = required || 0;
            this.crossGui = new ig.ImageGui(this.helperGfx, 136, 432, 5, 5);
            this.crossGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.crossGui.setPos(48, 9);
            this.addChildGui(this.crossGui);
            this.requiredGui = new sc.NumberGui(99);
            this.requiredGui.setNumber(this.required);
            this.requiredGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.requiredGui.setPos(30, 7);
            this.addChildGui(this.requiredGui);
            label = new ig.ImageGui(this.helperGfx, 136, 416, 3, 9);
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            label.setPos(22, 6);
            this.addChildGui(label);
            label = new ig.ImageGui(this.helperGfx, 139, 416, 3, 9);
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            label.setPos(1, 6);
            this.addChildGui(label);
            this.amount = new sc.NumberGui(99);
            this.amount.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.amount.setPos(5, 7);
            this.addChildGui(this.amount);
            this.updateTradeItem(amount, required);
            this.setLevel(level)
        },
        updateTradeItem: function(amount) {
            this.amount.setNumber(amount || 0);
            if (this.isTrade) {
                if (amount >= 99) {
                    this.crossGui.offsetY = 440;
                    this.requiredGui.setColor(sc.GUI_NUMBER_COLOR.RED)
                }
            } else if (amount >=
                this.required) {
                this.crossGui.offsetY = 432;
                this.requiredGui.setColor(sc.GUI_NUMBER_COLOR.WHITE)
            } else {
                this.crossGui.offsetY = 440;
                this.requiredGui.setColor(sc.GUI_NUMBER_COLOR.RED);
                this.setActive(false)
            }
        }
    });
    sc.TradeItemBox = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        dividerColor: null,
        init: function(items, buttongroup, index, width, isTrade) {
            this.parent();
            this.hook.size.x = width;
            this.setContent(items, buttongroup, index, isTrade)
        },
        updateDrawables: function(drawables) {
            var size = this.hook.size;
            drawables.addColor("#000", 0, 0, size.x, size.y);
            drawables.addColor(this.dividerColor || "#7E7E7E",
                0, 0, size.x, 1);
            drawables.addColor(this.dividerColor || "#7E7E7E", 0, size.y - 1, size.x, 1)
        },
        setContent: function(items, buttongroup, index, isTrade) {
            this.removeAllChildren();
            var offsetY = 2,
                owned = 0,
                item = 0,
                itemID = 0,
                itemData = owned = null,
                label = null,
                description = null,
                inventory = sc.inventory,
                player = sc.model.player;
            if (items)
                for (var i = 0; i < items.length; i++) {
                    itemID = items[i].id;
                    if (itemID != void 0) {
                        itemData = inventory.getItem(itemID);
                        owned = items[i].amount || 0;
                        item = player.getItemAmountWithEquip(itemID);
                        new ig.LangLabel(itemData.name);
                        var label = "\\i[" + (itemData.icon + sc.inventory.getRaritySuffix(itemData.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(itemData.name),
                            description = ig.LangLabel.getText(itemData.description),
                            level = 0;
                        itemData.type ==
                            sc.ITEMS_TYPES.EQUIP && (level = itemData.level || 1);
                        owned = new sc.TradeItem(label, itemID, description, item, owned, isTrade, level);
                        owned.setPos(1, offsetY);
                        if (this._isEquipped(itemID, itemData.equipType, player)) {
                            item = new ig.ImageGui(this.gfx, 112, 480, 19, 18);
                            owned.addChildGui(item);
                            owned.equipImage = item;
                            if (!isTrade && player.getItemAmount(itemID) <= 0) {
                                sc.trade.hasEquippedTrade = true;
                                sc.trade.setEquippedID(itemID, itemData.equipType)
                            }
                        }
                        buttongroup && buttongroup.addFocusGui(owned, 0, index);
                        index = index + 1;
                        offsetY = offsetY + (owned.hook.size.y + 0);
                        this.addChildGui(owned)
                    }
                } else offsetY = 20;
            this.hook.size.y = offsetY + 1;
            return offsetY + 1
        },
        updateTradeItemButtons: function(isTrade) {
            for (var children = this.hook.children, i = children.length, gui = null, player = sc.model.player,
                    inventory = sc.inventory, itemID = -1; i--;) {
                gui = children[i].gui;
                if (gui.data && gui.data.id != void 0) {
                    itemID = gui.data.id;
                    gui.updateTradeItem(player.getItemAmountWithEquip(itemID));
                    if (this._isEquipped(itemID, inventory.getItem(itemID).equipType, player)) {
                        if (!isTrade && player.getItemAmount(itemID) <= 0) {
                            sc.trade.hasEquippedTrade = true;
                            sc.trade.setEquippedID(itemID, inventory.getItem(itemID).equipType)
                        }
                    } else if (gui.equipImage) {
                        gui.removeChildGui(gui.equipImage);
                        gui.equipImage = null
                    }
                }
            }
        },
        _isEquipped: function(itemID, equipType, player) {
            if (!equipType) return false;
            switch (equipType) {
                case sc.ITEMS_EQUIP_TYPES.HEAD:
                    return itemID == player.equip.head;
                case sc.ITEMS_EQUIP_TYPES.ARM:
                    return itemID ==
                        player.equip.leftArm || itemID == player.equip.rightArm;
                case sc.ITEMS_EQUIP_TYPES.TORSO:
                    return itemID == player.equip.torso;
                case sc.ITEMS_EQUIP_TYPES.FEET:
                    return itemID == player.equip.feet
            }
        }
    });
    sc.TradeMoneyGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
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
        },
        content: null,
        money: 0,
        credit: null,
        fee: null,
        current: null,
        dividerColor: null,
        init: function(items, scale, cost, showCurrent) {
            this.parent();
            this.setSize(223, 26 +
                (showCurrent ? 11 : 0));
            this.money = 0;
            if (cost != void 0) {
                if (cost == 0) {
                    this.doStateTransition("HIDDEN", true);
                    return
                }
                this.money = cost || 1
            } else if (items) {
                for (cost = items.length; cost--;) this.money = this.money + sc.inventory.getItem(items[cost].id).cost * (items[cost].amount || 1);
                this.money = Math.floor((this.money || 1) * (scale || 1))
            }
            items = 0;
            showCurrent && (items = 11);
            this.content = new ig.GuiElementBase;
            this.content.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.content.setSize(142, 26 + items);
            this.addChildGui(this.content);
            scale = new sc.TextGui(ig.lang.get("sc.gui.trade.fee"), {
                font: sc.fontsystem.tinyFont
            });
            scale.setPos(0, 4 + items);
            this.content.addChildGui(scale);
            scale = new sc.TextGui(ig.lang.get("sc.gui.trade.rest"), {
                font: sc.fontsystem.tinyFont
            });
            scale.setPos(0, 15 + items);
            this.content.addChildGui(scale);
            if (showCurrent) {
                scale = new sc.TextGui(ig.lang.get("sc.gui.trade.credits"), {
                    font: sc.fontsystem.tinyFont
                });
                scale.setPos(0, 4);
                this.content.addChildGui(scale)
            }
            this.credit = new sc.NumberGui(99999999, {
                signed: true,
                transitionTime: 0.2
            });
            this.credit.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.credit.setNumber(sc.model.player.credit - this.money, true);
            sc.model.player.credit -
                this.money < 0 && this.credit.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.credit.setPos(14, 15 + items);
            this.content.addChildGui(this.credit);
            this.fee = new sc.NumberGui(99999999, {
                signed: true,
                transitionTime: 0.2
            });
            this.fee.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.fee.setNumber(-this.money, true);
            this.fee.setColor(sc.GUI_NUMBER_COLOR.RED);
            this.fee.setPos(14, 4 + items);
            this.content.addChildGui(this.fee);
            if (showCurrent) {
                this.current = new sc.NumberGui(99999999, {
                    signed: true,
                    transitionTime: 0.2
                });
                this.current.setAlign(ig.GUI_ALIGN.X_RIGHT,
                    ig.GUI_ALIGN.Y_TOP);
                this.current.setNumber(sc.model.player.credit, true);
                this.current.setPos(14, 4);
                this.content.addChildGui(this.current)
            }
            scale = new ig.ImageGui(this.gfx, 488, 32, 12, 10);
            scale.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            scale.setPos(0, 3 + items);
            scale = new ig.ImageGui(this.gfx, 488, 32, 12, 10);
            scale.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            scale.setPos(0, 14 + items);
            this.content.addChildGui(scale);
            if (showCurrent) {
                scale = new ig.ImageGui(this.gfx, 488, 32, 12, 10);
                scale.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                scale.setPos(0, 3);
                this.content.addChildGui(scale)
            }
        },
        setContent: function(items, scale, cost, posY) {
            this.money = 0;
            if (cost != void 0) {
                if (cost == 0) {
                    this.doStateTransition("HIDDEN", true);
                    return
                }
                this.money = cost || 1
            } else {
                for (cost = items.length; cost--;) this.money = this.money + sc.inventory.getItem(items[cost].id).cost * (items[cost].amount || 1);
                this.money = (this.money || 1) * (scale || 1)
            }
            this.updateValues();
            this.hook.pos.y = posY;
            this.current && this.current.setNumber(sc.model.player.credit || 0, true);
            this.doStateTransition("DEFAULT", true)
        },
        updateValues: function() {
            this.credit.setNumber(sc.model.player.credit - this.money);
            sc.model.player.credit -
                this.money < 0 ? this.credit.setColor(sc.GUI_NUMBER_COLOR.RED) : this.credit.setColor(sc.GUI_NUMBER_COLOR.WHITE);
            this.fee.setNumber(-this.money)
        },
        updateDrawables: function(drawables) {
            var size = this.hook.size;
            drawables.addColor("#000", 0, 0, size.x, size.y);
            drawables.addColor(this.dividerColor || "#7E7E7E", 0, 0, size.x, 1);
            drawables.addColor(this.dividerColor || "#7E7E7E", 0, size.y - 1, size.x, 1)
        }
    });
    sc.TradeDialogMenu = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -10
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 432,
                    y: 280
                }
            }
        }),
        buttongroup: null,
        tradeButton: null,
        getItems: null,
        requireItems: null,
        money: null,
        arrow: null,
        forText: null,
        ownedText: null,
        init: function() {
            this.parent(227, 100);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPos(8, 53);
            this.hook.localAlpha = 0.9;
            this.buttongroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.buttongroup.addSelectionCallback(this.onSelection.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function() {
                var firstItem = sc.trade.getCurrentOffer().get[0];
                if (sc.inventory.isEquipID(firstItem.id)) {
                    sc.trade.setEquipID(firstItem.id);
                    sc.trade.setBuffText("", false);
                    sc.trade.setInfoText("", true)
                } else {
                    sc.trade.setInfoText("", true);
                    sc.trade.setBuffText("", true);
                    sc.trade.setEquipID(-1, true)
                }
            }.bind(this));
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(drawables) {
            this.parent(drawables)
        },
        onSelection: function(button) {
            var isEquip = false;
            if (button.data) {
                if (button.data.id) {
                    if (sc.inventory.isBuffID(button.data.id)) {
                        sc.trade.setEquipID(-1);
                        sc.trade.setBuffText(sc.inventory.getBuffString(button.data.id), false, button.data.id)
                    } else if (sc.inventory.isEquipID(button.data.id)) {
                        sc.trade.setEquipID(button.data.id);
                        isEquip = true
                    } else {
                        sc.trade.setEquipID(-1);
                        sc.trade.setBuffText("", false)
                    }
                    if (!isEquip) {
                        var firstItem = sc.trade.getCurrentOffer().get[0];
                        if (sc.inventory.isEquipID(firstItem.id)) {
                            sc.trade.setEquipID(firstItem.id);
                            sc.trade.setBuffText("", false)
                        }
                    }
                } else {
                    sc.trade.setEquipID(-1);
                    sc.trade.setBuffText("", false)
                }
                if (button.data.description) {
                    if (button.data.key == "trade" && !isEquip) {
                        firstItem = sc.trade.getCurrentOffer().get[0];
                        if (sc.inventory.isEquipID(firstItem.id)) {
                            sc.trade.setEquipID(firstItem.id);
                            sc.trade.setBuffText("", false)
                        }
                    }
                    sc.trade.setInfoText(button.data.description)
                }
            }
        },
        showMenu: function() {
            sc.Model.removeObserver(sc.trade, this);
            sc.Model.addObserver(sc.trade, this);
            this._createContent();
            sc.trade.buttonInteract.pushButtonGroup(this.buttongroup);
            sc.trade.buttonInteract.addGlobalButton(this.tradeButton, this._onTradeButtonCheck.bind(this));
            this.arrow.doStateTransition("DEFAULT", false, false, null, 0.1);
            this.doStateTransition("DEFAULT")
        },
        hideMenu: function() {
            sc.Model.removeObserver(sc.trade,
                this);
            sc.trade.buttonInteract.removeButtonGroup(this.buttongroup);
            this.doStateTransition("HIDDEN")
        },
        doTrade: function() {
            if (sc.trade.canTrade())
                if (sc.trade.hasEquippedTrade) {
                    sc.BUTTON_SOUND.submit.play();
                    sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.trade.equipInfo"), sc.DIALOG_INFO_ICON.WARNING, function(result) {
                        if (result.data == 0) {
                            sc.BUTTON_SOUND.shop_cash.play();
                            sc.trade.unequipTradeItems();
                            sc.trade.doTrade(this.money.money);
                            this.requireItems.updateTradeItemButtons();
                            this.getItems.updateTradeItemButtons(true);
                            this.money.updateValues();
                            sc.trade.canTrade() || this.tradeButton.setActive(false)
                        } else sc.BUTTON_SOUND.back.play()
                    }.bind(this), true)
                } else {
                    sc.BUTTON_SOUND.shop_cash.play();
                    sc.trade.doTrade(this.money.money);
                    sc.trade.clearEquippedState();
                    this.requireItems.updateTradeItemButtons();
                    this.getItems.updateTradeItemButtons(true);
                    this.money.updateValues();
                    sc.trade.canTrade() || this.tradeButton.setActive(false)
                }
            else ig.error("Wat.")
        },
        modelChanged: function(model, msg) {
            model == sc.trade && msg == sc.TRADE_MODEL_EVENT.OFFER_CHANGED &&
                this._setOffer()
        },
        _onTradeButtonCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        _setOffer: function() {
            sc.trade.clearEquippedState();
            this.buttongroup.clear();
            var offer = sc.trade.getCurrentOffer();
            this.buttongroup.addFocusGui(this.tradeButton, 0, 0);
            var index = 1,
                offsetY, getItems = offer.get;
            offsetY = 17 + (this.getItems.setContent(getItems, this.buttongroup, index, true) + 10);
            this.arrow.setPos(6, 44 + (getItems.length - 1) * 20);
            this.forText.setPos(32, offsetY - 7);
            this.ownedText.setPos(4, offsetY - 7);
            index = index + getItems.length;
            getItems = offer.require;
            this.requireItems.setPos(25, offsetY);
            offsetY = offsetY + (this.requireItems.setContent(getItems,
                this.buttongroup, index) + 5);
            this.money.setContent(offer.get, offer.scale, offer.cost, offsetY);
            sc.trade.canTrade() ? this.tradeButton.setActive(true) : this.tradeButton.setActive(false);
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, 0) : this.buttongroup.focusCurrentButton(0, 0, false, true);
            this.setSize(227, 216);
            offer = sc.trade.getCurrentOffer().get[0];
            if (sc.inventory.isEquipID(offer.id)) {
                sc.trade.setEquipID(offer.id);
                sc.trade.setBuffText("", false)
            }
            this.arrow.doStateTransition("HIDDEN", true);
            this.arrow.doStateTransition("DEFAULT")
        },
        _createContent: function() {
            var offsetY = 10,
                gui = new sc.TextGui(ig.lang.get("sc.gui.trade.trade"), {
                    font: sc.fontsystem.tinyFont
                });
            gui.setPos(8, offsetY);
            this.addChildGui(gui);
            gui = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
                font: sc.fontsystem.tinyFont
            });
            gui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            gui.setPos(26, offsetY);
            this.addChildGui(gui);
            var offsetY = offsetY + 7,
                gui = sc.trade.options[0],
                offer = gui.get,
                index = 1;
            this.getItems = new sc.TradeItemBox(offer, this.buttongroup, index, 200, true);
            this.getItems.setPos(2, offsetY);
            this.addChildGui(this.getItems);
            index = index + offer.length;
            offsetY =
                offsetY + (this.getItems.hook.size.y + 3);
            this.forText = new sc.TextGui(ig.lang.get("sc.gui.trade.for"), {
                font: sc.fontsystem.tinyFont
            });
            this.forText.setPos(32, offsetY);
            this.addChildGui(this.forText);
            this.ownedText = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
                font: sc.fontsystem.tinyFont
            });
            this.ownedText.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.ownedText.setPos(4, offsetY);
            this.addChildGui(this.ownedText);
            offsetY = offsetY + 7;
            offer = gui.require;
            this.requireItems = new sc.TradeItemBox(offer, this.buttongroup, index, 200);
            this.requireItems.setPos(25,
                offsetY);
            this.addChildGui(this.requireItems);
            this.arrow = new ig.ImageGui(this.ninepatch.gfx, 432, 256, 16, 17);
            this.arrow.setPos(6, 44 + (gui.get.length - 1) * 20);
            this.arrow.setPivot(16, 17);
            this.arrow.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        scaleX: 0.2,
                        scaleY: 0.5,
                        offsetY: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.arrow.doStateTransition("HIDDEN", true);
            this.addChildGui(this.arrow);
            offsetY = offsetY + (this.requireItems.hook.size.y + 5);
            this.money = new sc.TradeMoneyGui(gui.get, gui.scale ||
                1, gui.cost);
            this.money.setPos(2, offsetY);
            this.addChildGui(this.money);
            this.tradeButton = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.trade.trade"));
            this.tradeButton.setData({
                key: "trade",
                description: ig.lang.get("sc.gui.trade.description")
            });
            this.tradeButton.keepMouseFocus = true;
            this.tradeButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.tradeButton.setPos(0, 5);
            this.tradeButton.submitSound = null;
            this.tradeButton.onButtonPress = function() {
                this.doTrade()
            }.bind(this);
            this.addChildGui(this.tradeButton);
            this.buttongroup.addFocusGui(this.tradeButton, 0, 0);
            sc.trade.canTrade() || this.tradeButton.setActive(false);
            offsetY = offsetY + (this.tradeButton.hook.size.y + 5);
            this.setSize(227, 216)
        }
    });
    sc.TradeOfferDisplay = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    offsetY: -48
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        offerText: null,
        cycleLeft: null,
        cycleRight: null,
        offerToken: null,
        init: function() {
            this.parent();
            this.setSize(151, 21);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.setPos(44, 27);
            this.hook.localAlpha = 0.8;
            this.offerToken = ig.lang.get("sc.gui.trade.offer");
            this.offerText = new sc.TextGui("");
            this.offerText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.offerText);
            this.cycleLeft = new sc.ButtonGui("\\i[arrow-left]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleLeft.keepMouseFocus = true;
            this.cycleLeft.setPos(-27, 0);
            this.cycleLeft.onButtonPress = function() {
                this._cycleOffers(-1)
            }.bind(this);
            this.addChildGui(this.cycleLeft);
            this.cycleRight = new sc.ButtonGui("\\i[arrow-right]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.cycleRight.keepMouseFocus = true;
            this.cycleRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.cycleRight.setPos(-27, 0);
            this.cycleRight.onButtonPress = function() {
                this._cycleOffers(1)
            }.bind(this);
            this.addChildGui(this.cycleRight);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(drawables) {
            drawables.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        showMenu: function() {
            if (!(sc.trade.options.length < 2)) {
                sc.trade.buttonInteract.addGlobalButton(this.cycleLeft,
                    this.onLeftPressCheck.bind(this));
                sc.trade.buttonInteract.addGlobalButton(this.cycleRight, this.onRightPressCheck.bind(this));
                this.offerText.setText(this.offerToken + " " + (sc.trade.tradeIndex + 1) + " / " + sc.trade.options.length);
                this.doStateTransition("DEFAULT")
            }
        },
        hideMenu: function() {
            sc.trade.options.length < 2 || this.doStateTransition("HIDDEN")
        },
        _cycleOffers: function(direction) {
            var newIndex = sc.trade.tradeIndex + direction;
            direction < 0 ? newIndex < 0 && (newIndex = sc.trade.options.length - 1) : direction > 0 && newIndex >= sc.trade.options.length && (newIndex = 0);
            sc.trade.setActiveOffer(newIndex);
            this.offerText.setText(this.offerToken +
                " " + (sc.trade.tradeIndex + 1) + " / " + sc.trade.options.length)
        },
        onLeftPressCheck: function() {
            return sc.control.menuCircleLeft()
        },
        onRightPressCheck: function() {
            return sc.control.menuCircleRight()
        }
    })
});
ig.baked = !0;
