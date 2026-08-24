/**
 * @module game.feature.menu.gui.quest-hub.quest-hub-misc
 * @description Quest Hub helper GUIs: sc.QuestHubAvailable (open-quest counter),
 *   sc.QuestHubCompletion (solved-percentage), sc.QuestHubListEntry (hub quest
 *   row with character, level, area and reward icons), plus the rewards box and
 *   character view.
 */
ig.module("game.feature.menu.gui.quest-hub.quest-hub-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.social.social-misc", "game.feature.interact.button-group", "game.feature.menu.gui.quests.quest-entries").defines(function() {
	sc.QuestHubAvailable = sc.MenuPanel.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: 220
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		text: null,
		number: null,
		init: function() {
			this.parent(sc.MenuPanelType.BOTTOM_LEFT_EDGE);
			this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.setSize(200, 23);
			this.setPos(66, 28);
			if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
			this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.questHub.available"));
			this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.text.setPos(5, 0);
			this.addChildGui(this.text);
			this.number = new sc.NumberGui(999, {
				size: sc.NUMBER_SIZE.TEXT
			});
			this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.number.setPos(5, 1);
			this.addChildGui(this.number);
			this.annotation = {
				content: {
					title: "sc.gui.menu.help.hub.titles.available",
					description: "sc.gui.menu.help.hub.description.available"
				},
				offset: {
					x: 0,
					y: 0
				},
				size: {
					x: "dyn",
					y: "dyn"
				},
				index: {
					x: 0,
					y: 0
				}
			};
			this.doStateTransition("HIDDEN", true)
		},
		show: function() {
			var hub = ig.database.get("questHubs")[sc.menu.questHubID];
			if (!hub) throw Error("Quest HUB ID not found: " + sc.menu.questHubID);
			var areas = hub.areas,
				quests = sc.quests.staticQuests,
				condition = new ig.VarCondition,
				count = 0,
				key;
			for (key in quests) {
				var quest = quests[key];
				if (quest.hubSettings && !quest.noTrack)
					for (var i = 0; i < areas.length; i++)
						if (quest.area == areas[i] && !sc.quests.isQuestActive(key) && !sc.quests.isQuestSolved(key) && (!quest.extension || ig.extensions.hasExtension(quest.extension)))
							if (quest.hubSettings.condition) {
								condition.setCondition(quest.hubSettings.condition);
								condition.evaluate() && count++
							} else count++
			}
			this.number.setMaxNumber(count);
			this.number.setNumber(count, true);
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		},
		updateDrawables: function(drawables) {
			this.parent(drawables);
			var x = this.text.hook.size.x + this.text.hook.pos.x + 1,
				width = this.hook.size.x - this.text.hook.size.x - this.number.hook.size.x - 10,
				width = Math.floor(width / 4) * 4;
			drawables.addPattern(this.constructor.PATTERN, x, 14, 0, 0, width, 4)
		}
	});
	var completionStats = {
		total: 0,
		solved: 0
	};
	sc.QuestHubCompletion = sc.MenuPanel.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: -220
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		text: null,
		percent: null,
		init: function() {
			this.parent(sc.MenuPanelType.BOTTOM_RIGHT_EDGE);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.setSize(200, 23);
			this.setPos(66, 28);
			if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X);
			this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.questHub.completion"));
			this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.text.setPos(5, 0);
			this.addChildGui(this.text);
			this.percent = new sc.StatPercentNumber(null, {
				size: sc.NUMBER_SIZE.TEXT,
				leadingZeros: 1,
				scramble: false
			});
			this.percent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.percent.setPos(5, 1);
			this.addChildGui(this.percent);
			this.annotation = {
				content: {
					title: "sc.gui.menu.help.hub.titles.rate",
					description: "sc.gui.menu.help.hub.description.rate"
				},
				offset: {
					x: 0,
					y: 0
				},
				size: {
					x: "dyn",
					y: "dyn"
				},
				index: {
					x: 1,
					y: 0
				}
			};
			this.doStateTransition("HIDDEN", true)
		},
		show: function() {
			var hub = ig.database.get("questHubs")[sc.menu.questHubID];
			if (!hub) throw Error("Quest HUB ID not found: " + sc.menu.questHubID);
			for (var areas = hub.areas, solvedSum = 0, i = areas.length, counted = 0; i--;) {
				sc.quests.getTotalHubQuestsSolved(areas[i], completionStats);
				if (completionStats.total != 0) {
					counted++;
					solvedSum = solvedSum + completionStats.solved / completionStats.total
				}
			}
			solvedSum = solvedSum / counted;
			this.percent.setNumber(solvedSum, true);
			solvedSum >= 1 && this.percent.setColor(sc.GUI_NUMBER_COLOR.ORANGE);
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		},
		updateDrawables: function(drawables) {
			this.parent(drawables);
			var x = this.text.hook.size.x + this.text.hook.pos.x + 1,
				width = this.hook.size.x - this.text.hook.size.x - this.percent.hook.size.x - 10,
				width = Math.floor(width / 4) * 4;
			drawables.addPattern(this.constructor.PATTERN, x, 14, 0, 0, width, 4)
		}
	});
	sc.QuestHubListEntry = ig.FocusGui.extend({
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
		gfx: new ig.Image("media/gui/menu.png"),
		ninepatch: new ig.NinePatch("media/gui/buttons.png", {
			width: 28,
			height: 10,
			left: 8,
			top: 15,
			right: 8,
			bottom: 15,
			offsets: {
				"default": {
					x: 0,
					y: 114
				},
				focus: {
					x: 45,
					y: 114
				},
				hdefault: {
					x: 170,
					y: 50
				},
				hfocus: {
					x: 213,
					y: 50
				}
			}
		}),
		character: null,
		questTitle: null,
		questLocation: null,
		levelContent: null,
		level: null,
		areaContent: null,
		area: null,
		rewards: null,
		init: function(questId, tab) {
			this.parent();
			this.setSize(433, 50);
			var quest = sc.quests.getStaticQuest(questId),
				settings = quest.hubSettings;
			this.character = new sc.QuestHubCharacterView;
			this.character.setPos(6, 3);
			this.character.setCharacter(settings.hideChar && tab == sc.MENU_QUEST_HUB_TABS.OPEN ? "misc.blank" : settings.character);
			this.addChildGui(this.character);
			this.questTitle = new sc.TextGui(quest.name);
			this.questTitle.setPos(40, 1);
			this.addChildGui(this.questTitle);
			this.questLocation = new sc.TextGui(settings.location, {
				font: sc.fontsystem.smallFont,
				maxWidth: 238
			});
			this.questLocation.setPos(52, 18);
			this.addChildGui(this.questLocation);
			this.levelContent = new ig.ColorGui("000");
			this.levelContent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.levelContent.setSize(37, 13);
			this.levelContent.setPos(6, 3);
			this.levelContent.hook.localAlpha = 0.5;
			this.addChildGui(this.levelContent);
			settings = new sc.TextGui("LvL", {
				font: sc.fontsystem.tinyFont
			});
			settings.setPos(3, 2);
			this.levelContent.addChildGui(settings);
			this.level = new sc.NumberGui(99, {
				leadingZeros: 2
			});
			this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.level.setPos(2, 3);
			this.level.setNumber(quest.level);
			this.levelContent.addChildGui(this.level);
			this.areaContent = new ig.ColorGui("000");
			this.areaContent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.areaContent.setPos(6 + this.levelContent.hook.size.x + 1, 3);
			this.areaContent.hook.localAlpha = 0.5;
			this.areaContent.setSize(98, 13);
			this.addChildGui(this.areaContent);
			settings = new ig.ImageGui(this.gfx, 480, 224, 9, 11);
			settings.setPos(2, 1);
			this.areaContent.addChildGui(settings);
			this.area = new sc.TextGui(sc.map.getAreaName(quest.area), {
				font: sc.fontsystem.smallFont
			});
			this.area.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.area.setPos(14, 0);
			this.areaContent.addChildGui(this.area);
			this.rewards = new sc.QuestHubRewards;
			this.rewards.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.rewards.setPos(6, 4);
			this.addChildGui(this.rewards);
			settings = new sc.TextGui(ig.lang.get("sc.gui.menu.questHub.rewards"), {
				font: sc.fontsystem.tinyFont
			});
			settings.setPos(3, 2);
			this.rewards.addChildGui(settings);
			var rewards = quest.rewards,
				x = 10,
				y = 14;
			rewards.exp && (x = this.addImageRewardGui(x, y, 472, 32, 14, 10, 17));
			rewards.cp && (x = this.addImageRewardGui(x, y, 593, 19, 10, 10, 13));
			rewards.money && (x = this.addImageRewardGui(x, y, 488, 32, 12, 10, 15));
			if (rewards.items)
				for (var items = rewards.items || [], y = y - 4, i = 0; i < items.length; i++) x = this.addItemRewardGui(x, y, items[i].id);
			sc.menu.questsSeen[questId] || (sc.menu.questsSeen[questId] = true)
		},
		addImageRewardGui: function(x, y, srcX, srcY, width, height, step) {
			srcX = new ig.ImageGui(this.gfx, srcX, srcY, width, height);
			srcX.setPos(x, y);
			this.rewards.addChildGui(srcX);
			return x + step
		},
		addItemRewardGui: function(x, y, itemId) {
			itemId = new sc.TextGui(sc.inventory.getItemIcon(itemId));
			itemId.setPos(x, y);
			this.rewards.addChildGui(itemId);
			return x + 16
		},
		updateDrawables: function(drawables) {
			this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
			this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, this.focus ? "hfocus" : "hdefault", 1);
			drawables.addGfx(this.gfx, 41, 18, 530, 208, 9, 10)
		}
	});
	sc.QuestHubRewards = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/menu.png", {
			width: 5,
			height: 5,
			left: 5,
			top: 5,
			right: 5,
			bottom: 5,
			offsets: {
				"default": {
					x: 560,
					y: 465
				}
			}
		}),
		init: function() {
			this.parent(136, 29)
		}
	});
	sc.QuestHubCharacterView = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/menu.png", {
			width: 2,
			height: 2,
			left: 5,
			top: 5,
			right: 5,
			bottom: 5,
			offsets: {
				"default": {
					x: 544,
					y: 482
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
			this.parent(31, 44);
			this.container = new ig.GuiElementBase;
			this.container.setSize(31, 44);
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
	})
});
ig.baked = !0;
