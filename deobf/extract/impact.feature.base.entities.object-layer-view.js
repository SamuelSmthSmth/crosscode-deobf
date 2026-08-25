ig.module("impact.feature.base.entities.object-layer-view").requires("impact.base.actor-entity").defines(function() {
    var b = Vec2.create(),
        a = Vec2.create();
    ig.ObjectLayerTools = {
        getSpriteCount: function(a, b, e, f) {
            for (var a = a.coll, e = e || a.pos, f = f || a.size, g = a = 0; g < b.length; ++g) {
                var h = b[g],
                    i = h.chunkSizeX / ig.system.scale,
                    h = h.chunkSizeY / ig.system.scale,
                    j = 1;
                Math.floor(e.x / i) != Math.floor((e.x + f.x) / i) && (j = j * 2);
                Math.floor((e.y - e.z - f.z) / h) != Math.floor((e.y - e.z + f.y) / h) && (j = j * 2);
                a = a + j
            }
            return a
        },
        updateSprites: function(d,
            c, e, f, g, h) {
            if (!c.length) return true;
            for (var i = c.length; i--;)
                if (!c[i].preRenderedChunks) return false;
            var i = d.coll,
                g = g || i.pos,
                h = h || i.size,
                j = Vec2.assignC(b, g.x, g.y - g.z - h.z),
                k = Vec2.assignC(a, g.x + h.x, g.y - g.z + h.y);
            if (f) {
                Vec2.subC(j, f.x, f.y - f.z || 0);
                Vec2.subC(k, f.x, f.y - f.z || 0);
                j.x = Math.round(j.x);
                j.y = Math.round(j.y);
                k.x = Math.round(k.x);
                k.y = Math.round(k.y)
            }
            for (i = f = 0; i < c.length; ++i) {
                for (var l = c[i], o = l.chunkSizeX / ig.system.scale, m = l.chunkSizeY / ig.system.scale, n = Math.floor(j.x / o), p = Math.floor(k.x / o), r = Math.floor(j.y /
                        m), t = Math.floor(k.y / m), q = j.x % o, s = j.y % m; q < 0;) q = q + o;
                for (; s < 0;) s = s + m;
                for (var o = o - q, m = m - s, v = Math.round(h.y * e), v = h.y - v, y = r; y <= t; ++y)
                    for (var u = n; u <= p; ++u) {
                        var z = g.x,
                            D = g.y,
                            C = g.z,
                            A = h.x,
                            B = h.y,
                            w = h.z,
                            x = l.preRenderedChunks[y] && l.preRenderedChunks[y][u],
                            E = Math.round(e * B);
                        if (x) {
                            if (u < p) A = o;
                            else if (u > n) {
                                A = A - o;
                                z = z + o
                            }
                            if (y < t)
                                if (m >= v) {
                                    E = v + w - m;
                                    if (E >= 0) {
                                        w = w - E;
                                        C = C + E;
                                        B = v;
                                        E = 0
                                    } else {
                                        B = v - E;
                                        E = -E
                                    }
                                } else {
                                    C = C + w;
                                    B = m;
                                    E = w = 0
                                }
                            else if (y > r)
                                if (m >= v) {
                                    E = v + w - m;
                                    if (E >= 0) {
                                        D = D + v;
                                        w = w - (m - v);
                                        E = B = B - v
                                    } else {
                                        w = 0;
                                        D = D + (v - E);
                                        B = B - (v - E);
                                        E = 0
                                    }
                                } else {
                                    D = D + m;
                                    B =
                                        B - m
                                } var G = u > n ? 0 : q,
                                J = y > r ? 0 : s;
                            if (d.sprites[f]) {
                                d.sprites[f].setPos(z, D, C);
                                d.sprites[f].setSize(A, B, w, E);
                                d.sprites[f].aboveZ = 1;
                                d.sprites[f].setImageSrc(new ig.ImageCanvasWrapper(x), G, J)
                            }
                            f++
                        }
                    }
            }
            return true
        }
    };
    ig.EntityHideManager = ig.Class.extend({
        hideCondition: null,
        hideTimer: 0,
        hidden: false,
        efficientMode: false,
        init: function(a) {
            this.hideCondition = new ig.VarCondition(a)
        },
        update: function(a) {
            this.efficientMode || this.varsChanged(a);
            this.hideTimer = Math.max(0, this.hideTimer - ig.system.actualTick);
            var b = this.hideTimer /
                0.2,
                b = this.hidden ? b : 1 - b,
                b = 0.1 * (1 - b) + 1 * b;
            if (a.animState) a.animState.alpha = b;
            else
                for (var e = a.sprites.length; e--;) a.sprites[e].setAlpha(b);
            this.efficientMode && !this.hideTimer && a.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
        },
        isBusy: function() {
            return this.hideTimer
        },
        varsChanged: function(a) {
            var b = this.hideCondition.evaluate();
            if (b != this.hidden) {
                this.hideTimer = 0.2 - this.hideTimer;
                this.hidden = b;
                this.efficientMode && a.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
            }
        }
    });
    ig.ENTITY.ObjectLayerView = ig.AnimatedEntity.extend({
        maps: null,
        spritesInitialized: false,
        hideManager: null,
        wallY: 0,
        fx: {
            show: null,
            hide: null,
            handle: null,
            isHiding: false
        },
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
                collType: {
                    _type: "String",
                    _info: "CollisionType",
                    _select: ig.COLLTYPE
                },
                zHeight: {
                    _type: "Number",
                    _info: "Z height of displayed object"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                },
                hideCondition: {
                    _type: "VarCondition",
                    _info: "Condition for entity to become transparent",
                    _popup: true
                },
                wallY: {
                    _type: "Number",
                    _info: "Wall Y Value"
                },
                terrain: {
                    _type: "String",
                    _info: "Terrain of prop",
                    _select: ig.TERRAIN,
                    _withNull: true
                },
                heightShape: {
                    _type: "String",
                    _info: "Height shape (for stairs or other slopes)",
                    _select: ig.COLL_HEIGHT_SHAPE
                },
                shape: {
                    _type: "String",
                    _info: "Height-Shape of Block Entity",
                    _select: ig.COLLSHAPE,
                    _optional: true
                },
                blockNavMap: {
                    _type: "Boolean",
                    __info: "If true, block path map and update when destroyed"
                },
                showEffect: {
                    _type: "Effect",
                    _info: "Effect to show when showing entity",
                    _optional: true
                },
                hideEffect: {
                    _type: "Effect",
                    _info: "Effect to show when hiding entity",
                    _optional: true
                },
                guiSprites: {
                    _type: "Boolean",
                    _info: "If true: display as gui sprites",
                    _optional: true
                }
            },
            drawBox: false,
            boxColor: "rgba(120,255,120, 0.5)",
            frontColor: "rgba(80,244,80, 0.5)",
            alwaysRecreate: true
        }),
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE[f.collType || "BLOCK"];
            this.coll.size.z = f.zHeight || 0;
            this.coll.heightShape =
                ig.COLL_HEIGHT_SHAPE[f.heightShape] || ig.COLL_HEIGHT_SHAPE.NONE;
            this.coll.shape = ig.COLLSHAPE[f.shape || "RECTANGLE"];
            this.maps = ig.game.getObjectMaps(f.layer);
            this.wallY = (f.wallY || 0).limit(0, 1);
            this.terrain = ig.TERRAIN[f.terrain] || null;
            this.fx.show = f.showEffect ? new ig.EffectHandle(f.showEffect) : null;
            this.fx.hide = f.hideEffect ? new ig.EffectHandle(f.hideEffect) : null;
            this.blockNavMap = f.blockNavMap;
            this.guiSprites = f.guiSprites || false;
            f.hideCondition ? this.hideManager = new ig.EntityHideManager(f.hideCondition) :
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
        },
        onKill: function(a) {
            this.parent(a);
            this.fx.show && this.fx.show.clearCached();
            this.fx.hide && this.fx.hide.clearCached()
        },
        show: function(a) {
            this.parent(a);
            this.fx.handle && this.fx.handle.stop();
            if (!a && this.fx.show) {
                this.animState.alpha = 0;
                this.fx.isHiding = false;
                this.fx.handle = this.fx.show.spawnOnTarget(this, {
                    callback: this
                })
            }
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this)
        },
        onHideRequest: function() {
            this.navBlocker && this.navBlocker.remove();
            this.navBlocker = null;
            if (this.fx.hide) {
                this.fx.isHiding = true;
                this.fx.handle = this.fx.hide.spawnOnTarget(this, {
                    callback: this
                })
            } else this.hide()
        },
        onEffectEvent: function() {
            if (this.fx.handle && this.fx.handle.isDone()) {
                this.fx.handle = null;
                this.fx.isHiding && this.hide()
            }
        },
        initSprites: function() {
            var a = ig.ObjectLayerTools.getSpriteCount(this, this.maps);
            this.setSpriteCount(a, this.guiSprites)
        },
        update: function() {
            this.hideManager && this.hideManager.update(this)
        },
        updateSprites: function() {
            if (!this.spritesInitialized &&
                ig.ObjectLayerTools.updateSprites(this, this.maps, this.wallY)) this.spritesInitialized = true;
            for (var a = this.sprites.length; a--;) this.sprites[a].setAlpha(this.animState.alpha);
            this.animState.updateSpriteColor(this)
        }
    });
    ig.ENTITY.ObjectLayerView.staticNavBlock = true
});
ig.baked = !0;
