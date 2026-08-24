/**
 * @module game.feature.gui.widget.demo-stats
 * @description sc.DemoStats: the demo "stats" overlay (playtime, chests,
 *   level, exp, money, kills) shown in the playable tech demo.
 */
ig.module("game.feature.gui.widget.demo-stats").requires("impact.base.event", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers").defines(function() {
	function formatTime(seconds) {
		return padNumber(seconds / 60 / 60, 3) + ":" + padNumber(Math.floor(seconds / 60) % 60, 2) + ":" + padNumber(Math.floor(seconds) % 60, 2)
	}

	function padNumber(number, digits) {
		var str = "0000" + Math.floor(number);
		return str.length >= 4 + digits ? Math.floor(number) : str.substr(str.length - digits)
	}
	sc.DemoStatsStat = ig.GuiElementBase.extend({
		nameGui: null,
		valueGui: null,
		totalGui: null,
		name: null,
		value: null,
		updateCallback: null,
		init: function(key, value, updater, total) {
			this.parent();
			this.hook.size.x = 200;
			this.hook.size.y = 20;
			this.nameGui = new sc.TextGui(ig.lang.get("sc.gui.stats." + key) + ":");
			this.nameGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.nameGui.setPos(10, 0);
			this.addChildGui(this.nameGui);
			this.valueGui = new sc.TextGui(value + "");
			this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(this.valueGui);
			updater && this.addUpdater(updater);
			total && this.addTotalNumber(total)
		},
		update: function() {
			this.updateCallback && this.updateCallback(this)
		},
		setValue: function(value) {
			this.valueGui.setText(value + "")
		},
		addUpdater: function(callback) {
			this.updateCallback = callback || null
		},
		addTotalNumber: function(total) {
			total = new sc.TextGui(" / " + total);
			total.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
			this.addChildGui(total);
			this.valueGui.setPos(total.hook.size.x + 5, 0)
		}
	});
	sc.DemoStats = ig.GuiElementBase.extend({
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
		bgColor: null,
		msgBox: null,
		content: null,
		callback: null,
		screenInteract: null,
		init: function(callback) {
			this.parent();
			this.hook.localAlpha = 0.8;
			this.hook.zIndex = 90;
			this.hook.temporary = true;
			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.callback = callback;
			this.screenInteract = new sc.ScreenInteractEntry(this);
			this.content = new ig.GuiElementBase;
			this.content.setSize(210, 160);
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
				gui = new sc.TextGui(ig.lang.get("sc.gui.stats.stats"));
			gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			gui.setPos(0, y);
			this.content.addChildGui(gui);
			y = y + (gui.hook.size.y + 2);
			gui = new sc.LineGui(200);
			gui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
			gui.setPos(0, y);
			this.content.addChildGui(gui);
			y = this._createStatLine(y + 4, "time", formatTime(sc.stats.getMap("player", "playtime")), function(stat) {
				stat.setValue(formatTime(sc.stats.getMap("player", "playtime")))
			}.bind(this));
			gui = sc.stats.getMap("chests", "autumn-area");
			y = this._createStatLine(y, "chests", gui, null, Math.max(27, gui));
			y = this._createStatLine(y, "level", sc.model.player.level || 0);
			y = this._createStatLine(y, "exp", sc.stats.getMap("player", "exp") || 0);
			y = this._createStatLine(y, "money", sc.stats.getMap("player", "money") || 0);
			y = this._createStatLine(y, "kills", sc.stats.getMap("combat", "totalKilled") || 0)
		},
		_createStatLine: function(y, key, value, updater, total) {
			key = new sc.DemoStatsStat(key, value, updater, total);
			key.setPos(0, y);
			this.content.addChildGui(key);
			return y + key.hook.size.y + 2
		},
		_close: function() {
			this.msgBox.doStateTransition("HIDDEN");
			this.doStateTransition("HIDDEN", false, true);
			this.callback && this.callback()
		}
	})
});
ig.baked = !0;
