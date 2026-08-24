/**
 * @module game.feature.menu.gui.status.status-menu
 * @description The Status menu container (sc.StatusMenu): page host for the
 *   main / parameters / modifiers / combat-arts views, with help, equip and
 *   diff-toggle hotkeys plus the page and element switchers.
 */
ig.module("game.feature.menu.gui.status.status-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-status-default", "game.feature.menu.gui.status.status-misc", "game.feature.menu.gui.status.status-view-main", "game.feature.menu.gui.status.status-view-parameters", "game.feature.menu.gui.status.status-view-modifiers", "game.feature.menu.gui.status.status-view-combat-arts").defines(function() {
	sc.StatusMenu = sc.BaseMenu.extend({
		hotkeyHelp: null,
		hotkeyEquip: null,
		hotkeyDiff: null,
		temp_button_group: null,
		helpGui: null,
		pages: [],
		elements: null,
		pager: null,
		init: function() {
			this.parent();
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"), void 0, true, sc.BUTTON_TYPE.SMALL);
			this.hotkeyHelp.keepMouseFocus = true;
			this.hotkeyHelp.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						offsetY: -this.hotkeyHelp.hook.size.y
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.hotkeyHelp.onButtonPress = this.onHelpButtonPressed.bind(this);
			this.hotkeyEquip = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.equip"), void 0, true, sc.BUTTON_TYPE.SMALL);
			this.hotkeyEquip.keepMouseFocus = true;
			this.hotkeyEquip.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						offsetY: -this.hotkeyEquip.hook.size.y
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.hotkeyEquip.onButtonPress = this.onEquipButtonPressed.bind(this);
			this.hotkeyDiff = new sc.ButtonGui("\\i[help3]" + ig.lang.get("sc.gui.menu.hotkeys.diff-show"), void 0, true, sc.BUTTON_TYPE.SMALL);
			this.hotkeyDiff.submitSound = null;
			this.hotkeyDiff.blockedSound = null;
			this.hotkeyDiff.keepMouseFocus = true;
			this.hotkeyDiff.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						offsetY: -this.hotkeyDiff.hook.size.y
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.hotkeyDiff.onButtonPress = this.onDiffButtonPressed.bind(this);
			this.temp_button_group = new sc.ButtonGroup;
			this.temp_button_group.addSelectionCallback(function(button) {
				button.data && sc.menu.setInfoText(button.data.description)
			});
			this.temp_button_group.setMouseFocusLostCallback(function() {
				sc.menu.setInfoText("", true)
			});
			this.createPages();
			this.pager = new sc.StatusPageSwitch;
			this.addChildGui(this.pager);
			this.elements = new sc.StatusElementSwitch;
			this.addChildGui(this.elements);
			this.doStateTransition("DEFAULT")
		},
		addObservers: function() {
			sc.Model.addObserver(sc.menu, this)
		},
		removeObservers: function() {
			sc.Model.removeObserver(sc.menu, this)
		},
		showMenu: function(skip, originMenu) {
			this.addObservers();
			sc.menu.menuHost == 0 && sc.menu.setHost(sc.MENU_SUBMENU.STATUS);
			if (sc.menu.menuHost == sc.MENU_SUBMENU.STATUS)
				if (originMenu == sc.MENU_SUBMENU.EQUIPMENT) sc.menu.buttonInteract.pushButtonGroup(this.temp_button_group);
				else {
					sc.menu.buttonInteract.pushButtonGroup(this.temp_button_group);
					sc.menu.pushBackCallback(this.onBackButtonPress.bind(this))
				}
			else sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
			ig.interact.setBlockDelay(0.2);
			sc.menu.buttonInteract.pushButtonGroup(this.temp_button_group);
			sc.menu.setInfoText("", false);
			this.pager.show();
			this.elements.show();
			this.pages[sc.menu.statusPage].show();
			this.updateLea(sc.menu.statusPage, true);
			this.onAddHotkeys()
		},
		hideMenu: function(skip, originMenu) {
			this.removeObservers();
			originMenu != sc.MENU_SUBMENU.EQUIPMENT && sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
			this.pager.hide();
			this.elements.hide();
			this.pages[sc.menu.statusPage].hide();
			this.exitMenu(originMenu)
		},
		exitMenu: function(originMenu) {
			sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
			sc.menu.buttonInteract.removeGlobalButton(this.hotkeyEquip);
			sc.menu.buttonInteract.removeGlobalButton(this.hotkeyDiff);
			sc.menu.buttonInteract.removeButtonGroup(this.temp_button_group);
			if (originMenu != sc.MENU_SUBMENU.EQUIPMENT) {
				sc.menu.menuHost = 0;
				sc.menu.exitEquipMenu()
			}
			this.helpGui = null
		},
		createPages: function() {
			this.pages[sc.MENU_STATUS_PAGES.MAIN] = new sc.StatusViewMain;
			this.pages[sc.MENU_STATUS_PAGES.PARAMS] = new sc.StatusViewParameters;
			this.pages[sc.MENU_STATUS_PAGES.MODS] = new sc.StatusViewModifiers;
			this.pages[sc.MENU_STATUS_PAGES.COMBAT_ARTS] = new sc.StatusViewCombatArts;
			for (var i = this.pages.length; i--;) this.addChildGui(this.pages[i]);
			sc.menu.statusElement = sc.model.player.currentElementMode
		},
		setCurrentPage: function(page, oldPage) {
			this.updateLea(page);
			this.pages[oldPage].hide();
			this.pages[page].show();
			ig.interact.setBlockDelay(0.2)
		},
		updateCurrentPage: function(skip) {
			this.pages[sc.menu.statusPage].updatePage && this.pages[sc.menu.statusPage].updatePage(skip)
		},
		updateLea: function(page, skipTransition) {
			switch (page) {
				case sc.MENU_STATUS_PAGES.MAIN:
					sc.menu.moveLeaSprite(0, -101, sc.MENU_LEA_STATE.SMALL, !skipTransition);
					break;
				default:
					sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN)
			}
		},
		onHotkeyHelpCheck: function() {
			return sc.control.menuHotkeyHelp()
		},
		onHelpButtonPressed: function() {
			sc.menu.removeHotkeys();
			this.createHelpGui();
			ig.gui.addGuiElement(this.helpGui);
			this.helpGui.openMenu();
			sc.menu.helpMenuOpen = true;
			sc.menu.fireStatusPageEvent()
		},
		onHotkeyEquipCheck: function() {
			return ig.interact.isBlocked() ? false : sc.control.menuHotkeyHelp2()
		},
		onEquipButtonPressed: function() {
			if (sc.menu.previousMenu == sc.MENU_SUBMENU.START) sc.menu.pushMenu(sc.MENU_SUBMENU.EQUIPMENT);
			else if (sc.menu.previousMenu == sc.MENU_SUBMENU.EQUIPMENT) this.onBackButtonPress()
		},
		onHotkeyDiffCheck: function() {
			return ig.interact.isBlocked() ? false : sc.control.menuHotkeyHelp3()
		},
		onDiffButtonPressed: function() {
			if (this.hotkeyDiff.active) {
				sc.BUTTON_SOUND.submit.play();
				sc.menu.statusDiff = !sc.menu.statusDiff;
				this.updateCurrentPage(true);
				var text = "\\i[help3]" + ig.lang.get("sc.gui.menu.hotkeys.diff-" + (sc.menu.statusDiff ? "hide" : "show"));
				this.hotkeyDiff.setText(text)
			}
		},
		createHelpGui: function() {
			if (!this.helpGui) {
				this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.status.title"), ig.lang.get("sc.gui.menu.help-texts.status.pages"), function() {
					sc.menu.helpMenuOpen = false;
					sc.menu.fireStatusPageEvent();
					this.commitHotKeysToTopBar(true)
				}.bind(this));
				this.helpGui.hook.zIndex = 15E4;
				this.helpGui.hook.pauseGui = true
			}
		},
		onAddHotkeys: function(skip) {
			sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
			sc.menu.buttonInteract.addGlobalButton(this.hotkeyEquip, this.onHotkeyEquipCheck.bind(this));
			sc.menu.buttonInteract.addGlobalButton(this.hotkeyDiff, this.onHotkeyDiffCheck.bind(this));
			this.commitHotKeysToTopBar(skip)
		},
		commitHotKeysToTopBar: function(skip) {
			sc.menu.addHotkey(function() {
				return this.hotkeyDiff
			}.bind(this));
			sc.menu.addHotkey(function() {
				return this.hotkeyEquip
			}.bind(this));
			sc.menu.addHotkey(function() {
				return this.hotkeyHelp
			}.bind(this));
			sc.menu.commitHotkeys(skip);
			this.updateHotkeys()
		},
		updateHotkeys: function() {
			var text = "\\i[help3]" + ig.lang.get("sc.gui.menu.hotkeys.diff-" + (sc.menu.statusDiff ? "hide" : "show"));
			this.hotkeyDiff.setText(text);
			switch (sc.menu.statusPage) {
				case sc.MENU_STATUS_PAGES.COMBAT_ARTS:
					this.hotkeyDiff.startHidden = true;
					this.hotkeyDiff.doStateTransition("HIDDEN");
					this.hotkeyDiff.setActive(false);
					break;
				case sc.MENU_STATUS_PAGES.PARAMS:
				case sc.MENU_STATUS_PAGES.MODS:
					this.hotkeyDiff.startHidden = false;
					this.hotkeyDiff.setActive(true);
					this.hotkeyDiff.doStateTransition("DEFAULT");
					break;
				default:
					this.hotkeyDiff.startHidden = true;
					this.hotkeyDiff.doStateTransition("HIDDEN");
					this.hotkeyDiff.setActive(false)
			}
		},
		onBackButtonPress: function() {
			var previous = sc.menu.previousMenu;
			sc.menu.popBackCallback();
			sc.menu.popMenu();
			if (previous == sc.MENU_SUBMENU.EQUIPMENT) sc.menu.previousMenu = sc.MENU_SUBMENU.START
		},
		modelChanged: function(model, event, data) {
			if (model == sc.menu)
				if (event == sc.MENU_EVENT.STATUS_SET_PAGE) {
					if (data != sc.menu.statusPage) {
						this.setCurrentPage(sc.menu.statusPage, data);
						this.updateHotkeys()
					}
				} else event == sc.MENU_EVENT.STATUS_SET_ELEMENT && this.updateCurrentPage()
		}
	})
});
ig.baked = !0;
