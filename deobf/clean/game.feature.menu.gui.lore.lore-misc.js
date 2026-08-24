/**
 * @module game.feature.menu.gui.lore.lore-misc
 * @description The Lore detail pane (sc.LoreInfoBox) that renders a lore entry's
 *   content with images, dividers and conditional text, plus the sc.LoreEntryButton
 *   list entries with completion percentages and new-unlock overlays.
 */
ig.module("game.feature.menu.gui.lore.lore-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "game.feature.menu.gui.menu-misc").defines(function() {
	sc.LoreInfoBox = ig.BoxGui.extend({
		gfx: new ig.Image("media/gui/basic.png"),
		ninepatch: new ig.NinePatch("media/gui/menu.png", {
			width: 2,
			height: 8,
			left: 27,
			top: 21,
			right: 27,
			bottom: 3,
			offsets: {
				"default": {
					x: 456,
					y: 244
				},
				focus: {
					x: 576,
					y: 432
				}
			}
		}),
		title: null,
		category: null,
		alternativeArrow: null,
		alternative: null,
		scrollContainer: null,
		content: null,
		key: null,
		lore: null,
		buttongroup: null,
		currentButton: null,
		focus: false,
		scrollMemory: {},
		init: function() {
			this.parent(281, 265);
			this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
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
			this.annotation = [];
			this.annotation[0] = {
				content: {
					title: "sc.gui.menu.help.lore.titles.type",
					description: "sc.gui.menu.help.lore.description.type"
				},
				offset: {
					x: 4,
					y: 3
				},
				size: {
					x: 19,
					y: 18
				},
				index: {
					x: 0,
					y: 0
				}
			};
			this.annotation[1] = {
				content: {
					title: "sc.gui.menu.help.lore.titles.content",
					description: "sc.gui.menu.help.lore.description.content"
				},
				offset: {
					x: 4,
					y: 23
				},
				size: {
					x: 273,
					y: 241
				},
				index: {
					x: 0,
					y: 1
				}
			};
			this.buttongroup = new sc.ButtonGroup;
			this.buttongroup.doButtonTraversal = this.onButtonTraversal.bind(this);
			this.title = new sc.TextGui("");
			this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.title.setPos(0, 4);
			this.addChildGui(this.title);
			this.alternativeArrow = new ig.ImageGui(this.ninepatch.gfx, 465, 338, 13, 10);
			this.alternativeArrow.setPos(10, 23);
			this.alternativeArrow.setPivot(13, 7);
			this.alternativeArrow.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						alpha: 0,
						scaleX: 0.2,
						scaleY: 0.5,
						offsetY: 5
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.alternativeArrow.doStateTransition("HIDDEN", true);
			this.addChildGui(this.alternativeArrow);
			this.alternative = new sc.TextGui("", {
				font: sc.fontsystem.smallFont
			});
			this.alternative.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: 10
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.alternative.doStateTransition("HIDDEN", true);
			this.alternative.setPos(25, 25);
			this.addChildGui(this.alternative);
			this.category = new sc.TextGui("");
			this.category.setPos(7, 3);
			this.addChildGui(this.category);
			this.scrollContainer = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
			this.scrollContainer.showBottomBar = false;
			this.scrollContainer.setSize(261, 221);
			this.scrollContainer.setPos(10, 40);
			this.addChildGui(this.scrollContainer);
			this.content = new ig.GuiElementBase;
			this.scrollContainer.setContent(this.content);
			this.setLore()
		},
		show: function() {
			this.focus = false;
			this.currentTileOffset = "default";
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		},
		setFocus: function(button) {
			if (button) {
				this.setLore(button.key);
				this.focus = true;
				this.currentTileOffset = "focus";
				this.currentButton = button;
				this.currentButton.setPressState(true);
				this.currentButton && this.currentButton.setPressed(true);
				sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
				sc.menu.pushBackCallback(this.onBackButtonPress.bind(this))
			} else this.clearFocus()
		},
		clearFocus: function() {
			if (this.focus) {
				this.focus = false;
				this.currentButton && this.currentButton.setPressState(false);
				this.currentButton = null;
				this.currentTileOffset = "default";
				sc.menu.popBackCallback();
				sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
				ig.input.mouseGuiActive && this.setLore(null)
			}
		},
		onButtonTraversal: function() {
			sc.control.menuBack() && this.buttongroup.invokeBackButton()
		},
		onBackButtonPress: function() {
			this.clearFocus()
		},
		update: function() {
			if (!ig.interact.isBlocked())
				if (this.focus && this.buttongroup.isActive()) {
					sc.control.menuScrollUp() ? this.scrollContainer.scrollY(-20, false, 0.05) : sc.control.menuScrollDown() && this.scrollContainer.scrollY(20, false, 0.05);
					sc.control.downDown() ? this.scrollContainer.scrollY(200 * ig.system.tick, false, 0.05) : sc.control.upDown() && this.scrollContainer.scrollY(-200 * ig.system.tick, false, 0.05)
				} else sc.control.loreDown() ? this.scrollContainer.scrollY(200 * ig.system.tick, false, 0.05) : sc.control.loreUp() &&
					this.scrollContainer.scrollY(-200 * ig.system.tick, false, 0.05)
		},
		setCategory: function(category) {
			this.category.setText("\\i[lore-" + category + "]");
			category == "story" ? this.category.setPos(6, 3) : this.category.setPos(7, 3)
		},
		setLore: function(key) {
			if (!this.focus) {
				var oldKey = this.key;
				this.lore = (this.key = key) ? sc.lore.getLore(key) : null;
				this.alternativeArrow.doStateTransition("HIDDEN", true);
				this.alternative.doStateTransition("HIDDEN", true);
				oldKey && (this.scrollMemory[oldKey] = this.scrollContainer.getScrollY());
				this.content.removeAllChildren();
				this.content.setSize(261, 0);
				this.scrollContainer.setPos(6, 25);
				this.scrollContainer.setSize(269, 238);
				if (this.lore)
					if (ig.perf.fullLoreList || sc.lore.isLoreAvailable(key)) {
						this.title.setText(ig.LangLabel.getText(this.lore.title));
						if (this.lore.alternative) {
							this.alternativeArrow.doStateTransition("DEFAULT");
							this.alternative.setText(ig.lang.get("sc.gui.menu.lore.aka") + ig.LangLabel.getText(this.lore.alternative));
							this.alternative.doStateTransition("DEFAULT");
							this.scrollContainer.setPos(6, 40);
							this.scrollContainer.setSize(269, 223)
						}
						this._createEntry(key)
					} else this.title.setText(ig.lang.get("sc.gui.menu.lore.lockedEntry"));
				else this.title.setText(ig.lang.get("sc.gui.menu.lore.noLore"));
				this.scrollContainer.recalculateScrollBars(true);
				this.scrollContainer.setScrollY(this.scrollMemory[key] || 0, true)
			}
		},
		_createEntry: function(key) {
			var content = this.lore.content,
				entry = null,
				offset = 1,
				index = 0,
				field;
			for (field in content) {
				if (!ig.perf.fullLoreList && !sc.lore.isLoreEntryUnlocked(key, field)) break;
				(entry = content[field]) && (offset = this._addContent(entry.content, entry.image, entry.hr, entry.options, offset, index, entry.imageCond, entry.altContent));
				index++
			}
			this.content.setSize(261, offset)
		},
		_addContent: function(text, image, isHr, options, offset, index, imageCond, altContent) {
			if (!text) return offset;
			var content = this.content,
				imageGui = null,
				align = null,
				align = options ? sc.LORE_IMAGE_ALIGN[options.align] : 0,
				options = options ? options.wrap : false;
			if (isHr) {
				imageGui = new ig.ColorGui("#545454", 266, 1);
				imageGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				imageGui.setPos(0, offset);
				content.addChildGui(imageGui);
				offset = offset + 2
			}
			imageGui = new ig.VarCondition;
			if (altContent) {
				imageGui.setCondition(altContent.condition);
				imageGui.evaluate() && (text = altContent.content)
			}
			imageGui.setCondition(imageCond || "true");
			if (image && imageGui.evaluate()) {
				imageGui = new ig.ImageGui(new ig.Image(image.src), image.offX, image.offY, image.width, image.height);
				imageGui.setAlign(align + 4, ig.GUI_ALIGN.Y_TOP);
				imageGui.setPos(0, offset);
				content.addChildGui(imageGui);
				var maxWidth = 261 - imageGui.hook.size.x - 2;
				var textX = 1;
				if (options) switch (align) {
					case sc.LORE_IMAGE_ALIGN.LEFT:
						textX = imageGui.hook.size.x + 4;
						maxWidth = maxWidth - 2;
						break;
					case sc.LORE_IMAGE_ALIGN.CENTER:
						maxWidth = 261;
						options = false
				} else maxWidth = 259;
				options || (offset = offset + (imageGui.hook.size.y + 2));
				align = new sc.TextGui(ig.LangLabel.getText(text), {
					font: sc.fontsystem.smallFont,
					maxWidth: maxWidth
				});
				align.setPos(textX, offset);
				content.addChildGui(align);
				offset = options ? offset + Math.max(imageGui.hook.size.y, align.hook.size.y) + 2 : offset + (align.hook.size.y + 2)
			} else {
				imageGui = new sc.TextGui(ig.LangLabel.getText(text), {
					font: sc.fontsystem.smallFont,
					maxWidth: 261
				});
				imageGui.setPos(1, offset);
				content.addChildGui(imageGui);
				offset = offset + (imageGui.hook.size.y + 2)
			}
			if (ig.langEdit) {
				var label = "Lore: " + ig.LangLabel.getText(this.lore.title) + ", Paragraph: " + (index + 1);
				ig.langEdit.submitCustomFile(label, new ig.LangLabel(text), "data/database.json")
			}
			return offset
		}
	});
	sc.LoreEntryButton = sc.ListBoxButton.extend({
		key: null,
		completion: null,
		overlay: null,
		init: function(text, key, category, showOverlay, isChild) {
			this.parent(text, 229 - (isChild ? 22 : 0), 31, void 0, void 0, this.isNoPercentType(category));
			this.key = key || null;
			this.blockedSound = null;
			text = key ? Math.round(sc.lore.getCompletionPercent(key) * 100) : 0;
			if (text >= 0) {
				this.completion = new sc.NumberGui(100, {
					size: sc.NUMBER_SIZE.NORMAL
				});
				this.completion.setNumber(text, true);
				this.completion.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
				this.completion.setPos(5, 7);
				this.addChildGui(this.completion)
			}
			if (showOverlay && sc.menu.hasNewUnlockKey(sc.MENU_SUBMENU.LORE, key)) {
				this.overlay = new sc.NewUnlockOverlay;
				this.overlay.setPos((this.isNoPercentType(category), 33), 3);
				this.overlay.activate();
				this.addChildGui(this.overlay)
			}
		},
		setPressState: function(pressed) {
			if (pressed) {
				this.keepPressed = this.pressed = true;
				this.button.setPressed(true);
				this.button.keepPressed = true
			} else {
				this.keepPressed = this.pressed = false;
				this.button.setPressed(false);
				this.button.keepPressed = false
			}
		},
		clearOverlay: function() {
			this.overlay && this.overlay.deactivate(true, true)
		},
		isNoPercentType: function(category) {
			return category == sc.LORE_CATERGORIES.STORY || category == sc.LORE_CATERGORIES.MEMORIES
		}
	})
});
ig.baked = !0;
