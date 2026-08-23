/**
 * game.feature.puzzle.entities.extract-platform
 * =============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.extract-platform")`.
 *
 * `ig.ENTITY.ExtractPlatform`: a platform that raises/lowers (by z position)
 * when its `VarCondition` flips, animated over `extractTime`. The
 * `sc.EXTRACT_PLATFORM_TYPE` table defines the Small and Large variants.
 */
ig.module("game.feature.puzzle.entities.extract-platform")
    .requires("game.config", "impact.base.entity")
    .defines(function () {

    sc.EXTRACT_PLATFORM_TYPE = {};

    ig.ENTITY.ExtractPlatform = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                extractType: {
                    _type: "String",
                    _info: "Type of extractable platform",
                    _select: sc.EXTRACT_PLATFORM_TYPE
                },
                activeZHeight: {
                    _type: "Number",
                    _info: "The z position when active."
                },
                inactiveZHeight: {
                    _type: "Number",
                    _info: "The z position when inactive."
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for the platform to move up",
                    _popup: true
                }
            }
        }),
        condition: null,
        terrain: null,
        zTimer: 0,
        zTime: 0,
        activeZHeight: 0,
        inactiveZHeight: 0,
        activeState: false,
        _baseZ: 0,
        _startZ: 0,
        _targetZ: 0,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zBounciness = 0;
            this._baseZ = this.coll.pos.z;
            this.condition = new ig.VarCondition(settings.condition);
            this.activeZHeight = settings.activeZHeight || 0;
            var type = sc.EXTRACT_PLATFORM_TYPE[settings.extractType];
            this.zTimer = this.zTime = type.extractTime;
            Vec3.assign(this.coll.size, type.size);
            this.activeState = this.condition.evaluate();
            window.wm || (this.activeState ? this.setZPos(this._baseZ - this.coll.size.z + this.activeZHeight) : this.setZPos(this._baseZ - this.coll.size.z + this.inactiveZHeight));
            this.initAnimations(type.anims)
        },

        update: function () {
            this.parent();
            if (this.zTimer < this.zTime) {
                this.zTimer = this.zTimer + ig.system.tick;
                var progress = Math.min(1, Math.max(0, this.zTimer) / this.zTime),
                    eased = KEY_SPLINES.LINEAR.get(progress),
                    z = this._startZ * (1 - eased) + this._targetZ * eased;
                if (eased == 1) this.zTimer = this.zTime;
                this.setZPos(z)
            }
        },

        varsChanged: function () {
            var active = this.condition.evaluate();
            if (this.activeState != active) {
                this.activeState = active;
                this._startZ = this.coll.pos.z;
                this._targetZ = this.activeState ? this._baseZ - this.coll.size.z + this.activeZHeight : this._baseZ - this.coll.size.z + this.inactiveZHeight;
                this.zTimer = 0
            }
        }
    });

    sc.EXTRACT_PLATFORM_TYPE.Small = {
        size: {
            x: 16,
            y: 16,
            z: 16
        },
        extractTime: 0.3,
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/puzzle-elements-1.png",
                width: 16,
                height: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }]
        }
    };

    sc.EXTRACT_PLATFORM_TYPE.Large = {
        size: {
            x: 32,
            y: 32,
            z: 32
        },
        extractTime: 0.3,
        terrain: ig.TERRAIN.METAL,
        anims: {
            sheet: {
                src: "media/entity/objects/puzzle-elements-1.png",
                width: 32,
                height: 64,
                offY: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }]
        }
    }
});
ig.baked = !0;
