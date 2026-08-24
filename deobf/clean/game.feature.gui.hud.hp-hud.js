/**
 * @module game.feature.gui.hud.hp-hud
 * @description sc.HpHudGui: the HP box above the player (number, bar, CRITICAL
 *   flash) and sc.HpHudBarGui: the animated HP/EXP bar.
 */
ig.module("game.feature.gui.hud.hp-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.numbers", "game.feature.model.options-model").defines(function() {
	sc.HpHudGui = ig.GuiElementBase.extend({
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
		gfx: new ig.Image("media/gui/status-gui.png"),
		criticalText: null,
		hpNumber: null,
		hpBar: null,
		critical: false,
		criticalTimer: 0,
		init: function(showOnStart) {
			this.parent();
			this.setSize(68, 16);
			this.setPivot(36, 16);
			this.hpNumber = new sc.NumberGui(9999, {
				signed: true,
				transitionTime: 0.5
			});
			this.hpNumber.setPos(12, 1);
			this.addChildGui(this.hpNumber);
			this.criticalText = new sc.TextGui("\\c[1]CRITICAL", {
				font: sc.fontsystem.tinyFont
			});
			this.criticalText.setPos(20, 0);
			this.addChildGui(this.criticalText);
			this.criticalText.hook.localAlpha = 0;
			showOnStart = sc.model.player.params;
			this.hpBar = new sc.HpHudBarGui(showOnStart, 48, 3);
			this.hpBar.setPos(12, 9);
			this.addChildGui(this.hpBar);
			sc.Model.addObserver(showOnStart, this);
			sc.Model.addObserver(sc.model.player, this);
			sc.Model.addObserver(sc.options, this);
			this.hpNumber.setNumber(showOnStart.currentHp, true)
		},
		update: function() {
			if (this.critical) {
				this.hpNumber.hook.localAlpha = 0;
				this.criticalTimer = this.criticalTimer - ig.system.actualTick;
				if (this.criticalTimer <= 0) this.criticalTimer = 0.1;
				this.criticalText.hook.localAlpha = this.criticalTimer < 0.05 ? 0 : 1
			} else {
				this.hpNumber.hook.localAlpha = 1;
				this.criticalTimer = this.criticalText.hook.localAlpha = 0
			}
			var expRatio = sc.model.player.hasLevelUp() ? 1 : (sc.model.player.exp / sc.EXP_PER_LEVEL).limit(0, 1);
			this.hpBar.setExpRatio(expRatio)
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 0, 0, this.hook.size.x, this.hook.size.y)
		},
		modelChanged: function(model, msg) {
			if (model == sc.model.player.params) {
				var hp = Math.max(0, model.currentHp);
				msg == sc.COMBAT_PARAM_MSG.HP_CHANGED ? this.hpNumber.setNumber(hp) : msg == sc.COMBAT_PARAM_MSG.STATS_CHANGED ? this.hpNumber.setNumber(hp, !this.hook._visible) : msg == sc.COMBAT_PARAM_MSG.RESET_STATS && this.hpNumber.setNumber(hp, true);
				if (msg == sc.COMBAT_PARAM_MSG.HP_CHANGED || msg == sc.COMBAT_PARAM_MSG.STATS_CHANGED)
					if (model.getHpFactor() <= sc.HP_LOW_WARNING) {
						this.hpNumber.setColor(sc.GUI_NUMBER_COLOR.RED);
						sc.options.get("low-health-warning") && ig.overlay.setCorner("RED", 1, 0.4, 0.5)
					} else {
						this.hpNumber.setColor(sc.GUI_NUMBER_COLOR.WHITE);
						sc.options.get("low-health-warning") && ig.overlay.setCorner("RED", 0, 0.4)
					} this.critical = model.currentHp <= 0 && !model.defeated
			} else if (model == sc.model.player) {
				if (msg == sc.PLAYER_MSG.SET_PARAMS || msg == sc.PLAYER_MSG.CONFIG_CHANGED) {
					hp = sc.model.player.params;
					this.hpNumber.setNumber(Math.max(0, hp.currentHp), true);
					this.hpBar.resetHp();
					this.critical = hp.currentHp <= 0 && !hp.defeated
				}
			} else model == sc.options && msg == sc.OPTIONS_EVENT.OPTION_CHANGED && (this.targetHp / this.maxHp <= sc.HP_LOW_WARNING ? sc.options.get("low-health-warning") ? ig.overlay.setCorner("RED", 1, 0.4, 0.5) : ig.overlay.setCorner("RED", 0, 0.4) : ig.overlay.setCorner("RED", 0, 0.4))
		}
	});
	sc.HpHudBarGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		maxHp: 0,
		currentHp: 0,
		targetHp: 0,
		timer: 0,
		expTimer: 0,
		params: null,
		width: 0,
		height: 0,
		expRatio: 0,
		init: function(params, width, height) {
			this.parent();
			this.params = params;
			this.width = width || 48;
			this.height = height || 3;
			this.maxHp = params.getStat("hp");
			this.currentHp = this.targetHp = params.currentHp
		},
		onAttach: function() {
			sc.Model.addObserver(this.params, this)
		},
		onDetach: function() {
			sc.Model.removeObserver(this.params, this)
		},
		update: function() {
			if (this.targetHp < 0) {
				this.currentHp = -1;
				this.timer = (this.timer + ig.system.actualTick) % 0.2
			} else if (this.timer > 0) this.timer = this.timer - ig.system.actualTick;
			else if (this.targetHp != this.currentHp) {
				var speed = ig.system.actualTick * this.maxHp / 2;
				if (this.currentHp > this.targetHp) this.currentHp = Math.max(this.targetHp, this.currentHp - speed);
				else if (this.currentHp < this.targetHp) this.currentHp = Math.min(this.targetHp, this.currentHp + speed)
			}
			if (this.expRatio >= 1) this.expTimer = (this.expTimer + ig.system.actualTick) % 0.2
		},
		setExpRatio: function(ratio) {
			this.expRatio = ratio
		},
		resetHp: function() {
			this.maxHp = this.params.getStat("hp");
			this.currentHp = this.targetHp = this.params.currentHp
		},
		updateDrawables: function(drawables) {
			var currentRatio, targetRatio, srcY, srcY2, alpha = 1;
			if (this.targetHp > 0) {
				if (this.targetHp < this.currentHp) {
					targetRatio = this.currentHp / this.maxHp;
					currentRatio = this.targetHp / this.maxHp;
					srcY2 = 49
				} else {
					targetRatio = this.targetHp / this.maxHp;
					currentRatio = this.currentHp / this.maxHp;
					srcY2 = 51
				}
				srcY = currentRatio > sc.HP_LOW_WARNING ? 48 : 50
			} else {
				currentRatio = 1;
				srcY = 50;
				alpha = this.timer / 0.2;
				alpha = (alpha < 0.5 ? alpha : 1 - alpha) * 2
			}
			for (var y = 0; y < this.height; y++) {
				targetRatio && this.targetHp != this.currentHp && drawables.addGfx(this.gfx, y, y, 0, srcY2, targetRatio.limit(0, 1) * this.width, 1).setAlpha(alpha);
				currentRatio > 0 && drawables.addGfx(this.gfx, y, y, 0, srcY, currentRatio.limit(0, 1) * this.width, 1).setAlpha(alpha)
			}
			currentRatio = this.expTimer > 0.1;
			targetRatio = this.expRatio;
			srcY = this.expRatio >= 1;
			targetRatio && drawables.addGfx(this.gfx, this.height + 1, this.height + 1, 0, 48 + (srcY && currentRatio ? 6 : 4), targetRatio.limit(0, 1) * this.width, 1)
		},
		modelChanged: function(model, msg) {
			if (msg == sc.COMBAT_PARAM_MSG.HP_CHANGED) {
				this.timer = 0.5;
				if ((this.targetHp - this.currentHp) * (model.currentHp - this.targetHp) < 0) this.currentHp = this.targetHp;
				this.targetHp = model.currentHp;
				this.maxHp = model.getStat("hp")
			} else if (msg == sc.COMBAT_PARAM_MSG.STATS_CHANGED) {
				this.maxHp = model.getStat("hp");
				this.targetHp = model.currentHp;
				this.currentHp = this.currentHp - (this.targetHp - model.currentHp)
			} else if (msg == sc.COMBAT_PARAM_MSG.RESET_STATS) {
				this.maxHp = model.getStat("hp");
				this.currentHp = this.targetHp = model.currentHp
			}
			if (this.currentHp < -1) this.currentHp = -1
		}
	})
});
ig.baked = !0;
