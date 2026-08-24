/**
 * @module game.feature.gui.hud.sp-hud
 * @description sc.SpHudGui: the animated SP bar above the player, drawn from
 *   filled/regen/removed segments with smooth transition animations.
 */
ig.module("game.feature.gui.hud.sp-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.numbers", "game.feature.combat.model.combat-params").defines(function() {
	function drawSegment(drawables, gfx, state, startIdx, regenIdx, isCurrent, showRegen) {
		var srcX = fullSrcX,
			srcY = segmentSrcY;
		isCurrent || (srcY = srcY + regenOffset);
		showRegen || (srcY = srcY + srcYOffset);
		isCurrent = innerWidth * 2 + barWidth * 4;
		showRegen = isCurrent - endCapWidth;
		if (startIdx != void 0) {
			srcX = srcX + (innerWidth + startIdx * barWidth);
			isCurrent = isCurrent - (innerWidth + startIdx * barWidth);
			showRegen = isCurrent - endCapWidth
		}
		if (regenIdx != void 0) showRegen = isCurrent = isCurrent - (innerWidth + (4 - regenIdx) * barWidth);
		drawables.addGfx(gfx, state.posX, 0, srcX, srcY, isCurrent, barHeight);
		state.posX = state.posX + showRegen
	}

	function drawPartial(drawables, gfx, state, currentSp, regenSp, transition, mode) {
		state.sp && state.sp % 4 == 0 && drawSegment(drawables, gfx, state, void 0, 0, mode != modeTypes.REMOVED, currentSp <= regenSp);
		var isOver = currentSp <= regenSp,
			totalHeight = 6,
			transition = KEY_SPLINES.EASE_IN_OUT.get(transition),
			totalHeight = Math.round(transition * totalHeight + (1 - transition) * 3),
			filledHeight = Math.floor(totalHeight * (currentSp - Math.floor(currentSp))),
			transition = 1 + filledHeight,
			filledHeight = 1 + totalHeight - filledHeight,
			srcX = partialBaseSrcX,
			srcY = partialBaseSrcY;
		if (mode == modeTypes.ADDED) {
			srcX = partialAddedSrcX;
			srcY = partialAddedSrcY
		} else if (mode == modeTypes.REMOVED) {
			srcX = partialAddedSrcX;
			srcY = partialAddedSrcY + 8
		} else isOver || (srcY = srcY + srcYOffset);
		drawables.addGfx(gfx, state.posX, 0, srcX, srcY, transition, barHeight);
		mode || (srcY = srcY + regenOffset);
		srcX = srcX + (secondSrcXOffset - filledHeight);
		drawables.addGfx(gfx, state.posX + transition, 0, srcX, srcY, filledHeight, barHeight);
		state.posX = state.posX + (totalHeight + 2);
		state.sp++;
		state.barFilled++;
		if (state.sp % 4 == 0) {
			drawSegment(drawables, gfx, state, 4, void 0, mode == modeTypes.ADDED, currentSp <= regenSp);
			state.barFilled = 0;
			state.regenFilled = (regenSp - state.sp).limit(0, 4)
		}
	}
	var barHeight = 7,
		barState = {
			sp: 0,
			posX: 0,
			barFilled: 0,
			regenFilled: 0
		};
	sc.SpHudGui = ig.GuiElementBase.extend({
		barHideTimer: 0,
		barShowTimer: 0,
		hideBack: false,
		targetSp: 0,
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					scaleY: 0
				},
				time: 0.1,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		gfx: new ig.Image("media/gui/status-gui.png"),
		init: function() {
			this.parent();
			this.setSize(142, barHeight);
			this.setPivot(71, 3);
			var params = sc.model.player.params;
			sc.Model.addObserver(params, this);
			sc.Model.addObserver(sc.model.player, this);
			params.maxSp == 0 && this.doStateTransition("HIDDEN", true)
		},
		update: function() {
			var currentSp = sc.model.player.params.currentSp,
				isPartial = this.targetSp != Math.floor(this.targetSp);
			if (currentSp > this.targetSp) {
				if (!this.hideBack && !isPartial) {
					this.hideBack = false;
					this.barShowTimer = 0.2
				}
				if (Math.floor(this.targetSp) < Math.floor(currentSp)) {
					this.hideBack = false;
					this.barHideTimer = 0.2;
					if (Math.floor(currentSp) < currentSp) this.barShowTimer = 0.2
				}
			} else if (currentSp < this.targetSp) {
				if (Math.floor(currentSp) == currentSp && isPartial) {
					this.hideBack = true;
					this.barHideTimer = 0.2
				}
				if (Math.floor(this.targetSp) > Math.floor(currentSp)) {
					this.hideBack = true;
					this.barShowTimer = 0.2;
					if (isPartial) this.barHideTimer = 0.2
				}
			}
			this.targetSp = currentSp;
			if (this.barShowTimer) {
				this.barShowTimer = this.barShowTimer - ig.system.actualTick;
				if (this.barShowTimer < 0) this.barShowTimer = 0
			}
			if (this.barHideTimer) {
				this.barHideTimer = this.barHideTimer - ig.system.actualTick;
				if (this.barHideTimer < 0) this.barHideTimer = 0
			}
		},
		updateDrawables: function(drawables) {
			var params = sc.model.player.params,
				maxSp = params.maxSp || 4,
				regenSp = maxSp * sc.SP_REGEN_FACTOR,
				params = params.currentSp,
				fullSp = Math.floor(params);
			drawables.addGfx(this.gfx, 0, 0, 0, 16, 19, barHeight);
			this.barHideTimer && !this.hideBack && (fullSp = Math.max(0, fullSp - 1));
			barState.posX = 19;
			barState.sp = 0;
			barState.barFilled = Math.min(4, fullSp);
			for (barState.regenFilled = Math.min(4, regenSp); barState.sp + 1 <= fullSp;) {
				var startIdx = barState.sp ? void 0 : 0;
				if (barState.barFilled == 4 && (barState.regenFilled == 4 || barState.regenFilled == 0)) drawSegment(drawables, this.gfx, barState, startIdx, void 0, true, barState.regenFilled == 4);
				else if (barState.regenFilled > 0 && barState.regenFilled < barState.barFilled) {
					var regenIdx = barState.barFilled == 4 ? void 0 : barState.barFilled;
					drawSegment(drawables, this.gfx, barState, startIdx, barState.regenFilled, true, true);
					drawSegment(drawables, this.gfx, barState, barState.regenFilled, regenIdx, true, false)
				} else drawSegment(drawables, this.gfx, barState, startIdx, barState.barFilled, true, barState.regenFilled > 0);
				barState.sp = barState.sp + barState.barFilled;
				if (barState.barFilled == 4) {
					barState.barFilled = Math.min(4, fullSp - barState.sp);
					barState.regenFilled = (regenSp - barState.sp).limit(0, 4)
				}
			}
			if (this.barHideTimer && !this.hideBack) {
				startIdx = this.barHideTimer / 0.2;
				drawPartial(drawables, this.gfx, barState, barState.sp - 0.001, regenSp, startIdx, modeTypes.ADDED);
				fullSp++
			}
			if (params - fullSp > 0) {
				startIdx = (0.2 - this.barShowTimer) / 0.2;
				drawPartial(drawables, this.gfx, barState, params, regenSp, startIdx)
			}
			if (this.barHideTimer && this.hideBack) {
				startIdx = this.barHideTimer / 0.2;
				drawPartial(drawables, this.gfx, barState, barState.sp + 1, regenSp, startIdx, modeTypes.REMOVED)
			}
			if (barState.sp == 0 || barState.sp % 4 != 0) {
				if (barState.regenFilled > barState.barFilled && barState.regenFilled < 4) {
					drawSegment(drawables, this.gfx, barState, barState.barFilled, barState.regenFilled, false, true);
					barState.barFilled = barState.regenFilled
				}
				drawSegment(drawables, this.gfx, barState, barState.barFilled, void 0, false, barState.regenFilled == 4);
				barState.sp = barState.sp == 0 ? 4 : Math.ceil(barState.sp / 4) * 4
			}
			for (; barState.sp < maxSp;) {
				barState.regenFilled = (regenSp - barState.sp).limit(0, 4);
				if (barState.regenFilled == 4 || barState.regenFilled == 0) drawSegment(drawables, this.gfx, barState, void 0, void 0, false, barState.regenFilled == 4);
				else {
					drawSegment(drawables, this.gfx, barState, void 0, barState.regenFilled, false, true);
					drawSegment(drawables, this.gfx, barState, barState.regenFilled, void 0, false, false)
				}
				barState.sp = barState.sp + 4
			}
		},
		modelChanged: function(model, msg) {
			if (model == sc.model.player.params) {
				if (msg == sc.COMBAT_PARAM_MSG.MAX_SP_CHANGED)
					if (sc.model.player.params.maxSp == 0) {
						this.doStateTransition("HIDDEN");
						this.targetSp = 0
					} else this.doStateTransition("DEFAULT")
			} else model == sc.model.player && msg == sc.PLAYER_MSG.CORE_CHANGED && (sc.model.player.getCore(sc.PLAYER_CORE.SPECIAL) ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN"))
		}
	});
	var fullSrcX = 96,
		segmentSrcY = 0,
		partialAddedSrcX = 40,
		partialAddedSrcY = 16,
		innerWidth = 8,
		barWidth = 5,
		endCapWidth = 6,
		partialBaseSrcX = 68,
		partialBaseSrcY = 0,
		secondSrcXOffset = 26,
		regenOffset = 16,
		srcYOffset = 8,
		modeTypes = {
			NONE: 0,
			ADDED: 1,
			REMOVED: 2
		}
});
ig.baked = !0;
