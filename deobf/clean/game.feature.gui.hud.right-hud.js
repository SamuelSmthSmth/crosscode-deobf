/**
 * @module game.feature.gui.hud.right-hud
 * @description sc.RightHudGui: the container that stacks all right-side HUD
 *   boxes (tasks, money, lore, drops, ...) top-to-bottom, plus the base
 *   class sc.RightHudBoxGui for individual boxes.
 */
ig.module("game.feature.gui.hud.right-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image", "game.feature.gui.base.boxes").defines(function() {
	sc.RightHudGui = ig.GuiElementBase.extend({
		taskTitle: null,
		maxCount: 0,
		currentCount: 0,
		variable: null,
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_IN
			},
			HALF: {
				state: {
					scaleX: 0.5,
					scaleY: 0.5,
					offsetX: -1
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.EASE_OUT
			}
		},
		boxes: [],
		doReorder: false,
		init: function() {
			this.parent();
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.hook.zIndex = 101;
			this.hook.pauseGui = true;
			sc.Model.addObserver(sc.model, this);
			sc.Model.addObserver(sc.options, this);
			this.updateSize()
		},
		update: function() {
			if (this.doReorder) {
				this.doReorder = false;
				for (var y = 4, i = 0; i < this.boxes.length; ++i) {
					if (!this.boxes[i].hidden) {
						this.boxes[i].justAdded ? this.boxes[i].setPos(0, y) : this.boxes[i].doPosTranstition(0, y, 0.3, KEY_SPLINES.EASE_OUT);
						y = y + (this.boxes[i].hook.size.y + 8)
					}
					this.boxes[i].justAdded = false
				}
			}
		},
		addHudBox: function(box, index) {
			box.parentPanel = this;
			box.justAdded = true;
			box.hook.align.x = ig.GUI_ALIGN.X_RIGHT;
			this.boxes.erase(box);
			if (index === void 0) {
				this.boxes.push(box);
				this.addChildGui(box)
			} else {
				this.boxes.splice(index, 0, box);
				this.insertChildGui(box, index)
			}
			this.reorder()
		},
		addHudBoxBefore: function(box, reference) {
			var index = this.getChildGuiIndex(reference);
			this.addHudBox(box, index == -1 ? void 0 : index)
		},
		removeHudBox: function(box) {
			box.parentPanel = null;
			this.boxes.erase(box);
			this.reorder()
		},
		reorder: function() {
			this.doReorder = true
		},
		modelChanged: function(model, msg) {
			if (model == sc.model) {
				var isCombat = sc.model.isCombatMode(),
					isCutscene = sc.model.isCutscene();
				this.doPosTranstition(0, isCutscene ? 21 : isCombat ? 16 : 0, 0.2, KEY_SPLINES.EASE_IN_OUT, !isCombat && !isCutscene ? 0.5 : 0)
			} else model == sc.options && msg == sc.OPTIONS_EVENT.OPTION_CHANGED && this.updateSize()
		},
		updateSize: function() {
			sc.options.get("pixel-size") == sc.PIXEL_SIZE.ONE ? this.doStateTransition("DEFAULT", true) : sc.options.get("min-sidebar") ? this.doStateTransition("HALF", true) : this.doStateTransition("DEFAULT", true)
		}
	});
	sc.RightHudBoxGui = sc.SideBoxGui.extend({
		hidden: true,
		justAdded: false,
		parentPanel: null,
		init: function(title) {
			this.parent(true, title);
			this.doStateTransition("HIDDEN", true)
		},
		show: function(instant, allowPause) {
			this.parent(instant, allowPause);
			if (this.hidden) this.justAdded = true;
			this.hidden = false;
			this.parentPanel && this.parentPanel.reorder()
		},
		hide: function(instant, allowPause) {
			this.parent(instant, allowPause);
			this.hidden = true;
			this.parentPanel && this.parentPanel.reorder()
		},
		remove: function() {
			this.parent();
			this.parentPanel && this.parentPanel.removeHudBox(this)
		}
	})
});
ig.baked = !0;
