/**
 * @module game.feature.menu.gui.status.status-view-modifiers
 * @description The status menu's Modifiers page: current equipment modifiers
 *   vs element modifiers with +/- differences (sc.StatusViewModifiersContainer).
 */
ig.module("game.feature.menu.gui.status.status-view-modifiers").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.stats.stats-misc").defines(function() {
	sc.StatusViewModifiers = ig.GuiElementBase.extend({
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
			this.container = new sc.StatusViewModifiersContainer;
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
		updatePage: function(skip) {
			this.container.updateValues(false, skip)
		}
	});
	sc.StatusViewModifiersContainer = sc.MenuPanel.extend({
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
			var label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.modifierName"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(8, 4);
			this.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.equip"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(89, 4);
			this.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.skills"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(132, 4);
			this.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.info"), {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(169, 4);
			this.addChildGui(label);
			this.createParameterLines()
		},
		show: function() {
			this.doStateTransition("DEFAULT")
		},
		hide: function(skipTransition) {
			this.doStateTransition("HIDDEN", skipTransition)
		},
		updateValues: function(create, skipAnim) {
			if (create) {
				var equip = sc.model.player.equipModifiers,
					element = sc.model.player.elementConfigs[sc.menu.statusElement].modifiers,
					key;
				for (key in this.entries) this.updateLine(key, equip, element, false)
			} else this.createParameterLines(skipAnim)
		},
		updateLine: function(key, equip, element, skipAnim) {
			var entry = this.entries[key],
				equipValue = 0,
				elementValue = 0,
				equipValue = Math.round(((equip[key] || 1) - 1) * 100),
				elementValue = Math.round((element[key] || 0) * 100);
			entry.hook.pos.y >= 194 && (skipAnim = true);
			entry.updateValues(equipValue, elementValue, 0, skipAnim, elementValue - equipValue, 0, true)
		},
		createParameterLines: function(skipAnim) {
			var element = sc.model.player.elementConfigs[sc.menu.statusElement].modifiers,
				scrollY = skipAnim ? this.list.getScrollY() : 0;
			this.list.clear(true);
			var equip = sc.model.player.equipModifiers,
				entry = null,
				icon, noPercent = false,
				key;
			for (key in element)
				if (element[key] != 0) {
					icon = (entry = sc.MODIFIERS[key]) ? entry.icon : 50;
					noPercent = entry ? entry.noPercent : false;
					this.createLine(key, 5, icon, noPercent, entry.noPercent);
					this.updateLine(key, equip, element, skipAnim)
				} skipAnim && this.list.scrollY(scrollY, true)
		},
		createLine: function(key, lineID, icon, hideValues, noPercent) {
			var name = ig.lang.get("sc.gui.menu.equip.modifier." + key),
				description = ig.lang.get("sc.gui.menu.equip.descriptions." + key),
				line = new sc.StatusParamBar(name, description, 513, lineID, icon, true, true, noPercent);
			hideValues && line.hideValues(true);
			this.entries[key] = line;
			this.list.addEntry(line, 0);
			return line
		}
	})
});
ig.baked = !0;
