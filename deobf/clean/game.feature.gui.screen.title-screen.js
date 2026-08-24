/**
 * @module game.feature.gui.screen.title-screen
 * @description sc.TitleScreenGui: the title screen (intro sequence, parallax
 *   background, press-start, the main menu buttons incl. new-game-plus /
 *   continue / load / options and the changelog / perf-warning extras), plus
 *   sc.MasterOverlayGui (teleport fade) and sc.TitleScreenStartGui.
 */
ig.module("game.feature.gui.screen.title-screen").requires("impact.feature.gui.gui", "game.feature.gui.base.button", "impact.feature.parallax.parallax", "game.feature.gui.screen.intro-screen", "game.feature.gui.screen.title-logo", "impact.base.image", "game.feature.gui.screen.title-preset", "game.feature.menu.gui.save.save-menu", "game.feature.version.version", "game.feature.control.control", "game.feature.menu.gui.new-game.new-game-dialogs").defines(function() {
	function startTitleMusic() {
		ig.bgm.play(ig.Bgm.startTrack, 1, "MEDIUM_OUT")
	}

	function stopTitleMusic() {
		ig.bgm.clear("MEDIUM_OUT");
		ambientSound && ambientSound.stop();
		ambientSound = null
	}
	sc.MasterOverlayGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.5,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.5,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		init: function() {
			this.parent();
			this.hook.zIndex = 900;
			this.hook.pauseGui = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			sc.Model.addObserver(sc.model, this);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			drawables.addColor("rgb(" + ig.game.currentTeleportColor.r + "," + ig.game.currentTeleportColor.g + "," + ig.game.currentTeleportColor.b + ")", 0, 0, this.hook.size.x, this.hook.size.y)
		},
		modelChanged: function(model, msg) {
			if ((msg == sc.GAME_MODEL_MSG.STATE_CHANGED || msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED) && !model.isPaused() && !model.isMenu() && !model.isLevelUp() && !model.isQuickMenu() && !model.isOnMapMenu() && !model.isQuestSolved()) {
				var title = model.isTitle() || !model.isRunning();
				this.doStateTransition(title ? "DEFAULT" : "HIDDEN")
			}
		}
	});
	var ambientSound = new ig.Sound("media/sound/background/title-ambient.ogg", 0.6),
		ambientSound = null;
	sc.TitleScreenGui = ig.GuiElementBase.extend({
		background: new ig.Image("media/gui/title-bg.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		parallax: new ig.Parallax("title"),
		bgGui: null,
		startGui: null,
		buttons: null,
		introGui: null,
		screenInteract: null,
		versionGui: null,
		isPostInit: false,
		init: function() {
			this.parent();
			this.hook.zIndex = 1E3;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.screenInteract = new sc.ScreenInteractEntry(this);
			this.bgGui = new ig.ParallaxGui({
				parallax: "title"
			}, this._bgCallback.bind(this));
			this.addChildGui(this.bgGui);
			this.startGui = new sc.TitleScreenStartGui;
			this.addChildGui(this.startGui);
			this.buttons = new sc.TitleScreenButtonGui;
			this.addChildGui(this.buttons);
			this.versionGui = new sc.TextGui(sc.version.toString(), {
				font: sc.fontsystem.tinyFont
			});
			this.versionGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.versionGui.setPos(2, 0);
			this.versionGui.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						alpha: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.versionGui.doStateTransition("HIDDEN", true);
			this.addChildGui(this.versionGui);
			this.introGui = new ig.GUI.IntroScreen(this._introDone.bind(this));
			this.addChildGui(this.introGui);
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.menu, this);
			this.doStateTransition("HIDDEN", true)
		},
		postInit: function() {
			this.buttons.postInit()
		},
		modelChanged: function(model, msg) {
			if (model == sc.model && msg == sc.GAME_MODEL_MSG.STATE_CHANGED) {
				var state = model.isTitle() ? "DEFAULT" : "HIDDEN";
				if (this.hook.currentStateName != state)
					if (state == "DEFAULT") {
						if (!this.isPostInit) {
							this.isPostInit = true;
							this.postInit()
						}
						this.buttons.hide(true);
						ig.bgm.clear("MEDIUM");
						if (window.IG_GAME_DEBUG) {
							startTitleMusic();
							this.doStateTransition(state, true);
							this._startBg()
						} else {
							this.introGui.start();
							this.bgGui.doStateTransition("HIDDEN", true);
							this.doStateTransition(state, true)
						}
					} else {
						this.buttons.hide();
						this.versionGui.doStateTransition("HIDDEN");
						this.bgGui.hasEnded() ? this.doStateTransition(state) : sc.model.isLoadGame() ? this.bgGui.jumpTo("QUICK_END") : this.bgGui.jumpTo("SLOW_END")
					}
			} else if (model == sc.menu && msg == sc.MENU_EVENT.EXIT_MENU) {
				sc.menu.setDirectMode(false);
				sc.menu.optionsLocalMode = true;
				sc.menu.loadMode = false;
				if (ig.input.mouseGuiActive) {
					this.buttons.namedButtons.setOptions.unsetFocus();
					this.buttons.namedButtons.loadGame.unsetFocus()
				}
			} else if (model == sc.menu && msg == sc.MENU_EVENT.POST_EXIT && sc.menu.loadSlotID >= -1) {
				this.buttons.changelogGui.clearLogs();
				stopTitleMusic();
				ig.interact.removeEntry(this.buttons.buttonInteract);
				ig.game.loadStart(sc.menu.loadSlotID);
				sc.menu.loadSlotID = -2
			}
		},
		onInteraction: function() {
			if (this.bgGui.isLabelReached("IDLE")) {
				sc.BUTTON_SOUND.submit.play();
				this.buttons.show();
				this.startGui.hide();
				ig.interact.removeEntry(this.screenInteract)
			} else this.bgGui.skip()
		},
		_startBg: function() {
			this.bgGui.start(true);
			ig.interact.addEntry(this.screenInteract)
		},
		_introDone: function() {
			startTitleMusic();
			this._startBg()
		},
		_bgCallback: function(msg, label) {
			if (msg == ig.SEQUENCE_MSG.LABEL_REACHED) {
				if (label == "IDLE") {
					this.startGui.show();
					this.versionGui.doStateTransition("DEFAULT")
				}
				if (label == "SOUND_START" || label == "INTRO_SKIP") ambientSound || (ambientSound = ambientSound.play(true, {
					fadeDuration: 1
				}))
			} else msg == ig.SEQUENCE_MSG.ENDED && this.doStateTransition("HIDDEN")
		}
	});
	var chromeIcon = {
			x: 0,
			y: 192,
			w: 40,
			h: 24
		},
		browserIcon = {
			x: 40,
			y: 192,
			w: 64,
			h: 24
		};
	sc.TitleScreenStartGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleY: 0.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		gfx: new ig.Image("media/gui/buttons.png"),
		timer: null,
		init: function() {
			this.parent();
			this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.setPos(0, -8);
			var text = new sc.TextGui(ig.lang.get("sc.gui.title-screen.pressStart"), {
				font: sc.fontsystem.font
			});
			text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			text.setPos(0, -text.hook.size.y / 2);
			this.addChildGui(text);
			text = new sc.LineGui(176);
			text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			text.setPos(0, text.hook.size.y / 2);
			this.addChildGui(text);
			var x = 0,
				icon = chromeIcon,
				iconGui;
			if (ig.browser == "Chrome") {
				x = x - 32;
				iconGui = new ig.ImageGui(this.gfx, icon.x, icon.y, icon.w, icon.h);
				iconGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
				iconGui.setPos(x, icon.h / 2 + 1);
				this.addChildGui(iconGui);
				x = x + 64
			}
			icon = browserIcon;
			iconGui = new ig.ImageGui(this.gfx, icon.x, icon.y, icon.w, icon.h);
			iconGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			iconGui.setPos(x, icon.h / 2 + 1);
			this.addChildGui(iconGui);
			this.timer = new ig.WeightTimer(true, 3, ig.TIMER_MODE.SINUS);
			this.doStateTransition("HIDDEN", true)
		},
		show: function() {
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		},
		update: function() {
			this.timer.tick();
			for (var alpha = 0.6 + this.timer.get() * 0.4, children = this.hook.children, i = children.length; i--;) children[i].localAlpha = alpha
		}
	});
	sc.TitleScreenButtonGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		buttonInteract: null,
		buttonGroup: null,
		gamepadGui: null,
		setOptions: null,
		namedButtons: {},
		presetMenu: null,
		story: null,
		gameplay: null,
		puzzle: null,
		closeButton: null,
		changelogButton: null,
		perfWarnButton: null,
		changelogGui: null,
		gameCodeButton: null,
		background: null,
		perfWarning: null,
		buttons: [],
		_rearrangeAnchor: 0,
		_newGamePlus: false,
		init: function() {
			this.parent();
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.buttonInteract = new ig.ButtonInteractEntry;
			this.buttonGroup = new sc.ButtonGroup;
			this.buttonInteract.pushButtonGroup(this.buttonGroup);
			var y = 12;
			ig.platform == ig.PLATFORM_TYPES.DESKTOP && (y = y + this._createButton("close", y, 5, function() {
					ig.interact.removeEntry(this.buttonInteract);
					window.setTimeout(function() {
						var win = window.require("nw.gui").Window.get();
						win.isFullscreen && win.leaveFullscreen();
						win.close()
					}, 300);
					this.hide()
				}.bind(this),
				"setOptions"));
			y = y + this._createButton("options", y, 4, function() {
				this._enterOptionsMenu()
			}.bind(this), "setOptions");
			y = y + this._createButton("load", y, 3, function() {
				this._enterLoadMenu()
			}.bind(this), "loadGame");
			this._rearrangeAnchor = y = y + 12;
			var hasSaves = ig.storage.hasSaves() && !window.IG_GAME_DEBUG;
			this._newGamePlus = window.IG_GAME_DEBUG ? this.checkClearSaveFiles() && (window.SHOW_NEW_GAME_PLUS || false) : this.checkClearSaveFiles();
			y = y + this._createButton(this._newGamePlus ? "startPlus" : "start", y, hasSaves ? 1 : 0, function() {
				if (this._newGamePlus) {
					var dialog = new sc.NewGameModeSelectDialog(function(button) {
							if (button.data >= 0)
								if (button.data == 0) {
									this.changelogGui.clearLogs();
									stopTitleMusic();
									ig.interact.removeEntry(this.buttonInteract);
									ig.game.start(sc.START_MODE.STORY, 1)
								} else if (button.data == 1) {
								sc.menu.setDirectMode(true, sc.MENU_SUBMENU.NEW_GAME);
								sc.menu.exitCallback = function() {
									if (sc.newgame.active) {
										this.changelogGui.clearLogs();
										stopTitleMusic();
										ig.interact.removeEntry(this.buttonInteract);
										ig.game.start(sc.START_MODE.NEW_GAME_PLUS, 1)
									} else sc.newgame.onReset()
								}.bind(this);
								sc.model.enterMenu(true)
							}
						}.bind(this));
					ig.gui.addGuiElement(dialog);
					dialog.show()
				} else {
					this.changelogGui.clearLogs();
					stopTitleMusic();
					ig.interact.removeEntry(this.buttonInteract);
					ig.game.start(sc.START_MODE.STORY, 1)
				}
			}.bind(this), "start");
			hasSaves && (y = y + this._createButton("continue", y, 0, function() {
				this.changelogGui.clearLogs();
				stopTitleMusic();
				ig.interact.removeEntry(this.buttonInteract);
				ig.game.loadStart(ig.storage.lastUsedSlot)
			}.bind(this), "continue"));
			this.gameCodeButton = new sc.ButtonGui(ig.lang.get("sc.gui.title-screen.gamecode"), sc.BUTTON_DEFAULT_WIDTH - 8);
			this.gameCodeButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.gameCodeButton.setPos(-20, 12);
			this.gameCodeButton.onButtonPress = function() {
				window.SHOW_GAMECODE && window.SHOW_GAMECODE()
			};
			this.gameCodeButton.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						offsetY: -40,
						alpha: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.gameCodeButton.doStateTransition("HIDDEN", true);
			this.buttonGroup.addFocusGui(this.gameCodeButton, 1, 4);
			this.addChildGui(this.gameCodeButton);
			this.followButton = new sc.ButtonGui("\\i[twitter]", 32);
			this.followButton.textChild.hook.pos.y = this.followButton.textChild.hook.pos.y + 1;
			this.followButton.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.followButton.setPos(sc.BUTTON_DEFAULT_WIDTH / 2 + 12, 12);
			this.followButton.onButtonPress = function() {
				window.SHOW_TWITTER && window.SHOW_TWITTER()
			};
			this.followButton.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						offsetY: -40,
						alpha: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.followButton.doStateTransition("HIDDEN", true);
			this.buttonGroup.addFocusGui(this.followButton, 2, 4);
			this.addChildGui(this.followButton);
			this.checkPerformanceWarning();
			if (this.perfWarning) {
				this.perfWarnButton = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.title-screen.perform-warn"), null, true, sc.BUTTON_TYPE.EQUIP);
				this.perfWarnButton.hook.transitions = {
					DEFAULT: {
						state: {},
						time: 0.2,
						timeFunction: KEY_SPLINES.EASE
					},
					HIDDEN: {
						state: {
							offsetY: -30
						},
						time: 0.2,
						timeFunction: KEY_SPLINES.LINEAR
					}
				};
				this.perfWarnButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
				this.perfWarnButton.setHeight(26);
				this.perfWarnButton.textChild.setPos(0, -1);
				this.perfWarnButton.setPos(2, 2);
				this.perfWarnButton.doStateTransition("HIDDEN", true);
				this.perfWarnButton.onButtonPress = function() {
					this.showPerformanceWarning()
				}.bind(this);
				this.addChildGui(this.perfWarnButton);
				this.buttonInteract.addGlobalButton(this.perfWarnButton, function() {
					return sc.control.menuHotkeyHelp()
				}.bind(this))
			}
			this.changelogButton = new sc.ButtonGui("\\i[menu]Changelog", null, true, sc.BUTTON_TYPE.EQUIP);
			this.changelogButton.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						offsetX: -(this.changelogButton.hook.size.x + 2)
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			this.changelogButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.changelogButton.setHeight(26);
			this.changelogButton.textChild.setPos(0, -1);
			this.changelogButton.setPos(2, 2);
			this.changelogButton.doStateTransition("HIDDEN", true);
			this.changelogButton.onButtonPress = function() {
				this.changelogGui.showLog()
			}.bind(this);
			this.addChildGui(this.changelogButton);
			this.buttonInteract.addGlobalButton(this.changelogButton, function() {
				return sc.control.menu()
			}.bind(this));
			this.doStateTransition("DEFAULT", true)
		},
		postInit: function() {
			if (ig.extensions.getExtensionList().length > 0) {
				this.dlcButton = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.dlc-list.button"), null, true, sc.BUTTON_TYPE.EQUIP);
				this.dlcButton.hook.transitions = {
					DEFAULT: {
						state: {},
						time: 0.2,
						timeFunction: KEY_SPLINES.EASE
					},
					HIDDEN: {
						state: {
							offsetY: -(this.changelogButton.hook.size.y + 4)
						},
						time: 0.2,
						timeFunction: KEY_SPLINES.LINEAR
					}
				};
				this.dlcButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
				this.dlcButton.setHeight(26);
				this.dlcButton.textChild.setPos(0, -1);
				this.dlcButton.setPos(this.changelogButton.hook.size.x + 6, 2);
				this.dlcButton.doStateTransition("HIDDEN", true);
				this.dlcButton.onButtonPress = function() {
					this.dlcGui.show()
				}.bind(this);
				this.buttonInteract.addGlobalButton(this.dlcButton, function() {
					return sc.control.menuHotkeyHelp2()
				}.bind(this));
				this.addChildGui(this.dlcButton)
			}
			this.changelogGui = new sc.ChangelogGui;
			this.addChildGui(this.changelogGui);
			this.dlcGui = new sc.DLCGui;
			this.addChildGui(this.dlcGui);
			this.background = new ig.ColorGui("#000", ig.system.width, ig.system.height);
			this.background.hook.transitions = {
				DEFAULT: {
					state: {
						alpha: 0.8
					},
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
			this.background.doStateTransition("HIDDEN");
			this.addChildGui(this.background);
			this.presetMenu = new sc.TitlePresetMenu(function(slot) {
				this.presetMenu.deactivate();
				this.background.doStateTransition("HIDDEN");
				this.changelogGui.clearLogs();
				stopTitleMusic();
				ig.interact.removeEntry(this.buttonInteract);
				sc.savePreset.load(slot)
			}.bind(this), function() {
				this.background.doStateTransition("HIDDEN")
			}.bind(this));
			this.presetMenu.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.presetMenu.setPos(10, 8);
			this.addChildGui(this.presetMenu)
		},
		show: function() {
			(this._newGamePlus = window.IG_GAME_DEBUG ? this.checkClearSaveFiles() && (window.SHOW_NEW_GAME_PLUS || false) : this.checkClearSaveFiles()) ? this.namedButtons.start.setText(ig.lang.get("sc.gui.title-screen.startPlus"), true) : this.namedButtons.start.setText(ig.lang.get("sc.gui.title-screen.start"), true);
			this.background.doStateTransition("HIDDEN");
			this.doStateTransition("DEFAULT");
			for (var delay = 0, i = this.buttons.length; i--;) {
				this.buttons[i].doStateTransition("DEFAULT", false, false, null, delay);
				delay = delay + 0.016
			}
			this.changelogButton.doStateTransition("DEFAULT");
			this.perfWarnButton && this.perfWarnButton.doStateTransition("DEFAULT");
			this.dlcButton && this.dlcButton.doStateTransition("DEFAULT");
			ig.interact.setBlockDelay(0.3);
			ig.interact.addEntry(this.buttonInteract);
			ig.input.mouseGuiActive ? this.buttonGroup.setCurrentFocus(0, 0) : this.buttonGroup.focusCurrentButton(0, 0, false, true);
			this.gameCodeButton.doStateTransition("DEFAULT");
			this.followButton.doStateTransition("DEFAULT");
			this.perfWarning && this.perfWarning != localStorage.getItem("ccPerfWarning") && this.showPerformanceWarning();
			localStorage.setItem("ccPerfWarning", this.perfWarning)
		},
		hide: function(instant) {
			this.background.doStateTransition("DEFAULT");
			this.presetMenu.deactivate();
			this.doStateTransition("DEFAULT", instant);
			for (var i = this.buttons.length; i--;) this.buttons[i].doStateTransition("HIDDEN", instant);
			this.changelogButton.doStateTransition("HIDDEN");
			this.dlcButton && this.dlcButton.doStateTransition("HIDDEN");
			this.perfWarnButton && this.perfWarnButton.doStateTransition("HIDDEN");
			this.gameCodeButton.doStateTransition("HIDDEN", instant);
			this.followButton.doStateTransition("HIDDEN", instant)
		},
		checkPerformanceWarning: function() {
			var warning = null;
			if (ig.soundManager.getSampleRate() > 96E3) {
				warning = ig.lang.get("sc.gui.title-screen.perform-warn-text.sample-rate");
				warning = warning.replace("[X]", ig.soundManager.getSampleRate())
			} else ig.nwjsVersion && ig.nwjsVersion[1] < 3E3 && (warning = ig.lang.get("sc.gui.title-screen.perform-warn-text.old-nwjs"));
			this.perfWarning = warning
		},
		showPerformanceWarning: function(custom) {
			if (this.perfWarning || custom) {
				custom = new sc.CenterMsgBoxGui(custom || this.perfWarning, {
					maxWidth: 300,
					speed: ig.TextBlock.SPEED.IMMEDIATE,
					textAlign: ig.Font.ALIGN.CENTER
				}, "black", 0.9);
				custom.hook.zIndex = 1500;
				ig.gui.addGuiElement(custom)
			}
		},
		checkClearSaveFiles: function() {
			for (var slots = ig.storage.slots, i = slots.length; i--;) {
				var data = slots[i].getData();
				if (data.vars && data.vars.storage && data.vars.storage.plot && data.vars.storage.plot.metaSpace >= 1) return true
			}
			return false
		},
		_createButton: function(label, y, focusIndex, callback, namedKey) {
			label = new sc.ButtonGui(ig.lang.get("sc.gui.title-screen." + label), sc.BUTTON_DEFAULT_WIDTH);
			label.setPos(12, y);
			label.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			label.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				},
				HIDDEN: {
					state: {
						offsetX: -(sc.BUTTON_DEFAULT_WIDTH + 12)
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
			};
			label.onButtonPress = callback;
			label.doStateTransition("DEFAULT", true);
			this.buttonGroup.addFocusGui(label, 0, focusIndex);
			this.addChildGui(label);
			namedKey && (this.namedButtons[namedKey] = label);
			this.buttons.push(label);
			return label.hook.size.y + 4
		},
		_enterLoadMenu: function() {
			sc.menu.loadMode = true;
			sc.menu.setDirectMode(true, sc.MENU_SUBMENU.SAVE);
			sc.model.enterMenu(true)
		},
		_enterOptionsMenu: function() {
			sc.menu.setDirectMode(true, sc.MENU_SUBMENU.OPTIONS);
			sc.menu.optionsLocalMode = false;
			sc.model.enterMenu(true)
		}
	})
});
ig.baked = !0;
