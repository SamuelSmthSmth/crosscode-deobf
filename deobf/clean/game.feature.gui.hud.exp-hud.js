/**
 * @module game.feature.gui.hud.exp-hud
 * @description sc.ExpHudGui: the floating EXP gain entries that appear next to
 *   the player and merge into a single sum, plus the EXP counter shown in the
 *   menu (sc.ExpMenuGui).
 */
ig.module("game.feature.gui.hud.exp-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.numbers").defines(function() {
	sc.ExpEntryGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0,
					offsetX: 16
				},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			},
			MERGE: {
				state: {
					alpha: 0,
					offsetX: -32
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN_OUT
			}
		},
		number: null,
		exp: 0,
		withLabel: false,
		init: function(withLabel, exp) {
			this.parent();
			this.withLabel = withLabel;
			this.number = new sc.NumberGui(0, {
				size: sc.NUMBER_SIZE.TINY,
				transitionTime: 0.3
			});
			this.number.setPos(withLabel ? 36 : 13, 1);
			this.addChildGui(this.number);
			this.setExp(exp || 0);
			this.hook.size.y = 7
		},
		setExp: function(exp) {
			this.number.setNumber(exp);
			this.hook.size.x = this.number.hook.size.x + (this.withLabel ? 36 : 13) + 6;
			this.exp = exp
		},
		updateDrawables: function(drawables) {
			var labelWidth = this.withLabel ? 36 : 13,
				height = this.hook.size.y;
			drawables.addGfx(this.gfx, 0, 0, this.withLabel ? 0 : 40, 32, labelWidth, height);
			drawables.addColor("black", labelWidth, 0, this.hook.size.x - 6 - labelWidth, height);
			drawables.addGfx(this.gfx, this.hook.size.x - 6, 0, 53, 32, 6, height)
		}
	});
	sc.ExpMenuGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		transitions: {
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
		},
		_expNumber: null,
		init: function() {
			this.parent();
			this.hook.size.x = 88;
			this.hook.size.y = 7;
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.model.player, this);
			sc.Model.addObserver(sc.model.menu, this);
			this._expNumber = new sc.NumberGui(1E3, {
				signed: true,
				size: sc.NUMBER_SIZE.TINY
			});
			this._expNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this._expNumber.setPos(35, 1);
			this._expNumber.setNumber(sc.model.player.exp, true);
			this.addChildGui(this._expNumber);
			this.doStateTransition("HIDDEN", true)
		},
		updateDrawables: function(drawables) {
			drawables.addGfx(this.gfx, 0, 0, 0, 182, 88, 7)
		},
		modelChanged: function(model, msg) {
			if (model == sc.model) {
				if (msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED) {
					var isMenu = model.isMenu();
					this._expNumber.setNumber(sc.model.player.exp);
					this.doStateTransition(isMenu ? "DEFAULT" : "HIDDEN")
				}
			} else if (model == sc.menu && (msg == sc.MENU_EVENT.ENTER_MENU || msg == sc.MENU_EVENT.LEAVE_MENU)) switch (model.currentMenu) {
				case sc.MENU_SUBMENU.START:
					this.doStateTransition("DEFAULT");
					break;
				case sc.MENU_SUBMENU.EQUIPMENT:
					this.doStateTransition("HIDDEN")
			}
		}
	});
	sc.ExpHudGui = ig.GuiElementBase.extend({
		baseEntry: null,
		menuEntry: null,
		timer: 0,
		expSum: 0,
		expAddEntries: [],
		init: function() {
			this.parent();
			this.baseEntry = new sc.ExpEntryGui(true);
			this.baseEntry.doStateTransition("HIDDEN", true);
			this.addChildGui(this.baseEntry);
			this.menuEntry = new sc.ExpMenuGui;
			this.addChildGui(this.menuEntry);
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.model.player, this)
		},
		update: function() {
			if (this.timer > 0) {
				this.timer = this.timer - ig.system.actualTick;
				if (this.timer <= 0)
					if (this.expAddEntries.length > 0) {
						this.mergeExpEntry();
						this.timer = this.expAddEntries.length ? 1 : 5
					} else {
						this.expSum = 0;
						this.baseEntry.doStateTransition("HIDDEN")
					}
			}
		},
		addExp: function(exp) {
			if (this.expSum) {
				exp = new sc.ExpEntryGui(false, exp);
				exp.doStateTransition("HIDDEN", true);
				exp.doStateTransition("DEFAULT");
				this.expAddEntries.push(exp);
				this.insertChildGui(exp, Math.max(this.hook.children.length - 2, 0));
				this.timer = 2
			} else {
				this.expSum = exp;
				this.baseEntry.doStateTransition("DEFAULT");
				this.baseEntry.setExp(exp);
				this.timer = 5
			}
			this.expAddEntries.length > 3 ? this.mergeExpEntry() : this.reorder()
		},
		mergeExpEntry: function() {
			var entry = this.expAddEntries.shift();
			this.expSum = this.expSum + entry.exp;
			this.baseEntry.setExp(this.expSum);
			entry.doStateTransition("MERGE", false, true);
			this.reorder()
		},
		mergeAllEntries: function() {
			for (; this.expAddEntries.length > 0;) this.mergeExpEntry()
		},
		reorder: function() {
			for (var x = this.baseEntry.hook.size.x, i = 0; i < this.expAddEntries.length; ++i) {
				x = x + -3;
				this.expAddEntries[i].doPosTranstition(x, 0, 0.3, KEY_SPLINES.EASE_IN_OUT);
				x = x + this.expAddEntries[i].hook.size.x
			}
		},
		modelChanged: function(model, msg, data) {
			if (model == sc.model.player)
				if (msg == sc.PLAYER_MSG.EXP_CHANGE) this.addExp(data);
				else {
					if (msg == sc.PLAYER_MSG.RESET_PLAYER) {
						this.mergeAllEntries();
						this.timer = this.expSum = 0;
						this.baseEntry.setExp(0);
						this.menuEntry._expNumber.setNumber(0);
						this.baseEntry.doStateTransition("HIDDEN")
					}
				}
			else if (model == sc.model && msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && model.isMenu()) {
				this.mergeAllEntries();
				this.expSum = 0;
				this.baseEntry.doStateTransition("HIDDEN")
			}
		}
	})
});
ig.baked = !0;
