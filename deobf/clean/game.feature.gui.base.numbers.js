/**
 * @module game.feature.gui.base.numbers
 * @description sc.NumberGui: the digit-sprite number display with signed/
 *   plus/dots/leading-zero/scramble options and animated counting, plus
 *   sc.MaxNumberGui (current / max pair).
 */
ig.module("game.feature.gui.base.numbers").requires("impact.feature.gui.gui").defines(function() {
	function recalcMetrics(gui, number) {
		for (gui.digits = 0; number;) {
			gui.digits++;
			number = Math.floor(number / 10)
		}
		if (gui.leadingZeros > gui.digits) gui.digits = gui.leadingZeros;
		gui.hook.size.x = (gui.digits + (gui.signed || gui.showPlus)) * gui.metrics.width;
		if (gui.dots) gui.hook.size.x = gui.hook.size.x + (Math.ceil(gui.digits / 3) - 1) * gui.metrics.dotX;
		gui.hook.size.y = gui.metrics.height;
		gui.hook.pivot.x = Math.floor(gui.hook.size.x / 2)
	}
	sc.GUI_NUMBER_COLOR = {
		WHITE: 0,
		RED: 1,
		GREEN: 2,
		GREY: 3,
		ORANGE: 4,
		NO_SHADOW: 5
	};
	sc.NUMBER_SIZE = {
		NORMAL: {
			x: 0,
			y: 0,
			width: 8,
			height: 8,
			dotX: 3,
			commaOffset: 2,
			dotSize: 3
		},
		TINY: {
			x: 136,
			y: 0,
			width: 6,
			height: 6
		},
		LARGE: {
			x: 0,
			y: 40,
			width: 12,
			height: 14
		},
		TEXT: {
			x: 160,
			y: 32,
			width: 8,
			height: 10,
			dotX: 3,
			commaOffset: 2,
			dotSize: 3
		},
		SMALL: {
			x: 0,
			y: 56,
			width: 6,
			height: 8,
			dotX: 2,
			dotSize: 2,
			commaOffset: 1
		},
		CHAIN: {
			x: 0,
			y: 96,
			width: 13,
			height: 15
		}
	};
	var useCommaDigits = void 0;
	sc.NumberGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/basic.png"),
		maxNumber: 9999,
		digits: 0,
		realDigits: 0,
		signed: false,
		showPlus: false,
		metrics: null,
		color: sc.GUI_NUMBER_COLOR.WHITE,
		targetNumber: 0,
		initNumber: 0,
		numTransitionTime: 0,
		numTransitionScale: 0,
		timer: null,
		noZero: false,
		leadingZeros: 0,
		showPlusOnZero: false,
		scramble: false,
		dots: false,
		zeroAsGrey: false,
		init: function(maxNumber, settings) {
			this.parent();
			this.setSize(0, 7);
			this.setPivot(0, 4);
			useCommaDigits === void 0 && (useCommaDigits = !(ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits));
			this.maxNumber = maxNumber;
			this.signed = settings && settings.signed || false;
			this.numTransitionTime = settings && settings.transitionTime || 0;
			this.numTransitionScale = settings && settings.transitionScale || 0;
			this.color = settings && settings.color || this.color;
			this.showPlus = settings && settings.showPlus || false;
			this.metrics = settings && settings.size || sc.NUMBER_SIZE.NORMAL;
			this.noZero = settings && settings.noZero || false;
			this.leadingZeros = settings && settings.leadingZeros || 0;
			this.scramble = settings && settings.scramble || false;
			this.dots = settings && settings.dots || false;
			this.zeroAsGrey = settings && settings.zeroAsGrey || false;
			this.timer = new ig.WeightTimer(true);
			maxNumber && recalcMetrics(this, maxNumber)
		},
		setSize: function(size) {
			this.metrics = size || sc.NUMBER_SIZE.NORMAL;
			recalcMetrics(this, this.maxNumber)
		},
		setNumber: function(number, instant) {
			instant = instant != void 0 ? instant : false;
			number = number * 1;
			isNaN(number) && (number = 0);
			this.maxNumber ? number = number.limit(this.signed ? -this.maxNumber : 0, this.maxNumber) : recalcMetrics(this, number);
			if (this.targetNumber != number) {
				this.initNumber = instant ? number : this._getCurrentNumber();
				this.targetNumber = number;
				var time = instant ? 0 : this.numTransitionTime,
					diff = Math.abs(this.initNumber - this.targetNumber);
				this.numTransitionScale ? time = time * (diff / this.numTransitionScale) : time / diff > 0.066 && (time = diff * 0.066);
				this.timer.set(time)
			}
			if (this.zeroAsGrey)
				for (this.realDigits = number ? -1 : 0; number && this.realDigits < this.digits;) {
					this.realDigits++;
					number = Math.floor(number / 10)
				}
		},
		getNumber: function() {
			return this.targetNumber
		},
		setMaxNumber: function(maxNumber) {
			this.maxNumber = maxNumber;
			recalcMetrics(this, this.maxNumber)
		},
		setColor: function(color) {
			this.color = color
		},
		update: function() {
			this.timer.tick()
		},
		updateDrawables: function(drawables) {
			var metrics = this.metrics,
				srcXBase = metrics.x,
				srcYBase = metrics.y + this.color * metrics.height,
				digitWidth = metrics.width,
				digitHeight = metrics.height,
				x = this.hook.size.x,
				negative = false,
				number = this._getCurrentNumber(),
				shownNumber = number,
				dotCount = 0;
			if (number < 0) {
				negative = true;
				number = -number
			} else if (number == 0 && this.noZero) return;
			var zerosLeft = this.leadingZeros,
				digitIndex = 0;
			do {
				var x = x - digitWidth,
					digit = number % 10;
				drawables.addGfx(this.gfx, x, 0, srcXBase + (this.scramble ? 15 : digit) * digitWidth, this.zeroAsGrey && digit == 0 && this.realDigits >= 0 && digitIndex > this.realDigits ? metrics.y + sc.GUI_NUMBER_COLOR.GREY * metrics.height : srcYBase, digitWidth, digitHeight);
				digitIndex++;
				number = Math.floor(number / 10);
				zerosLeft--;
				if (this.dots && number > 0) {
					dotCount++;
					if (dotCount >= 3) {
						dotCount = 0;
						x = x - this.metrics.dotX;
						drawables.addGfx(this.gfx, x, useCommaDigits ? metrics.commaOffset || 3 : 0, srcXBase + (useCommaDigits ? 16 : 14) * digitWidth, srcYBase, metrics.dotX || 3, digitHeight)
					}
				}
			} while (this.leadingZeros ? zerosLeft > 0 || this.digits >= this.leadingZeros && number : number);
			x = x - digitWidth;
			negative ? drawables.addGfx(this.gfx, x, 0, srcXBase + 10 * digitWidth, srcYBase, digitWidth, digitHeight) : this.showPlus && (this.showPlusOnZero || shownNumber != 0) && drawables.addGfx(this.gfx, x - 1, 0, srcXBase + 11 * digitWidth, srcYBase, digitWidth, digitHeight)
		},
		_getCurrentNumber: function() {
			if (this.timer.done()) return this.targetNumber;
			var progress = this.timer.get();
			return Math.floor((1 - progress) * this.initNumber + progress * this.targetNumber)
		}
	});
	sc.MaxNumberGui = ig.GuiElementBase.extend({
		gfx: new ig.Image("media/gui/basic.png"),
		currentNumberGui: null,
		maxNumberGui: null,
		init: function(maxNumber, transitionTime) {
			this.parent();
			this.currentNumberGui = new sc.NumberGui(maxNumber, {
				transitionTime: transitionTime
			});
			this.maxNumberGui = new sc.NumberGui(maxNumber);
			this.maxNumberGui.setPos(this.currentNumberGui.hook.size.x + 12, 0);
			this.maxNumberGui.setNumber(maxNumber);
			this.addChildGui(this.currentNumberGui);
			this.addChildGui(this.maxNumberGui);
			this.setSize(this.currentNumberGui.hook.size.x + this.maxNumberGui.hook.size.x + 12, 7)
		},
		getMaxNumber: function() {
			return this.maxNumberGui.getNumber()
		},
		setMaxNumber: function(maxNumber, instant) {
			this.currentNumberGui.setMaxNumber(maxNumber);
			this.maxNumberGui.setMaxNumber(maxNumber);
			this.maxNumberGui.setNumber(maxNumber, instant);
			this.setSize(this.currentNumberGui.hook.size.x + this.maxNumberGui.hook.size.x + 12, 7);
			this.maxNumberGui.setPos(this.currentNumberGui.hook.size.x + 12, 0)
		},
		setNumber: function(number, instant) {
			this.currentNumberGui.setNumber(number, instant)
		},
		updateDrawables: function(drawables) {
			drawables.addGfxTile(this.gfx, this.currentNumberGui.hook.size.x + 2, 0, 12, 8)
		}
	})
});
ig.baked = !0;
