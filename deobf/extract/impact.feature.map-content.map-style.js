ig.module("impact.feature.map-content.map-style").requires("impact.base.game").defines(function() {
    ig.MAP_STYLES = {};
    ig.MapStyle = ig.GameAddon.extend({
        currentStyle: null,
        _wmLoad: true,
        init: function() {
            this.parent("MapStyle")
        },
        get: function(b) {
            if (ig.MAP_STYLES[this.currentStyle] && ig.MAP_STYLES[this.currentStyle][b]) return ig.MAP_STYLES[this.currentStyle][b];
            if (ig.MAP_STYLES["default"]) return ig.MAP_STYLES["default"][b]
        },
        levelLoadStartOrder: 100,
        onLevelLoadStart: function(b) {
            this.currentStyle = b.attributes &&
                b.attributes.mapStyle
        }
    });
    ig.MapStyle.registerStyle = function(b, a, d) {
        ig.MAP_STYLES[b] || (ig.MAP_STYLES[b] = {});
        ig.MAP_STYLES[b][a] = d
    };
    ig.addGameAddon(function() {
        return ig.mapStyle = new ig.MapStyle
    })
});
ig.baked = !0;
