/**
 * @module game.feature.gui.widget.modal-dialog
 * @description sc.Dialogs: modal message and choice dialogs (info/warning/
 *   error/question, yes-no and custom button dialogs) with an optional icon.
 */
ig.module("game.feature.gui.widget.modal-dialog").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group").defines(function() {
	sc.DIALOG_INFO_ICON = {};
	sc.DIALOG_INFO_ICON.NONE = 0;
	sc.DIALOG_INFO_ICON.INFO = 1;
	sc.DIALOG_INFO_ICON.WARNING = 2;
	sc.DIALOG_INFO_ICON.ERROR = 3;
	sc.DIALOG_INFO_ICON.QUESTION = 4;
	sc.ModalScreenInteract = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		msgBox: null,
		textGui: null,
		textDone: false,
		icon: 0,
		screenInteract: null,
		callback: null,
		init: function(text, icon, horizontalIcon, callback) {
			this.parent();
			this.hook.zIndex = 9999999;
			this.hook.localAlpha = 0.8;
			this.hook.temporary = true;
			this.hook.pauseGui = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.callback = callback;
			this.icon = icon || sc.DIALOG_INFO_ICON.NONE;
			this.textGui = new sc.TextGui(text, {
				maxWidth: 300 + (!horizontalIcon ? 15 : 0)
			});
			text = new ig.GuiElementBase;
			text.addChildGui(this.textGui);
			if (horizontalIcon) {
				icon = Math.max(16, this.textGui.hook.size.y);
				if (this.icon) {
					callback = new ig.ImageGui(this.gfx, 416 + 16 * (this.icon - 1), 464, 15, 15);
					text.addChildGui(callback);
					horizontalIcon = Math.max(16, this.textGui.hook.size.x + 15 + 4);
					callback.setPos(0, 1);
					this.textGui.setPos(19, 0)
				} else horizontalIcon = Math.max(16, this.textGui.hook.size.x)
			} else {
				horizontalIcon = Math.max(16, this.textGui.hook.size.x);
				if (this.icon) {
					callback = new ig.ImageGui(this.gfx, 416 + 16 * (this.icon - 1), 464, 15, 15);
					text.addChildGui(callback);
					icon = Math.max(16, this.textGui.hook.size.y + 15 + 4);
					callback.setPos(horizontalIcon / 2 - 7.5, 2);
					this.textGui.setPos(0, 19)
				} else icon = Math.max(16, this.textGui.hook.size.y)
			}
			text.setSize(horizontalIcon, icon);
			this.msgBox = new sc.CenterBoxGui(text);
			this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.msgBox);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT");
			this.textGui.textBlock.onFinish = this._onTextFinish.bind(this);
			this.textDone = this.textGui.textBlock.isFinished();
			this.screenInteract = new sc.ScreenInteractEntry(this);
			ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
		},
		update: function() {
			!this.hook.removeAfterTransition && (this.textDone && ig.system.skipMode) && this._close();
			this.parent()
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
		},
		_onTextFinish: function() {
			this.textDone = true
		},
		_close: function() {
			this.msgBox.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true);
			this.callback && this.callback()
		},
		onInteraction: function() {
			if (this.textDone) {
				ig.interact.removeEntry(this.screenInteract);
				this._close()
			} else this.textGui.finish()
		}
	});
	sc.ModalButtonInteract = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		transitions: {
			DEFAULT: {
				state: {
					alpha: 1
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		msgBox: null,
		textGui: null,
		content: null,
		buttons: [],
		icon: 0,
		buttonInteract: null,
		buttongroup: null,
		callback: null,
		back: null,
		keepOpen: false,
		init: function(text, icon, options, callback, silent) {
			this.parent();
			this.hook.zIndex = 9999999;
			this.hook.localAlpha = 0.8;
			this.hook.temporary = true;
			this.hook.pauseGui = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.callback = callback;
			this.buttonInteract = new ig.ButtonInteractEntry;
			this.buttongroup = new sc.ButtonGroup;
			this.buttonInteract.pushButtonGroup(this.buttongroup);
			this.buttongroup.addPressCallback(function(button) {
				this.keepOpen || this.hide();
				this.callback && button.data != void 0 && this.callback(button, this)
			}.bind(this));
			this.back = new sc.ButtonGui("", sc.BUTTON_DEFAULT_WIDTH);
			this.back.data = -1;
			this.back.submitSound = sc.BUTTON_SOUND.back;
			this.back.onButtonPress = function() {
				this.hide();
				this.callback && this.callback(this.back)
			}.bind(this);
			this.buttonInteract.addGlobalButton(this.back, this.onBackButtonCheck.bind(this));
			this.icon = icon || sc.DIALOG_INFO_ICON.NONE;
			this.textGui = new sc.TextGui(text, {
				maxWidth: 315
			});
			this.content = new ig.GuiElementBase;
			this.content.addChildGui(this.textGui);
			icon = text = 0;
			callback = null;
			if (options) {
				var buttonBox = new ig.GuiElementBase;
				buttonBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
				for (var stacked = options.length >= 4, i = 0; i < options.length; i++) {
					callback = new sc.ButtonGui(options[i], sc.BUTTON_TOP_MENU_WIDTH, true, sc.BUTTON_TYPE.SMALL);
					if (silent) callback.submitSound = null;
					if (stacked) {
						callback.setPos(0, text);
						text = text + (sc.BUTTON_TYPE.SMALL + 1);
						if (callback.hook.size.x > icon) icon = callback.hook.size.x;
						this.buttongroup.addFocusGui(callback, 0, i)
					} else {
						callback.setPos(icon, 0);
						icon = icon + (callback.hook.size.x + 1);
						if (callback.hook.size.y > text) text = callback.hook.size.y;
						this.buttongroup.addFocusGui(callback, i, 0)
					}
					callback.data = i;
					this.buttons.push(callback);
					buttonBox.addChildGui(callback)
				}
				buttonBox.setSize(icon, text);
				this.content.addChildGui(buttonBox)
			}
			if (this.icon) {
				silent = new ig.ImageGui(this.gfx, 416 + 16 * (this.icon - 1), 464, 15, 15);
				this.content.addChildGui(silent);
				options = Math.max(16, this.textGui.hook.size.x + 15 + 4);
				silent.setPos(0, 1);
				this.textGui.setPos(19, 0)
			} else options = Math.max(16, this.textGui.hook.size.x);
			if (icon > options) {
				options = icon;
				this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
			}
			silent = Math.max(16, this.textGui.hook.size.y + text + 4);
			this.content.setSize(options, silent);
			this.msgBox = new sc.CenterBoxGui(this.content);
			this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.msgBox);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
		},
		show: function() {
			ig.interact.addEntry(this.buttonInteract);
			ig.interact.setBlockDelay(0.2);
			this.msgBox.doStateTransition("DEFAULT");
			this.doStateTransition("DEFAULT");
			this.buttons.length > 1 && sc.model.addChoiceGui(this)
		},
		hide: function() {
			ig.interact.removeEntry(this.buttonInteract);
			ig.interact.setBlockDelay(0.2);
			this.msgBox.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true);
			sc.model.removeChoiceGui(this)
		},
		onBackButtonCheck: function() {
			return sc.control.menuBack()
		},
		onDetach: function() {}
	});
	sc.Dialogs = {
		showDialog: function(text, icon, horizontalIcon, callback) {
			text = new sc.ModalScreenInteract(text, icon, horizontalIcon, callback);
			ig.gui.addGuiElement(text)
		},
		showInfoDialog: function(text, horizontalIcon, callback) {
			this.showDialog(text, sc.DIALOG_INFO_ICON.INFO, horizontalIcon, callback)
		},
		showWarningDialog: function(text, horizontalIcon, callback) {
			this.showDialog(text, sc.DIALOG_INFO_ICON.WARNING, horizontalIcon, callback)
		},
		showErrorDialog: function(text, horizontalIcon, callback) {
			this.showDialog(text, sc.DIALOG_INFO_ICON.ERROR, horizontalIcon, callback)
		},
		showQuestionDialog: function(text, horizontalIcon, callback) {
			this.showDialog(text, sc.DIALOG_INFO_ICON.QUESTION, horizontalIcon, callback)
		},
		showChoiceDialog: function(text, icon, options, callback, silent) {
			if (!(options instanceof Array)) throw Error("options must be an array!");
			text = new sc.ModalButtonInteract(text, icon, options, callback, silent);
			ig.gui.addGuiElement(text);
			text.show()
		},
		showConformationDialog: function(text, icon, option, callback) {
			this.showChoiceDialog(text, icon, [option], callback)
		},
		showYesNoDialog: function(text, icon, callback, silent) {
			this.showChoiceDialog(text, icon, [ig.lang.get("sc.gui.dialogs.yes"), ig.lang.get("sc.gui.dialogs.no")], callback, silent)
		}
	}
});
ig.baked = !0;
