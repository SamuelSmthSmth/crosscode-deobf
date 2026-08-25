ig.module("game.feature.map-content.entities.rhombus-point").requires("impact.base.entity", "game.feature.map-content.gui.rhombus-map").defines(function() {
    ig.ENTITY.RhombusPoint = ig.Entity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                title: {
                    _type: "LangLabel",
                    _info: "Name of the teleport location"
                },
                description: {
                    _type: "LangLabel",
                    _info: "Short description of the location",
                    _large: true
                },
                map: {
                    _type: "Maps",
                    _info: "Map to be teleported to",
                    _context: "Map"
                },
                marker: {
                    _type: "Marker",
                    _info: "Marker on Map to be teleported to"
                },
                condition: {
                    _type: "VarCondition",
                    _info: "optional condition for this location to show",
                    _optional: true
                },
                icon: {
                    _type: "Integer",
                    _info: "Index of the preview icon to use."
                }
            },
            scalableX: true,
            scalableY: true,
            scalableStep: 2,
            drawBox: true,
            boxColor: "rgba(255, 128, 30, 0.5)",
            frontColor: "rgba(128, 128, 0, 1)",
            noZLine: true
        }),
        title: null,
        description: null,
        condition: null,
        map: null,
        marker: null,
        icon: 0,
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.setSize(16, 16, 0);
            this.coll.type = ig.COLLTYPE.NONE;
            this.title = ig.LangLabel.getText(c.title);
            this.description = ig.LangLabel.getText(c.description);
            this.map = c.map;
            this.marker = c.marker;
            this.icon = c.icon || 0;
            this.condition = c.condition ? new ig.VarCondition(c.condition) : null
        }
    })
});
ig.baked = !0;
