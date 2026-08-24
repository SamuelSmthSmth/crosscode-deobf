/**
 * @module game.feature.menu.gui.status.status-view-main
 * @description The status menu's Main page: player parameters (level, HP/SP/EXP
 *   bars, base + element values) on the right and the equipped body parts on
 *   the left.
 */
ig.module("game.feature.menu.gui.status.status-view-main").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
	function getPercentDiff(index, factors) {
		return Math.round(-(factors[index] - 1) * 100) / 100
	}
	sc.StatusViewMain = ig.GuiElementBase.extend({
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
		params: null,
		equip: null,
		init: function() {
			this.parent();
			this.setSize(ig.system.width, ig.system.height);
			this.params = new sc.StatusViewMainParameters;
			this.addChildGui(this.params);
			this.equip = new sc.StatusViewMainEquipment;
			this.addChildGui(this.equip);
			this.hide(true)
		},
		show: function() {
			this.params.show();
			this.equip.show()
		},
		hide: function(skipTransition) {
			this.params.hide(skipTransition);
			this.equip.hide(skipTransition)
		},
		updatePage: function() {
			this.params.updateValues()
		}
	});
	sc.StatusViewMainEquipment = sc.MenuPanel.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: -190
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		bodyparts: {},
		init: function() {
			this.parent(sc.MenuPanelType.TOP_LEFT_EDGE);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.setSize(165, 135);
			this.setPos(25, 59);
			var y = 5,
				y = y + (this.createEntry("head", 0, y) + 3),
				y = y + (this.createEntry("rightarm", 0, y) + 3),
				y = y + (this.createEntry("leftarm", 0, y) + 3),
				y = y + (this.createEntry("torso", 0, y) + 3);
			this.createEntry("feet", 0, y);
			this.doStateTransition("HIDDEN", true)
		},
		show: function() {
			this.updateValues();
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		},
		updateValues: function() {
			for (var part in this.bodyparts) this.bodyparts[part].setItem(this.getEquipID(part))
		},
		createEntry: function(part, x, y) {
			var entry = new sc.StatusViewMainEquipment.Entry(part);
			entry.setPos(x, y);
			this.addChildGui(entry);
			this.bodyparts[part] = entry;
			return entry.hook.size.y
		},
		getEquipID: function(part) {
			var player = sc.model.player;
			switch (part) {
				case "head":
					return player.equip.head;
				case "rightarm":
					return player.equip.rightArm;
				case "leftarm":
					return player.equip.leftArm;
				case "torso":
					return player.equip.torso;
				case "feet":
					return player.equip.feet
			}
		}
	});
	sc.StatusViewMainEquipment.Entry = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		textGui: null,
		itemGui: null,
		bodypart: null,
		init: function(part) {
			this.parent();
			this.setSize(165, 23);
			this.bodypart = part || "head";
			this.textGui = new sc.TextGui(ig.lang.get("sc.gui.menu.equip." + part), {
				font: sc.fontsystem.tinyFont
			});
			this.textGui.setPos(4, 0);
			this.addChildGui(this.textGui);
			this.itemGui = new sc.TextGui("\\i[item-default]Generic Equipment");
			this.itemGui.setPos(13, 7);
			this.addChildGui(this.itemGui)
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 7, 0, 403, 165, 1)
		},
		setItem: function(itemId) {
			if (itemId < 0) {
				this.itemGui.setText("--------------------");
				this.itemGui.setDrawCallback(null)
			} else {
				var level = sc.inventory.getItemLevel(itemId);
				this.itemGui.setText(sc.inventory.getItemNameWithIcon(itemId));
				this.itemGui.level = level;
				this.itemGui.isScalable = sc.inventory.isScalable(itemId);
				this.itemGui.numberGfx = this.gfx;
				this.itemGui.setDrawCallback(function(drawables, transform) {
					sc.MenuHelper.drawLevel(this.level, drawables, transform, this.numberGfx, this.isScalable)
				}.bind(this.itemGui))
			}
		}
	});
	sc.StatusViewMainParameters = sc.MenuPanel.extend({
		menuGfx: new ig.Image("media/gui/menu.png"),
		statusGfx: new ig.Image("media/gui/status-gui.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: -151
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		level: null,
		hpBar: null,
		spBar: null,
		expBar: null,
		baseParams: {
			hp: null,
			atk: null,
			def: null,
			foc: null,
			fire: null,
			cold: null,
			shock: null,
			wave: null
		},
		skinGfx: null,
		bounds: null,
		init: function() {
			this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
			this.setSize(126, 215);
			this.setPos(25, 59);
			this.level = new sc.NumberGui(99, {
				size: sc.NUMBER_SIZE.LARGE
			});
			this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.level.setPos(3, 2);
			this.addChildGui(this.level);
			this.hpBar = new sc.ItemStatusDefaultBar("HP", sc.MENU_BAR_TYPE.HP);
			this.hpBar.setPos(0, 39);
			this.addChildGui(this.hpBar);
			this.hpBar.updateValues(true);
			this.hpBar.annotation = {
				size: {
					x: this.hpBar.hook.size.x + 2,
					y: this.hpBar.hook.size.y + 2
				},
				offset: {
					x: -1,
					y: -1
				},
				content: {
					title: "sc.gui.menu.help.item.titles.hp",
					description: "sc.gui.menu.help.item.description.hp"
				},
				index: {
					x: 0
				}
			};
			this.spBar = new sc.ItemStatusDefaultBar("SP", sc.MENU_BAR_TYPE.SP);
			this.spBar.setPos(0, 57);
			this.addChildGui(this.spBar);
			this.spBar.updateValues(true);
			this.spBar.annotation = {
				size: {
					x: this.spBar.hook.size.x + 2,
					y: this.spBar.hook.size.y + 2
				},
				offset: {
					x: -1,
					y: -1
				},
				content: {
					title: "sc.gui.menu.help.item.titles.sp",
					description: "sc.gui.menu.help.item.description.sp"
				},
				index: {
					x: 0
				}
			};
			this.expBar = new sc.ItemStatusDefaultBar("EXP", sc.MENU_BAR_TYPE.EXP);
			this.expBar.setPos(0, 77);
			this.addChildGui(this.expBar);
			this.expBar.updateValues(true);
			this.expBar.annotation = {
				size: {
					x: this.expBar.hook.size.x + 2,
					y: this.expBar.hook.size.y + 2
				},
				offset: {
					x: -1,
					y: -1
				},
				content: {
					title: "sc.gui.menu.help.item.titles.exp",
					description: "sc.gui.menu.help.item.description.exp"
				},
				index: {
					x: 0
				}
			};
			var y = 97;
			this.baseParams.hp = this.createStatusDisplay(0, y, "maxhp", 0, 0, false, 9999);
			y = y + 14;
			this.baseParams.atk = this.createStatusDisplay(0, y, "atk", 0, 1, false, 999);
			y = y + 14;
			this.baseParams.def = this.createStatusDisplay(0, y, "def", 0, 2, false, 999);
			y = y + 14;
			this.baseParams.foc = this.createStatusDisplay(0, y, "foc", 0, 3, false, 999);
			y = y + 18;
			this.baseParams.fire = this.createStatusDisplay(0, y, "res", 1, 4, true, 999);
			y = y + 14;
			this.baseParams.cold = this.createStatusDisplay(0, y, "res", 2, 5, true, 999);
			y = y + 14;
			this.baseParams.shock = this.createStatusDisplay(0, y, "res", 3, 6, true, 999);
			this.baseParams.wave = this.createStatusDisplay(0, y + 14, "res", 4, 7, true, 999);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			this.parent(drawables);
			drawables.addGfx(this.menuGfx, 0, 0, 280, 472, 126, 35);
			this.skinGfx && this.bounds ? drawables.addGfx(this.skinGfx, 0, 0, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h) :
				drawables.addGfx(this.menuGfx, 0, 0, 211, 26, 60, 34);
			drawables.addGfx(this.statusGfx, 64, 5, 104, 32 + sc.model.player.currentElementMode * 24, 24, 24)
		},
		show: function() {
			this.updateValues(true);
			this.checkSkin();
			this.doStateTransition("DEFAULT")
		},
		hide: function(skipTransition) {
			this.doStateTransition("HIDDEN", skipTransition)
		},
		checkSkin: function() {
			var skin = sc.playerSkins.getCurrentSkin("Appearance");
			if (skin && skin.loaded) {
				this.skinGfx = skin.guiImage;
				this.bounds = skin.guiImageBounds ? skin.guiImageBounds.face || null : null
			} else this.bounds = this.skinGfx = null
		},
		createStatusDisplay: function(x, y, key, elementIndex, index, isPercent, maxValue) {
			index = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + key), elementIndex, index, isPercent, maxValue, true, 126);
			index.changeValueGui.numTransitionTime = 0.2;
			if (!isPercent) {
				index.changeValueGui.showPlus = false;
				index.stayWhite = true
			}
			index.setPos(x, y);
			if (key == "res") {
				elementIndex == 1 && (key = "heat");
				elementIndex == 2 && (key = "cold");
				elementIndex == 3 && (key = "shock");
				elementIndex == 4 && (key = "wave")
			}
			index.annotation = {
				type: "INFO",
				content: {
					title: "sc.gui.menu.equip." + key,
					description: "sc.gui.menu.equip.descriptions." + key
				},
				offset: {
					x: -1,
					y: -1
				},
				index: {
					x: 0
				}
			};
			this.addChildGui(index);
			return index
		},
		updateValues: function(skipAnim) {
			this.level.setNumber(sc.model.player.level);
			this.hpBar.updateValues(skipAnim);
			this.expBar.updateValues(skipAnim);
			this.spBar.updateValues(skipAnim);
			var player = sc.model.player,
				currentElement = player.getCurrentElementMode(),
				element = player.elementConfigs[sc.menu.statusElement],
				currentElement = element.getParam("hp") - (currentElement.getParam("hp") - player.params.currentHp);
			this.hpBar.updateValues(skipAnim, player, currentElement, element.getParam("hp"));
			this.baseParams.hp.setChangeValue(element.getParam("hp") || 0, skipAnim);
			this.baseParams.atk.setChangeValue(element.getParam("attack") || 0, skipAnim);
			this.baseParams.def.setChangeValue(element.getParam("defense") || 0, skipAnim);
			this.baseParams.foc.setChangeValue(element.getParam("focus") || 0, skipAnim);
			currentElement = element.getParam("elemFactor");
			this.baseParams.fire.setChangeValue(getPercentDiff(0, currentElement), skipAnim, true);
			this.baseParams.cold.setChangeValue(getPercentDiff(1, currentElement), skipAnim, true);
			this.baseParams.shock.setChangeValue(getPercentDiff(2, currentElement), skipAnim, true);
			this.baseParams.wave.setChangeValue(getPercentDiff(3, currentElement), skipAnim, true)
		}
	})
});
ig.baked = !0;
