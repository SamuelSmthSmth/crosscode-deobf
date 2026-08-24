/**
 * @module game.feature.gui.base.text
 * @description sc.TextGui: the text GUI element wrapping ig.TextBlock with
 *   typewriter sound beeps, prerendering and text-state save/restore.
 */
ig.module("game.feature.gui.base.text").requires("impact.base.font", "impact.feature.gui.gui", "game.feature.font.font-system").defines(function() {
	sc.TextGui = ig.GuiElementBase.extend({
		font: null,
		text: "",
		textBlock: null,
		beepSound: null,
		bleepDelay: 0,
		playSound: false,
		stopped: false,
		init: function(text, settings) {
			this.parent();
			var settings = settings || {},
				font = settings.font;
			this.font = font ? font : sc.fontsystem.font;
			this.text = text;
			this.textBlock = new ig.TextBlock(this.font, text, settings);
			settings.drawCallback && this.textBlock.setDrawCallback(settings.drawCallback);
			this.bleepDelay = 0;
			this.hook.size.x = this.textBlock.size.x;
			this.hook.size.y = this.textBlock.size.y;
			this.hook.pivot.x = Math.floor(this.hook.size.x / 2);
			this.hook.pivot.y = Math.floor(this.hook.size.y / 2)
		},
		onVisibilityChange: function(visible) {
			visible ? this.textBlock.prerender() : this.textBlock.clearPrerendered()
		},
		setBeepSound: function(sound) {
			(this.beepSound = sound) && this.textBlock.isFinished() && this.beepSound.play()
		},
		setMaxWidth: function(width) {
			this.textBlock.maxWidth = width || 0;
			this.setText(this.text)
		},
		setTextAlign: function(align) {
			this.textBlock.align = align
		},
		setTextSpeed: function(speed) {
			this.textBlock.speed = speed
		},
		setFont: function(font, linePadding) {
			if (font && font != this.font) {
				this.font = font;
				this.textBlock.font = font;
				if (linePadding != void 0) this.textBlock.linePadding = linePadding || 0;
				this.setText(this.text)
			}
		},
		setDrawCallback: function(callback) {
			this.textBlock.setDrawCallback(callback)
		},
		setText: function(text) {
			this.text = text;
			this.textBlock.setText(text);
			this.isVisible() && this.textBlock.prerender();
			this.hook.size.x = this.textBlock.size.x;
			this.hook.size.y = this.textBlock.size.y;
			this.hook.pivot.x = Math.floor(this.hook.size.x / 2);
			this.hook.pivot.y = Math.floor(this.hook.size.y / 2);
			this.stopped = false
		},
		clear: function() {
			this.textBlock.clearPrerendered()
		},
		finish: function() {
			this.textBlock.finish()
		},
		update: function() {
			if (!this.stopped) {
				var index = Math.floor(this.textBlock.currentIndex / 1);
				this.textBlock.update();
				if (Math.floor(this.textBlock.currentIndex / 1) != index) this.playSound = true;
				if (!sc.model.isTitle() && this.beepSound && this.playSound && this.bleepDelay <= 0) {
					this.beepSound.play();
					this.playSound = false;
					this.bleepDelay = Math.ceil(this.textBlock.speed * 120) / 60 - 0.005
				}
				this.bleepDelay = this.bleepDelay - ig.system.actualTick
			}
		},
		stop: function() {
			this.stopped = true
		},
		reset: function() {
			this.textBlock.reset()
		},
		resume: function() {
			this.stopped = false
		},
		getTextState: function() {
			return this.textBlock.getState()
		},
		setTextState: function(state) {
			this.textBlock.setState(state)
		},
		updateDrawables: function(drawables) {
			drawables.addDraw().setText(this.textBlock, 0, 0)
		},
		onAttach: function() {
			this.isVisible() && this.textBlock.prerender()
		},
		onDetach: function() {
			this.textBlock.clearPrerendered()
		}
	})
});
ig.baked = !0;
