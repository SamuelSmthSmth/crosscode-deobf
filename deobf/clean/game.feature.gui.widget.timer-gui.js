/**
 * @module game.feature.gui.widget.timer-gui
 * @description ig.GUI.TimerGui: a stopwatch HUD (minutes:seconds:centiseconds)
 *   plus the STOP_TIMER event step that stops/hides it.
 */
ig.module("game.feature.gui.widget.timer-gui").requires("impact.base.event", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers", "game.feature.gui.base.slick-box").defines(function() {
	ig.GUI.TimerGui = sc.SlickBoxRawGui.extend({
		pos: {
			x: 4,
			y: 50
		},
		size: {
			x: 80,
			y: 18
		},
		pivot: {
			x: 40,
			y: 6
		},
		align: {
			x: ig.GUI_ALIGN.X_LEFT,
			y: ig.GUI_ALIGN.Y_TOP
		},
		_wm: new ig.Config({
			width: 100,
			attributes: {
				start: {
					_type: "Boolean",
					_info: "True if the timer should start right aways"
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: -100
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		gfx: new ig.Image("media/gui/basic.png"),
		centiseconds: null,
		seconds: null,
		minutes: null,
		time: 0,
		running: false,
		zIndex: 1001,
		init: function(settings) {
			this.parent(false, "Timer");
			this.setSize(80, 16);
			this.setPos(0, 60);
			this.hook.zIndex = 1E6;
			this.centiseconds = new sc.NumberGui(99, {
				padZeros: true
			});
			this.seconds = new sc.NumberGui(99, {
				padZeros: true
			});
			this.minutes = new sc.NumberGui(99, {
				padZeros: true
			});
			this.centiseconds.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.seconds.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.minutes.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			var x = 8;
			this.centiseconds.setPos(x, 3);
			var x = x + this.centiseconds.hook.size.x,
				colon = new ig.ImageGui(this.gfx, 104, 0, 8, 8);
			colon.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			colon.setPos(x, 3);
			this.addChildGui(colon);
			x = x + 8;
			this.seconds.setPos(x, 3);
			x = x + this.seconds.hook.size.x;
			colon = new ig.ImageGui(this.gfx, 104, 0, 8, 8);
			colon.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			colon.setPos(x, 3);
			this.addChildGui(colon);
			this.minutes.setPos(x + 8, 3);
			this.addChildGui(this.centiseconds);
			this.addChildGui(this.seconds);
			this.addChildGui(this.minutes);
			if (settings) this.running = settings.start || false;
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT")
		},
		update: function() {
			if (this.running) this.time = this.time + ig.system.tick;
			var total = Math.floor(this.time * 100);
			this.centiseconds.setNumber(total % 100);
			total = Math.floor(total / 100);
			this.seconds.setNumber(total % 60);
			total = Math.floor(total / 60);
			this.minutes.setNumber(total);
			this.parent()
		},
		start: function() {
			this.running = true
		},
		stop: function() {
			this.running = false
		},
		remove: function() {
			this.doStateTransition("HIDDEN", false, true)
		}
	});
	ig.EVENT_STEP.STOP_TIMER = ig.EventStepBase.extend({
		hide: null,
		_wm: new ig.Config({
			attributes: {
				hide: {
					_type: "Boolean",
					_info: "True if the timer should be hidden and removed."
				}
			}
		}),
		init: function(settings) {
			this.hide = settings.hide
		},
		start: function() {
			var timer = ig.gui.namedGuiElements.timer;
			if (timer) {
				timer.stop();
				this.hide && timer.remove()
			}
		}
	})
});
ig.baked = !0;
