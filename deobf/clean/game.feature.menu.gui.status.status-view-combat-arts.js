/**
 * @module game.feature.menu.gui.status.status-view-combat-arts
 * @description The status menu's Combat Arts page: the four art types
 *   (THROW / ATTACK / DASH / GUARD) with their unlocked arts, SP costs,
 *   damage types and status effects (sc.StatusViewCombatArtsContainer).
 */
ig.module("game.feature.menu.gui.status.status-view-combat-arts").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.stats.stats-misc").defines(function() {
	var ART_TYPES = {
		THROW: {
			actionKey: "THROW_SPECIAL",
			icon: 0
		},
		ATTACK: {
			actionKey: "ATTACK_SPECIAL",
			icon: 1
		},
		DASH: {
			actionKey: "DASH_SPECIAL",
			icon: 2
		},
		GUARD: {
			actionKey: "GUARD_SPECIAL",
			icon: 3
		}
	};
	sc.StatusViewCombatArts = ig.GuiElementBase.extend({
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
			this.container = new sc.StatusViewCombatArtsContainer;
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
	sc.StatusViewCombatArtsContainer = sc.MenuPanel.extend({
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
			this.createArts(false)
		},
		show: function() {
			this.doStateTransition("DEFAULT")
		},
		hide: function(skipTransition) {
			this.doStateTransition("HIDDEN", skipTransition)
		},
		updateValues: function(skipAnim) {
			this.createArts(skipAnim)
		},
		createArts: function(skipAnim) {
			var scrollY = skipAnim ? this.list.getScrollY() : 0;
			this.list.clear(true);
			for (var type in ART_TYPES) this.addType(ART_TYPES[type]);
			skipAnim && this.list.scrollY(scrollY, true)
		},
		addType: function(artType) {
			var maxArts = this.getMaxArts(sc.menu.statusElement, artType);
			if (maxArts > 0) {
				var line = new sc.StatusViewCombatArtsLine(artType.actionKey, artType.icon);
				this.list.addEntry(line, 0);
				this.addArts(artType.actionKey, sc.menu.statusElement, maxArts)
			}
		},
		addArts: function(actionKey, element, maxArts) {
			for (var i = 0; i < 3; i++) {
				var art = sc.model.player.getActiveCombatArt(element, sc.PLAYER_ACTION[actionKey + (i + 1)]);
				if (art)
					if (art = sc.model.player.getCombatArt(element, art.name)) {
						art = new sc.StatusViewCombatArtsEntry(i + 1, art);
						this.list.addEntry(art);
						if (i != maxArts - 1) {
							art = new sc.StatusViewCombatArtsLineSingle;
							this.list.addEntry(art)
						}
					}
			}
		},
		getMaxArts: function(element, artType) {
			for (var count = 0, actionKey = artType.actionKey; count < 3 && sc.model.player.getActionByElement(element, sc.PLAYER_ACTION[actionKey + (count + 1)]);) count++;
			return count
		}
	});
	sc.StatusViewCombatArtsEntry = ig.GuiElementBase.extend({
		skillIcons: new ig.Image("media/gui/circuit-icons.png"),
		icon: null,
		level: null,
		sp: null,
		dmgType: null,
		stunType: null,
		condition: null,
		name: null,
		description: null,
		info: null,
		init: function(level, info) {
			this.parent();
			this.setSize(512, 41);
			this.info = info;
			this.addText("lvl", 9, 2);
			this.icon = new ig.ImageGui(this.skillIcons, info.icon % 10 * 24, Math.floor(info.icon / 10) * 24, 24, 24);
			this.icon.setPos(3, 12);
			this.addChildGui(this.icon);
			this.level = new sc.NumberGui(9, {
				size: sc.NUMBER_SIZE.LARGE
			});
			this.level.setNumber(level);
			this.level.setPos(25, 3);
			this.addChildGui(this.level);
			this.name = new sc.TextGui("\\c[3]" + info.name + "\\c[0]");
			this.name.setPos(40, -1);
			this.addChildGui(this.name);
			this.description = new sc.TextGui(info.description, {
				maxWidth: 460,
				font: sc.fontsystem.smallFont,
				linePadding: -3
			});
			this.description.setPos(40, 17);
			this.addChildGui(this.description);
			var x = 168,
				x = x + (this.addText("sp", x, 2).x + 3);
			this.sp = new sc.NumberGui(9);
			this.sp.setNumber(sc.PLAYER_SP_COST[level - 1]);
			this.sp.setPos(x, 3);
			this.addChildGui(this.sp);
			x = x + 13;
			x = x + (this.addText("dmgType", x, 2).x + 3);
			this.dmgType = new sc.TextGui(this.getDamageType(info.dmgType));
			this.dmgType.setPos(x, -1);
			this.addChildGui(this.dmgType);
			x = x + (this.dmgType.hook.size.x + 5);
			if (info.stunType || info.status && sc.menu.statusElement != 0) x = x + (this.addText("effects", x, 2).x + 2);
			if (info.stunType) {
				this.stunType = new sc.TextGui(this.getStunType(info.stunType));
				this.stunType.setPos(x, -1);
				this.addChildGui(this.stunType);
				x = x + (this.stunType.hook.size.x + 6)
			}
			if (info.status && sc.menu.statusElement != 0) {
				this.condition = new sc.TextGui(this.getConditionType(info.status));
				this.condition.setPos(x, -1);
				this.addChildGui(this.condition)
			}
		},
		addText: function(key, x, y) {
			key = new sc.TextGui("\\c[4]" + ig.lang.get("sc.gui.menu.status." + key) + "\\c[0]", {
				font: sc.fontsystem.tinyFont
			});
			key.setPos(x, y);
			this.addChildGui(key);
			return key.hook.size
		},
		getDamageType: function(dmgType) {
			return ig.lang.get("sc.gui.menu.status.damageTypes")[dmgType - 1]
		},
		getStunType: function(stunType) {
			var stunTypes = ig.lang.get("sc.gui.menu.status.stunTypes");
			return "\\i[status-stun-" + stunType + "]" + stunTypes[stunType - 1]
		},
		getConditionType: function() {
			var conditions = ig.lang.get("sc.gui.menu.status.conditions");
			return "\\i[status-cond-" + sc.menu.statusElement + "]" + ig.lang.get("sc.gui.menu.status.inflicts") + " " + conditions[sc.menu.statusElement]
		}
	});
	sc.StatusViewCombatArtsLine = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		text: null,
		icon: 0,
		init: function(actionKey, icon) {
			this.parent();
			this.setSize(515, 11);
			this.icon = icon || 0;
			this.text = new sc.TextGui(ig.lang.get("sc.gui.menu.status.artType." + actionKey), {
				font: sc.fontsystem.tinyFont
			});
			this.text.setPos(13, 3);
			this.addChildGui(this.text)
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#C7C7C7", 0, 10, this.hook.size.x, 1);
			drawables.addGfx(this.gfx, 0, 0, 640, 432 + this.icon * 12, 11, 11)
		}
	});
	sc.StatusViewCombatArtsLineSingle = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		init: function() {
			this.parent();
			this.setSize(502, 1)
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#545454", 0, 0, this.hook.size.x - 88, 1);
			drawables.addGfx(this.gfx, this.hook.size.x - 88, 0, 576, 511, 88, 1)
		}
	})
});
ig.baked = !0;
