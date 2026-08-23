/**
 * game.feature.puzzle.entities.magnet
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.magnet")`.
 *
 * `ig.ENTITY.Magnet`: a directional magnet that, when hit by SHOCK element,
 * pulls entities along its facing direction for 0.4 seconds. Entities with
 * `onMagnetStart`/`onMagnetEnd` callbacks are pulled; their z-gravity is
 * disabled during the pull.
 */
ig.module("game.feature.puzzle.entities.magnet")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.combat-target-event", "impact.base.actor-entity")
    .defines(function () {

    var faceOut = Vec2.create(),
        traceResult = {};

    sc.COMBAT_ENEMY_EVENT.MAGNET_PULL = {
        _wm: {
            attributes: {}
        },
        check: function () {
            return true
        }
    };

    ig.ENTITY.Magnet = ig.AnimatedEntity.extend({
        dir: 0,
        targetDir: 0,
        defaultDir: 0,
        face: Vec2.create(),
        altDirs: [],
        pull: {
            timer: 0,
            entities: [],
            pulling: [],
            moved: [],
            done: false
        },
        effects: {
            sheet: new ig.EffectSheet("puzzle.magnet"),
            handle: null
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                dir: {
                    _type: "Face",
                    _info: "Direction to face",
                    _select: ig.ActorEntity.FACE4
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                },
                altDirs: {
                    _type: "MagnetAltDirs",
                    _info: "Other types depending on var conditions",
                    _optional: true
                }
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.coll.zGravityFactor = 1E3;
            this.dir = this.targetDir = this.defaultDir = ig.ActorEntity.FACE4[settings.dir] || 0;
            ig.ActorEntity.getFaceVec(this.dir, this.face);
            var magnetStyle = ig.mapStyle.get("magnet");
            if (magnetStyle) {
                this.initAnimations({
                    DOCTYPE: "MULTI_DIR_ANIMATION",
                    sheet: {
                        src: magnetStyle.sheet,
                        width: 16,
                        height: 32,
                        offX: magnetStyle.x,
                        offY: magnetStyle.y
                    },
                    shapeType: "Y_FLAT",
                    SUB: [{
                        dirs: 8,
                        flipX: [0, 0, 0, 0, 0, 1, 1, 1],
                        tileOffsets: [0, 3, 1, 4, 2, 4, 1, 3],
                        dirOffsets: [
                            [0, 0, 0],
                            [0, 0, 0],
                            [0, 0, 0],
                            [0, 0, 0],
                            [0, 0, 0],
                            [1, 0, 0],
                            [1, 0, 0],
                            [1, 0, 0]
                        ],
                        SUB: [{
                            name: "off",
                            time: 0.1,
                            frames: [0],
                            repeat: false
                        }]
                    }, {
                        dirs: 4,
                        flipX: [0, 0, 0, 1],
                        tileOffsets: [0, 1, 2, 1],
                        dirOffsets: [
                            [0, 0, 0],
                            [0, 0, 0],
                            [0, 0, 0],
                            [1, 0, 0]
                        ],
                        SUB: [{
                            name: "on",
                            time: 0.05,
                            frames: [0, 5],
                            repeat: true
                        }]
                    }]
                });
                this.setCurrentAnim("off")
            }
            if (settings.altDirs) {
                var altDirs = settings.altDirs;
                for (var i = 0; i < altDirs.length; ++i) this.altDirs[i] = {
                    condition: new ig.VarCondition(altDirs[i].condition),
                    dir: ig.ActorEntity.FACE4[altDirs[i].dir]
                }
            }
            this.updateDir(true)
        },

        onHideRequest: function () {
            ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            effect.isDone() && this.hide()
        },

        update: function () {
            if (this.isPullActive()) {
                this.pullEntities();
                if (this.pull.timer > 0) {
                    this.fetchPullEntities();
                    this.pull.timer = this.pull.timer - ig.system.tick;
                    if (this.pull.timer <= 0) this.pull.timer = 0
                }
                if (!this.isPullActive()) {
                    this.effects.handle.stop();
                    this.effects.handle = null;
                    this.pull.entities.length = 0;
                    this.setCurrentAnim("off")
                }
            } else if (this.targetDir != this.dir) {
                var targetFace = ig.ActorEntity.getFaceVec(this.targetDir, faceOut);
                if (Vec2.rotateToward(this.face, targetFace, Math.PI * 2 * ig.system.tick * 3)) this.dir = this.targetDir
            }
            this.parent()
        },

        startPull: function () {
            this.dir = this.targetDir;
            ig.ActorEntity.getFaceVec(this.dir, this.face);
            this.pull.timer = 0.4;
            this.setCurrentAnim("on");
            this.effects.handle = this.effects.sheet.spawnOnTarget("active", this, {
                duration: -1,
                offset: {
                    x: 0,
                    y: 0,
                    z: 14
                },
                angle: Vec2.clockangle(this.face)
            });
            this.fetchPullEntities()
        },

        fetchPullEntities: function () {
            var xOff = -8,
                yOff = -8,
                w = 16,
                h = 16;
            if (this.face.x) {
                w = 640;
                xOff = this.face.x < 0 ? -640 : 0
            }
            if (this.face.y) {
                h = 640;
                yOff = this.face.y < 0 ? -640 : 0
            }
            var coll = this.coll,
                center = this.getCenter(faceOut),
                entities = ig.game.getEntitiesInRectangle(center.x + xOff, center.y + yOff, coll.pos.z + 4, w, h, 16, this, this.pull.entities);
            for (var i = entities.length; i--;) {
                var entity = entities[i];
                if (entity.onMagnetStart && entity.onMagnetStart()) {
                    entity.coll.zGravityFactor = 0;
                    entity.magnetGrabId = this.id;
                    this.effects.sheet.spawnOnTarget("pull", entity, {
                        duration: -1
                    });
                    this.pull.entities.push(entity);
                    this.pull.pulling.push(entity)
                }
            }
        },

        isPullActive: function () {
            return this.pull.timer > 0 || this.pull.pulling.length > 0
        },

        pullEntities: function () {
            for (var allDone = true, i = this.pull.pulling.length; i--;) {
                var entity = this.pull.pulling[i];
                if (entity.magnetGrabId == this.id) {
                    var dist = ig.CollTools.getDistVec2(this.coll, entity.coll, faceOut),
                        gapDist = this.face.x ? Math.abs(dist.x) - entity.coll.size.x / 2 - this.coll.size.x / 2 : Math.abs(dist.y) - entity.coll.size.y / 2 - this.coll.size.y / 2;
                    if (gapDist > 0) {
                        var step = Math.min(ig.system.tick * 300, gapDist),
                            dx = -this.face.x * step,
                            dy = -this.face.y * step,
                            trace = ig.game.physics.initTraceResult(traceResult);
                        ig.game.traceEntity(trace, entity, dx, dy, 0, 0, 0, ig.COLLTYPE.IGNORE);
                        if (trace.dist > 0) {
                            this.pull.moved[i] = true;
                            allDone = false;
                            entity.setPos(entity.coll.pos.x + dx * trace.dist, entity.coll.pos.y + dy * trace.dist, entity.coll.pos.z, true)
                        }
                    }
                }
            }
            if (allDone) {
                for (var i = this.pull.pulling.length; i--;) {
                    var entity = this.pull.pulling[i];
                    ig.EffectTools.clearEffects(entity);
                    entity.onMagnetEnd(this.pull.moved[i]);
                    entity.coll.zGravityFactor = 1;
                    entity.coll.vel.z = 0
                }
                this.pull.pulling.length = 0;
                this.pull.moved.length = 0
            }
        },

        varsChanged: function () {
            this.updateDir(false)
        },

        updateDir: function (instant) {
            for (var dir = this.defaultDir, i = this.altDirs.length; i--;)
                if (this.altDirs[i].condition.evaluate()) {
                    dir = this.altDirs[i].dir;
                    break
                } if (dir != this.targetDir) {
                this.dir = this.targetDir;
                this.targetDir = dir
            }
            if (instant) {
                this.dir = this.targetDir;
                ig.ActorEntity.getFaceVec(this.dir, this.face)
            }
        },

        ballHit: function (ball) {
            var hitCenter = ball.getHitCenter(this);
            ball.getElement() == sc.ELEMENT.SHOCK && !this.isPullActive() && this.startPull();
            sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
            return true
        }
    })
});
ig.baked = !0;