/**
 * impact.feature.map-content.map-style
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.map-style")`.
 *
 * `ig.mapStyle` add-on: holds the current level's style key and looks up
 * style-specific values registered via `ig.MapStyle.registerStyle`.
 */
ig.module("impact.feature.map-content.map-style")
    .requires("impact.base.game")
    .defines(function () {

    ig.MAP_STYLES = {};

    ig.MapStyle = ig.GameAddon.extend({
        currentStyle: null,
        _wmLoad: true,

        init: function () {
            this.parent("MapStyle");
        },

        /** Look up `key` for the current style, falling back to "default". */
        get: function (key) {
            if (ig.MAP_STYLES[this.currentStyle] && ig.MAP_STYLES[this.currentStyle][key]) {
                return ig.MAP_STYLES[this.currentStyle][key];
            }
            if (ig.MAP_STYLES["default"]) return ig.MAP_STYLES["default"][key];
        },

        levelLoadStartOrder: 100,

        onLevelLoadStart: function (level) {
            this.currentStyle = level.attributes && level.attributes.mapStyle;
        }
    });

    ig.MapStyle.registerStyle = function (style, key, value) {
        ig.MAP_STYLES[style] || (ig.MAP_STYLES[style] = {});
        ig.MAP_STYLES[style][key] = value;
    };

    ig.addGameAddon(function () {
        return ig.mapStyle = new ig.MapStyle();
    });
});
ig.baked = !0;
