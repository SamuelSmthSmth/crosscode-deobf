ig.module("impact.feature.map-content.entities.note").requires("impact.base.entity").defines(function() {
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
            label: function() {
                return this.text
            },
            boxColor: "rgba(30, 30, 30, 1)",
            frontColor: "rgba(0, 0, 0, 1)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type =
                ig.COLLTYPE.NONE;
            c.size ? this.coll.size.z = c.zHeight || 0 : this.coll.setSize(32, 32, c.zHeight || 0);
            this.text = "\n" + c.text || ""
        }
    })
});
ig.baked = !0;
