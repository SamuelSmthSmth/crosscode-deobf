/**
 * @module game.feature.menu.gui.status.status-misc
 * @description Status menu helpers: sc.StatusPageSwitch and sc.StatusElementSwitch
 *   (page / element pager buttons) and sc.StatusParamBar (one parameter row with
 *   base / equipment / skills values, +/- differences and modifier icons).
 */
ig.module("game.feature.menu.gui.status.status-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
	var lineColors = ["#8bb5ff", "#ba0000", "#0036d0", "#a121bc", "#00994c", "#c7c7c7"];
	sc.StatusPageSwitch = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					offsetX: -195,
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		left: null,
		right: null,
		text: null,
		init: function() {
			this.parent();
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.setSize(170, 21);
			this.setPos(25, 27);
			this.hook.localAlpha = 0.5;
			this.text = new sc.TextGui("NONE");
			this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.text);
			this.annotation = {
				type: "INFO",
				content: {
					title: "sc.gui.menu.help.status.titles.page",
					description: "sc.gui.menu.help.status.description.page"
				},
				offset: {
					x: 38,
					y: 0
				},
				size: {
					x: 94,
					y: 21,
					offX: 6
				}
			};
			this.left = new sc.ButtonGui("\\i[arrow-left]", 34, true, sc.BUTTON_TYPE.SMALL);
			this.left.submitSound = null;
			this.left.keepMouseFocus = true;
			this.left.setPos(0, 0);
			this.left.onButtonPress = function() {
				this.updateStatusPage(-1)
			}.bind(this);
			this.addChildGui(this.left);
			this.right = new sc.ButtonGui("\\i[arrow-right]", 34, true, sc.BUTTON_TYPE.SMALL);
			this.right.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.right.submitSound = null;
			this.right.keepMouseFocus = true;
			this.right.onButtonPress = function() {
				this.updateStatusPage(1)
			}.bind(this);
			this.addChildGui(this.right);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#000", 8, 0, this.hook.size.x - 16, this.hook.size.y)
		},
		show: function() {
			this.updateCurrentPageName();
			sc.menu.buttonInteract.addGlobalButton(this.left, this.onLeftPressCheck.bind(this));
			sc.menu.buttonInteract.addGlobalButton(this.right, this.onRightPressCheck.bind(this));
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			sc.menu.buttonInteract.removeGlobalButton(this.left);
			sc.menu.buttonInteract.removeGlobalButton(this.right);
			this.doStateTransition("HIDDEN")
		},
		updateCurrentPageName: function() {
			var pages = ig.lang.get("sc.gui.menu.status.pages");
			this.text.setText(pages[sc.menu.statusPage])
		},
		updateStatusPage: function(direction) {
			var page = sc.menu.statusPage,
				newPage = page;
			if (direction > 0) {
				page++;
				page >= sc.MENU_STATUS_PAGES_LENGTH && (page = 0)
			} else {
				page--;
				page < 0 && (page = sc.MENU_STATUS_PAGES_LENGTH - 1)
			}
			if (newPage != page) {
				sc.BUTTON_SOUND.submit.play();
				sc.menu.setStatusPage(page);
				this.updateCurrentPageName()
			}
		},
		onLeftPressCheck: function() {
			return ig.interact.isBlocked() ? false : sc.control.menuCircleLeft()
		},
		onRightPressCheck: function() {
			return ig.interact.isBlocked() ? false : sc.control.menuCircleRight()
		}
	});
	sc.StatusElementSwitch = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					offsetX: -195,
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		left: null,
		right: null,
		icon: null,
		init: function() {
			this.parent();
			this.setSize(108, 21);
			this.setPos(25, 27);
			this.hook.localAlpha = 0.5;
			this.icon = new ig.ImageGui(this.gfx, 104, 32, 24, 24);
			this.icon.setPos(0, 1);
			this.icon.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.icon);
			this.icon.annotation = {
				content: {
					title: "sc.gui.menu.help.status.titles.element",
					description: "sc.gui.menu.help.status.description.element"
				},
				offset: {
					x: 0,
					y: 1
				},
				size: {
					x: 23,
					y: 21
				},
				index: {
					x: 0
				}
			};
			this.left = new sc.ButtonGui("\\i[page-left]", 32, true, sc.BUTTON_TYPE.SMALL);
			this.left.submitSound = null;
			this.left.textChild.setPos(1, 0);
			this.left.keepMouseFocus = true;
			this.left.setPos(0, 0);
			this.left.onButtonPress = function() {
				this.updateElement(-1)
			}.bind(this);
			this.addChildGui(this.left);
			this.right = new sc.ButtonGui("\\i[page-right]", 32, true, sc.BUTTON_TYPE.SMALL);
			this.right.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.right.textChild.setPos(1, 0);
			this.right.submitSound = null;
			this.right.keepMouseFocus = true;
			this.right.onButtonPress = function() {
				this.updateElement(1)
			}.bind(this);
			this.addChildGui(this.right);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#000", 8, 0, this.hook.size.x - 16, this.hook.size.y)
		},
		show: function() {
			this.updateCurrentElementIcon();
			sc.menu.buttonInteract.addGlobalButton(this.left, this.onLeftPressCheck.bind(this));
			sc.menu.buttonInteract.addGlobalButton(this.right, this.onRightPressCheck.bind(this));
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			sc.menu.buttonInteract.removeGlobalButton(this.left);
			sc.menu.buttonInteract.removeGlobalButton(this.right);
			this.doStateTransition("HIDDEN")
		},
		updateCurrentElementIcon: function() {
			this.icon.offsetY = 32 + 24 * sc.menu.statusElement
		},
		updateElement: function(direction) {
			var oldElement = sc.menu.statusElement,
				element = sc.menu.statusElement,
				player = sc.model.player;
			do {
				element = element + direction;
				direction > 0 ? element > 4 && (element = 0) : element < 0 && (element = 4)
			} while (!player.hasElement(element));
			if (oldElement != element) {
				sc.BUTTON_SOUND.submit.play();
				sc.menu.setStatusElement(element);
				this.updateCurrentElementIcon()
			}
		},
		onLeftPressCheck: function() {
			return sc.control.leftPressed()
		},
		onRightPressCheck: function() {
			return sc.control.rightPressed()
		}
	});
	sc.StatusParamBar = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		name: "nope.",
		lineID: 0,
		iconID: 0,
		usePercent: false,
		iconIndex: Vec2.createC(0, 0),
		skipVertLine: false,
		base: null,
		equip: null,
		skills: null,
		equipAdd: null,
		skillAdd: null,
		description: null,
		guis: [],
		_baseRed: false,
		_equipRed: false,
		_skillsRed: false,
		_hideAll: false,
		_skillHidden: false,
		_noPercent: false,
		init: function(name, description, width, lineID, iconID, usePercent, skillHidden, noPercent, useNoAnim) {
			this.parent();
			this.setSize(Math.max(width || 169, 169), 24);
			this.name = name || "nope.";
			this.lineID = lineID || 0;
			this.iconID = iconID || 0;
			this.usePercent = usePercent || false;
			this._skillHidden = skillHidden || false;
			this._noPercent = noPercent || false;
			this.iconIndex.x = this.iconID % sc.MODIFIER_ICON_DRAW.MAX_PER_ROW;
			this.iconIndex.y = Math.floor(this.iconID / sc.MODIFIER_ICON_DRAW.MAX_PER_ROW);
			this.nameGui = new sc.TextGui(name, {
				font: sc.fontsystem.tinyFont
			});
			this.nameGui.setPos(13, 3);
			this.addChildGui(this.nameGui);
			var maxNumber = this.usePercent ? 999 : 9999;
			useNoAnim && (maxNumber = 999);
			this.base = new sc.NumberGui(maxNumber, {
				signed: this.usePercent,
				transitionTime: 0.2
			});
			this.base.setPos(83 - (this.usePercent ? 8 : 0), 3);
			this.base.setNumber(0, true);
			this.guis.push(this.base);
			this.addTransitions(this.base);
			this.addChildGui(this.base);
			if (useNoAnim) this.base.hook.pos.x = this.base.hook.pos.x + 8;
			this.equip = new sc.NumberGui(maxNumber, {
				signed: this.usePercent,
				transitionTime: 0.2
			});
			this.equip.setPos(127 - (this.usePercent ? 8 : 0), 3);
			this.equip.setNumber(0, true);
			this.guis.push(this.equip);
			this.addTransitions(this.equip);
			this.addChildGui(this.equip);
			if (useNoAnim) this.equip.hook.pos.x = this.equip.hook.pos.x + 8;
			this.equipAdd = new sc.NumberGui(maxNumber, {
				signed: this.usePercent,
				transitionTime: 0.2,
				color: sc.GUI_NUMBER_COLOR.GREY
			});
			this.equipAdd.showPlus = true;
			this.equipAdd.showPlusOnZero = true;
			this.equipAdd.setPos(127 - (this.usePercent ? 8 : 0), 13);
			this.addTransitions(this.equipAdd);
			this.guis.push(this.equipAdd);
			this.equipAdd.doStateTransition("HIDDEN", true);
			this.addChildGui(this.equipAdd);
			if (useNoAnim) this.equipAdd.hook.pos.x = this.equipAdd.hook.pos.x + 8;
			this.skills = new sc.NumberGui(maxNumber, {
				signed: this.usePercent,
				transitionTime: 0.2
			});
			this.skills.setPos(171 - (this.usePercent ? 8 : 0), 3);
			this.skills.setNumber(0, true);
			this.guis.push(this.skills);
			this.addTransitions(this.skills);
			this.addChildGui(this.skills);
			if (useNoAnim) this.skills.hook.pos.x = this.skills.hook.pos.x + 8;
			skillHidden && this.skills.doStateTransition("HIDDEN", true);
			this.skillAdd = new sc.NumberGui(maxNumber, {
				signed: this.usePercent,
				transitionTime: 0.2,
				color: sc.GUI_NUMBER_COLOR.GREY
			});
			this.skillAdd.showPlus = true;
			this.skillAdd.showPlusOnZero = true;
			this.skillAdd.setPos(171 - (this.usePercent ? 8 : 0), 13);
			this.skillAdd.setNumber(0, true);
			this.addTransitions(this.skillAdd);
			this.guis.push(this.skillAdd);
			this.skillAdd.doStateTransition("HIDDEN", true);
			this.addChildGui(this.skillAdd);
			if (useNoAnim) this.skillAdd.hook.pos.x = this.skillAdd.hook.pos.x + 8;
			var divider = new ig.ImageGui(this.gfx, 6, 321, 4, 6);
			divider.setPos(119, 4);
			this.guis.push(divider);
			this.addTransitions(divider);
			this.addChildGui(divider);
			divider = new ig.ImageGui(this.gfx, 6, 321, 4, 6);
			divider.setPos(163, 4);
			this.guis.push(divider);
			this.addTransitions(divider);
			this.addChildGui(divider);
			skillHidden && divider.doStateTransition("HIDDEN", true);
			this.description = new sc.TextGui(description, {
				font: sc.fontsystem.smallFont,
				maxWidth: 294 + (this._skillHidden ? 44 : 0),
				linePadding: -3
			});
			this.description.setPos(214 - (this._skillHidden ? 44 : 0), 0);
			this.addChildGui(this.description)
		},
		updateValues: function(base, equip, skills, skipAnim, equipAdd, skillAdd, checkRed) {
			this.base.setNumber(base, skipAnim);
			this.equip.setNumber(equip, skipAnim);
			this.skills.setNumber(skills, skipAnim);
			this.base.color = sc.GUI_NUMBER_COLOR.WHITE;
			this.equip.color = sc.GUI_NUMBER_COLOR.WHITE;
			this.skills.color = sc.GUI_NUMBER_COLOR.WHITE;
			this._baseRed = this._equipRed = this._skillsRed = false;
			if (checkRed) {
				if (base < 0) {
					this.base.color = sc.GUI_NUMBER_COLOR.RED;
					this._baseRed = true
				}
				if (equip < 0) {
					this.equip.color = sc.GUI_NUMBER_COLOR.RED;
					this._equipRed = true
				}
				if (skills < 0) {
					this.skills.color = sc.GUI_NUMBER_COLOR.RED;
					this._skillsRed = true
				}
			}
			if (sc.menu.statusDiff && !this._noPercent) {
				this.equipAdd.doStateTransition("DEFAULT", true);
				this._skillHidden || this.skillAdd.doStateTransition("DEFAULT", true);
				this.equipAdd.setNumber(equipAdd || 0);
				this.skillAdd.setNumber(skillAdd || 0)
			} else {
				this.equipAdd.doStateTransition("HIDDEN", true);
				this._skillHidden || this.skillAdd.doStateTransition("HIDDEN", true);
				this.equipAdd.setNumber(0, true);
				this.skillAdd.setNumber(0, true)
			}
		},
		hideValues: function(skipAnim) {
			for (var i = this.guis.length; i--;) this.guis[i].doStateTransition("HIDDEN", skipAnim);
			this._hideAll = true
		},
		updateDrawables: function(drawables) {
			this.parent(drawables);
			var offset = 0,
				lineOffset = this.lineID * 12,
				offset = this.hook.size.x;
			if (this._hideAll) {
				drawables.addColor(lineColors[this.lineID], 0, 10, 152, 1);
				drawables.addGfx(this.gfx, 152, 0, 71, 389, 13, 11);
				drawables.addColor(lineColors[this.lineID], 165, 0, offset - 244, 1)
			} else {
				drawables.addGfx(this.gfx, 0, 0, 0, 329 + lineOffset, 90, 11);
				drawables.addColor(lineColors[this.lineID], 90, 0, offset - 90 - 79, 1)
			}
			drawables.addGfx(this.gfx, offset - 79, 0, 90, 329 + lineOffset, 79, 1);
			this.skipVertLine || drawables.addColor(lineColors[this.lineID], 209 - (this._skillHidden ? 44 : 0), 0, 1, this.hook.size.y);
			if (this.usePercent && !this._hideAll) {
				drawables.addGfx(this.gfx, 107, 3, this._baseRed ? 9 : 0, 407, 8, 8);
				drawables.addGfx(this.gfx, 151, 3, this._equipRed ? 9 : 0, 407, 8, 8);
				this._skillHidden || drawables.addGfx(this.gfx, 195, 3, this._skillsRed ? 9 : 0, 407, 8, 8);
				if (sc.menu.statusDiff) {
					drawables.addGfx(this.gfx, 151, 13, 0, 416, 8, 8);
					this._skillHidden || drawables.addGfx(this.gfx, 195, 13, 0, 416, 8, 8)
				}
			}
			offset = this.iconIndex.x * 12;
			lineOffset = this.iconIndex.y * 12;
			drawables.addGfx(this.gfx, 0, 0, sc.MODIFIER_ICON_DRAW.X + offset, sc.MODIFIER_ICON_DRAW.Y + lineOffset, 11, 11)
		},
		addTransitions: function(gui) {
			gui.hook.transitions = {
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
			}
		}
	})
});
ig.baked = !0;
