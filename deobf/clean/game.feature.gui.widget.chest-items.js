/**
 * @module game.feature.gui.widget.chest-items
 * @description sc.ItemGuiLayer: the burst of item icons that fly out of a
 *   chest when opened (sc.ItemGui per icon, scattering on a curve).
 */
ig.module("game.feature.gui.widget.chest-items").requires("impact.base.image", "impact.feature.gui.gui", "game.feature.inventory.inventory").defines(function() {
	var center = Vec2.createC(),
		dir = Vec2.createC(),
		target = Vec2.createC(),
		scatterAngles = [0, 30, -30, 45, -45, 15, -15];
	sc.ItemGui = ig.GuiElementBase.extend({
		transitions: {
			HIDDEN: {
				state: {
					scaleX: 0,
					scaleY: 0,
					angle: -(Math.PI / 2)
				},
				time: 0.3,
				timeFunction: KEY_SPLINES.LINEAR
			},
			DEFAULT: {
				state: {},
				time: 0.2,
				timeFunction: KEY_SPLINES.LINEAR
			},
			END: {
				state: {
					alpha: 0
				},
				time: 0.5,
				timeFunction: KEY_SPLINES.LINEAR
			}
		},
		icon: null,
		timer: 0,
		target: null,
		moveTimer: 0.4,
		moveTime: 0.4,
		diff: Vec2.create(0, 0),
		init: function(target, iconString, startPos, endPos, delay) {
			this.parent();
			this.setSize(14, 16);
			this.setPivot(7, 8);
			this.setPos(startPos.x, startPos.y);
			this.diff.x = endPos.x - startPos.x;
			this.diff.y = endPos.y - startPos.y;
			this.target = target;
			this.icon = new ig.TextBlock(sc.fontsystem.font, "\\i[" + iconString + "]", {
				speed: ig.TextBlock.SPEED.IMMEDIATE
			});
			this.doStateTransition("HIDDEN", true);
			this.start(endPos, delay)
		},
		start: function(endPos, delay) {
			this.doStateTransition("DEFAULT", false, false, null, delay);
			this.timer = 1;
			this.moveTime = 0.4;
			this.moveTimer = 0
		},
		update: function() {
			if (this.timer > 0) {
				this.timer = this.timer - ig.system.actualTick;
				this.timer <= 0 && this.doStateTransition("END", false, true)
			}
			var hook = this.hook,
				coll = this.target.coll;
			ig.system.getScreenFromMapPos(center, Math.round(coll.pos.x + coll.size.x / 2), Math.round(coll.pos.y - coll.pos.z - coll.size.z / 2 + coll.size.y / 2));
			hook.pos.x = center.x - hook.size.x / 2;
			hook.pos.y = center.y - hook.size.y / 2;
			if (this.moveTimer < this.moveTime) {
				this.moveTimer = this.moveTimer + ig.system.actualTick;
				if (this.moveTimer >= this.moveTime) this.moveTimer = this.moveTime
			}
			coll = Math.min(1, Math.max(0, this.moveTimer) / this.moveTime);
			coll = KEY_SPLINES.EASE_OUT.get(coll);
			hook.pos.x = hook.pos.x + this.diff.x * coll;
			hook.pos.y = hook.pos.y + this.diff.y * coll
		},
		updateDrawables: function(drawables) {
			drawables.addDraw().setText(this.icon, 0, 0)
		}
	});
	sc.ItemGuiLayer = ig.GuiElementBase.extend({
		init: function() {
			this.parent();
			this.setSize(ig.system.width, ig.system.height);
			this.hook.zIndex = 5
		},
		addItem: function(target, iconString, count) {
			var angle = null,
				angle = -1E6,
				angle = angle = 0,
				iconString = sc.inventory.getItem(iconString),
				iconString = (iconString.icon || "item-default") + sc.inventory.getRaritySuffix(iconString.rarity || 0),
				delay = 0,
				coll = target.coll;
			ig.system.getScreenFromMapPos(center, Math.round(coll.pos.x + coll.size.x / 2), Math.round(coll.pos.y - coll.pos.z - coll.size.z / 2 + coll.size.y / 2));
			Vec2.subC(center, 7, 8);
			for (coll = 0; coll < count; coll++) {
				angle = scatterAngles[coll % scatterAngles.length];
				angle = angle + (-2 + Math.random() * 4);
				angle = angle * (Math.PI / 180);
				dir.x = Math.sin(angle);
				dir.y = Math.cos(angle);
				angle = Math.floor(20 + Math.random() * 20);
				target.x = Math.floor(center.x - dir.x * angle);
				target.y = Math.floor(center.y - dir.y * angle);
				angle = new sc.ItemGui(target, iconString, center, target, delay);
				this.addChildGui(angle);
				delay = delay + 0.08
			}
		}
	})
});
ig.baked = !0;
