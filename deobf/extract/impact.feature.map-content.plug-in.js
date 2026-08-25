ig.module("impact.feature.map-content.plug-in").requires("impact.feature.map-content.map-style", "impact.feature.map-content.entities.door", "impact.feature.map-content.entities.stair-door", "impact.feature.map-content.entities.teleport-ground", "impact.feature.map-content.entities.glowing-ground", "impact.feature.map-content.entities.prop", "impact.feature.map-content.entities.scalable-prop", "impact.feature.map-content.entities.hidden-block", "impact.feature.map-content.entities.note", "impact.feature.map-content.map-content-steps").defines(function() {
    if (window.wm) {
        wm.postLoadModules.push("impact.feature.map-content.editors.map-content-editor");
        wm.mapAttribs &&
            (wm.mapAttribs.mapStyle = {
                _type: "String",
                _info: "Select style of map (influences appearance of several entities)",
                _select: ig.MAP_STYLES,
                _withNull: true
            })
    }
});
ig.baked = !0;
