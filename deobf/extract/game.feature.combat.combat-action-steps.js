ig.module("game.feature.combat.combat-action-steps").requires("impact.base.animation", "impact.base.action", "impact.base.entity", "game.feature.combat.entities.drop", "game.feature.combat.entities.combatant", "game.feature.combat.entities.combat-proxy", "impact.feature.effect.effect-steps", "game.feature.combat.combat-sweep").defines(function() {
    function b(a) {
        return a instanceof sc.CombatParams
    }

    function a(a, b) {
        for (var c = a.length; c--;) {
            var d = a[c];
            if (d instanceof sc.CombatProxyEntity && d.group == b) return d
        }
        return null
    }
    var d = {
            SELF: function(a) {
                return a
            },
            PROXY_OWNER: function(a) {
                return a.getCombatantRoot()
            },
            PROXY_SRC: function(a) {
                return a.sourceEntity
            },
            TARGET: function(a) {
                return a.getTarget()
            }
        },
        c = Vec3.create();
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
        init: function(a) {
            this.value = a.value;
            this.immediately = a.immediately || false;
            this.posOffset = a.posOffset || null
        },
        run: function(a) {
            a.faceToTarget.active = this.value;
            a.forceFaceDirFixed = this.value;
            var b = a.getTarget();
            if (this.immediately && b) {
                b = Vec2.sub(b.getCenter(), a.getCenter());
                this.posOffset && Vec2.add(b, this.posOffset);
                Vec2.isZero(b) && Vec2.assignC(b, 0, 1);
                a.faceToTarget.offset && Vec2.rotate(b,
                    a.faceToTarget.offset * 2 * Math.PI);
                Vec2.assign(a.face, b)
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
        init: function(a) {
            this.enemy = a.enemy;
            this.asSpecial = a.asSpecial == void 0 ? true : a.asSpecial
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.faceToTarget.offset = this.value;
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.faceToTarget.speed = this.value;
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
        init: function(a) {
            this.projectileSpeed = a.projectileSpeed
        },
        run: function(a) {
            var b = a.getTarget();
            if (b) {
                var c = b.getCenter(i),
                    d = a.getCenter(l),
                    e = Vec2.distance(c,
                        d) / this.projectileSpeed;
                Vec2.addMulF(c, b.coll.vel, e);
                Vec2.sub(c, d, a.face)
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
        init: function(a) {
            this.target = d[a.target] || d.SELF
        },
        run: function(a) {
            var b = this.target(a);
            b && b.face && Vec2.assign(a.face, b.face);
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
        init: function(a) {
            this.charged = a.charged;
            this.charClass = sc.THROW_SOUND_CLASS[a.charClass] || null
        },
        start: function(a) {
            var b = sc.ELEMENT.NEUTRAL;
            if (a instanceof sc.PlayerBaseEntity) b = a.model.currentElementMode;
            else if (a.elementModes) b = a.elementModes.current;
            sc.combat.showThrowEffect(a, b, this.charged, this.charClass)
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
        init: function(a) {
            this.element = sc.ELEMENT[a.element];
            this.level = a.level
        },
        start: function(a) {
            a.stepData.fx = new sc.CombatCharge(a, false, true, true);
            a.stepData.level = 0;
            a.addActionAttached(a.stepData.fx);
            this.chargeStep(a)
        },
        chargeStep: function(a) {
            a.stepData.level++;
            a.stepTimer = a.stepData.level < this.level ? a.stepTimer + 0.4 : a.stepTimer + 0.3;
            a.stepData.fx.charge(this.element, a.stepData.level)
        },
        run: function(a) {
            if (a.stepTimer <=
                0) {
                if (a.stepData.level == this.level) {
                    a.stepData.fx.stop();
                    a.params.consumeSp(sc.PLAYER_SP_COST[this.level - 1]);
                    return true
                }
                this.chargeStep(a)
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
        init: function(a) {
            this.min = a.min;
            this.max = a.max;
            this.maxTime = a.maxTime;
            this.offset = a.offset ||
                null;
            this.forceTime = a.forceTime || false;
            this.rotateSpeed = a.rotateSpeed || 0;
            this.missReactTime = a.missReactTime;
            this.collideCancel = a.collideCancel;
            this.stopBeforeEdge = a.stopBeforeEdge;
            this.flipOffsetLeft = a.flipOffsetLeft;
            this.keepFace = a.keepFace;
            this.waitUntil = a.waitUntil ? new ig.VarCondition(a.waitUntil) : null
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime;
            if (this.rotateSpeed)
                if (this.keepFace) {
                    var b = a.stepData.moveDir = Vec2.create(),
                        c = a.getTarget();
                    if (c) {
                        ig.CollTools.getDistVec2(a.coll, c.coll,
                            b);
                        if (this.offset) {
                            b.x = b.x + (this.flipOffsetLeft && a.face.x < 0 ? -this.offset.x : this.offset.x);
                            b.y = b.y + this.offset.y
                        }
                    }
                } else Vec2.assign(a.coll.accelDir, a.face)
        },
        run: function(a) {
            var b = a.getTarget();
            if (!b) return true;
            var c = this.keepFace ? a.stepData.moveDir : a.face,
                d = Vec2.sub(b.getCenter(), a.getCenter());
            if (this.offset) {
                d.x = d.x + (this.flipOffsetLeft && a.face.x < 0 ? -this.offset.x : this.offset.x);
                d.y = d.y + this.offset.y
            }
            var e = Vec2.length(d);
            e < this.min && Vec2.mulC(d, -1);
            if (this.rotateSpeed) {
                Vec2.rotateToward(c, d, this.rotateSpeed *
                    Math.PI * 2 * ig.system.tick);
                Vec2.assign(a.coll.accelDir, c)
            } else Vec2.assign(a.coll.accelDir, d);
            if (this.stopBeforeEdge && ig.CollTools.isPostMoveOverHole(a.coll, true)) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                Vec2.assignC(a.coll.vel, 0, 0);
                if (this.collideCancel) a.stepTimer = 0
            }
            if (this.collideCancel && ig.CollTools.hasWallCollide(a.coll, this.collideCancel)) a.stepTimer = 0;
            if (this.missReactTime != void 0 && this.missReactTime != null && a.stepTimer > this.missReactTime) {
                ig.CollTools.getDistVec2(a.coll, b.coll, r);
                if (this.offset) {
                    r.x =
                        r.x + (this.flipOffsetLeft && a.face.x < 0 ? -this.offset.x : this.offset.x);
                    r.y = r.y + this.offset.y
                }
                if (Vec2.angle(r, c) > Math.PI / 2) a.stepTimer = this.missReactTime
            }
            if (this.min <= e && e <= this.max) {
                if (!this.forceTime && !this.waitUntil) return true;
                Vec2.assignC(a.coll.accelDir, 0, 0)
            }
            return this.waitUntil ? this.waitUntil.evaluate() : a.stepTimer <= 0
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
        init: function(a) {
            this.moveTime = a.moveTime;
            this.postTime = a.postTime || 0;
            this.offset = a.offset || null;
            this.rotateSpeed = a.rotateSpeed || 0;
            this.useAccelDir = a.useAccelDir || false;
            this.maxSpeed = a.maxSpeed || 200;
            this.maxSpeedEnd = a.maxSpeedEnd || 0;
            this.underEstimation = a.underEstimation || 0.75
        },
        start: function(a) {
            a.stepTimer = this.moveTime;
            if (this.rotateSpeed) {
                if (this.useAccelDir) a.stepData.lastDir = Vec2.create(a.coll.accelDir);
                if (!this.useAccelDir || Vec2.isZero(a.stepData.lastDir)) {
                    a.stepData.lastDir = this._calculateDir(Vec2.create(), a);
                    a.stepData.lastDir && Vec2.assign(a.coll.accelDir,
                        a.stepData.lastDir)
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
        run: function(a) {
            var b = this._calculateDir(r, a);
            if (!b) return true;
            var c = Vec2.length(b);
            if (c <= 4) Vec2.assignC(a.coll.accelDir, 0, 0);
            else if (this.rotateSpeed) {
                Vec2.assign(a.coll.accelDir, a.stepData.lastDir);
                Vec2.isZero(a.coll.accelDir) ? Vec2.assign(a.coll.accelDir, b) : Vec2.rotateToward(a.coll.accelDir, b, this.rotateSpeed * Math.PI * 2 *
                    ig.system.tick);
                Vec2.assign(a.stepData.lastDir, a.coll.accelDir)
            } else Vec2.assign(a.coll.accelDir, b);
            c = c / ((a.stepTimer + this.postTime) * this.underEstimation);
            if (this.rotateSpeed) {
                b = 1 - Vec2.angle(a.stepData.lastDir, b) / Math.PI * 2;
                c = Math.max(0, c * b)
            }
            b = this.maxSpeed;
            this.maxSpeedEnd && (b = a.stepTimer / this.moveTime * (this.maxSpeed - this.maxSpeedEnd) + this.maxSpeedEnd);
            c > b && (c = b);
            a.coll.maxVel = c;
            return a.stepTimer <= 0
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
        init: function(a) {
            this.moveTime = a.moveTime;
            this.alignDir = a.alignDir;
            this.aimFaceRotate =
                a.aimFaceRotate || 0.25;
            this.maxDist = a.maxDist || 0;
            this.maxOppDist = a.maxOppDist || 0;
            this.offset = a.offset || null;
            this.interpolate = a.interpolate || false;
            this.waitUntil = a.waitUntil ? new ig.VarCondition(a.waitUntil) : null
        },
        start: function(a) {
            a.stepTimer = this.moveTime;
            a.stepData.startPos = a.getCenter()
        },
        run: function(a) {
            var b = Vec2.assign(i, this.alignDir || a.face);
            Vec2.normalize(b);
            var c = a.getTarget();
            if (!c) return true;
            c = c.getCenter(l);
            this.offset && Vec2.add(c, this.offset);
            var d = Vec2.sub(c, a.stepData.startPos, o),
                e;
            if (Math.abs(this.aimFaceRotate) === 0.25) e = Vec2.dot(d, b);
            else {
                e = this.aimFaceRotate;
                Vec2.areClockwise(b, d) === e > 0 && (e = -e);
                d = Vec2.assign(o, b);
                Vec2.rotate(d, e * Math.PI * 2);
                e = Line2.intersectRayWeight(a.stepData.startPos, b, c, d)
            }
            e = e.limit(-this.maxOppDist, this.maxDist);
            c = Vec2.assign(o, a.stepData.startPos);
            Vec2.addMulF(c, b, e);
            Vec2.addMulF(c, a.coll.size, -0.5);
            if (this.interpolate) {
                b = (1 - a.stepTimer / this.moveTime).limit(0, 1);
                Vec2.lerp(a.stepData.startPos, c, b, c)
            }
            a.setPos(c.x, c.y, a.coll.pos.z);
            return this.waitUntil ?
                this.waitUntil.evaluate() : a.stepTimer <= 0
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
        init: function(a) {
            this.entityAttrib = a.entityAttrib;
            this.indexAttrib = a.indexAttrib;
            this.entities = a.entities;
            this.selectBy = e[a.selectBy]
        },
        start: function(a) {
            var b;
            b = this.entities;
            for (var c = -1, d = 0, f = b.length, g = this.selectBy == e.TARGET_DISTANCE ? a.getTarget() : a; f--;) {
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
            this.indexAttrib && a.setAttribute(this.indexAttrib, b);
            this.entityAttrib && a.setAttribute(this.entityAttrib, this.entities[b])
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
        init: function(a) {
            this.attrib =
                a.attrib;
            this.positionType = f[a.positionType] || f.NORTH;
            this.distance = a.distance || 0;
            this.orthogonalDist = a.orthogonalDist || 0;
            this.maxOrthDelta = a.maxOrthDelta || 0;
            this.adjustTarget = a.adjustTarget || false;
            this.maxTime = a.maxTime;
            this.forceTime = a.forceTime || false;
            this.precise = a.precise || false;
            this.saveToAttrib = a.saveToAttrib || null;
            this.selectBy = e[a.selectBy] || e.SELF_DISTANCE
        },
        start: function(a) {
            delete a.stepData.pos;
            var b = ig.Event.getEntity(a.getAttribute(this.attrib));
            if (b) {
                var c = b.getCenter(),
                    d = Vec2.assign(l,
                        this.positionType.delta);
                if (this.positionType.close || this.positionType.far) {
                    var f = a.coll;
                    if (this.selectBy == e.TARGET_DISTANCE && a.getTarget()) f = a.getTarget().coll;
                    b = ig.CollTools.getDistVec2(b.coll, f, o);
                    b = Vec2.dot(b, d);
                    (this.positionType.close && b < 0 || this.positionType.far && b > 0) && Vec2.flip(d)
                }
                Vec2.length(d, this.distance);
                Vec2.addMulF(d, this.positionType.orth, this.orthogonalDist);
                Vec2.add(c, d);
                a.stepData.pos = c;
                a.stepTimer = a.stepTimer + this.maxTime
            }
        },
        run: function(a) {
            var b = a.stepData.pos;
            if (!b) return true;
            var c = a.getTarget();
            if (this.adjustTarget && c) {
                c = c.getCenter(l);
                this.positionType.orth.x ? b.x = c.x + this.orthogonalDist : b.y = c.y + this.orthogonalDist;
                if (this.maxOrthDelta) {
                    c = ig.Event.getEntity(a.getAttribute(this.attrib)).getCenter(l);
                    this.positionType.orth.x ? b.x = b.x.limit(c.x - this.maxOrthDelta, c.x + this.maxOrthDelta) : b.y = b.y.limit(c.y - this.maxOrthDelta, c.y + this.maxOrthDelta)
                }
            }
            if (this.saveToAttrib) {
                c = Vec3.create();
                Vec2.assign(c, b);
                c.z = a.coll.pos.z;
                a.setAttribute(this.saveToAttrib, c);
                return true
            }
            b = Vec2.sub(b,
                a.getCenter(), i);
            c = Vec2.length(b);
            if (this.precise && a.coll.maxVel * a.coll.relativeVel > c * 10) a.coll.relativeVel = c / a.coll.maxVel * 10;
            Vec2.assign(a.coll.accelDir, b);
            if (c <= (this.precise ? 2 : 8)) {
                if (!this.maxTime || !this.forceTime) return true;
                Vec2.assignC(a.coll.accelDir, 0, 0)
            }
            return this.maxTime && a.stepTimer <= 0
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
        init: function(a) {
            this.party = sc.COMBATANT_PARTY[a.party]
        },
        run: function(a) {
            sc.combat.changeCombatantParty(a, this.party);
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
        init: function(a) {
            this.jumpSpeed =
                a.jumpSpeed;
            this.adjustAbove = a.adjustAbove || 0;
            this.offset = a.offset || null
        },
        start: function(a) {
            a.doJump(this.jumpSpeed)
        },
        run: function(a) {
            var b = a.getTarget();
            if (!b) return true;
            var c = a.coll.pos.z - a.coll.baseZPos;
            if (a.coll.vel.z <= 0 && c <= this.adjustAbove) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                if (c == 0) return true
            } else {
                b = Vec2.sub(b.getCenter(), a.getCenter());
                this.offset && Vec2.add(b, this.offset);
                Vec2.length(b) > 8 && Vec2.assign(a.coll.accelDir, b)
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
        init: function(a) {
            this.distance = a.distance || 0;
            this.speed = a.speed || 0;
            this.minZVel = a.minZVel || 0;
            this.maxZVel = a.maxZVel || 0
        },
        run: function(a) {
            var b = a.getTarget();
            if (b) {
                var c = this.speed,
                    d = b.distanceTo(a),
                    d = d - this.distance,
                    b = ig.CollTools.getJumpSpeedForDuration(a.coll, b.coll.pos.z, d / c),
                    b = Math.max(this.minZVel, b);
                this.maxZVel && (b = Math.min(this.maxZVel, b));
                a.coll.vel.z = b
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
        init: function(a) {
            this.stopType = g[a.stopType] || g.LANDED;
            this.stopBeforeTime = a.stopBeforeTime || 0;
            this.distance = a.distance || 0;
            this.offset = a.offset || null;
            this.faceAlignOffset = a.faceAlignOffset || null;
            this.rotateSpeed = a.rotateSpeed || 0;
            this.adjustSpeedMax = a.adjustSpeedMax || 0;
            this.turnMinSpeed = a.turnMinSpeed || 0;
            this.maxSpeedChange = a.maxSpeedChange || 0;
            this.missileMode = a.missileMode || 0;
            this.underEstimation = a.underEstimation || 0.75;
            this.cancelIfBelowFall = a.cancelIfBelowFall || false
        },
        start: function(a) {
            a.stepData.justStarted =
                true;
            a.stepData.speedStarted = true;
            if (this.rotateSpeed) a.stepData.lastDir = Vec2.create(a.face)
        },
        run: function(a) {
            var b = a.getTarget();
            if (b) {
                var d = ig.CollTools.getDistVec3(a.coll, b.coll, c);
                this.offset && Vec2.add(d, this.offset);
                if (this.faceAlignOffset) {
                    var e;
                    if (a.getFaceOffset && (e = a.getFaceOffset())) {
                        d.y = d.y - a.coll.size.y / 2;
                        d.x = d.x - (e && e.x || 0);
                        d.y = d.y - (e && e.y || 0);
                        d.z = d.z - (e && e.z || 0)
                    }
                }
                e = Vec2.length(d);
                if (e <= Math.max(this.distance, 4)) Vec2.assignC(a.coll.accelDir, 0, 0);
                else if (this.rotateSpeed) {
                    Vec2.assign(a.coll.accelDir,
                        a.stepData.lastDir);
                    Vec2.isZero(a.coll.accelDir) ? Vec2.assign(a.coll.accelDir, d) : Vec2.rotateToward(a.coll.accelDir, d, this.rotateSpeed * Math.PI * 2 * ig.system.tick);
                    !a.faceToTarget.active && !a.faceDirFixed && Vec2.assign(a.face, a.coll.accelDir);
                    Vec2.assign(a.stepData.lastDir, a.coll.accelDir)
                } else Vec2.assign(a.coll.accelDir, d);
                if (this.adjustSpeedMax)
                    if (this.missileMode) {
                        e = a.coll;
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
                        g = this.stopType.duration(a);
                        g - this.stopBeforeTime > 0.1 && (g = g * this.underEstimation);
                        if (g > 0) {
                            g = (e - this.distance) / g;
                            if (this.rotateSpeed) {
                                d = 1 - Vec2.angle(a.stepData.lastDir, d) / Math.PI * 2;
                                g = Math.max(Math.min(g, this.turnMinSpeed), g * d)
                            }
                            if (this.maxSpeedChange && !a.stepData.speedStarted) {
                                d = g - a.coll.maxVel;
                                e = this.maxSpeedChange * ig.system.tick;
                                Math.abs(d) > e && (d = d > 0 ? e : -e);
                                g = a.coll.maxVel + d
                            }
                            a.stepData.speedStarted =
                                false;
                            a.coll.maxVel = Math.min(g, this.adjustSpeedMax)
                        }
                    } if (this.stopBeforeTime) {
                    g = this.stopType.duration(a);
                    if (g > 0 && g < this.stopBeforeTime) return true
                }
                if (this.cancelIfBelowFall) {
                    e = a.coll;
                    if (b.coll.pos.z > e.pos.z && e.vel.z < 0) return true
                }
            }
            return this.stopType.hasEnded(a)
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
        init: function(a) {
            this.speed = a.speed || 400;
            this.minTime = a.minTime || 0
        },
        start: function(a) {
            var b = a.getTarget();
            if (b) {
                var d = a.coll;
                d.zGravityFactor = 0;
                var a = ig.CollTools.getDistVec3(a.coll, b.coll, c),
                    b = Vec3.length(a),
                    e = this.speed,
                    f = b / e;
                f < this.minTime && (e = e * (f / this.minTime));
                f = e * Vec2.length(a) / b;
                a = e * a.z / b;
                d.relativeVel = 1;
                d.maxVel = f;
                Vec2.length(d.vel, f);
                d.vel.z = a;
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
            init: function(a) {
                this.distance = a.distance;
                this.minTime = a.minTime;
                this.maxTime = a.maxTime
            },
            start: function(a) {
                a.stepData.maxTime = this.minTime + Math.random() * (this.maxTime - this.minTime);
                a.stepTimer = a.stepTimer + a.stepData.maxTime;
                a.stepData.doEscape = true
            },
            run: function(a) {
                var b = a.getTarget();
                if (!b) return true;
                b = Vec2.sub(a.getCenter(), b.getCenter());
                if (Vec2.length(b) > this.distance) return true;
                Vec2.normalize(b);
                if (!a.stepData.dir || a.coll.partlyBlockTimer > 0.2) {
                    var c = a.coll.partlyBlockTimer = 0;
                    if (a.stepData.doEscape) c = b;
                    else {
                        do c = Vec2.normalize(Vec2.createC(Math.random() - 0.5, Math.random() - 0.5)); while (a.stepData.dir && Vec2.dot(a.stepData.dir, c) > 0.8)
                    }
                    a.stepData.dir = c;
                    a.stepData.doEscape = !a.stepData.doEscape
                }
                Vec2.assign(a.coll.accelDir,
                    a.stepData.dir);
                return a.stepTimer <= 0
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
        init: function(a) {
            this.minTime = a.minTime;
            this.maxTime = a.maxTime;
            this.towardsRotate = a.towardsRotate;
            this.towardMinDist = a.towardMinDist;
            this.keepFaceDirection = a.keepFaceDirection;
            this.stopBeforeEdge = a.stopBeforeEdge
        },
        start: function(a) {
            a.stepTimer =
                this.minTime + Math.random() * (this.maxTime - this.minTime);
            a.stepData.ccw = Math.random() > 0.5
        },
        run: function(a) {
            var b = a.getTarget();
            if (!b) return true;
            var b = ig.CollTools.getDistVec2(b.coll, a.coll, i),
                c = 1;
            if (a.stepData.ccw) {
                Vec2.rotate90CCW(b);
                c = c * -1
            } else Vec2.rotate90CW(b);
            if (this.keepFaceDirection && Vec2.dot(b, a.face) < 0) {
                Vec2.flip(b);
                c = c * -1
            }
            this.towardMinDist && Vec2.length(b) < this.towardMinDist && (c = c * -1);
            this.towardsRotate && Vec2.rotate(b, Math.PI * 0.5 * c * this.towardsRotate);
            Vec2.assign(a.coll.accelDir, b);
            if (this.stopBeforeEdge &&
                ig.CollTools.isPostMoveOverHole(a.coll, true)) {
                Vec2.assignC(a.coll.accelDir, 0, 0);
                Vec2.assignC(a.coll.vel, 0, 0)
            }
            return a.stepTimer <= 0
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
        init: function(a) {
            this.time = a.time;
            this.ccw = a.ccw;
            this.targetDistance = a.targetDistance;
            this.yScale = a.yScale || 1;
            this.relativeVel = a.relativeVel || 1;
            this.dodgeVel = a.dodgeVel || 1;
            this.avoidEnemyRadius = a.avoidEnemyRadius || 0
        },
        start: function(a) {
            a.stepTimer = this.time;
            a.coll.relativeVel = this.relativeVel
        },
        run: function(a) {
            var b =
                a.getTarget();
            if (!b) return true;
            b = ig.CollTools.getDistVec2(b.coll, a.coll, i);
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
                a.coll.relativeVel = this.relativeVel * (1 - c) + this.dodgeVel * c
            } else a.coll.relativeVel = this.relativeVel;
            if (this.avoidEnemyRadius)
                for (var d = Vec2.length(b), c = a.getCenter(l),
                        e = ig.game.getEntitiesInCircle(c, this.avoidEnemyRadius, 1, a.coll.size.z), f = e.length, g = []; f--;) {
                    c = e[f];
                    if (c.coll.parentColl) c = c.coll.parentColl.entity;
                    if (c && c instanceof ig.ENTITY.Enemy && c != a && g.indexOf(c) == -1) {
                        g.push(c);
                        var h = ig.CollTools.getDistVec2(c.coll, a.coll, l),
                            c = Vec2.length(h);
                        if (c < this.avoidEnemyRadius) {
                            Vec2.length(h, d * 2 * (this.avoidEnemyRadius - c) / this.avoidEnemyRadius);
                            Vec2.add(b, h)
                        }
                    }
                }
            Vec2.assign(a.coll.accelDir, b);
            return a.stepTimer <= 0
        }
    });
    var h = {
        TARGET: function(a) {
            return a.getTarget()
        },
        PROXY_OWNER: function(a) {
            return a.getCombatantRoot()
        },
        PROXY_SRC: function(a) {
            return a.sourceEntity
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
        init: function(a) {
            this.target = h[a.target];
            this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.duration = a.duration || 0;
            this.offset = a.offset;
            this.waitUntil = new ig.VarCondition(a.waitUntil)
        },
        start: function(a) {
            var b = this.target && this.target(a);
            if (b) {
                a.stepTimer = this.duration;
                a.stepData.target = b
            }
        },
        run: function(a) {
            var b = a.stepData.target;
            if (!b) return true;
            b = b.getAlignedPos(this.align,
                c);
            this.offset && Vec3.add(b, this.offset);
            Vec2.addMulF(b, a.coll.size, -0.5);
            a.setPos(b.x, b.y, b.z);
            return !this.waitUntil.evaluate() ? false : a.stepTimer <= 0
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
        init: function(a) {
            this.target = h[a.target];
            this.distance = a.distance === void 0 ? null : a.distance;
            this.duration = a.duration || 0;
            this.rotateTime = a.rotateTime || 0;
            this.rotateTimeEnd = a.rotateTimeEnd || 0;
            this.distAdjustSpeed = a.distAdjustSpeed ||
                0;
            this.ccw = a.ccw || false;
            this.zDistance = a.zDistance === void 0 ? null : a.zDistance;
            this.waitUntil = new ig.VarCondition(a.waitUntil);
            this.waitTargetAlign = a.waitTargetAlign || false
        },
        start: function(a) {
            var b = this.target && this.target(a);
            if (b) {
                a.stepTimer = this.duration;
                a.stepData.target = b;
                a.stepData.lastPos = Vec3.create(b.coll.pos)
            }
        },
        run: function(a) {
            var b = a.stepData.target;
            if (!b) return true;
            var d = a.coll.maxVel * a.coll.relativeVel,
                e = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c),
                f = Vec3.assign(j, b.coll.pos);
            Vec3.sub(f,
                a.stepData.lastPos);
            this.zDistance !== null ? Vec3.add(e, f) : Vec2.add(e, f);
            Vec3.assign(a.stepData.lastPos, b.coll.pos);
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
                    k = 1 / (k + (1 / this.rotateTimeEnd - k) * (1 - Math.max(0, a.stepTimer / this.duration)))
                }
            }
            h = h * 2 * Math.PI;
            d = (k ? 1 / k : d / h) * ig.system.tick * Math.PI * 2;
            a.stepTimer < 0 && (this.waitUntil.evaluate() && !this.waitTargetAlign) && (d = d * (1 + a.stepTimer / ig.system.tick));
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
            e.x = e.x - a.coll.size.x / 2;
            e.y = e.y - a.coll.size.y /
                2;
            this.ccw ? Vec2.rotate90CW(b) : Vec2.rotate90CCW(b);
            a.setPos(e.x, e.y, e.z);
            !a.faceDirFixed && !a.faceToTarget.active && Vec2.assign(a.face, b);
            if (!this.waitUntil.evaluate()) return false;
            if (a.stepTimer <= 0 && this.waitTargetAlign) {
                e = ig.CollTools.getDistVec2(a.coll, a.getTarget().coll, l);
                if (Vec2.angle(e, b) > Math.PI / 2 * 0.125) return false
            }
            return a.stepTimer <= 0
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
        init: function(a) {
            this.target = h[a.target];
            this.proxyGroup = a.proxyGroup;
            this.count = a.count || 1;
            this.attribBlock = a.attribBlock
        },
        start: function(a) {
            var b = this.target && this.target(a);
            if (b) {
                for (var c = b.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, j), d = a.getCombatantRoot().entityAttached,
                        e = d.length, f = []; e--;) {
                    var g = d[e];
                    g != a && g instanceof sc.CombatProxyEntity && (!this.attribBlock || !g.getAttribute(this.attribBlock)) && g.group == this.proxyGroup && f.push(this._getDeltaVector(b, g))
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
                a.setPos(c.x - a.coll.size.x / 2, c.y - a.coll.size.y / 2, void 0)
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
            branchLabel: function(a) {
                switch (a) {
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
        init: function(a) {
            this.time = a.time;
            this.attack = a.attack;
            this.missReactTime = a.missReactTime;
            this.cancelOnHit = a.cancelOnHit || false;
            this.withBranches = a.withBranches || false;
            this.collideCancel =
                a.collideCancel || 0;
            this.collideSlip = a.collideSlip || false;
            this.rotateSpeed = a.rotateSpeed || 0;
            this.orthoDirFactor = a.orthoDirFactor || 0;
            this.ignoreLastHit = a.ignoreLastHit || false
        },
        start: function(a) {
            a.stepTimer = this.time;
            a.stepData.dir = Vec2.create(a.face);
            a.stepData.weight = a.coll.weight;
            a.coll.weight = -1;
            Vec2.assign(a.coll.accelDir, a.stepData.dir);
            var b = a.coll;
            b.totalBlockTimer = b.partlyBlockTimer = 0;
            a.setTackle(new sc.AttackInfo(a.params, this.attack), this.orthoDirFactor, this.cancelOnHit, this.ignoreLastHit)
        },
        run: function(a) {
            var b = a.getTarget();
            if (this.rotateSpeed && b) {
                var c = ig.CollTools.getDistVec2(a.coll, b.coll, i);
                Vec2.rotateToward(a.stepData.dir, c, this.rotateSpeed * Math.PI * 2 * ig.system.tick);
                Vec2.assign(a.face, a.stepData.dir)
            }
            Vec2.assign(a.coll.accelDir, a.stepData.dir);
            if (!a.getCombatantRoot().isPlayer && !b) a.stepTimer = 0;
            if (b && this.missReactTime != void 0 && this.missReactTime != null && a.stepTimer > this.missReactTime) {
                ig.CollTools.getDistVec2(a.coll, b.coll, r);
                if (Vec2.angle(r, a.face) > Math.PI / 2) a.stepTimer = this.missReactTime
            }
            if (this.collideCancel &&
                ig.CollTools.hasWallCollide(a.coll, this.collideCancel)) a.stepTimer = 0;
            else if (this.collideSlip && ig.CollTools.hasWallCollide(a.coll, 1)) {
                b = Vec2.assign(i, a.coll._collData.blockDir);
                Vec2.rotate90CW(b);
                Vec2.dot(b, a.face) < 0 && Vec2.flip(b);
                Vec2.assign(a.face, b);
                Vec2.assign(a.stepData.dir, b)
            }
            if (this.cancelOnHit && a.tackle.hitCount > 0) a.stepTimer = 0;
            return a.stepTimer <= 0
        },
        getBranchNames: function() {
            return this.withBranches ? ["hit", "missed"] : null
        },
        getNext: function(a) {
            var b = a.tackle.hitCount > 0;
            a.setTackle(null);
            a.coll.weight =
                a.stepData.weight;
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
        init: function(a) {
            this.circleSettings = a
        },
        run: function(a) {
            var b = new sc.CircleHitForce(a, this.circleSettings);
            sc.combat.addCombatForce(b);
            b.duration > 0 && a.addActionAttached(b);
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
        init: function(a) {
            this.sweepType =
                sc.COMBAT_SWEEPS[a.sweepType];
            this.reversed = a.reversed;
            this.faceCount = a.faceCount;
            this.flipLeftFace = a.flipLeftFace || false
        },
        run: function(a) {
            var b = sc.combat.getElementMode(a);
            sc.CombatSweep.show(this.sweepType, a, b, this.faceCount, this.reversed, this.flipLeftFace);
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            if (a =
                a.getTarget()) a.coll.vel.z = this.value;
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
        init: function(a) {
            this.pushPullSettings = a;
            this.pushPullSettings.effect && (this.pushPullSettings.effect = new ig.EffectHandle(this.pushPullSettings.effect))
        },
        clearCached: function() {
            this.pushPullSettings.effect && this.pushPullSettings.effect.clearCached()
        },
        run: function(a) {
            var b =
                new sc.PushPullForce(a, this.pushPullSettings);
            sc.combat.addCombatForce(b);
            a.addActionAttached(b);
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
        init: function(a) {
            this.value = a.value
        },
        run: function(a) {
            a.invincibleTimer = this.value;
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
        init: function(a) {
            if (a.killEffect) this.killEffect = new ig.EffectHandle(a.killEffect);
            this.clearKillEffect = a.clearKillEffect || false;
            if (a.hp !== void 0) this.hp = a.hp;
            if (a.threat !== void 0) this.threat = a.threat
        },
        clearCached: function() {
            this.killEffect && this.killEffect.clearCached()
        },
        start: function(a) {
            if (a instanceof sc.CombatProxyEntity) {
                if (this.killEffect) a.effects.onKill = this.killEffect;
                if (this.clearKillEffect) a.effects.onKill = null;
                this.hp !== null && a.setMaxHp(this.hp);
                if (this.threat !== null) a.isThreat =
                    this.threat
            }
        }
    });
    ig.ACTION_STEP.CONNECT_PROXY_TO_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            var b = a.getTarget();
            a.connectExternal && a.connectExternal(b)
        }
    });
    ig.ACTION_STEP.DISCONNECT_PROXY_FROM_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.connectExternal && a.connectExternal(null)
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
        init: function(a) {
            this.value = sc.ELEMENT[a.value] || sc.ELEMENT.NEUTRAL
        },
        run: function(a) {
            a.elementFilter = this.value;
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
        init: function(a) {
            this.time = a.time
        },
        start: function(a) {
            a.stepTimer = this.time;
            a.stepData.dir = sc.combat.isBlockingFreeLine(a)
        },
        run: function(a) {
            if (!a.stepData.dir) return true;
            Vec2.assign(a.coll.accelDir, a.stepData.dir);
            return a.stepTimer <= 0
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
        init: function(a) {
            this.reaction = a.reaction
        },
        run: function(a) {
            a.enableReaction(this.reaction);
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
        init: function(a) {
            this.value =
                a.value
        },
        run: function(a) {
            a.spikeDmg.tmpFactor = this.value;
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
        init: function(a) {
            this.reaction = a.reaction
        },
        run: function(a) {
            a.disableReaction(this.reaction);
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
        init: function(a) {
            this.value =
                a.value
        },
        run: function(a) {
            if (a.params) a.params.damageFactor = this.value;
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
        init: function(a) {
            this.value = sc.ATTACK_TYPE[a.value]
        },
        run: function(a) {
            a.hitStable = this.value;
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
        init: function(a) {
            this.value = a.value || 0
        },
        run: function(a) {
            a.combo.damageCeiling = {
                max: this.value,
                sum: {}
            };
            for (var b = a.actionAttached, c = b.length; c--;)
                if (b[c] instanceof sc.BasicCombatant) b[c].combo.damageCeiling = a.combo.damageCeiling;
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
        init: function(a) {
            this.value = a.value || 0
        },
        run: function(a) {
            a.combo.damageCeiling = null;
            for (var a = a.actionAttached, b = a.length; b--;)
                if (a[b] instanceof sc.BasicCombatant) a[b].combo.damageCeiling = null;
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
        init: function(a) {
            this.enemyState = a.enemyState;
            this.switchConfig = a.switchConfig
        },
        run: function(a) {
            a.changeState(this.enemyState, false, this.switchConfig);
            return true
        }
    });
    var i = Vec2.create(),
        j = Vec3.create(),
        k = {
            SELF: function(a, b, c) {
                a = b.getAlignedPos(c, a);
                if (b.isPlayer && this.align == ig.ENTITY_ALIGN.BOTTOM) {
                    c = b.maxJumpHeight === void 0 ? -1 : b.maxJumpHeight;
                    if (c >= 0) a.z = Math.min(b.coll.pos.z, c)
                }
                return a
            },
            TARGET: function(a, b, c) {
                return (b.getTarget() || b).getAlignedPos(c, a)
            },
            COLLAB_CENTER: function(a,
                b, c) {
                return !b.collaboration ? b.getAlignedPos(c, a) : b.collaboration.getCenterPos(a, c)
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
        init: function(a) {
            this.proxySrc = sc.ProxyTools.prepareSrc(a.proxy);
            this.offset = a.offset || this.offset;
            this.align = ig.ENTITY_ALIGN[a.align] || this.align;
            this.dir = a.dir;
            this.aimAtTarget = a.aimAtTarget;
            this.posType = k[a.posType] || k.SELF
        },
        clearCached: function() {
            sc.ProxyTools.releaseSrc(this.proxySrc)
        },
        run: function(a) {
            var b = sc.ProxyTools.getProxy(this.proxySrc, a);
            if (b) {
                var c = this.dir && ig.Action.getVec2(this.dir, a, i) || a.face,
                    d = this.posType(j, a, this.align);
                Vec3.add(d, this.offset);
                if (this.aimAtTarget) {
                    var e = a.getTarget();
                    if (e) {
                        c = e.getCenter(i);
                        Vec2.sub(c, d)
                    }
                }
                b.spawn(d.x, d.y, d.z, a, c)
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
        init: function(a) {
            this.proxySrc = sc.ProxyTools.prepareSrc(a.proxy);
            this.offset = a.offset || this.offset;
            this.align = ig.ENTITY_ALIGN[a.align] || this.align;
            this.posType = sc.COMBAT_HIT_PROXY_POS[a.posType] ||
                null
        },
        clearCached: function() {
            sc.ProxyTools.releaseSrc(this.proxySrc)
        },
        start: function(a) {
            var b = sc.ProxyTools.getProxy(this.proxySrc, a);
            b && a.setHitProxy(b, this.posType, this.align, this.offset)
        }
    });
    ig.ACTION_STEP.SET_PROXY_OWNER_TO_POS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        clearCached: function() {},
        run: function(a) {
            a.getCombatantRoot().setPos(a.coll.pos.x, a.coll.pos.y, a.coll.pos.z);
            return true
        }
    });
    ig.ACTION_STEP.CLEAR_HIT_PROXY = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.combo.hitProxy = null
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
        init: function(a) {
            a.proxy = sc.ProxyTools.prepareSrc(a.proxy);
            this.forceSettings = a;
            this.posEntity = d[a.posEntity] || null
        },
        clearCached: function() {
            sc.ProxyTools.releaseSrc(this.forceSettings.proxy)
        },
        run: function(a) {
            var b = null;
            this.posEntity &&
                (b = this.posEntity(a));
            b = new sc.ProxySpawnerForce(a, this.forceSettings, b);
            sc.combat.addCombatForce(b);
            a.addActionAttached(b);
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
        init: function(a) {
            for (var b = a.proxies, c = [], e = 0; e < b.length; ++e) c[e] = sc.ProxyTools.prepareSrc(b[e]);
            a.proxies = c;
            this.forceSettings = a;
            this.posEntity = d[a.posEntity] || null
        },
        clearCached: function() {
            for (var a = this.forceSettings.proxies, b = a.length; b--;) sc.ProxyTools.releaseSrc(a[b])
        },
        run: function(a) {
            var b = null;
            this.posEntity && (b = this.posEntity(a));
            b = new sc.ProxyGridForce(a, this.forceSettings, b);
            sc.combat.addCombatForce(b);
            a.addActionAttached(b);
            return true
        }
    });
    ig.ACTION_STEP.STOP_REPEATING_FORCE = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            for (var a = a.actionAttached, b = a.length; b--;) {
                var c = a[b];
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
        start: function(a) {
            for (var a = a.actionAttached, b = a.length; b--;) {
                var c = a[b];
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
        init: function(a) {
            this.sticking = a.sticking || false;
            this.group = a.group || null;
            this.target = d[a.target] || d.SELF;
            this.keepCount = a.keepCount || 0;
            this.ignoreSelf = a.ignoreSelf || false
        },
        start: function(a) {
            var b = this.target(a).getCombatantRoot();
            sc.CombatProxyTools.clearEntityProxy(b, this.group, this.sticking, this.keepCount, this.ignoreSelf ? a : null)
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
        init: function(a) {
            this.bounces = a.bounces || 0;
            this.size = a.size || 0;
            this.time = a.time || null
        },
        start: function(a) {
            var b = a.getTarget(),
                c = ig.CollTools.getDistVec2(a.coll, b.coll, r),
                b = Vec2.createC(0, 0);
            Math.abs(c.y) > Math.abs(c.x) * 2 ? b.x = 1 : b.y = 1;
            Math.random() < 0.5 && Vec2.flip(b);
            var c = a.getAlignedPos(ig.ENTITY_ALIGN.CENTER, j),
                d = ig.game.physics.initTraceResult(m);
            ig.game.trace(d, c.x - this.size /
                2, c.y - this.size / 2, c.z, b.x * 256, b.y * 256, this.size, this.size, this.size, ig.COLLTYPE.PROJECTILE, a, void 0, false);
            a.stepData.sidePos = [];
            a.stepData.sidePos[0] = (b.x ? c.x : c.y) + (b.y || b.x) * Math.round(d.dist * 256);
            d = ig.game.physics.initTraceResult(m);
            ig.game.trace(d, c.x - this.size / 2, c.y - this.size / 2, c.z, -b.x * 256, -b.y * 256, this.size, this.size, this.size, ig.COLLTYPE.PROJECTILE, a, void 0, false);
            a.stepData.sidePos[1] = (b.x ? c.x : c.y) - (b.y || b.x) * Math.round(d.dist * 256);
            a.stepData.throwDir = b;
            a.stepTimer = a.stepTimer + this.time
        },
        run: function(a) {
            var b = a.stepData.throwDir,
                c = a.stepData.sidePos,
                d = a.getTarget(),
                e = d.getCenter(r);
            Vec2.addMulF(e, d.coll.vel, 0.05);
            var d = a.getAlignedPos(ig.ENTITY_ALIGN.CENTER, j),
                f = (this.bounces - 1) * Math.abs(c[0] - c[1]),
                g = this.bounces % 2 ? c[0] : c[1];
            if (b.y) {
                f = f + (Math.abs(c[0] - d.y) + Math.abs(g - e.y));
                a.face.y = c[0] - d.y;
                a.face.x = (e.x - d.x) * Math.abs(a.face.y / f)
            } else {
                f = f + (Math.abs(c[0] - d.x) + Math.abs(g - e.x));
                a.face.x = c[0] - d.x;
                a.face.y = (e.y - d.y) * Math.abs(a.face.x / f)
            }
            return a.stepTimer <= 0
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
            init: function(a) {
                this.actions = a.actions || [];
                this.attrib = a.attrib || null;
                this.target =
                    d[a.target] || d.SELF;
                this.maxTime = a.maxTime || 0
            },
            start: function(a) {
                this.attrib && a.setAttribute(this.attrib, null);
                a.stepTimer = a.stepTimer + this.maxTime
            },
            run: function(a) {
                var b = this.target(a);
                if ((b = (b = b && b.getCombatantRoot()) && b.playerTrack && b.playerTrack.startedAction) && this.actions.indexOf(b) != -1) {
                    this.attrib && a.setAttribute(this.attrib, b);
                    return true
                }
                return this.maxTime && a.stepTimer <= 0
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
        init: function(a) {
            this.group = a.group || null
        },
        start: function(a) {
            for (var b = a.getCombatantRoot().entityAttached, c = b.length; c--;) {
                var d = b[c];
                if (d instanceof sc.CombatProxyEntity && !(this.group && d.group != this.group)) d.tmpTarget = a.tmpTarget
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
        init: function(a) {
            this.group =
                a.group
        },
        run: function(a) {
            for (var a = a.actionAttached, b = a.length; b--;)
                if (a[b] instanceof sc.CombatProxyEntity && !(this.group && a[b].group != this.group)) return false;
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
        init: function(a) {
            this.conditions = new sc.CombatConditions(a.conditions);
            this.maxTime = a.maxTime || 0
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime
        },
        run: function(a) {
            return this.conditions.check(a, Math.random()) ? true : this.maxTime && a.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.WAIT_UNTIL_TRAP_OVER = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {},
        run: function(a) {
            a = a.getTarget();
            return !a || !a.combo || !a.combo.guardTrapTime ? true : false
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
        init: function(a) {
            this.maxTime = a.maxTime
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime
        },
        run: function(a) {
            var b = a.getTarget();
            return !b || !b.isDefeated || b.isDefeated() ? true : this.maxTime && a.stepTimer <= 0
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
        init: function(a) {
            this.offset = a.offset || this.offset;
            this.dir = a.dir || null;
            this.dirRotate = (a.dirRotate || 0) * Math.PI * 2;
            this.inFaceDir = a.inFaceDir || false;
            this.burstSettings = a;
            this.burstSettings.effect = new ig.EffectHandle(a.effect)
        },
        clearCached: function() {
            this.burstSettings.effect.clearCached()
        },
        run: function(a) {
            var b = Vec3.create();
            a.getCenter(b);
            b.z = a.coll.pos.z;
            Vec3.add(b, this.offset);
            var c, d = a.getTarget();
            if (this.dir) c = Vec2.create(this.dir);
            else if (this.inFaceDir ||
                !d) c = Vec2.create(a.face);
            else {
                c = Vec2.create();
                d.getCenter(c);
                Vec2.sub(c, b)
            }
            this.dirRotate && Vec2.rotate(c, this.dirRotate);
            this.burstSettings.combatant = a;
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
        init: function(a) {
            this.selectType = n[a.selectType] ||
                n.STUN_LOCKED;
            this.directHitSettings = a;
            if (a.effect) this.effect = new ig.EffectHandle(a.effect)
        },
        clearCached: function() {
            this.effect && this.effect.clearCached()
        },
        start: function(a) {
            if (this.selectType == n.TARGET) {
                var b = a.getTarget();
                if (b) {
                    var c = new sc.DirectHitForce(a, b, this.directHitSettings, this.effect);
                    sc.combat.addCombatForce(c);
                    this.directHitSettings.hitCount > 1 && a.addActionAttached(c)
                }
            } else
                for (var b = a.combo.hitCombatants, d = b.length; d--;) {
                    c = b[d];
                    if (!(this.selectType == n.STUN_LOCKED && (!c.params || !c.params.isLockedBy(a)))) {
                        c =
                            new sc.DirectHitForce(a, c, this.directHitSettings, this.effect);
                        sc.combat.addCombatForce(c);
                        this.directHitSettings.hitCount > 1 && a.addActionAttached(c)
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
        start: function(a) {
            a.clearActionAttached(b)
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
        init: function(a) {
            this.value = {
                value: a.value
            };
            this.target = d[a.target] || d.SELF;
            this.hideNumbers = a.hideNumbers
        },
        start: function(a) {
            (a = this.target(a)) && a.heal(this.value, this.hideNumbers)
        }
    });
    ig.ACTION_STEP.HEAL_STATUS = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.params && a.params.healStatus()
        }
    });
    ig.ACTION_STEP.CLEAR_STATUS_BAR = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.statusGui && a.statusGui.clearAllStatusEntries()
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
        init: function(a) {
            this.hpBar = a.hpBar ? sc.ENEMY_HP_BAR[a.hpBar] : void 0;
            this.analyzable = a.analyzable
        },
        start: function(a) {
            if (this.hpBar != void 0) a.visibility.hpBar = this.hpBar;
            if (this.analyzable != void 0) a.visibility.analyzable = this.analyzable
        }
    });
    ig.ACTION_STEP.SET_HP_CRITICAL = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.params.setCritical()
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
        init: function(a) {
            this.basedOn = p[a.basedOn] || p.MAX_HP;
            this.factor = a.factor || 0;
            this.hitNumberFactor = a.hitNumberFactor ||
                0
        },
        start: function(a) {
            var b = Math.round(this.basedOn(a, this.factor));
            b && a.instantDamage(b, this.hitNumberFactor)
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
        init: function(a) {
            this.value = a.value || false
        },
        start: function(a) {
            a.hitIgnore = this.value
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
        init: function(a) {
            this.maxTime = a.maxTime;
            this.meleeOnly = a.meleeOnly || false
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime
        },
        run: function(a) {
            a = a.getCombatantRoot();
            if (a.isPlayer)
                if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) a.gui.crosshair.getDir(a.face);
                else {
                    sc.control.moveDir(r, 1);
                    Vec2.isZero(r) || Vec2.assign(a.face, r)
                } a.combo.guardTrapTime = a.combo.guardTrapTime + ig.system.tick;
            if (a.stepTimer <= 0 || a.combo.guardedHits > 0 &&
                (!this.meleeOnly || a.hasBlockEntity())) {
                a.combo.guardTrapTime = 0;
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
        init: function(a) {
            this.factor = a.factor
        },
        start: function(a) {
            var b = {
                absolute: true,
                value: Math.round(a.combo.blockedDamage * this.factor)
            };
            a.heal(b)
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
        init: function(a) {
            this.factor = a.factor
        },
        start: function(a) {
            var b = a.getAttribute("damage");
            if (b) {
                var a = a.getCombatantRoot(),
                    c = a.params.getStat("attack", true) / a.params.getStat("attack", false),
                    b = {
                        absolute: true,
                        value: Math.round(b * this.factor * c)
                    };
                a.heal(b)
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
        init: function(a) {
            this.factor = a.factor;
            this.multiEnemyScale = a.multiEnemyScale || 0
        },
        start: function(a) {
            var b = a.combo.dmgSum;
            if (b) {
                var c = a.getCombatantRoot(),
                    d = c.params.getStat("attack", true) / c.params.getStat("attack", false),
                    b = b * d / a.combo.hitCombatants.length;
                this.multiEnemyScale && (b = b * (1 + this.multiEnemyScale * (a.combo.hitCombatants.length - 1)));
                a = {
                    absolute: true,
                    value: Math.round(b * this.factor)
                };
                c.heal(a)
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
        init: function(a) {
            this.sp = a.sp
        },
        start: function(a) {
            a.params.consumeSp(this.sp)
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
        init: function(a) {
            this.time = a.time
        },
        run: function(a) {
            sc.combat.addFreeLineCommand(a, this.time);
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
        init: function(a) {
            this.name = a.name;
            var b = a.shield;
            this.shield = new sc.COMBAT_SHIELDS[b.type](b.settings, this.name);
            this.actionDetached = a.actionDetached || false;
            this.perfectGuardTime = a.perfectGuardTime || null;
            this.target = d[a.target] || d.SELF
        },
        clearCached: function() {
            this.shield && this.shield.clearCached()
        },
        run: function(a) {
            var b = this.target(a).getCombatantRoot().addShield(this.shield, this.perfectGuardTime);
            this.actionDetached || a.addActionAttached(b);
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
        init: function(a) {
            this.name = a.name;
            this.target = d[a.target] || d.SELF
        },
        run: function(a) {
            this.target(a).getCombatantRoot().removeNamedShield(this.name);
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
        init: function(a) {
            this.baseStrength = a.baseStrength || 0;
            if (a.element) this.element = sc.ELEMENT[a.element]
        },
        run: function(a) {
            var b = this.element === void 0 ? sc.combat.getElementMode(a) : this.element;
            sc.AssaultTools.spawn(a, b, this.baseStrength);
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
        init: function(a) {
            this.msgType = sc.COMBAT_MSG_TYPE[a.msgType] || sc.COMBAT_MSG_TYPE.STUN_CANCEL
        },
        start: function(a) {
            sc.combat.showCombatMessage(a, this.msgType)
        }
    });
    ig.ACTION_STEP.ADD_TARGET_STUN_LOCK = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        run: function(a) {
            var b = a.getTarget();
            b && (b.params && b.hasStun()) && b.params.startLock(a);
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
        init: function(a) {
            this.dropType = a.dropType;
            this.healValue =
                a.healValue || 0.1;
            this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.target = a.target;
            this.partyToo = a.partyToo
        },
        run: function(a) {
            var b = null;
            this.target && (b = ig.Event.getEntity(this.target));
            sc.DropEntity.spawnDrops(a, this.align, this.dropType, this.healValue, b);
            if (this.partyToo)
                for (b = sc.party.getPartySize(); b--;) {
                    var c = sc.party.getPartyMemberEntityByIndex(b);
                    c && (c.model && c.model.isAlive()) && sc.DropEntity.spawnDrops(a, this.align, this.dropType, this.healValue, c)
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
            init: function(a) {
                this.dropType = a.dropType;
                this.minVal = a.minVal || 1;
                this.maxVal = a.maxVal || 1;
                this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
                this.target = a.target;
                this.varIncrease =
                    a.varIncrease;
                this.circleEffect = a.circleEffect;
                this.pickupEffect = a.pickupEffect
            },
            run: function(a) {
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
                sc.DropEntity.spawnGenericDrops(a, b, c);
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
        init: function(a) {
            this.maxTime = a.maxTime;
            this.maxDistance = a.maxDistance || 0;
            this.precise = a.precise || false
        },
        start: function(a) {
            a.stepTimer = a.stepTimer + this.maxTime;
            var b = a.spawnPoint;
            if (b) {
                var c = ig.navigation.getNavPath(a);
                c.toPoint(b, this.maxDistance,
                    this.precise);
                a.stepData.path = c
            } else a.stepData.path = null
        },
        run: function(a) {
            if (!a.stepData.path) return true;
            if (this.maxTime && a.stepTimer <= 0 && !a.jumping) {
                a.stepData.path.interrupt();
                return true
            }
            return a.stepData.path.moveEntity()
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
        init: function(a) {
            this.flyLevel = a.flyLevel;
            this.breaking = a.breaking || false;
            this.stable = a.stable || false;
            this.wait = a.wait || false;
            this.direction = t[a.direction] || t.FACE_REVERSE
        },
        start: function(a) {
            Vec2.assign(r, a.face);
            this.direction == t.FACE_REVERSE && Vec2.flip(r);
            var b = a.doDamageMovement(r, this.flyLevel, this.breaking, false, 0, true);
            if (this.wait) a.stepTimer = a.stepTimer + b
        },
        run: function(a) {
            return !this.wait || a.stepTimer <= 0
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
            branchLabel: function(a) {
                switch (a) {
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
        init: function(a) {
            this.conditions = new sc.CombatConditions(a.conditions);
            this.withElse = a.withElse
        },
        getBranchNames: function() {
            return this.withElse ? ["thenStep", "elseStep"] : ["thenStep"]
        },
        getNext: function(a) {
            var b = Math.random();
            return this.conditions.check(a, b) ? this.branches.thenStep ? this.branches.thenStep : this._nextStep : this.branches.elseStep ? this.branches.elseStep :
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
        init: function(a) {
            this.varName = a.varName;
            this.changeOperator = q[a.changeType] || q.set;
            this.value = a.value || 0
        },
        run: function(a) {
            if (a = a.getCombatantRoot().collaboration) {
                var b = a.getVar(this.varName),
                    c = ig.Event.getExpressionValue(this.value),
                    b = this.changeOperator(b, c * 1);
                a.setVar(this.varName, b);
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
        init: function(a) {
            this.breakType = sc.ENEMY_COLLAB_BREAK[a.breakType]
        },
        start: function(a) {
            if (a.collaboration) a.collaboration.breakType = this.breakType
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
            SELF: function(a) {
                return a
            },
            TARGET: function(a) {
                return a.getTarget()
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
        init: function(a) {
            this.targetType = v[a.targetType] || v.TARGET;
            this.targetLabel = a.targetLabel;
            this.labelFilter = a.labelFilter || null;
            this.pointPattern = s[a.pointPattern] || s.TARGET_CIRCLE;
            this.distance =
                a.distance || 0;
            this.circularAngle = a.circularAngle || 0
        },
        start: function(a) {
            var b = a.collaboration,
                c = this.targetType(a, this.targetLabel);
            if (b && c) {
                a = b.getLabeledParticipants(this.labelFilter);
                if (a.length) {
                    var d = [],
                        b = b.getCenterPos(j, ig.ENTITY_ALIGN.BOTTOM, this.labelFilter);
                    this.pointPattern(d, c, a, b, this.distance, this.circularAngle);
                    for (b = a.length; b--;) {
                        for (var c = a[b], e = c.getCenter(i), f = d.length, g = -1, h = -1; f--;) {
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
        init: function(a) {
            this.attribName = a.attribName;
            this.valueType = y[a.ENTITY_NAME] || y.ENTITY_NAME
        },
        start: function(a) {
            var b = a.getTarget();
            b && a.setAttribute(this.attribName, this.valueType(b))
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
        init: function(a) {
            this.entityType = v[a.varName] || v.SELF;
            this.entityLabel = a.entityLabel;
            this.labelFilter = a.labelFilter
        },
        start: function(a) {
            if (a.collaboration) {
                var b = this.entityType(a, this.entityLabel);
                a.collaboration.setParticipantsEntity(b, this.labelFilter)
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
        init: function(a) {
            this.label = a.label
        },
        start: function(a) {
            if (a.collaboration) {
                a.collaboration.getLabeledParticipant(this.label).storeEnemy(a);
                a.setTarget(null);
                a.hide()
            }
        }
    });
    ig.ACTION_STEP.CONNECT_HP_TO_STORED_ENEMIES = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.connectHpToEnemies(a.storedEnemies)
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
        init: function(a) {
            this.enemyType = a.enemyType
        },
        start: function(a) {
            for (var b = ig.game.shownEntities, c = b.length, d = []; c--;) {
                var e = b[c];
                e instanceof ig.ENTITY.Enemy && e.enemyName == this.enemyType && d.push(e)
            }
            a.connectHpToEnemies(d)
        }
    });
    ig.ACTION_STEP.UPDATE_RESPAWN_POINT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            Vec3.assign(a.respawn.pos, a.coll.pos)
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
        init: function(a) {
            this.key = a.key
        },
        run: function(a) {
            sc.combat.sendEnemyMessage(a, this.key);
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
        init: function(a) {
            this.tracker = a.tracker;
            this.forceValue = a.forceValue
        },
        start: function(a) {
            var b = a.trackers[this.tracker];
            b && b.reset(a, this.forceValue)
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
        init: function(a) {
            this.frequency = a.frequency
        },
        start: function(a) {
            sc.combat.submitFrequency(a, this.frequency, true)
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
            init: function(a) {
                this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
                this.distance = a.distance || 0;
                this.centralAngle = a.centralAngle;
                this.startAngle = a.startAngle;
                if (this.startAngle == void 0) this.startAngle = -this.centralAngle / 2;
                this.uniformRandom = a.uniformRandom
            },
            start: function(a) {
                var b = a.storedEnemies,
                    d = b.length,
                    e = d;
                Vec2.assign(r, a.face);
                Vec2.rotate(r, this.startAngle * Math.PI * 2);
                var d = this.centralAngle / (this.centralAngle == 1 ? d : d - 1) * Math.PI *
                    2,
                    f = a.getAlignedPos(this.align, c);
                for (this.distance && Vec2.length(r, this.distance); e--;) {
                    var g = b[e],
                        h = (Math.random() - 0.5) * this.uniformRandom * d;
                    h && Vec2.rotate(r, h);
                    Vec2.assign(g.face, r);
                    Vec3.assign(j, f);
                    this.distance && Vec2.add(j, r);
                    g.setPos(j.x - g.coll.size.x / 2, j.y - g.coll.size.y / 2, j.z);
                    g.setTarget(a.target);
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
        start: function(a) {
            a.enemyType &&
                a.enemyType.reselectTarget(a, false, true)
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
        init: function(a) {
            this.forceSettings = ig.copy(a);
            if (a.enemyInfo) this.enemyInfo = new sc.EnemyInfo(a.enemyInfo);
            this.forceSettings.enemyType = this.enemyInfo.enemyType;
            a.attachProxy && (this.forceSettings.proxySrc = sc.ProxyTools.prepareSrc(a.attachProxy))
        },
        clearCached: function() {
            this.enemyInfo && this.enemyInfo.clearCached();
            this.forceSettings.proxySrc && sc.ProxyTools.releaseSrc(this.forceSettings.proxySrc)
        },
        start: function(a) {
            var b = new sc.EnemySpawnerForce(a, this.forceSettings);
            sc.combat.addCombatForce(b);
            a.addActionAttached(b)
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
        init: function(a) {
            if (a.enemyInfo) this.enemyInfo = new sc.EnemyInfo(a.enemyInfo);
            this.radius = a.radius || 0;
            this.spawnCondition = a.spawnCondition || null
        },
        clearCached: function() {
            this.enemyInfo && this.enemyInfo.clearCached()
        },
        start: function(a) {
            var b =
                Vec3.create();
            ig.navigation.getClosePosition(b, a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c), this.enemyInfo.enemyType.size, a, null, this.radius, 1, 0, ig.NAV_CLOSE_POINT_SEARCH.BEHIND_FACE, false);
            ig.game.spawnEntity(ig.ENTITY.Enemy, b.x - this.enemyInfo.enemyType.size.x / 2, b.y - this.enemyInfo.enemyType.size.y / 2, b.z, {
                enemyInfo: this.enemyInfo.getSettings(),
                ownerEnemy: a.getCombatantRoot(),
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
        init: function(a) {
            this.enemyType = a.enemyType;
            this.noRumble = a.noRumble
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
        init: function(a) {
            this.noRewards = a.noReward || false
        },
        start: function(a) {
            a.selfDestruct(this.noRewards)
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
        GUARDED_ATTACKER: function(a) {
            a = a.combo.guardedEntity;
            return !a || a.isBall ? null : a.getCombatant()
        },
        FIRST_HIT: function(a) {
            return a.combo.hitCombatants[0]
        },
        PROXY_OWNER: function(a) {
            return a.getCombatantRoot()
        },
        ENEMY_OWNER: function(a) {
            return a.getCombatantRoot().ownerEnemy
        },
        ENEMY_OWNER_ACTION_PROXY: function(b, c) {
            if (!b.getCombatantRoot().ownerEnemy) return null;
            var d = b.getCombatantRoot().ownerEnemy.actionAttached;
            return a(d, c)
        },
        PROXY_SRC: function(a) {
            return a.sourceEntity
        },
        ACTION_PROXY: function(b, c) {
            return a(b.actionAttached, c)
        },
        PROXY: function(b, c) {
            return a(b.entityAttached, c)
        },
        PROXY_OWNER_ACTION_PROXY: function(b, c) {
            var d = b.getCombatantRoot().actionAttached;
            return a(d, c)
        },
        PROXY_SRC_ACTION_PROXY: function(b, c) {
            return a(b.sourceEntity.actionAttached, c)
        },
        NAMED_ENTITY: function(a, b) {
            return ig.game.namedEntities[b]
        },
        ATTRIB_ENTITY: function(a, b) {
            return ig.Event.getEntity(a.getAttribute(b))
        },
        THREAT: function(a) {
            return a.threat
        },
        ENTITY_VIA_ID: function(a, b) {
            return ig.game.entities[b]
        },
        PART_TARGET_ROOT: function(a) {
            a = a.getTarget();
            return a instanceof sc.CombatantAnimPartEntity ? a.getCombatantRoot() : a
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
        init: function(a) {
            this.kind = u[a.kind] || u.PLAYER;
            this.key = a.key
        },
        start: function(a) {
            var b = ig.Event.getExpressionValue(this.key),
                b = this.kind(a, b);
            if (a instanceof sc.BasicCombatant) a.tmpTarget = b
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
        init: function(a) {
            this.attrib = a.attrib || null
        },
        start: function(a) {
            var b = a.getTarget();
            a.setAttribute(this.attrib, b)
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
        init: function(a) {
            this.searchType = z[a.searchType] || z.IN_VIEW;
            this.distance = a.distance || 0;
            this.ignoreCurrentTarget = a.ignoreCurrentTarget || false;
            this.prevHitBehavior =
                D[a.prevHitBehavior] || D.NONE
        },
        start: function(a) {
            for (var b = a.getTarget(), c = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, j), d = this.searchType.angle * Math.PI * 2, c = ig.game.getEntitiesInCircle(c, this.distance || this.searchType.radius, 1, 32, a.face, -d / 2, d / 2, a), d = null, e = 0, f = c.length; f--;) {
                var g = c[f];
                if (!(this.ignoreCurrentTarget && g == b)) {
                    if (g instanceof sc.CombatantAnimPartEntity) g = g.owner;
                    if (g instanceof ig.ENTITY.Combatant && g.party != a.party && (g.party != sc.COMBATANT_PARTY.ENEMY || g.target)) {
                        var h = ig.CollTools.getDistVec2(a.coll,
                                g.coll, r),
                            i = Vec2.length(h);
                        if (this.searchType.facePriority) {
                            h = Vec2.angle(a.face, h);
                            i = i + h * 1E3
                        }
                        if (a.combo.hitCombatants.indexOf(g) != -1)
                            if (this.prevHitBehavior == D.PREFER_NON_HIT) i = i + 1E4;
                            else if (this.prevHitBehavior == D.ONLY_NON_HIT) continue;
                        if (!d || i < e) {
                            d = g;
                            e = i
                        }
                    }
                }
            }
            a.tmpTarget = d
        }
    });
    ig.ACTION_STEP.SET_OWNER_REPLACE_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            var b = a.getCombatantRoot();
            b != a && b.setReplaceTarget && b.setReplaceTarget(a)
        }
    });
    ig.ACTION_STEP.SET_TARGET_REPLACE_TARGET =
        ig.ActionStepBase.extend({
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function() {},
            start: function(a) {
                var b = a.getTarget();
                b != a && b.setReplaceTarget && b.setReplaceTarget(a)
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
        init: function(a) {
            this.poiFilter = sc.CombatPoI.initPoiFilter(a.poiFilter);
            this.distance = a.distance;
            this.furthest = a.furthest || false
        },
        start: function(a) {
            var b;
            b = this.poiFilter ? sc.CombatPoI.getClosestPoI(this.poiFilter, a, this.distance, false, this.furthest) : a.lastPoICheck;
            a.tmpTarget = b
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
        init: function(a) {
            this.selectType = sc.PROXY_SELECT_TYPE[a.selectType];
            this.group = a.group
        },
        start: function(a) {
            var b = this.selectType(a, a.getSourceEntity(), this.group);
            a.tmpTarget = b
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
        init: function(a) {
            this.damage = a.damage || 1
        },
        start: function(a) {
            a.reduceHp && a.reduceHp(this.damage)
        }
    });
    ig.ACTION_STEP.CLEAR_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.tmpTarget = null
        }
    });
    ig.ACTION_STEP.CLEAR_PREV_HIT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.combo.hitCombatants.length = 0
        }
    });
    ig.ACTION_STEP.CLEAR_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            a.setTarget(null)
        }
    });
    ig.ACTION_STEP.DETOUR_COMPRESSOR_THREAT = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function(a) {
            var b =
                a.threat;
            if (b && b instanceof sc.CompressedBaseEntity) {
                var c = b.coll,
                    b = Vec2.length(b.coll.vel);
                if (Math.abs(c.vel.x) > Math.abs(c.vel.y)) {
                    c.vel.y = c.pos.y + c.size.y / 2 > a.coll.pos.y + a.coll.size.y / 2 ? 0.5 : -0.5;
                    a.setAttribute("compressorDetourNorth", c.vel.y > 0);
                    c.vel.x = c.vel.x > 0 ? 1 : -1
                } else {
                    var d = ig.game.playerEntity.coll;
                    c.vel.x = c.pos.x + c.size.x / 2 > d.pos.x + d.size.x / 2 ? 1 : -1;
                    c.vel.y = c.vel.y > 0 ? 0.6 : -0.6;
                    a.setAttribute("compressorDetourNorth", c.vel.y > 0)
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
        init: function(a) {
            this.target = d[a.target] || d.SELF;
            this.stats = a.stats;
            this.name = a.name || null;
            this.hacked = a.hacked || false
        },
        start: function(a) {
            var b =
                this.target(a);
            if (b && b.params) {
                var c = new sc.ActionBuff(this.stats, this.name, this.hacked);
                b.params.addBuff(c);
                a.addActionAttached(c)
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
        init: function(a) {
            this.target = d[a.target] || d.SELF;
            this.name = a.name || null;
            this.param = a.param;
            this.value = a.value || 0;
            this.changeType = C[a.changeType] || C.set
        },
        start: function(a) {
            if ((a = this.target(a)) && a.params)
                for (var b = a.params.buffs, c = b.length; c--;) {
                    var d = b[c];
                    if (d instanceof sc.ActionBuff && d.name == this.name) {
                        var e = this.changeType(d.params[this.param],
                            this.value);
                        a.params.modifyBuff(d, this.param, e)
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
        init: function(a) {
            this.varName = a.varName;
            this.stat = A[a.stat] || A.RELATIVE_HP
        },
        start: function(a) {
            var b =
                ig.Event.getVarName(this.varName);
            if (b) {
                if (a && a.isCombatant) {
                    var c;
                    if (this.stat.stat) c = a.params.getStat(this.stat.stat);
                    else if (this.stat == A.RELATIVE_HP) c = a.params.getHpFactor();
                    else if (this.stat == A.CURRENT_HP) c = a.params.currentHp;
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
        init: function(a) {
            this.attrib = a.attrib;
            this.posType = B[a.posType]
        },
        start: function(a) {
            var b = Vec3.create();
            this.posType(a, b);
            a.setAttribute(this.attrib,
                b)
        }
    })
});
ig.baked = !0;
