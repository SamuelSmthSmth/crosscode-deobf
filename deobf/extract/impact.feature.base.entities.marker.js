ig.module("impact.feature.base.entities.marker").requires("impact.base.actor-entity").defines(function() {
    ig.ENTITY.Marker = ig.Entity.extend({
        name: "",
        dir: null,
        face: Vec2.create(),
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of Marker. This will be referred in teleport commands."
                },
                dir: {
                    _type: "String",
                    _info: "Direction player is facing when teleported to this spot.",
                    _select: ig.ActorEntity.FACE4
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true,
                    _optional: true
                }
            },
            label: function() {
                return "(face: " + this.dir + ")"
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            this.dir = c.dir;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[c.dir] || 0, this.face)
        },
        update: function() {},
        applyMarkerPosition: function(b) {
            b.coll.level = this.coll.level;
            b.coll.baseZPos = this.coll.baseZPos;
            b.coll.pos.z = this.coll.pos.z;
            b.face.x = this.face.x;
            b.face.y = this.face.y;
            b.setPos(this.coll.pos.x +
                this.coll.size.x / 2 - b.coll.size.x / 2, this.coll.pos.y + this.coll.size.y / 2 - b.coll.size.y / 2)
        }
    })
});
ig.baked = !0;
