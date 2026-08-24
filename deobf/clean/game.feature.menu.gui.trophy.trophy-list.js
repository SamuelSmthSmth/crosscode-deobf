/**
 * @module game.feature.menu.gui.trophy.trophy-list
 * @description The Trophies menu's tabbed list (sc.TrophyList): general /
 *   combat / exploration tabs with per-tab section buttons, trophy rows,
 *   progress-percent toggle and scroll/selection memory per section.
 */
ig.module("game.feature.menu.gui.trophy.trophy-list").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.trophy.trophy-misc").defines(function() {
	sc.TrophyList = sc.ListTabbedPane.extend({
		submitSound: null,
		containerHeightOffset: -26,
		listPosOffset: -6,
		listHeightOffset: 6,
		listPageSize: 25,
		sections: [],
		sectionCache: {},
		showStats: false,
		showProgress: false,
		newList: [],
		init: function() {
			this.parent(true);
			this.setSize(436, 258);
			this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.setPivot(436, 258);
			this.setPanelSize(436, 216);
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
				},
				HIDDEN_EASE: {
					state: {
						alpha: 0,
						offsetX: 218
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				}
			};
			this.addTab("GENERAL", 0, {
				type: sc.TROPHY_TYPES.GENERAL
			});
			this.addTab("COMBAT", 1, {
				type: sc.TROPHY_TYPES.COMBAT
			});
			this.addTab("EXPLORATION", 2, {
				type: sc.TROPHY_TYPES.EXPLORATION
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
			this.sections[this.currentTabIndex || 0].activate();
			ig.interact.setBlockDelay(0.2);
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.sections[this.currentTabIndex || 0].deactivate();
			this.parent();
			for (var i = this.newList.length; i--;) {
				this.newList[i].clearOverlay();
				sc.menu.clearNewUnlock(sc.MENU_SUBMENU.TROPHY, this.newList[i].key)
			}
			this.newList.length = 0;
			this.doStateTransition("HIDDEN")
		},
		toggleProgress: function() {
			this.showProgress = !this.showProgress;
			if (this.currentList)
				for (var children = this.currentList.getChildren(), i = children.length; i--;) children[i].gui.toggleProgress && children[i].gui.toggleProgress(this.showProgress)
		},
		onButtonTraversal: function() {
			this.parent();
			var direction = -1;
			sc.control.menuListDown() ? direction = 1 : sc.control.menuListUp() && (direction = 0);
			direction >= 0 && this.switchSection(direction)
		},
		getCurrentSortText: function() {
			var sortType = null,
				sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.TROPHY_SORT_TYPES.ORDER : sc.TROPHY_SORT_TYPES.ORDER,
				sortText = "auto";
			switch (sortType) {
				case sc.TROPHY_SORT_TYPES.ORDER:
					sortText = "auto";
					break;
				case sc.TROPHY_SORT_TYPES.UNLOCKED:
					sortText = "featLock";
					break;
				case sc.TROPHY_SORT_TYPES.NAME:
					sortText = "featName";
					break;
				case sc.TROPHY_SORT_TYPES.POINTS:
					sortText = "featPoints"
			}
			return ig.lang.get("sc.gui.menu.sort." + sortText)
		},
		onLeftRightPress: function() {
			return {
				skipSounds: true
			}
		},
		onTabChanged: function(newTab, oldTab) {
			this.submitSound.play();
			oldTab >= 0 && this.sections[oldTab].deactivate();
			newTab >= 0 && this.sections[newTab].activate();
			if (this.currentList)
				for (var children = this.currentList.getChildren(), i = children.length; i--;) children[i].gui.toggleProgress && children[i].gui.toggleProgress(this.showProgress)
		},
		onTabButtonCreation: function(key, index, data) {
			var button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.trophies.tabs." + key), "trophies-" + key, 105);
			button.textChild.setPos(7, 1);
			button.setPos(0, 2);
			button.setData({
				type: data.type
			});
			this.addChildGui(button);
			key = new sc.TrophySectionList(key, index, this.onSectionPress.bind(this));
			this.sections[index] = key;
			this.addChildGui(key);
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
					} return false
			}
		},
		onTabSelected: function() {
			sc.menu.setInfoText("", true)
		},
		onTabMouseFocusLost: function() {
			sc.menu.setInfoText("", true)
		},
		onSectionPress: function(section, index, data) {
			this.sections[this.currentTabIndex].setActiveButton(data.index, true);
			this.onCreateListEntries(this.currentList, this.currentGroup, data.category, this.tabContent[this.currentTabIndex].sort)
		},
		switchSection: function(direction) {
			this.submitSound.play();
			var section = this.sections[this.currentTabIndex],
				buttons = section.buttons,
				current = section.currentButton;
			if (direction == 1) {
				current++;
				current >= buttons.length && (current = 0)
			} else {
				current--;
				current < 0 && (current = buttons.length - 1)
			}
			direction = buttons[current];
			section.setActiveButton(current);
			this.onCreateListEntries(this.currentList, this.currentGroup, direction.data.category, this.tabContent[this.currentTabIndex].sort)
		},
		onCreateListEntries: function(buttonList, categoryButtons, category, sortType) {
			var entry = null,
				entry = null,
				section = this.sections[this.currentTabIndex].getCurrentSection(),
				prevSection = this.sections[this.currentTabIndex].getPreviousSection();
			if (!buttonList.overview) {
				buttonList.overview = new sc.TrophyTabOverview;
				buttonList.addChildGui(buttonList.overview)
			}
			this.sectionCache[category] || (this.sectionCache[category] = {});
			var cache = this.sectionCache[category][prevSection];
			if (!cache) {
				cache = {
					y: 0,
					scroll: 0,
					sort: sortType
				};
				this.sectionCache[category][prevSection] = cache
			}
			if (cache.sort = !sortType) {
				cache.y = 0;
				cache.scroll = 0;
				cache.sort = sortType
			} else {
				cache.y = categoryButtons.current.y;
				cache.scroll = buttonList.getScrollY()
			}
			buttonList.setSize(300, 203);
			buttonList.clear();
			buttonList.scrollToY(0, true);
			categoryButtons.clear();
			prevSection = this.collectTrophies(category, section, sortType);
			for (cache = 0; cache < prevSection.length; cache++) {
				entry = prevSection[cache];
				entry = new sc.TrophyListEntry(entry, category, section, this.showProgress);
				buttonList.addButton(entry)
			}
			cache = this.sectionCache[category][section];
			if (!cache) {
				cache = {
					y: 0,
					scroll: 0,
					sort: sortType
				};
				this.sectionCache[category][section] = cache
			}
			ig.input.mouseGuiActive ? categoryButtons.setCurrentFocus(0, cache.y) : categoryButtons.focusCurrentButton(0, cache.y, false, true);
			buttonList.scrollToY(cache.scroll, true);
			buttonList.overview && buttonList.overview.updateNumbers(category, section);
			buttonList.overview.doStateTransition(this.showStats ? "DEFAULT" : "HIDDEN", true)
		},
		onListEntrySelected: function(entry) {
			entry.key && entry.overlay && this.newList.indexOf(entry) == -1 && this.newList.push(entry);
			entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
		},
		onListMouseFocusLost: function() {
			sc.menu.setInfoText(null, true)
		},
		collectTrophies: function(category, section, sortType) {
			var list = [],
				trophies = sc.trophies.trophies,
				key;
			for (key in trophies) {
				var trophy = trophies[key];
				trophy.track && trophy.category == category && trophy.section == section && list.push(key)
			}
			this.sortList(list, sortType);
			return list
		},
		sortList: function(list, sortType) {
			switch (sortType) {
				case sc.TROPHY_SORT_TYPES.ORDER:
					list.sort(function(a, b) {
						var trophyA = sc.trophies.getTrophy(a),
							trophyB = sc.trophies.getTrophy(b);
						return (trophyA.order || 0) - (trophyB.order || 0)
					});
					break;
				case sc.TROPHY_SORT_TYPES.NAME:
					list.sort(function(a, b) {
						var nameA = ig.LangLabel.getText(sc.trophies.getTrophy(a).name),
							nameB = ig.LangLabel.getText(sc.trophies.getTrophy(b).name);
						return nameA.toString().localeCompare(nameB.toString())
					});
					break;
				case sc.TROPHY_SORT_TYPES.UNLOCKED:
					list.sort(function(a, b) {
						var trophyA = sc.trophies.getTrophy(a),
							trophyB = sc.trophies.getTrophy(b);
						return trophyA.triggered == trophyB.triggered ? (trophyA.order || 0) - (trophyB.order || 0) : trophyA.triggered ? -1 : trophyB.triggered ? 1 : 0
					});
					break;
				case sc.TROPHY_SORT_TYPES.POINTS:
					list.sort(function(a, b) {
						var trophyA = sc.trophies.getTrophy(a),
							trophyB = sc.trophies.getTrophy(b);
						return trophyA.points == trophyB.points ? (trophyA.order || 0) - (trophyB.order || 0) : (trophyB.points || 0) - (trophyA.points || 0)
					})
			}
		},
		modelChanged: function(model, event, data) {
			model == sc.menu && event == sc.MENU_EVENT.SORT_LIST && this.sort(data.sortType)
		}
	})
});
ig.baked = !0;
