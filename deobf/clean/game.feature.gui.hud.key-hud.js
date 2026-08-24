/**
 * @module game.feature.gui.hud.key-hud
 * @description sc.KeyHudGui: the dungeon key / master key counter shown in
 *   the HUD while inside a dungeon.
 */
ig.module("game.feature.gui.hud.key-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.menu.map-model").defines(function() {
	sc.KeyHudGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/status-gui.png"),
		ninepatch: new ig.NinePatch("media/gui/status-gui.png", {
			width: 6,
			height: 0,
			left: 0,
			top: 11,
			right: 10,
			bottom: 0,
			offsets: {
				"default": {
					x: 128,
					y: 128
				},
				master: {
					x: 128,
					y: 140
				}
			}
		}),
		transitions: {
			DEFAULT: {
				state: {},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			},
			HIDDEN: {
				state: {
					alpha: 0,
					scaleY: 0
				},
				time: 0,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		areaItemType: sc.AREA_ITEM_TYPE.DUNGEON_KEY,
		areaItemTypeMaster: sc.AREA_ITEM_TYPE.DUNGEON_MASTER_KEY,
		numberGui: null,
		hasMaster: false,
		init: function() {
			this.parent();
			this.numberGui = new sc.NumberGui(9, {});
			this.numberGui.setNumber(0);
			this.numberGui.setPos(11, 2);
			this.addChildGui(this.numberGui);
			this.doStateTransition("HIDDEN");
			this.setSize(28, 11);
			sc.Model.addObserver(sc.model.player, this);
			sc.Model.addObserver(sc.model, this);
			this.hook.localAlpha = 0.8
		},
		updateDrawables: function(drawables) {
			this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, this.hasMaster ? "master" : "default");
			drawables.addGfx(this.gfx, 1, 0, 144, this.hasMaster ? 140 : 128, 8, 11)
		},
		modelChanged: function(model, msg) {
			model == sc.model ? msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && sc.model.isRunning() && this.updateVisibility() : model == sc.model.player && (msg == sc.PLAYER_MSG.ITEM_OBTAINED || msg == sc.PLAYER_MSG.ITEM_REMOVED) && this.updateItemCount()
		},
		updateVisibility: function() {
			var visible = sc.map.getAreaItemId(this.areaItemType) != -1;
			sc.map.isDungeon() || (visible = false);
			this.doStateTransition(visible ? "DEFAULT" : "HIDDEN");
			this.updateItemCount()
		},
		updateItemCount: function() {
			var count = sc.map.getAreaItemAmount(this.areaItemType);
			this.hasMaster = sc.map.getAreaItemAmount(this.areaItemTypeMaster) > 0;
			this.numberGui.setNumber(count + (this.hasMaster ? 1 : 0))
		}
	})
});
ig.baked = !0;
