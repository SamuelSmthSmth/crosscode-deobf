/**
 * @module game.feature.menu.gui.trophy.trophy-misc
 * @description Trophy menu helpers: TrophyTabOverview (counts summary),
 *   TrophyTotalPoints / TrophyCompletion (bottom panels), TrophySectionList
 *   (per-category section buttons), TrophyListEntry (trophy row with progress
 *   toggle), TrophyProgress(Bar) and TrophyIconGraphic (icon, ribbon, stars).
 */
ig.module("game.feature.menu.gui.trophy.trophy-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.stats.stats-misc", "game.feature.interact.button-group").defines(function() {
	function formatWithCommas(value) {
		for (var sep = ig.currentLang + "", sep = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", regex = /(\d+)(\d{3})/, value =
				value + ""; regex.test(value);) value = value.replace(regex, "$1" + sep + "$2");
		return value
	}
	sc.TrophyTabOverview = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 1
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		total: null,
		category: null,
		section: null,
		init: function() {
			this.parent();
			this.setSize(132, 40);
			this.setPos(-134, 0);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			var y = 2;
			this.total = new sc.TrophyTabOverview.Entry(ig.lang.get("sc.gui.menu.trophies.totalTrophies"), "99");
			this.total.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.total.setPos(1, y);
			this.addChildGui(this.total);
			y = y + 8;
			this.category = new sc.TrophyTabOverview.Entry(ig.lang.get("sc.gui.menu.trophies.category"), "99");
			this.category.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.category.setPos(1, y);
			this.addChildGui(this.category);
			y = y + 8;
			this.section = new sc.TrophyTabOverview.Entry(ig.lang.get("sc.gui.menu.trophies.section"), "99");
			this.section.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.section.setPos(1, y);
			this.addChildGui(this.section);
			this.updateNumbers()
		},
		updateNumbers: function(category, section) {
			var sectionStats = sc.trophies.getTotalTrophies(category, section),
				categoryStats = sc.trophies.getTotalTrophies(category),
				totalStats = sc.trophies.getTotalTrophies();
			this.total.setValue(totalStats.count + " / " + totalStats.total);
			this.category.setValue(categoryStats.count + " / " + categoryStats.total);
			this.section.setValue(sectionStats.count + " / " + sectionStats.total)
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#7E7E7E", 0, this.hook.size.y - 1, 132, 1)
		}
	});
	sc.TrophyTabOverview.Entry = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		text: null,
		value: null,
		init: function(text, value, width) {
			this.parent();
			this.setSize(width || 130, 8);
			this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 189, 16, 1, ig.ImagePattern.OPT.REPEAT_X);
			this.text = new sc.TextGui(text, {
				font: sc.fontsystem.tinyFont
			});
			this.addChildGui(this.text);
			this.value = new sc.TextGui(value, {
				font: sc.fontsystem.tinyFont
			});
			this.value.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.addChildGui(this.value)
		},
		setValue: function(value) {
			this.value.setText(value)
		},
		updateDrawables: function(drawables) {
			var x = this.text.hook.size.x + this.text.hook.pos.x + 1,
				width = this.hook.size.x - this.text.hook.size.x - this.value.hook.size.x - 1,
				width = Math.floor(width / 4) * 4;
			drawables.addPattern(this.constructor.PATTERN, x, 5, 0, 0, width, 1)
		}
	});
	sc.TrophyTotalPoints = sc.MenuPanel.extend({
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
			this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.trophies.points"));
			this.text.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.text.setPos(5, 0);
			this.addChildGui(this.text);
			this.number = new sc.TextGui(formatWithCommas(0));
			this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.number.setPos(5, 0);
			this.addChildGui(this.number);
			this.annotation = {
				content: {
					title: "sc.gui.menu.help.trophy.titles.points",
					description: "sc.gui.menu.help.trophy.description.points"
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
			this.number.setText(formatWithCommas(sc.trophies.getTotalPoints()));
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
	sc.TrophyCompletion = sc.MenuPanel.extend({
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
			this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.trophies.completion"));
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
					title: "sc.gui.menu.help.trophy.titles.rate",
					description: "sc.gui.menu.help.trophy.description.rate"
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
			var percent = sc.trophies.getTotalTrophiesUnlocked(true);
			this.percent.setNumber(percent, true);
			if (percent >= 1) {
				this.text.setText("\\c[3]" + ig.lang.get("sc.gui.menu.trophies.completion") + "\\c[0]");
				this.percent.setColor(sc.GUI_NUMBER_COLOR.ORANGE)
			}
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
	sc.TrophySectionList = ig.GuiElementBase.extend({
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
		buttongroup: null,
		index: -1,
		category: null,
		callback: null,
		active: false,
		currentButton: -1,
		prevButton: -1,
		buttons: [],
		sectionButtons: {},
		switchLeft: null,
		switchRight: null,
		init: function(category, index, callback) {
			this.parent();
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.setPos(2, 45);
			this.category = category || null;
			this.index = index || 0;
			this.callback = callback || null;
			this.buttongroup = new sc.ButtonGroup;
			this.buttongroup.addPressCallback(function(button) {
				button.data.index != this.currentButton && this.callback && this.callback(this.category, this.index, button)
			}.bind(this));
			this.bg = new sc.MenuScanLines;
			this.addChildGui(this.bg);
			var sections = sc.TROPHY_SECTIONS[category],
				y = 3,
				buttonIndex = 0,
				section;
			for (section in sections) {
				this.addButton(category, sections[section], 1, y, buttonIndex);
				buttonIndex++;
				y = y + 25
			}
			this.currentButton = 0;
			this.setActiveButton(this.currentButton);
			this.setSize(132, y + 1);
			this.bg.setPos(0, 1);
			this.bg.setSize(this.hook.size.x, y - 1);
			this.switchLeft = new sc.TextGui("\\i[list-up]");
			this.switchLeft.setPos(1, -16);
			this.addChildGui(this.switchLeft);
			this.switchRight = new sc.TextGui("\\i[list-down]");
			this.switchRight.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.switchRight.setPos(0, -16);
			this.addChildGui(this.switchRight);
			var label = new sc.TextGui(ig.lang.get("sc.gui.menu.trophies.sectionText"), {
				font: sc.fontsystem.smallFont
			});
			label.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			label.setPos(0, -14);
			this.addChildGui(label);
			this.doStateTransition("HIDDEN", true)
		},
		activate: function() {
			if (!this.active) {
				this.active = true;
				sc.menu.buttonInteract.addParallelGroup(this.buttongroup);
				this.setActiveButton(this.currentButton);
				this.doStateTransition("DEFAULT", true);
				var sections = sc.TROPHY_SECTIONS[this.category],
					trophies = sc.trophies.trophies,
					unlocks = sc.menu.newUnlocks[sc.MENU_SUBMENU.TROPHY] || [],
					key;
				for (key in trophies) {
					var trophy = trophies[key];
					if (trophy.track && trophy.category == this.category)
						for (var section in sections) sections[section] == trophy.section && unlocks.indexOf(key) != -1 && this.sectionButtons[section].overlay.activate()
				}
			}
		},
		deactivate: function() {
			if (this.active) {
				this.active = false;
				for (var section in this.sectionButtons) this.sectionButtons[section].overlay.deactivate();
				sc.menu.buttonInteract.removeParallelGroup(this.buttongroup);
				this.doStateTransition("HIDDEN", true)
			}
		},
		setActiveButton: function(index, skip) {
			for (var i = 0; i < this.buttons.length; i++)(skip || i != index) && this.buttons[i].setPressed(false);
			this.prevButton = this.currentButton;
			this.currentButton = index;
			index >= 0 && this.buttons[this.currentButton].setPressed(true)
		},
		getCurrentSection: function() {
			return this.currentButton < 0 ? 0 : this.buttons[this.currentButton].data.section
		},
		getPreviousSection: function() {
			return this.prevButton < 0 ? 0 : this.buttons[this.prevButton].data.section
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#7E7E7E", 0, 0, 132, 1);
			drawables.addColor("#7E7E7E", 0, -16, 132, 1);
			drawables.addColor("#7E7E7E", 0, this.hook.size.y - 1, 132, 1)
		},
		addButton: function(category, section, x, y, index) {
			var button = new sc.ButtonGui(ig.lang.get("sc.gui.menu.trophies.sections." + category + "." + section), 130, true, sc.BUTTON_TYPE.DEFAULT, null, true);
			button.animateOnPress = true;
			button.setData({
				section: section,
				category: category,
				index: index
			});
			button.setPos(x, y);
			category = new sc.NewUnlockOverlay;
			category.setPos(4, 4);
			category.deactivate();
			button.addChildGui(category);
			button.overlay = category;
			this.addChildGui(button);
			this.buttongroup.addFocusGui(button, 0, index);
			this.buttons[index] = button;
			this.sectionButtons[section] = button
		}
	});
	var colorTagRegex = /\\c\[\d\]/g;
	sc.TrophyListEntry = ig.FocusGui.extend({
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
		title: null,
		description: null,
		progress: null,
		icon: null,
		overlay: null,
		steamID: false,
		key: null,
		toggleState: false,
		triggered: false,
		init: function(key, category, section, showProgress) {
			this.parent();
			this.setSize(295, 50);
			this.key = key;
			category = sc.trophies.getTrophy(key);
			this.triggered = section = sc.trophies.isTrophyUnlocked(key);
			this.steamID = category.steamID || false;
			var condition = new ig.VarCondition("");
			!section && category.nameCond && condition.setCondition(category.nameCond);
			var color = 0;
			section || (color = 4);
			var hiddenText = "\\c[4]" + ig.lang.get("sc.gui.menu.trophies.questionMarks") + "\\c[4]";
			this.title = new sc.TextGui(condition.evaluate() ? this.getTextWithColor(category.name, color) : hiddenText);
			this.title.setPos(54, 1);
			this.addChildGui(this.title);
			!section && category.descCond ? condition.setCondition(category.descCond) : condition.setCondition("");
			hiddenText = "\\c[4]" + ig.lang.get("sc.gui.menu.trophies.questionMarksDesc") + "\\c[4]";
			this.description = new sc.TextGui(condition.evaluate() ? this.getTextWithColor(category.description, color) : hiddenText, {
				font: sc.fontsystem.smallFont,
				maxWidth: 224,
				linePadding: -1
			});
			this.description.hook.transitions = {
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
			this.description.setPos(66, 18);
			this.addChildGui(this.description);
			this.progress = new sc.TrophyProgress(category);
			this.progress.hook.transitions = {
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
			this.progress.setPos(66, 20);
			this.addChildGui(this.progress);
			this.toggleProgress(showProgress, true);
			this.icon = new sc.TrophyIconGraphic(category.icon, category.stars, category.points, section);
			this.addChildGui(this.icon);
			if (sc.menu.hasNewUnlockKey(sc.MENU_SUBMENU.TROPHY, key)) {
				this.overlay = new sc.NewUnlockOverlay;
				this.overlay.setPos(4, 3);
				this.overlay.activate();
				this.addChildGui(this.overlay)
			}
		},
		updateDrawables: function(drawables) {
			this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
			this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, this.focus ? "hfocus" : "hdefault", 1);
			drawables.addGfx(this.gfx, 55, 18, 530, 208, 9, 10);
			this.steamID && !this.toggleState && drawables.addGfx(this.gfx, this.hook.size.x - 17, this.hook.size.y - 16, 624, 496, 13, 12).setAlpha(this.triggered ? 0.8 : 0.25)
		},
		toggleProgress: function(show, skipAnim) {
			this.toggleState = show;
			if (sc.trophies.getTrophy(this.key).progType != "NONE")
				if (show) {
					this.progress.show(skipAnim);
					this.description.doStateTransition("HIDDEN", true)
				} else {
					this.progress.hide(skipAnim);
					this.description.doStateTransition("DEFAULT", true)
				}
			else {
				this.progress.hide(true);
				this.description.doStateTransition("DEFAULT", true)
			}
		},
		clearOverlay: function() {
			this.overlay && this.overlay.deactivate(true, true)
		},
		getTextWithColor: function(text, color) {
			text = ig.LangLabel.getText(text);
			color != 0 && (text = text.replace(colorTagRegex, ""));
			return "\\c[" + color + "]" + text + "\\c[0]"
		}
	});
	sc.TrophyProgress = ig.GuiElementBase.extend({
		numberGfx: new ig.Image("media/gui/basic.png"),
		bar: null,
		content: null,
		init: function(trophy) {
			this.parent("blue");
			this.setSize(222, 26);
			this.bar = new sc.TrophyProgressBar(trophy.triggered);
			this.bar.setPos(0, 2);
			this.addChildGui(this.bar);
			this.content = new ig.GuiElementBase("red");
			this.content.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0,
						scaleY: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.content.setSize(222, 10);
			this.content.setPos(0, 11);
			this.content.setPivot(0, 10);
			this.addChildGui(this.content);
			this.content.doStateTransition("DEFAULT", true);
			this.setProgress(trophy)
		},
		show: function() {
			this.doStateTransition("DEFAULT", true)
		},
		hide: function() {
			this.doStateTransition("HIDDEN", true)
		},
		setProgress: function(trophy) {
			this.content.removeAllChildren();
			var stats = trophy.stats,
				progressType = trophy.progType || (trophy.condition ? "CONDITION" : "VALUE");
			progressType == "VALUE" || progressType == "PERCENT" || progressType == "VALUE_HIDDEN" ? this.setProgressForValueType(trophy.triggered, progressType, stats) : progressType == "TIME" ? this.setProgressForTimeType(trophy.triggered, progressType, stats) : this.setProgressFallback(trophy.triggered)
		},
		setProgressFallback: function(triggered) {
			this.bar.setRatio(triggered ? 1 : 0);
			var icon = new ig.ImageGui(this.numberGfx, 96, !triggered ? 24 : 0, 8, 8);
			icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.content.addChildGui(icon);
			icon = new sc.NumberGui(1, {
				size: sc.NUMBER_SIZE.NORMAL,
				dots: true
			});
			icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			icon.setPos(-(icon.hook.size.x / 2) - 5, 0);
			icon.setNumber(triggered ? 1 : 0);
			this.content.addChildGui(icon);
			var max = new sc.NumberGui(1, {
				size: sc.NUMBER_SIZE.NORMAL,
				dots: true
			});
			max.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			max.setPos(max.hook.size.x / 2 + 5, 0);
			max.setNumber(1);
			this.content.addChildGui(max);
			if (!triggered) {
				icon.setColor(sc.GUI_NUMBER_COLOR.GREY);
				max.setColor(sc.GUI_NUMBER_COLOR.GREY)
			}
		},
		setProgressForTimeType: function(triggered, progressType, stats) {
			if (stats.length == 0) return this.setProgressFallback(triggered);
			var stat = stats[0],
				current = (stat.mapKey ? sc.stats.getMap(stat.key, stat.mapKey) : sc.stats.get(stat.key)) || 0,
				target = parseFloat(ig.Event.getExpressionValue(stat.value)),
				current = triggered ? target : Math.min(current, target);
			this.bar.setRatio(current / target);
			var icon = new ig.ImageGui(this.numberGfx, 96, !triggered ? 24 : 0, 8, 8);
			icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.content.addChildGui(icon);
			icon = new sc.SaveSlotPlayTime(sc.NUMBER_SIZE.NORMAL, 99, 2);
			icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			icon.setPos(-(icon.hook.size.x / 2) - 5, 0);
			icon.setTimeFromValue(current);
			icon.stat = stat;
			if (current < target) icon.update = function() {
				this.setTimeFromValue((this.stat.mapKey ? sc.stats.getMap(this.stat.key, this.stat.mapKey) : sc.stats.get(this.stat.key)) || 0, true)
			};
			this.content.addChildGui(icon);
			var max = new sc.SaveSlotPlayTime(sc.NUMBER_SIZE.NORMAL, 99, 2);
			max.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			max.setPos(max.hook.size.x / 2 + 5, 0);
			max.setTimeFromValue(target);
			this.content.addChildGui(max);
			if (!triggered) {
				icon.setColor(sc.GUI_NUMBER_COLOR.GREY);
				max.setColor(sc.GUI_NUMBER_COLOR.GREY)
			}
		},
		setProgressForValueType: function(triggered, progressType, stats) {
			for (var i = stats.length, current = 0, max = 0; i--;) var stat = stats[i],
				target = parseFloat(ig.Event.getExpressionValue(stat.value)),
				current = triggered ? current + target : current + Math.max(Math.min((stat.mapKey ? sc.stats.getMap(stat.key, stat.mapKey) : sc.stats.get(stat.key)) || 0, target), 0),
				max = max + target;
			current = Math.min(current, max);
			this.bar.setRatio(current / max);
			var icon = new ig.ImageGui(this.numberGfx, 96, !triggered ? 24 : 0, 8, 8);
			icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.content.addChildGui(icon);
			if (progressType == "VALUE" || progressType == "VALUE_HIDDEN") {
				icon = new sc.NumberGui(current || 1, {
					size: sc.NUMBER_SIZE.NORMAL,
					dots: true
				});
				icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				icon.setPos(-(icon.hook.size.x / 2) - 5, 0);
				icon.setNumber(current);
				this.content.addChildGui(icon);
				var maxGui = new sc.NumberGui(max, {
					size: sc.NUMBER_SIZE.NORMAL,
					dots: true,
					scramble: progressType == "VALUE_HIDDEN" && !triggered
				});
				maxGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				maxGui.setPos(maxGui.hook.size.x / 2 + 5, 0);
				maxGui.setNumber(max);
				this.content.addChildGui(maxGui);
				if (!triggered) {
					icon.setColor(sc.GUI_NUMBER_COLOR.GREY);
					maxGui.setColor(sc.GUI_NUMBER_COLOR.GREY)
				}
			} else if (progressType == "PERCENT") {
				icon = new sc.StatPercentNumber(100, {
					smallPercent: true
				});
				icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				icon.setNumber(current);
				icon.setPos(-(icon.hook.size.x / 2) - 5, 0);
				this.content.addChildGui(icon);
				maxGui = new sc.StatPercentNumber(100, {
					smallPercent: true
				});
				maxGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				maxGui.setNumber(max);
				maxGui.setPos(maxGui.hook.size.x / 2 + 5, 0);
				this.content.addChildGui(maxGui);
				if (!triggered) {
					icon.setColor(sc.GUI_NUMBER_COLOR.GREY);
					maxGui.setColor(sc.GUI_NUMBER_COLOR.GREY)
				}
			}
		}
	});
	sc.TrophyProgressBar = ig.GuiElementBase.extend({
		backgroundPatch: new ig.NinePatch("media/gui/menu.png", {
			width: 2,
			height: 0,
			left: 5,
			top: 5,
			right: 5,
			bottom: 0,
			offsets: {
				"default": {
					x: 48,
					y: 416
				}
			}
		}),
		ratio: 0,
		ratioSmall: 0,
		triggered: false,
		frame: 5,
		init: function(triggered) {
			this.parent();
			this.setSize(222, 5);
			this.ratio = 0;
			this.triggered = triggered
		},
		updateDrawables: function(drawables) {
			this.frame >= 1 && this.backgroundPatch.draw(drawables, this.hook.size.x, this.hook.size.y, "default");
			if (this.frame == 5) {
				drawables.addColor(this.triggered ? "#25b000" : "#156C00", 4, 0, this.ratio, 1);
				drawables.addColor(this.triggered ? "#25b000" : "#156C00", 3, 1, this.ratio, 1);
				drawables.addColor(this.triggered ? "#25b000" : "#156C00", 2, 2, this.ratio, 1);
				drawables.addColor(this.triggered ? "#25b000" : "#156C00", 1, 3, this.ratio, 1);
				drawables.addColor(this.triggered ? "#25b000" : "#156C00", 0, 4, this.ratio, 1)
			} else if (this.frame == 0) {
				drawables.addColor("#4d4d4d", 0, 4, this.hook.size.x, 1);
				drawables.addColor(this.triggered ? "#25b000" : "#156C00", 0, 4, this.ratioSmall, 1)
			}
		},
		setRatio: function(ratio) {
			this.ratio = Math.round(ratio * 218);
			this.ratioSmall = Math.round(ratio * 222)
		}
	});
	sc.TrophyIconGraphic = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		icons: new ig.Image("media/gui/feat-icons.png"),
		ribbon: null,
		icon: null,
		points: null,
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
		init: function(iconKey, stars, points, unlocked) {
			this.parent();
			this.setSize(43, 43);
			this.setPos(8, 3);
			iconKey = (sc.TROPHY_ICONS[iconKey] || 0).index;
			unlocked || (iconKey = 0);
			this.icon = new ig.ImageGui(this.icons, iconKey % 12 * 42, ~~(iconKey / 12) * 42, 42, 42);
			this.addChildGui(this.icon);
			this.ribbon = new ig.ImageGui(this.gfx, 576, unlocked ? 465 : 481, 51, 14);
			this.ribbon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.addChildGui(this.ribbon);
			this.points = new sc.NumberGui(points, {
				size: sc.NUMBER_SIZE.TINY,
				color: sc.GUI_NUMBER_COLOR.GREY
			});
			this.points.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.points.setNumber(points);
			this.points.setPos(1, 0);
			this.ribbon.addChildGui(this.points);
			this.addStars(stars, unlocked)
		},
		addStars: function(stars, unlocked) {
			var star = null;
			switch (sc.TROPHY_STARS[stars]) {
				case sc.TROPHY_STARS["1"]:
					star = this.createStar(unlocked);
					star.setPos(0, 0);
					break;
				case sc.TROPHY_STARS["2"]:
					star = this.createStar(unlocked);
					star.setPos(-5, 1);
					star = this.createStar(unlocked);
					star.setPos(5, 1);
					break;
				case sc.TROPHY_STARS["3"]:
					star = this.createStar(unlocked);
					star.setPos(0, 0);
					star = this.createStar(unlocked);
					star.setPos(-9, 1);
					star = this.createStar(unlocked);
					star.setPos(9, 1);
					break;
				case sc.TROPHY_STARS["4"]:
					star = this.createStar(unlocked);
					star.setPos(-5, 1);
					star = this.createStar(unlocked);
					star.setPos(5, 1);
					star = this.createStar(unlocked);
					star.setPos(-14, 3);
					star = this.createStar(unlocked);
					star.setPos(14, 3);
					break;
				case sc.TROPHY_STARS["5"]:
					star = this.createStar(unlocked);
					star.setPos(0, 0);
					star = this.createStar(unlocked);
					star.setPos(-8, 1);
					star = this.createStar(unlocked);
					star.setPos(8, 1);
					star = this.createStar(unlocked);
					star.setPos(-15, 4);
					star = this.createStar(unlocked);
					star.setPos(15, 4)
			}
		},
		createStar: function(unlocked) {
			unlocked = new ig.ImageGui(this.gfx, unlocked ? 576 : 585, 496, 7, 6);
			unlocked.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.ribbon.addChildGui(unlocked);
			return unlocked
		}
	})
});
ig.baked = !0;
