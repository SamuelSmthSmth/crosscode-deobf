ig.module("impact.feature.effect.effect-sheet").requires("impact.base.loader", "impact.base.animation", "impact.feature.effect.entities.effect", "impact.feature.effect.entities.effect-particle").defines(function() {
    var b = {
            anim: {
                _type: "EffectAnim",
                _info: "Animation of particle"
            },
            followUpAnim: {
                _type: "EffectAnim",
                _info: "Animation of particle to be played before anim",
                _optional: true
            },
            postAnim: {
                _type: "EffectAnim",
                _info: "Animation of particle to be played when particle disappears",
                _optional: true
            }
        },
        a = {
            pAlpha: {
                _type: "ParticleState",
                _info: "Alpha state of particle",
                _subType: "Number",
                _subDefault: 1,
                _optional: true
            },
            pScale: {
                _type: "ParticleState",
                _info: "Alpha state of particle",
                _subType: "Vec2",
                _subDefault: {
                    x: 1,
                    y: 1
                },
                _optional: true
            },
            pRotate: {
                _type: "ParticleState",
                _info: "Alpha state of particle",
                _subType: "Number",
                _subDefault: 0,
                _optional: true
            },
            angleVary: {
                _type: "Number",
                _info: "If defined, randomly vary angle centered around start angle with given circular angle range",
                _optional: true
            },
            randFlip: {
                _type: "Boolean",
                _info: "If true: randomly flip particule horizontally",
                _optional: true
            },
            moveWithTarget: {
                _type: "Number",
                _info: "Whether particle should move with target. 0=not at all. 0.5=over half the time, 1=entirely",
                _optional: true
            },
            pLight: {
                _type: "String",
                _info: "If defined: emit light of given size for each particle",
                _select: ig.LIGHT_SIZE,
                _optional: true
            },
            particleDuration: {
                _type: "Number",
                _info: "Duration of particle. 0=animation length. -1=forever. -2=length of effect. Does NOT include time of post animation / transitions",
                _optional: true
            },
            particleDurVariance: {
                _type: "Number",
                _info: "Variance to duration. Value will be added or subtracted from duration",
                _optional: true
            },
            cancelable: {
                _type: "Boolean",
                _info: "If true, then particle is killed when effect is stopped.",
                _optional: true
            }
        };
    ig.EffectConfig = ig.Config.extend({
        init: function(c) {
            var d = {
                attributes: {}
            };
            c.particleType && (c.particleType != "CopyParticle" && c.particleType != "LaserParticle") && ig.merge(d.attributes, b);
            ig.merge(d.attributes, c.attributes);
            c.particleType && ig.merge(d.attributes, a);
            this.parent(d)
        }
    });
    ig.EffectConfig.loadParticleData =
        function(a, b, d) {
            var h = {};
            h.anim = a && b.anim && a.anims[b.anim] || null;
            h.followUpAnim = a && b.followUpAnim && a.anims[b.followUpAnim] || null;
            h.postAnim = a && b.postAnim && a.anims[b.postAnim] || null;
            h.state = new ig.ParticleState(b);
            h.moveWithTarget = b.moveWithTarget || 0;
            h.particleDuration = b.particleDuration || 0;
            h.particleDurVariance = b.particleDurVariance || 0;
            h.angleVary = b.angleVary || 0;
            h.randFlip = b.randFlip || false;
            h.cancelable = b.cancelable || false;
            h.light = ig.LIGHT_SIZE[b.pLight] || 0;
            a && !h.anim && ig.log("EFFECT ERROR - No Animation of name '" +
                b.anim + "' in '" + d + "' available. Used by '" + c + "'");
            return h
        };
    ig.EffectConfig.getParticleBlockTime = function(a) {
        return a.cancelable ? (a.particleDuration || a.anim.getDuration()) * a.moveWithTarget : 0
    };
    ig.EffectConfig.getParticleDuration = function(a) {
        return a.particleDuration || a.anim.getDuration()
    };
    var d = Vec2.create();
    ig.ParticleState = ig.Class.extend({
        alpha: null,
        scale: null,
        rotate: null,
        init: function(a) {
            if (a.pAlpha) this.alpha = this._convertEntry(a.pAlpha);
            if (a.pScale) this.scale = this._convertEntry(a.pScale);
            if (a.pRotate) this.rotate =
                this._convertEntry(a.pRotate, 2 * Math.PI)
        },
        _convertEntry: function(a, b) {
            var c = {
                start: ig.copy(a.start),
                end: ig.copy(a.end),
                valStart: a.init,
                valMiddle: a.start ? a.start.value : a.init,
                valEnd: a.end ? a.end.value : a.start ? a.start.value : a.init
            };
            if (b) {
                c.valStart = c.valStart * b;
                c.valMiddle = c.valMiddle * b;
                c.valEnd = c.valEnd * b
            }
            c.start && (c.start.spline = KEY_SPLINES[c.start.spline] || null);
            c.end && (c.end.spline = KEY_SPLINES[c.end.spline] || null);
            return c
        },
        getMaxEndTime: function(a) {
            a = a || 0;
            this.alpha && this.alpha.end && (a = Math.max(a,
                this.alpha.end.time || 0));
            this.scale && this.scale.end && (a = Math.max(a, this.scale.end.time || 0));
            this.rotate && this.rotate.end && (a = Math.max(a, this.rotate.end.time || 0));
            return a
        },
        getAlpha: function(a, b, c) {
            if (this.alpha) {
                a = this._getEntryWeight(this.alpha, a, b, c);
                if (a == 0) return this.alpha.valMiddle;
                if (a < 0) {
                    b = this.alpha.valStart;
                    c = this.alpha.valMiddle;
                    a = a + 100
                } else {
                    b = this.alpha.valMiddle;
                    c = this.alpha.valEnd
                }
                return b + a * (c - b)
            }
            return false
        },
        getScale: function(a, b, c, d, i) {
            if (this.scale) {
                b = this._getEntryWeight(this.scale,
                    b, c, d);
                if (b == 0) {
                    a.x = this.scale.valMiddle.x;
                    a.y = this.scale.valMiddle.y
                } else {
                    if (b < 0) {
                        c = this.scale.valStart;
                        d = this.scale.valMiddle;
                        b = b + 100
                    } else {
                        c = this.scale.valMiddle;
                        d = this.scale.valEnd
                    }
                    a.x = c.x + b * (d.x - c.x);
                    a.y = c.y + b * (d.y - c.y)
                }
                if (i) a.x = -a.x
            }
        },
        getRotate: function(a, b, c, d, i) {
            if (this.rotate) {
                a = this._getEntryWeight(this.rotate, a, b, c);
                b = 0;
                if (a == 0) b = this.rotate.valMiddle;
                else {
                    if (a < 0) {
                        b = this.rotate.valStart;
                        c = this.rotate.valMiddle;
                        a = a + 100
                    } else {
                        b = this.rotate.valMiddle;
                        c = this.rotate.valEnd
                    }
                    b = b + a * (c - b)
                }
                i && (b = -b);
                return d + b
            }
        },
        initAnimState: function(a, b, c) {
            a.alpha = this.alpha ? this.alpha.valStart : 1;
            a.angle = b + (this.rotate ? c ? -this.rotate.valStart : this.rotate.valStart : 0);
            a.scaleX = this.scale ? this.scale.valStart.x : 1;
            a.scaleY = this.scale ? this.scale.valStart.y : 1;
            if (c) a.scaleX = -a.scaleX
        },
        updateAnimState: function(a, b, c, h, i, j, k) {
            if (this.alpha) a.alpha = this.getAlpha(b, c, h);
            if (this.scale) {
                this.getScale(d, b, c, h, j);
                a.scaleX = d.x;
                a.scaleY = d.y
            }
            if (this.rotate && (this.rotate.start || this.rotate.end)) a.angle = this.getRotate(b, c, h, i,
                j);
            else if (k) a.angle = this.rotate ? i + (j ? -this.rotate.valStart : this.rotate.valStart) : i
        },
        initSprite: function(a, b, c) {
            a.setAlpha(this.alpha ? this.alpha.valStart : 1);
            if (this.scale) {
                a.scale.x = this.scale ? this.scale.valStart.x : 1;
                a.scale.y = this.scale ? this.scale.valStart.y : 1
            }
            if (c) a.scale.y = -a.scale.y;
            if (this.rotate) a.rotate = b + (this.rotate ? c ? -this.rotate.valStart : this.rotate.valStart : 0)
        },
        updateSprite: function(a, b, c, d, i, j, k) {
            this.alpha && a.setAlpha(this.getAlpha(b, c, d));
            this.scale && this.getScale(a.scale, b, c, d, j);
            if (this.rotate && (this.rotate.start || this.rotate.end)) a.rotate = this.getRotate(b, c, d, i, j);
            else if (k) a.rotate = this.rotate ? i + (j ? -this.rotate.valStart : this.rotate.valStart) : i
        },
        _getEntryWeight: function(a, b, c, d) {
            var d = a.end ? a.end.time || d : 0,
                i = a.start ? a.start.time || c - d : 0,
                j = 0;
            if (b < i) {
                j = (b / i).limit(0, 1);
                a.start.spline && (j = a.start.spline.get(j));
                j = j - 100
            } else if (c > 0 && a.end && c - b < d) {
                j = (1 - (c - b) / d).limit(0, 1);
                a.end.spline && (j = a.end.spline.get(j))
            }
            return j
        }
    });
    ig.EffectSheet = ig.JsonLoadable.extend({
        cacheType: "EffectSheet",
        animSheet: null,
        faceAnimSheet: null,
        effects: {},
        debugReload: true,
        onCacheCleared: function() {
            this.animSheet && this.animSheet.clearCached();
            this.faceAnimSheet && this.faceAnimSheet.clearCached();
            for (var a in this.effects) this.effects[a].clearCached()
        },
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/effects/", ".json") + ig.getCacheSuffix()
        },
        onload: function(a) {
            this.name = a.name;
            if (a.ANIMS) {
                a.ANIMS.shapeType || (a.ANIMS.shapeType = "YZ_EXPAND");
                a.ANIMS.wallY == void 0 && (a.ANIMS.wallY = 1);
                a.ANIMS.centerPivot ==
                    void 0 && (a.ANIMS.centerPivot = true);
                this.animSheet = new ig.AnimationSheet(a.ANIMS)
            }
            if (a.FACEANIMS) {
                a.FACEANIMS.DOCTYPE || (a.FACEANIMS.DOCTYPE = "MULTI_DIR_ANIMATION");
                this.faceAnimSheet = new ig.AnimationSheet(a.FACEANIMS)
            }
            for (var b in a.EFFECTS) this.effects[b] = new ig.Effect(this, b, a.EFFECTS[b])
        },
        hasEffect: function(a) {
            return !!this.effects[a]
        },
        spawnOnTarget: function(a, b, c) {
            if (!this.loaded) return null;
            if (!this.effects[a]) {
                ig.warn("Could not span effect '" + a + "' of sheet '" + this.path + "'");
                return null
            }
            if (!b) return null;
            var c = c || {},
                d = b.getCenter();
            return ig.game.spawnEntity(ig.ENTITY.Effect, d.x, d.y, b.coll.pos.z, {
                effect: this.effects[a],
                target: b,
                target2: c.target2,
                target2Point: c.target2Point,
                target2Align: c.target2Align,
                target2Offset: c.target2Offset,
                noMultiGroup: c.noMultiGroup,
                spriteFilter: c.spriteFilter,
                offset: c.offset,
                rotOffset: c.rotOffset,
                align: c.align || ig.ENTITY_ALIGN.BOTTOM,
                angle: c.angle || 0,
                flipX: c.flipX || false,
                rotateFace: c.rotateFace || 0,
                flipLeftFace: c.flipLeftFace || false,
                duration: c.duration || 0,
                group: c.group || null,
                callback: c.callback
            })
        },
        spawnFixed: function(a, b, c, d, i, j) {
            if (!this.loaded) return null;
            if (!this.effects[a]) {
                ig.warn("Could not span effect '" + a + "' of sheet '" + this.path + "'");
                return null
            }
            j = j || {};
            return ig.game.spawnEntity(ig.ENTITY.Effect, b, c, d, {
                effect: this.effects[a],
                target: i,
                target2: j.target2,
                target2Point: j.target2Point,
                target2Align: j.target2Align,
                target2Offset: j.target2Offset,
                noMultiGroup: j.noMultiGroup,
                spriteFilter: j.spriteFilter,
                align: 0,
                flipX: j.flipX || false,
                rotateFace: j.rotateFace || 0,
                flipLeftFace: j.flipLeftFace ||
                    false,
                angle: j.angle || 0,
                duration: j.duration || 0,
                group: j.group || null,
                callback: j.callback
            })
        }
    });
    ig.FX_RUNNER_CANCEL = {
        NONE: 0,
        ALL: 1,
        ONLY_PERMA: 2
    };
    var c = null;
    ig.Effect = ig.Class.extend({
        id: null,
        steps: [],
        loopStartIdx: 0,
        loopStartTime: 0,
        loopEndIdx: -1,
        loopEndTime: -1,
        maxTime: 0,
        init: function(a, b, d) {
            this.id = a.path + "/" + b;
            var h = 0;
            c = b;
            for (b = 0; b < d.length; ++b) {
                var i = d[b],
                    j = i.type;
                if (j == "WAIT") {
                    h = h + i.time;
                    this.maxTime = Math.max(this.maxTime, h);
                    i = new ig.EffectStepBase
                } else if (j == "LOOP_START") {
                    this.loopStartIdx = this.steps.length;
                    this.loopStartTime = h;
                    i = new ig.EffectStepBase
                } else if (j == "LOOP_END") {
                    this.loopEndIdx = this.steps.length;
                    this.loopEndTime = h;
                    i = new ig.EffectStepBase;
                    this.maxTime = this.loopEndTime
                } else i = new ig.EFFECT_ENTRY[i.type](a, i);
                i.time = h;
                this.steps.push(i);
                i = i.getDuration ? i.getDuration() : 0;
                if (!i || i < 0) i = 0;
                this.maxTime = Math.max(this.maxTime, h + i)
            }
            if (this.loopEndIdx == -1) {
                this.loopEndIdx = this.steps.length;
                this.loopEndTime = this.maxTime
            }
            if (this.loopEndTime - this.loopStartTime == 0 && this.loopEndIdx >= this.steps.length - 1) {
                this.loopEndTime =
                    this.loopEndTime + 0.1;
                this.maxTime = Math.max(this.maxTime, this.loopEndTime)
            }
        },
        clearCached: function() {
            for (var a = 0; a < this.steps.length; ++a) this.steps[a].clearCached && this.steps[a].clearCached()
        },
        update: function(a) {
            a.timer = a.timer + ig.system.tick;
            var b = a.duration == 0;
            if (a.duration > 0) {
                a.duration = a.duration - ig.system.tick;
                if (a.duration <= ig.COLLISION.EPS) a.duration = 0
            }
            a.updateRunners();
            var c = this.steps,
                d = ig.FX_RUNNER_CANCEL.NONE;
            if (a.timelineIndex < this.loopEndIdx && !a.duration) {
                a.timer = this.loopEndTime;
                if (b ||
                    a.looped) a.timelineIndex = this.loopEndIdx
            }
            if (!a.duration) {
                if (a.state == ig.EFFECT_STATE.RUNNING && a.timer >= this.loopEndTime) {
                    d = ig.FX_RUNNER_CANCEL.ALL;
                    a.state = ig.EFFECT_STATE.POST_LOOP;
                    if (a.callback) a.callback.onEffectEvent(a)
                }
                if (a.state == ig.EFFECT_STATE.POST_LOOP && a.timer >= this.maxTime) {
                    d = d || ig.FX_RUNNER_CANCEL.ONLY_PERMA;
                    a.state = ig.EFFECT_STATE.ENDED;
                    if (a.callback) a.callback.onEffectEvent(a)
                }
            }
            if (a.timelineIndex >= this.loopEndIdx && d) {
                a.cancelRunners(d == ig.FX_RUNNER_CANCEL.ONLY_PERMA);
                d = null
            }
            for (var i; a.timelineIndex <
                c.length && (i = c[a.timelineIndex]).time <= a.timer;) {
                if (b = i.start(a)) {
                    b = b.particles ? new ig.EffectParticleRunner(i, b) : new ig.EffectTimeRunner(i, b);
                    b.update(a) || a.runners.push(b)
                }
                a.timelineIndex++;
                if (a.timelineIndex == this.loopEndIdx) {
                    if (d) {
                        a.cancelRunners(d == ig.FX_RUNNER_CANCEL.ONLY_PERMA);
                        d = 0
                    }
                    b = this.loopEndTime - this.loopStartTime;
                    if (b <= 0 || !a.duration) break;
                    a.looped = true;
                    a.timer = a.timer - b;
                    a.timelineIndex = this.loopStartIdx
                }
            }
        },
        isEnding: function(a) {
            return a.timer >= this.loopEndTime
        },
        isDone: function(a) {
            return a.timer >=
                this.maxTime
        },
        getRemainingTime: function(a) {
            return a.duration >= 0 ? a.duration + (this.maxTime - this.loopEndTime) : this.maxTime
        }
    });
    ig.EffectStepBase = ig.Class.extend({
        time: 0,
        start: function() {},
        getDuration: function() {
            return 0
        }
    });
    ig.EffectHandle = ig.Class.extend({
        effectSheet: null,
        name: null,
        externalSheet: false,
        init: function(a) {
            if (a.sheet instanceof ig.EffectSheet) {
                this.effectSheet = a.sheet;
                this.externalSheet = true
            } else this.effectSheet = new ig.EffectSheet(a.sheet);
            this.name = a.name
        },
        clearCached: function() {
            !this.externalSheet &&
                this.effectSheet && this.effectSheet.decreaseRef()
        },
        spawnOnTarget: function(a, b) {
            return this.effectSheet.spawnOnTarget(this.name, a, b)
        },
        spawnFixed: function(a, b, c, d, i) {
            return this.effectSheet.spawnFixed(this.name, a, b, c, d, i)
        }
    });
    ig.EffectTimeRunner = ig.Class.extend({
        step: null,
        data: null,
        duration: 0,
        _timer: 0,
        init: function(a, b) {
            this.step = a;
            this.data = b;
            this.duration = b.duration
        },
        update: function(a) {
            this._timer = this._timer + ig.system.tick;
            this.step.update(a, this._timer, this.duration, this.data);
            var b = this.duration >=
                0 && this._timer > this.duration;
            b && this.step.finish && this.step.finish(a, this.data);
            return b
        },
        cancel: function(a, b) {
            if (b && this.duration >= 0) return false;
            var c = 0;
            this.duration < 0 && (c = this.step.cancel && this.step.cancel(a, this._timer, this.data));
            if (c > 0) this.duration = c;
            else {
                this.step.finish && this.step.finish(a, this.data);
                return true
            }
            return false
        }
    });
    ig.EffectParticleRunner = ig.Class.extend({
        step: null,
        data: null,
        totalParticles: 0,
        currentParticle: 0,
        duration: 0,
        _timer: 0,
        init: function(a, b) {
            this.step = a;
            this.data = b;
            this.totalParticles =
                b.particles;
            this.keySpline = b.keySpline;
            this.duration = b.duration
        },
        update: function(a) {
            var b = this.currentParticle;
            this._timer = this._timer + ig.system.tick;
            var c = Math.min(1, this._timer / this.duration);
            this.keySpline && (c = this.keySpline.get(c));
            c = Math.ceil(c * this.totalParticles);
            this.currentParticle = Math.min(c, this.totalParticles);
            this.step.update(a, b, this.currentParticle, this.data);
            return this.currentParticle == this.totalParticles
        },
        cancel: function(a) {
            this.step.finish && this.step.finish(a, this.data);
            return true
        }
    });
    ig.EFFECT_ENTRY = {}
});
ig.baked = !0;
