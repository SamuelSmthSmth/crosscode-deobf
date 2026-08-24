/**
 * @module game.feature.menu.gui.quest-hub.quest-hub-list
 * @description The Quest Hub's tabbed quest list (sc.QuestHubList): open /
 *   active / finished tabs, quest collection + sorting per area.
 */
ig.module("game.feature.menu.gui.quest-hub.quest-hub-list").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.menu.gui.quest-hub.quest-hub-misc").defines(function() {
	sc.QuestHubList = sc.ListTabbedPane.extend({
		submitSound: null,
		containerHeightOffset: -26,
		listPosOffset: -6,
		listHeightOffset: 6,
		listPageSize: 25,
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
			this.addTab("open", 0, {
				type: sc.MENU_QUEST_HUB_TABS.OPEN
			});
			this.addTab("active", 1, {
				type: sc.MENU_QUEST_HUB_TABS.ACTIVE
			});
			this.addTab("finished", 2, {
				type: sc.MENU_QUEST_HUB_TABS.FINISHED
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
				sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.QUEST_SORT_TYPE.ORDER : sc.QUEST_SORT_TYPE.ORDER,
				sortText = "auto";
			switch (sortType) {
				case sc.QUEST_SORT_TYPE.ORDER:
					sortText = "auto";
					break;
				case sc.QUEST_SORT_TYPE.NAME:
					sortText = "name";
					break;
				case sc.QUEST_SORT_TYPE.LEVEL:
					sortText = "questLevel"
			}
			return ig.lang.get("sc.gui.menu.sort." + sortText)
		},
		onLeftRightPress: function() {
			this.submitSound.play();
			return {
				skipSounds: true
			}
		},
		onTabChanged: function(tab) {
			sc.menu.setSynoTab(tab)
		},
		onTabButtonCreation: function(key, button, data) {
			button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.questHub.tabs." + key), "questHub-" + key, 85);
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
					} return false
			}
		},
		onTabSelected: function() {
			sc.menu.setInfoText("", true)
		},
		onTabMouseFocusLost: function() {
			sc.menu.setInfoText(null, true)
		},
		onInitSortType: function() {
			return 1
		},
		onCreateListEntries: function(buttonList, categoryButtons, category, sortType) {
			var entry = null,
				entry = null,
				sortType = this.collectQuests(category, sortType);
			buttonList.clear();
			categoryButtons.clear();
			for (categoryButtons = 0; categoryButtons < sortType.length; categoryButtons++) {
				entry = sortType[categoryButtons];
				entry = new sc.QuestHubListEntry(entry, category);
				buttonList.addButton(entry)
			}
		},
		onListEntrySelected: function(entry) {
			entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
		},
		onListMouseFocusLost: function() {
			sc.menu.setInfoText(null, true)
		},
		collectQuests: function(tab, sortType) {
			var hub = ig.database.get("questHubs")[sc.menu.questHubID];
			if (!hub) throw Error("Quest HUB ID not found: " + sc.menu.questHubID);
			var areas = hub.areas,
				quests = sc.quests.staticQuests,
				collected = [],
				condition = new ig.VarCondition,
				key;
			for (key in quests) {
				var quest = quests[key];
				if (quest.hubSettings && !quest.noTrack && (!quest.extension || ig.extensions.hasExtension(quest.extension)))
					for (var i = 0; i < areas.length; i++)
						if (quest.area == areas[i])
							if (tab == sc.MENU_QUEST_HUB_TABS.OPEN) {
								if (!sc.quests.isQuestActive(key) && !sc.quests.isQuestSolved(key))
									if (quest.hubSettings.condition) {
										condition.setCondition(quest.hubSettings.condition);
										condition.evaluate() && collected.push(key)
									} else collected.push(key)
							} else tab == sc.MENU_QUEST_HUB_TABS.ACTIVE ? sc.quests.isQuestActive(key) && collected.push(key) : tab == sc.MENU_QUEST_HUB_TABS.FINISHED && sc.quests.isQuestSolved(key) && collected.push(key)
			}
			sortType != void 0 && this.sortList(collected, sortType);
			return collected
		},
		sortList: function(list, sortType) {
			switch (sortType) {
				case sc.QUEST_SORT_TYPE.ORDER:
					list.sort(function(a, b) {
						var questA = sc.quests.getStaticQuest(a),
							questB = sc.quests.getStaticQuest(b);
						if (questA.area != questB.area) {
							questA = sc.map.getAreaOrder(questA.area);
							questB = sc.map.getAreaOrder(questB.area);
							return questA - questB
						}
						return questA.order - questB.order
					});
					break;
				case sc.QUEST_SORT_TYPE.NAME:
					list.sort(function(a, b) {
						var questA = sc.quests.getStaticQuest(a),
							questB = sc.quests.getStaticQuest(b);
						return questA.name.toString().localeCompare(questB.name.toString())
					});
					break;
				case sc.QUEST_SORT_TYPE.LEVEL:
					list.sort(function(a, b) {
						var questA = sc.quests.getStaticQuest(a),
							questB = sc.quests.getStaticQuest(b);
						return questA.level - questB.level
					})
			}
		},
		modelChanged: function(model, event, data) {
			model == sc.menu && event == sc.MENU_EVENT.SORT_LIST && this.sort(data.sortType)
		}
	})
});
ig.baked = !0;
