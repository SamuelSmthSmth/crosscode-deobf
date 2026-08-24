/**
 * @module game.feature.gui.hud.element-hud
 * @description sc.ElementHudGui: the element selector popup around the player
 *   (heat/cold/shock/wave) plus per-element icons.
 */
ig.module("game.feature.gui.hud.element-hud").requires("impact.feature.gui.gui", "game.feature.combat.model.combat-params", "game.feature.model.options-model").defines(function() {
	var elements = [sc.ELEMENT.HEAT, sc.ELEMENT.COLD, sc.ELEMENT.SHOCK, sc.ELEMENT.WAVE],
		center = Vec2.createC(0, 0);
	sc.ElementHudGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					alpha: 0
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		timer: 0,
		icons: [],
		init: function() {
			this.parent();
			this.setSize(64, 64);
			this.hook.zIndex = 1181;
			this.hook.pauseGui = true;
			for (var i = 0; i < elements.length; ++i) {
				var icon = new sc.ElementHudIconGui(iconDirs[elements[i]]);
				this.icons.push(icon);
				this.addChildGui(icon)
			}
			this.doStateTransition("HIDDEN", true);
			sc.Model.addObserver(sc.model.player, this)
		},
		modelChanged: function(model, msg) {
			msg == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE && sc.options.get("element-select")
		},
		showElement: function(element) {
			for (var i = 0; i < elements.length; ++i) this.icons[i].show(element, element == elements[i]);
			this.timer = 0.5;
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			for (var i = 0; i < elements.length; ++i) this.icons[i].hide();
			this.doStateTransition("HIDDEN")
		},
		update: function() {
			if (this.timer) {
				this.timer = this.timer - ig.system.actualTick;
				this.timer <= 0 && this.hide()
			}
			this._updatePos(true)
		},
		_updatePos: function() {
			var player = ig.game.playerEntity;
			if (player) {
				player = player.coll;
				ig.system.getScreenFromMapPos(center, Math.round(player.pos.x + player.size.x / 2), Math.round(player.pos.y - player.pos.z - player.size.z / 2 + player.size.y / 2));
				this.hook.pos.x = center.x - this.hook.size.x / 2;
				this.hook.pos.y = center.y - this.hook.size.y / 2
			}
		}
	});
	var coldDir = {
			alignX: ig.GUI_ALIGN.X_CENTER,
			alignY: ig.GUI_ALIGN.Y_TOP,
			tile: 0,
			rotate: 0,
			pShowX: 16,
			pShowY: 32,
			pHideX: 16,
			pHideY: 0
		},
		shockDir = {
			alignX: ig.GUI_ALIGN.X_RIGHT,
			alignY: ig.GUI_ALIGN.Y_CENTER,
			tile: 1,
			rotate: 0.25,
			pShowX: 0,
			pShowY: 16,
			pHideX: 32,
			pHideY: 16
		},
		waveDir = {
			alignX: ig.GUI_ALIGN.X_LEFT,
			alignY: ig.GUI_ALIGN.Y_CENTER,
			tile: 3,
			rotate: 0.75,
			pShowX: 32,
			pShowY: 16,
			pHideX: 0,
			pHideY: 16
		},
		iconDirs = {};
	iconDirs[sc.ELEMENT.HEAT] = {
		alignX: ig.GUI_ALIGN.X_CENTER,
		alignY: ig.GUI_ALIGN.Y_BOTTOM,
		tile: 2,
		rotate: 0.5,
		pShowX: 16,
		pShowY: 0,
		pHideX: 16,
		pHideY: 32
	};
	iconDirs[sc.ELEMENT.COLD] = coldDir;
	iconDirs[sc.ELEMENT.SHOCK] = shockDir;
	iconDirs[sc.ELEMENT.WAVE] = waveDir;
	sc.ElementHudIconGui = ig.GuiElementBase.extend({
		transitions: {
			DEFAULT: {
				state: {},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_OUT
			},
			HIDDEN: {
				state: {
					scaleX: 0,
					scaleY: 0
				},
				time: 0.15,
				timeFunction: KEY_SPLINES.EASE_IN
			}
		},
		gfx: new ig.Image("media/gui/status-gui.png"),
		iconDir: null,
		currentElement: 0,
		bigSize: false,
		init: function(iconDir) {
			this.parent();
			this.iconDir = iconDir;
			this.setSize(32, 32);
			this.setAlign(iconDir.alignX, iconDir.alignY);
			this.doStateTransition("HIDDEN", true)
		},
		show: function(element, big) {
			this.currentElement = element;
			this.bigSize = big;
			element != sc.ELEMENT.NEUTRAL ? this.setPivot(this.iconDir.pShowX, this.iconDir.pShowY) : this.setPivot(this.iconDir.pHideX, this.iconDir.pHideY);
			this.doStateTransition("HIDDEN", true);
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.currentElement != sc.ELEMENT.NEUTRAL ? this.setPivot(this.iconDir.pHideX, this.iconDir.pHideY) : this.setPivot(this.iconDir.pShowX, this.iconDir.pShowY);
			this.doStateTransition("HIDDEN")
		},
		updateDrawables: function(drawables) {
			!this.bigSize && this.iconDir.rotate && drawables.addTransform().setPivot(16, 16).setRotate(this.iconDir.rotate * 2 * Math.PI);
			var dir = iconDirs[this.currentElement],
				srcX, srcY, offsetX = 0,
				size;
			if (this.bigSize) {
				srcX = 128 + dir.tile * 32;
				srcY = 224;
				size = 32
			} else {
				srcX = dir ? 136 + (1 + dir.tile) * 24 : 136;
				srcY = 200;
				size = 24;
				offsetX = 4
			}
			drawables.addGfx(this.gfx, offsetX, 0, srcX, srcY, size, size);
			!this.bigSize && this.iconDir.rotate && drawables.undoTransform()
		}
	})
});
ig.baked = !0;
