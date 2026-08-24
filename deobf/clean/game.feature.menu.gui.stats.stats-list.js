/**
 * @module game.feature.menu.gui.stats.stats-list
 * @description The Statistics menu's tabbed list (sc.StatsListBox): general /
 *   combat / items / exploration / quests / arena / misc / log tabs, each
 *   populated from the sc.STATS_BUILD table with inset/deset nesting.
 */
ig.module("game.feature.menu.gui.stats.stats-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.stats.stats-misc", "game.feature.menu.gui.stats.stats-gui-builds", "game.feature.menu.gui.stats.stats-types").defines(function() {
	var insets = [];
	sc.StatsListBox = sc.TabbedPane.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		submitSound: null,
		bg: null,
		currentGui: null,
		tabState: [],
		_buttongroup: null,
		init: function(buttongroup) {
			this.parent(true);
			this.setSize(436, 258);
			this.setPanelSize(436, 242);
			this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
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
			this._buttongroup = buttongroup;
			this.submitSound = sc.BUTTON_SOUND.submit;
			this.bg = new sc.MenuScanLines;
			this.bg.setPos(0, 29);
			this.bg.setSize(this.hook.size.x, 228);
			this.addChildGui(this.bg);
			var index = 0;
			this.addTab("general", index++, {
				type: sc.STATS_CATEGORY.GENERAL
			});
			this.addTab("combat", index++, {
				type: sc.STATS_CATEGORY.COMBAT
			});
			this.addTab("items", index++, {
				type: sc.STATS_CATEGORY.ITEMS
			});
			this.addTab("exploration", index++, {
				type: sc.STATS_CATEGORY.EXPLORATION
			});
			this.addTab("quests", index++, {
				type: sc.STATS_CATEGORY.QUESTS
			});
			ig.vars.get("arenaVars.statsUnlocked") && this.addTab("arena", index++, {
				type: sc.STATS_CATEGORY.ARENA
			});
			this.addTab("misc", index++, {
				type: sc.STATS_CATEGORY.MISC
			});
			this.addTab("log", index, {
				type: sc.STATS_CATEGORY.LOG
			});
			this.doStateTransition("HIDDEN", true)
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
		switchTab: function(direction) {
			var index = this.currentTabIndex,
				button = this.getCurrentTabButton();
			if (direction >= 0) {
				button.setPressed(false);
				if (direction == 1) {
					index++;
					index >= this.tabArray.length && (index = 0)
				} else {
					index--;
					index < 0 && (index = this.tabArray.length - 1)
				}
				this._prevPressed = button = this.tabArray[index];
				button.setPressed(true);
				this.submitSound.play();
				this.setTab(index, false, {
					skipSounds: true
				});
				this.resetButtons(button, true);
				this.rearrangeTabs()
			}
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
		onTabButtonCreation: function(key, button, data) {
			button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.stats.tabs." + key), "stats-" + key, 105);
			button.textChild.setPos(7, 1);
			button.setPos(0, 2);
			button.setData({
				type: data.type
			});
			this.addChildGui(button);
			return button
		},
		onTabChanged: function(tab) {
			sc.menu.setSynoTab(tab)
		},
		onContentCreation: function() {
			var result = {
				gui: null
			};
			this.currentGui = new sc.StatsScrollPane;
			this.currentGui.setPos(0, 29);
			this.currentGui.setSize(this.hook.size.x, 228);
			this.currentGui.hook.transitions = {
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
			this.addChildGui(this.currentGui);
			this.currentGui.onCheckScrollable = function() {
				return this._buttongroup.isActive()
			}.bind(this);
			var category = this.getCurrentTabButton().data.type,
				category = sc.STATS_BUILD[category],
				entry = null,
				insetIndex = null,
				width = 431,
				condition = new ig.VarCondition;
			insets.length = 0;
			for (var key in category)
				if ((entry = category[key]) && sc.STATS_ENTRY_TYPE[entry.type] || entry.type == "List") {
					if (entry.condition) {
						condition.setCondition(entry.condition);
						if (!condition.evaluate()) continue
					}
					if (entry.inset) {
						if (insets.indexOf(entry.inset) != -1) throw Error(entry.inset + " inset already exists. (Missing deset?)");
						insets.push(entry.inset);
						width = width - 24
					} else if (entry.deset) {
						insetIndex = insets.indexOf(entry.deset);
						if (insetIndex != -1) {
							if (insetIndex != insets.length - 1) throw Error(entry.deset + " ist not top deset. (missing inset/deset?)");
							insets.pop();
							width = width + 24
						} else throw Error(entry.deset + " dest does not exist. (missing inset?)");
					}
					if (entry.type == "List") {
						var list = entry.list(),
							listKey;
						for (listKey in list)
							if (list = entry.getSettings(listKey)) {
								list = new sc.STATS_ENTRY_TYPE[entry.subtype](listKey, list, width);
								list.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
								if (width < 431) {
									var icon = new ig.ImageGui(this.gfx, 512, 207, 17, 16);
									icon.setPos(-17, -1);
									list.addChildGui(icon)
								}
								this.currentGui.addEntry(list, 5)
							}
					} else {
						entry = new sc.STATS_ENTRY_TYPE[entry.type](key, entry, width);
						entry.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
						if (width < 431) {
							var icon = new ig.ImageGui(this.gfx, 512, 207, 17, 16);
							icon.setPos(-17, -1);
							entry.addChildGui(icon)
						}
						this.currentGui.addEntry(entry, 5)
					}
				} result.gui = this.currentGui;
			return result
		},
		onClearPrevContent: function() {
			this.currentGui && this.currentGui.doStateTransition("HIDDEN", true)
		},
		onSetCacheContent: function(cached) {
			this.currentGui = cached.gui;
			this.currentGui.doStateTransition("DEFAULT", true)
		},
		modelChanged: function() {}
	})
});
ig.baked = !0;
