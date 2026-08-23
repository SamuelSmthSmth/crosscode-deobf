/**
 * game.feature.puzzle.entities.key-panel
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.key-panel")`.
 *
 * `ig.ENTITY.KeyPanel`: a ground panel that overrides the player's thrown
 * ball with a dungeon key projectile while the player stands on it and has
 * keys. Supports REGULAR (DUNGEON_KEY) and MASTER (DUNGEON_MASTER_KEY) types.
 */
ig.module("game.feature.puzzle.entities.key-panel")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.entities.ball", "game.feature.menu.map-model")
    .defines(function () {

    var KEY_PANEL_TYPES = {
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
                    _select: KEY_PANEL_TYPES
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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1E3;
            this.keyType = KEY_PANEL_TYPES[settings.keyType] || KEY_PANEL_TYPES.REGULAR;
            var panelSpec = this.keyType.panel;
            this.coll.setSize(panelSpec.size.x, panelSpec.size.y, panelSpec.size.z);
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: puzzleStyle.sheet,
                    width: panelSpec.sprite.w,
                    height: panelSpec.sprite.h,
                    xCount: 2,
                    offX: panelSpec.sprite.x,
                    offY: panelSpec.sprite.y
                },
                shapeType: "Z_FLAT",
                offset: {
                    x: 0,
                    y: (panelSpec.sprite.h - panelSpec.size.y) / 2,
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

        show: function (show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                this.effects.key.spawnOnTarget("keyPanelAppear", this, {})
            }
        },

        setThrower: function (entity) {
            !entity && this.throwerEntity && this.throwerEntity.setOverrideBall(null);
            this.throwerEntity = entity;
            this.setActive(this.throwerEntity && this.hasKeys());
            this.throwerEntity && !this.active && this.effects.key.spawnOnTarget("noKeysBlink", this)
        },

        setActive: function (active) {
            this.active = active;
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

        hasKeys: function () {
            return sc.map.getAreaItemAmount(this.keyType.item)
        },

        update: function () {
            if (this.throwerEntity)
                if (ig.EntityTools.getGroundEntity(this.throwerEntity) != this) this.setThrower(null);
                else {
                    this.setActive(this.hasKeys());
                    if (this.active)
                        if (!this.effects.chargedHandle && this.throwerEntity.isThrowCharged()) this.effects.chargedHandle = this.effects.key.spawnOnTarget(this.keyType.fx.charged, this, {
                            duration: -1
                        });
                        else if (this.effects.chargedHandle && !this.throwerEntity.isThrowCharged()) {
                        this.effects.chargedHandle.stop();
                        this.effects.chargedHandle = null
                    }
                } this.parent()
        },

        collideWith: function (entity) {
            !this.throwerEntity && entity == ig.game.playerEntity && this.setThrower(entity)
        }
    })
});
ig.baked = !0;