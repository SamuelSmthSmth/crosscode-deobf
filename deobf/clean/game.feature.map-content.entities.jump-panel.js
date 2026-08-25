/**
 * @module game.feature.map-content.entities.jump-panel
 *
 * Jump panel entities: a vertical launcher (JumpPanel), a directional
 * launcher (JumpPanelFar), and a float-mode launcher (JumpPanelFloat).
 * Each launches entities with configured velocity/distance, plays effects,
 * is condition-gated, and marks its navigation connection as party-blocked
 * when off.
 */
ig.module("game.feature.map-content.entities.jump-panel").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var JUMP_HEIGHTS = {
            2: {
                zVel: 280,
                height: 32,
                effectDuration: 0.25
            },
            3: {
                zVel: 315,
                height: 48,
                effectDuration: 0.3
            },
            4: {
                zVel: 350,
                height: 64,
                effectDuration: 0.35
            },
            6: {
                zVel: 420,
                height: 96,
                effectDuration: 0.45
            },
            8: {
                zVel: 490,
                height: 128,
                effectDuration: 0.55
            }
        },
        BOTTOM_POS = Vec3.create(),
        DEST_POS = Vec3.create();
    ig.ENTITY.JumpPanel = ig.AnimatedEntity.extend({
        effects: new ig.EffectSheet("puzzle"),
        jumpHeightData: null,
        condition: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                jumpHeight: {
                    _type: "String",
                    _info: "How height to jump (in tiles).",
                    _select: JUMP_HEIGHTS
                },
                condition: {
                    _type: "VarCondition",
                    _info: "A condition for this if any. ",
                    _popup: true
                }
            }
        }),
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.jumpHeightData = JUMP_HEIGHTS[extraSettings.jumpHeight] || JUMP_HEIGHTS["2"];
            this.condition = new ig.VarCondition(extraSettings.condition || "");
            this.isOn = this.condition.evaluate();
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(16, 16, 0);
            this.initAnimations({
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 16,
                    height: 16
                },
                gfxOffset: {
                    x: 0,
                    y: -1
                },
                SUB: [{
                    name: "off",
                    time: 0.2,
                    frames: []
                }, {
                    name: "normal",
                    time: 0.15,
                    frames: [6, 7, 8, 9, 10],
                    repeat: true,
                    globalTiming: true
                }, {
                    name: "glow",
                    time: 0.05,
                    frames: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5]
                }]
            });
            window.wm ? this.setCurrentAnim("glow") : this.setCurrentAnim(this.isOn ? "normal" : "off");
            ig.navigation.registerInfluencer(this)
        },
        onTopEntityJump: function(entity) {
            if (!this.condition.evaluate() && entity.party == sc.COMBATANT_PARTY.PLAYER) return false;
            entity.coll.float.height ? entity.doFloatJump(this.jumpHeightData.zVel *
                0.43, this.jumpHeightData.effectDuration + 0.1, 100) : entity.doJump(this.jumpHeightData.zVel, this.jumpHeightData.height, 100, void 0, false);
            this.effects.spawnOnTarget("jumpTrail", entity, {
                duration: this.jumpHeightData.effectDuration
            });
            this.effects.spawnOnTarget("jumpButtom", this);
            this.setCurrentAnim("glow", true, this.isOn ? "normal" : "off", true);
            return true
        },
        varsChanged: function() {
            var isOn = this.condition.evaluate();
            if (this.isOn != isOn) {
                (this.isOn = isOn) && this.effects.spawnOnTarget("jumpButtom", this);
                this.setCurrentAnim(isOn ? "normal" :
                    "off");
                this.onNavMapInfluence()
            }
        },
        onNavMapInfluence: function() {
            var bottomPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, BOTTOM_POS),
                destPos = Vec3.assign(DEST_POS, bottomPos);
            Vec3.addC(destPos, 0, -16, this.jumpHeightData.height);
            (bottomPos = ig.navigation.getNodeConnection(bottomPos, destPos, ig.NAV_CONNECTION_TYPE.UPPER_LEVEL)) && bottomPos.setExternalData("partyBlocked", !this.isOn)
        }
    });
    var JUMP_DISTANCES = {
            FALL: {
                zVel: 155,
                height: 16,
                speed: 150,
                effectDuration: 1.5
            },
            FALL_LONG: {
                zVel: 155,
                height: 16,
                speed: 130,
                effectDuration: 3
            },
            9: {
                zVel: 160,
                height: 16,
                speed: 360,
                effectDuration: 0.4
            },
            10: {
                zVel: 160,
                height: 16,
                speed: 400,
                effectDuration: 0.45
            },
            12: {
                zVel: 200,
                height: 16,
                speed: 400,
                effectDuration: 0.5
            },
            14: {
                zVel: 230,
                height: 16,
                speed: 400,
                effectDuration: 0.55
            },
            16: {
                zVel: 240,
                height: 16,
                speed: 400,
                effectDuration: 0.62
            },
            18: {
                zVel: 270,
                height: 16,
                speed: 400,
                effectDuration: 0.68
            },
            20: {
                zVel: 290,
                height: 16,
                speed: 420,
                effectDuration: 0.74
            },
            22: {
                zVel: 310,
                height: 16,
                speed: 440,
                effectDuration: 0.8
            },
            24: {
                zVel: 320,
                height: 16,
                speed: 460,
                effectDuration: 0.82
            },
            26: {
                zVel: 330,
                height: 16,
                speed: 480,
                effectDuration: 0.84
            },
            28: {
                zVel: 340,
                height: 16,
                speed: 500,
                effectDuration: 0.86
            },
            30: {
                zVel: 350,
                height: 16,
                speed: 520,
                effectDuration: 0.88
            },
            32: {
                zVel: 360,
                height: 16,
                speed: 540,
                effectDuration: 0.9
            },
            34: {
                zVel: 370,
                height: 16,
                speed: 560,
                effectDuration: 0.92
            },
            36: {
                zVel: 380,
                height: 16,
                speed: 580,
                effectDuration: 0.94
            },
            48: {
                zVel: 440,
                height: 16,
                speed: 670,
                effectDuration: 1.12
            },
            54: {
                zVel: 470,
                height: 16,
                speed: 700,
                effectDuration: 1.12
            }
        },
        PANEL_TYPES = {
            NORTH: {
                dir: {
                    x: 0,
                    y: -1
                },
                size: {
                    x: 16,
                    y: 24
                },
                tileOffset: 8,
                flipX: false,
                gfxOffset: {
                    x: 0,
                    y: -5
                }
            },
            EAST: {
                dir: {
                    x: 1,
                    y: 0
                },
                size: {
                    x: 24,
                    y: 16
                },
                tileOffset: 0,
                flipX: false,
                gfxOffset: {
                    x: 1,
                    y: 0
                }
            },
            SOUTH: {
                dir: {
                    x: 0,
                    y: 1
                },
                size: {
                    x: 16,
                    y: 24
                },
                tileOffset: 16,
                flipX: false,
                gfxOffset: {
                    x: 0,
                    y: -6
                }
            },
            WEST: {
                dir: {
                    x: -1,
                    y: 0
                },
                size: {
                    x: 24,
                    y: 16
                },
                tileOffset: 0,
                flipX: true,
                gfxOffset: {
                    x: -1,
                    y: 0
                }
            }
        };
    ig.ENTITY.JumpPanelFar = ig.AnimatedEntity.extend({
        panelType: null,
        effects: new ig.EffectSheet("puzzle"),
        jumpHeightData: null,
        condition: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                panelType: {
                    _type: "String",
                    _info: "Type of jump Panel",
                    _select: PANEL_TYPES
                },
                jumpDistance: {
                    _type: "String",
                    _info: "How height to jump (in tiles).",
                    _select: JUMP_DISTANCES
                },
                condition: {
                    _type: "VarCondition",
                    _info: "A condition for this if any."
                }
            }
        }),
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.panelType = PANEL_TYPES[extraSettings.panelType] || PANEL_TYPES.NORTH;
            this.jumpDistance = JUMP_DISTANCES[extraSettings.jumpDistance] || JUMP_DISTANCES["12"];
            this.condition = new ig.VarCondition(extraSettings.condition || "");
            this.isOn = this.condition.evaluate();
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(this.panelType.size.x, this.panelType.size.y, 0);
            this.initAnimations({
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 16,
                    height: 16,
                    offY: 16,
                    xCount: 8
                },
                gfxOffset: this.panelType.gfxOffset,
                tileOffset: this.panelType.tileOffset,
                flipX: this.panelType.flipX,
                renderMode: "lighter",
                SUB: [{
                    name: "off",
                    time: 0.2,
                    frames: []
                }, {
                    name: "normal",
                    time: 0.15,
                    frames: [4, 5, 6, 7],
                    repeat: true,
                    globalTiming: true
                }, {
                    name: "glow",
                    time: 0.05,
                    frames: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
                }]
            });
            window.wm ? this.setCurrentAnim("glow") : this.setCurrentAnim(this.condition.evaluate() ? "normal" : "off");
            ig.navigation.registerInfluencer(this)
        },
        onTopEntityJumpFar: function(entity) {
            if (!this.condition.evaluate() && entity.party == sc.COMBATANT_PARTY.PLAYER) return false;
            Vec2.assign(entity.coll.vel, this.panelType.dir);
            Vec2.length(entity.coll.vel, this.jumpDistance.speed);
            Vec2.assign(entity.coll.accelDir, this.panelType.dir);
            Vec2.assign(entity.face, this.panelType.dir);
            entity.coll.float.height ? entity.doFloatJump(10, this.jumpDistance.effectDuration + 0.1, this.jumpDistance.speed) : entity.doJump(this.jumpDistance.zVel, this.jumpDistance.height, this.jumpDistance.speed, 0, false);
            entity.coll.friction.air = 0;
            this.effects.spawnOnTarget("jumpTrailFar", entity, {
                duration: this.jumpDistance.effectDuration
            });
            this.effects.spawnOnTarget("jumpButtom",
                this);
            this.setCurrentAnim("glow", true, this.isOn ? "normal" : "off", true);
            return true
        },
        varsChanged: function() {
            var isOn = this.condition.evaluate();
            if (this.isOn != isOn) {
                (this.isOn = isOn) && this.effects.spawnOnTarget("jumpButtom", this);
                this.setCurrentAnim(isOn ? "normal" : "off");
                this.onNavMapInfluence()
            }
        },
        onNavMapInfluence: function() {
            var bottomPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, BOTTOM_POS),
                destPos = Vec3.assign(DEST_POS, bottomPos);
            Vec2.addMulF(destPos, this.panelType.dir, 16);
            (bottomPos = ig.navigation.getNodeConnection(bottomPos, destPos)) && bottomPos.setExternalData("partyBlocked", !this.isOn)
        }
    });
    var FLOAT_PANEL_TYPES = {
            DEFAULT: {
                size: {
                    x: 24,
                    y: 24
                },
                tileOffset: 0
            },
            NORTH: {
                dir: {
                    x: 0,
                    y: -1
                },
                size: {
                    x: 24,
                    y: 24
                },
                tileOffset: 1
            },
            EAST: {
                dir: {
                    x: 1,
                    y: 0
                },
                size: {
                    x: 24,
                    y: 24
                },
                tileOffset: 4
            },
            SOUTH: {
                dir: {
                    x: 0,
                    y: 1
                },
                size: {
                    x: 24,
                    y: 24
                },
                tileOffset: 2
            },
            WEST: {
                dir: {
                    x: -1,
                    y: 0
                },
                size: {
                    x: 24,
                    y: 24
                },
                tileOffset: 3
            }
        },
        FLOAT_JUMP_DISTANCES = {
            4: {
                zVel: 185,
                height: 32,
                speed: 175,
                effectDuration: 0.4
            },
            "4_2": {
                zVel: 190,
                height: 32,
                speed: 190,
                effectDuration: 0.4
            },
            8: {
                zVel: 250,
                height: 48,
                speed: 260,
                effectDuration: 0.8
            }
        };
    ig.ENTITY.JumpPanelFloat = ig.AnimatedEntity.extend({
        panelType: null,
        effects: new ig.EffectSheet("puzzle"),
        jumpHeightData: null,
        condition: null,
        dir: null,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                panelType: {
                    _type: "String",
                    _info: "Type of jump Panel",
                    _select: FLOAT_PANEL_TYPES
                },
                jumpDistance: {
                    _type: "String",
                    _info: "How height to jump (in tiles).",
                    _select: FLOAT_JUMP_DISTANCES
                },
                condition: {
                    _type: "VarCondition",
                    _info: "A condition for this if any."
                }
            }
        }),
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.coll.shadow.size = 24;
            this.panelType = FLOAT_PANEL_TYPES[extraSettings.panelType] || FLOAT_PANEL_TYPES.DEFAULT;
            this.jumpDistance = FLOAT_JUMP_DISTANCES[extraSettings.jumpDistance] || FLOAT_JUMP_DISTANCES["4"];
            this.condition = new ig.VarCondition(extraSettings.condition ||
                "");
            this.isOn = this.condition.evaluate();
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(this.panelType.size.x, this.panelType.size.y, 0);
            this.initAnimations({
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 24,
                    height: 24,
                    offX: 128 + this.panelType.tileOffset * 24,
                    offY: 144,
                    xCount: 2
                },
                SUB: [{
                    name: "off",
                    time: 0.2,
                    frames: []
                }, {
                    name: "normal",
                    time: 0.1,
                    frames: [0],
                    repeat: true,
                    globalTiming: true
                }, {
                    name: "glow",
                    time: 0.1,
                    frames: [0]
                }]
            });
            window.wm ? this.setCurrentAnim("glow") : this.setCurrentAnim(this.condition.evaluate() ?
                "normal" : "off");
            ig.navigation.registerInfluencer(this)
        },
        collideWith: function(entity) {
            if (!this.condition.evaluate() && entity.party == sc.COMBATANT_PARTY.PLAYER) return false;
            if (this.panelType.dir) {
                Vec2.assign(entity.coll.vel, this.panelType.dir);
                Vec2.assign(entity.coll.accelDir, this.panelType.dir);
                Vec2.assign(entity.face, this.panelType.dir)
            }
            Vec2.length(entity.coll.vel, this.jumpDistance.speed);
            entity.coll.float.height ? entity.doFloatJump(10, this.jumpDistance.effectDuration + 0.1, this.jumpDistance.speed) : entity.doJump(this.jumpDistance.zVel, this.jumpDistance.height,
                this.jumpDistance.speed, 0, false);
            entity.coll.friction.air = 0;
            this.effects.spawnOnTarget("jumpTrailFar", entity, {
                duration: this.jumpDistance.effectDuration
            });
            this.effects.spawnOnTarget("jumpButtom", this)
        },
        varsChanged: function() {
            var isOn = this.condition.evaluate();
            if (this.isOn != isOn) {
                (this.isOn = isOn) && this.effects.spawnOnTarget("jumpButtom", this);
                this.setCurrentAnim(isOn ? "normal" : "off");
                this.onNavMapInfluence()
            }
        },
        onNavMapInfluence: function() {
            var bottomPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, BOTTOM_POS),
                destPos = Vec3.assign(DEST_POS, bottomPos);
            this.panelType.dir &&
                Vec2.addMulF(destPos, this.panelType.dir, 16);
            (bottomPos = ig.navigation.getNodeConnection(bottomPos, destPos)) && bottomPos.setExternalData("partyBlocked", !this.isOn)
        }
    })
});
ig.baked = !0;
