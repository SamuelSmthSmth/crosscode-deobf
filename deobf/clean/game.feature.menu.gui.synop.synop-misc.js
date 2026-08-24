/**
 * @module game.feature.menu.gui.synop.synop-misc
 * @description Synopsis helpers: the sc.LOG_GUI_TYPE registry (one GUI per log
 *   entry type: LANDMARK, TRADER, LORE, TROPHY, DROP, QUEST) plus the
 *   SynopsisLogDisplay, SynopsisTaskDisplay and SynopsisQuestDisplay panels.
 */
ig.module("game.feature.menu.gui.synop.synop-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.quests.quest-entries").defines(function() {
	sc.LOG_GUI_TYPE = {};
	sc.LogGuiTypeBase = ig.GuiElementBase.extend({
		iconGui: null,
		textGui: null,
		type: null,
		init: function(entry) {
			this.parent();
			this.setSize(376, 18);
			this.type = entry.type || sc.LOG_TYPES.STORY;
			this.iconGui = new sc.TextGui("\\i[logs-" + this.type + "]");
			this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.iconGui);
			this.textGui = new sc.TextGui("");
			this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.textGui.setPos(14, 0);
			this.addChildGui(this.textGui)
		}
	});
	sc.LOG_GUI_TYPE.LANDMARK = sc.LogGuiTypeBase.extend({
		init: function(entry) {
			this.parent(entry);
			var text = ig.lang.get("sc.gui.menu.synopsis-menu.types.landmark"),
				text = text + ("\\c[3]" + sc.map.getLandmarkName(entry.landmark, entry.area) + "\\c[0]");
			this.textGui.setText(text);
			this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			text = "\\i[insetArrow]" + ig.lang.get("sc.gui.menu.synopsis-menu.types.lm") + sc.map.getAreaName(entry.area);
			this.areaGui = new sc.TextGui(text, {
				font: sc.fontsystem.smallFont
			});
			this.areaGui.setPos(6, 16);
			this.addChildGui(this.areaGui);
			this.setSize(376, 28)
		}
	});
	sc.LOG_GUI_TYPE.TRADER = sc.LogGuiTypeBase.extend({
		init: function(entry) {
			this.parent(entry);
			var text = null,
				text = entry.isUpdate ? ig.lang.get("sc.gui.menu.synopsis-menu.types.traderUpdate") : ig.lang.get("sc.gui.menu.synopsis-menu.types.trader"),
				text = text + ("\\c[3]" + sc.trade.getTraderName(entry.trader) + "\\c[0]");
			this.textGui.setText(text);
			this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			entry = sc.trade.getFoundTrader(entry.trader);
			text = "\\i[insetArrow]" + ig.lang.get("sc.gui.menu.synopsis-menu.types.lm") + entry.area.toString() + " - " + entry.map.toString();
			this.areaGui = new sc.TextGui(text, {
				font: sc.fontsystem.smallFont
			});
			this.areaGui.setPos(6, 16);
			this.addChildGui(this.areaGui);
			this.setSize(376, 28)
		}
	});
	sc.LOG_GUI_TYPE.TRADER.isAvailable = function(entry) {
		return sc.trade.getTrader(entry.trader)
	};
	sc.LOG_GUI_TYPE.LORE = sc.LogGuiTypeBase.extend({
		init: function(entry) {
			this.parent(entry);
			this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.textGui.setMaxWidth(360);
			var text = "",
				text = entry.update ? ig.lang.get("sc.gui.menu.synopsis-menu.types.loreUpdated") : ig.lang.get("sc.gui.menu.synopsis-menu.types.lore"),
				text = (entry = sc.lore.getLore(entry.lore)) ? text + ("\\c[3]" + ig.LangLabel.getText(entry.title) + "\\c[0]") : text + "\\c[3]???\\c[0]";
			this.textGui.setText(text);
			this.setSize(376, Math.max(18, this.textGui.hook.size.y + 2))
		}
	});
	sc.LOG_GUI_TYPE.TROPHY = sc.LogGuiTypeBase.extend({
		init: function(entry) {
			this.parent(entry);
			var text = ig.lang.get("sc.gui.menu.synopsis-menu.types.trophy"),
				text = text + (" \\c[3]" + sc.trophies.getTrophyName(entry.trophy) + "\\c[0]");
			this.textGui.setText(text)
		}
	});
	sc.LOG_GUI_TYPE.DROP = sc.LogGuiTypeBase.extend({
		init: function(entry) {
			this.parent(entry);
			var text = ig.lang.get("sc.gui.menu.synopsis-menu.types.dropCompleted"),
				text = text + ("\\c[3]" + sc.menu.getDropName(entry.drop) + "\\c[0]");
			this.textGui.setText(text)
		}
	});
	sc.LOG_GUI_TYPE.QUEST = sc.LogGuiTypeBase.extend({
		init: function(entry) {
			this.parent(entry);
			var text = "";
			if (entry.task != void 0) {
				text = ig.lang.get("sc.gui.menu.synopsis-menu.types.questTask");
				this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
				this.iconGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
				var task = sc.quests.getQuestTask(entry.quest, entry.task),
					text = text + ("\\c[3]" + sc.quests.getQuestName(entry.quest) + "\\c[0]");
				this.textGui.setText(text);
				text = "\\i[insetArrow]" + ig.lang.get("sc.gui.menu.synopsis-menu.types.qtm");
				entry = new sc.TextGui(text, {
					font: sc.fontsystem.smallFont
				});
				entry.setPos(6, 16);
				this.addChildGui(entry);
				text = Math.max(72, entry.hook.size.x + 8);
				task = new sc.TextGui(task.task, {
					font: sc.fontsystem.smallFont,
					maxWidth: 360 - entry.hook.size.x - 2
				});
				task.setPos(text, 16);
				this.addChildGui(task);
				this.setSize(376, 14 + task.hook.size.y)
			} else if (entry.finish) {
				text = ig.lang.get("sc.gui.menu.synopsis-menu.types.questFinish");
				task = sc.quests.getStaticQuest(entry.quest);
				text = text + ("\\c[3]" + (task ? task.name : "????") + "\\c[0]");
				this.textGui.setText(text)
			} else if (entry.accept) {
				text = ig.lang.get("sc.gui.menu.synopsis-menu.types.questStart");
				task = sc.quests.getStaticQuest(entry.quest);
				text = text + ("\\c[3]" + (task ? task.name : "????") + "\\c[0]");
				this.textGui.setText(text)
			}
		}
	});
	sc.SynopsisLogDisplay = sc.HeaderMenuPanel.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: -204.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		content: null,
		init: function() {
			this.parent(ig.lang.get("sc.gui.menu.synopsis-menu.log"), sc.MenuPanelType.TOP_RIGHT_EDGE);
			this.setSize(384, 206);
			this.setPos(25, 85);
			this.content = new ig.GuiElementBase;
			this.content.setPos(4, 9);
			this.content.setSize(376, 195);
			this.addChildGui(this.content);
			this.header.annotation = {
				type: "INFO",
				content: {
					title: "sc.gui.menu.help.synopsis.titles.activity",
					description: "sc.gui.menu.help.synopsis.description.activity"
				},
				offset: {
					x: -3,
					y: -2
				},
				size: {
					x: "dyn",
					y: 11,
					offX: 6
				},
				index: {
					x: 0,
					y: 1
				}
			};
			this.doStateTransition("HIDDEN", true)
		},
		show: function() {
			this.doStateTransition("DEFAULT");
			this.content.removeAllChildren();
			this.setPos(25, 80);
			this.setSize(384, 206);
			for (var entries = sc.menu.logEntries, i = entries.length, entry = null, offset = 1, remaining = this.hook.size.y - 10; i--;) {
				entry = entries[i];
				if ((sc.model.player.hasItem(135) || entry.type != "LORE") && (!sc.LOG_GUI_TYPE[entry.type].isAvailable || sc.LOG_GUI_TYPE[entry.type].isAvailable(entry))) {
					entry = new sc.LOG_GUI_TYPE[entry.type](entry);
					entry.setPos(0, offset);
					offset = offset + entry.hook.size.y;
					remaining = remaining - entry.hook.size.y;
					if (remaining > 0) this.content.addChildGui(entry);
					else break
				}
			}
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		}
	});
	sc.SynopsisTaskDisplay = sc.HeaderMenuPanel.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: -204.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		task: null,
		init: function() {
			this.parent(ig.lang.get("sc.gui.menu.synopsis-menu.task"), sc.MenuPanelType.TOP_RIGHT_EDGE);
			this.setSize(384, 46);
			this.setPos(25, 29);
			this.task = new sc.TextGui(ig.lang.get("sc.gui.menu.synopsis-menu.notask"), {
				maxWidth: 374
			});
			this.task.setPos(5, 11);
			this.addChildGui(this.task);
			this.header.annotation = {
				type: "INFO",
				content: {
					title: "sc.gui.menu.help.synopsis.titles.objective",
					description: "sc.gui.menu.help.synopsis.description.objective"
				},
				offset: {
					x: -3,
					y: -2
				},
				size: {
					x: "dyn",
					y: 11,
					offX: 6
				},
				index: {
					x: 0,
					y: 0
				}
			};
			this.doStateTransition("HIDDEN", true)
		},
		show: function() {
			var task = sc.model.currentTask || sc.model.permaTask;
			if (task) {
				this.task.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
				this.task.hook.pos.y = 11
			} else {
				this.task.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
				this.task.hook.pos.y = 5
			}
			this.task.setText(task || ig.lang.get("sc.gui.menu.synopsis-menu.notask"));
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		}
	});
	sc.SynopsisQuestDisplay = sc.HeaderMenuPanel.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: -204.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		questNameGui: null,
		taskGUI: null,
		quest: null,
		init: function() {
			this.parent(ig.lang.get("sc.gui.menu.synopsis-menu.favquest"), sc.MenuPanelType.TOP_RIGHT_EDGE);
			this.setSize(384, 109);
			this.setPos(25, 80);
			this.questNameGui = new sc.TextGui("");
			this.addChildGui(this.questNameGui);
			this.taskGUI = new sc.TaskEntry;
			this.taskGUI.setPos(30, 34);
			this.addChildGui(this.taskGUI);
			this.header.annotation = {
				type: "INFO",
				content: {
					title: "sc.gui.menu.help.synopsis.titles.quest",
					description: "sc.gui.menu.help.synopsis.description.quest"
				},
				offset: {
					x: -3,
					y: -2
				},
				size: {
					x: "dyn",
					y: 11,
					offX: 6
				},
				index: {
					x: 0,
					y: 1
				}
			};
			this.doStateTransition("HIDDEN", true)
		},
		setQuest: function(quest) {
			if (quest) {
				this.quest = quest;
				this.taskGUI.doStateTransition("DEFAULT", true);
				this.questNameGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
				this.questNameGui.setPos(4, 11);
				this.questNameGui.setText("\\i[quest-fav]" + quest.name);
				this.taskGUI.setTask(sc.quests.getCurrentMarkedQuestTaskIndex(), this.quest, true, true);
				this.taskGUI.show(true, 0.1);
				this.setSize(384, 34 + this.taskGUI.hook.size.y)
			} else {
				this.quest = null;
				this.questNameGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				this.questNameGui.setPos(4, 11);
				this.questNameGui.setText(ig.lang.get("sc.gui.menu.synopsis-menu.noquest"));
				this.taskGUI.doStateTransition("HIDDEN", true);
				this.setSize(384, 30)
			}
		},
		updateDrawables: function(drawables) {
			this.parent(drawables);
			this.quest && drawables.addGfx(this.gfx, 10, 30, 416, 53, 17, 16)
		},
		show: function() {
			this.setQuest(sc.quests.getMarkedQuest());
			this.doStateTransition("DEFAULT")
		},
		hide: function(skipTransition) {
			this.doStateTransition("HIDDEN", skipTransition)
		}
	})
});
ig.baked = !0;
