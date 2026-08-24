/**
 * @module game.feature.gui.hud.sp-change-hud
 * @description sc.SpChangeHudGui: the SP gain/consume popup above the player,
 *   showing the SP bar segment that was gained or consumed.
 */
ig.module("game.feature.gui.hud.sp-change-hud").requires("impact.feature.gui.gui", "game.feature.combat.model.combat-params", "game.feature.model.options-model").defines(function() {
	var center = Vec2.createC(0, 0),
		smallPiece = {
			w: 10,
			x: 4,
			start: 2,
			end: 2
		},
		bigPiece = {
			w: 18,
			x: 14,
			start: 2,
			end: 0
		};
	sc.SpChangeHudGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			BIG: {
				state: {
					scaleY: 2,
					scaleX: 2
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE_IN
			},
			HIDDEN: {
				state: {
					scaleY: 0,
					scaleX: 1.5
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		gfx: new ig.Image("media/gui/status-gui.png"),
		currentSp: 0,
		consumedSp: 0,
		timer: 0,
		init: function() {
			this.parent();
			this.setSize(100, 7);
			this.setPivot(50, 3.5);
			this.zIndex = 10;
			this.doStateTransition("HIDDEN", true);
			sc.Model.addObserver(sc.model.player.params, this)
		},
		modelChanged: function(model, msg, data) {
			if (sc.model.isCutscene()) this.hide();
			else if (sc.model.player.getCore(sc.PLAYER_CORE.SPECIAL) && !ig.vars.get("playerVar.statusHidden") && sc.options.get("sp-bar"))
				if (msg == sc.COMBAT_PARAM_MSG.SP_CHANGED) {
					model = sc.model.player.params.getSp();
					if (data && this.currentSp < model) {
						this.timer = 1;
						this._updatePos(true);
						this.doStateTransition("BIG", true);
						this.doStateTransition("DEFAULT")
					}
					this.currentSp = model
				} else if (msg == sc.COMBAT_PARAM_MSG.SP_CONSUME)
				if (this.consumedSp = data) {
					this.timer = -1;
					this._updatePos(true);
					this.doStateTransition("BIG", true);
					this.doStateTransition("DEFAULT")
				} else {
					this.timer = 0;
					this.hide()
				}
		},
		hide: function() {
			this.doStateTransition("HIDDEN")
		},
		update: function() {
			if (this.timer > 0) {
				this.timer = this.timer - ig.system.actualTick;
				if (this.timer <= 0) {
					this.timer = 0;
					this.hide()
				}
			}
			this._updatePos(true)
		},
		updateDrawables: function(drawables) {
			var params = sc.model.player.params,
				maxSp = params.maxSp,
				params = params.getSp(),
				consumed = params - this.consumedSp,
				hook = this.hook,
				maxSp = Math.max(4, Math.ceil(params / 4) * 4),
				width = 8 + bigPiece.w;
			maxSp > 4 && (width = width + (Math.floor(maxSp / 4) - 1) * smallPiece.w);
			width = Math.floor((hook.size.x - width) / 2);
			hook = hook.size.y;
			drawables.addGfx(this.gfx, width, 0, 152, 128, 4, hook);
			for (var x = width + 4, i = 0; i < maxSp;) {
				var isPartial = i < params && params - i <= 4;
				i == 0 && params == 0 && (isPartial = true);
				var piece = isPartial ? bigPiece : smallPiece,
					consumedFactor = ((consumed - i) / 4).limit(0, 1),
					currentFactor = ((params - i) / 4).limit(0, 1),
					inner = piece.w - piece.start - piece.end,
					consumedFactor = Math.floor(consumedFactor * inner),
					currentFactor = Math.floor(currentFactor * inner) - consumedFactor,
					inner = inner - consumedFactor - currentFactor;
				consumedFactor ? consumedFactor = consumedFactor + piece.start : currentFactor ? currentFactor = currentFactor + piece.start : inner = inner + piece.start;
				inner ? inner = inner + piece.end : currentFactor ? currentFactor = currentFactor + piece.end : consumedFactor = consumedFactor + piece.end;
				var offset = 0;
				if (consumedFactor) {
					drawables.addGfx(this.gfx, x, 0, 152 + piece.x + offset, 128, consumedFactor, hook);
					x = x + consumedFactor;
					offset = offset + consumedFactor
				}
				if (currentFactor) {
					drawables.addGfx(this.gfx, x, 0, 152 + piece.x + offset, 136, currentFactor, hook);
					x = x + currentFactor;
					offset = offset + currentFactor
				}
				if (inner) {
					drawables.addGfx(this.gfx, x, 0, 152 + piece.x + offset, 144, inner, hook);
					x = x + inner
				}
				i = i + 4
			}
			drawables.addGfx(this.gfx, x, 0, 184, 128, 4, hook)
		},
		_updatePos: function() {
			var player = ig.game.playerEntity;
			if (player) {
				var hook = this.hook,
					pos = player.getCenter(center);
				ig.system.getScreenFromMapPos(center, Math.round(pos.x), Math.round(pos.y - player.coll.pos.z + player.coll.size.y / 2));
				this.hook.pos.x = center.x - hook.size.x / 2;
				this.hook.pos.y = center.y - hook.size.y / 2
			}
		}
	})
});
ig.baked = !0;
