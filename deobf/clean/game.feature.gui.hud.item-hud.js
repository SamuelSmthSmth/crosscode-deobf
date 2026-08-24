/**
 * @module game.feature.gui.hud.item-hud
 * @description sc.ItemHudBox: the right-HUD box that lists obtained items
 *   with icon, name and amount, auto-hiding after a short timer.
 */
ig.module("game.feature.gui.hud.item-hud").requires("game.feature.gui.hud.right-hud", "game.feature.model.options-model").defines(function() {
	sc.ItemContent = ig.GuiElementBase.extend({
		timer: 0,
		id: -1,
		amount: 0,
		textGui: null,
		amountGui: null,
		init: function(id, amount) {
			this.parent();
			this.id = id == void 0 ? -1 : id;
			this.amount = amount || 1;
			this.timer = 3;
			var item = sc.inventory.items[id],
				text = "\\i[" + ((item.icon || "item-default") + sc.inventory.getRaritySuffix(item.rarity || 0)) + "]" + ig.LangLabel.getText(item.name) + " x",
				normal = sc.options.get("item-hud-size") == sc.ITEM_HUD_SIZE.NORMAL;
			this.textGui = new sc.TextGui(text, {
				speed: ig.TextBlock.SPEED.IMMEDIATE,
				font: normal ? sc.fontsystem.font : sc.fontsystem.smallFont
			});
			this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.amountGui = new sc.NumberGui(99, {
				size: normal ? sc.NUMBER_SIZE.TEXT : sc.NUMBER_SIZE.SMALL
			});
			this.amountGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.amountGui.setNumber(this.amount);
			this.addChildGui(this.textGui);
			this.addChildGui(this.amountGui);
			this.increaseNumber(0);
			this.setSize(this.textGui.hook.size.x + this.amountGui.hook.size.x + 4, normal ? 18 : 8);
			this.hook.pivot.x = this.hook.size.x;
			this.hook.pivot.y = 0
		},
		updateOption: function(normal) {
			if (normal) {
				if (this.textGui.font == sc.fontsystem.font) return;
				this.textGui.setFont(sc.fontsystem.font);
				this.amountGui.setSize(sc.NUMBER_SIZE.TEXT)
			} else {
				if (this.textGui.font == sc.fontsystem.smallFont) return;
				this.textGui.setFont(sc.fontsystem.smallFont);
				this.amountGui.setSize(sc.NUMBER_SIZE.SMALL)
			}
			this.setSize(this.textGui.hook.size.x + this.amountGui.hook.size.x + 4, normal ? 18 : 8)
		},
		updateTimer: function() {
			if (this.timer > 0) this.timer = this.timer - ig.system.tick
		},
		increaseNumber: function(amount, instant) {
			this.amount = this.amount + (amount || 0);
			this.amountGui.setNumber(this.amount, instant);
			this.timer = 3
		}
	});
	sc.ItemHudBox = sc.RightHudBoxGui.extend({
		delayedStack: [],
		size: 0,
		init: function() {
			this.parent(ig.lang.get("sc.gui.item-hud.title"));
			this.size = sc.options.get("item-hud-size");
			sc.Model.addObserver(sc.model.player, this);
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.options, this)
		},
		addEntry: function(id, amount) {
			var entry = null;
			if ((entry = this._isInEntries(id)) != null) entry.increaseNumber(amount, this.contentEntries.length <= 5);
			else {
				entry = new sc.ItemContent(id, amount);
				this.contentEntries.length >= 5 ? this.delayedStack.push(entry) : this.pushContent(entry, true);
				this.hidden && this.show()
			}
		},
		update: function() {
			if (!sc.model.isPaused() && !sc.model.isMenu() && !this.hidden) {
				for (var i = this.contentEntries.length, entry = null; i--;) {
					entry = this.contentEntries[i].subGui;
					entry.updateTimer();
					if (entry.timer <= 0) {
						entry = this.removeContent(i);
						if (i == 0 && this.contentEntries.length == 0) entry.hook.pivot.y = entry.hook.size.y / 2;
						else {
							entry.hook.pivot.y = 0;
							entry.hook.anim.timeFunction = KEY_SPLINES.EASE_OUT
						}
						this._popDelayed()
					}
				}!this.hidden && this.contentEntries.length == 0 && this.hide()
			}
		},
		_isInEntries: function(id) {
			for (var i = this.contentEntries.length; i--;)
				if (this.contentEntries[i].subGui.id == id) return this.contentEntries[i].subGui;
			for (i = this.delayedStack.length; i--;)
				if (this.delayedStack[i].id == id) return this.delayedStack[i];
			return null
		},
		_popDelayed: function() {
			if (this.delayedStack.length != 0) {
				var entry = this.delayedStack.splice(0, 1)[0];
				this.pushContent(entry, true)
			}
		},
		_updateSizes: function(normal) {
			for (var i = this.contentEntries.length, entry = null; i--;) {
				entry = this.contentEntries[i];
				entry.subGui.updateOption(normal);
				entry.setContent(entry.subGui)
			}
			this.rearrangeContent()
		},
		modelChanged: function(model, msg, data) {
			if (model == sc.model.player) msg == sc.PLAYER_MSG.ITEM_OBTAINED && sc.options.get("show-items") && !data.skip && this.addEntry(data.id, data.amount, data.cutscene);
			else if (model == sc.model)
				if (model.isReset()) {
					this.clearContent();
					this.delayedStack.length = 0;
					this.hide()
				} else model.isCutscene() || model.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() ? this.hide() : !model.isCutscene() && (!model.isHUDBlocked() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
			else if (model == sc.options && msg == sc.OPTIONS_EVENT.OPTION_CHANGED) {
				model = sc.options.get("item-hud-size");
				if (model != this.size) {
					this._updateSizes(model == sc.ITEM_HUD_SIZE.NORMAL);
					this.size = model
				}
			}
		}
	})
});
ig.baked = !0;
