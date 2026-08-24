/**
 * @module game.feature.menu.gui.trade.trade-misc
 * @description Trader menu helpers: sc.TradeButtonBox (trader header row with
 *   character + location), sc.TradeEntryButton, sc.TradeCharacterView, and
 *   sc.TradeDetailsView (the get-for-require offer detail overlay).
 */
ig.module("game.feature.menu.gui.trade.trade-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.trade.gui.trade-dialog", "game.feature.npc.gui.npc-display-gui").defines(function() {
	sc.TradeButtonBox = ig.GuiElementBase.extend({
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
		trader: null,
		buttongroup: null,
		buttonStartIndex: 0,
		buttons: [],
		character: null,
		traderName: null,
		location: null,
		init: function(traderId, buttongroup, buttonStartIndex) {
			this.parent();
			this.setSize(431, 46);
			this.trader = traderId;
			this.buttongroup = buttongroup;
			this.buttonStartIndex = buttonStartIndex || 0;
			buttongroup = sc.trade.getTrader(traderId);
			traderId = sc.trade.getFoundTrader(traderId);
			this.character = new sc.TradeCharacterView;
			this.character.setPos(2, 1);
			this.character.setCharacter(traderId.characterName);
			this.addChildGui(this.character);
			this.traderName = new sc.TextGui(ig.LangLabel.getText(buttongroup.name));
			this.traderName.setPos(36, 1);
			this.addChildGui(this.traderName);
			buttongroup = new ig.ImageGui(this.gfx, 481, 224, 8, 11);
			buttongroup.setPos(37, 20);
			this.addChildGui(buttongroup);
			this.location = new sc.TextGui((traderId.area || "???") + " - " + (traderId.map || "???"), {
				font: sc.fontsystem.smallFont
			});
			this.location.setPos(50, 19);
			this.addChildGui(this.location)
		}
	});
	sc.TradeEntryButton = sc.TradeItem.extend({
		offer: 0,
		trader: null,
		init: function(name, trader, offer, itemId, description, owned, amount, level) {
			this.parent(name, itemId, description, owned, amount, true, level);
			this.offer = offer || 0;
			this.trader = trader || null
		}
	});
	sc.TradeCharacterView = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/menu.png", {
			width: 2,
			height: 2,
			left: 5,
			top: 5,
			right: 5,
			bottom: 5,
			offsets: {
				"default": {
					x: 488,
					y: 16
				},
				square: {
					x: 500,
					y: 0
				},
				none: {
					x: 400,
					y: 0
				}
			}
		}),
		display: null,
		container: null,
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE
			}
		},
		init: function() {
			this.parent(31, 42);
			this.container = new ig.GuiElementBase;
			this.container.hook.clip = true;
			this.container.setSize(31, 42);
			this.container.setPos(1, 1);
			this.addChildGui(this.container)
		},
		setCharacter: function(character, hide) {
			if (character) {
				if (this.display) {
					this.display.remove(true);
					this.display = null
				}
				if (character) {
					this.display = new sc.NPCDisplayGui(character, true, null, this.centerNPC.bind(this));
					this.container.addChildGui(this.display);
					this.doStateTransition("DEFAULT", true)
				}
			} else {
				if (this.display) {
					hide ? this.display.remove(true) : this.display.doStateTransition("HIDDEN", false, true);
					this.display = null
				}
				this.doStateTransition("HIDDEN", true)
			}
		},
		centerNPC: function(display) {
			display.npc && display.setPos(this.container.hook.size.x / 2 - display.hook.size.x / 2 - 1, this.container.hook.size.y / 2 - display.hook.size.y / 2)
		}
	});
	sc.TradeDetailsView = ig.BoxGui.extend({
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
			},
			HIDDEN_SCALE: {
				state: {
					alpha: 0,
					scaleY: 0.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN_MOVE: {
				state: {
					alpha: 0,
					offsetX: 218
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		ninepatch: new ig.NinePatch("media/gui/menu.png", {
			width: 10,
			height: 11,
			left: 34,
			top: 44,
			right: 5,
			bottom: 3,
			offsets: {
				"default": {
					x: 592,
					y: 160
				}
			}
		}),
		sizeTransition: null,
		container: null,
		box: null,
		character: null,
		name: null,
		location: null,
		arrowRight: null,
		arrow: null,
		getGui: null,
		requireGui: null,
		moneyGui: null,
		_trader: null,
		init: function() {
			this.parent();
			this.setSize(228, 220);
			this.setPos(66, 67);
			this.setPivot(0, 110);
			this.annotation = [];
			this.annotation[0] = {
				content: {
					title: "sc.gui.menu.help.trader.titles.info",
					description: "sc.gui.menu.help.trader.description.info"
				},
				offset: {
					x: 1,
					y: 1
				},
				size: {
					x: 227,
					y: 45
				},
				index: {
					x: 0,
					y: 0
				}
			};
			this.annotation[1] = {
				content: {
					title: "sc.gui.menu.help.trader.titles.content",
					description: "sc.gui.menu.help.trader.description.content"
				},
				offset: {
					x: 1,
					y: 52
				},
				size: {
					x: 227,
					y: 118
				},
				index: {
					x: 0,
					y: 1
				}
			};
			this.annotation[2] = {
				content: {
					title: "sc.gui.menu.help.trader.titles.money",
					description: "sc.gui.menu.help.trader.description.money"
				},
				offset: {
					x: 1,
					y: 180
				},
				size: {
					x: 227,
					y: 39
				},
				index: {
					x: 0,
					y: 2
				}
			};
			this.character = new sc.TradeCharacterView;
			this.character.currentTileOffset = "square";
			this.character.setPos(3, 2);
			this.addChildGui(this.character);
			this.arrowRight = new ig.ImageGui(this.ninepatch.gfx, 576, 184, 9, 15);
			this.arrowRight.setPos(229, 0);
			this.name = new sc.TextGui("");
			this.name.setPos(37, 2);
			this.addChildGui(this.name);
			var icon = new ig.ImageGui(this.ninepatch.gfx, 481, 224, 8, 11);
			icon.setPos(38, 21);
			this.addChildGui(icon);
			this.location = new sc.TextGui("", {
				font: sc.fontsystem.smallFont
			});
			this.location.setPos(51, 20);
			this.addChildGui(this.location);
			this.container = new ig.GuiElementBase;
			this.container.setPos(2, 44);
			this.container.setSize(225, 174);
			this.addChildGui(this.container);
			icon = new ig.ColorGui("#7e7e7e", 224, 1);
			this.container.addChildGui(icon);
			icon = new sc.TextGui(ig.lang.get("sc.gui.trade.trade"), {
				font: sc.fontsystem.tinyFont
			});
			icon.setPos(8, 2);
			this.container.addChildGui(icon);
			icon = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
				font: sc.fontsystem.tinyFont
			});
			icon.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			icon.setPos(25, 2);
			this.container.addChildGui(icon);
			this.getGui = new sc.TradeItemBox(null, null, null, 200);
			this.getGui.dividerColor = "#7e7e7e";
			this.getGui.setPos(1, 9);
			this.container.addChildGui(this.getGui);
			this.forText = new sc.TextGui(ig.lang.get("sc.gui.trade.for"), {
				font: sc.fontsystem.tinyFont
			});
			this.forText.setPos(32, 9);
			this.container.addChildGui(this.forText);
			this.ownedText = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
				font: sc.fontsystem.tinyFont
			});
			this.ownedText.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.ownedText.setPos(4, 9);
			this.container.addChildGui(this.ownedText);
			this.requireGui = new sc.TradeItemBox(null, null, null, 200);
			this.requireGui.dividerColor = "#7e7e7e";
			this.requireGui.setPos(24, 9);
			this.container.addChildGui(this.requireGui);
			this.arrow = new ig.ImageGui(this.ninepatch.gfx, 432, 256, 16, 17);
			this.arrow.setPos(5, 36);
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
			this.container.addChildGui(this.arrow);
			this.moneyGui = new sc.TradeMoneyGui(null, null, null, false);
			this.moneyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.moneyGui.dividerColor = "#7e7e7e";
			this.moneyGui.setPos(1, 0);
			this.container.addChildGui(this.moneyGui);
			this.doStateTransition("HIDDEN", true)
		},
		setTraderData: function(traderId, offerIndex, scrollOffset) {
			var trader = sc.trade.getTrader(traderId),
				found = sc.trade.getFoundTrader(traderId);
			if (this._trader != traderId) {
				this.character.setCharacter(found.characterName, true);
				this.name.setText(ig.LangLabel.getText(trader.name));
				this.location.setText((found.area || "???") + " - " + (found.map || "???"));
				this._trader = traderId
			}
			this.arrowRight.hook.pos.y = scrollOffset + 3;
			traderId = trader.options[offerIndex];
			offerIndex = traderId.get;
			scrollOffset = 9 + (this.getGui.setContent(offerIndex, null, null, true) + 10);
			this.forText.setPos(32, scrollOffset - 7);
			this.ownedText.setPos(4, scrollOffset - 7);
			this.arrow.setPos(5, 36 + (offerIndex.length - 1) * 20);
			offerIndex = traderId.require;
			this.requireGui.setPos(24, scrollOffset);
			this.requireGui.setContent(offerIndex);
			this.moneyGui.setContent(traderId.get, traderId.scale, traderId.cost, 0)
		},
		reset: function() {
			this.doStateTransition("HIDDEN", true);
			this._trader = null
		},
		show: function(traderId, offerIndex, scrollOffset) {
			this.doStateTransition("HIDDEN_SCALE", true);
			this.doStateTransition("DEFAULT");
			this.setTraderData(traderId, offerIndex, scrollOffset)
		},
		hide: function(skipScale) {
			this._trader = null;
			sc.menu.tradeToggle ? this.doStateTransition("HIDDEN_MOVE") : this.doStateTransition(skipScale ? "HIDDEN_SCALE" : "HIDDEN")
		}
	})
});
ig.baked = !0;
