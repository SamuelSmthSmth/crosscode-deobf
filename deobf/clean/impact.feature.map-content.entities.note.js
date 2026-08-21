/**
 * impact.feature.map-content.entities.note
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-content.entities.note")`.
 *
 * Editor-only entity: a non-colliding box that displays `text` in the level
 * editor's information panel.
 */
ig.module("impact.feature.map-content.entities.note")
    .requires("impact.base.entity")
    .defines(function () {

    ig.ENTITY.Note = ig.Entity.extend({
        text: "",

        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                zHeight: {
                    _type: "Number",
                    _default: 0
                },
                text: {
                    _type: "String",
                    _info: "Text to display in information.",
                    _large: true
                }
            },
            scalableX: true,
            scalableY: true,
            drawBox: true,
            label: function () {
                return this.text;
            },
            boxColor: "rgba(30, 30, 30, 1)",
            frontColor: "rgba(0, 0, 0, 1)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            settings.size ? this.coll.size.z = settings.zHeight || 0 : this.coll.setSize(32, 32, settings.zHeight || 0);
            this.text = "\n" + settings.text || "";
        }
    });
});
ig.baked = !0;
