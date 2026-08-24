/**
 * @module game.feature.menu.gui.trade.trader-list
 * @description The Trader menu's tabbed trader list (sc.TradersListBox): one
 *   tab per area, trader rows with their offers (get/require item rows),
 *   buff/info texts and trade-detail entry.
 */
ig.module("game.feature.menu.gui.trade.trader-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.trade.trade-misc").defines(function() {
	var synopData = {
		trader: null,
		offer: void 0,
		index: 0
	};
	sc.TradersListBox = sc.ListTabbedPane.extend({
		submitSound: null,
		init: function() {
			this.parent(true);
			this.setSize(436, 258);
			this.setPivot(436, 258);
			this.setPanelSize(436, 242);
			this.setPos(0, 0);
			this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.submitSound = sc.BUTTON_SOUND.submit;
			this.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: 218
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.bg.setSize(this.hook.size.x, 222);
			var label = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
				font: sc.fontsystem.tinyFont
			});
			label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			label.setPos(2, -8);
			this.bg.addChildGui(label);
			for (var areas = sc.map.getUnlockedAreas(), areas = sc.map.sortAreaList(areas), index = 0, i = 0; i < areas.length; i++) sc.trade.hasAreaTraders(areas[i]) && sc.trade.hasTraderInArea(areas[i]) && this.addTab(areas[i], index++, {
				type: areas[i]
			})
		},
		addObservers: function() {
			sc.Model.addObserver(sc.menu, this)
		},
		removeObservers: function() {
			sc.Model.removeObserver(sc.menu, this)
		},
		show: function() {
			this.parent();
			this.setTab(this.currentTabIndex || 0, true, {
				skipSounds: true
			});
			ig.interact.setBlockDelay(0.2);
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.parent();
			this.doStateTransition("HIDDEN")
		},
		getCurrentSortText: function() {
			var sortType = null,
				sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.TRADE_SORT_TYPE.ORDER : sc.TRADE_SORT_TYPE.ORDER,
				sortText = "auto";
			switch (sortType) {
				case sc.TRADE_SORT_TYPE.ORDER:
					sortText = "auto";
					break;
				case sc.TRADE_SORT_TYPE.FOUND:
					sortText = "trader"
			}
			return ig.lang.get("sc.gui.menu.sort." + sortText)
		},
		onLeftRightPress: function(button, tabIndex) {
			tabIndex != this.currentTabIndex && this.submitSound.play();
			return {
				skipSounds: true
			}
		},
		onTabChanged: function() {
			(ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
		},
		onTabButtonCreation: function(key, button, data) {
			button = sc.map.getAreaName(key, true);
			key = "area-" + key;
			sc.fontsystem.hasIcon(key) || (key = "enemy-abstract");
			key = new sc.ItemTabbedBox.TabButton(button, key, 128);
			key.textChild.setPos(7, 1);
			key.setPos(0, 2);
			key.setData({
				type: data.type
			});
			this.addChildGui(key);
			return key
		},
		onTabPressed: function(button, skip) {
			if (!skip) {
				this.submitSound.play();
				this.setTab(this.getButtonIndex(button));
				for (var i = this.tabArray.length; i--;)
					if (button == this.tabArray[i]) {
						sc.menu.setSynoTab(i);
						break
					} sc.menu.setSynopInfo(null, true);
				return false
			}
		},
		onTabSelected: function() {
			ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
		},
		onTabMouseFocusLost: function() {
			sc.menu.setSynopInfo(null, true)
		},
		onCreateListEntries: function(buttonList, categoryButtons, area, sortType) {
			var entry = null,
				item = null,
				offset = -1,
				trader = null,
				offer = item = null,
				area = sc.trade.getFoundTraders(area, sortType);
			buttonList.setSize(436, 222);
			buttonList.paddingBetween = 0;
			buttonList.paddingTop = 2;
			buttonList.clear();
			categoryButtons.clear();
			if (buttonList.traderInfoGui) buttonList.traderInfoGui.removeAllChildren();
			else {
				buttonList.traderInfoGui = new ig.GuiElementBase;
				buttonList.box.insertChildGui(buttonList.traderInfoGui, 0);
				buttonList.forceLastScroll = true
			}
			for (var y = 1, i = 0; i < area.length; i++) {
				trader = area[i];
				if (!this.hasAnyUpgrades(trader)) {
					item = sc.trade.getTrader(trader);
					offer = item.options;
					item = new sc.TradeButtonBox(trader, categoryButtons, buttonList.getChildren().length);
					item.setPos(1, y);
					buttonList.traderInfoGui.addChildGui(item);
					for (var rowHeight = 0, o = 0; o < offer.length; o++) {
						var gets = offer[o].get;
						if (gets[0]) {
							var itemId = gets[0].id,
								entry = gets[0].amount,
								gets = sc.inventory.getItem(itemId),
								owned = sc.model.player.getItemAmountWithEquip(itemId),
								name = sc.inventory.getItemNameWithIcon(itemId),
								description = sc.inventory.getItemDescription(itemId),
								level = 0;
							gets.type == sc.ITEMS_TYPES.EQUIP && (level = gets.level || 0);
							entry = new sc.TradeEntryButton(name, trader, o, itemId, description, owned, entry, level);
							buttonList.addButton(entry);
							entry.hook.pos.x = 234;
							if (o == 0) entry.hook.pos.y = y + 1
						}
						rowHeight = rowHeight + entry.hook.size.y
					}
					item.hook.size.y = Math.max(rowHeight + 1, 44);
					y = y + (item.hook.size.y + 2);
					if (i != area.length - 1) {
						trader = new ig.ColorGui("#545454", 433, 1);
						trader.setPos(0, y - 1);
						buttonList.traderInfoGui.addChildGui(trader)
					} else y = y - 2;
					y = y + 1
				}
			}
			buttonList.traderInfoGui.hook.size.y = y;
			buttonList.updateContentHeight()
		},
		hasAnyUpgrades: function(traderId) {
			traderId = sc.trade.getTrader(traderId);
			return traderId.child ? sc.trade.hasTrader(traderId.child) : false
		},
		onListEntrySelected: function(entry) {
			if (entry.offer != void 0) {
				if (entry.trader) {
					synopData.trader = entry.trader;
					synopData.offer = entry.offer;
					synopData.index = entry.hook.pos.y;
					sc.menu.setSynopInfo(synopData)
				}
				entry.data && entry.data.description ? sc.menu.setInfoText(entry.data.description) : sc.menu.setInfoText(null, true);
				sc.inventory.isBuffID(entry.data.id) ? sc.menu.setBuffText(sc.inventory.getBuffString(entry.data.id)) : sc.menu.setBuffText("", false)
			} else {
				sc.menu.setBuffText("", false);
				sc.menu.setSynopInfo(void 0);
				entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
			}
		},
		onListEntryPressed: function(entry) {
			if (entry.trader && entry.offer != void 0 && !sc.menu.tradeToggle) {
				this.submitSound.play();
				sc.menu.enterTradeDetails()
			}
		},
		onListMouseFocusLost: function() {
			sc.menu.setSynopInfo(null, true);
			sc.menu.setInfoText(null, true);
			sc.menu.setBuffText("", false)
		},
		modelChanged: function(model, event, data) {
			if (model == sc.menu && event == sc.MENU_EVENT.SORT_LIST) {
				sc.menu.setSynopInfo(null, true);
				sc.menu.setInfoText(null, true);
				sc.menu.setBuffText("", false);
				this.sort(data.sortType)
			}
		}
	})
});
ig.baked = !0;
