/**
 * impact.base.utils
 * ==================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.utils")`.
 *
 * Assorted utilities: `ig.RGBColor` (color parsing/interpolation) and
 * `ig.UniformRNG` (a shuffled "uniform" random number generator that avoids
 * immediate repeats by randomly swapping nearby values).
 */
ig.module("impact.base.utils").defines(function () {

    // Named CSS colors -> hex (for parsing color strings).
    var colorNames = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "00ffff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000000",
        blanchedalmond: "ffebcd",
        blue: "0000ff",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "00ffff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dodgerblue: "1e90ff",
        feldspar: "d19275",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "ff00ff",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgrey: "d3d3d3",
        lightgreen: "90ee90",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslateblue: "8470ff",
        lightslategray: "778899",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "00ff00",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "ff00ff",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370d8",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "d87093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        red: "ff0000",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        violetred: "d02090",
        wheat: "f5deb3",
        white: "ffffff",
        whitesmoke: "f5f5f5",
        yellow: "ffff00",
        yellowgreen: "9acd32",
    };

    // Ordered list of color-string parsers. Each returns [r, g, b].
    var colorParsers = [{
        re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
        example: ["rgb(123, 234, 45)", "rgb(255,234,245)"],
        process: function (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        },
    }, {
        re: /^(\w{2})(\w{2})(\w{2})$/,
        example: ["#00ff00", "336699"],
        process: function (match) {
            return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
        },
    }, {
        re: /^(\w{1})(\w{1})(\w{1})$/,
        example: ["#fb0", "f0f"],
        process: function (match) {
            return [parseInt(match[1] + match[1], 16), parseInt(match[2] + match[2], 16), parseInt(match[3] + match[3], 16)];
        },
    }];

    /**
     * Parse a color string (named / hex / rgb) into r/g/b components (0..255).
     * @param {string|ig.RGBColor} colorString
     */
    ig.RGBColor = function (colorString) {
        this.ok = false;
        if (colorString) {
            if (colorString instanceof ig.RGBColor) {
                this.r = colorString.r;
                this.g = colorString.g;
                this.b = colorString.b;
                this.ok = true;
            } else {
                if (colorString.charAt(0) == "#") colorString = colorString.substr(1, 6);
                colorString = colorString.replace(/ /g, "");
                colorString = colorString.toLowerCase();
                for (var name in colorNames) if (colorString == name) colorString = colorNames[name];

                for (var i = 0; i < colorParsers.length; i++) {
                    var process = colorParsers[i].process;
                    var match = colorParsers[i].re.exec(colorString);
                    if (match) {
                        var rgb = process(match);
                        this.r = rgb[0];
                        this.g = rgb[1];
                        this.b = rgb[2];
                        this.ok = true;
                    }
                }

                this.r = this.r < 0 || isNaN(this.r) ? 0 : this.r > 255 ? 255 : this.r;
                this.g = this.g < 0 || isNaN(this.g) ? 0 : this.g > 255 ? 255 : this.g;
                this.b = this.b < 0 || isNaN(this.b) ? 0 : this.b > 255 ? 255 : this.b;
            }
        } else {
            this.r = this.g = this.b = 0;
            this.ok = true;
        }
    };

    ig.RGBColor.prototype.toRGB = function () {
        return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
    };

    ig.RGBColor.prototype.toHex = function () {
        var r = this.r.toString(16);
        var g = this.g.toString(16);
        var b = this.b.toString(16);
        if (r.length == 1) r = "0" + r;
        if (g.length == 1) g = "0" + g;
        if (b.length == 1) b = "0" + b;
        return "#" + r + g + b;
    };

    ig.RGBColor.prototype.assign = function (other) {
        this.r = other.r;
        this.g = other.g;
        this.b = other.b;
        this.ok = true;
    };

    /** Blend `color` into this color by `weight` (0..1). */
    ig.RGBColor.prototype.addColor = function (color, weight) {
        this.r = Math.round(Math.min(255, this.r * (1 - weight) + color.r * weight));
        this.g = Math.round(Math.min(255, this.g * (1 - weight) + color.g * weight));
        this.b = Math.round(Math.min(255, this.b * (1 - weight) + color.b * weight));
    };

    /** Write the interpolation of color1→color2 at `weight` into `out`. */
    ig.RGBColor.interpolate = function (color1, color2, weight, out) {
        out.r = Math.round(Math.min(255, color1.r * (1 - weight) + color2.r * weight));
        out.g = Math.round(Math.min(255, color1.g * (1 - weight) + color2.g * weight));
        out.b = Math.round(Math.min(255, color1.b * (1 - weight) + color2.b * weight));
    };

    /**
     * "Uniform" random number generator: a shuffled deck of evenly-spaced values
     * in [0, 1]. Each get() returns a value and randomly swaps it with a nearby
     * index, avoiding clumps and immediate repeats.
     */
    ig.UniformRNG = ig.Class.extend({
        lastIndex: 0,
        values: [],

        /**
         * @param {number} count number of distinct values
         * @param {boolean} [includeOne] if true, the range includes 1.0 (max = count-1)
         */
        init: function (count, includeOne) {
            var max = includeOne ? count - 1 : count;
            for (var i = 0; i < count; ++i) this.values.push(i / max);
            this.values.sort(function () {
                return Math.random() - 0.5;
            });
        },

        get: function () {
            var len = this.values.length;
            var value = this.values[this.lastIndex];
            var swapIndex = this.lastIndex - Math.floor(Math.random() * len * 0.2);
            if (swapIndex < 0) swapIndex = swapIndex + len;
            this.values[this.lastIndex] = this.values[swapIndex];
            this.values[swapIndex] = value;
            this.lastIndex = (this.lastIndex + 1) % len;
            return value;
        },
    });
});
