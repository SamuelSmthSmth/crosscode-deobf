/**
 * @module game.feature.menu.gui.lore.lore-list
 * @description The Lore menu's tabbed list pane: story / people / cross-lore / earth-lore
 *   tabs, sort handling, and new-unlock badges. Subclass of sc.ListTabbedPane.
 */
ig.module("game.feature.menu.gui.lore.lore-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.lore.lore-misc").defines(function() {
	var parentLoreKeys = [];
	ig.perf.fullLoreList = false;
	sc.LoreListBoxNew = sc.ListTabbedPane.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		submitSound: null,
		favSound: null,
		errorSound: null,
		completion: null,
		newList: [],
		init: function() {
			this.parent(true);
			this.setSize(264, 262);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.setPivot(264, 262);
			this.setPanelSize(264, 243);
			this.favSound = this.submitSound = sc.BUTTON_SOUND.submit;
			this.errorSound = sc.BUTTON_SOUND.denied;
			this.completion = new sc.TextGui(ig.lang.get("sc.gui.menu.lore.completion"), {
				font: sc.fontsystem.tinyFont
			});
			this.completion.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.1,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: 4
					},
					time: 0.1,
					timeFunction: KEY_SPLINES.EASE
				}
			};
			this.completion.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.completion.setPos(4, -8);
			this.bg.addChildGui(this.completion);
			this.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: -132
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN_EASE: {
					state: {
						alpha: 0,
						offsetX: -132
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				}
			};
			this.addTab("story", 0, {
				type: sc.LORE_CATERGORIES.STORY
			});
			this.addTab("people", 1, {
				type: sc.LORE_CATERGORIES.CHARACTERS
			});
			this.addTab("cross-lore", 2, {
				type: sc.LORE_CATERGORIES.CROSS_LORE
			});
			this.addTab("earth-lore", 3, {
				type: sc.LORE_CATERGORIES.EARTH_LORE
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
			this.canShowCompletion(this.currentTabIndex) ? this.completion.doStateTransition("DEFAULT", true) : this.completion.doStateTransition("HIDDEN", true);
			for (var tab in this.tabs) this.tabs[tab].newUnlock.deactivate(false);
			var unlocks = sc.menu.newUnlocks[sc.MENU_SUBMENU.LORE];
			for (var i = unlocks.length; i--;) {
				var lore = sc.lore.getLore(unlocks[i]);
				if (lore)(lore = this.tabs[this.keys[sc.LORE_CATERGORIES[lore.category]]]) && lore.newUnlock.activate()
			}
			ig.interact.setBlockDelay(0.2);
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.parent();
			for (var i = this.newList.length; i--;) {
				this.newList[i].clearOverlay();
				sc.menu.clearNewUnlock(sc.MENU_SUBMENU.LORE, this.newList[i].key)
			}
			this.newList.length = 0;
			this.doStateTransition("HIDDEN")
		},
		getCurrentSortText: function() {
			var sortType = null,
				sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.LORE_SORT_TYPE.ORDER : sc.LORE_SORT_TYPE.ORDER,
				sortText = "auto";
			switch (sortType) {
				case sc.LORE_SORT_TYPE.ORDER:
					sortText = "auto";
					break;
				case sc.LORE_SORT_TYPE.NAME:
					sortText = "name";
					break;
				case sc.LORE_SORT_TYPE.UNLOCKED:
					sortText = "unlocked"
			}
			return ig.lang.get("sc.gui.menu.sort." + sortText)
		},
		onListEntryPressed: function(entry) {
			sc.menu.setSynopFocus(entry)
		},
		onLeftRightPress: function(a, b, direction) {
			this.submitSound.play();
			sc.menu.switchSynopsisPage(direction == 1 ? 1 : -1);
			return {
				skipSounds: true
			}
		},
		onTabChanged: function(tab) {
			sc.menu.setSynoTab(tab);
			(ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
		},
		onTabButtonCreation: function(key, button, data) {
			button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.lore.tabs." + key), "lore-" + key, 115);
			button.onPressedChange = function(pressed) {
				pressed ? this.newUnlock.setPos(4, 4) : this.newUnlock.setPos(2, 2)
			};
			var overlay = new sc.NewUnlockOverlay;
			overlay.deactivate(false);
			overlay.setPos(2, 2);
			button.addChildGui(overlay);
			button.newUnlock = overlay;
			button.textChild.setPos(7, 1);
			button.setPos(0, 2);
			button.setData({
				type: data.type
			});
			this.addChildGui(button);
			return button
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
		onCreateListEntries: function(buttonList, categoryButtons, category, sortType) {
			var entry = null,
				parentEntry = entry = null,
				button = null,
				parentEntry = null,
				entries = sc.lore.getCategoryList(category, sortType);
			buttonList.clear();
			categoryButtons.clear();
			for (var prefix = "\\i[lore-" + this.getCurrentTabKey() + "]", i = parentLoreKeys.length = 0; i < entries.length; i++) {
				button = entries[i];
				parentEntry = sc.lore.getLore(button);
				if (ig.perf.fullLoreList || sc.lore.isLoreAvailable(button)) {
					if (!parentEntry.extension || ig.extensions.hasExtension(parentEntry.extension)) {
						entry = prefix + ig.LangLabel.getText(parentEntry.title);
						if (parentEntry.parent) {
							entry = new sc.LoreEntryButton(entry, button, category, true, true);
							parentEntry = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
							parentEntry.setPos(-16, 1);
							entry.addChildGui(parentEntry);
							sortType == sc.LORE_SORT_TYPE.ORDER ? buttonList.addButton(entry, null, 22) : parentLoreKeys.push(button)
						} else {
							entry = new sc.LoreEntryButton(entry, button, category, true);
							buttonList.addButton(entry)
						}
					}
				} else if ((!parentEntry.extension || ig.extensions.hasExtension(parentEntry.extension)) && this.showLockedEntries(category))
					if (parentEntry.parent && sc.lore.isLoreAvailable(parentEntry.parent)) {
						entry = prefix + "??????????????????";
						entry = new sc.LoreEntryButton(entry, button, category, null, true);
						parentEntry = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
						parentEntry.setPos(-16, 1);
						entry.addChildGui(parentEntry);
						entry.setActive(false);
						buttonList.addButton(entry, null, 22)
					} else {
						entry = prefix + "??????????????????";
						entry = new sc.LoreEntryButton(entry, button, category);
						entry.setActive(false);
						buttonList.addButton(entry)
					}
			}
			if (parentLoreKeys.length >= 1) {
				i = parentLoreKeys.length;
				for (sortType = buttonList.getChildren().length; i--;) {
					parentEntry = sc.lore.getLore(parentLoreKeys[i]);
					button = this.findParentIndex(parentEntry.parent, buttonList.getChildren());
					if (button >= 0) {
						entry = prefix + ig.LangLabel.getText(parentEntry.title);
						entry = new sc.LoreEntryButton(entry, parentLoreKeys[i], category, true, true);
						parentEntry = new ig.ImageGui(this.gfx, 541, 208, 14, 15);
						parentEntry.setPos(-16, 1);
						entry.addChildGui(parentEntry);
						button == sortType - 1 ? buttonList.addButton(entry, null, 22) : buttonList.insertButton(entry, button + 1, null, null, null, true);
						entry.hook.pos.x = 22
					}
				}
			}
		},
		findParentIndex: function(key, children) {
			for (var i = children.length; i--;)
				if (children[i].gui.key == key) return i;
			return -1
		},
		onListEntrySelected: function(entry) {
			if (entry.key) {
				sc.menu.setSynopInfo(entry.key);
				entry.overlay && this.newList.push(entry);
				sc.menu.setInfoText(null)
			} else {
				sc.menu.setSynopInfo(entry.key);
				entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
			}
		},
		onListMouseFocusLost: function() {
			sc.menu.setSynopInfo(null, true);
			sc.menu.setInfoText(null, true)
		},
		showLockedEntries: function(category) {
			return category != sc.LORE_CATERGORIES.STORY
		},
		modelChanged: function(model, event, data) {
			if (model == sc.menu)
				if (event == sc.MENU_EVENT.SORT_LIST) {
					this.sort(data.sortType);
					sc.menu.setSynopInfo(null, true);
					sc.menu.setInfoText(null, true)
				} else event == sc.MENU_EVENT.SYNO_CHANGED_TAB && (this.canShowCompletion(this.currentTabIndex) ?
					this.completion.doStateTransition("DEFAULT") : this.completion.doStateTransition("HIDDEN"))
		},
		canShowCompletion: function(tabIndex) {
			switch (tabIndex) {
				case 0:
					return false;
				case 1:
					return true;
				case 2:
					return true;
				case 3:
					return true;
				case 4:
					return true;
				case 5:
					return true
			}
		}
	})
});
ig.baked = !0;
