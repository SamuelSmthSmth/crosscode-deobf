/**
 * game.feature.combat.combat-action-steps
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-action-steps")`.
 *
 * The 114 combat `ig.ACTION_STEP.*` classes used inside enemy/combat-art
 * action scripts: targeting & facing, movement, hitbox forces (tackle, sweep,
 * push/pull, direct hits), proxy spawning/modification, shields, HP/SP, stun,
 * respawn, enemy events/spawning, and the two helper registries
 * (`COMBAT_STEP_TARGET` + entity finders). Single-letter locals were renamed
 * scope-aware (`a` → `data` in `init`, `a` → `entity` in `run`/`start`,
 * etc.).
 */
ig.module("game.feature.combat.combat-action-steps").requires("impact.base.animation", "impact.base.action", "impact.base.entity", "game.feature.combat.entities.drop", "game.feature.combat.entities.combatant", "game.feature.combat.entities.combat-proxy", "impact.feature.effect.effect-steps", "game.feature.combat.combat-sweep").defines(function() {
    function isCombatParams(entity) {
        return entity instanceof sc.CombatParams
    }

    function findProxyInGroup(attached, group) {
        for (var i = attached.length; i--;) {
            var entity = attached[i];
            if (entity instanceof sc.CombatProxyEntity && entity.group == group) return entity
        }
        return null
    }
    var COMBAT_STEP_TARGET = {
            SELF: function(entity) {
                return entity
            },
            PROXY_OWNER: function(entity) {
                return entity.getCombatantRoot()
            },
            PROXY_SRC: function(entity) {
                return entity.sourceEntity
            },
            TARGET: function(entity) {
                return entity.getTarget()
            }
        },
        tmpVec3 = Vec3.create();
    ig.ACTION_STEP.FACE_TO_TARGET = ig.ActionStepBase.extend({
        value: false,
        immediately: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "True if enemy should always look at the target."
                },
                immediately: {
                    _type: "Boolean",
                    _info: "True if enemy should always look at the target IMMEDIATELY.",
                    _optional: true
                },
                posOffset: {
                    _type: "Vec2",
                    _info: "Offset to target position used to set face target (will only be used for immediate face setting)",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.value = data.value;
            this.immediately = data.immediately || false;
            this.posOffset = data.posOffset || null
        },
        run: function(entity) {
            entity.faceToTarget.active = this.value;
            entity.forceFaceDirFixed = this.value;
            var b = entity.getTarget();
            if (this.immediately && b) {
                b = Vec2.sub(b.getCenter(), entity.getCenter());
                this.posOffset && Vec2.add(b, this.posOffset);
                Vec2.isZero(b) && Vec2.assignC(b, 0, 1);
                entity.faceToTarget.offset && Vec2.rotate(b,
                    entity.faceToTarget.offset * 2 * Math.PI);
                Vec2.assign(entity.face, b)
            }
            return true
        }
    });
    ig.ACTION_STEP.UNLOCK_ENEMY = ig.ActionStepBase.extend({
        enemy: null,
        asSpecial: null,
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "EnemySearch",
                    _info: "Enemy to unlock, note that this enemy, use this only for special enemies."
                },
                asSpecial: {
                    _type: "Boolean",
                    _info: "if true 'special' will be displayed instead of kill count",
                    _default: true
                }
            }
        }),
        init: function(data) {
            this.enemy = data.enemy;
            this.asSpecial = data.asSpecial == void 0 ? true : data.asSpecial
        },
        run: function() {
            sc.stats.setMap("combat",
                "kill" + this.enemy, this.asSpecial ? -1 : 1);
            sc.stats.setMap("combat", "enemyCompletionRate", sc.combat.getTotalEnemiesFound(true));
            return true
        }
    });
    ig.ACTION_STEP.FACE_TO_TARGET_OFFSET = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Offset to target direction to look into"
                }
            }
        }),
        init: function(data) {
            this.value = data.value
        },
        run: function(entity) {
            entity.faceToTarget.offset = this.value;
            return true
        }
    });
    ig.ACTION_STEP.FACE_TO_TARGET_SPEED = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Speed for face to target. Default is 2",
                    _default: 2
                }
            }
        }),
        init: function(data) {
            this.value = data.value
        },
        run: function(entity) {
            entity.faceToTarget.speed = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_FACE_TARGET_PREDICT = ig.ActionStepBase.extend({
        projectileSpeed: false,
        _wm: new ig.Config({
            attributes: {
                projectileSpeed: {
                    _type: "Number",
                    _info: "Speed of projectile to be thrown"
                }
            }
        }),
        init: function(data) {
            this.projectileSpeed = data.projectileSpeed
        },
        run: function(entity) {
            var b = entity.getTarget();
            if (b) {
                var c = b.getCenter(i),
                    d = entity.getCenter(l),
                    e = Vec2.distance(c,
                        d) / this.projectileSpeed;
                Vec2.addMulF(c, b.coll.vel, e);
                Vec2.sub(c, d, entity.face)
            }
            return true
        }
    });
    ig.ACTION_STEP.FACE_ALIGN = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "Where is player found?",
                    _select: d,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.target = d[data.target] || d.SELF
        },
        run: function(entity) {
            var b = this.target(entity);
            b && b.face && Vec2.assign(entity.face, b.face);
            return true
        }
    });
    ig.ACTION_STEP.SHOW_THROW_FX = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                charged: {
                    _type: "Boolean",
                    _info: "If true: show charged effect"
                },
                charClass: {
                    _type: "String",
                    _info: "If true: show charged effect",
                    _select: sc.THROW_SOUND_CLASS,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.charged = data.charged;
            this.charClass = sc.THROW_SOUND_CLASS[data.charClass] || null
        },
        start: function(entity) {
            var b = sc.ELEMENT.NEUTRAL;
            if (entity instanceof sc.PlayerBaseEntity) b = entity.model.currentElementMode;
            else if (entity.elementModes) b = entity.elementModes.current;
            sc.combat.showThrowEffect(entity, b, this.charged, this.charClass)
        }
    });
    ig.ACTION_STEP.COMBAT_ART_CHARGE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element of the charge",
                    _select: sc.ELEMENT
                },
                level: {
                    _type: "Integer",
                    _info: "Level to charge to"
                }
            }
        }),
        init: function(data) {
            this.element = sc.ELEMENT[data.element];
            this.level = data.level
        },
        start: function(entity) {
            entity.stepData.fx = new sc.CombatCharge(entity, false, true, true);
            entity.stepData.level = 0;
            entity.addActionAttached(entity.stepData.fx);
            this.chargeStep(entity)
        },
        chargeStep: function(a) {
            a.stepData.level++;
            a.stepTimer = a.stepData.level < this.level ? a.stepTimer + 0.4 : a.stepTimer + 0.3;
            a.stepData.fx.charge(this.element, a.stepData.level)
        },
        run: function(entity) {
            if (entity.stepTimer <=
                0) {
                if (entity.stepData.level == this.level) {
                    entity.stepData.fx.stop();
                    entity.params.consumeSp(sc.PLAYER_SP_COST[this.level - 1]);
                    return true
                }
                this.chargeStep(entity)
            }
            return false
        }
    });
    ig.ACTION_STEP.MOVE_TO_DISTANCE = ig.ActionStepBase.extend({
        min: 0,
        max: 0,
        maxTime: 0,
        offset: null,
        forceTime: false,
        _wm: new ig.Config({
            attributes: {
                min: {
                    _type: "Number",
                    _info: "Minimum distance to move to"
                },
                max: {
                    _type: "Number",
                    _info: "Maximum distance to move to"
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time to move"
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset to target.",
                    _optional: true
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "Keep moving, never stop until maxTime has been reached"
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed in which entity will rotate to target. In rotations per seconds.",
                    _default: 2,
                    _optional: true
                },
                missReactTime: {
                    _type: "Number",
                    _info: "Reaction time to stop tackle after target has been clearly missed",
                    _optional: true
                },
                collideCancel: {
                    _type: "Number",
                    _info: "If defined: if angle to collided wall is lower than this value, cancel step",
                    _optional: true
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving forward"
                },
                flipOffsetLeft: {
                    _type: "Boolean",
                    _info: "If true: Flip offset x when facing left.",
                    _optional: true
                },
                keepFace: {
                    _type: "Boolean",
                    _info: "If true: Keep face direction the same, even with rotateSpeed on",
                    _optional: true
                },
                waitUntil: {
                    _type: "VarCondition",
                    _info: "If defined: Keep moving until condition evaluates to false",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.min = data.min;
            this.max = data.max;
            this.maxTime = data.maxTime;
            this.offset = data.offset ||
                null;
            this.forceTime = data.forceTime || false;
            this.rotateSpeed = data.rotateSpeed || 0;
            this.missReactTime = data.missReactTime;
            this.collideCancel = data.collideCancel;
            this.stopBeforeEdge = data.stopBeforeEdge;
            this.flipOffsetLeft = data.flipOffsetLeft;
            this.keepFace = data.keepFace;
            this.waitUntil = data.waitUntil ? new ig.VarCondition(data.waitUntil) : null
        },
        start: function(entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime;
            if (this.rotateSpeed)
                if (this.keepFace) {
                    var b = entity.stepData.moveDir = Vec2.create(),
                        c = entity.getTarget();
                    if (c) {
                        ig.CollTools.getDistVec2(entity.coll, c.coll,
                            b);
                        if (this.offset) {
                            b.x = b.x + (this.flipOffsetLeft && entity.face.x < 0 ? -this.offset.x : this.offset.x);
                            b.y = b.y + this.offset.y
                        }
                    }
                } else Vec2.assign(entity.coll.accelDir, entity.face)
        },
        run: function(entity) {
            var b = entity.getTarget();
            if (!b) return true;
            var c = this.keepFace ? entity.stepData.moveDir : entity.face,
                d = Vec2.sub(b.getCenter(), entity.getCenter());
            if (this.offset) {
                d.x = d.x + (this.flipOffsetLeft && entity.face.x < 0 ? -this.offset.x : this.offset.x);
                d.y = d.y + this.offset.y
            }
            var e = Vec2.length(d);
            e < this.min && Vec2.mulC(d, -1);
            if (this.rotateSpeed) {
                Vec2.rotateToward(c, d, this.rotateSpeed *
                    Math.PI * 2 * ig.system.tick);
                Vec2.assign(entity.coll.accelDir, c)
            } else Vec2.assign(entity.coll.accelDir, d);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0);
                if (this.collideCancel) entity.stepTimer = 0
            }
            if (this.collideCancel && ig.CollTools.hasWallCollide(entity.coll, this.collideCancel)) entity.stepTimer = 0;
            if (this.missReactTime != void 0 && this.missReactTime != null && entity.stepTimer > this.missReactTime) {
                ig.CollTools.getDistVec2(entity.coll, b.coll, r);
                if (this.offset) {
                    r.x =
                        r.x + (this.flipOffsetLeft && entity.face.x < 0 ? -this.offset.x : this.offset.x);
                    r.y = r.y + this.offset.y
                }
                if (Vec2.angle(r, c) > Math.PI / 2) entity.stepTimer = this.missReactTime
            }
            if (this.min <= e && e <= this.max) {
                if (!this.forceTime && !this.waitUntil) return true;
                Vec2.assignC(entity.coll.accelDir, 0, 0)
            }
            return this.waitUntil ? this.waitUntil.evaluate() : entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.MOVE_TO_PINPOINT = ig.ActionStepBase.extend({
        maxTime: 0,
        offset: null,
        forceTime: false,
        _wm: new ig.Config({
            attributes: {
                moveTime: {
                    _type: "Number",
                    _info: "Time of movement. Entity will try to move exactly at target during that time"
                },
                postTime: {
                    _type: "Number",
                    _info: "Amount of time still expected to move after this step. Approach is calculated that way"
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset to target.",
                    _optional: true
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed in which entity will rotate to target. In rotations per seconds.",
                    _default: 2,
                    _optional: true
                },
                useAccelDir: {
                    _type: "Boolean",
                    _info: "If true, use current accelDir to determine initial movement direction. Use this to continue rotation from precious PINPOINT step"
                },
                maxSpeed: {
                    _type: "Number",
                    _info: "Maximum velocity. Velocity will always be adapted to hit target at end of moveTime + postTime"
                },
                maxSpeedEnd: {
                    _type: "Number",
                    _info: "Maximum velocity at end of movement. Speed will linear interpolate to this value if defined."
                },
                underEstimation: {
                    _type: "Number",
                    _info: "How much movement duration should be underestimated for speed adjustment. Lower value makes hitting target more reliable, but leads to initially fast movement",
                    _default: 0.75,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.moveTime = data.moveTime;
            this.postTime = data.postTime || 0;
            this.offset = data.offset || null;
            this.rotateSpeed = data.rotateSpeed || 0;
            this.useAccelDir = data.useAccelDir || false;
            this.maxSpeed = data.maxSpeed || 200;
            this.maxSpeedEnd = data.maxSpeedEnd || 0;
            this.underEstimation = data.underEstimation || 0.75
        },
        start: function(entity) {
            entity.stepTimer = this.moveTime;
            if (this.rotateSpeed) {
                if (this.useAccelDir) entity.stepData.lastDir = Vec2.create(entity.coll.accelDir);
                if (!this.useAccelDir || Vec2.isZero(entity.stepData.lastDir)) {
                    entity.stepData.lastDir = this._calculateDir(Vec2.create(), entity);
                    entity.stepData.lastDir && Vec2.assign(entity.coll.accelDir,
                        entity.stepData.lastDir)
                }
            }
        },
        _calculateDir: function(a, b) {
            var c = b.getTarget();
            if (!c) return null;
            ig.CollTools.getDistVec2(b.coll, c.coll, a);
            this.offset && Vec2.add(a, this.offset);
            return a
        },
        run: function(entity) {
            var b = this._calculateDir(r, entity);
            if (!b) return true;
            var c = Vec2.length(b);
            if (c <= 4) Vec2.assignC(entity.coll.accelDir, 0, 0);
            else if (this.rotateSpeed) {
                Vec2.assign(entity.coll.accelDir, entity.stepData.lastDir);
                Vec2.isZero(entity.coll.accelDir) ? Vec2.assign(entity.coll.accelDir, b) : Vec2.rotateToward(entity.coll.accelDir, b, this.rotateSpeed * Math.PI * 2 *
                    ig.system.tick);
                Vec2.assign(entity.stepData.lastDir, entity.coll.accelDir)
            } else Vec2.assign(entity.coll.accelDir, b);
            c = c / ((entity.stepTimer + this.postTime) * this.underEstimation);
            if (this.rotateSpeed) {
                b = 1 - Vec2.angle(entity.stepData.lastDir, b) / Math.PI * 2;
                c = Math.max(0, c * b)
            }
            b = this.maxSpeed;
            this.maxSpeedEnd && (b = entity.stepTimer / this.moveTime * (this.maxSpeed - this.maxSpeedEnd) + this.maxSpeedEnd);
            c > b && (c = b);
            entity.coll.maxVel = c;
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.MOVE_ALIGN_DIR = ig.ActionStepBase.extend({
        maxTime: 0,
        dir: null,
        forceTime: false,
        _wm: new ig.Config({
            attributes: {
                moveTime: {
                    _type: "Number",
                    _info: "Time of movement. Entity will move to target position projected along alignDir"
                },
                alignDir: {
                    _type: "Number",
                    _info: "Dir among which entity can move. If not defined: Use entity face dir",
                    _optional: true
                },
                aimFaceRotate: {
                    _type: "Number",
                    _info: "Position will be calculated based on an aiming direction of alignDir rotated toward the target by THIS much (1=full rotation). 0.25 by default",
                    _optional: true
                },
                maxDist: {
                    _type: "Number",
                    _info: "Maximum Distance to go along alignDir"
                },
                maxOppDist: {
                    _type: "Number",
                    _info: "Maximum Distance to go along opposite alignDir"
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset to target.",
                    _optional: true
                },
                interpolate: {
                    _type: "Boolean",
                    _info: "If true: Interpolate position to reach destination at end of moveTime. Otherwise: Always be set at destination"
                },
                waitUntil: {
                    _type: "VarCondition",
                    _info: "If defined: continue spinning until condition evaluates to true. Duration is minimum wait",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.moveTime = data.moveTime;
            this.alignDir = data.alignDir;
            this.aimFaceRotate =
                data.aimFaceRotate || 0.25;
            this.maxDist = data.maxDist || 0;
            this.maxOppDist = data.maxOppDist || 0;
            this.offset = data.offset || null;
            this.interpolate = data.interpolate || false;
            this.waitUntil = data.waitUntil ? new ig.VarCondition(data.waitUntil) : null
        },
        start: function(entity) {
            entity.stepTimer = this.moveTime;
            entity.stepData.startPos = entity.getCenter()
        },
        run: function(entity) {
            var b = Vec2.assign(i, this.alignDir || entity.face);
            Vec2.normalize(b);
            var c = entity.getTarget();
            if (!c) return true;
            c = c.getCenter(l);
            this.offset && Vec2.add(c, this.offset);
            var d = Vec2.sub(c, entity.stepData.startPos, o),
                e;
            if (Math.abs(this.aimFaceRotate) === 0.25) e = Vec2.dot(d, b);
            else {
                e = this.aimFaceRotate;
                Vec2.areClockwise(b, d) === e > 0 && (e = -e);
                d = Vec2.assign(o, b);
                Vec2.rotate(d, e * Math.PI * 2);
                e = Line2.intersectRayWeight(entity.stepData.startPos, b, c, d)
            }
            e = e.limit(-this.maxOppDist, this.maxDist);
            c = Vec2.assign(o, entity.stepData.startPos);
            Vec2.addMulF(c, b, e);
            Vec2.addMulF(c, entity.coll.size, -0.5);
            if (this.interpolate) {
                b = (1 - entity.stepTimer / this.moveTime).limit(0, 1);
                Vec2.lerp(entity.stepData.startPos, c, b, c)
            }
            entity.setPos(c.x, c.y, entity.coll.pos.z);
            return this.waitUntil ?
                this.waitUntil.evaluate() : entity.stepTimer <= 0
        }
    });
    var e = {
        TARGET_DISTANCE: 1,
        SELF_DISTANCE: 2
    };
    ig.ACTION_STEP.SET_ATTRIB_CLOSEST_ENTITY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                entityAttrib: {
                    _type: "String",
                    _info: "Name of attrib to store entity",
                    _optional: true
                },
                indexAttrib: {
                    _type: "String",
                    _info: "Name of attrib to store entity index",
                    _optional: true
                },
                entities: {
                    _type: "Array",
                    _info: "List of entities. Will move to one of those",
                    _sub: {
                        _type: "Entity"
                    }
                },
                selectBy: {
                    _type: "String",
                    _info: "How entity is selected",
                    _select: e
                }
            }
        }),
        init: function(data) {
            this.entityAttrib = data.entityAttrib;
            this.indexAttrib = data.indexAttrib;
            this.entities = data.entities;
            this.selectBy = e[data.selectBy]
        },
        start: function(entity) {
            var b;
            b = this.entities;
            for (var c = -1, d = 0, f = b.length, g = this.selectBy == e.TARGET_DISTANCE ? entity.getTarget() : entity; f--;) {
                var h = ig.Event.getEntity(b[f]);
                if (h) {
                    h = ig.CollTools.getGroundDistance(g.coll, h.coll);
                    if (c == -1 || h < d) {
                        c = f;
                        d = h
                    }
                }
            }
            b = c;
            this.indexAttrib && entity.setAttribute(this.indexAttrib, b);
            this.entityAttrib && entity.setAttribute(this.entityAttrib, this.entities[b])
        }
    });
    var f = {
        NORTH: {
            delta: {
                x: 0,
                y: -1
            },
            orth: {
                x: 1,
                y: 0
            }
        },
        EAST: {
            delta: {
                x: 1,
                y: 0
            },
            orth: {
                x: 0,
                y: 1
            }
        },
        SOUTH: {
            delta: {
                x: 0,
                y: 1
            },
            orth: {
                x: 1,
                y: 0
            }
        },
        WEST: {
            delta: {
                x: -1,
                y: 0
            },
            orth: {
                x: 0,
                y: 1
            }
        },
        HORIZONTAL_CLOSE: {
            delta: {
                x: 1,
                y: 0
            },
            orth: {
                x: 0,
                y: 1
            },
            close: true
        },
        HORIZONTAL_FAR: {
            delta: {
                x: 1,
                y: 0
            },
            orth: {
                x: 0,
                y: 1
            },
            far: true
        },
        VERTICAL_CLOSE: {
            delta: {
                x: 0,
                y: 1
            },
            orth: {
                x: 1,
                y: 0
            },
            close: true
        },
        VERTICAL_FAR: {
            delta: {
                x: 0,
                y: 1
            },
            orth: {
                x: 1,
                y: 0
            },
            far: true
        }
    };
    ig.ACTION_STEP.MOVE_TO_ATTRIB_ENTITY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                attrib: {
                    _type: "String",
                    _info: "Name of attribute that includes index of entity"
                },
                positionType: {
                    _type: "String",
                    _info: "How to position entity",
                    _select: f
                },
                distance: {
                    _type: "Number",
                    _info: "Distance to entity along position type"
                },
                orthogonalDist: {
                    _type: "Number",
                    _info: "Orthogonal distance (Sideways) - can also be negative for opposite direction."
                },
                maxOrthDelta: {
                    _type: "Number",
                    _info: "Maximum Delta Value for orthogonal movement",
                    _optional: true
                },
                adjustTarget: {
                    _type: "Boolean",
                    _info: "If true, adjust orthogonal distance to fit target"
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time to move. If 0: Move until target is reached"
                },
                forceTime: {
                    _type: "Boolean",
                    _info: "Keep moving, never stop until maxTime has been reached"
                },
                precise: {
                    _type: "Boolean",
                    _info: "If true, move to point precisely"
                },
                saveToAttrib: {
                    _type: "String",
                    _info: "If defined: don't move but instead save result position in attribute",
                    _optional: true
                },
                selectBy: {
                    _type: "String",
                    _info: "By which distance positionType is determined",
                    _select: e,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.attrib =
                data.attrib;
            this.positionType = f[data.positionType] || f.NORTH;
            this.distance = data.distance || 0;
            this.orthogonalDist = data.orthogonalDist || 0;
            this.maxOrthDelta = data.maxOrthDelta || 0;
            this.adjustTarget = data.adjustTarget || false;
            this.maxTime = data.maxTime;
            this.forceTime = data.forceTime || false;
            this.precise = data.precise || false;
            this.saveToAttrib = data.saveToAttrib || null;
            this.selectBy = e[data.selectBy] || e.SELF_DISTANCE
        },
        start: function(entity) {
            delete entity.stepData.pos;
            var b = ig.Event.getEntity(entity.getAttribute(this.attrib));
            if (b) {
                var c = b.getCenter(),
                    d = Vec2.assign(l,
                        this.positionType.delta);
                if (this.positionType.close || this.positionType.far) {
                    var f = entity.coll;
                    if (this.selectBy == e.TARGET_DISTANCE && entity.getTarget()) f = entity.getTarget().coll;
                    b = ig.CollTools.getDistVec2(b.coll, f, o);
                    b = Vec2.dot(b, d);
                    (this.positionType.close && b < 0 || this.positionType.far && b > 0) && Vec2.flip(d)
                }
                Vec2.length(d, this.distance);
                Vec2.addMulF(d, this.positionType.orth, this.orthogonalDist);
                Vec2.add(c, d);
                entity.stepData.pos = c;
                entity.stepTimer = entity.stepTimer + this.maxTime
            }
        },
        run: function(entity) {
            var b = entity.stepData.pos;
            if (!b) return true;
            var c = entity.getTarget();
            if (this.adjustTarget && c) {
                c = c.getCenter(l);
                this.positionType.orth.x ? b.x = c.x + this.orthogonalDist : b.y = c.y + this.orthogonalDist;
                if (this.maxOrthDelta) {
                    c = ig.Event.getEntity(entity.getAttribute(this.attrib)).getCenter(l);
                    this.positionType.orth.x ? b.x = b.x.limit(c.x - this.maxOrthDelta, c.x + this.maxOrthDelta) : b.y = b.y.limit(c.y - this.maxOrthDelta, c.y + this.maxOrthDelta)
                }
            }
            if (this.saveToAttrib) {
                c = Vec3.create();
                Vec2.assign(c, b);
                c.z = entity.coll.pos.z;
                entity.setAttribute(this.saveToAttrib, c);
                return true
            }
            b = Vec2.sub(b,
                entity.getCenter(), i);
            c = Vec2.length(b);
            if (this.precise && entity.coll.maxVel * entity.coll.relativeVel > c * 10) entity.coll.relativeVel = c / entity.coll.maxVel * 10;
            Vec2.assign(entity.coll.accelDir, b);
            if (c <= (this.precise ? 2 : 8)) {
                if (!this.maxTime || !this.forceTime) return true;
                Vec2.assignC(entity.coll.accelDir, 0, 0)
            }
            return this.maxTime && entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.SET_COMBATANT_PARTY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                party: {
                    _type: "String",
                    _info: "Override party determine which things are hit",
                    _select: sc.COMBATANT_PARTY
                }
            }
        }),
        init: function(data) {
            this.party = sc.COMBATANT_PARTY[data.party]
        },
        run: function(entity) {
            sc.combat.changeCombatantParty(entity, this.party);
            return true
        }
    });
    ig.ACTION_STEP.JUMP_TO_TARGET = ig.ActionStepBase.extend({
        jumpSpeed: 0,
        adjustAbove: 0,
        offset: null,
        _wm: new ig.Config({
            attributes: {
                jumpSpeed: {
                    _type: "Number",
                    _info: "Jump Speed / Z Velocity"
                },
                adjustAbove: {
                    _type: "Number",
                    _info: "Until how high above player X/Z movement should be adjusted"
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset to target.",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.jumpSpeed =
                data.jumpSpeed;
            this.adjustAbove = data.adjustAbove || 0;
            this.offset = data.offset || null
        },
        start: function(entity) {
            entity.doJump(this.jumpSpeed)
        },
        run: function(entity) {
            var b = entity.getTarget();
            if (!b) return true;
            var c = entity.coll.pos.z - entity.coll.baseZPos;
            if (entity.coll.vel.z <= 0 && c <= this.adjustAbove) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                if (c == 0) return true
            } else {
                b = Vec2.sub(b.getCenter(), entity.getCenter());
                this.offset && Vec2.add(b, this.offset);
                Vec2.length(b) > 8 && Vec2.assign(entity.coll.accelDir, b)
            }
            return false
        }
    });
    ig.ACTION_STEP.SET_Z_VEL_TO_TARGET = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "Number",
                    _info: "Speed with which entity should jump towards target"
                },
                distance: {
                    _type: "Number",
                    _info: "Distance to arrive to before target."
                },
                minZVel: {
                    _type: "Number",
                    _info: "Minimum z Vel",
                    _optional: true
                },
                maxZVel: {
                    _type: "Number",
                    _info: "Maximum z Vel",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.distance = data.distance || 0;
            this.speed = data.speed || 0;
            this.minZVel = data.minZVel || 0;
            this.maxZVel = data.maxZVel || 0
        },
        run: function(entity) {
            var b = entity.getTarget();
            if (b) {
                var c = this.speed,
                    d = b.distanceTo(entity),
                    d = d - this.distance,
                    b = ig.CollTools.getJumpSpeedForDuration(entity.coll, b.coll.pos.z, d / c),
                    b = Math.max(this.minZVel, b);
                this.maxZVel && (b = Math.min(this.maxZVel, b));
                entity.coll.vel.z = b
            }
            return true
        }
    });
    var g = {
        LANDED: {
            hasEnded: function(a) {
                var b = a.coll.pos.z - a.coll.baseZPos;
                if (b > 0 && a.stepData.justStarted) a.stepData.justStarted = false;
                return (!a.stepData.justStarted || a.coll.vel.z <= 0) && b == 0
            },
            duration: function(a) {
                var b = a.getTarget();
                return ig.CollTools.getJumpDuration(a.coll, (b || a).coll.baseZPos)
            }
        },
        Z_ZENITH: {
            hasEnded: function(a) {
                return a.coll.vel.z <=
                    0
            },
            duration: function(a) {
                return ig.CollTools.getJumpZenitDuration(a.coll)
            }
        }
    };
    ig.ACTION_STEP.JUMP_TARGET_MOVEMENT = ig.ActionStepBase.extend({
        adjustAbove: 0,
        offset: null,
        _wm: new ig.Config({
            attributes: {
                stopType: {
                    _type: "String",
                    _info: "When to stop Jump Movement",
                    _select: g
                },
                stopBeforeTime: {
                    _type: "Number",
                    _info: "Number of seconds to stop before target point has been reached."
                },
                distance: {
                    _type: "Number",
                    _info: "Close in to target up to this distance"
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset to target.",
                    _optional: true
                },
                faceAlignOffset: {
                    _type: "Boolean",
                    _info: "If true: use face align offset",
                    _optional: true
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed in which entity will rotate to target. In rotations per seconds.",
                    _default: 2,
                    _optional: true
                },
                adjustSpeedMax: {
                    _type: "Number",
                    _info: "If defined: optimized speed to hit target with up to this speed",
                    _optional: true
                },
                turnMinSpeed: {
                    _type: "Number",
                    _info: "If defined: minimum speed when entity is rotating towards target. If not defined: will stop",
                    _optional: true
                },
                maxSpeedChange: {
                    _type: "Number",
                    _info: "Maximum velocity change per second",
                    _optional: true
                },
                missileMode: {
                    _type: "Number",
                    _info: "If set, move entity like missile flying right at entity with speed provided minimal zSpeed. ONLY WORKS WITH adjustSpeedMax defined."
                },
                underEstimation: {
                    _type: "Number",
                    _info: "How much jump duration should be underestimated for speed adjustment. Lower value makes hitting target more reliable, but leads to initially fast jump motion.",
                    _default: 0.75,
                    _optional: true
                },
                cancelIfBelowFall: {
                    _type: "Boolean",
                    _info: "If entity is falling and below target z pos"
                }
            }
        }),
        init: function(data) {
            this.stopType = g[data.stopType] || g.LANDED;
            this.stopBeforeTime = data.stopBeforeTime || 0;
            this.distance = data.distance || 0;
            this.offset = data.offset || null;
            this.faceAlignOffset = data.faceAlignOffset || null;
            this.rotateSpeed = data.rotateSpeed || 0;
            this.adjustSpeedMax = data.adjustSpeedMax || 0;
            this.turnMinSpeed = data.turnMinSpeed || 0;
            this.maxSpeedChange = data.maxSpeedChange || 0;
            this.missileMode = data.missileMode || 0;
            this.underEstimation = data.underEstimation || 0.75;
            this.cancelIfBelowFall = data.cancelIfBelowFall || false
        },
        start: function(entity) {
            entity.stepData.justStarted =
                true;
            entity.stepData.speedStarted = true;
            if (this.rotateSpeed) entity.stepData.lastDir = Vec2.create(entity.face)
        },
        run: function(entity) {
            var b = entity.getTarget();
            if (b) {
                var d = ig.CollTools.getDistVec3(entity.coll, b.coll, c);
                this.offset && Vec2.add(d, this.offset);
                if (this.faceAlignOffset) {
                    var e;
                    if (entity.getFaceOffset && (e = entity.getFaceOffset())) {
                        d.y = d.y - entity.coll.size.y / 2;
                        d.x = d.x - (e && e.x || 0);
                        d.y = d.y - (e && e.y || 0);
                        d.z = d.z - (e && e.z || 0)
                    }
                }
                e = Vec2.length(d);
                if (e <= Math.max(this.distance, 4)) Vec2.assignC(entity.coll.accelDir, 0, 0);
                else if (this.rotateSpeed) {
                    Vec2.assign(entity.coll.accelDir,
                        entity.stepData.lastDir);
                    Vec2.isZero(entity.coll.accelDir) ? Vec2.assign(entity.coll.accelDir, d) : Vec2.rotateToward(entity.coll.accelDir, d, this.rotateSpeed * Math.PI * 2 * ig.system.tick);
                    !entity.faceToTarget.active && !entity.faceDirFixed && Vec2.assign(entity.face, entity.coll.accelDir);
                    Vec2.assign(entity.stepData.lastDir, entity.coll.accelDir)
                } else Vec2.assign(entity.coll.accelDir, d);
                if (this.adjustSpeedMax)
                    if (this.missileMode) {
                        e = entity.coll;
                        e.zGravityFactor = 0;
                        var f = Vec3.length(d);
                        if (f > 0) {
                            var g = this.adjustSpeedMax,
                                h = g * Vec2.length(d) / f,
                                d = g * d.z / f;
                            e.relativeVel = 1;
                            e.maxVel =
                                h;
                            Vec2.length(e.vel, h);
                            e.vel.z = d;
                            if (e.vel.z > -this.missileMode) e.vel.z = -this.missileMode;
                            e.friction.air = 1
                        }
                    } else {
                        g = this.stopType.duration(entity);
                        g - this.stopBeforeTime > 0.1 && (g = g * this.underEstimation);
                        if (g > 0) {
                            g = (e - this.distance) / g;
                            if (this.rotateSpeed) {
                                d = 1 - Vec2.angle(entity.stepData.lastDir, d) / Math.PI * 2;
                                g = Math.max(Math.min(g, this.turnMinSpeed), g * d)
                            }
                            if (this.maxSpeedChange && !entity.stepData.speedStarted) {
                                d = g - entity.coll.maxVel;
                                e = this.maxSpeedChange * ig.system.tick;
                                Math.abs(d) > e && (d = d > 0 ? e : -e);
                                g = entity.coll.maxVel + d
                            }
                            entity.stepData.speedStarted =
                                false;
                            entity.coll.maxVel = Math.min(g, this.adjustSpeedMax)
                        }
                    } if (this.stopBeforeTime) {
                    g = this.stopType.duration(entity);
                    if (g > 0 && g < this.stopBeforeTime) return true
                }
                if (this.cancelIfBelowFall) {
                    e = entity.coll;
                    if (b.coll.pos.z > e.pos.z && e.vel.z < 0) return true
                }
            }
            return this.stopType.hasEnded(entity)
        }
    });
    ig.ACTION_STEP.SET_MISSILE_SPEED = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                speed: {
                    _type: "Number",
                    _info: "Speed of Missile in pixel per seconds. Will be distributed to vel x/y/z to hit target on ground impact. Will always set gravityFactor to 0.",
                    _default: 400
                },
                minTime: {
                    _type: "Number",
                    _info: "Minimum amount of time for flight of missile",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.speed = data.speed || 400;
            this.minTime = data.minTime || 0
        },
        start: function(entity) {
            var b = entity.getTarget();
            if (b) {
                var d = entity.coll;
                d.zGravityFactor = 0;
                var distVec = ig.CollTools.getDistVec3(entity.coll, b.coll, c),
                    b = Vec3.length(distVec),
                    e = this.speed,
                    f = b / e;
                f < this.minTime && (e = e * (f / this.minTime));
                f = e * Vec2.length(distVec) / b;
                distVec = e * distVec.z / b;
                d.relativeVel = 1;
                d.maxVel = f;
                Vec2.length(d.vel, f);
                d.vel.z = distVec;
                d.friction.air = 1
            }
        }
    });
    ig.ACTION_STEP.ESCAPE_FROM_TARGET =
        ig.ActionStepBase.extend({
            distance: 0,
            minTime: 0,
            maxTime: 0,
            _wm: new ig.Config({
                attributes: {
                    distance: {
                        _type: "Number",
                        _info: "Minimum distance to target"
                    },
                    minTime: {
                        _type: "Number",
                        _info: "Minimum amount of time to escape"
                    },
                    maxTime: {
                        _type: "Number",
                        _info: "Maximum amount of time to escape"
                    }
                }
            }),
            init: function(data) {
                this.distance = data.distance;
                this.minTime = data.minTime;
                this.maxTime = data.maxTime
            },
            start: function(entity) {
                entity.stepData.maxTime = this.minTime + Math.random() * (this.maxTime - this.minTime);
                entity.stepTimer = entity.stepTimer + entity.stepData.maxTime;
                entity.stepData.doEscape = true
            },
            run: function(entity) {
                var b = entity.getTarget();
                if (!b) return true;
                b = Vec2.sub(entity.getCenter(), b.getCenter());
                if (Vec2.length(b) > this.distance) return true;
                Vec2.normalize(b);
                if (!entity.stepData.dir || entity.coll.partlyBlockTimer > 0.2) {
                    var c = entity.coll.partlyBlockTimer = 0;
                    if (entity.stepData.doEscape) c = b;
                    else {
                        do c = Vec2.normalize(Vec2.createC(Math.random() - 0.5, Math.random() - 0.5)); while (entity.stepData.dir && Vec2.dot(entity.stepData.dir, c) > 0.8)
                    }
                    entity.stepData.dir = c;
                    entity.stepData.doEscape = !entity.stepData.doEscape
                }
                Vec2.assign(entity.coll.accelDir,
                    entity.stepData.dir);
                return entity.stepTimer <= 0
            }
        });
    ig.ACTION_STEP.CIRCLE_TARGET = ig.ActionStepBase.extend({
        minTime: 0,
        maxTime: 0,
        _wm: new ig.Config({
            attributes: {
                minTime: {
                    _type: "Number",
                    _info: "Minimum amount of time to circle target"
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum amount of time to circle target"
                },
                keepFaceDirection: {
                    _type: "Boolean",
                    _info: "Move so direction which is closer to face direction"
                },
                towardsRotate: {
                    _type: "Number",
                    _info: "Rotate direction slightly towards target. If negative: away",
                    optional: true
                },
                towardMinDist: {
                    _type: "Number",
                    _info: "If defined: minimum, distance to keep when rotating towards player. (Rotate away otherwise)",
                    _optional: true
                },
                stopBeforeEdge: {
                    _type: "Boolean",
                    _info: "If true: Stop before falling down from edge when further moving forward"
                }
            }
        }),
        init: function(data) {
            this.minTime = data.minTime;
            this.maxTime = data.maxTime;
            this.towardsRotate = data.towardsRotate;
            this.towardMinDist = data.towardMinDist;
            this.keepFaceDirection = data.keepFaceDirection;
            this.stopBeforeEdge = data.stopBeforeEdge
        },
        start: function(entity) {
            entity.stepTimer =
                this.minTime + Math.random() * (this.maxTime - this.minTime);
            entity.stepData.ccw = Math.random() > 0.5
        },
        run: function(entity) {
            var b = entity.getTarget();
            if (!b) return true;
            var b = ig.CollTools.getDistVec2(b.coll, entity.coll, i),
                c = 1;
            if (entity.stepData.ccw) {
                Vec2.rotate90CCW(b);
                c = c * -1
            } else Vec2.rotate90CW(b);
            if (this.keepFaceDirection && Vec2.dot(b, entity.face) < 0) {
                Vec2.flip(b);
                c = c * -1
            }
            this.towardMinDist && Vec2.length(b) < this.towardMinDist && (c = c * -1);
            this.towardsRotate && Vec2.rotate(b, Math.PI * 0.5 * c * this.towardsRotate);
            Vec2.assign(entity.coll.accelDir, b);
            if (this.stopBeforeEdge &&
                ig.CollTools.isPostMoveOverHole(entity.coll, true)) {
                Vec2.assignC(entity.coll.accelDir, 0, 0);
                Vec2.assignC(entity.coll.vel, 0, 0)
            }
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.NEW_CIRCLE_TARGET = ig.ActionStepBase.extend({
        minTime: 0,
        maxTime: 0,
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Time to circle target"
                },
                ccw: {
                    _type: "Boolean",
                    _info: "If true: Circle Counter clockwise"
                },
                targetDistance: {
                    _type: "Number",
                    _info: "Best distance to target"
                },
                yScale: {
                    _type: "Number",
                    _info: "Y scale circle movement"
                },
                relativeVel: {
                    _type: "Number",
                    _info: "Relative Vel when circling"
                },
                dodgeVel: {
                    _type: "Number",
                    _info: "Relative Vel when dodging"
                },
                avoidEnemyRadius: {
                    _type: "Number",
                    _info: "Radius to check for other enemies to avoid them"
                }
            }
        }),
        init: function(data) {
            this.time = data.time;
            this.ccw = data.ccw;
            this.targetDistance = data.targetDistance;
            this.yScale = data.yScale || 1;
            this.relativeVel = data.relativeVel || 1;
            this.dodgeVel = data.dodgeVel || 1;
            this.avoidEnemyRadius = data.avoidEnemyRadius || 0
        },
        start: function(entity) {
            entity.stepTimer = this.time;
            entity.coll.relativeVel = this.relativeVel
        },
        run: function(entity) {
            var b =
                entity.getTarget();
            if (!b) return true;
            b = ig.CollTools.getDistVec2(b.coll, entity.coll, i);
            b.y = b.y / this.yScale;
            var c = Vec2.length(b),
                d = 1;
            if (this.ccw) {
                Vec2.rotate90CCW(b);
                d = d * -1
            } else Vec2.rotate90CW(b);
            var e = Math.abs(c - this.targetDistance);
            if (e > 8) {
                c < this.targetDistance && (d = d * -1);
                c = Math.max((e - 8) / this.targetDistance).limit(0, 1);
                Vec2.rotate(b, Math.PI * 0.5 * d * c);
                entity.coll.relativeVel = this.relativeVel * (1 - c) + this.dodgeVel * c
            } else entity.coll.relativeVel = this.relativeVel;
            if (this.avoidEnemyRadius)
                for (var d = Vec2.length(b), c = entity.getCenter(l),
                        e = ig.game.getEntitiesInCircle(c, this.avoidEnemyRadius, 1, entity.coll.size.z), f = e.length, g = []; f--;) {
                    c = e[f];
                    if (c.coll.parentColl) c = c.coll.parentColl.entity;
                    if (c && c instanceof ig.ENTITY.Enemy && c != entity && g.indexOf(c) == -1) {
                        g.push(c);
                        var h = ig.CollTools.getDistVec2(c.coll, entity.coll, l),
                            c = Vec2.length(h);
                        if (c < this.avoidEnemyRadius) {
                            Vec2.length(h, d * 2 * (this.avoidEnemyRadius - c) / this.avoidEnemyRadius);
                            Vec2.add(b, h)
                        }
                    }
                }
            Vec2.assign(entity.coll.accelDir, b);
            return entity.stepTimer <= 0
        }
    });
    var h = {
        TARGET: function(entity) {
            return entity.getTarget()
        },
        PROXY_OWNER: function(entity) {
            return entity.getCombatantRoot()
        },
        PROXY_SRC: function(entity) {
            return entity.sourceEntity
        },
        COLLAB_ENTITY: function(a) {
            return a.collabAttribs && a.collabAttribs.entity
        },
        OWNER_ENEMY: function(a) {
            return a.ownerEnemy
        }
    };
    ig.ACTION_STEP.STICK_TO_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "Type of target",
                    _select: h
                },
                align: {
                    _type: "String",
                    _info: "Alignment of to target",
                    _select: ig.ENTITY_ALIGN
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to target"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of sticking"
                },
                waitUntil: {
                    _type: "VarCondition",
                    _info: "If defined: continue spinning until condition evaluates to true. Duration is minimum wait",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.target = h[data.target];
            this.align = ig.ENTITY_ALIGN[data.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.duration = data.duration || 0;
            this.offset = data.offset;
            this.waitUntil = new ig.VarCondition(data.waitUntil)
        },
        start: function(entity) {
            var b = this.target && this.target(entity);
            if (b) {
                entity.stepTimer = this.duration;
                entity.stepData.target = b
            }
        },
        run: function(entity) {
            var b = entity.stepData.target;
            if (!b) return true;
            b = b.getAlignedPos(this.align,
                c);
            this.offset && Vec3.add(b, this.offset);
            Vec2.addMulF(b, entity.coll.size, -0.5);
            entity.setPos(b.x, b.y, b.z);
            return !this.waitUntil.evaluate() ? false : entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.STICKY_CIRCLE_AROUND = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "Type of target",
                    _select: h
                },
                distance: {
                    _type: "NumberExpression",
                    _info: "Distance to target",
                    _default: 32,
                    _optional: true
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of rotating movement"
                },
                ccw: {
                    _type: "Boolean",
                    _info: "If true, rotate counterclockwise"
                },
                rotateTime: {
                    _type: "Number",
                    _info: "Seconds for one full rotation. If not defined used current speed to determine rotation speed",
                    _optional: true
                },
                rotateTimeEnd: {
                    _type: "Number",
                    _info: "Value for rotation speed at end of duration. Speed will be interpolated.",
                    _optional: true
                },
                distAdjustSpeed: {
                    _type: "Number",
                    _info: "Speed with which projectile adjust distance to target (pixel per seconds)"
                },
                zDistance: {
                    _type: "Number",
                    _info: "If defined: Interpolate to this z Distance (with same speed as dist interpolation)",
                    _optional: true
                },
                waitUntil: {
                    _type: "VarCondition",
                    _info: "If defined: continue spinning until condition evaluates to true. Duration is minimum wait",
                    _optional: true
                },
                waitTargetAlign: {
                    _type: "Boolean",
                    _info: "If true: keep rotating until rotate velocity roughly matches direction to target"
                }
            }
        }),
        init: function(data) {
            this.target = h[data.target];
            this.distance = data.distance === void 0 ? null : data.distance;
            this.duration = data.duration || 0;
            this.rotateTime = data.rotateTime || 0;
            this.rotateTimeEnd = data.rotateTimeEnd || 0;
            this.distAdjustSpeed = data.distAdjustSpeed ||
                0;
            this.ccw = data.ccw || false;
            this.zDistance = data.zDistance === void 0 ? null : data.zDistance;
            this.waitUntil = new ig.VarCondition(data.waitUntil);
            this.waitTargetAlign = data.waitTargetAlign || false
        },
        start: function(entity) {
            var b = this.target && this.target(entity);
            if (b) {
                entity.stepTimer = this.duration;
                entity.stepData.target = b;
                entity.stepData.lastPos = Vec3.create(b.coll.pos)
            }
        },
        run: function(entity) {
            var b = entity.stepData.target;
            if (!b) return true;
            var d = entity.coll.maxVel * entity.coll.relativeVel,
                e = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c),
                f = Vec3.assign(j, b.coll.pos);
            Vec3.sub(f,
                entity.stepData.lastPos);
            this.zDistance !== null ? Vec3.add(e, f) : Vec2.add(e, f);
            Vec3.assign(entity.stepData.lastPos, b.coll.pos);
            var g = b.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, j),
                b = Vec2.sub(e, g, i);
            Vec2.isZero(b) && Vec2.assignC(b, 0, -1);
            var h = Vec2.length(b),
                f = this.distAdjustSpeed || d;
            if (this.distance !== null) {
                var k = ig.Event.getExpressionValue(this.distance);
                if (h < k) {
                    h = h + ig.system.tick * f;
                    h > k && (h = k)
                } else if (h > this.distance) {
                    h = h - ig.system.tick * f;
                    h < k && (h = k)
                }
                Vec2.length(b, h)
            }
            k = 0;
            if (this.rotateTime) {
                k = this.rotateTime;
                if (this.rotateTimeEnd) {
                    k =
                        1 / k;
                    k = 1 / (k + (1 / this.rotateTimeEnd - k) * (1 - Math.max(0, entity.stepTimer / this.duration)))
                }
            }
            h = h * 2 * Math.PI;
            d = (k ? 1 / k : d / h) * ig.system.tick * Math.PI * 2;
            entity.stepTimer < 0 && (this.waitUntil.evaluate() && !this.waitTargetAlign) && (d = d * (1 + entity.stepTimer / ig.system.tick));
            this.ccw || (d = -d);
            Vec2.rotate(b, d);
            Vec2.assign(e, g);
            Vec2.add(e, b);
            if (this.zDistance !== null) {
                d = g.z + this.zDistance;
                if (e.z > d) {
                    e.z = e.z - ig.system.tick * f;
                    if (e.z < d) e.z = d
                } else if (e.z < d) {
                    e.z = e.z + ig.system.tick * f;
                    if (e.z > d) e.z = d
                }
            }
            e.x = e.x - entity.coll.size.x / 2;
            e.y = e.y - entity.coll.size.y /
                2;
            this.ccw ? Vec2.rotate90CW(b) : Vec2.rotate90CCW(b);
            entity.setPos(e.x, e.y, e.z);
            !entity.faceDirFixed && !entity.faceToTarget.active && Vec2.assign(entity.face, b);
            if (!this.waitUntil.evaluate()) return false;
            if (entity.stepTimer <= 0 && this.waitTargetAlign) {
                e = ig.CollTools.getDistVec2(entity.coll, entity.getTarget().coll, l);
                if (Vec2.angle(e, b) > Math.PI / 2 * 0.125) return false
            }
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.SET_CIRCLE_AROUND_POS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "Type of target",
                    _select: h
                },
                proxyGroup: {
                    _type: "String",
                    _info: "Group of proxies to align circle around pos with"
                },
                count: {
                    _type: "Number",
                    _info: "Number of proxies that circle around target with even spacing"
                },
                attribBlock: {
                    _type: "String",
                    _info: "If defined: only consider proxy if attrib is false",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.target = h[data.target];
            this.proxyGroup = data.proxyGroup;
            this.count = data.count || 1;
            this.attribBlock = data.attribBlock
        },
        start: function(entity) {
            var b = this.target && this.target(entity);
            if (b) {
                for (var c = b.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, j), d = entity.getCombatantRoot().entityAttached,
                        e = d.length, f = []; e--;) {
                    var g = d[e];
                    g != entity && g instanceof sc.CombatProxyEntity && (!this.attribBlock || !g.getAttribute(this.attribBlock)) && g.group == this.proxyGroup && f.push(this._getDeltaVector(b, g))
                }
                b = Vec2.assignC(i, 0, 1);
                d = Math.PI * 2 / this.count;
                if (f.length) {
                    Vec2.assign(b, f[0]);
                    var h = this.count;
                    do {
                        g = false;
                        Vec2.rotate(b, d);
                        for (e = f.length; e--;) Vec2.angle(b, f[e]) < d / 2 && (g = true);
                        h--
                    } while (g && h)
                }
                Vec2.length(b, 1);
                Vec2.add(c, b);
                entity.setPos(c.x - entity.coll.size.x / 2, c.y - entity.coll.size.y / 2, void 0)
            }
        },
        _getDeltaVector: function(a, b) {
            return ig.CollTools.getDistVec2(a.coll,
                b.coll, Vec2.create())
        }
    });
    ig.ACTION_STEP.TACKLE = ig.ActionStepBase.extend({
        time: 0,
        missReactTime: void 0,
        attack: null,
        cancelOnHit: false,
        withBranches: false,
        rotateSpeed: 0,
        _wm: new ig.Config({
            attributes: {
                attack: {
                    _type: "AttackInfo",
                    _info: "Attack Info of tackle"
                },
                time: {
                    _type: "Number",
                    _info: "Movement time to tackel target"
                },
                missReactTime: {
                    _type: "Number",
                    _info: "Reaction time to stop tackle after target has been clearly missed",
                    _optional: true
                },
                cancelOnHit: {
                    _type: "Boolean",
                    _info: "If true, cancel tackle once target is hit"
                },
                withBranches: {
                    _type: "Boolean",
                    _info: "Show branches to handle hit and miss follow up",
                    _optional: true
                },
                collideCancel: {
                    _type: "Number",
                    _info: "If defined: if angle to collided wall is lower than this value, cancel step",
                    _optional: true
                },
                rotateSpeed: {
                    _type: "Number",
                    _info: "Speed in which entity will rotate to target. In rotations per seconds.",
                    _default: 0.2,
                    _optional: true
                },
                orthoDirFactor: {
                    _type: "Number",
                    _info: "0= hit target will fly in dash dir. 1= target will fly orthogonally away from dash trail."
                },
                ignoreLastHit: {
                    _type: "Boolean",
                    _info: "If true, ignore most recently hit entity"
                },
                collideSlip: {
                    _type: "Boolean",
                    _info: "If true: when colliding with wall, change dash direction to slip alongside wall."
                }
            },
            branchLabel: function(label) {
                switch (label) {
                    case "hit":
                        return "ON TACKLE HIT";
                    case "missed":
                        return "ON TACKE MISS";
                    case "_end":
                        return "end tackle"
                }
                return "???"
            }
        }),
        init: function(data) {
            this.time = data.time;
            this.attack = data.attack;
            this.missReactTime = data.missReactTime;
            this.cancelOnHit = data.cancelOnHit || false;
            this.withBranches = data.withBranches || false;
            this.collideCancel =
                data.collideCancel || 0;
            this.collideSlip = data.collideSlip || false;
            this.rotateSpeed = data.rotateSpeed || 0;
            this.orthoDirFactor = data.orthoDirFactor || 0;
            this.ignoreLastHit = data.ignoreLastHit || false
        },
        start: function(entity) {
            entity.stepTimer = this.time;
            entity.stepData.dir = Vec2.create(entity.face);
            entity.stepData.weight = entity.coll.weight;
            entity.coll.weight = -1;
            Vec2.assign(entity.coll.accelDir, entity.stepData.dir);
            var b = entity.coll;
            b.totalBlockTimer = b.partlyBlockTimer = 0;
            entity.setTackle(new sc.AttackInfo(entity.params, this.attack), this.orthoDirFactor, this.cancelOnHit, this.ignoreLastHit)
        },
        run: function(entity) {
            var b = entity.getTarget();
            if (this.rotateSpeed && b) {
                var c = ig.CollTools.getDistVec2(entity.coll, b.coll, i);
                Vec2.rotateToward(entity.stepData.dir, c, this.rotateSpeed * Math.PI * 2 * ig.system.tick);
                Vec2.assign(entity.face, entity.stepData.dir)
            }
            Vec2.assign(entity.coll.accelDir, entity.stepData.dir);
            if (!entity.getCombatantRoot().isPlayer && !b) entity.stepTimer = 0;
            if (b && this.missReactTime != void 0 && this.missReactTime != null && entity.stepTimer > this.missReactTime) {
                ig.CollTools.getDistVec2(entity.coll, b.coll, r);
                if (Vec2.angle(r, entity.face) > Math.PI / 2) entity.stepTimer = this.missReactTime
            }
            if (this.collideCancel &&
                ig.CollTools.hasWallCollide(entity.coll, this.collideCancel)) entity.stepTimer = 0;
            else if (this.collideSlip && ig.CollTools.hasWallCollide(entity.coll, 1)) {
                b = Vec2.assign(i, entity.coll._collData.blockDir);
                Vec2.rotate90CW(b);
                Vec2.dot(b, entity.face) < 0 && Vec2.flip(b);
                Vec2.assign(entity.face, b);
                Vec2.assign(entity.stepData.dir, b)
            }
            if (this.cancelOnHit && entity.tackle.hitCount > 0) entity.stepTimer = 0;
            return entity.stepTimer <= 0
        },
        getBranchNames: function() {
            return this.withBranches ? ["hit", "missed"] : null
        },
        getNext: function(entity) {
            var b = entity.tackle.hitCount > 0;
            entity.setTackle(null);
            entity.coll.weight =
                entity.stepData.weight;
            return this.withBranches ? b ? this.branches.hit || this._nextStep : this.branches.missed || this._nextStep : this._nextStep
        }
    });
    ig.ACTION_STEP.CIRCLE_ATTACK = ig.ActionStepBase.extend({
        circleSettings: null,
        attack: null,
        fixPos: false,
        _wm: new ig.Config({
            attributes: {
                attack: {
                    _type: "AttackInfo",
                    _info: "Attack Info of circle attack"
                },
                align: {
                    _type: "String",
                    _info: "Alignment of force relative to entity",
                    _select: ig.ENTITY_ALIGN
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to entity"
                },
                radius: {
                    _type: "Number",
                    _info: "Radius of circle attack"
                },
                dir: {
                    _type: "Vec2",
                    _info: "Direction to go to",
                    _actorOption: true,
                    _optional: true
                },
                yScale: {
                    _type: "Number",
                    _info: "Scale of y dimension relative to x. 1 = equally scaled. 0.5 = half y extend."
                },
                zHeight: {
                    _type: "Number",
                    _info: "Z Height of collision force."
                },
                centralAngle: {
                    _type: "Number",
                    _info: "Central Angle of circle attack. 1 = one circle"
                },
                startAngle: {
                    _type: "Number",
                    _info: "Start angle of circle attack relative to front. If not specified startes at - centralAngle / 2",
                    _optional: true
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of circle sweep"
                },
                expandRadius: {
                    _type: "Number",
                    _info: "How much the radius extends during the sweep"
                },
                alwaysFull: {
                    _type: "Boolean",
                    _info: "If true, circle is constantly closed."
                },
                clockwise: {
                    _type: "Boolean",
                    _info: "If true, sweep clockwise. ccw otherwise."
                },
                flipLeftFace: {
                    _type: "Integer",
                    _info: "If true, flip circle orientation if left faced."
                },
                rectangular: {
                    _type: "Boolean",
                    _info: "Collision area is actually not a circle, but a box."
                },
                repeat: {
                    _type: "Boolean",
                    _info: "If true, repeat proxy spawning until ended by force (action end or call STOP_REPEATING_FORCE)"
                },
                uniformHitDir: {
                    _type: "Boolean",
                    _info: "If true, use entity center to determine hit direction rather than force center"
                },
                fixPos: {
                    _type: "Boolean",
                    _info: "If true: show circle attack at a fixed position"
                },
                checkCollision: {
                    _type: "Boolean",
                    _info: "If true: check collision before hitting entities"
                },
                party: {
                    _type: "String",
                    _info: "Override party determine which things are hit",
                    _select: sc.COMBATANT_PARTY,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.circleSettings = data
        },
        run: function(entity) {
            var b = new sc.CircleHitForce(entity, this.circleSettings);
            sc.combat.addCombatForce(b);
            b.duration > 0 && entity.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.COMBAT_SWEEP = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                sweepType: {
                    _type: "String",
                    _info: "Type of sweep",
                    _select: sc.COMBAT_SWEEPS
                },
                reversed: {
                    _type: "Boolean",
                    _info: "If true: Show effect reversed"
                },
                faceCount: {
                    _type: "Number",
                    _info: "For how many face directions the effect should be rotated"
                },
                flipLeftFace: {
                    _type: "Boolean",
                    _info: "If true, flip for left facing directions"
                }
            }
        }),
        init: function(data) {
            this.sweepType =
                sc.COMBAT_SWEEPS[data.sweepType];
            this.reversed = data.reversed;
            this.faceCount = data.faceCount;
            this.flipLeftFace = data.flipLeftFace || false
        },
        run: function(entity) {
            var b = sc.combat.getElementMode(entity);
            sc.CombatSweep.show(this.sweepType, entity, b, this.faceCount, this.reversed, this.flipLeftFace);
            return true
        }
    });
    ig.ACTION_STEP.SET_TARGET_Z_VEL = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "New Z Vel value. Positive for up movement"
                }
            }
        }),
        init: function(data) {
            this.value = data.value
        },
        run: function(entity) {
            if (entity =
                entity.getTarget()) entity.coll.vel.z = this.value;
            return true
        }
    });
    ig.ACTION_STEP.PUSH_PULL_FORCE = ig.ActionStepBase.extend({
        pushPullSettings: null,
        _wm: new ig.Config({
            attributes: {
                strength: {
                    _type: "String",
                    _info: "How strong enemy is pushed/pulled",
                    _select: sc.PUSH_PULL_STRENGTH
                },
                pull: {
                    _type: "Boolean",
                    _info: "If true: pull entities towards combatant, otherwise, push away"
                },
                radius: {
                    _type: "Number",
                    _info: "Radius of circle attack"
                },
                fadeRadius: {
                    _type: "Number",
                    _info: "addition Radius in which the strengh is linarly faded to 0"
                },
                minRadius: {
                    _type: "Number",
                    _info: "If defined, force will stop if entity is below that radius"
                },
                faceDist: {
                    _type: "Number",
                    _info: "If defined, place pull center in front of face direction with specified distance",
                    _optional: true
                },
                zHeight: {
                    _type: "Number",
                    _info: "Z height of push/pull force range",
                    _default: 32
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of force. -1 will last until action end or call of STOP_REPEATING_FORCE"
                },
                party: {
                    _type: "String",
                    _info: "Party of force. Combatants of other parties are pushed/pulled. Will use combatant party by default",
                    _select: sc.COMBATANT_PARTY,
                    _optional: true
                },
                effect: {
                    _type: "Effect",
                    _info: "If defined: show effect on combatants influenced by force",
                    _optional: true
                },
                align: {
                    _type: "String",
                    _info: "Alignment ot push/pull force",
                    _select: ig.ENTITY_ALIGN
                }
            }
        }),
        init: function(data) {
            this.pushPullSettings = data;
            this.pushPullSettings.effect && (this.pushPullSettings.effect = new ig.EffectHandle(this.pushPullSettings.effect))
        },
        clearCached: function() {
            this.pushPullSettings.effect && this.pushPullSettings.effect.clearCached()
        },
        run: function(entity) {
            var b =
                new sc.PushPullForce(entity, this.pushPullSettings);
            sc.combat.addCombatForce(b);
            entity.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.SET_INVINCIBLE = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "The time the combatant will be invincible. -1 for constant invincibility. Set to 0 to reset."
                }
            }
        }),
        init: function(data) {
            this.value = data.value
        },
        run: function(entity) {
            entity.invincibleTimer = this.value;
            return true
        }
    });
    ig.ACTION_STEP.MOD_GENERIC_PROXY = ig.ActionStepBase.extend({
        killEffect: null,
        clearKillEffect: false,
        hp: null,
        threat: null,
        _wm: new ig.Config({
            attributes: {
                killEffect: {
                    _type: "Effect",
                    _info: "If defined, set Kill effects of generic proxy",
                    _optional: true
                },
                clearKillEffect: {
                    _type: "Boolean",
                    _info: "If true, clear kill effect of generic proxy"
                },
                hp: {
                    _type: "Number",
                    _info: "Define to overwrite. If 0: proxy will ignore attack. -1: will take hits but is never destroyed (stops balls) >0: takes hits and can be destroyed",
                    _optional: true
                },
                threat: {
                    _type: "Boolean",
                    _info: "If true, consider proxy a threat (true by default)",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            if (data.killEffect) this.killEffect = new ig.EffectHandle(data.killEffect);
            this.clearKillEffect = data.clearKillEffect || false;
            if (data.hp !== void 0) this.hp = data.hp;
            if (data.threat !== void 0) this.threat = data.threat
        },
        clearCached: function() {
            this.killEffect && this.killEffect.clearCached()
        },
        start: function(entity) {
            if (entity instanceof sc.CombatProxyEntity) {
                if (this.killEffect) entity.effects.onKill = this.killEffect;
                if (this.clearKillEffect) entity.effects.onKill = null;
                this.hp !== null && entity.setMaxHp(this.hp);
                if (this.threat !== null) entity.isThreat =
                    this.threat
            }
        }
    });
    ig.ACTION_STEP.CONNECT_PROXY_TO_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            var b = entity.getTarget();
            entity.connectExternal && entity.connectExternal(b)
        }
    });
    ig.ACTION_STEP.DISCONNECT_PROXY_FROM_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.connectExternal && entity.connectExternal(null)
        }
    });
    ig.ACTION_STEP.SET_ELEMENT_FILTER = ig.ActionStepBase.extend({
        value: false,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "Value of element filter. NEUTRAL=No Filter.",
                    _select: sc.ELEMENT
                }
            }
        }),
        init: function(data) {
            this.value = sc.ELEMENT[data.value] || sc.ELEMENT.NEUTRAL
        },
        run: function(entity) {
            entity.elementFilter = this.value;
            return true
        }
    });
    ig.ACTION_STEP.DODGE_FREE_LINE = ig.ActionStepBase.extend({
        time: 0,
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "How long to dodge the free line."
                }
            }
        }),
        init: function(data) {
            this.time = data.time
        },
        start: function(entity) {
            entity.stepTimer = this.time;
            entity.stepData.dir = sc.combat.isBlockingFreeLine(entity)
        },
        run: function(entity) {
            if (!entity.stepData.dir) return true;
            Vec2.assign(entity.coll.accelDir, entity.stepData.dir);
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.ENABLE_REACTION = ig.ActionStepBase.extend({
        reaction: null,
        _wm: new ig.Config({
            attributes: {
                reaction: {
                    _type: "Reaction",
                    _info: "Reaction to enable"
                }
            }
        }),
        init: function(data) {
            this.reaction = data.reaction
        },
        run: function(entity) {
            entity.enableReaction(this.reaction);
            return true
        }
    });
    ig.ACTION_STEP.SET_SPIKE_DAMAGE = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Value for spike damage factor"
                }
            }
        }),
        init: function(data) {
            this.value =
                data.value
        },
        run: function(entity) {
            entity.spikeDmg.tmpFactor = this.value;
            return true
        }
    });
    ig.ACTION_STEP.DISABLE_REACTION = ig.ActionStepBase.extend({
        reaction: null,
        _wm: new ig.Config({
            attributes: {
                reaction: {
                    _type: "Reaction",
                    _info: "Reaction to disable"
                }
            }
        }),
        init: function(data) {
            this.reaction = data.reaction
        },
        run: function(entity) {
            entity.disableReaction(this.reaction);
            return true
        }
    });
    ig.ACTION_STEP.SET_DAMAGE_FACTOR = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "New damage factor"
                }
            }
        }),
        init: function(data) {
            this.value =
                data.value
        },
        run: function(entity) {
            if (entity.params) entity.params.damageFactor = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_HIT_STABLE = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "String",
                    _info: "New hit stable value.",
                    _select: sc.ATTACK_TYPE
                }
            }
        }),
        init: function(data) {
            this.value = sc.ATTACK_TYPE[data.value]
        },
        run: function(entity) {
            entity.hitStable = this.value;
            return true
        }
    });
    ig.ACTION_STEP.SET_DAMAGE_CEILING = ig.ActionStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "The maximum sum of all damage factors of the attack. Damage factors will be scaled down when sum gets close to maximum"
                },
                forwardToProxies: {
                    _type: "Boolean",
                    _info: "Forward ceiling on all attached action proxies"
                }
            }
        }),
        init: function(data) {
            this.value = data.value || 0
        },
        run: function(entity) {
            entity.combo.damageCeiling = {
                max: this.value,
                sum: {}
            };
            for (var b = entity.actionAttached, c = b.length; c--;)
                if (b[c] instanceof sc.BasicCombatant) b[c].combo.damageCeiling = entity.combo.damageCeiling;
            return true
        }
    });
    ig.ACTION_STEP.CLEAR_DAMAGE_CEILING = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                forwardToProxies: {
                    _type: "Boolean",
                    _info: "Forward ceiling on all attached action proxies"
                }
            }
        }),
        init: function(data) {
            this.value = data.value || 0
        },
        run: function(entity) {
            entity.combo.damageCeiling = null;
            for (var attached = entity.actionAttached, b = attached.length; b--;)
                if (attached[b] instanceof sc.BasicCombatant) attached[b].combo.damageCeiling = null;
            return true
        }
    });
    ig.ACTION_STEP.SET_ENEMY_STATE = ig.ActionStepBase.extend({
        enemyState: 0,
        _wm: new ig.Config({
            attributes: {
                enemyState: {
                    _type: "EnemyState",
                    _info: "State of Enemy to switch to"
                },
                switchConfig: {
                    _type: "Boolean",
                    _info: "If true, immediately switch default config. Makes sure correct damage pose is displayed etc.",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.enemyState = data.enemyState;
            this.switchConfig = data.switchConfig
        },
        run: function(entity) {
            entity.changeState(this.enemyState, false, this.switchConfig);
            return true
        }
    });
    var i = Vec2.create(),
        j = Vec3.create(),
        k = {
            SELF: function(resultPos, entity, offset) {
                resultPos = entity.getAlignedPos(offset, resultPos);
                if (entity.isPlayer && this.align == ig.ENTITY_ALIGN.BOTTOM) {
                    offset = entity.maxJumpHeight === void 0 ? -1 : entity.maxJumpHeight;
                    if (offset >= 0) resultPos.z = Math.min(entity.coll.pos.z, offset)
                }
                return resultPos
            },
            TARGET: function(resultPos, entity, offset) {
                return (entity.getTarget() || entity).getAlignedPos(offset, resultPos)
            },
            COLLAB_CENTER: function(resultPos, entity, offset) {
                return !entity.collaboration ? entity.getAlignedPos(offset, resultPos) : entity.collaboration.getCenterPos(resultPos, offset)
            }
        };
    ig.ACTION_STEP.SHOOT_PROXY = ig.ActionStepBase.extend({
        proxySrc: null,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        align: ig.ENTITY_ALIGN.FACE,
        dir: null,
        posType: null,
        _wm: new ig.Config({
            attributes: {
                proxy: {
                    _type: "ProxyRef",
                    _info: "Ball the entity will shoot"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                dir: {
                    _type: "Vec2",
                    _info: "Direction to go to",
                    _actorOption: true,
                    _optional: true
                },
                aimAtTarget: {
                    _type: "Boolean",
                    _info: "If true: aim at target, ignore any other direction.",
                    _optional: true
                },
                posType: {
                    _type: "String",
                    _info: "How to determine start position",
                    _select: k,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.proxySrc = sc.ProxyTools.prepareSrc(data.proxy);
            this.offset = data.offset || this.offset;
            this.align = ig.ENTITY_ALIGN[data.align] || this.align;
            this.dir = data.dir;
            this.aimAtTarget = data.aimAtTarget;
            this.posType = k[data.posType] || k.SELF
        },
        clearCached: function() {
            sc.ProxyTools.releaseSrc(this.proxySrc)
        },
        run: function(entity) {
            var b = sc.ProxyTools.getProxy(this.proxySrc, entity);
            if (b) {
                var c = this.dir && ig.Action.getVec2(this.dir, entity, i) || entity.face,
                    d = this.posType(j, entity, this.align);
                Vec3.add(d, this.offset);
                if (this.aimAtTarget) {
                    var e = entity.getTarget();
                    if (e) {
                        c = e.getCenter(i);
                        Vec2.sub(c, d)
                    }
                }
                b.spawn(d.x, d.y, d.z, entity, c)
            }
            return true
        }
    });
    ig.ACTION_STEP.SET_HIT_PROXY = ig.ActionStepBase.extend({
        proxySrc: null,
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        align: ig.ENTITY_ALIGN.FACE,
        posType: null,
        _wm: new ig.Config({
            attributes: {
                proxy: {
                    _type: "ProxyRef",
                    _info: "Ball the entity will shoot"
                },
                posType: {
                    _type: "String",
                    _info: "How to determine start position",
                    _select: sc.COMBAT_HIT_PROXY_POS
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                }
            }
        }),
        init: function(data) {
            this.proxySrc = sc.ProxyTools.prepareSrc(data.proxy);
            this.offset = data.offset || this.offset;
            this.align = ig.ENTITY_ALIGN[data.align] || this.align;
            this.posType = sc.COMBAT_HIT_PROXY_POS[data.posType] ||
                null
        },
        clearCached: function() {
            sc.ProxyTools.releaseSrc(this.proxySrc)
        },
        start: function(entity) {
            var b = sc.ProxyTools.getProxy(this.proxySrc, entity);
            b && entity.setHitProxy(b, this.posType, this.align, this.offset)
        }
    });
    ig.ACTION_STEP.SET_PROXY_OWNER_TO_POS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        clearCached: function() {},
        run: function(entity) {
            entity.getCombatantRoot().setPos(entity.coll.pos.x, entity.coll.pos.y, entity.coll.pos.z);
            return true
        }
    });
    ig.ACTION_STEP.CLEAR_HIT_PROXY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.combo.hitProxy = null
        }
    });
    var l = Vec2.create(),
        o = Vec3.create();
    ig.ACTION_STEP.SHOOT_PROXY_RANGE = ig.ActionStepBase.extend({
        forceSettings: null,
        _wm: new ig.Config({
            attributes: {
                proxy: {
                    _type: "ProxyRef",
                    _info: "Ball the entity will shoot"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                dir: {
                    _type: "Vec2",
                    _info: "Direction to go to",
                    _actorOption: true,
                    _optional: true
                },
                centralAngle: {
                    _type: "Number",
                    _info: "Central angle of range. 1 = full circle"
                },
                startAngle: {
                    _type: "Number",
                    _info: "Angle from which to start. Default is - centralAngle / 2",
                    _optional: true
                },
                angleVary: {
                    _type: "Number",
                    _info: "Randomly vary each angle with the provided range"
                },
                startDist: {
                    _type: "NumberExpression",
                    _info: "Start Distance of ball in throw direction",
                    _optional: true
                },
                startDistAdd: {
                    _type: "Number",
                    _info: "Start Distance added for following proxies. Last proxy will be spawned with startDist + startDistAdd distance",
                    _optional: true
                },
                startDistCollide: {
                    _type: "String",
                    _info: "If not NONE: consider environment collision before adding start dist. CLOSER = move closer, DROP = Don't spawn if colliding",
                    _select: sc.SPAWN_START_DIST_COLLIDE
                },
                limitRangeOnColl: {
                    _type: "Boolean",
                    _info: "If true, limit range of spawning depending on collision, check only at beginning",
                    _optional: true
                },
                random: {
                    _type: "Boolean",
                    _info: "Spawn each Proxy in random direction within range"
                },
                count: {
                    _type: "NumberExpression",
                    _info: "The number of proxies thrown"
                },
                duration: {
                    _type: "NumberExpression",
                    _info: "Time it takes to throw proxies"
                },
                clockwise: {
                    _type: "Boolean",
                    _info: "If true throw proxies clockwise, otherwise counter clockwise"
                },
                flipLeftFace: {
                    _type: "Integer",
                    _info: "If FACE COUNT is provided: swap clockWise if face direction is towards left"
                },
                offsetArea: {
                    _type: "Vec2",
                    _info: "offset Area around position to randomly spawn entity at",
                    _optional: true
                },
                circularArea: {
                    _type: "Boolean",
                    _info: "Make offsetArea circular, not rectangular"
                },
                uniformDir: {
                    _type: "Number",
                    _info: "To what extend the final dir should be uniform. 1=all the same dir, 0= all individual, 0.5=between the two"
                },
                delay: {
                    _type: "Number",
                    _info: "Time delay for first shot"
                },
                repeat: {
                    _type: "Boolean",
                    _info: "If true, repeat proxy spawning until ended by force (action end or call STOP_REPEATING_FORCE)"
                },
                terrainFilter: {
                    _type: "Array",
                    _info: "Only spawn entity if terrain below is in this list",
                    _sub: {
                        _type: "String",
                        _select: ig.TERRAIN
                    },
                    _optional: true
                },
                maxGroundDistance: {
                    _type: "Number",
                    _info: "If specified: must have at most this distance to ground, otherwise won't be spawned",
                    _optional: true
                },
                posEntity: {
                    _type: "String",
                    _info: "If selected: use alternative entity for spawn center position",
                    _optional: true,
                    _select: d
                },
                yScale: {
                    _type: "Number",
                    _info: "Scale of y dimension relative to x. 1 = equally scaled. 0.5 = half y extend.",
                    _optional: true,
                    _default: 1
                },
                aimAtTarget: {
                    _type: "Boolean",
                    _info: "If true: set direction to aim directly at target",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            data.proxy = sc.ProxyTools.prepareSrc(data.proxy);
            this.forceSettings = data;
            this.posEntity = d[data.posEntity] || null
        },
        clearCached: function() {
            sc.ProxyTools.releaseSrc(this.forceSettings.proxy)
        },
        run: function(entity) {
            var b = null;
            this.posEntity &&
                (b = this.posEntity(entity));
            b = new sc.ProxySpawnerForce(entity, this.forceSettings, b);
            sc.combat.addCombatForce(b);
            entity.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.SHOOT_PROXY_GRID = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                proxies: {
                    _type: "Array",
                    _info: "List of proxy types",
                    _sub: "ProxyRef"
                },
                pattern: {
                    _type: "FlexibleTable",
                    _info: "Pattern of proxies. 0=no proxy, otherwise n-1 = proxy id",
                    _cols: 20,
                    _rows: 30,
                    _popup: true
                },
                tilesize: {
                    _type: "Number",
                    _info: "Size of grid tile - distance between neighbouring proxies",
                    _default: 16
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                flow: {
                    _type: "String",
                    _info: "Determines the order in which proxies are spawned",
                    _select: sc.PROXY_GRID_FLOW
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of proxy spawning"
                },
                spawnDelay: {
                    _type: "Number",
                    _info: "If defined guarantee a minimum delay between each spawned proxy",
                    _optional: true
                },
                posEntity: {
                    _type: "String",
                    _info: "If selected: use alternatice entity for spawn center position",
                    _optional: true,
                    _select: d
                }
            }
        }),
        init: function(data) {
            for (var b = data.proxies, c = [], e = 0; e < b.length; ++e) c[e] = sc.ProxyTools.prepareSrc(b[e]);
            data.proxies = c;
            this.forceSettings = data;
            this.posEntity = d[data.posEntity] || null
        },
        clearCached: function() {
            for (var a = this.forceSettings.proxies, b = a.length; b--;) sc.ProxyTools.releaseSrc(a[b])
        },
        run: function(entity) {
            var b = null;
            this.posEntity && (b = this.posEntity(entity));
            b = new sc.ProxyGridForce(entity, this.forceSettings, b);
            sc.combat.addCombatForce(b);
            entity.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.STOP_REPEATING_FORCE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(entity) {
            for (var attached = entity.actionAttached, b = attached.length; b--;) {
                var c = attached[b];
                if (c instanceof sc.CombatForce && c.isRepeating()) c.onActionEndDetach()
            }
            return true
        }
    });
    ig.ACTION_STEP.UNSTICK_STICKING_PROXIES = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            for (var attached = entity.actionAttached, b = attached.length; b--;) {
                var c = attached[b];
                if (c instanceof sc.CombatProxyEntity && c.stickToSource) c.stickToSource = 0
            }
        }
    });
    ig.ACTION_STEP.REMOVE_PROXIES = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                sticking: {
                    _type: "Boolean",
                    _info: "If true: only remove sticking proxies"
                },
                group: {
                    _type: "String",
                    _info: "If set, only clear proxies of that group"
                },
                target: {
                    _type: "String",
                    _info: "What entity will get the buff",
                    _select: d,
                    _optional: true
                },
                keepCount: {
                    _type: "Number",
                    _info: "If defined: keep this many proxies and only remove proxies beyond that number",
                    _optional: true
                },
                ignoreSelf: {
                    _type: "Boolean",
                    _info: "If true: don't remove itself"
                }
            }
        }),
        init: function(data) {
            this.sticking = data.sticking || false;
            this.group = data.group || null;
            this.target = d[data.target] || d.SELF;
            this.keepCount = data.keepCount || 0;
            this.ignoreSelf = data.ignoreSelf || false
        },
        start: function(entity) {
            var b = this.target(entity).getCombatantRoot();
            sc.CombatProxyTools.clearEntityProxy(b, this.group, this.sticking, this.keepCount, this.ignoreSelf ? entity : null)
        }
    });
    var m = {};
    ig.ACTION_STEP.FANCY_AIM = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                bounces: {
                    _type: "Number",
                    _info: "Number of Bounces"
                },
                size: {
                    _type: "Number",
                    _info: "Size of projectile"
                },
                time: {
                    _type: "Number",
                    _info: "Maximum time to aim"
                }
            }
        }),
        init: function(data) {
            this.bounces = data.bounces || 0;
            this.size = data.size || 0;
            this.time = data.time || null
        },
        start: function(entity) {
            var b = entity.getTarget(),
                c = ig.CollTools.getDistVec2(entity.coll, b.coll, r),
                b = Vec2.createC(0, 0);
            Math.abs(c.y) > Math.abs(c.x) * 2 ? b.x = 1 : b.y = 1;
            Math.random() < 0.5 && Vec2.flip(b);
            var c = entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, j),
                d = ig.game.physics.initTraceResult(m);
            ig.game.trace(d, c.x - this.size /
                2, c.y - this.size / 2, c.z, b.x * 256, b.y * 256, this.size, this.size, this.size, ig.COLLTYPE.PROJECTILE, entity, void 0, false);
            entity.stepData.sidePos = [];
            entity.stepData.sidePos[0] = (b.x ? c.x : c.y) + (b.y || b.x) * Math.round(d.dist * 256);
            d = ig.game.physics.initTraceResult(m);
            ig.game.trace(d, c.x - this.size / 2, c.y - this.size / 2, c.z, -b.x * 256, -b.y * 256, this.size, this.size, this.size, ig.COLLTYPE.PROJECTILE, entity, void 0, false);
            entity.stepData.sidePos[1] = (b.x ? c.x : c.y) - (b.y || b.x) * Math.round(d.dist * 256);
            entity.stepData.throwDir = b;
            entity.stepTimer = entity.stepTimer + this.time
        },
        run: function(entity) {
            var b = entity.stepData.throwDir,
                c = entity.stepData.sidePos,
                d = entity.getTarget(),
                e = d.getCenter(r);
            Vec2.addMulF(e, d.coll.vel, 0.05);
            var d = entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, j),
                f = (this.bounces - 1) * Math.abs(c[0] - c[1]),
                g = this.bounces % 2 ? c[0] : c[1];
            if (b.y) {
                f = f + (Math.abs(c[0] - d.y) + Math.abs(g - e.y));
                entity.face.y = c[0] - d.y;
                entity.face.x = (e.x - d.x) * Math.abs(entity.face.y / f)
            } else {
                f = f + (Math.abs(c[0] - d.x) + Math.abs(g - e.x));
                entity.face.x = c[0] - d.x;
                entity.face.y = (e.y - d.y) * Math.abs(entity.face.x / f)
            }
            return entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_PLAYER_ACTION =
        ig.ActionStepBase.extend({
            _wm: new ig.Config({
                attributes: {
                    actions: {
                        _type: "Array",
                        _info: "List of player actions to react to",
                        _sub: {
                            _type: "String",
                            _select: sc.PLAYER_ACTION
                        }
                    },
                    attrib: {
                        _type: "String",
                        _info: "Attrib name to store action value to if successfully found",
                        _optional: true
                    },
                    target: {
                        _type: "String",
                        _info: "Where is player found?",
                        _select: d,
                        _optional: true
                    },
                    maxTime: {
                        _type: "Number",
                        _info: "Maximum time to wait",
                        _optional: true
                    }
                }
            }),
            init: function(data) {
                this.actions = data.actions || [];
                this.attrib = data.attrib || null;
                this.target =
                    d[data.target] || d.SELF;
                this.maxTime = data.maxTime || 0
            },
            start: function(entity) {
                this.attrib && entity.setAttribute(this.attrib, null);
                entity.stepTimer = entity.stepTimer + this.maxTime
            },
            run: function(entity) {
                var b = this.target(entity);
                if ((b = (b = b && b.getCombatantRoot()) && b.playerTrack && b.playerTrack.startedAction) && this.actions.indexOf(b) != -1) {
                    this.attrib && entity.setAttribute(this.attrib, b);
                    return true
                }
                return this.maxTime && entity.stepTimer <= 0
            }
        });
    ig.ACTION_STEP.SHARE_PROXY_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                group: {
                    _type: "String",
                    _info: "If set, only share target with proxies of that group"
                }
            }
        }),
        init: function(data) {
            this.group = data.group || null
        },
        start: function(entity) {
            for (var b = entity.getCombatantRoot().entityAttached, c = b.length; c--;) {
                var d = b[c];
                if (d instanceof sc.CombatProxyEntity && !(this.group && d.group != this.group)) d.tmpTarget = entity.tmpTarget
            }
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_PROXIES_DONE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                group: {
                    _type: "String",
                    _info: "If defined: only consider proxies with that label",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.group =
                data.group
        },
        run: function(entity) {
            for (var attached = entity.actionAttached, b = attached.length; b--;)
                if (attached[b] instanceof sc.CombatProxyEntity && !(this.group && attached[b].group != this.group)) return false;
            return true
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_COMBAT_TRUE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                conditions: {
                    _type: "CombatConditions",
                    _info: "Combat conditions. Will wait until evaluates to true."
                },
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time to wait",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.conditions = new sc.CombatConditions(data.conditions);
            this.maxTime = data.maxTime || 0
        },
        start: function(entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime
        },
        run: function(entity) {
            return this.conditions.check(entity, Math.random()) ? true : this.maxTime && entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_TRAP_OVER = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {},
        run: function(entity) {
            entity = entity.getTarget();
            return !entity || !entity.combo || !entity.combo.guardTrapTime ? true : false
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_TARGET_DEFEATED = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "If > 0 Maximum time to wait"
                }
            }
        }),
        init: function(data) {
            this.maxTime = data.maxTime
        },
        start: function(entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime
        },
        run: function(entity) {
            var b = entity.getTarget();
            return !b || !b.isDefeated || b.isDefeated() ? true : this.maxTime && entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.SPAWN_BURSTS = ig.ActionStepBase.extend({
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        dir: null,
        inFaceDir: false,
        burstSettings: null,
        dirRotate: 0,
        _wm: new ig.Config({
            attributes: {
                attack: {
                    _type: "AttackInfo",
                    _info: "Attack Info of circle attack"
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                dir: {
                    _type: "Vec2",
                    _info: "Static direction to move burst to",
                    _optional: true
                },
                dirRotate: {
                    _type: "Number",
                    _info: "Rotation to original dir. 1 = one full circle rotation"
                },
                inFaceDir: {
                    _type: "Boolean",
                    _info: "If true, spawn bursts along entity face. Otherwise directly to target"
                },
                effect: {
                    _type: "Effect",
                    _info: "Effect to play on each burst"
                },
                moveSpeed: {
                    _type: "Number",
                    _info: "Movement speed of bursts",
                    _default: 40
                },
                spawnCount: {
                    _type: "Number",
                    _info: "Number of bursts to spawn",
                    _default: 3
                },
                spawnInterval: {
                    _type: "Number",
                    _info: "Seconds to wait between bursts",
                    _default: 0.3
                },
                damageDelay: {
                    _type: "Number",
                    _info: "Damage delay after burst effects stars in seconds",
                    _default: 0
                },
                radius: {
                    _type: "Number",
                    _info: "Radius of burst damage",
                    _default: 32
                },
                zHeight: {
                    _type: "Number",
                    _info: "Z Range of burst damage",
                    _default: 24
                },
                steerDegree: {
                    _type: "Number",
                    _info: "To what degree bursts steer towards player.",
                    _default: 0.2
                },
                adjustTime: {
                    _type: "Number",
                    _info: "Time to 'fade In' steering degree at the beginning",
                    _optional: true
                },
                cancelOnCollision: {
                    _type: "Boolean",
                    _info: "If true: cancel spawning when hitting a wall"
                }
            }
        }),
        init: function(data) {
            this.offset = data.offset || this.offset;
            this.dir = data.dir || null;
            this.dirRotate = (data.dirRotate || 0) * Math.PI * 2;
            this.inFaceDir = data.inFaceDir || false;
            this.burstSettings = data;
            this.burstSettings.effect = new ig.EffectHandle(data.effect)
        },
        clearCached: function() {
            this.burstSettings.effect.clearCached()
        },
        run: function(entity) {
            var b = Vec3.create();
            entity.getCenter(b);
            b.z = entity.coll.pos.z;
            Vec3.add(b, this.offset);
            var c, d = entity.getTarget();
            if (this.dir) c = Vec2.create(this.dir);
            else if (this.inFaceDir ||
                !d) c = Vec2.create(entity.face);
            else {
                c = Vec2.create();
                d.getCenter(c);
                Vec2.sub(c, b)
            }
            this.dirRotate && Vec2.rotate(c, this.dirRotate);
            this.burstSettings.combatant = entity;
            this.burstSettings.vel = c;
            ig.game.spawnEntity(ig.BurstSpawnerEntity, b.x, b.y, b.z, this.burstSettings);
            this.burstSettings.combatant = null;
            return true
        }
    });
    var n = {
        STUN_LOCKED: 1,
        PREVIOUSLY_HIT: 2,
        TARGET: 3
    };
    ig.ACTION_STEP.DIRECT_HIT = ig.ActionStepBase.extend({
        directHitSettings: null,
        effect: null,
        _wm: new ig.Config({
            attributes: {
                selectType: {
                    _type: "String",
                    _info: "What entities to hit",
                    _select: n
                },
                attack: {
                    _type: "AttackInfo",
                    _info: "Attack Info of circle attack"
                },
                effect: {
                    _type: "Effect",
                    _info: "Effect to play on each burst",
                    _optional: true
                },
                hitDir: {
                    _type: "String",
                    _info: "Direct Hit direction",
                    _select: sc.DIRECT_HIT_DIR
                },
                align: {
                    _type: "String",
                    _info: "Alignment of force relative to entity",
                    _select: ig.ENTITY_ALIGN
                },
                hitCount: {
                    _type: "Number",
                    _info: "Number of hits",
                    _default: 1
                },
                hitDelay: {
                    _type: "Number",
                    _info: "Delay in seconds between hits",
                    _defualt: 0.1
                }
            }
        }),
        init: function(data) {
            this.selectType = n[data.selectType] ||
                n.STUN_LOCKED;
            this.directHitSettings = data;
            if (data.effect) this.effect = new ig.EffectHandle(data.effect)
        },
        clearCached: function() {
            this.effect && this.effect.clearCached()
        },
        start: function(entity) {
            if (this.selectType == n.TARGET) {
                var b = entity.getTarget();
                if (b) {
                    var c = new sc.DirectHitForce(entity, b, this.directHitSettings, this.effect);
                    sc.combat.addCombatForce(c);
                    this.directHitSettings.hitCount > 1 && entity.addActionAttached(c)
                }
            } else
                for (var b = entity.combo.hitCombatants, d = b.length; d--;) {
                    c = b[d];
                    if (!(this.selectType == n.STUN_LOCKED && (!c.params || !c.params.isLockedBy(entity)))) {
                        c =
                            new sc.DirectHitForce(entity, c, this.directHitSettings, this.effect);
                        sc.combat.addCombatForce(c);
                        this.directHitSettings.hitCount > 1 && entity.addActionAttached(c)
                    }
                }
        }
    });
    ig.ACTION_STEP.CLEAR_STUN_LOCKED = ig.ActionStepBase.extend({
        directHitSettings: null,
        effect: null,
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        clearCached: function() {},
        start: function(entity) {
            entity.clearActionAttached(b)
        }
    });
    ig.ACTION_STEP.REGEN_HP = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Number",
                    _info: "Relative amount of HP to regen. 1= FULL HP"
                },
                target: {
                    _type: "String",
                    _info: "What entity will get the buff",
                    _select: d,
                    _optional: true
                },
                hideNumbers: {
                    _type: "Boolean",
                    _info: "if true: do not show healing numbers"
                }
            }
        }),
        init: function(data) {
            this.value = {
                value: data.value
            };
            this.target = d[data.target] || d.SELF;
            this.hideNumbers = data.hideNumbers
        },
        start: function(entity) {
            (entity = this.target(entity)) && entity.heal(this.value, this.hideNumbers)
        }
    });
    ig.ACTION_STEP.HEAL_STATUS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.params && entity.params.healStatus()
        }
    });
    ig.ACTION_STEP.CLEAR_STATUS_BAR = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.statusGui && entity.statusGui.clearAllStatusEntries()
        }
    });
    ig.ACTION_STEP.SET_ENEMY_STATUS_VISIBILITY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                hpBar: {
                    _type: "String",
                    _info: "If defined, set whether HP bar visible or not",
                    _optional: true,
                    _select: sc.ENEMY_HP_BAR
                },
                analyzable: {
                    _type: "Boolean",
                    _info: "If defined, set whether status in general is visible or not",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.hpBar = data.hpBar ? sc.ENEMY_HP_BAR[data.hpBar] : void 0;
            this.analyzable = data.analyzable
        },
        start: function(entity) {
            if (this.hpBar != void 0) entity.visibility.hpBar = this.hpBar;
            if (this.analyzable != void 0) entity.visibility.analyzable = this.analyzable
        }
    });
    ig.ACTION_STEP.SET_HP_CRITICAL = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.params.setCritical()
        }
    });
    var p = {
        MAX_HP: function(a, b) {
            return a.params.getStat("hp") * b
        },
        ATTACK: function(a, b) {
            var c = a.params.getStat("attack",
                true) / a.params.getStat("attack", false);
            return a.params.getStat("attack") * b * c
        }
    };
    ig.ACTION_STEP.REDUCE_HP = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                basedOn: {
                    _type: "String",
                    _info: "What hp reduction is based on",
                    _select: p
                },
                factor: {
                    _type: "Number",
                    _info: "Factor to scale damage with",
                    _default: 0.1
                },
                hitNumberFactor: {
                    _type: "Number",
                    _info: "Will determine size of damage number",
                    _default: 0.5
                }
            }
        }),
        init: function(data) {
            this.basedOn = p[data.basedOn] || p.MAX_HP;
            this.factor = data.factor || 0;
            this.hitNumberFactor = data.hitNumberFactor ||
                0
        },
        start: function(entity) {
            var b = Math.round(this.basedOn(entity, this.factor));
            b && entity.instantDamage(b, this.hitNumberFactor)
        }
    });
    ig.ACTION_STEP.SET_HIT_IGNORE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "If true: ignore hits"
                }
            }
        }),
        init: function(data) {
            this.value = data.value || false
        },
        start: function(entity) {
            entity.hitIgnore = this.value
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_GUARDED = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Maximum time to wait"
                },
                meleeOnly: {
                    _type: "Boolean",
                    _info: "Only continue when melee attack was guarded"
                }
            }
        }),
        init: function(data) {
            this.maxTime = data.maxTime;
            this.meleeOnly = data.meleeOnly || false
        },
        start: function(entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime
        },
        run: function(entity) {
            entity = entity.getCombatantRoot();
            if (entity.isPlayer)
                if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) entity.gui.crosshair.getDir(entity.face);
                else {
                    sc.control.moveDir(r, 1);
                    Vec2.isZero(r) || Vec2.assign(entity.face, r)
                } entity.combo.guardTrapTime = entity.combo.guardTrapTime + ig.system.tick;
            if (entity.stepTimer <= 0 || entity.combo.guardedHits > 0 &&
                (!this.meleeOnly || entity.hasBlockEntity())) {
                entity.combo.guardTrapTime = 0;
                return true
            }
            return false
        }
    });
    ig.ACTION_STEP.ABSORB_BLOCKED_DAMAGE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                factor: {
                    _type: "Number",
                    _info: "Factor with which to absorb blocked damage"
                }
            }
        }),
        init: function(data) {
            this.factor = data.factor
        },
        start: function(entity) {
            var b = {
                absolute: true,
                value: Math.round(entity.combo.blockedDamage * this.factor)
            };
            entity.heal(b)
        }
    });
    ig.ACTION_STEP.ABSORB_DAMAGE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                factor: {
                    _type: "Number",
                    _info: "Factor with which to absorb blocked damage"
                }
            }
        }),
        init: function(data) {
            this.factor = data.factor
        },
        start: function(entity) {
            var b = entity.getAttribute("damage");
            if (b) {
                var root = entity.getCombatantRoot(),
                    c = root.params.getStat("attack", true) / root.params.getStat("attack", false),
                    b = {
                        absolute: true,
                        value: Math.round(b * this.factor * c)
                    };
                root.heal(b)
            }
        }
    });
    ig.ACTION_STEP.ABSORB_DAMAGE_VIA_SUM = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                factor: {
                    _type: "Number",
                    _info: "Factor with which to absorb dealed damage. Will always take average damage of all hit combatants"
                },
                multiEnemyScale: {
                    _type: "Number",
                    _info: "Add given factor to damage for each additional hit entity"
                }
            }
        }),
        init: function(data) {
            this.factor = data.factor;
            this.multiEnemyScale = data.multiEnemyScale || 0
        },
        start: function(entity) {
            var b = entity.combo.dmgSum;
            if (b) {
                var c = entity.getCombatantRoot(),
                    d = c.params.getStat("attack", true) / c.params.getStat("attack", false),
                    b = b * d / entity.combo.hitCombatants.length;
                this.multiEnemyScale && (b = b * (1 + this.multiEnemyScale * (entity.combo.hitCombatants.length - 1)));
                entity = {
                    absolute: true,
                    value: Math.round(b * this.factor)
                };
                c.heal(entity)
            }
        }
    });
    ig.ACTION_STEP.CONSUME_SP = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                sp: {
                    _type: "Integer",
                    _info: "Number of SP to consume"
                }
            }
        }),
        init: function(data) {
            this.sp = data.sp
        },
        start: function(entity) {
            entity.params.consumeSp(this.sp)
        }
    });
    ig.ACTION_STEP.SET_FREE_LINE_CMD = ig.ActionStepBase.extend({
        time: 0,
        _wm: new ig.Config({
            attributes: {
                time: {
                    _type: "Number",
                    _info: "Time in seconds for free line command to preserve"
                }
            }
        }),
        init: function(data) {
            this.time = data.time
        },
        run: function(entity) {
            sc.combat.addFreeLineCommand(entity, this.time);
            return true
        }
    });
    ig.ACTION_STEP.ADD_SHIELD = ig.ActionStepBase.extend({
        name: null,
        shield: null,
        actionDetached: false,
        perfectGuardTime: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of Shield. If used, shield will remain after action end and can be disabled separately",
                    _optional: true
                },
                shield: {
                    _type: "Shield",
                    _info: "The Shield to activate"
                },
                actionDetached: {
                    _type: "Boolean",
                    _info: "If true, keep shield even after action is finished/interrupted."
                },
                perfectGuardTime: {
                    _type: "Number",
                    _info: "Amount of time for perfect guard",
                    _optional: true
                },
                target: {
                    _type: "String",
                    _info: "What entity will get the buff",
                    _select: d,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.name = data.name;
            var b = data.shield;
            this.shield = new sc.COMBAT_SHIELDS[b.type](b.settings, this.name);
            this.actionDetached = data.actionDetached || false;
            this.perfectGuardTime = data.perfectGuardTime || null;
            this.target = d[data.target] || d.SELF
        },
        clearCached: function() {
            this.shield && this.shield.clearCached()
        },
        run: function(entity) {
            var b = this.target(entity).getCombatantRoot().addShield(this.shield, this.perfectGuardTime);
            this.actionDetached || entity.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.REMOVE_SHIELD = ig.ActionStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of Shield to be removed"
                },
                target: {
                    _type: "String",
                    _info: "What entity will get the buff",
                    _select: d,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.name = data.name;
            this.target = d[data.target] || d.SELF
        },
        run: function(entity) {
            this.target(entity).getCombatantRoot().removeNamedShield(this.name);
            return true
        }
    });
    ig.ACTION_STEP.SPAWN_ASSAULT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                baseStrength: {
                    _type: "Number",
                    _info: "Base Strength Factor. Should match damageFactor of attack"
                },
                element: {
                    _type: "String",
                    _info: "Element of Assault projectile",
                    _select: sc.ELEMENT,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.baseStrength = data.baseStrength || 0;
            if (data.element) this.element = sc.ELEMENT[data.element]
        },
        run: function(entity) {
            var b = this.element === void 0 ? sc.combat.getElementMode(entity) : this.element;
            sc.AssaultTools.spawn(entity, b, this.baseStrength);
            return true
        }
    });
    ig.ACTION_STEP.SHOW_COMBAT_MSG = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                msgType: {
                    _type: "String",
                    _info: "What kind of combat message",
                    _select: sc.COMBAT_MSG_TYPE
                }
            }
        }),
        init: function(data) {
            this.msgType = sc.COMBAT_MSG_TYPE[data.msgType] || sc.COMBAT_MSG_TYPE.STUN_CANCEL
        },
        start: function(entity) {
            sc.combat.showCombatMessage(entity, this.msgType)
        }
    });
    ig.ACTION_STEP.ADD_TARGET_STUN_LOCK = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(entity) {
            var b = entity.getTarget();
            b && (b.params && b.hasStun()) && b.params.startLock(entity);
            return true
        }
    });
    ig.ACTION_STEP.THROW_ENERGY_DROPS = ig.ActionStepBase.extend({
        target: null,
        dropType: null,
        healValue: null,
        _wm: new ig.Config({
            attributes: {
                dropType: {
                    _type: "String",
                    _info: "Type of Drop",
                    _select: sc.DROP_TYPE
                },
                healValue: {
                    _type: "Number",
                    _info: "Amount that is healed. 1=full healing"
                },
                align: {
                    _type: "String",
                    _info: "Alignment of throw origin",
                    _select: ig.ENTITY_ALIGN
                },
                target: {
                    _type: "Entity",
                    _info: "Target entity to throw drops at",
                    _optional: true
                },
                partyToo: {
                    _type: "Boolean",
                    _info: "If true also spawn heal drops for all party members"
                }
            }
        }),
        init: function(data) {
            this.dropType = data.dropType;
            this.healValue =
                data.healValue || 0.1;
            this.align = ig.ENTITY_ALIGN[data.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.target = data.target;
            this.partyToo = data.partyToo
        },
        run: function(entity) {
            var b = null;
            this.target && (b = ig.Event.getEntity(this.target));
            sc.DropEntity.spawnDrops(entity, this.align, this.dropType, this.healValue, b);
            if (this.partyToo)
                for (b = sc.party.getPartySize(); b--;) {
                    var c = sc.party.getPartyMemberEntityByIndex(b);
                    c && (c.model && c.model.isAlive()) && sc.DropEntity.spawnDrops(entity, this.align, this.dropType, this.healValue, c)
                }
            return true
        }
    });
    ig.ACTION_STEP.THROW_GENERIC_DROP =
        ig.ActionStepBase.extend({
            target: null,
            dropType: null,
            minVal: null,
            maxVal: null,
            varIncrease: null,
            circleEffect: null,
            pickupEffect: null,
            _wm: new ig.Config({
                attributes: {
                    dropType: {
                        _type: "String",
                        _info: "Type of Drop",
                        _select: sc.DROP_TYPE
                    },
                    align: {
                        _type: "String",
                        _info: "Alignment of throw origin",
                        _select: ig.ENTITY_ALIGN
                    },
                    minVal: {
                        _type: "VarName",
                        _info: "min number of coins to drops at a time"
                    },
                    maxVal: {
                        _type: "VarName",
                        _info: "max number of coins to drops at a time"
                    },
                    varIncrease: {
                        _type: "VarName",
                        _info: "Optional var to increase by the random number",
                        _optional: true
                    },
                    target: {
                        _type: "Entity",
                        _info: "Target entity to throw drops at",
                        _optional: true
                    },
                    circleEffect: {
                        _type: "EffectSelect",
                        _info: "Circle Effect to be used when drops is picked up.",
                        _effectName: "drops"
                    },
                    pickupEffect: {
                        _type: "EffectSelect",
                        _info: "Circle Effect to be used when drops is picked up.",
                        _effectName: "drops"
                    }
                }
            }),
            init: function(data) {
                this.dropType = data.dropType;
                this.minVal = data.minVal || 1;
                this.maxVal = data.maxVal || 1;
                this.align = ig.ENTITY_ALIGN[data.align] || ig.ENTITY_ALIGN.BOTTOM;
                this.target = data.target;
                this.varIncrease =
                    data.varIncrease;
                this.circleEffect = data.circleEffect;
                this.pickupEffect = data.pickupEffect
            },
            run: function(entity) {
                var b = null;
                this.target && (b = ig.Event.getEntity(this.target));
                var c = {
                    align: this.align,
                    type: this.dropType,
                    min: ig.vars.get(this.minVal) || 1,
                    max: ig.vars.get(this.minVal) || 1,
                    varIncrease: this.varIncrease,
                    circleEffect: this.circleEffect,
                    pickupEffect: this.pickupEffect
                };
                sc.DropEntity.spawnGenericDrops(entity, b, c);
                return true
            }
        });
    ig.ACTION_STEP.NAVIGATE_TO_SPAWN_POINT = ig.ActionStepBase.extend({
        maxTime: 0,
        maxDistance: 0,
        precise: false,
        _wm: new ig.Config({
            attributes: {
                maxTime: {
                    _type: "Number",
                    _info: "Maxium time spent on navigation"
                },
                maxDistance: {
                    _type: "Number",
                    _info: "The maximum amount of distance to the target"
                },
                precise: {
                    _type: "Boolean",
                    _info: "Reach the target precisely, slowing down accordingly"
                }
            }
        }),
        init: function(data) {
            this.maxTime = data.maxTime;
            this.maxDistance = data.maxDistance || 0;
            this.precise = data.precise || false
        },
        start: function(entity) {
            entity.stepTimer = entity.stepTimer + this.maxTime;
            var b = entity.spawnPoint;
            if (b) {
                var c = ig.navigation.getNavPath(entity);
                c.toPoint(b, this.maxDistance,
                    this.precise);
                entity.stepData.path = c
            } else entity.stepData.path = null
        },
        run: function(entity) {
            if (!entity.stepData.path) return true;
            if (this.maxTime && entity.stepTimer <= 0 && !entity.jumping) {
                entity.stepData.path.interrupt();
                return true
            }
            return entity.stepData.path.moveEntity()
        }
    });
    var r = Vec2.create(),
        t = {
            FACE_REVERSE: 1,
            FACE: 2
        };
    ig.ACTION_STEP.DO_DAMAGE_MOVEMENT = ig.ActionStepBase.extend({
        flyLevel: null,
        breaking: false,
        stable: false,
        wait: false,
        _wm: new ig.Config({
            attributes: {
                flyLevel: {
                    _type: "String",
                    _info: "How far entity will fly",
                    _select: sc.COMBAT_FLY_LEVEL
                },
                breaking: {
                    _type: "Boolean",
                    _info: "True if movement is for breaking hit."
                },
                stable: {
                    _type: "Boolean",
                    _info: "True if movement is for stable hit."
                },
                wait: {
                    _type: "Boolean",
                    _info: "True if step should wait the matching stun time."
                },
                direction: {
                    _type: "String",
                    _info: "What face direction? (Reverse Face is default)",
                    _optional: true,
                    _select: t
                }
            }
        }),
        init: function(data) {
            this.flyLevel = data.flyLevel;
            this.breaking = data.breaking || false;
            this.stable = data.stable || false;
            this.wait = data.wait || false;
            this.direction = t[data.direction] || t.FACE_REVERSE
        },
        start: function(entity) {
            Vec2.assign(r, entity.face);
            this.direction == t.FACE_REVERSE && Vec2.flip(r);
            var b = entity.doDamageMovement(r, this.flyLevel, this.breaking, false, 0, true);
            if (this.wait) entity.stepTimer = entity.stepTimer + b
        },
        run: function(entity) {
            return !this.wait || entity.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.COMBAT_IF = ig.ActionStepBase.extend({
        conditions: null,
        withElse: false,
        branches: {},
        _wm: new ig.Config({
            attributes: {
                conditions: {
                    _type: "CombatConditions",
                    _info: "Combat conditions for if statement"
                },
                withElse: {
                    _type: "Boolean",
                    _info: "With else case.",
                    _noLabel: true
                }
            },
            branchLabel: function(label) {
                switch (label) {
                    case "thenStep":
                        return null;
                    case "elseStep":
                        return "else";
                    case "_end":
                        return "endif"
                }
                return "???"
            }
        }),
        init: function(data) {
            this.conditions = new sc.CombatConditions(data.conditions);
            this.withElse = data.withElse
        },
        getBranchNames: function() {
            return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
        },
        getNext: function(entity) {
            var b = Math.random();
            return this.conditions.check(entity, b) ? this.branches.thenStep ? this.branches.thenStep : this._nextStep : this.branches.elseStep ? this.branches.elseStep :
                this._nextStep
        }
    });
    var q = {
        set: function(a, b) {
            return b
        },
        add: function(a, b) {
            return a + b
        },
        sub: function(a, b) {
            return a - b
        },
        mul: function(a, b) {
            return a * b
        },
        div: function(a, b) {
            return a / b
        },
        mod: function(a, b) {
            return a % b
        }
    };
    ig.ACTION_STEP.CHANGE_COLLAB_VAR = ig.ActionStepBase.extend({
        varName: null,
        changeOperator: null,
        value: 0,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "String",
                    _info: "Name of Var"
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: q
                },
                value: {
                    _type: "NumberExpression",
                    _info: "Value to modify with"
                }
            }
        }),
        init: function(data) {
            this.varName = data.varName;
            this.changeOperator = q[data.changeType] || q.set;
            this.value = data.value || 0
        },
        run: function(entity) {
            if (entity = entity.getCombatantRoot().collaboration) {
                var b = entity.getVar(this.varName),
                    c = ig.Event.getExpressionValue(this.value),
                    b = this.changeOperator(b, c * 1);
                entity.setVar(this.varName, b);
                return true
            }
        }
    });
    ig.ACTION_STEP.SET_COLLAB_BREAK_TYPE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                breakType: {
                    _type: "String",
                    _info: "Who needs to be interrupted to cancel collaboration",
                    _select: sc.ENEMY_COLLAB_BREAK
                }
            }
        }),
        init: function(data) {
            this.breakType = sc.ENEMY_COLLAB_BREAK[data.breakType]
        },
        start: function(entity) {
            if (entity.collaboration) entity.collaboration.breakType = this.breakType
        }
    });
    var s = {
            TARGET_CIRCLE: function(a, b, c, d, e, f) {
                for (var g = c[0].coll.size, c = c.length, h = -f / 2, f = f / (f == 1 ? c : c - 1); c--;) {
                    var i = Vec3.create();
                    ig.navigation.getClosePosition(i, d, g, b, null, e, 0.25, h, ig.NAV_CLOSE_POINT_SEARCH.FRONT, false);
                    h = h + f;
                    a.push(i)
                }
            },
            WHALE_TOP: function(a, b, c, d, e) {
                d = Vec3.create();
                b.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d);
                d.x = d.x + (b.face.x < 0 ? -1 : 1) *
                    e;
                for (b = c.length; b--;) a.push(d)
            }
        },
        v = {
            SELF: function(entity) {
                return entity
            },
            TARGET: function(entity) {
                return entity.getTarget()
            },
            COLLAB_ENTITY: function(a, b) {
                return a.collaboration ? a.collaboration.getLabeledParticipant(b) : null
            }
        };
    ig.ACTION_STEP.ASSIGN_COLLAB_POINTS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                targetType: {
                    _type: "String",
                    _info: "Target from which points will be set relatively",
                    _select: v
                },
                targetLabel: {
                    _type: "String",
                    _info: "Additional target label. (only required for COLLAB_ENTITY type)"
                },
                labelFilter: {
                    _type: "Array",
                    _info: "List of labels to filter collaborators",
                    _sub: {
                        _type: "String"
                    },
                    _optional: true
                },
                pointPattern: {
                    _type: "String",
                    _info: "Pattern of points",
                    _select: s
                },
                distance: {
                    _type: "Number",
                    _info: "Distance value used to determine points",
                    _default: 64
                },
                circularAngle: {
                    _type: "Number",
                    _info: "Circular angle used to determine points"
                }
            }
        }),
        init: function(data) {
            this.targetType = v[data.targetType] || v.TARGET;
            this.targetLabel = data.targetLabel;
            this.labelFilter = data.labelFilter || null;
            this.pointPattern = s[data.pointPattern] || s.TARGET_CIRCLE;
            this.distance =
                data.distance || 0;
            this.circularAngle = data.circularAngle || 0
        },
        start: function(entity) {
            var b = entity.collaboration,
                c = this.targetType(entity, this.targetLabel);
            if (b && c) {
                entity = b.getLabeledParticipants(this.labelFilter);
                if (entity.length) {
                    var d = [],
                        b = b.getCenterPos(j, ig.ENTITY_ALIGN.BOTTOM, this.labelFilter);
                    this.pointPattern(d, c, entity, b, this.distance, this.circularAngle);
                    for (b = entity.length; b--;) {
                        for (var c = entity[b], e = c.getCenter(i), f = d.length, g = -1, h = -1; f--;) {
                            var k = Vec2.distance(d[f], e);
                            if (g == -1 || k < g) {
                                g = k;
                                h = f
                            }
                        }
                        c.collabAttribs.point = d[h];
                        d.splice(h, 1)
                    }
                }
            }
        }
    });
    ig.ACTOR_ATTRIB_CONNECTION.PROXY_OWNER = function(a) {
        return a.getCombatantRoot && a.getCombatantRoot()
    };
    ig.ACTOR_ATTRIB_CONNECTION.PROXY_SOURCE = function(a) {
        return a.sourceEntity
    };
    ig.ACTOR_ATTRIB_CONNECTION.TARGET = function(a) {
        return a.getTarget()
    };
    var y = {
        ENTITY_NAME: function(a) {
            return a.name
        }
    };
    ig.ACTION_STEP.SET_ATTRIB_TARGET_VALUE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                attribName: {
                    _type: "String",
                    _info: "Name of Var"
                },
                valueType: {
                    _type: "String",
                    _info: "Kind of value to extract from target",
                    _select: y
                }
            }
        }),
        init: function(data) {
            this.attribName = data.attribName;
            this.valueType = y[data.ENTITY_NAME] || y.ENTITY_NAME
        },
        start: function(entity) {
            var b = entity.getTarget();
            b && entity.setAttribute(this.attribName, this.valueType(b))
        }
    });
    ig.ACTION_STEP.SET_COLLAB_ENTITY = ig.ActionStepBase.extend({
        entityType: null,
        entityLabel: null,
        labelFilter: null,
        _wm: new ig.Config({
            attributes: {
                entityType: {
                    _type: "String",
                    _info: "What kind of entity is set",
                    _select: v
                },
                entityLabel: {
                    _type: "String",
                    _info: "Additional entity label. (only required for COLLAB_ENTITY type)"
                },
                labelFilter: {
                    _type: "CollabLabelFilter",
                    _info: "Labels to filter which entities in collaboration will have entity assigned",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.entityType = v[data.varName] || v.SELF;
            this.entityLabel = data.entityLabel;
            this.labelFilter = data.labelFilter
        },
        start: function(entity) {
            if (entity.collaboration) {
                var b = this.entityType(entity, this.entityLabel);
                entity.collaboration.setParticipantsEntity(b, this.labelFilter)
            }
        }
    });
    ig.ACTION_STEP.STORE_IN_COLLAB_PARTNER = ig.ActionStepBase.extend({
        label: null,
        _wm: new ig.Config({
            attributes: {
                label: {
                    _type: "String",
                    _info: "Label of collab partner"
                }
            }
        }),
        init: function(data) {
            this.label = data.label
        },
        start: function(entity) {
            if (entity.collaboration) {
                entity.collaboration.getLabeledParticipant(this.label).storeEnemy(entity);
                entity.setTarget(null);
                entity.hide()
            }
        }
    });
    ig.ACTION_STEP.CONNECT_HP_TO_STORED_ENEMIES = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.connectHpToEnemies(entity.storedEnemies)
        }
    });
    ig.ACTION_STEP.CONNECT_HP_TO_TYPES_ENEMIES = ig.EventStepBase.extend({
        target: 0,
        _wm: new ig.Config({
            attributes: {
                enemyType: {
                    _type: "String",
                    _info: "Type of enemy",
                    _select: "enemies"
                }
            }
        }),
        init: function(data) {
            this.enemyType = data.enemyType
        },
        start: function(entity) {
            for (var b = ig.game.shownEntities, c = b.length, d = []; c--;) {
                var e = b[c];
                e instanceof ig.ENTITY.Enemy && e.enemyName == this.enemyType && d.push(e)
            }
            entity.connectHpToEnemies(d)
        }
    });
    ig.ACTION_STEP.UPDATE_RESPAWN_POINT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            Vec3.assign(entity.respawn.pos, entity.coll.pos)
        }
    });
    ig.ACTION_STEP.SEND_ENEMY_MSG = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                key: {
                    _type: "String",
                    _info: "Key of Enemy Message that other enemies may react to via ENEMY_EVENT"
                }
            }
        }),
        init: function(data) {
            this.key = data.key
        },
        run: function(entity) {
            sc.combat.sendEnemyMessage(entity, this.key);
            return true
        }
    });
    ig.ACTION_STEP.RESET_TRACKER = ig.ActionStepBase.extend({
        tracker: null,
        forceValue: void 0,
        _wm: new ig.Config({
            attributes: {
                tracker: {
                    _type: "TrackerRef",
                    _info: "Tracker to reset"
                },
                forceValue: {
                    _type: "Number",
                    _info: "Force reset tracker to a certain percentage of target (0-1)",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.tracker = data.tracker;
            this.forceValue = data.forceValue
        },
        start: function(entity) {
            var b = entity.trackers[this.tracker];
            b && b.reset(entity, this.forceValue)
        }
    });
    ig.ACTION_STEP.RESET_FREQUENCY = ig.ActionStepBase.extend({
        tracker: null,
        forceValue: void 0,
        _wm: new ig.Config({
            attributes: {
                frequency: {
                    _type: "String",
                    _info: "Frequency to reset (as if the enemy would have executed an attack of that frequency)",
                    _select: sc.ATTACK_FREQUENCY
                }
            }
        }),
        init: function(data) {
            this.frequency = data.frequency
        },
        start: function(entity) {
            sc.combat.submitFrequency(entity, this.frequency, true)
        }
    });
    ig.ACTION_STEP.RELEASE_STORED_ENEMIES =
        ig.ActionStepBase.extend({
            align: null,
            distance: 0,
            centralAngle: 0,
            startAngle: 0,
            actionName: null,
            uniformRandom: 0,
            _wm: new ig.Config({
                attributes: {
                    align: {
                        _type: "String",
                        _info: "Aligned pos from where to start entity",
                        _select: ig.ENTITY_ALIGN
                    },
                    distance: {
                        _type: "Number",
                        _info: "Distance towards storing entity when spawned"
                    },
                    centralAngle: {
                        _type: "Number",
                        _info: "Central angle of range. 1 = full circle"
                    },
                    startAngle: {
                        _type: "Number",
                        _info: "Angle from which to start. Default is - centralAngle / 2",
                        _optional: true
                    },
                    uniformRandom: {
                        _type: "Number",
                        _info: "Additional randomness around original direction"
                    }
                }
            }),
            init: function(data) {
                this.align = ig.ENTITY_ALIGN[data.align] || ig.ENTITY_ALIGN.BOTTOM;
                this.distance = data.distance || 0;
                this.centralAngle = data.centralAngle;
                this.startAngle = data.startAngle;
                if (this.startAngle == void 0) this.startAngle = -this.centralAngle / 2;
                this.uniformRandom = data.uniformRandom
            },
            start: function(entity) {
                var b = entity.storedEnemies,
                    d = b.length,
                    e = d;
                Vec2.assign(r, entity.face);
                Vec2.rotate(r, this.startAngle * Math.PI * 2);
                var d = this.centralAngle / (this.centralAngle == 1 ? d : d - 1) * Math.PI *
                    2,
                    f = entity.getAlignedPos(this.align, c);
                for (this.distance && Vec2.length(r, this.distance); e--;) {
                    var g = b[e],
                        h = (Math.random() - 0.5) * this.uniformRandom * d;
                    h && Vec2.rotate(r, h);
                    Vec2.assign(g.face, r);
                    Vec3.assign(j, f);
                    this.distance && Vec2.add(j, r);
                    g.setPos(j.x - g.coll.size.x / 2, j.y - g.coll.size.y / 2, j.z);
                    g.setTarget(entity.target);
                    g.onStoredRelease();
                    h && Vec2.rotate(r, -h);
                    Vec2.rotate(r, d)
                }
                b.length = 0
            }
        });
    ig.ACTION_STEP.REASSIGN_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.enemyType &&
                entity.enemyType.reselectTarget(entity, false, true)
        }
    });
    ig.ACTION_STEP.DESTROY_DESTRUCTIBLES = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            for (var a = ig.game.getEntitiesByType("Destructible"), b = a.length; b--;) a[b].startDestruction()
        }
    });
    ig.ACTION_STEP.SPAWN_ENEMIES = ig.ActionStepBase.extend({
        forceSettings: null,
        enemyInfo: null,
        enemyType: null,
        _wm: new ig.Config({
            attributes: {
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy information",
                    _popup: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset relative to entity ground center from which to shoot"
                },
                align: {
                    _type: "String",
                    _info: "Alignment relative to entity from which to shoot",
                    _select: ig.ENTITY_ALIGN
                },
                dir: {
                    _type: "Vec2",
                    _info: "Direction to go to",
                    _actorOption: true,
                    _optional: true
                },
                pushVel: {
                    _type: "NumberVary",
                    _info: "If defined: push away enemies with given velocity",
                    _optional: true
                },
                pushZVel: {
                    _type: "NumberVary",
                    _info: "If defined: push away enemies with given z velocity",
                    _optional: true
                },
                centralAngle: {
                    _type: "Number",
                    _info: "Central angle of range. 1 = full circle"
                },
                startAngle: {
                    _type: "Number",
                    _info: "Angle from which to start. Default is - centralAngle / 2",
                    _optional: true
                },
                angleVary: {
                    _type: "Number",
                    _info: "Randomly vary each angle with the provided range"
                },
                startDist: {
                    _type: "Number",
                    _info: "Start Distance of ball in throw direction",
                    _optional: true
                },
                startDistCollide: {
                    _type: "String",
                    _info: "If not NONE: consider environment collision before adding start dist. CLOSER = move closer, DROP = Don't spawn if colliding",
                    _select: sc.SPAWN_START_DIST_COLLIDE
                },
                random: {
                    _type: "Boolean",
                    _info: "Spawn each Proxy in random direction within range"
                },
                count: {
                    _type: "NumberExpression",
                    _info: "The number of proxies thrown"
                },
                duration: {
                    _type: "Number",
                    _info: "Time it takes to throw proxies"
                },
                clockwise: {
                    _type: "Boolean",
                    _info: "If true throw proxies clockwise, otherwise counter clockwise"
                },
                flipLeftFace: {
                    _type: "Integer",
                    _info: "If FACE COUNT is provided: swap clockWise if face direction is towards left"
                },
                offsetArea: {
                    _type: "Vec2",
                    _info: "offset Area around position to randomly spawn entity at",
                    _optional: true
                },
                circularArea: {
                    _type: "Boolean",
                    _info: "Make offsetArea circular, not rectangular"
                },
                uniformDir: {
                    _type: "Number",
                    _info: "To what extend the final dir should be uniform. 1=all the same dir, 0= all individual, 0.5=between the two"
                },
                delay: {
                    _type: "Number",
                    _info: "Time delay for first shot"
                },
                repeat: {
                    _type: "Boolean",
                    _info: "If true, repeat proxy spawning until ended by force (action end or call STOP_REPEATING_FORCE)"
                },
                attachProxy: {
                    _type: "ProxyRef",
                    _info: "If defined: attach proxy to enemies",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.forceSettings = ig.copy(data);
            if (data.enemyInfo) this.enemyInfo = new sc.EnemyInfo(data.enemyInfo);
            this.forceSettings.enemyType = this.enemyInfo.enemyType;
            data.attachProxy && (this.forceSettings.proxySrc = sc.ProxyTools.prepareSrc(data.attachProxy))
        },
        clearCached: function() {
            this.enemyInfo && this.enemyInfo.clearCached();
            this.forceSettings.proxySrc && sc.ProxyTools.releaseSrc(this.forceSettings.proxySrc)
        },
        start: function(entity) {
            var b = new sc.EnemySpawnerForce(entity, this.forceSettings);
            sc.combat.addCombatForce(b);
            entity.addActionAttached(b)
        }
    });
    ig.ACTION_STEP.SPAWN_ENEMY_CLOSEBY = ig.ActionStepBase.extend({
        forceSettings: null,
        enemyInfo: null,
        enemyType: null,
        _wm: new ig.Config({
            attributes: {
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy information",
                    _popup: true
                },
                radius: {
                    _type: "Number",
                    _info: "Radius from position"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn and despawn",
                    _popup: true,
                    _optional: true
                }
            }
        }),
        init: function(data) {
            if (data.enemyInfo) this.enemyInfo = new sc.EnemyInfo(data.enemyInfo);
            this.radius = data.radius || 0;
            this.spawnCondition = data.spawnCondition || null
        },
        clearCached: function() {
            this.enemyInfo && this.enemyInfo.clearCached()
        },
        start: function(entity) {
            var b =
                Vec3.create();
            ig.navigation.getClosePosition(b, entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c), this.enemyInfo.enemyType.size, entity, null, this.radius, 1, 0, ig.NAV_CLOSE_POINT_SEARCH.BEHIND_FACE, false);
            ig.game.spawnEntity(ig.ENTITY.Enemy, b.x - this.enemyInfo.enemyType.size.x / 2, b.y - this.enemyInfo.enemyType.size.y / 2, b.z, {
                enemyInfo: this.enemyInfo.getSettings(),
                ownerEnemy: entity.getCombatantRoot(),
                spawnCondition: this.spawnCondition
            }, true)
        }
    });
    ig.ACTION_STEP.KILL_ENEMIES = ig.ActionStepBase.extend({
        enemyType: null,
        noRumble: false,
        _wm: new ig.Config({
            attributes: {
                enemyType: {
                    _type: "String",
                    _info: "If provided: only remove enemy of this type",
                    _optional: true,
                    _select: "enemies"
                },
                noRumble: {
                    _type: "Boolean",
                    _info: "If true, do not rumble screen on enemy kill",
                    _optional: true,
                    _default: "true"
                }
            }
        }),
        init: function(data) {
            this.enemyType = data.enemyType;
            this.noRumble = data.noRumble
        },
        start: function() {
            sc.combat.removeEnemies(this.enemyType, null, this.noRumble, true)
        }
    });
    ig.ACTION_STEP.SELF_DESTRUCT = ig.ActionStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                noReward: {
                    _type: "Boolean",
                    _info: "No exp, credit, items etc."
                }
            }
        }),
        init: function(data) {
            this.noRewards = data.noReward || false
        },
        start: function(entity) {
            entity.selfDestruct(this.noRewards)
        }
    });
    var u = {
        PLAYER: function() {
            return ig.game.playerEntity
        },
        PARTY_0: function() {
            return sc.party.getPartyMemberEntityByIndex(0, true)
        },
        PARTY_1: function() {
            return sc.party.getPartyMemberEntityByIndex(1, true)
        },
        COLLAB_ENTITY: function(a) {
            return a.collabAttribs && a.collabAttribs.entity
        },
        COLLAB_LABELED_ENTITY: function(a, b) {
            return a.collaboration ? a.collaboration.getLabeledParticipant(b) :
                null
        },
        CLOSEST_ENEMY: function(a) {
            for (var b = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, j), c = Math.PI * 0.5, b = ig.game.getEntitiesInCircle(b, ig.system.width / 2, 1, 32, a.face, -c / 2, c / 2, a), c = null, d = 0, e = b.length; e--;) {
                var f = b[e];
                if (f instanceof ig.ENTITY.Combatant && f.party != a.party) {
                    var g = ig.CollTools.getDistVec2(a.coll, f.coll, r),
                        h = Vec2.angle(a.face, g),
                        g = Vec2.length(g) + h * 1E3;
                    if (!c || g < d) {
                        c = f;
                        d = g
                    }
                }
            }
            return c
        },
        GUARDED_ATTACKER: function(entity) {
            entity = entity.combo.guardedEntity;
            return !entity || entity.isBall ? null : entity.getCombatant()
        },
        FIRST_HIT: function(entity) {
            return entity.combo.hitCombatants[0]
        },
        PROXY_OWNER: function(entity) {
            return entity.getCombatantRoot()
        },
        ENEMY_OWNER: function(entity) {
            return entity.getCombatantRoot().ownerEnemy
        },
        ENEMY_OWNER_ACTION_PROXY: function(b, c) {
            if (!b.getCombatantRoot().ownerEnemy) return null;
            var d = b.getCombatantRoot().ownerEnemy.actionAttached;
            return findProxyInGroup(d, c)
        },
        PROXY_SRC: function(entity) {
            return entity.sourceEntity
        },
        ACTION_PROXY: function(b, c) {
            return findProxyInGroup(b.actionAttached, c)
        },
        PROXY: function(entity, group) {
            return findProxyInGroup(entity.entityAttached, group)
        },
        PROXY_OWNER_ACTION_PROXY: function(b, c) {
            var d = b.getCombatantRoot().actionAttached;
            return findProxyInGroup(d, c)
        },
        PROXY_SRC_ACTION_PROXY: function(b, c) {
            return findProxyInGroup(b.sourceEntity.actionAttached, c)
        },
        NAMED_ENTITY: function(entity, key) {
            return ig.game.namedEntities[key]
        },
        ATTRIB_ENTITY: function(entity, attrib) {
            return ig.Event.getEntity(entity.getAttribute(attrib))
        },
        THREAT: function(entity) {
            return entity.threat
        },
        ENTITY_VIA_ID: function(entity, id) {
            return ig.game.entities[id]
        },
        PART_TARGET_ROOT: function(entity) {
            entity = entity.getTarget();
            return entity instanceof sc.CombatantAnimPartEntity ? entity.getCombatantRoot() : entity
        }
    };
    ig.ACTION_STEP.SET_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                kind: {
                    _type: "String",
                    _info: "Kind of temp target",
                    _select: u
                },
                key: {
                    _type: "StringExpression",
                    _info: "Additional String key to fetch named entities etc.",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.kind = u[data.kind] || u.PLAYER;
            this.key = data.key
        },
        start: function(entity) {
            var b = ig.Event.getExpressionValue(this.key),
                b = this.kind(entity, b);
            if (entity instanceof sc.BasicCombatant) entity.tmpTarget = b
        }
    });
    ig.ACTION_STEP.SET_ATTRIB_TARGET_ENTITY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                attrib: {
                    _type: "String",
                    _info: "Attrib name to store target entity in (will use temp target if defined)"
                }
            }
        }),
        init: function(data) {
            this.attrib = data.attrib || null
        },
        start: function(entity) {
            var b = entity.getTarget();
            entity.setAttribute(this.attrib, b)
        }
    });
    var z = {
            IN_VIEW: {
                angle: 0.25,
                radius: 350,
                facePriority: true
            },
            CLOSE_RANGE: {
                angle: 1,
                radius: 200
            },
            MEDIUM_RANGE: {
                angle: 1,
                radius: 400
            },
            LONG_RANGE: {
                angle: 1,
                radius: 600
            },
            SCREEN_RANGE: {
                angle: 1,
                radius: 1200
            }
        },
        D = {
            NONE: 0,
            PREFER_NON_HIT: 1,
            ONLY_NON_HIT: 2
        };
    ig.ACTION_STEP.SET_CLOSE_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                searchType: {
                    _type: "String",
                    _info: "How to search close target",
                    _select: z
                },
                distance: {
                    _type: "Number",
                    _info: "If defined: look for entities up to this distance. Otherwise use default",
                    _optional: true
                },
                ignoreCurrentTarget: {
                    _type: "Boolean",
                    _info: "If true: ignore current target (will select temp target if available)"
                },
                prevHitBehavior: {
                    _type: "String",
                    _info: "How to handle enemies that have been previously hit",
                    _select: D
                }
            }
        }),
        init: function(data) {
            this.searchType = z[data.searchType] || z.IN_VIEW;
            this.distance = data.distance || 0;
            this.ignoreCurrentTarget = data.ignoreCurrentTarget || false;
            this.prevHitBehavior =
                D[data.prevHitBehavior] || D.NONE
        },
        start: function(entity) {
            for (var b = entity.getTarget(), c = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, j), d = this.searchType.angle * Math.PI * 2, c = ig.game.getEntitiesInCircle(c, this.distance || this.searchType.radius, 1, 32, entity.face, -d / 2, d / 2, entity), d = null, e = 0, f = c.length; f--;) {
                var g = c[f];
                if (!(this.ignoreCurrentTarget && g == b)) {
                    if (g instanceof sc.CombatantAnimPartEntity) g = g.owner;
                    if (g instanceof ig.ENTITY.Combatant && g.party != entity.party && (g.party != sc.COMBATANT_PARTY.ENEMY || g.target)) {
                        var h = ig.CollTools.getDistVec2(entity.coll,
                                g.coll, r),
                            i = Vec2.length(h);
                        if (this.searchType.facePriority) {
                            h = Vec2.angle(entity.face, h);
                            i = i + h * 1E3
                        }
                        if (entity.combo.hitCombatants.indexOf(g) != -1)
                            if (this.prevHitBehavior == D.PREFER_NON_HIT) i = i + 1E4;
                            else if (this.prevHitBehavior == D.ONLY_NON_HIT) continue;
                        if (!d || i < e) {
                            d = g;
                            e = i
                        }
                    }
                }
            }
            entity.tmpTarget = d
        }
    });
    ig.ACTION_STEP.SET_OWNER_REPLACE_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            var b = entity.getCombatantRoot();
            b != entity && b.setReplaceTarget && b.setReplaceTarget(entity)
        }
    });
    ig.ACTION_STEP.SET_TARGET_REPLACE_TARGET =
        ig.ActionStepBase.extend({
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function() {},
            start: function(entity) {
                var b = entity.getTarget();
                b != entity && b.setReplaceTarget && b.setReplaceTarget(entity)
            }
        });
    ig.ACTION_STEP.SET_POI_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                poiFilter: {
                    _type: "PoiFilter",
                    _info: "Kind of POI searched. If not defined, use last searched PoI from Combat Condition",
                    _optional: true
                },
                distance: {
                    _type: "Number",
                    _info: "Maximum distance to POI. Only used if poiFilter is defined."
                },
                furthest: {
                    _type: "Boolean",
                    _info: "If true: select POI that is furthest away"
                }
            }
        }),
        init: function(data) {
            this.poiFilter = sc.CombatPoI.initPoiFilter(data.poiFilter);
            this.distance = data.distance;
            this.furthest = data.furthest || false
        },
        start: function(entity) {
            var b;
            b = this.poiFilter ? sc.CombatPoI.getClosestPoI(this.poiFilter, entity, this.distance, false, this.furthest) : entity.lastPoICheck;
            entity.tmpTarget = b
        }
    });
    sc.PROXY_SELECT_TYPE = {
        PREV_ACTION_PROXY: function(a, b, c) {
            b = b.actionAttached;
            a = b.indexOf(a);
            if (a == -1) return null;
            for (; a--;)
                if (b[a] instanceof sc.CombatProxyEntity && (!c ||
                        c == b[a])) return b[a];
            return null
        },
        NEXT_ACTION_PROXY: function(a, b, c) {
            b = b.actionAttached;
            a = b.indexOf(a);
            if (a == -1) return null;
            for (; ++a < b.length;)
                if (b[a] instanceof sc.CombatProxyEntity && (!c || c == b[a])) return b[a];
            return null
        },
        PROXY_SOURCE: function(a) {
            return a.sourceEntity
        }
    };
    ig.ACTION_STEP.SET_PROXY_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                selectType: {
                    _type: "String",
                    _info: "What kind of proxy to select",
                    _select: sc.PROXY_SELECT_TYPE
                },
                group: {
                    _type: "String",
                    _info: "Optional group filter for proxy",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.selectType = sc.PROXY_SELECT_TYPE[data.selectType];
            this.group = data.group
        },
        start: function(entity) {
            var b = this.selectType(entity, entity.getSourceEntity(), this.group);
            entity.tmpTarget = b
        }
    });
    ig.ACTION_STEP.REDUCE_PROXY_HP = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                damage: {
                    _type: "Number",
                    _info: "Number of HP to reduce"
                }
            }
        }),
        init: function(data) {
            this.damage = data.damage || 1
        },
        start: function(entity) {
            entity.reduceHp && entity.reduceHp(this.damage)
        }
    });
    ig.ACTION_STEP.CLEAR_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.tmpTarget = null
        }
    });
    ig.ACTION_STEP.CLEAR_PREV_HIT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.combo.hitCombatants.length = 0
        }
    });
    ig.ACTION_STEP.CLEAR_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            entity.setTarget(null)
        }
    });
    ig.ACTION_STEP.DETOUR_COMPRESSOR_THREAT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(entity) {
            var b =
                entity.threat;
            if (b && b instanceof sc.CompressedBaseEntity) {
                var c = b.coll,
                    b = Vec2.length(b.coll.vel);
                if (Math.abs(c.vel.x) > Math.abs(c.vel.y)) {
                    c.vel.y = c.pos.y + c.size.y / 2 > entity.coll.pos.y + entity.coll.size.y / 2 ? 0.5 : -0.5;
                    entity.setAttribute("compressorDetourNorth", c.vel.y > 0);
                    c.vel.x = c.vel.x > 0 ? 1 : -1
                } else {
                    var d = ig.game.playerEntity.coll;
                    c.vel.x = c.pos.x + c.size.x / 2 > d.pos.x + d.size.x / 2 ? 1 : -1;
                    c.vel.y = c.vel.y > 0 ? 0.6 : -0.6;
                    entity.setAttribute("compressorDetourNorth", c.vel.y > 0)
                }
                Vec2.length(c.vel, b)
            }
        }
    });
    ig.ACTION_STEP.ADD_ACTION_BUFF = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "What entity will get the buff",
                    _select: d
                },
                stats: {
                    _type: "Array",
                    _info: "Stats to be applied.",
                    _sub: {
                        _type: "String",
                        _select: sc.STAT_CHANGE_SETTINGS
                    }
                },
                name: {
                    _type: "String",
                    _info: "Name that can be used to find/modify buff",
                    _optional: true
                },
                hacked: {
                    _type: "Boolean",
                    _info: "If true: buff is hacked and should be ignored for certain calculations",
                    _optional: true
                }
            }
        }),
        init: function(data) {
            this.target = d[data.target] || d.SELF;
            this.stats = data.stats;
            this.name = data.name || null;
            this.hacked = data.hacked || false
        },
        start: function(entity) {
            var b =
                this.target(entity);
            if (b && b.params) {
                var c = new sc.ActionBuff(this.stats, this.name, this.hacked);
                b.params.addBuff(c);
                entity.addActionAttached(c)
            }
        }
    });
    var C = {
        set: function(a, b) {
            return b
        },
        mul: function(a, b) {
            return a * b
        }
    };
    ig.ACTION_STEP.MOD_ACTION_BUFF_PARAM = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                target: {
                    _type: "String",
                    _info: "What entity will get the buff",
                    _select: d
                },
                name: {
                    _type: "String",
                    _info: "Name used to search for buff of target entity"
                },
                param: {
                    _type: "String",
                    _info: "What param to modify",
                    _select: ["hp",
                        "attack", "defense", "focus"
                    ]
                },
                changeType: {
                    _type: "String",
                    _info: "Type of modification",
                    _select: C
                },
                value: {
                    _type: "Number",
                    _info: "By what value param is modified"
                }
            }
        }),
        init: function(data) {
            this.target = d[data.target] || d.SELF;
            this.name = data.name || null;
            this.param = data.param;
            this.value = data.value || 0;
            this.changeType = C[data.changeType] || C.set
        },
        start: function(entity) {
            if ((entity = this.target(entity)) && entity.params)
                for (var b = entity.params.buffs, c = b.length; c--;) {
                    var d = b[c];
                    if (d instanceof sc.ActionBuff && d.name == this.name) {
                        var e = this.changeType(d.params[this.param],
                            this.value);
                        entity.params.modifyBuff(d, this.param, e)
                    }
                }
        }
    });
    var A = {
        RELATIVE_HP: {},
        CURRENT_HP: {},
        MAX_HP: {
            stat: "hp"
        },
        ATTACK: {
            stat: "attack"
        },
        DEFENSE: {
            stat: "defense"
        },
        FOCUS: {
            stat: "focus"
        }
    };
    ig.ACTION_STEP.SET_VAR_COMBAT_STAT = ig.ActionStepBase.extend({
        varName: null,
        stat: null,
        _wm: new ig.Config({
            attributes: {
                varName: {
                    _type: "VarName",
                    _info: "Variable to store relative hp in"
                },
                stat: {
                    _type: "String",
                    _info: "Type of Stat",
                    _select: A
                }
            }
        }),
        init: function(data) {
            this.varName = data.varName;
            this.stat = A[data.stat] || A.RELATIVE_HP
        },
        start: function(entity) {
            var b =
                ig.Event.getVarName(this.varName);
            if (b) {
                if (entity && entity.isCombatant) {
                    var c;
                    if (this.stat.stat) c = entity.params.getStat(this.stat.stat);
                    else if (this.stat == A.RELATIVE_HP) c = entity.params.getHpFactor();
                    else if (this.stat == A.CURRENT_HP) c = entity.params.currentHp;
                    ig.vars.set(b, c)
                }
            } else ig.log("SET_VAR_TIME: Variable Name is not a String!")
        }
    });
    var B = {
        RECENT_HIT_CENTER: function(a, b) {
            Vec3.assignC(b, 0, 0, 0);
            for (var c, d, e, f, g = 0, h = a.combo.hitCombatants, i = h.length; i--;) {
                var k = h[i].getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, j),
                    g = g + k.z / h.length;
                if (c === void 0) {
                    c = d = k.x;
                    e = f = k.y
                } else {
                    c = Math.min(c, k.x);
                    d = Math.max(d, k.x);
                    e = Math.min(e, k.y);
                    f = Math.max(f, k.y)
                }
            }
            b.z = g;
            b.x = (c + d) / 2;
            b.y = (e + f) / 2
        }
    };
    ig.ACTION_STEP.SET_ATTRIB_POS_COMBAT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                attrib: {
                    _type: "String",
                    _info: "Name of attribute to store position"
                },
                posType: {
                    _type: "String",
                    _info: "How to determine position",
                    _select: B
                }
            }
        }),
        init: function(data) {
            this.attrib = data.attrib;
            this.posType = B[data.posType]
        },
        start: function(entity) {
            var b = Vec3.create();
            this.posType(entity, b);
            entity.setAttribute(this.attrib,
                b)
        }
    })
});
ig.baked = !0;
