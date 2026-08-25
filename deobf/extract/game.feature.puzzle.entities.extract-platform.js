ig.module("game.feature.puzzle.entities.extract-platform").requires("game.config", "impact.base.entity").defines(function() {
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
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zBounciness = 0;
            this._baseZ = this.coll.pos.z;
            this.condition = new ig.VarCondition(c.condition);
            this.activeZHeight = c.activeZHeight || 0;
            b = sc.EXTRACT_PLATFORM_TYPE[c.extractType];
            this.zTimer = this.zTime = b.extractTime;
            Vec3.assign(this.coll.size,
                b.size);
            this.activeState = this.condition.evaluate();
            window.wm || (this.activeState ? this.setZPos(this._baseZ - this.coll.size.z + this.activeZHeight) : this.setZPos(this._baseZ - this.coll.size.z + this.inactiveZHeight));
            this.initAnimations(b.anims)
        },
        update: function() {
            this.parent();
            if (this.zTimer < this.zTime) {
                this.zTimer = this.zTimer + ig.system.tick;
                var b = Math.min(1, Math.max(0, this.zTimer) / this.zTime),
                    b = KEY_SPLINES.LINEAR.get(b),
                    a = this._startZ * (1 - b) + this._targetZ * b;
                if (b == 1) this.zTimer = this.zTime;
                this.setZPos(a)
            }
        },
        varsChanged: function() {
            var b = this.condition.evaluate();
            if (this.activeState != b) {
                this.activeState = b;
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
