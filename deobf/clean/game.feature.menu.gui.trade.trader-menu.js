/**
 * @module game.feature.menu.gui.trade.trader-menu
 * @description The Trader menu container (sc.TraderMenu): trader list + trade
 *   details view, entering/exiting the per-offer detail overlay.
 */
ig.module("game.feature.menu.gui.trade.trader-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.trade.trade-model", "game.feature.menu.gui.trade.trader-list", "game.feature.menu.gui.trade.trade-misc").defines(function() {
	sc.TraderMenu = sc.ListInfoMenu.extend({
		detail: null,
		init: function() {
			this.parent(new sc.TradersListBox);
			this.detail = new sc.TradeDetailsView;
			this.addChildGui(this.detail);
			this.sortMenu.addButton("auto", sc.TRADE_SORT_TYPE.ORDER, 0);
			this.sortMenu.addButton("trader", sc.TRADE_SORT_TYPE.FOUND, 1);
			this.list.setPos(0, 0);
			this.doStateTransition("DEFAULT")
		},
		showMenu: function() {
			sc.menu.setSynopInfo(null, false);
			this.detail.reset();
			this.parent();
			this.updateSortMenuButton(this.list.getCurrentSortText())
		},
		exitMenu: function() {
			this.parent();
			this.detail.hide();
			sc.menu.setBuffText("", false);
			sc.menu.tradeToggle = false;
			ig.cleanCache()
		},
		enterDetails: function() {
			var info = sc.menu.synopInfo;
			this.detail.show(info.trader, info.offer, info.index - this.list.currentList.getScrollY());
			sc.menu.pushBackCallback(this.onDetailsBackPressed.bind(this))
		},
		setTradeInfo: function() {
			var info = sc.menu.synopInfo;
			this.detail.setTraderData(info.trader, info.offer, info.index - this.list.currentList.getScrollY())
		},
		exitDetails: function() {
			this.detail.hide(true)
		},
		onDetailsBackPressed: function() {
			sc.menu.popBackCallback();
			sc.menu.exitTradeDetails()
		},
		createHelpGui: function() {
			if (!this.helpGui) {
				this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.traders.title"), ig.lang.get("sc.gui.menu.help-texts.traders.pages"), function() {
					this.commitHotKeysToTopBar(true)
				}.bind(this), true);
				this.helpGui.hook.zIndex = 15E4;
				this.helpGui.hook.pauseGui = true
			}
		},
		modelChanged: function(model, event, data) {
			if (model == sc.menu)
				if (event == sc.MENU_EVENT.SORT_LIST) this.updateSortMenuButton(data.text);
				else if (event == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
				this.sortMenu.active && this.sortMenu.hideSortMenu();
				this.updateSortMenuButton(this.list.getCurrentSortText())
			} else event == sc.MENU_EVENT.TRADE_TOGGLE_DETAILS ? sc.menu.tradeToggle ? this.enterDetails() : this.exitDetails() : event == sc.MENU_EVENT.SYNOP_SET_INFO &&
				sc.menu.tradeToggle && sc.menu.synopInfo && this.setTradeInfo()
		}
	})
});
ig.baked = !0;
