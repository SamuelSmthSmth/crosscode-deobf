/**
 * @module game.feature.menu.gui.status.status-view-parameters
 * @description The status menu's Parameters page: base vs equipment vs element
 *   parameter lines with +/- differences (sc.StatusViewParametersContainer).
 */
ig.module("game.feature.menu.gui.status.status-view-parameters").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.stats.stats-misc").defines(function() {
	sc.StatusViewParameters = ig.GuiElementBase.extend({
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
		container: null,
		init: function() {
			this.parent();
			this.setSize(ig.system.width, ig.system.height);
			this.container = new sc.StatusViewParametersContainer;
			this.addChildGui(this.container);
			this.hide(true)
		},
		show: function() {
			this.container.updateValues(true);
			this.container.show()
		},
		hide: function(skipTransition) {
			this.container.hide(skipTransition)
		},
		updatePage: function() {
			this.container.updateValues()
		}
	});
	sc.StatusViewParametersContainer = sc.MenuPanel.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: 271.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		bg: null,
		list: null,
		entries: {},
		init: function() {
			this.parent(sc.MenuPanelType.TOP_LEFT_EDGE);
			this.setSize(518, 213);
			this.setPos(25, 59);
			this.bg = new sc.MenuScanLines;
			this.bg.setPos(0, 11);
			this.bg.setSize(this.hook.size.x, 196);
			this.addChildGui(this.bg);
			this.list = new sc.StatsScrollPane(2);
			this.list.onCheckScrollable = function() {
				return !sc.menu.helpMenuOpen
			};
			this.list.setPos(0, 11);
			this.list.setSize(this.hook.size.x, 196);
			this.addChildGui(this.list);
			var label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.param"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(8, 4);
			this.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.base"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(89, 4);
			this.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.equip"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(132, 4);
			this.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.skills"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(174, 4);
			this.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.info"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(213, 4);
			this.addChildGui(label);
			this.createParameterLines()
		},
		show: function() {
			this.doStateTransition("DEFAULT")
		},
		hide: function(skipTransition) {
			this.doStateTransition("HIDDEN", skipTransition)
		},
		updateValues: function(skipAnim) {
			var player = sc.model.player,
				base = player.baseParams,
				equip = player.equipParams,
				element = player.elementConfigs[sc.menu.statusElement].baseParams;
			this.updateLine("maxhp", "hp", base, equip, element, skipAnim);
			this.updateLine("atk", "attack", base, equip, element, skipAnim);
			this.updateLine("def", "defense", base, equip, element, skipAnim);
			this.updateLine("foc", "focus", base, equip, element, skipAnim);
			this.updateLine("heat", "elemFactor", base, equip, element, skipAnim);
			this.updateLine("cold", "elemFactor", base, equip, element, skipAnim);
			this.updateLine("shock", "elemFactor", base, equip, element, skipAnim);
			this.updateLine("wave", "elemFactor", base, equip, element, skipAnim)
		},
		updateLine: function(entryKey, param, base, equip, element, skipAnim) {
			var entry = this.entries[entryKey],
				baseValue = 0,
				equipValue = 0,
				elementValue = 0;
			if (entry.usePercent) {
				var index = entry.lineID - 1;
				baseValue = Math.round(-(base[param][index] - 1) * 100);
				equipValue = Math.round((equip[param][index] - 1) * 100);
				elementValue = Math.round(-(element[param][index] - 1) * 100)
			} else {
				baseValue = base[param];
				equipValue = equip[param];
				elementValue = element[param]
			}
			entry.updateValues(baseValue, equipValue, elementValue, skipAnim, equipValue - baseValue, elementValue - equipValue, true)
		},
		createParameterLines: function() {
			this.createLine("maxhp", 0, 0, false);
			this.createLine("atk", 0, 1, false, null, null, true);
			this.createLine("def", 0, 2, false, null, null, true);
			this.createLine("foc", 0, 3, false, null, 0, true);
			this.createLine("res", 1, 4, true, "heat");
			this.createLine("res", 2, 5, true, "cold");
			this.createLine("res", 3, 6, true, "shock");
			this.createLine("res", 4, 7, true, "wave")
		},
		createLine: function(key, lineID, index, usePercent, entryKey, heightOffset, useNoAnim) {
			var name = ig.lang.get("sc.gui.menu.equip." + key),
				description = ig.lang.get("sc.gui.menu.equip.descriptions." + (entryKey || key)),
				line = new sc.StatusParamBar(name, description, 513, lineID, index, usePercent, null, null, useNoAnim);
			if (heightOffset) line.hook.size.y = line.hook.size.y + heightOffset;
			this.entries[entryKey || key] = line;
			this.list.addEntry(line, 0)
		}
	})
});
ig.baked = !0;
