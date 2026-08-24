/**
 * @module game.feature.menu.gui.social.social-misc
 * @description Social menu helper GUIs: sc.SocialInfoBox (member details with
 *   base stats + equipment), sc.SocialPartyBox / sc.SocialPartyMember (the
 *   current party panel), sc.SocialBaseInfoBox (face + level + HP/SP/EXP bars),
 *   sc.SocialFace, sc.SocialEntryButton and sc.SocialHead (list rows).
 */
ig.module("game.feature.menu.gui.social.social-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-status-default", "game.feature.msg.gui.side-message-hud", "game.feature.menu.gui.enemies.enemy-pages").defines(function() {
	var removeIndices = [],
		partyNames = [];
	sc.SocialInfoBox = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/menu.png", {
			width: 12,
			height: 4,
			left: 6,
			top: 6,
			right: 6,
			bottom: 6,
			offsets: {
				"default": {
					x: 512,
					y: 440
				}
			}
		}),
		noEntry: null,
		base: null,
		clazz: null,
		name: null,
		baseHp: null,
		baseAttack: null,
		baseDefense: null,
		baseFocus: null,
		equip: null,
		content: null,
		init: function() {
			this.parent(281, 129);
			this.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: -(this.hook.size.x / 2)
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.base = new sc.SocialBaseInfoBox;
			this.base.setPos(3, 3);
			this.addChildGui(this.base);
			this.noEntry = new sc.TextGui(ig.lang.get("sc.gui.menu.social.noMember"));
			this.noEntry.hook.transitions = {
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
			this.noEntry.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.noEntry.setPos(0, 3);
			this.addChildGui(this.noEntry);
			this.noEntry.doStateTransition("HIDDEN", true);
			this.content = new ig.GuiElementBase;
			this.content.hook.transitions = {
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
			this.content.setPos(3, 39);
			this.content.setSize(275, 98);
			this.addChildGui(this.content);
			var line = new ig.ColorGui("#545454", 275, 1);
			line.setPos(0, 0);
			this.content.addChildGui(line);
			line = new sc.TextGui(ig.lang.get("sc.gui.menu.social.class"), {
				font: sc.fontsystem.tinyFont
			});
			line.setPos(3, 3);
			this.content.addChildGui(line);
			var labelWidth = line.hook.size.x,
				line = new sc.TextGui(ig.lang.get("sc.gui.menu.social.name"), {
					font: sc.fontsystem.tinyFont
				});
			line.setPos(3, 18);
			this.content.addChildGui(line);
			labelWidth = Math.max(line.hook.size.x, labelWidth) + 6;
			this.clazz = new sc.TextGui("Ultra Lord");
			this.clazz.setPos(labelWidth, 0);
			this.content.addChildGui(this.clazz);
			this.name = new sc.TextGui("Ultra Lord");
			this.name.setPos(labelWidth, 15);
			this.content.addChildGui(this.name);
			labelWidth = 3;
			line = 32;
			this.baseHp = this.createStatusLine("maxhp", 0, labelWidth, line);
			line = line + 14;
			this.baseAttack = this.createStatusLine("atk", 1, labelWidth, line);
			line = line + 14;
			this.baseDefense = this.createStatusLine("def", 2, labelWidth, line);
			this.baseFocus = this.createStatusLine("foc", 3, labelWidth, line + 14);
			line = new sc.TextGui(ig.lang.get("sc.gui.menu.social.equipment"), {
				font: sc.fontsystem.tinyFont
			});
			line.setPos(139, 3);
			this.content.addChildGui(line);
			line = new ig.ColorGui("#545454", 137, 1);
			line.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			line.setPos(0, 11);
			this.content.addChildGui(line);
			this.equip = new ig.GuiElementBase;
			this.equip.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.equip.setSize(136, 72);
			this.equip.setPos(1, 13);
			this.content.addChildGui(this.equip);
			this.equip.annotation = {
				content: {
					title: "sc.gui.menu.help.social.titles.equip",
					description: "sc.gui.menu.help.social.description.equip"
				},
				offset: {
					x: 0,
					y: 0
				},
				size: {
					x: 136,
					y: 72
				},
				index: {
					x: 1,
					y: 0
				}
			}
		},
		show: function() {
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		},
		setCharacter: function(key) {
			if (key) {
				var model = sc.party.models[key];
				this.base.show(key, model);
				this.clazz.setText(ig.lang.get("sc.gui.menu.social.classes." + model.clazz));
				this.name.setText(ig.LangLabel.getText(model.character.data.realname));
				this.baseHp.setNumber(model.params.getStat("hp"), true);
				this.baseAttack.setNumber(model.params.getStat("attack"), true);
				this.baseDefense.setNumber(model.params.getStat("defense"), true);
				this.baseFocus.setNumber(model.params.getStat("focus"), true);
				this.equip.removeAllChildren();
				var equip = model.equip,
					offset = -3,
					slot;
				for (slot in equip) offset = this.createEquipEntry(equip[slot], offset, slot);
				this.content.doStateTransition("DEFAULT", true);
				this.noEntry.doStateTransition("HIDDEN", true)
			} else {
				this.base.hide(true);
				this.content.doStateTransition("HIDDEN", true);
				this.noEntry.doStateTransition("DEFAULT", true)
			}
		},
		createEquipEntry: function(itemId, offset, slot) {
			var item = null,
				entry = null,
				entry = null;
			if (item = itemId < 0 ? null : sc.inventory.getItem(itemId)) {
				entry = "\\i[" + item.icon + sc.inventory.getRaritySuffix(item.rarity || 0) + "]";
				entry = entry + ig.LangLabel.getText(item.name)
			} else entry = "\\i[" + this.getBodyPartIcon(slot) + "]-----------------";
			itemId = sc.inventory.getItemLevel(itemId);
			entry = new sc.TextGui(entry);
			entry.setPos(0, offset);
			entry.level = itemId;
			entry.numberGfx = this.ninepatch.gfx;
			entry.setDrawCallback(function(drawables, transform) {
				sc.MenuHelper.drawLevel(this.level, drawables, transform, this.numberGfx, item && item.isScalable)
			}.bind(entry));
			this.equip.addChildGui(entry);
			return offset + 15
		},
		getBodyPartIcon: function(slot) {
			switch (slot) {
				case "head":
					return "item-helm";
				case "leftArm":
					return "item-sword";
				case "rightArm":
					return "item-sword";
				case "torso":
					return "item-belt";
				case "feet":
					return "item-shoe"
			}
		},
		createStatusLine: function(key, index, x, y) {
			var line = new sc.EnemyBaseParamLine(ig.lang.get("sc.gui.menu.equip." + key), index);
			line.setPos(x, y);
			line.annotation = {
				content: {
					title: "sc.gui.menu.equip." + key,
					description: "sc.gui.menu.equip.descriptions." + key
				},
				offset: {
					x: -1,
					y: -1
				},
				index: {
					x: 0,
					y: index
				}
			};
			this.content.addChildGui(line);
			return line
		}
	});
	sc.SocialPartyBox = ig.GuiElementBase.extend({
		lea: null,
		members: [],
		init: function() {
			this.parent("blue");
			this.setSize(281, 120);
			this.setPos(8, 29)
		},
		updatePartyMembers: function() {
			var offset = 3 + this.members[0].hook.size.y;
			removeIndices.length = 0;
			partyNames.length = 0;
			for (var i = 1; i < this.members.length; i++) {
				var member = this.members[i];
				if (sc.party.isPartyMember(member.name)) {
					partyNames.push(member.name);
					member.doPosTranstition(0, offset, 0.2);
					offset = offset + (member.hook.size.y + 3)
				} else {
					removeIndices.push(i);
					member.doStateTransition("SCALE", false, true)
				}
			}
			for (i = removeIndices.length; i--;) this.members.splice(removeIndices[i], 1);
			offset = 35 * this.members.length + 3 * this.members.length + 9;
			var party = sc.party.currentParty;
			for (i = 0; i < party.length; i++) {
				var model = sc.party.models[party[i]];
				if (partyNames.indexOf(party[i]) == -1 && !model.temporary) {
					model = new sc.SocialPartyMember(false, sc.party.models[party[i]], party[i]);
					model.setPos(0, offset);
					model.show();
					offset = offset + (model.hook.size.y + 3);
					this.addChildGui(model);
					this.members.push(model)
				}
			}
			this.members[0] && this.members[0].isLea && this.members[0].currentValue.setNumber(sc.party.currentParty.length + 1, true)
		},
		show: function(skipTransition) {
			for (var i = this.members.length; i--;) skipTransition && i >= 1 ? this.members[i].hide(true) : this.members[i].remove();
			var offset = this.members.length = 0,
				lea = new sc.SocialPartyMember(true, sc.model.player);
			this.addChildGui(lea);
			this.members.push(lea);
			offset = offset + (lea.hook.size.y + 3);
			lea.show(skipTransition);
			var party = sc.party.currentParty;
			for (i = 0; i < party.length; i++)
				if (!sc.party.models[party[i]].temporary) {
					lea = new sc.SocialPartyMember(false, sc.party.models[party[i]], party[i]);
					lea.setPos(0, offset);
					lea.show();
					offset = offset + (lea.hook.size.y + 3);
					this.addChildGui(lea);
					this.members.push(lea)
				}
		},
		hide: function(skipTransition) {
			for (var i = this.members.length; i--;) this.members[i].hide(skipTransition)
		}
	});
	sc.SocialPartyMember = sc.MenuPanel.extend({
		gfx: new ig.Image("media/gui/basic.png"),
		headerPatch: new ig.NinePatch("media/gui/menu.png", {
			width: 2,
			height: 0,
			left: 1,
			top: 9,
			right: 5,
			bottom: 0,
			offsets: {
				"default": {
					x: 96,
					y: 408
				}
			}
		}),
		info: null,
		name: null,
		isLea: false,
		init: function(isLea, model, name) {
			this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
			this.setSize(281, isLea ? 44 : 35);
			this.setPivot(0, 0);
			this.isLea = isLea || false;
			this.name = name || null;
			this.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: -(this.hook.size.x / 2)
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				SCALE: {
					state: {
						alpha: 0,
						scaleY: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			if (isLea) {
				var label = new sc.TextGui(ig.lang.get("sc.gui.menu.social.party"), {
					font: sc.fontsystem.tinyFont,
					speed: ig.TextBlock.SPEED.IMMEDIATE
				});
				label.setPos(2, 1);
				this.addChildGui(label);
				var numberStyle = {
					size: sc.NUMBER_SIZE.TINY,
					color: sc.GUI_NUMBER_COLOR.GREY
				};
				this.maxValue = new sc.NumberGui(4, numberStyle);
				this.maxValue.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
				this.maxValue.setPos(6, 2);
				this.maxValue.setNumber(sc.PARTY_MAX_MEMBERS + 1);
				this.addChildGui(this.maxValue);
				this.currentValue = new sc.NumberGui(4, numberStyle);
				this.currentValue.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
				this.currentValue.setPos(20, 2);
				this.currentValue.setNumber(sc.party.currentParty.length + 1);
				this.addChildGui(this.currentValue);
				label = new ig.ImageGui(this.gfx, 208, 18, 5, 5);
				label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
				label.setPos(14, 2);
				this.addChildGui(label)
			}
			this.info = new sc.SocialBaseInfoBox;
			this.info.setPos(3, isLea ? 9 : 0);
			this.info.show("PARTY_MEMBER", model);
			this.addChildGui(this.info);
			this.doStateTransition("HIDDEN", true)
		},
		show: function(skipTransition) {
			this.doStateTransition("DEFAULT", skipTransition)
		},
		hide: function(skipTransition) {
			this.doStateTransition("HIDDEN", false, skipTransition)
		},
		updateDrawables: function(drawables) {
			this.parent(drawables);
			this.isLea && this.headerPatch.draw(drawables, this.hook.size.x, 9, "default");
			drawables.addColor("#FFF", 1, this.isLea ? 9 : 0, 1, this.hook.size.y - (this.isLea ? 9 : 0))
		}
	});
	sc.SocialBaseInfoBox = ig.GuiElementBase.extend({
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
		face: null,
		level: null,
		name: null,
		exp: null,
		hp: null,
		sp: null,
		init: function() {
			this.parent();
			this.setSize(275, 35);
			var label = new sc.TextGui("LVL", {
				font: sc.fontsystem.tinyFont
			});
			label.setPos(53, 18);
			this.addChildGui(label);
			this.face = new sc.SocialFace;
			this.addChildGui(this.face);
			this.name = new sc.TextGui;
			this.name.setPos(53, 0);
			this.addChildGui(this.name);
			this.level = new sc.NumberGui(99, {
				size: sc.NUMBER_SIZE.LARGE
			});
			this.level.setPos(68, 19);
			this.addChildGui(this.level);
			this.exp = new sc.ItemStatusDefaultBar("EXP", sc.MENU_BAR_TYPE.EXP, null, 93, 0, -1);
			this.exp.setPos(92, 19);
			this.addChildGui(this.exp);
			this.hp = new sc.ItemStatusDefaultBar("HP", sc.MENU_BAR_TYPE.HP, null, 95, 0, -1);
			this.hp.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.hp.setPos(-2, 3);
			this.addChildGui(this.hp);
			this.sp = new sc.ItemStatusDefaultBar("SP", sc.MENU_BAR_TYPE.SP, null, 95, 3, -1);
			this.sp.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.sp.setPos(-2, 19);
			this.addChildGui(this.sp)
		},
		show: function(key, model) {
			this.face.setCharacter(model.defaultExpression);
			this.name.setText(model.getCharacterName());
			this.level.setNumber(model.level || 1);
			this.exp.updateValues(true, model);
			this.hp.updateValues(true, model);
			this.sp.updateValues(true, model);
			this.doStateTransition("DEFAULT", true)
		},
		hide: function(skipTransition) {
			this.doStateTransition("HIDDEN", skipTransition)
		}
	});
	sc.SocialFace = ig.GuiElementBase.extend({
		charExpression: null,
		transitions: {
			DEFAULT: {
				state: {
					scaleX: -1
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		init: function() {
			this.parent();
			this.setSize(52, 35);
			this.setPos(2, 0);
			this.setPivot(26, 0);
			this.doStateTransition("DEFAULT", true)
		},
		setCharacter: function(expression) {
			this.charExpression = expression
		},
		updateDrawables: function(drawables) {
			this.charExpression && sc.MsgGuiTools.drawPortrait(drawables, this.charExpression, 0, 4, 0, this.hook.size.x - 2, this.hook.size.y)
		}
	});
	sc.SocialEntryButton = sc.ListBoxButton.extend({
		gfx2: new ig.Image("media/gui/menu.png"),
		head: null,
		status: null,
		level: null,
		key: null,
		init: function(key, model) {
			this.parent(this.getMemberName(key, model), 187, 73);
			this.blockedSound = this.button.submitSound = null;
			this.button.textChild.setPos(34, 0);
			this.key = key;
			var status = sc.party.isPartyMember(key) ? 0 : sc.party.contacts[key].online ? 1 : 2;
			this.head = new sc.SocialHead(model.getHeadIdx());
			this.head.setPos(7, 1);
			this.head.active = status == 0;
			this.addChildGui(this.head);
			this.level = new sc.NumberGui(99);
			this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.level.setPos(5, 7);
			this.level.setNumber(model.level || 1);
			this.addChildGui(this.level);
			this.status = new ig.ImageGui(this.gfx2, 512, 416 + status * 8, 38, 7);
			this.status.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.status.setPos(30, 7);
			this.addChildGui(this.status)
		},
		focusGained: function() {
			this.parent();
			this.head.focus = true
		},
		focusLost: function() {
			this.parent();
			this.head.focus = false
		},
		updateMemberStatus: function() {
			var status = sc.party.isPartyMember(this.key) ? 0 : sc.party.contacts[this.key].online ? 1 : 2;
			this.status.offsetY = 416 + status * 8;
			this.head.active = status == 0
		},
		keepButtonPressed: function() {
			this.keepPressed = true;
			this.setPressed(true);
			this.button.keepPressed = true;
			this.button.setPressed(true);
			this.head.keepPressed = true
		},
		unPressButton: function() {
			this.keepPressed = false;
			this.setPressed(false);
			this.button.keepPressed = false;
			this.button.setPressed(false);
			this.head.keepPressed = false
		},
		getMemberName: function(key, model) {
			return model.getCharacterName() || key
		}
	});
	sc.SocialHead = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		headsGfx: new ig.Image("media/gui/severed-heads.png"),
		index: 0,
		active: false,
		focus: false,
		keepPressed: false,
		init: function(index) {
			this.parent();
			this.setSize(24, 17);
			this.index = index
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 512, 457, 24, 17);
			drawables.addGfx(this.headsGfx, 0, 0, this.index * 24, 7, 24, 17);
			this.active && drawables.addGfx(this.gfx, 0, 0, 512, this.focus || this.keepPressed ? 493 : 475, 24, 17)
		}
	})
});
ig.baked = !0;
