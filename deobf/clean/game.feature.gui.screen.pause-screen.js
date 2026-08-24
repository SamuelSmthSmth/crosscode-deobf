/**
 * @module game.feature.gui.screen.pause-screen
 * @description sc.PauseScreenGui: the pause menu (resume / options / save /
 *   to-title, plus arena restart/lobby variants and cutscene skip / cancel),
 *   and the blinking ig.GUI.PauseScreenLabel.
 */
ig.module("game.feature.gui.screen.pause-screen").requires("impact.feature.gui.gui", "impact.base.image", "game.feature.gui.base.button", "game.feature.menu.gui.save.save-menu", "game.feature.gui.widget.modal-dialog").defines(function() {
	sc.PauseScreenGui = ig.GuiElementBase.extend({
		buttonInteract: null,
		buttonGroup: null,
		resumeButton: null,
		skipButton: null,
		cancelButton: null,
		toTitleButton: null,
		saveGameButton: null,
		optionsButton: null,
		versionGui: null,
		infoGui: null,
		gfx: new ig.Image("media/gui/scanlines.png"),
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
		_waitForMenu: false,
		init: function() {
			this.parent();
			this.hook.localAlpha = 0.8;
			this.hook.zIndex = 100;
			this.hook.pauseGui = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.buttonInteract = new ig.ButtonInteractEntry;
			this.buttonGroup = new sc.ButtonGroup;
			this.buttonInteract.pushButtonGroup(this.buttonGroup);
			this.toTitleButton = new sc.ButtonGui(ig.lang.get("sc.gui.pause-screen.to-title"), sc.BUTTON_DEFAULT_WIDTH);
			this.toTitleButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.toTitleButton.onButtonPress = function() {
				ig.canLeavePauseMenu = false;
				sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.titleConfirm"), sc.DIALOG_INFO_ICON.QUESTION, function(button) {
					ig.canLeavePauseMenu = true;
					if (button.data == 0) {
						ig.interact.removeEntry(this.buttonInteract);
						ig.game.gotoTitle()
					}
				}.bind(this))
			}.bind(this);
			this.skipButton = new sc.ButtonGui(ig.lang.get("sc.gui.pause-screen.skip"), sc.BUTTON_DEFAULT_WIDTH);
			this.skipButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.skipButton.onButtonPress = function() {
				sc.model.startSkip();
				sc.model.enterRunning()
			}.bind(this);
			this.cancelButton = new sc.ButtonGui("CANCEL BUTTON", sc.BUTTON_DEFAULT_WIDTH);
			this.cancelButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.cancelButton.onButtonPress = function() {
				ig.canLeavePauseMenu = false;
				sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.cancelConfirm"), sc.DIALOG_INFO_ICON.QUESTION, function(button) {
					ig.canLeavePauseMenu = true;
					if (button.data == 0) {
						ig.interact.removeEntry(this.buttonInteract);
						sc.model.enterRunning();
						ig.game.reloadAutosave()
					}
				}.bind(this))
			}.bind(this);
			this.resumeButton = new sc.ButtonGui(ig.lang.get("sc.gui.pause-screen.resume"), sc.BUTTON_DEFAULT_WIDTH, void 0, void 0, sc.BUTTON_SOUND.back);
			this.resumeButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.resumeButton.onButtonPress = function() {
				sc.model.enterRunning()
			}.bind(this);
			this.toTitleButton.setPos(3, 3);
			this.saveGameButton = new sc.ButtonGui(ig.lang.get("sc.gui.pause-screen.save-game"), sc.BUTTON_DEFAULT_WIDTH);
			this.saveGameButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.saveGameButton.onButtonPress = function() {
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.SAVE);
				sc.model.enterMenu(true)
			}.bind(this);
			this.optionsButton = new sc.ButtonGui(ig.lang.get("sc.gui.menu.menu-titles.options"), sc.BUTTON_DEFAULT_WIDTH);
			this.optionsButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.optionsButton.onButtonPress = function() {
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.OPTIONS);
				sc.model.enterMenu(true)
			}.bind(this);
			this.arenaRestart = new sc.ButtonGui("RESTART BUTTON", sc.BUTTON_DEFAULT_WIDTH);
			this.arenaRestart.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.arenaRestart.onButtonPress = function() {
				ig.canLeavePauseMenu = false;
				sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.arena.dialogs." + (sc.arena.runtime.rush ? "restart" : "repeat")), sc.DIALOG_INFO_ICON.QUESTION, function(button) {
					ig.canLeavePauseMenu = true;
					if (button.data == 0) {
						sc.arena.setPauseAction(sc.ARENA_PAUSE_ACTIONS.RESTART);
						sc.model.enterRunning();
						ig.bgm.pause("FAST_OUT");
						sc.arena.runtime.rush ? sc.arena.restartCup() : sc.arena.startNextRound(false);
						sc.commonEvents.startCallEvent("arena-teleport")
					}
				}.bind(this))
			}.bind(this);
			this.arenaLobby = new sc.ButtonGui("\\c[3]" + ig.lang.get("sc.gui.pause-screen.lobby"), sc.BUTTON_DEFAULT_WIDTH);
			this.arenaLobby.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.arenaLobby.onButtonPress = function() {
				ig.canLeavePauseMenu = false;
				sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.arena.dialogs.lobby"), sc.DIALOG_INFO_ICON.QUESTION, function(button) {
					ig.canLeavePauseMenu = true;
					if (button.data == 0) {
						sc.arena.setPauseAction(sc.ARENA_PAUSE_ACTIONS.LOBBY);
						sc.model.enterRunning();
						ig.bgm.pause("MEDIUM_OUT");
						sc.arena.prepareLobbyReturn();
						sc.commonEvents.startCallEvent("arena-end-cup")
					}
				}.bind(this))
			}.bind(this);
			this.versionGui = new sc.TextGui(sc.version.toString(), {
				font: sc.fontsystem.tinyFont
			});
			this.versionGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.versionGui.setPos(0, 1);
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
			this.addChildGui(this.versionGui);
			var infoText = ig.lang.get("sc.gui.pause-screen.lang-fix");
			this.infoGui = new sc.TextGui(infoText, {
				font: sc.fontsystem.smallFont
			});
			this.infoGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.infoGui.setPos(2, 1);
			this.infoGui.hook.transitions = {
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
			this.addChildGui(this.toTitleButton);
			this.addChildGui(this.resumeButton);
			this.addChildGui(this.saveGameButton);
			this.addChildGui(this.optionsButton);
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.menu, this);
			this.doStateTransition("HIDDEN", true);
			if (!this.constructor.PATTERN) this.constructor.PATTERN = this.gfx.createPattern(0, 0, 64, 64, ig.ImagePattern.OPT.REPEAT_X_AND_Y)
		},
		updateDrawables: function(drawables) {
			drawables.addPattern(this.constructor.PATTERN, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
		},
		modelChanged: function(model, msg) {
			if (model == sc.model) {
				if (msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && !sc.model.isReset() && sc.model.currentSubState != sc.GAME_MODEL_SUBSTATE.MENU) {
					var visible = sc.menu.directMode ? true : sc.model.isPaused();
					this.doStateTransition(visible ? "DEFAULT" : "HIDDEN");
					if (visible) {
						this.updateButtons(sc.model.prevSubState == sc.GAME_MODEL_SUBSTATE.MENU);
						ig.interact.addEntry(this.buttonInteract);
						ig.interact.setBlockDelay(0.2)
					} else ig.interact.removeEntry(this.buttonInteract)
				}
			} else if (model == sc.menu && msg == sc.MENU_EVENT.FULL_MENU_ENTER) this.hook.invisibleUpdate = false
		},
		updateButtons: function(restoreFocus) {
			this.removeChildGui(this.skipButton);
			this.removeChildGui(this.cancelButton);
			this.removeChildGui(this.resumeButton);
			this.removeChildGui(this.optionsButton);
			this.removeChildGui(this.saveGameButton);
			this.removeChildGui(this.toTitleButton);
			this.removeChildGui(this.arenaRestart);
			this.removeChildGui(this.arenaLobby);
			var focusY = this.buttonGroup.current.y,
				mouseActive = ig.input.mouseGuiActive,
				restoreFocus = restoreFocus ? restoreFocus : false;
			this.buttonGroup.clear();
			var runtime = sc.arena.runtime;
			if (sc.arena.active && runtime && runtime.roundStarted && !runtime.roundFinished && !runtime.roundEndPre && sc.model.currentState != sc.GAME_MODEL_STATE.CUTSCENE) {
				this.addChildGui(this.resumeButton);
				this.addChildGui(this.optionsButton);
				this.addChildGui(this.arenaRestart);
				this.addChildGui(this.arenaLobby);
				this.buttonGroup.addFocusGui(this.resumeButton, 0, 0, true);
				sc.arena.runtime.rush ? this.arenaRestart.setText("\\c[3]" + ig.lang.get("sc.gui.pause-screen.restartCup"), true) : this.arenaRestart.setText("\\c[3]" + ig.lang.get("sc.gui.pause-screen.restartRound"), true);
				this.buttonGroup.addFocusGui(this.optionsButton, 0, 1);
				this.buttonGroup.addFocusGui(this.arenaRestart, 0, 2);
				this.buttonGroup.addFocusGui(this.arenaLobby, 0, 3);
				this.arenaLobby.setPos(3, 3);
				runtime = this.arenaLobby.hook.size.y;
				this.resumeButton.setPos(3, runtime * 3 + 15);
				this.optionsButton.setPos(3, runtime * 2 + 11);
				this.arenaRestart.setPos(3, 3 + runtime + 4)
			} else {
				this.addChildGui(this.toTitleButton);
				this.addChildGui(this.resumeButton);
				this.addChildGui(this.saveGameButton);
				this.addChildGui(this.optionsButton);
				this.buttonGroup.addFocusGui(this.resumeButton, 0, 0, true);
				this.buttonGroup.addFocusGui(this.optionsButton, 0, 1);
				this.buttonGroup.addFocusGui(this.saveGameButton, 0, 2);
				this.toTitleButton.setPos(3, 3);
				runtime = this.toTitleButton.hook.size.y;
				if (sc.model.currentState == sc.GAME_MODEL_STATE.CUTSCENE && !sc.model.skipBlock) {
					this.addChildGui(this.skipButton);
					this.buttonGroup.addFocusGui(this.skipButton, 0, 3);
					this.buttonGroup.addFocusGui(this.toTitleButton, 0, 4);
					this.skipButton.setPos(3, 3 + runtime + 4);
					this.saveGameButton.setPos(3, runtime * 2 + 11);
					this.optionsButton.setPos(3, runtime * 3 + 15);
					this.resumeButton.setPos(3, runtime * 4 + 19)
				} else if (sc.model.cancelButtonText) {
					this.addChildGui(this.cancelButton);
					this.cancelButton.setText("\\c[1]" + sc.model.cancelButtonText.toString() + "\\c[0]");
					this.cancelButton.setWidth(sc.BUTTON_DEFAULT_WIDTH);
					this.buttonGroup.addFocusGui(this.cancelButton, 0, 3);
					this.buttonGroup.addFocusGui(this.toTitleButton, 0, 4);
					this.cancelButton.setPos(3, 3 + runtime + 4);
					this.saveGameButton.setPos(3, runtime * 2 + 11);
					this.optionsButton.setPos(3, runtime * 3 + 15);
					this.resumeButton.setPos(3, runtime * 4 + 19)
				} else {
					this.buttonGroup.addFocusGui(this.toTitleButton, 0, 3);
					this.saveGameButton.setPos(3, 3 + runtime + 4);
					this.optionsButton.setPos(3, runtime * 2 + 11);
					this.resumeButton.setPos(3, runtime * 3 + 15)
				}
				if (window.IG_GAME_DEBUG) {
					runtime = ig.lang.get("sc.gui.pause-screen.save-game");
					sc.model.isSaveAllowed() || (runtime = "\\c[4]" + runtime);
					this.saveGameButton.setText(runtime);
					this.saveGameButton.setWidth(sc.BUTTON_DEFAULT_WIDTH)
				} else this.saveGameButton.setActive(sc.model.isSaveAllowed())
			}
			focusY > this.buttonGroup.elements[0].length && (focusY = 0);
			restoreFocus || (focusY = 0);
			if (mouseActive) {
				this.buttonGroup.setCurrentFocus(0, focusY);
				this.buttonGroup.unfocusCurrentButton();
				this.optionsButton.unsetFocus()
			} else this.buttonGroup.focusCurrentButton(0, focusY, false, true)
		}
	});
	ig.GUI.PauseScreenLabel = ig.GuiElementBase.extend({
		timer: 0,
		timerTime: 1,
		gfx: new ig.Image("media/gui/pause_word.png"),
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
			this.hook.localAlpha = 1;
			this.hook.zIndex = 0;
			this.hook.size.x = this.gfx.width;
			this.hook.size.y = this.gfx.height
		},
		update: function() {
			this.timer = this.timer + ig.system.actualTick;
			if (this.timer >= this.timerTime) this.timer = this.timer - this.timerTime;
			var progress = this.timer / this.timerTime;
			this.hook.localAlpha = 0.4 + (progress > 0.5 ? 1 - progress : progress) * 1.6;
			if (this.hook.localAlpha > 1) this.hook.localAlpha = 1
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
		}
	})
});
ig.baked = !0;
