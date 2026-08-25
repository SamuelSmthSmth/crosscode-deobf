ig.module("impact.feature.effect.fx.fx-wipe").requires("impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec3.create();
    ig.EFFECT_ENTRY.MOVE_OFFSET = ig.EffectStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                start: {
                    _type: "Offset",
                    _info: "Offset at start"
                },
                end: {
                    _type: "Offset",
                    _info: "Offset at end"
                },
                relative: {
                    _type: "Boolean",
                    _info: "If true, multiply each offset with size of entity"
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of wipe."
                },
                keySpline: {
                    _type: "String",
                    _info: "Keyspline of movement",
                    _select: KEY_SPLINES
                }
            }
        }),
        init: function(a, b) {
            this.startValue = b.start;
            this.endValue = b.end;
            this.relative = b.relative || false;
            this.duration = b.duration || 0;
            this.keySpline = KEY_SPLINES[b.keySpline] || KEY_SPLINES.EASE_IN_OUT
        },
        getDuration: function() {
            return this.duration
        },
        start: function(a) {
            if (a.target) {
                a = {
                    duration: 0
                };
                a.duration = this.duration;
                return a
            }
        },
        update: function(a, d, f) {
            if (a.target) {
                d = this.keySpline.get(Math.min(1, d / f));
                d = Vec3.lerp(this.startValue, this.endValue, d, b);
                this.relative && Vec3.mul(d, a.target.coll.size);
                this.setEntityOffset(a.target,
                    d, a.spriteFilter)
            }
        },
        finish: function() {},
        setEntityOffset: function(a, b, d) {
            for (var g = a.sprites, h = g.length; h--;) {
                var i = g[h];
                d !== null && d.indexOf(h) == -1 || Vec3.assign(i.tmpOffset, b)
            }
            a = a.coll.subColls;
            if (a.length > 0)
                for (h = a.length; h--;) this.setEntityOffset(a[h].entity, b, d)
        }
    });
    ig.EFFECT_ENTRY.WIPE = ig.EffectStepBase.extend({
        dir: 0,
        startValue: 0,
        endValue: 0,
        duration: 0,
        _wm: new ig.Config({
            attributes: {
                dir: {
                    _type: "String",
                    _info: "Wipe direction",
                    _select: ig.WIPE_DIRECTION
                },
                startValue: {
                    _type: "Number",
                    _info: "Start wipe position (0-1). 1=all wiped away."
                },
                endValue: {
                    _type: "Number",
                    _info: "End wipe position (0-1). 1=all wiped away."
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of wipe."
                },
                setOnlyOneSide: {
                    _type: "Boolean",
                    _info: "If true, do not set clipping for any other side. This allows running wipes in parallel."
                }
            }
        }),
        init: function(a, b) {
            this.dir = ig.WIPE_DIRECTION[b.dir] || ig.WIPE_DIRECTION.NORTH;
            this.startValue = b.startValue || 0;
            this.endValue = b.endValue || 0;
            this.duration = b.duration || 0;
            this.setOnlyOneSide = b.setOnlyOneSide || 0
        },
        getDuration: function() {
            return this.duration
        },
        start: function(a) {
            if (a.target) {
                var b = {
                    duration: 0,
                    left: -1E3,
                    right: -1E3,
                    top: -1E3,
                    bottom: -1E3
                };
                ig.EntityTools.getSpriteBounds(b, a.target);
                b.duration = this.duration;
                return b
            }
        },
        update: function(a, b, d, g) {
            if (a.target) {
                var h = a.target.coll,
                    i = h.pos.x - g.left,
                    j = h.pos.x + g.right,
                    k = h.pos.y - h.pos.z - g.top,
                    g = h.pos.y - h.pos.z + g.bottom,
                    b = Math.min(1, b / d),
                    b = this.startValue + b * (this.endValue - this.startValue);
                switch (this.dir) {
                    case ig.WIPE_DIRECTION.NORTH:
                        k = k + b * (g - k);
                        break;
                    case ig.WIPE_DIRECTION.SOUTH:
                        g = g - b * (g - k)
                }
                this.setEntityClipping(a.target,
                    i, j, k, g, a.spriteFilter, this.setOnlyOneSide ? this.dir : null)
            }
        },
        finish: function(a) {
            this.endValue == 0 && ig.EntityTools.clearEntitySpriteCut(a.target, this.setOnlyOneSide ? this.dir : null)
        },
        setEntityClipping: function(a, b, d, g, h, i, j) {
            for (var k = a.sprites, l = k.length; l--;) {
                var o = k[l];
                if (!(i !== null && i.indexOf(l) == -1)) {
                    var m = Math.round(Math.max(0, g - (o.pos.y - o.pos.z - o.size.z))),
                        n = Math.round(Math.max(0, o.pos.y - o.pos.z + o.size.y - h));
                    if (j) {
                        if (j != ig.WIPE_DIRECTION.NORTH) m = o.gfxCut.top;
                        if (j != ig.WIPE_DIRECTION.SOUTH) n = o.gfxCut.bottom
                    }
                    o.setGfxCut(m,
                        n)
                }
            }
            a = a.coll.subColls;
            if (a.length > 0)
                for (l = a.length; l--;) this.setEntityClipping(a[l].entity, b, d, g, h, i, j)
        }
    });
    var a = {},
        d = {},
        b = Vec3.create();
    ig.EFFECT_ENTRY.WIPE_PARTICLES = ig.EffectStepBase.extend({
        particleData: null,
        dir: 0,
        startValue: 0,
        endValue: 0,
        duration: 0,
        numParticles: 0,
        moveOffset: Vec2.create(),
        keySpline: null,
        inverse: false,
        _wm: new ig.EffectConfig({
            particleType: "OffsetParticle",
            attributes: {
                dir: {
                    _type: "String",
                    _info: "Wipe direction",
                    _select: ig.WIPE_DIRECTION
                },
                startValue: {
                    _type: "Number",
                    _info: "Start wipe position (0-1). 1=all wiped away."
                },
                endValue: {
                    _type: "Number",
                    _info: "End wipe position (0-1). 1=all wiped away."
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of wipe."
                },
                numParticles: {
                    _type: "Integer",
                    _info: "Number of particles to spawned per second and 32 pixel target width"
                },
                moveOffset: {
                    _type: "Vec2",
                    _info: "Move offset of individual particles",
                    _optional: true
                },
                inverse: {
                    _type: "Boolean",
                    _info: "True if particle should move in reverse",
                    _optional: true
                },
                xScale: {
                    _type: "Number",
                    _info: "How much of the x dimension should be covered. 1=full",
                    _optional: true
                },
                keySpline: {
                    _type: "String",
                    _info: "KeySpline for moveOffset movement.",
                    _select: KEY_SPLINES,
                    _optional: true
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to position",
                    _optional: true
                }
            }
        }),
        init: function(a, b) {
            this.particleData = ig.EffectConfig.loadParticleData(a.animSheet, b, a && a.cacheKey);
            this.dir = ig.WIPE_DIRECTION[b.dir] || ig.WIPE_DIRECTION.NORTH;
            this.startValue = b.startValue || 0;
            this.endValue = b.endValue || 0;
            this.duration = b.duration || 0;
            this.xScale = b.xScale;
            if (this.xScale === void 0) this.xScale = 0.8;
            this.offset = b.offset;
            this.numParticles = b.numParticles || 2;
            b.moveOffset && Vec2.assign(this.moveOffset, b.moveOffset);
            this.keySpline = KEY_SPLINES[b.keySpline] || null;
            this.inverse = b.inverse || false
        },
        start: function(b) {
            if (b.target) {
                ig.EntityTools.getSpriteBounds(a, b.target);
                b = a.left + a.right;
                return {
                    duration: this.duration,
                    particles: this.numParticles * b / 32 * this.duration,
                    offX: -a.left,
                    offY: a.bottom,
                    width: b,
                    height: a.top + a.bottom
                }
            }
        },
        getDuration: function() {
            return this.duration + ig.EffectConfig.getParticleBlockTime(this.particleData)
        },
        update: function(a,
            e, f, g) {
            d.data = this.particleData;
            d.keySpline = this.keySpline;
            d.inverse = this.inverse;
            d.alongZ = true;
            for (d.moveOffset = this.moveOffset; e < f; ++e) {
                var h = g.particles > 1 ? e / (g.particles - 1) : 0,
                    h = this.startValue + h * (this.endValue - this.startValue);
                this.dir == ig.WIPE_DIRECTION.NORTH && (h = 1 - h);
                var i = Vec3.assignC(b, 0, 0, 0);
                if (this.inverse) {
                    var j = ig.EffectConfig.getParticleDuration(this.particleData);
                    i.z = i.z + g.height * j / this.duration
                }
                i.x = i.x + (g.offX + g.width * (0.5 - this.xScale / 2) + Math.random() * g.width * this.xScale);
                i.y = i.y + g.offY;
                i.z = i.z + h * g.height;
                this.offset && Vec3.add(i, this.offset);
                a.spawnParticle(ig.ENTITY.OffsetParticle, i, d, true)
            }
        }
    })
});
ig.baked = !0;
