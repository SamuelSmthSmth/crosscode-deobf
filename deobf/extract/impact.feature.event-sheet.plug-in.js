ig.module("impact.feature.event-sheet.plug-in").requires("impact.feature.event-sheet.event-sheet", "impact.feature.event-sheet.event-sheet-steps").defines(function() {
    window.wm && wm.postLoadModules.push("impact.feature.event-sheet.editors.event-sheet-editor")
});
ig.baked = !0;
