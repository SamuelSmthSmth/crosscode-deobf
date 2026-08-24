/**
 * @module game.feature.gui.widget.indiegogo-gui
 * @description sc.IndiegogoGui: the kickstarter-era Indiegogo widget (days
 *   left, animated fund-o-meter bar, expandable goal list) that fetches live
 *   funding data from the CrossCode API.
 */
ig.module("game.feature.gui.widget.indiegogo-gui").requires("impact.feature.gui.gui", "impact.feature.interact.gui.focus-gui", "impact.feature.gui.base.box").defines(function() {
	sc.INDIEGOGO_FETCH_URL = "http://www.cross-code.com/page/api/get-indiegogo-data.php";
	sc.IndiegogoGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetY: -20
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			}
		},
		button: null,
		goalListGui: null,
		goalsData: null,
		active: false,
		init: function() {
			this.parent();
			this.setSize(158, 93);
			this.button = new sc.IndiegogoButton(this.onBarFilled.bind(this));
			this.addChildGui(this.button);
			this.goalListGui = new sc.IndiegogoGoalList;
			this.goalListGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.goalListGui.setPos(0, 94);
			this.addChildGui(this.goalListGui)
		},
		setData: function(data) {
			this.goalsData = data.goals;
			this.button.setData(data);
			this.goalListGui.setData(data.goals);
			this.active && this.doStateTransition("DEFAULT")
		},
		onBarFilled: function(goal) {
			this.goalListGui.setReachedGoal(goal)
		},
		update: function() {
			this.goalListGui.setViewAll(this.button.focus)
		},
		show: function() {
			this.active = true;
			$.ajax({
				url: sc.INDIEGOGO_FETCH_URL,
				type: "GET",
				dataType: "json",
				async: true,
				success: this._dataResponse.bind(this)
			})
		},
		_dataResponse: function(data) {
			this.setData(data)
		},
		hide: function(instant) {
			this.active = false;
			this.doStateTransition("HIDDEN", instant)
		}
	});
	sc.IndiegogoButton = ig.FocusGui.extend({
		gfx: new ig.Image("media/gui/indiegogo.png"),
		highlight: null,
		daysGui: null,
		fundBar: null,
		actionText: null,
		init: function(callback) {
			this.parent();
			this.setSize(158, 93);
			this.highlight = new sc.IndiegogoButtonHighlight;
			this.addChildGui(this.highlight);
			var label = new sc.TextGui("days\nleft!", {
				font: sc.fontsystem.tinyFont
			});
			label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			label.setPos(10, 8);
			this.addChildGui(label);
			this.daysGui = new sc.NumberGui(99, {
				size: sc.NUMBER_SIZE.LARGE,
				transitionTime: 3
			});
			this.daysGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.daysGui.setPos(37, 9);
			this.addChildGui(this.daysGui);
			label = new sc.TextGui("fund-o-meter", {
				font: sc.fontsystem.tinyFont
			});
			label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			label.setPos(9, 27);
			this.addChildGui(label);
			this.fundBar = new sc.IndiegogoFundBar(callback);
			this.fundBar.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
			this.fundBar.setPos(5, 23);
			this.addChildGui(this.fundBar);
			this.actionText = new sc.TextGui("", {
				font: sc.fontsystem.font,
				speed: ig.TextBlock.SPEED.NORMAL
			});
			this.actionText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
			this.actionText.setPos(0, 3);
			this.addChildGui(this.actionText)
		},
		setData: function(data) {
			this.fundBar.setData(data.goals, data.current);
			this.daysGui.setNumber(data.days, true);
			this.actionText.setText(data.callToAction || "Make it happen!")
		},
		update: function() {
			this.highlight.doStateTransition(this.focus ? "DEFAULT" : "HIDDEN")
		},
		updateDrawables: function(drawables) {
			var hook = this.hook;
			drawables.addGfx(this.gfx, 0, 0, 0, 0, hook.size.x, hook.size.y)
		},
		onButtonPress: function() {
			sc.BUTTON_SOUND.submit.play();
			window.SHOW_INDIEGOGO && window.SHOW_INDIEGOGO()
		}
	});
	sc.IndiegogoButtonHighlight = ig.BoxGui.extend({
		ninepatch: new ig.NinePatch("media/gui/indiegogo.png", {
			width: 8,
			height: 8,
			left: 8,
			top: 8,
			right: 8,
			bottom: 8,
			offsets: {
				"default": {
					x: 184,
					y: 0
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		init: function() {
			this.parent(158, 93, false)
		}
	});
	sc.IndiegogoFundBar = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/indiegogo.png"),
		filledCallback: null,
		fundingGoals: null,
		value: 0,
		maxValue: 0,
		fillCount: 0,
		fadeTimer: 0,
		beepSound: new ig.Sound("media/sound/hud/dialog-beep-2.ogg", 0.5),
		beepTimer: 0,
		init: function(callback) {
			this.parent();
			this.setSize(148, 5);
			this.filledCallback = callback
		},
		setData: function(goals, maxValue) {
			this.fundingGoals = goals;
			this.maxValue = maxValue;
			this.fillCount = this.value = 0
		},
		update: function() {
			if (this.fundingGoals) {
				var step = this.fundingGoals[this.fillCount].money - (this.fillCount ? this.fundingGoals[this.fillCount - 1].money : 0);
				if (this.value < this.maxValue) {
					this.value = this.value + Math.min(step * 1, 4E4) * ig.system.actualTick;
					if (this.value >= this.maxValue) {
						this.value = this.maxValue;
						this.beepSound.play(null)
					} else {
						this.beepTimer = this.beepTimer + ig.system.actualTick;
						if (this.beepTimer > 0.05) {
							this.beepTimer = this.beepTimer - 0.05;
							step = 0.2 + 0.8 * (Math.log(this.value / 5) / 13);
							this.beepSound.play(null, {
								speed: step
							})
						}
					}
				}
				for (step = this.fundingGoals.length; step--;)
					if (this.fundingGoals[step].money <= this.value) break;
				step++;
				if (step > this.fillCount) {
					this.fillCount = step;
					this.filledCallback(step);
					this.fadeTimer = 0.4
				}
				if (this.fadeTimer > 0) this.fadeTimer = this.fadeTimer - ig.system.actualTick
			}
		},
		updateDrawables: function(drawables) {
			if (this.fundingGoals) {
				var prevGoal = this.fillCount ? this.fundingGoals[this.fillCount - 1].money : 0,
					hook = this.hook,
					fillWidth = Math.floor(hook.size.x * ((this.value - prevGoal) / (this.fundingGoals[this.fillCount].money - prevGoal) % 1));
				if (this.fadeTimer > 0) {
					prevGoal = this.fillCount % 2 ? 112 : 120;
					drawables.addGfx(this.gfx, 0, 0, 0, prevGoal, hook.size.x, hook.size.y).setAlpha(this.fadeTimer / 0.4)
				}
				prevGoal = this.fillCount % 2 ? 120 : 112;
				drawables.addGfx(this.gfx, 0, 0, 0, prevGoal, fillWidth, hook.size.y)
			}
		}
	});
	var goalIcon = {
			x: 160,
			y: 16
		},
		currentIcon = {
			x: 160,
			y: 24
		},
		reachedIcon = {
			x: 160,
			y: 32
		};
	sc.IndiegogoGoal = ig.BoxGui.extend({
		gfx: new ig.Image("media/gui/indiegogo.png"),
		ninepatch: new ig.NinePatch("media/gui/indiegogo.png", {
			width: 16,
			height: 8,
			left: 4,
			top: 4,
			right: 4,
			bottom: 4,
			offsets: {
				"default": {
					x: 160,
					y: 0
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			FADE_1: {
				state: {
					alpha: 0.9
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			FADE_2: {
				state: {
					alpha: 0.75
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			FADE_3: {
				state: {
					alpha: 0.5
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			FADE_4: {
				state: {
					alpha: 0.2
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
		},
		fade: 1,
		icon: null,
		init: function(text) {
			text = new sc.TextGui(text, {
				font: sc.fontsystem.tinyFont,
				maxWidth: 138
			});
			text.setPos(16, 2);
			this.parent(158, 4 + text.hook.size.y - 1, false);
			this.addChildGui(text);
			this.icon = new ig.ImageGui;
			this.icon.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
			this.icon.setPos(4, 0);
			this.addChildGui(this.icon);
			this.setGoalState(goalIcon);
			this.hook.localAlpha = 0.9
		},
		setGoalState: function(icon) {
			this.icon.setImage(this.gfx, icon.x, icon.y, 10, 8)
		}
	});
	sc.IndiegogoGoalList = ig.GuiElementBase.extend({
		goalGuis: [],
		viewAllMode: false,
		reachedGoal: 0,
		init: function() {
			this.parent();
			this.setSize(158, 0)
		},
		setData: function(goals) {
			this.removeAllChildren();
			for (var i = this.reachedGoal = this.goalGuis.length = 0; i < goals.length; ++i) {
				var goal = new sc.IndiegogoGoal(goals[i].text);
				this.goalGuis.push(goal);
				goal.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
				this.addChildGui(goal)
			}
			this.updateList()
		},
		updateList: function() {
			for (var i = this.goalGuis.length, y = 0; i--;) {
				var goal = this.goalGuis[i];
				goal.doPosTranstition(0, y, 0.2);
				var icon = goalIcon;
				i < this.reachedGoal ? icon = reachedIcon : i == this.reachedGoal && (icon = currentIcon);
				goal.setGoalState(icon);
				if (this.viewAllMode || i <= this.reachedGoal) y = y + (goal.hook.size.y + 1);
				icon = "DEFAULT";
				if (!this.viewAllMode)
					if (i > this.reachedGoal) icon = "HIDDEN";
					else if (i < this.reachedGoal - 5) {
					icon = this.reachedGoal - 5 - i;
					icon = icon > 4 ? "HIDDEN" : "FADE_" + icon
				}
				goal.doStateTransition(icon)
			}
		},
		setViewAll: function(viewAll) {
			if (this.viewAllMode != viewAll) {
				this.viewAllMode = viewAll;
				this.updateList()
			}
		},
		setReachedGoal: function(goal) {
			this.reachedGoal = goal;
			this.updateList()
		}
	})
});
ig.baked = !0;
