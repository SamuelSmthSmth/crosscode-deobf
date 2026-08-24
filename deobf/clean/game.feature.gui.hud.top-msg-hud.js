/**
 * @module game.feature.gui.hud.top-msg-hud
 * @description sc.TopMsgHudGui: the large centered announcement banners
 *   (landmarks, quest tasks, lore, drops, feats) with icon, title and sub-text.
 */
ig.module("game.feature.gui.hud.top-msg-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.model.options-model").defines(function() {
	var landmarkMsg = {
			icon: 0,
			bgm: "landmark"
		},
		questMsg = {
			icon: 1,
			sound: new ig.Sound("media/sound/hud/quest-task-solved.ogg", 0.5)
		},
		dropMsg = {
			icon: 2
		},
		loreMsg = {
			icon: 3
		},
		featMsg = {
			icon: 4
		};
	sc.TopMsgHudGui = ig.GuiElementBase.extend({
		topGui: null,
		bottomGui: null,
		iconGui: null,
		visible: false,
		timer: 0,
		maxTime: 0,
		current: null,
		messages: [],
		bgm: {},
		init: function() {
			this.parent();
			this.hook.zIndex = 51;
			this.hook.pauseGui = true;
			this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.topGui = new sc.TopMsgTopGui;
			this.topGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.addChildGui(this.topGui);
			this.bottomGui = new sc.TopMsgTitleGui;
			this.bottomGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.bottomGui.setPos(0, 14);
			this.addChildGui(this.bottomGui);
			this.iconGui = new sc.TopMsgIconGui;
			this.iconGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.iconGui.setPos(0, 0);
			this.addChildGui(this.iconGui);
			this.bgm.landmark = ig.bgm.loadTrack("landmark");
			this.animationEndBinded = this.animationEnd.bind(this);
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.map, this);
			sc.Model.addObserver(sc.quests, this);
			sc.Model.addObserver(sc.lore, this);
			sc.Model.addObserver(sc.menu, this);
			sc.Model.addObserver(sc.trophies, this);
			this.setSize(222, 64)
		},
		setContent: function(msg, title, subText, subFontSize) {
			this.bottomGui.setContent(title, subText, subFontSize);
			this.iconGui.setIcon(msg.icon);
			msg.sound && msg.sound.play();
			msg.bgm && ig.bgm.inbetween(this.bgm[msg.bgm], 1, "FAST")
		},
		showMessage: function(msg, titleText, subText, subFontSize, id) {
			this.messages.push({
				icon: msg,
				titleText: titleText,
				subText: subText,
				subFontSize: subFontSize,
				id: id || null
			});
			this.visible ? this.maxTime = 3 : this.popMessage()
		},
		popMessage: function() {
			var msg = this.messages.pop();
			this.setContent(msg.icon, msg.titleText, msg.subText, msg.subFontSize);
			this.visible = true;
			this.topGui.doStateTransition("DEFAULT");
			this.iconGui.doStateTransition("DEFAULT");
			this.bottomGui.doStateTransition("DEFAULT", false, false, this.animationEndBinded);
			this.timer = 0;
			this.maxTime = this.messages.length > 0 ? 3 : 4;
			this.current = msg
		},
		update: function() {
			if (!ig.game.paused && this.maxTime > 0) {
				this.timer = this.timer + ig.system.actualTick;
				this.timer >= this.maxTime && this.hide()
			}
		},
		clear: function() {
			this.messages.length = 0;
			this.current = null;
			this.hide()
		},
		hide: function() {
			this.maxTimer = 0;
			this.iconGui.doStateTransition("HIDDEN");
			if (this.messages.length > 0) this.bottomGui.hide(this.animationEndBinded);
			else {
				this.current = null;
				this.visible = false;
				this.bottomGui.hide();
				this.topGui.doStateTransition("HIDDEN")
			}
		},
		animationEnd: function() {
			this.bottomGui.hook.currentStateName == "DEFAULT" ? this.bottomGui.showSubText() : this.bottomGui.hook.currentStateName == "HIDDEN" && this.messages.length > 0 && this.popMessage()
		},
		checkDuplicates: function(id) {
			if (this.current && this.current.id == id) return true;
			for (var i = this.messages.length; i--;)
				if (this.messages.id == id) return true;
			return false
		},
		modelChanged: function(model, msg, data) {
			if (model == sc.model) msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED ? model.isReset() && this.clear() : msg == sc.GAME_MODEL_MSG.CLEAR_TOP_MESSAGE && this.clear();
			else if (model == sc.map) msg == sc.MAP_EVENT.LANDMARK_ADDED && data && data.landmark && data.area && sc.options.get("update-landmark-style") == sc.UPDATE_LANDMARK_STYLE.LARGE && this.showMessage(landmarkMsg, ig.lang.get("sc.gui.landmark-hud.title-new"), sc.map.getLandmarkName(data.landmark, data.area), sc.fontsystem.font);
			else if (model == sc.quests) {
				if (msg == sc.QUEST_MODEL_EVENT.TASK_DONE && data && data.state && !data.state.skipPreviousTask() && sc.options.get("update-quest-style") == sc.UPDATE_QUEST_STYLE.LARGE && !this.checkDuplicates(data.quest.id)) {
					model = sc.options.get("quest-show-current");
					msg = Math.max(0, data.state.currentTask - (model ? 1 : 0));
					msg = data.quest.tasks[msg];
					this.showMessage(questMsg, ig.lang.get("sc.gui.quest-hud." + (model ? "taskDoneCurrent" : "taskDoneCenter")), msg.task.toString(), sc.fontsystem.smallFont, data.quest.id)
				}
			} else if (model == sc.lore)
				if (msg == sc.LORE_EVENT.UNLOCKED) {
					if (data && sc.options.get("update-lore-style") == sc.UPDATE_LORE_STYLE.LARGE) {
						model = "\\c[3]" + sc.lore.getLoreTitle(data.lore) + "\\c[0] ";
						model = model + (data.updated ? ig.lang.get("sc.gui.lore-hud.updated") : ig.lang.get("sc.gui.lore-hud.unlocked"));
						this.showMessage(loreMsg, ig.lang.get("sc.gui.lore-hud.top-title"), model, sc.fontsystem.font)
					}
				} else msg == sc.LORE_EVENT.ACIVATED && this.showMessage(loreMsg, ig.lang.get("sc.gui.lore-hud.top-first-title"), ig.lang.get("sc.gui.lore-hud.top-first"), sc.fontsystem.font);
			else if (model == sc.menu) {
				if (msg == sc.MENU_EVENT.DROP_COMPLETED && data && sc.options.get("update-drop-style") == sc.UPDATE_LORE_STYLE.LARGE) {
					model = "\\c[3]" + sc.menu.getDropName(data) + "\\c[0] ";
					model = model + ig.lang.get("sc.gui.drop-hud.completed");
					this.showMessage(dropMsg, ig.lang.get("sc.gui.drop-hud.title"), model, sc.fontsystem.smallFont)
				}
			} else if (model == sc.trophies && (msg == sc.TROPHY_EVENTS.TRIGGERED && data) && sc.options.get("update-trophy-style") == sc.UPDATE_TROPHY_STYLE.LARGE) {
				model = ig.lang.get("sc.gui.feats.unlocked") + " \\c[3]" + new ig.LangLabel(sc.trophies.getTrophyName(data)) + "\\c[0]";
				this.showMessage(featMsg, ig.lang.get("sc.gui.feats.hud-title"), model, sc.fontsystem.smallFont)
			}
		}
	});
	sc.TopMsgIconGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		gfx: new ig.Image("media/gui/message.png"),
		icon: 0,
		init: function() {
			this.parent();
			this.setSize(24, 24);
			this.setPivot(12, 12);
			this.doStateTransition("HIDDEN", true)
		},
		setIcon: function(icon) {
			this.icon = icon
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 96 + this.icon * 24, 128, 24, 24, false, false)
		}
	});
	sc.TopMsgTopGui = ig.ImageGui.extend({
		transitions: {
			DEFAULT: {
				state: {
					alpha: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		gfx: new ig.Image("media/gui/message.png"),
		init: function() {
			this.parent(this.gfx, 48, 148, 32, 12);
			this.setPivot(this.hook.size.x / 2, 0);
			this.doStateTransition("HIDDEN", true)
		}
	});
	sc.TopMsgTitleGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleX: 0,
					scaleY: 0
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		titleTextGui: null,
		subTextGui: null,
		gfx: new ig.Image("media/gui/message.png"),
		ninePatches: {
			left: new ig.NinePatch("media/gui/message.png", {
				width: 4,
				height: 0,
				left: 12,
				top: 4,
				right: 0,
				bottom: 0,
				offsets: {
					"default": {
						x: 0,
						y: 144
					}
				}
			}),
			leftInner: new ig.NinePatch("media/gui/message.png", {
				width: 8,
				height: 0,
				left: 8,
				top: 11,
				right: 0,
				bottom: 0,
				offsets: {
					"default": {
						x: 16,
						y: 136
					}
				}
			}),
			rightInner: new ig.NinePatch("media/gui/message.png", {
				width: 8,
				height: 0,
				left: 0,
				top: 11,
				right: 8,
				bottom: 0,
				offsets: {
					"default": {
						x: 64,
						y: 136
					}
				}
			}),
			right: new ig.NinePatch("media/gui/message.png", {
				width: 4,
				height: 0,
				left: 0,
				top: 4,
				right: 12,
				bottom: 0,
				offsets: {
					"default": {
						x: 80,
						y: 144
					}
				}
			})
		},
		init: function() {
			this.parent();
			this.titleTextGui = new sc.TextGui("", {
				font: sc.fontsystem.tinyFont
			});
			this.titleTextGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.titleTextGui.setPos(0, 8);
			this.addChildGui(this.titleTextGui);
			this.subTextGui = new sc.TopMsgSubGui;
			this.subTextGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			this.subTextGui.setPos(0, 17);
			this.addChildGui(this.subTextGui);
			this.setSize(222, 22);
			this.setPivot(111, 9);
			this.doStateTransition("HIDDEN", true)
		},
		setContent: function(title, subText, subFontSize) {
			this.titleTextGui.setText(title);
			this.subTextGui.setContent(subText, subFontSize)
		},
		showSubText: function() {
			this.subTextGui.doStateTransition("DEFAULT")
		},
		hide: function(callback) {
			this.doStateTransition("HIDDEN", false, false, callback);
			this.subTextGui.doStateTransition("HIDDEN")
		},
		updateDrawables: function(drawables) {
			var width = this.hook.size.x,
				centerWidth = Math.max(64, this.titleTextGui.hook.size.x + 20),
				centerWidth = Math.ceil(centerWidth / 2) * 2,
				width = (width - centerWidth) / 2,
				centerWidth = (centerWidth - 32) / 2,
				x = 0;
			this.ninePatches.left.draw(drawables, width, 8, "default", x, 14);
			x = x + width;
			this.ninePatches.leftInner.draw(drawables, centerWidth, 11, "default", x, 6);
			x = x + centerWidth;
			drawables.addGfx(this.gfx, x, 0, 32, 130, 32, 17, false, false);
			x = x + 32;
			this.ninePatches.rightInner.draw(drawables, centerWidth, 11, "default", x, 6);
			this.ninePatches.right.draw(drawables, width, 8, "default", x + centerWidth, 14)
		}
	});
	sc.TopMsgSubGui = ig.BoxGui.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleY: 0
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		ninepatch: new ig.NinePatch("media/gui/message.png", {
			width: 24,
			height: 4,
			left: 8,
			top: 5,
			right: 8,
			bottom: 3,
			offsets: {
				"default": {
					x: 8,
					y: 148
				}
			}
		}),
		init: function() {
			this.parent();
			this.hook.localAlpha = 0.7;
			this.subTextGui = new sc.TextGui("", {
				maxWidth: 206,
				textAlign: ig.Font.ALIGN.CENTER,
				bestRatio: 8
			});
			this.subTextGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.subTextGui.setPos(0, 0);
			this.addChildGui(this.subTextGui);
			this.setPivot(109, 0);
			this.doStateTransition("HIDDEN", true)
		},
		setContent: function(text, fontSize) {
			this.subTextGui.setFont(fontSize);
			this.subTextGui.setText(text);
			this.setSize(218, this.subTextGui.hook.size.y);
			this.setPivot(109, 0)
		}
	})
});
ig.baked = !0;
