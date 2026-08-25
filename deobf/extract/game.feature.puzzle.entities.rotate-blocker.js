ig.module("game.feature.puzzle.entities.rotate-blocker").requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.interact.map-interact").defines(function() {
    sc.ROTATE_BLOCKER_DIR = {
        NE: 0,
        SE: 1,
        SW: 2,
        NW: 3
    };
    var b = [{
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
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.setSize(32, 32, 32);
            this.currentDir = sc.ROTATE_BLOCKER_DIR[e.dir] || sc.ROTATE_BLOCKER_DIR.NE;
            a = b[this.currentDir];
            this.destAngle = this.currentAngle = a.angle;
            this.coll.shape = a.collShape;
            (d = ig.mapStyle.get("rotateBlocker")) && this.initAnimations({
                namedSheets: {
                    ground: {
                        src: d.sheet,
                        width: 32,
                        height: 32,
                        offX: d.x,
                        offY: d.y,
                        xCount: 1
                    },
                    block: {
                        src: d.sheet,
                        width: 32,
                        height: 64,
                        offX: d.x + 32,
                        offY: d.y
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
            this.setCurrentAnim(a.anim);
            this.interactEntry = new sc.MapInteractEntry(this, this, this.interactIcons.vertical, sc.INTERACT_Z_CONDITION.SAME_Z, false);
            this.effects.sheet = new ig.EffectSheet("puzzle.rotate-blocker");
            this.condition = new ig.VarCondition(e.condition)
        },
        show: function(a) {
            this.parent(a);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle =
                    null
            }
            window.wm || this.setActive(this.condition.evaluate(), true);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },
        onHideRequest: function() {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            })
        },
        setActive: function(a, d) {
            this.turnTimer = 0;
            this.active = a;
            if (this.effects.deactHandle) {
                this.effects.deactHandle.setCallback(null);
                this.effects.deactHandle = null
            }
            if (this.active) {
                this.coll.setType(ig.COLLTYPE.BLOCK);
                this.setCurrentAnim(b[this.currentDir].anim);
                sc.mapInteract.addEntry(this.interactEntry);
                d || this.effects.sheet.spawnOnTarget("appear", this, {
                    spriteFilter: [1]
                })
            } else {
                this.coll.setType(ig.COLLTYPE.TRIGGER);
                sc.mapInteract.removeEntry(this.interactEntry);
                d ? this.setCurrentAnim("off") : this.effects.deactHandle = this.effects.sheet.spawnOnTarget("disappear", this, {
                    spriteFilter: [1]
                })
            }
        },
        onEffectEvent: function(a) {
            if (a == this.effects.deactHandle) {
                this.effects.deactHandle = null;
                this.setCurrentAnim("off")
            } else if (a ==
                this.effects.hideHandle) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },
        onKill: function(a) {
            this.effects.sheet.decreaseRef();
            this.parent(a)
        },
        onInteraction: function() {
            this.turn((this.currentDir + 1) % 4);
            var a = ig.game.playerEntity,
                b = new ig.Action("openChest", [{
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
            b.eventAction = true;
            a.setAction(b);
            return false
        },
        ballHit: function(a) {
            a.isBall && a.cleanDirection(0.025);
            return false
        },
        turn: function(a) {
            this.effects.sheet.spawnOnTarget("rotate", this);
            this.currentDir = a;
            this.currentAngle = this.destAngle % 1;
            a = b[this.currentDir];
            this.destAngle = a.angle || 1;
            this.coll.shape = a.collShape;
            this.setCurrentAnim("turn");
            this.turnTimer = 0.2 + 0.1
        },
        update: function() {
            if (this.turnTimer) {
                this.turnTimer = this.turnTimer - ig.system.tick;
                if (this.turnTimer <=
                    0) {
                    this.turnTimer = 0;
                    this.setCurrentAnim(b[this.currentDir].anim);
                    this.currentAngle = this.destAngle % 1
                }
            }
            this.parent()
        },
        updateSprites: function() {
            ig.AnimatedEntity.prototype.updateSprites.call(this);
            if (this.turnTimer)
                for (var a = this.sprites.length - 1, b = 0.1 / (a - 1), c = 0; a--;) {
                    var e = this.sprites[a + 1],
                        f = 1 - ((this.turnTimer - 0.1 + c) / 0.2).limit(0, 1),
                        f = KEY_SPLINES.EASE_IN_OUT.get(f),
                        f = this.currentAngle * (1 - f) + this.destAngle * f;
                    e.setPivot(16, 16);
                    e.setTransform(1, 1, f * 2 * Math.PI);
                    c = c + b
                }
        },
        varsChanged: function() {
            var a = this.condition.evaluate();
            a != this.active && this.setActive(a)
        }
    })
});
ig.baked = !0;
