/**
 * @module game.feature.gui.widget.demo-highscore
 * @description sc.DemoHighscore: the demo highscore table overlay (10 runs)
 *   and sc.DemoLastTime: the "last time" + new-record popup.
 */
ig.module("game.feature.gui.widget.demo-highscore").requires("impact.base.event", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers").defines(function() {
	function formatTime(seconds) {
		return padNumber(seconds / 60 / 60, 2) + ":" + padNumber(seconds / 60, 2) + ":" + padNumber(Math.floor(seconds) % 60, 2) + "." + padNumber(seconds * 100 % 100, 2)
	}

	function padNumber(number, digits) {
		var str = "0000" + Math.floor(number);
		return str.length >= 4 + digits ? Math.floor(number) : str.substr(str.length - digits)
	}
	sc.DemoHighscoreEntry = ig.GuiElementBase.extend({
		nameGui: null,
		valueGui: null,
		name: null,
		value: null,
		init: function(rank, time, isFirst) {
			this.parent();
			this.hook.size.x = 200;
			this.hook.size.y = 18;
			this.nameGui = new sc.TextGui((isFirst ? "\\c[3]" : "") + padNumber(rank, 2));
			this.nameGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.nameGui.setPos(10, 0);
			this.addChildGui(this.nameGui);
			this.valueGui = new sc.TextGui((isFirst ? "\\c[3]" : "") + formatTime(time));
			this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.valueGui);
			time = new ig.ColorGui("#222222", 200, 1);
			time.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			time.setPos(5, 0);
			this.addChildGui(time);
			if (rank % 2 == 1 && !isFirst) {
				this.nameGui.hook.localAlpha = 0.6;
				this.valueGui.hook.localAlpha = 0.6
			}
		}
	});
	sc.DemoHighscore = ig.GuiElementBase.extend({
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
		content: null,
		callback: null,
		screenInteract: null,
		second: false,
		init: function(callback, second) {
			this.parent();
			this.hook.localAlpha = 0.8;
			this.hook.zIndex = 90;
			this.hook.temporary = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.callback = callback;
			this.second = second != void 0 ? second : false;
			this.screenInteract = new sc.ScreenInteractEntry(this);
			this.content = new ig.GuiElementBase;
			this.content.setSize(210, 218);
			this._createContent();
			this.msgBox = new sc.CenterBoxGui(this.content);
			this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.msgBox);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT");
			ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
		},
		update: function() {
			!this.hook.removeAfterTransition && ig.system.skipMode && this._close();
			this.parent()
		},
		updateDrawables: function(drawables) {
			drawables.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
		},
		onInteraction: function() {
			ig.interact.removeEntry(this.screenInteract);
			this._close()
		},
		_createContent: function() {
			var y = 2,
				gui = new sc.TextGui(ig.lang.get("sc.gui.highscore.header" + (this.second ? "2" : "")));
			gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			gui.setPos(0, y);
			this.content.addChildGui(gui);
			y = y + (gui.hook.size.y + 2);
			gui = new sc.LineGui(200);
			gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			gui.setPos(0, y);
			this.content.addChildGui(gui);
			for (var y = y + 4, gui = this.second ? sc.model.highScoreObs : sc.model.highScore, i = 0; i < 10; i++) y = gui[i] != void 0 ? this._createHighscoreEntryLine(y, i + 1, gui[i], i == 0) : this._createHighscoreEntryLine(y, i + 1, 0, i == 0)
		},
		_createHighscoreEntryLine: function(y, rank, time, isFirst) {
			rank = new sc.DemoHighscoreEntry(rank, time, isFirst);
			rank.setPos(0, y);
			this.content.addChildGui(rank);
			return y + rank.hook.size.y + 1
		},
		_close: function() {
			this.msgBox.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true);
			this.callback && this.callback()
		}
	});
	sc.DemoLastTime = ig.GuiElementBase.extend({
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
		content: null,
		callback: null,
		screenInteract: null,
		newRecordDone: false,
		recordGui: null,
		second: false,
		init: function(callback, second) {
			this.parent();
			this.hook.localAlpha = 0.8;
			this.hook.zIndex = 90;
			this.hook.temporary = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.setPos(0, 80);
			this.callback = callback;
			this.second = second != void 0 ? second : false;
			this.screenInteract = new sc.ScreenInteractEntry(this);
			this.content = new ig.GuiElementBase;
			this.content.setSize(180, 60);
			this._createContent();
			this.msgBox = new sc.CenterBoxGui(this.content);
			this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.msgBox.centerBox.hook.localAlpha = 0.9;
			this.addChildGui(this.msgBox);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT");
			ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
		},
		update: function() {
			!this.hook.removeAfterTransition && (this.newRecordDone && ig.system.skipMode) && this._close();
			this.parent()
		},
		onInteraction: function() {
			if (this.newRecordDone) {
				ig.interact.removeEntry(this.screenInteract);
				this._close()
			} else this.recordGui.finish()
		},
		_createContent: function() {
			var y = 2,
				gui = new sc.TextGui(ig.lang.get("sc.gui.highscore.last-time" + (this.second ? "2" : "")));
			gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			gui.setPos(0, y);
			this.content.addChildGui(gui);
			y = y + (gui.hook.size.y + 2);
			gui = new sc.LineGui(170);
			gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			gui.setPos(0, y);
			this.content.addChildGui(gui);
			var y = y + 4,
				gui = sc.model,
				timeGui = new sc.TextGui("\\c[3]" + formatTime(gui.hsTimer));
			timeGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			timeGui.setPos(0, y);
			this.content.addChildGui(timeGui);
			y = y + (timeGui.hook.size.y + 2);
			this.newRecordDone = true;
			timeGui = this.second ? gui.highScoreObs : gui.highScore;
			if (timeGui[0] != void 0 && gui.hsTimer == timeGui[0]) {
				this.recordGui = new sc.TextGui("\\c[3]" + ig.lang.get("sc.gui.highscore.new-record"), {
					speed: ig.TextBlock.SPEED.NORMAL
				});
				this.recordGui.hook.transitions = {
					DEFAULT: {
						state: {
							alpha: 1
						},
						time: 0.1,
						timeFunction: KEY_SPLINES.EASE_OUT
					},
					HIDDEN: {
						state: {
							alpha: 0
						},
						time: 0,
						timeFunction: KEY_SPLINES.EASE_IN
					}
				};
				this.newRecordDone = false;
				this.recordGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				this.recordGui.setPos(0, y);
				this.recordGui.doStateTransition("HIDDEN", true);
				this.recordGui.doStateTransition("DEFAULT", false, false, function() {
					this.newRecordDone = true
				}.bind(this), 0.3);
				this.content.addChildGui(this.recordGui)
			}
		},
		_close: function() {
			this.msgBox.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true);
			this.callback && this.callback()
		}
	})
});
ig.baked = !0;
