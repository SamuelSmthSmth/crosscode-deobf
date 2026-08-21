/**
 * impact.feature.base.entities.marker
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.base.entities.marker")`.
 *
 * Teleport destination marker: a non-colliding entity with a name and facing
 * direction used by TELEPORT steps.
 */
ig.module("impact.feature.base.entities.marker")
    .requires("impact.base.actor-entity")
    .defines(function () {

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
            label: function () {
                return "(face: " + this.dir + ")";
            },
            drawBox: true,
            boxColor: "rgba(255,255,0, 0.5)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(32, 32, 0);
            this.dir = settings.dir;
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[settings.dir] || 0, this.face);
        },

        update: function () {},

        /** Place `entity` at this marker with the marker's facing. */
        applyMarkerPosition: function (entity) {
            entity.coll.level = this.coll.level;
            entity.coll.baseZPos = this.coll.baseZPos;
            entity.coll.pos.z = this.coll.pos.z;
            entity.face.x = this.face.x;
            entity.face.y = this.face.y;
            entity.setPos(this.coll.pos.x + this.coll.size.x / 2 - entity.coll.size.x / 2,
                this.coll.pos.y + this.coll.size.y / 2 - entity.coll.size.y / 2);
        }
    });
});
ig.baked = !0;
