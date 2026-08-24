/**
 * @module game.feature.menu.gui.stats.stats-types
 * @description The sc.STATS_ENTRY_TYPE registry: entry GUI widgets for the
 *   stats menu (Time, Percent, KeyValue, KeyCurMax, KeyValuePercent,
 *   Separator, Logs), plus the comma-formatter helper.
 */
ig.module("game.feature.menu.gui.stats.stats-types").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.save.save-misc", "game.feature.menu.gui.stats.stats-gui-builds", "game.feature.menu.gui.stats.stats-misc", "game.feature.menu.gui.synop.synop-misc").defines(function() {
	function formatWithCommas(value) {
		for (var sep = ig.currentLang + "", sep = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", regex = /(\d+)(\d{3})/, value = value + ""; regex.test(value);) value =
			value.replace(regex, "$1" + sep + "$2");
		return value
	}
	sc.STATS_ENTRY_TYPE = {};
	sc.StatsBaseEntryGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		key: null,
		keyGui: null,
		valueGui: null,
		init: function(key, settings, width) {
			this.parent();
			this.setSize(width, 20);
			this.key = key;
			this.keyGui = new sc.TextGui("");
			this.keyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.keyGui.setPos(5, 0);
			this.addChildGui(this.keyGui);
			var label = null;
			if (settings.displayName) label = settings.displayName;
			else(label = ig.lang.get("sc.gui.menu.stats.keys")[key]) || (label = "\\c[1]~ " + key + "\\c[0]");
			this.keyGui.setText(label);
			if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(512, 184, 16, 4, ig.ImagePattern.OPT.REPEAT_X)
		},
		updateDrawables: function(drawables) {
			if (this.keyGui && this.valueGui) {
				var x = this.keyGui.hook.size.x + this.keyGui.hook.pos.x + 1,
					width = this.hook.size.x - this.keyGui.hook.size.x - this.valueGui.hook.size.x - 10,
					width = Math.floor(width / 4) * 4;
				drawables.addPattern(this.constructor.PATTERN, x, 12, 0, 0, width, 4)
			}
		}
	});
	sc.STATS_ENTRY_TYPE.Time = sc.StatsBaseEntryGui.extend({
		stat: null,
		map: null,
		value: null,
		updateTime: false,
		init: function(key, settings, width) {
			this.parent(key, settings, width);
			this.stat = settings.stat || key;
			this.map = settings.map || null;
			this.updateTime = settings.update || false;
			this.valueGui = new sc.SaveSlotPlayTime(sc.NUMBER_SIZE.TEXT, settings.max, settings.leading, settings.transitionTime, settings.millis, settings.hideHours);
			this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.valueGui.setPos(5, 2);
			this.addChildGui(this.valueGui);
			var seconds = 0;
			if (settings.value) {
				this.value = settings.value;
				seconds = this.value()
			} else seconds = sc.stats.getMap(this.map, this.stat);
			this.valueGui.second.setNumber(Math.floor(seconds) % 60, true);
			this.valueGui.minute.setNumber(Math.floor(seconds / 60) % 60, true);
			this.valueGui.hour.setNumber(Math.floor(seconds / 60 / 60), true)
		},
		update: function() {
			if (this.updateTime && this.map && this.stat) {
				var seconds = 0,
					seconds = this.value ? this.value() : sc.stats.getMap(this.map, this.stat);
				this.valueGui.second.setNumber(Math.floor(seconds) % 60, true);
				this.valueGui.minute.setNumber(Math.floor(seconds / 60) % 60, true);
				this.valueGui.hour.setNumber(Math.floor(seconds / 60 / 60), true)
			}
		},
		setTime: function(seconds, transitionTime) {
			this.valueGui.setTimeFromValue(seconds, transitionTime)
		}
	});
	sc.STATS_ENTRY_TYPE.Percent = sc.StatsBaseEntryGui.extend({
		init: function(key, settings, width) {
			this.parent(key, settings, width);
			var value = 0,
				value = settings.calc ? settings.calc() : settings.map ? sc.stats.getMap(settings.map, settings.stat || key) || 0 : sc.stats.get(settings.stat || key) || 0,
				label = null;
			if (settings.displayName) label = settings.displayName;
			else(label = ig.lang.get("sc.gui.menu.stats.keys")[key]) || (label = "\\c[1]~ " + label + "\\c[0]");
			this.valueGui = new sc.StatPercentNumber(null, {
				size: sc.NUMBER_SIZE.TEXT,
				leadingZeros: settings.frontLeading || 1,
				scramble: value >= 1 ? false : settings.scramble
			});
			if (settings.highlight)
				if (settings.highlight.min != void 0) {
					if (value >= settings.highlight.min) {
						this.valueGui.setColor(sc.GUI_NUMBER_COLOR.ORANGE);
						this.keyGui.setText("\\c[3]" + label + "\\c[0]")
					}
				} else {
					this.valueGui.setColor(sc.GUI_NUMBER_COLOR.ORANGE);
					this.keyGui.setText("\\c[3]" + label + "\\c[0]")
				} this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.valueGui.setPos(5, 0);
			this.valueGui.setNumber(Math.min(100, value));
			this.addChildGui(this.valueGui)
		}
	});
	sc.STATS_ENTRY_TYPE.KeyValue = sc.StatsBaseEntryGui.extend({
		init: function(key, settings, width) {
			this.parent(key, settings, width);
			var stat = settings.stat || null,
				map = settings.map || null,
				value = 0,
				value = settings.value ? typeof settings.value == "function" ? settings.value() || 0 : settings.value || 0 : map ? sc.stats.getMap(map, stat || key) || 0 : sc.stats.get(stat || key) || 0;
			settings.add && (value = value + (settings.add || 0));
			settings.hideNameIfNull && value == 0 && this.keyGui.setText("???????????????");
			if (settings.asNumber) {
				this.valueGui = new sc.NumberGui(settings.maxValue || null, {
					leadingZeros: settings.leadingZeros || 0,
					size: settings.numberSize || sc.NUMBER_SIZE.TEXT,
					signed: value == 0,
					dots: settings.numberDots,
					transitionTime: settings.transitionTime || 0
				});
				this.valueGui.setNumber(value)
			} else this.valueGui = new sc.TextGui(formatWithCommas(value) + (settings.postfix ? settings.postfix() : ""));
			this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.valueGui.setPos(5, 0);
			this.addChildGui(this.valueGui)
		},
		setValue: function(value, formatted, postfix) {
			this.valueGui.setText((formatted ? formatWithCommas(value) : value) + (postfix ? postfix : ""))
		},
		setValueAsNumber: function(value, transitionTime) {
			this.valueGui.setMaxNumber(value || 5);
			this.valueGui.setNumber(value, transitionTime)
		}
	});
	sc.STATS_ENTRY_TYPE.KeyCurMax = sc.StatsBaseEntryGui.extend({
		init: function(key, settings, width) {
			this.parent(key, settings, width);
			var stat = settings.stat || null,
				map = settings.map || null,
				value = 0,
				value = settings.value ? typeof settings.value == "function" ? settings.value() || 0 : settings.value || 0 : map ? sc.stats.getMap(map, stat || key) || 0 : sc.stats.get(stat || key) || 0,
				max = settings.max ? settings.max() : 0,
				curText = formatWithCommas(Math.min(max, value + (settings.add || 0))),
				maxText = formatWithCommas(max);
			settings.hide && settings.hide(value, max) && (maxText = "???");
			var text = null,
				text = settings.highlight ? value >= max ? "\\c[3]" + curText + "\\i[slash-highlight]" + maxText + "\\c[0]" : curText + "\\i[slash]" + maxText : curText + "\\i[slash]" + maxText;
			this.valueGui = new sc.TextGui(text);
			this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.valueGui.setPos(5, 0);
			this.addChildGui(this.valueGui)
		}
	});
	sc.STATS_ENTRY_TYPE.KeyValuePercent = sc.StatsBaseEntryGui.extend({
		numberGui: null,
		percentGui: null,
		init: function(key, settings, width) {
			this.parent(key, settings, width);
			var stat = settings.stat || null,
				map = settings.map || null,
				value = 0,
				value = settings.value ? typeof settings.value == "function" ? settings.value() || 0 : settings.value || 0 : map ? sc.stats.getMap(map, stat || key) || 0 : sc.stats.get(stat || key) || 0;
			this.numberGui = new sc.TextGui(formatWithCommas(value) + "\\i[arrow-percent]");
			this.numberGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			var percent = 0;
			if (settings.calc) percent = settings.calc();
			else percent = (percent = settings.maxMap ? sc.stats.getMap(settings.maxMap, settings.maxStat || key) || 0 : sc.stats.get(settings.maxStat || key) || 0) ? Math.min(1, value / percent) : 0;
			this.percentGui = new sc.StatPercentNumber(null, {
				size: sc.NUMBER_SIZE.TEXT,
				leadingZeros: 2
			});
			this.percentGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.percentGui.setNumber(percent);
			this.valueGui = new ig.GuiElementBase;
			this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.valueGui.setPos(5, 0);
			this.addChildGui(this.valueGui);
			this.valueGui.addChildGui(this.numberGui);
			this.valueGui.addChildGui(this.percentGui);
			this.valueGui.setSize(this.numberGui.hook.size.x + this.percentGui.hook.size.x + 2, 20)
		}
	});
	sc.STATS_ENTRY_TYPE.Separator = ig.GuiElementBase.extend({
		separatorText: null,
		init: function(key, settings, width) {
			this.parent();
			this.setSize(width, 14);
			if (settings.noText) {
				var line = new ig.ColorGui("#545454", width + 5, 1);
				line.setPos(0, 0);
				this.addChildGui(line);
				this.hook.size.y = 1
			} else {
				this.separatorText = new sc.TextGui(ig.lang.get("sc.gui.menu.stats.groups." + (settings.group || key)), {
					font: sc.fontsystem.tinyFont
				});
				this.separatorText.setPos(2, 3);
				this.addChildGui(this.separatorText);
				line = new ig.ColorGui("#545454", width + 5, 1);
				line.setPos(0, 11);
				this.addChildGui(line)
			}
		}
	});
	sc.STATS_ENTRY_TYPE.Logs = ig.GuiElementBase.extend({
		init: function(key, settings, width) {
			this.parent();
			this.setSize(width, 20);
			for (var entries = sc.menu.logEntries, i = entries.length, count = 0, entry = null, entry = null, offset = 0; i--;) {
				var entry = entries[i],
					entryType = sc.LOG_GUI_TYPE[entry.type];
				if (entryType && (!entryType.isAvailable || entryType.isAvailable(entry))) {
					count++;
					entry = new sc.LOG_GUI_TYPE[entry.type](entry);
					entry.setPos(3, offset);
					this.addChildGui(entry);
					offset = offset + entry.hook.size.y;
					if (count >= 50) break
				}
			}
			this.hook.size.y = offset
		}
	})
});
ig.baked = !0;
