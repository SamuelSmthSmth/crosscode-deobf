ig.module("game.feature.puzzle.entities.key-panel").requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.entities.ball", "game.feature.menu.map-model").defines(function() {
    var b = {
        REGULAR: {
            item: sc.AREA_ITEM_TYPE.DUNGEON_KEY,
            panel: {
                size: {
                    x: 16,
                    y: 16,
                    z: 1
                },
                sprite: {
                    x: 48,
                    y: 88,
                    w: 24,
                    h: 24
                }
            },
            fx: {
                active: "active",
                charged: "chargeActive"
            },
            ballInfo: new sc.BallInfo({
                animation: {
                    name: "default",
                    sheet: {
                        src: "media/entity/balls/default.png",
                        width: 24,
                        height: 24,
                        offY: 120,
                        offX: 24
                    },
                    time: 0.05,
                    repeat: true,
                    frames: [0, 1, 2, 3]
                },
                effects: "ball-special",
                maxBounce: 3,
                timer: 1.5,
                effectKeys: {
                    bounce: "keyBounce",
                    wall: "keyWall",
                    air: "keyAir",
                    trail: "keyTrail"
                },
                attack: {
                    type: "HEAVY",
                    damageFactor: 1.3,
                    skillBonus: "RANGED_DMG",
                    hints: ["CHARGED", "DUNGEON_KEY"]
                },
                speed: 400,
                trail: true
            })
        },
        MASTER: {
            item: sc.AREA_ITEM_TYPE.DUNGEON_MASTER_KEY,
            panel: {
                size: {
                    x: 24,
                    y: 24,
                    z: 1
                },
                sprite: {
                    x: 48,
                    y: 112,
                    w: 32,
                    h: 32
                }
            },
            fx: {
                active: "activeMaster",
                charged: "chargeActiveMaster"
            },
            ballInfo: new sc.BallInfo({
                animation: {
                    name: "default",
                    sheet: {
                        src: "media/entity/balls/default.png",
                        width: 24,
                        height: 24,
                        offY: 144,
                        offX: 24
                    },
                    time: 0.05,
                    repeat: true,
                    frames: [0, 1, 2, 3]
                },
                effects: "ball-special",
                maxBounce: 3,
                timer: 1.5,
                effectKeys: {
                    bounce: "keyBounceMaster",
                    wall: "keyWallMaster",
                    air: "keyAirMaster",
                    trail: "keyTrailMaster"
                },
                attack: {
                    type: "HEAVY",
                    damageFactor: 1.3,
                    skillBonus: "RANGED_DMG",
                    hints: ["CHARGED", "DUNGEON_MASTER_KEY"]
                },
                speed: 400,
                trail: true
            })
        }
    };
    ig.ENTITY.KeyPanel = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                keyType: {
                    _type: "String",
                    _info: "Type of Key Panel",
                    _select: b
                }
            }
        }),
        effects: {
            key: new ig.EffectSheet("puzzle.key"),
            activeHandle: null,
            chargedHandle: null
        },
        throwerEntity: null,
        active: false,
        keyType: null,
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1E3;
            this.keyType = b[e.keyType] || b.REGULAR;
            a = this.keyType.panel;
            this.coll.setSize(a.size.x, a.size.y, a.size.z);
            d = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: d.sheet,
                    width: a.sprite.w,
                    height: a.sprite.h,
                    xCount: 2,
                    offX: a.sprite.x,
                    offY: a.sprite.y
                },
                shapeType: "Z_FLAT",
                offset: {
                    x: 0,
                    y: (a.sprite.h - a.size.y) / 2,
                    z: 0
                },
                SUB: [{
                    name: "on",
                    time: 1,
                    frames: [1],
                    repeat: false
                }, {
                    name: "off",
                    time: 1,
                    frames: [0],
                    repeat: false
                }]
            });
            this.setCurrentAnim("off")
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                this.effects.key.spawnOnTarget("keyPanelAppear", this, {})
            }
        },
        setThrower: function(a) {
            !a && this.throwerEntity && this.throwerEntity.setOverrideBall(null);
            this.throwerEntity = a;
            this.setActive(this.throwerEntity &&
                this.hasKeys());
            this.throwerEntity && !this.active && this.effects.key.spawnOnTarget("noKeysBlink", this)
        },
        setActive: function(a) {
            this.active = a;
            this.setCurrentAnim(this.active ? "on" : "off");
            if (this.active && !this.effects.activeHandle) {
                this.throwerEntity.setOverrideBall(this.keyType.ballInfo);
                this.effects.activeHandle = this.effects.key.spawnOnTarget(this.keyType.fx.active, this, {
                    duration: -1
                })
            }
            if (!this.active && this.effects.activeHandle) {
                this.throwerEntity && this.throwerEntity.setOverrideBall(null);
                this.effects.activeHandle.stop();
                this.effects.activeHandle = null
            }
            if (!this.active && this.effects.chargedHandle) {
                this.effects.chargedHandle.stop();
                this.effects.chargedHandle = null
            }
        },
        hasKeys: function() {
            return sc.map.getAreaItemAmount(this.keyType.item)
        },
        update: function() {
            if (this.throwerEntity)
                if (ig.EntityTools.getGroundEntity(this.throwerEntity) != this) this.setThrower(null);
                else {
                    this.setActive(this.hasKeys());
                    if (this.active)
                        if (!this.effects.chargedHandle && this.throwerEntity.isThrowCharged()) this.effects.chargedHandle = this.effects.key.spawnOnTarget(this.keyType.fx.charged,
                            this, {
                                duration: -1
                            });
                        else if (this.effects.chargedHandle && !this.throwerEntity.isThrowCharged()) {
                        this.effects.chargedHandle.stop();
                        this.effects.chargedHandle = null
                    }
                } this.parent()
        },
        collideWith: function(a) {
            !this.throwerEntity && a == ig.game.playerEntity && this.setThrower(a)
        }
    })
});
ig.baked = !0;
