ig.module("game.feature.puzzle.entities.boss-platform").requires("impact.base.entity", "impact.feature.base.entities.object-layer-view").defines(function() {
    var b = Vec3.create(),
        a = Vec2.create();
    sc.BossPlatforms = {
        list: [],
        registerPlatform: function(a) {
            this.list.push(a)
        },
        unregisterPlatform: function(a) {
            this.list.push(a)
        },
        startImpact: function(b, c, e, f, g, h, i) {
            for (var f = e / f, j = this.list.length; j--;) {
                var k = this.list[j],
                    l = k.getCenter(a);
                Vec2.sub(l, b);
                l = Vec2.length(l);
                if (l < e && l >= h) {
                    var o = 1 - 1 * (l / e);
                    k.nudge(c * o, (l -
                        h) / (e - h) * f, g * (1 - 0.35 * (l / e)), o, i)
                }
            }
        },
        releaseHeightFix: function() {
            for (var a = this.list.length; a--;) this.list[a].releaseHeightFix()
        }
    };
    ig.ENTITY.BossPlatform = ig.Entity.extend({
        _wm: new ig.Config({
            spawnable: true,
            scalableX: true,
            scalableY: true,
            scalableStep: 4,
            attributes: {
                layer: {
                    _type: "String",
                    _info: "Object Layer from which to display graphic.",
                    _select: {
                        object1: 1,
                        object2: 1,
                        object3: 1
                    }
                },
                zHeight: {
                    _type: "Number",
                    _info: "Z height of displayed object"
                },
                shape: {
                    _type: "String",
                    _info: "Height-Shape of Block Entity",
                    _select: ig.COLLSHAPE,
                    _optional: true
                },
                wallY: {
                    _type: "Number",
                    _info: "Wall Y Value"
                }
            },
            drawBox: false,
            boxColor: "rgba(120,255,120, 0.5)",
            frontColor: "rgba(80,244,80, 0.5)",
            alwaysRecreate: true
        }),
        terrain: null,
        maps: null,
        startPos: Vec3.create(),
        movements: [],
        fixedHeight: 0,
        fixedState: 0,
        color: null,
        colorAlpha: 0,
        respawnOkay: true,
        gfx: null,
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.size.z = f.zHeight || 0;
            this.terrain = f.terrain || 0;
            this.wallY = (f.wallY || 0).limit(0, 1);
            this.coll.shape = ig.COLLSHAPE[f.shape ||
                "RECTANGLE"];
            this.maps = ig.game.getObjectMaps(f.layer);
            Vec3.assign(this.startPos, this.coll.pos);
            this.timer = new ig.WeightTimer;
            this.setSpriteCount(0);
            this.totalSprites = ig.ObjectLayerTools.getSpriteCount(this, this.maps);
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
            sc.BossPlatforms.registerPlatform(this);
            this.gfx = new ig.Image("media/map/arid-heaven.png")
        },
        show: function(a) {
            this.parent(a)
        },
        onKill: function() {
            this.parent();
            sc.BossPlatforms.unregisterPlatform(this);
            this.gfx.decreaseRef()
        },
        update: function() {
            var a =
                0;
            this.colorAlpha = 0;
            this.color = null;
            for (var b = this.movements.length; b--;) {
                var e = this.movements[b];
                e.timer.tick();
                if (e.state == 2) {
                    var f = e.timer.get(),
                        g = e.height * Math.sin(f * Math.PI),
                        a = a + g,
                        g = e.intensity * Math.sin(f * Math.PI);
                    this.colorAlpha = this.colorAlpha + g;
                    this.color = e.color;
                    if (e.fixed && f >= 0.5 && this.fixedState == 2) this.fixedState = 3
                }
                if (e.timer.done())
                    if (e.state == 1) {
                        e.state = 2;
                        e.timer.set(e.duration, ig.TIMER_MODE.ONCE)
                    } else e.state == 2 && this.movements.splice(b, 1)
            }
            if (this.fixedState == 3) a = this.fixedHeight;
            a =
                this.startPos.z + Math.round(a);
            this.setPos(this.startPos.x, this.startPos.y, a, true);
            if (this.movements.length == 0) {
                this.color = null;
                if (this.fixedState == 4) this.fixedState = this.fixedHeight = 0;
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
            }
            this.parent()
        },
        nudge: function(a, b, e, f, g) {
            if (!(this.fixedState >= 2)) {
                a = {
                    state: 1,
                    height: a,
                    duration: e,
                    intensity: f,
                    color: g || "#444",
                    timer: new ig.WeightTimer
                };
                if (this.fixedState == 1) {
                    a.height = this.fixedHeight;
                    a.fixed = true;
                    this.fixedState = 2
                }
                a.timer.set(b, ig.TIMER_MODE.ONCE);
                this.movements.push(a);
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
            }
        },
        setFixedHeight: function(a) {
            this.fixedState = 1;
            this.fixedHeight = a
        },
        releaseHeightFix: function() {
            if (this.fixedState && this.fixedState < 4) {
                var a = {
                    state: 2,
                    height: this.fixedHeight,
                    duration: 0.4,
                    intensity: 1,
                    color: "#000",
                    timer: new ig.WeightTimer
                };
                a.timer.set(0.4, ig.TIMER_MODE.ONCE);
                a.timer.setRemainingTime(0.2);
                this.movements.push(a);
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
                this.fixedState = 4
            }
        },
        updateSprites: function() {
            if (!this.color &&
                this.fixedState < 2) this.setSpriteCount(0);
            else {
                this.setSpriteCount(this.totalSprites + (this.fixedState ? 1 : 0));
                var a = this.maps,
                    c = Vec3.sub(this.coll.pos, this.startPos, b);
                ig.ObjectLayerTools.updateSprites(this, a, this.wallY, c);
                if (this.fixedState) {
                    a = this.sprites[this.sprites.length - 1];
                    c = this.coll;
                    a.setPos(c.pos.x, c.pos.y, c.pos.z + c.size.z);
                    a.setSize(c.size.x, c.size.y, 0, 0);
                    a.aboveZ = 1;
                    a.setImageSrc(this.gfx, 96, 128);
                    a.setAlpha(Math.min(1, (this.coll.pos.z - this.startPos.z) / this.fixedHeight * 4))
                }
                if (this.color)
                    for (c =
                        this.sprites.length; c--;) {
                        a = this.sprites[c];
                        a.noOverlapSolving = true;
                        a.setLighterOverlayColor(this.color, this.colorAlpha)
                    }
            }
        }
    })
});
ig.baked = !0;
