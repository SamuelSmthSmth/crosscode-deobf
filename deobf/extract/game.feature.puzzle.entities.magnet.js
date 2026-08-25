ig.module("game.feature.puzzle.entities.magnet").requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.combat-target-event", "impact.base.actor-entity").defines(function() {
    var b = Vec2.create(),
        a = {};
    sc.COMBAT_ENEMY_EVENT.MAGNET_PULL = {
        _wm: {
            attributes: {}
        },
        check: function() {
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
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.coll.zGravityFactor = 1E3;
            this.dir = this.targetDir = this.defaultDir = ig.ActorEntity.FACE4[f.dir] ||
                0;
            ig.ActorEntity.getFaceVec(this.dir, this.face);
            if (a = ig.mapStyle.get("magnet")) {
                this.initAnimations({
                    DOCTYPE: "MULTI_DIR_ANIMATION",
                    sheet: {
                        src: a.sheet,
                        width: 16,
                        height: 32,
                        offX: a.x,
                        offY: a.y
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
            if (f.altDirs) {
                f = f.altDirs;
                for (a = 0; a < f.length; ++a) this.altDirs[a] = {
                    condition: new ig.VarCondition(f[a].condition),
                    dir: ig.ActorEntity.FACE4[f[a].dir]
                }
            }
            this.updateDir(true)
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            a.isDone() && this.hide()
        },
        update: function() {
            if (this.isPullActive()) {
                this.pullEntities();
                if (this.pull.timer > 0) {
                    this.fetchPullEntities();
                    this.pull.timer =
                        this.pull.timer - ig.system.tick;
                    if (this.pull.timer <= 0) this.pull.timer = 0
                }
                if (!this.isPullActive()) {
                    this.effects.handle.stop();
                    this.effects.handle = null;
                    this.pull.entities.length = 0;
                    this.setCurrentAnim("off")
                }
            } else if (this.targetDir != this.dir) {
                var a = ig.ActorEntity.getFaceVec(this.targetDir, b);
                if (Vec2.rotateToward(this.face, a, Math.PI * 2 * ig.system.tick * 3)) this.dir = this.targetDir
            }
            this.parent()
        },
        startPull: function() {
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
        fetchPullEntities: function() {
            var a = -8,
                c = -8,
                e = 16,
                f = 16;
            if (this.face.x) {
                e = 640;
                a = this.face.x < 0 ? -640 : 0
            }
            if (this.face.y) {
                f = 640;
                c = this.face.y < 0 ? -640 : 0
            }
            for (var g = this.coll, h = this.getCenter(b), a = ig.game.getEntitiesInRectangle(h.x + a, h.y + c, g.pos.z + 4, e, f, 16, this, this.pull.entities), c = a.length; c--;) {
                e = a[c];
                if (e.onMagnetStart && e.onMagnetStart()) {
                    e.coll.zGravityFactor =
                        0;
                    e.magnetGrabId = this.id;
                    this.effects.sheet.spawnOnTarget("pull", e, {
                        duration: -1
                    });
                    this.pull.entities.push(e);
                    this.pull.pulling.push(e)
                }
            }
        },
        isPullActive: function() {
            return this.pull.timer > 0 || this.pull.pulling.length > 0
        },
        pullEntities: function() {
            for (var d = true, c = this.pull.pulling.length, e = a; c--;) {
                var f = this.pull.pulling[c];
                if (f.magnetGrabId == this.id) {
                    var g = ig.CollTools.getDistVec2(this.coll, f.coll, b),
                        e = this.face.x ? Math.abs(g.x) - f.coll.size.x / 2 - this.coll.size.x / 2 : Math.abs(g.y) - f.coll.size.y / 2 - this.coll.size.y /
                        2;
                    if (e > 0) {
                        var e = Math.min(ig.system.tick * 300, e),
                            g = -this.face.x * e,
                            h = -this.face.y * e,
                            e = ig.game.physics.initTraceResult(a);
                        ig.game.traceEntity(e, f, g, h, 0, 0, 0, ig.COLLTYPE.IGNORE);
                        if (e.dist > 0) {
                            this.pull.moved[c] = true;
                            d = false;
                            f.setPos(f.coll.pos.x + g * e.dist, f.coll.pos.y + h * e.dist, f.coll.pos.z, true)
                        }
                    }
                }
            }
            if (d) {
                for (c = this.pull.pulling.length; c--;) {
                    f = this.pull.pulling[c];
                    ig.EffectTools.clearEffects(f);
                    f.onMagnetEnd(this.pull.moved[c]);
                    f.coll.zGravityFactor = 1;
                    f.coll.vel.z = 0
                }
                this.pull.pulling.length = 0;
                this.pull.moved.length =
                    0
            }
        },
        varsChanged: function() {
            this.updateDir(false)
        },
        updateDir: function(a) {
            for (var b = this.defaultDir, e = this.altDirs.length; e--;)
                if (this.altDirs[e].condition.evaluate()) {
                    b = this.altDirs[e].dir;
                    break
                } if (b != this.targetDir) {
                this.dir = this.targetDir;
                this.targetDir = b
            }
            if (a) {
                this.dir = this.targetDir;
                ig.ActorEntity.getFaceVec(this.dir, this.face)
            }
        },
        ballHit: function(a) {
            var b = a.getHitCenter(this);
            a.getElement() == sc.ELEMENT.SHOCK && !this.isPullActive() && this.startPull();
            sc.combat.showHitEffect(this, b, sc.ATTACK_TYPE.NONE,
                a.getElement(), false, false, true);
            return true
        }
    })
});
ig.baked = !0;
