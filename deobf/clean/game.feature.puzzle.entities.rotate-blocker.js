/**
 * game.feature.puzzle.entities.rotate-blocker
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.rotate-blocker")`.
 *
 * `ig.ENTITY.RotateBlocker`: a triangular slope blocker that the player can
 * interact with to rotate between four directions (NE/SE/SW/NW). A
 * `VarCondition` controls whether it is active (blocking). The direction
 * change plays a "turn" animation and rotates the sprite.
 */
ig.module("game.feature.puzzle.entities.rotate-blocker")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.interact.map-interact")
    .defines(function () {

    sc.ROTATE_BLOCKER_DIR = {
        NE: 0,
        SE: 1,
        SW: 2,
        NW: 3
    };

    var DIR_CONFIG = [{
        angle: 0,
        collShape: ig.COLLSHAPE.SLOPE_NE,
        anim: "ne"
    }, {
        angle: 0.25,
        collShape: ig.COLLSHAPE.SLOPE_SE,
        anim: "se"
    }, {
        angle: 0.5,
        collShape: ig.COLLSHAPE.SLOPE_SW,
        anim: "sw"
    }, {
        angle: 0.75,
        collShape: ig.COLLSHAPE.SLOPE_NW,
        anim: "nw"
    }];

    ig.ENTITY.RotateBlocker = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true,
                    _optional: true
                },
                dir: {
                    _type: "String",
                    _info: "Start direction of triangular block shape",
                    _select: sc.ROTATE_BLOCKER_DIR
                },
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for RotateBlocker to be active"
                }
            }
        }),
        active: true,
        currentDir: 0,
        currentAngle: 0,
        destAngle: 0,
        turnTimer: 0,
        interactIcons: {
            vertical: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24, 120, 24), {
                FOCUS: [0, 1, 2, 2],
                NEAR: [3]
            }, 0.133)
        },
        effects: {
            sheet: null
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.setSize(32, 32, 32);
            this.currentDir = sc.ROTATE_BLOCKER_DIR[settings.dir] || sc.ROTATE_BLOCKER_DIR.NE;
            var dirConfig = DIR_CONFIG[this.currentDir];
            this.destAngle = this.currentAngle = dirConfig.angle;
            this.coll.shape = dirConfig.collShape;
            var rotateStyle = ig.mapStyle.get("rotateBlocker");
            if (rotateStyle) this.initAnimations({
                namedSheets: {
                    ground: {
                        src: rotateStyle.sheet,
                        width: 32,
                        height: 32,
                        offX: rotateStyle.x,
                        offY: rotateStyle.y,
                        xCount: 1
                    },
                    block: {
                        src: rotateStyle.sheet,
                        width: 32,
                        height: 64,
                        offX: rotateStyle.x + 32,
                        offY: rotateStyle.y
                    }
                },
                SUB: [{
                    sheet: "ground",
                    shapeType: "Z_FLAT",
                    frames: [1],
                    SUB: [{
                        name: "off"
                    }, {
                        name: "ne"
                    }, {
                        name: "se"
                    }, {
                        name: "sw"
                    }, {
                        name: "nw"
                    }, {
                        name: "turn"
                    }]
                }, {
                    sheet: "block",
                    renderMode: "lighter",
                    SUB: [{
                        name: "ne",
                        frames: [1],
                        flipX: false
                    }, {
                        name: "se",
                        frames: [0],
                        flipX: false,
                        wallY: 1
                    }, {
                        name: "sw",
                        frames: [0],
                        flipX: true,
                        wallY: 1
                    }, {
                        name: "nw",
                        frames: [1],
                        flipX: true
                    }]
                }, {
                    sheet: "ground",
                    shapeType: "Y_FLAT",
                    renderMode: "lighter",
                    frames: [0],
                    SUB: [{
                        name: "turn",
                        offset: {
                            z: 1
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 4
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 8
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 12
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 16
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 20
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 24
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 28
                        }
                    }, {
                        name: "turn",
                        offset: {
                            z: 32
                        }
                    }]
                }]
            });
            this.setCurrentAnim(dirConfig.anim);
            this.interactEntry = new sc.MapInteractEntry(this, this, this.interactIcons.vertical, sc.INTERACT_Z_CONDITION.SAME_Z, false);
            this.effects.sheet = new ig.EffectSheet("puzzle.rotate-blocker");
            this.condition = new ig.VarCondition(settings.condition)
        },

        show: function (show) {
            this.parent(show);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            window.wm || this.setActive(this.condition.evaluate(), true);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },

        onHideRequest: function () {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            })
        },

        setActive: function (active, instant) {
            this.turnTimer = 0;
            this.active = active;
            if (this.effects.deactHandle) {
                this.effects.deactHandle.setCallback(null);
                this.effects.deactHandle = null
            }
            if (this.active) {
                this.coll.setType(ig.COLLTYPE.BLOCK);
                this.setCurrentAnim(DIR_CONFIG[this.currentDir].anim);
                sc.mapInteract.addEntry(this.interactEntry);
                instant || this.effects.sheet.spawnOnTarget("appear", this, {
                    spriteFilter: [1]
                })
            } else {
                this.coll.setType(ig.COLLTYPE.TRIGGER);
                sc.mapInteract.removeEntry(this.interactEntry);
                instant ? this.setCurrentAnim("off") : this.effects.deactHandle = this.effects.sheet.spawnOnTarget("disappear", this, {
                    spriteFilter: [1]
                })
            }
        },

        onEffectEvent: function (effect) {
            if (effect == this.effects.deactHandle) {
                this.effects.deactHandle = null;
                this.setCurrentAnim("off")
            } else if (effect == this.effects.hideHandle) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },

        onKill: function (parent) {
            this.effects.sheet.decreaseRef();
            this.parent(parent)
        },

        onInteraction: function () {
            this.turn((this.currentDir + 1) % 4);
            var player = ig.game.playerEntity,
                action = new ig.Action("openChest", [{
                    type: "SET_WALK_ANIMS",
                    config: "normal"
                }, {
                    type: "SET_RELATIVE_SPEED",
                    value: 0.5
                }, {
                    type: "SET_FACE_TO_ENTITY",
                    entity: this,
                    rotate: true
                }, {
                    type: "SET_FACE_FIX",
                    value: true
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "chestOpen"
                }, {
                    type: "MOVE_TO_ENTITY_DISTANCE",
                    entity: this,
                    min: 28,
                    max: 40,
                    maxTime: 0.2
                }, {
                    type: "WAIT",
                    time: 0.2
                }]);
            action.eventAction = true;
            player.setAction(action);
            return false
        },

        ballHit: function (ball) {
            ball.isBall && ball.cleanDirection(0.025);
            return false
        },

        turn: function (dir) {
            this.effects.sheet.spawnOnTarget("rotate", this);
            this.currentDir = dir;
            this.currentAngle = this.destAngle % 1;
            var dirConfig = DIR_CONFIG[this.currentDir];
            this.destAngle = dirConfig.angle || 1;
            this.coll.shape = dirConfig.collShape;
            this.setCurrentAnim("turn");
            this.turnTimer = 0.2 + 0.1
        },

        update: function () {
            if (this.turnTimer) {
                this.turnTimer = this.turnTimer - ig.system.tick;
                if (this.turnTimer <= 0) {
                    this.turnTimer = 0;
                    this.setCurrentAnim(DIR_CONFIG[this.currentDir].anim);
                    this.currentAngle = this.destAngle % 1
                }
            }
            this.parent()
        },

        updateSprites: function () {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.turnTimer)
                for (var lastIndex = this.sprites.length - 1, step = 0.1 / (lastIndex - 1), offset = 0; lastIndex--;) {
                    var sprite = this.sprites[lastIndex + 1],
                        progress = 1 - ((this.turnTimer - 0.1 + offset) / 0.2).limit(0, 1),
                        eased = KEY_SPLINES.EASE_IN_OUT.get(progress),
                        angle = this.currentAngle * (1 - eased) + this.destAngle * eased;
                    sprite.setPivot(16, 16);
                    sprite.setTransform(1, 1, angle * 2 * Math.PI);
                    offset = offset + step
                }
        },

        varsChanged: function () {
            var active = this.condition.evaluate();
            active != this.active && this.setActive(active)
        }
    })
});
ig.baked = !0;