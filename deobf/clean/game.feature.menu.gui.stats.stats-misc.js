/**
 * @module game.feature.menu.gui.stats.stats-misc
 * @description Stats menu helpers: sc.StatsScrollPane (scrollable content pane
 *   with entry stacking) and sc.StatPercentNumber (a number with a floating
 *   decimal + percent glyph).
 */
ig.module("game.feature.menu.gui.stats.stats-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.save.save-misc", "game.feature.menu.gui.stats.stats-gui-builds").defines(function() {
	sc.StatsScrollPane = sc.ScrollPane.extend({
		contentPane: null,
		paddingTop: 1,
		init: function(padding) {
			this.parent(sc.ScrollType.Y_ONLY);
			this.paddingTop = padding == void 0 ? 1 : padding;
			this.contentPane = new ig.GuiElementBase;
			this.setContent(this.contentPane)
		},
		update: function() {
			this.parent();
			if (this.isVisible() && (!this.onCheckScrollable || this.onCheckScrollable())) {
				sc.control.menuScrollUp() ? this.scrollY(-20) : sc.control.menuScrollDown() && this.scrollY(20);
				sc.control.downDown() ? this.scroll(200 * ig.system.tick) : sc.control.upDown() && this.scroll(-200 * ig.system.tick)
			}
		},
		setSize: function(width, height) {
			this.parent(width, height);
			this.contentPane.setSize(width, height)
		},
		scroll: function(amount, skipTransition) {
			this.scrollY(amount, skipTransition, 0.05)
		},
		addEntry: function(entry, x) {
			var y = this.getContentHeight(this.contentPane.hook.children.length % 1 != 0) + 0;
			entry.setPos(x, y);
			this.contentPane.addChildGui(entry);
			this.setContentHeight(this.getContentHeight())
		},
		clear: function(force) {
			this.contentPane.removeAllChildren();
			this.contentPane.hook.size.y = 0;
			this.box.doScrollTransition(0, 0, 0);
			this.recalculateScrollBars(force)
		},
		setScrollY: function(y, skipTransition, skipReset) {
			this._skipFirst = false;
			skipReset || this.box.doScrollTransition(0, 0, 0);
			this.parent(y, skipTransition)
		},
		getContentHeight: function(skipLast) {
			var children = this.contentPane.hook.children,
				length = children.length;
			skipLast && (length = length - 1);
			var height = 0;
			for (; length--;) {
				height = height + (children[length].size.y + 0);
				length = length - 0;
				if (length < 0) break
			}
			return height + this.paddingTop
		},
		setContentHeight: function(height) {
			this.contentPane.hook.size.y = height;
			this.recalculateScrollBars()
		}
	});
	sc.StatPercentNumber = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/menu.png"),
		number: null,
		floating: null,
		color: 0,
		x: 528,
		smallPercent: false,
		init: function(percent, settings) {
			this.parent();
			this.smallPercent = settings.smallPercent || false;
			this.floating = new sc.NumberGui(99, {
				size: settings.size,
				leadingZeros: 2,
				scramble: settings.scramble
			});
			this.floating.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.floating.setPos(9, 0);
			this.addChildGui(this.floating);
			this.number = new sc.NumberGui(null, settings);
			this.number.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.number.setPos(this.floating.hook.size.x + 12, 0);
			this.addChildGui(this.number);
			if (!ig.LANG_DETAILS[ig.currentLang] || !ig.LANG_DETAILS[ig.currentLang].commaDigits) this.x = 548;
			this.setSize(this.number.hook.size.x + this.floating.hook.size.x + 12, this.number.hook.size.y)
		},
		setNumber: function(value, skipAnim) {
			var whole = Math.floor(value * 100);
			this.number.setNumber(whole, skipAnim);
			whole = Math.floor(value * 1E4) % 100;
			this.floating.setNumber(whole, skipAnim);
			this.setSize(this.number.hook.size.x + this.floating.hook.size.x + 12, this.number.hook.size.y)
		},
		setColor: function(color) {
			this.color = color || 0;
			this.number.setColor(this.color);
			this.floating.setColor(this.color)
		},
		updateDrawables: function(drawables) {
			this.smallPercent ? drawables.addGfx(this.gfx, this.hook.size.x - 8, 0, 440 + 8 * this.color, 440, 8, 8) : drawables.addGfx(this.gfx, this.hook.size.x - 8, 0, 512 + 9 * this.color, 192, 8, 10);
			drawables.addGfx(this.gfx, this.hook.size.x - 28, this.hook.size.y - 3, this.x + 4 * this.color, 184, 3, 5)
		}
	})
});
ig.baked = !0;
