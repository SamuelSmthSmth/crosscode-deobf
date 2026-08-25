ig.module("game.feature.gui.base.numbers").requires("impact.feature.gui.gui").defines(function() {
    function b(a, b) {
        for (a.digits = 0; b;) {
            a.digits++;
            b = Math.floor(b / 10)
        }
        if (a.leadingZeros > a.digits) a.digits = a.leadingZeros;
        a.hook.size.x = (a.digits + (a.signed || a.showPlus)) * a.metrics.width;
        if (a.dots) a.hook.size.x = a.hook.size.x + (Math.ceil(a.digits / 3) - 1) * a.metrics.dotX;
        a.hook.size.y = a.metrics.height;
        a.hook.pivot.x = Math.floor(a.hook.size.x / 2)
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
    var a = void 0;
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
        init: function(d, c) {
            this.parent();
            this.setSize(0, 7);
            this.setPivot(0, 4);
            a === void 0 && (a = !(ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits));
            this.maxNumber = d;
            this.signed = c && c.signed || false;
            this.numTransitionTime = c && c.transitionTime || 0;
            this.numTransitionScale = c && c.transitionScale || 0;
            this.color = c && c.color ||
                this.color;
            this.showPlus = c && c.showPlus || false;
            this.metrics = c && c.size || sc.NUMBER_SIZE.NORMAL;
            this.noZero = c && c.noZero || false;
            this.leadingZeros = c && c.leadingZeros || 0;
            this.scramble = c && c.scramble || false;
            this.dots = c && c.dots || false;
            this.zeroAsGrey = c && c.zeroAsGrey || false;
            this.timer = new ig.WeightTimer(true);
            d && b(this, d)
        },
        setSize: function(a) {
            this.metrics = a || sc.NUMBER_SIZE.NORMAL;
            b(this, this.maxNumber)
        },
        setNumber: function(a, c) {
            c = c != void 0 ? c : false;
            a = a * 1;
            isNaN(a) && (a = 0);
            this.maxNumber ? a = a.limit(this.signed ? -this.maxNumber :
                0, this.maxNumber) : b(this, a);
            if (this.targetNumber != a) {
                this.initNumber = c ? a : this._getCurrentNumber();
                this.targetNumber = a;
                var e = c ? 0 : this.numTransitionTime,
                    f = Math.abs(this.initNumber - this.targetNumber);
                this.numTransitionScale ? e = e * (f / this.numTransitionScale) : e / f > 0.066 && (e = f * 0.066);
                this.timer.set(e)
            }
            if (this.zeroAsGrey)
                for (this.realDigits = a ? -1 : 0; a && this.realDigits < this.digits;) {
                    this.realDigits++;
                    a = Math.floor(a / 10)
                }
        },
        getNumber: function() {
            return this.targetNumber
        },
        setMaxNumber: function(a) {
            this.maxNumber = a;
            b(this, this.maxNumber)
        },
        setColor: function(a) {
            this.color = a
        },
        update: function() {
            this.timer.tick()
        },
        updateDrawables: function(b) {
            var c = this.metrics,
                e = c.x,
                f = c.y + this.color * c.height,
                g = c.width,
                h = c.height,
                i = this.hook.size.x,
                j = false,
                k = this._getCurrentNumber(),
                l = k,
                o = 0;
            if (k < 0) {
                j = true;
                k = -k
            } else if (k == 0 && this.noZero) return;
            var m = this.leadingZeros,
                n = 0;
            do {
                var i = i - g,
                    p = k % 10;
                b.addGfx(this.gfx, i, 0, e + (this.scramble ? 15 : p) * g, this.zeroAsGrey && p == 0 && this.realDigits >= 0 && n > this.realDigits ? c.y + sc.GUI_NUMBER_COLOR.GREY * c.height :
                    f, g, h);
                n++;
                k = Math.floor(k / 10);
                m--;
                if (this.dots && k > 0) {
                    o++;
                    if (o >= 3) {
                        o = 0;
                        i = i - this.metrics.dotX;
                        b.addGfx(this.gfx, i, a ? c.commaOffset || 3 : 0, e + (a ? 16 : 14) * g, f, c.dotX || 3, h)
                    }
                }
            } while (this.leadingZeros ? m > 0 || this.digits >= this.leadingZeros && k : k);
            i = i - g;
            j ? b.addGfx(this.gfx, i, 0, e + 10 * g, f, g, h) : this.showPlus && (this.showPlusOnZero || l != 0) && b.addGfx(this.gfx, i - 1, 0, e + 11 * g, f, g, h)
        },
        _getCurrentNumber: function() {
            if (this.timer.done()) return this.targetNumber;
            var a = this.timer.get();
            return Math.floor((1 - a) * this.initNumber + a * this.targetNumber)
        }
    });
    sc.MaxNumberGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        currentNumberGui: null,
        maxNumberGui: null,
        init: function(a, b) {
            this.parent();
            this.currentNumberGui = new sc.NumberGui(a, {
                transitionTime: b
            });
            this.maxNumberGui = new sc.NumberGui(a);
            this.maxNumberGui.setPos(this.currentNumberGui.hook.size.x + 12, 0);
            this.maxNumberGui.setNumber(a);
            this.addChildGui(this.currentNumberGui);
            this.addChildGui(this.maxNumberGui);
            this.setSize(this.currentNumberGui.hook.size.x + this.maxNumberGui.hook.size.x +
                12, 7)
        },
        getMaxNumber: function() {
            return this.maxNumberGui.getNumber()
        },
        setMaxNumber: function(a, b) {
            this.currentNumberGui.setMaxNumber(a);
            this.maxNumberGui.setMaxNumber(a);
            this.maxNumberGui.setNumber(a, b);
            this.setSize(this.currentNumberGui.hook.size.x + this.maxNumberGui.hook.size.x + 12, 7);
            this.maxNumberGui.setPos(this.currentNumberGui.hook.size.x + 12, 0)
        },
        setNumber: function(a, b) {
            this.currentNumberGui.setNumber(a, b)
        },
        updateDrawables: function(a) {
            a.addGfxTile(this.gfx, this.currentNumberGui.hook.size.x + 2, 0, 12,
                8)
        }
    })
});
ig.baked = !0;
