ig.module("impact.base.renderer").requires("impact.base.image", "impact.base.sprite").defines(function() {
    function b(a, b) {
        for (var c = 0; c < a.levels[b].maps.length; c++) {
            var d = a.levels[b].maps[c];
            if (d.enabled) {
                d.drawAnimated && d.drawAnimated();
                d.draw()
            }
        }
    }

    function a(a, b, c) {
        if (ig.perf.spriteShadow && a.drawShadow) {
            var d = ig.game,
                a = a.cubeSprite;
            if (d.shadowImage && a.shadow.diameter && a.shadow.z >= b && a.shadow.z < c) {
                if (ig.system.context.globalCompositeOperation != "source-over") ig.system.context.globalCompositeOperation =
                    "source-over";
                b = a.pos.z + a.tmpOffset.z - a.shadow.z;
                a.shadow.type == ig.COLL_SHADOW_TYPE.STATIC_SIZE && (b = 0);
                var e = a.shadow.diameter - b / 8,
                    c = Math.round(a.shadow.x) - ig.game.screen.x,
                    f = Math.round(a.shadow.y - a.shadow.z) - ig.game.screen.y;
                if (e > 0 && c - e / 2 <= ig.system.width || f - e / 2 <= ig.system.height || c + e / 2 >= 0 || f + e / 2 >= 0) {
                    b = ig.system.context.globalAlpha;
                    ig.system.context.globalAlpha = ig.system.context.globalAlpha * 0.5 * a.alpha;
                    if (e <= 32) {
                        a = (8 - Math.floor(e / 4)).limit(0, 7);
                        d.shadowImage.drawTile(c - 16, f - 16, a, 32, 32, 0, 0)
                    } else {
                        ig.system.context.save();
                        ig.system.context.translate(ig.system.getDrawPos(c), ig.system.getDrawPos(f));
                        c = Math.floor(e / 4) * 4 / 224;
                        ig.system.context.scale(c, c * (a.shadow.scaleY || 1));
                        d.shadowImage.draw(-112, -112, 0, 32, 224, 224);
                        ig.system.context.restore()
                    }
                    ig.system.context.globalAlpha = b
                }
            }
        }
    }

    function d(a, b, c, d, e) {
        b ? a.renderData[c] ? a.renderData[c].spriteIdx = e : a.renderData[c] = new ig.Renderer2d.SpriteDrawSlot(a, d, e) : a.renderData[c] && (a.renderData[c] = null)
    }
    var c = {};
    ig.Renderer2d = ig.Class.extend({
        spriteSlots: [],
        guiSpriteSlots: [],
        init: function() {},
        prepareDraw: function(a, b) {
            ig.ImageModFragment.clear();
            var c = ig.system.getZoomMinOffset(e);
            f = c.x + ig.game.screen.x;
            g = c.y + ig.game.screen.y;
            h = f + ig.system.width / ig.system.zoom;
            i = g + ig.system.height / ig.system.zoom;
            if (b || !ig.game.mapRenderingBlocked) {
                c = 0;
                this.spriteSlots.length = 0;
                for (var o = this.guiSpriteSlots.length = 0; o < a.length; o++) {
                    var m = a[o];
                    if (m && (m.coll.alwaysRender || !(m.coll.pos.x + m.coll.size.x + 48 < f || m.coll.pos.x - 48 > h || m.coll.pos.y - m.coll.baseZPos + m.coll.size.y + 32 < g || m.coll.pos.y - m.coll.pos.z - m.coll.size.z -
                            32 > i))) {
                        m.updateSprites();
                        for (var n = 0; n < m.sprites.length; n++) {
                            c++;
                            var p = m.sprites[n],
                                r = c,
                                t = p.gui ? this.guiSpriteSlots : this.spriteSlots;
                            d(p, p.mergeTop || p.size.z > 0 || p.wallY > 0, "wall", false, r);
                            d(p, !p.mergeTop && p.size.y > 0 && p.wallY < p.size.y, "ground", true, r);
                            var r = p.renderData.wall,
                                q = p.renderData.ground,
                                s = r && !q;
                            r && r.update(s);
                            q && q.update(!s);
                            if (!ig.perf.spriteFilter || (!p.image && !p.shadow.diameter ? 0 : p.alwaysRender || (p.scale.x > 1 || p.scale.y > 1 || p.rotate) || !(p.pos.x + p.tmpOffset.x + p.gfxOffset.x + p.size.x < f || p.pos.x +
                                    p.tmpOffset.x + p.gfxOffset.x > h || p.pos.y + p.tmpOffset.y + p.gfxOffset.y - (p.pos.z + p.tmpOffset.z) - p.size.z > i || p.pos.y + p.tmpOffset.y + p.gfxOffset.y + p.size.y - (p.shadow.diameter ? p.shadow.z : p.pos.z + p.tmpOffset.z) < g))) {
                                r && t.push(r);
                                q && t.push(q);
                                p.renderData.fragment = p.overlay.color ? new ig.ImageModFragment(p.image, p.src.x, p.src.y, p.size.x, p.size.y + p.size.z, p.overlay.color) : null;
                                p.renderData.lighterFragment = p.lighterOverlay.color ? new ig.ImageModFragment(p.image, p.src.x, p.src.y, p.size.x, p.size.y + p.size.z, p.lighterOverlay.color) :
                                    null
                            }
                        }
                    }
                }
            }
            ig.ImageModFragment.prepare();
            if (b || !ig.game.mapRenderingBlocked) {
                this.spriteSlots.sort(function(a, b) {
                    return a.yIndex - b.yIndex || a.spriteIdx - b.spriteIdx
                });
                this.guiSpriteSlots.sort(function(a, b) {
                    return a.yIndex - b.yIndex
                })
            }
            ig.imageAtlas.fillFragments()
        },
        drawLayers: function(a, c) {
            var d = ig.game;
            if (!c) {
                ig.system.context.fillStyle = "black";
                d.clearColor && ig.system.clear(d.clearColor)
            }
            if ((a || !ig.game.mapRenderingBlocked) && !ig.loading && d.maxLevel > 0) {
                b(d, "first");
                for (var e = -1; e < d.maxLevel; ++e) {
                    e >= 0 &&
                        b(d, e);
                    this.drawEntities(e)
                }
                b(d, "last")
            }
        },
        drawLight: function() {
            var a = ig.game;
            !ig.loading && a.maxLevel > 0 && b(a, "light")
        },
        drawPostLayerSprites: function() {
            var a = ig.game;
            if (!(ig.loading || a.maxLevel <= 0)) {
                b(a, "postlight");
                for (var c = 0; c < this.guiSpriteSlots.length; ++c) this.guiSpriteSlots[c].draw();
                if (this.guiSpriteSlots.length > 0) ig.system.context.globalCompositeOperation = "source-over";
                if (window.IG_GAME_DEBUG)
                    for (var d in a.levels)
                        for (var e in a.levels[d]) {
                            c = a.levels[d][e];
                            c instanceof ig.Map && (c.debugDraw &&
                                c.draw) && c.draw(a.levels[d].height)
                        }
            }
        },
        drawEntities: function(b) {
            if (ig.perf.drawSprites) {
                for (var c = ig.game, d = b == -1 ? -9999999 : c.levels[b].height, b = b + 1 < c.maxLevel ? c.levels[b + 1].height : 99999999, c = 0; c < this.spriteSlots.length; ++c) {
                    var e = this.spriteSlots[c];
                    if (e.ground && e.zMin == d) {
                        a(e, d, b);
                        e.draw(d, b);
                        e._isDrawn = true
                    } else e._isDrawn = false
                }
                for (var f = [], c = 0; c < this.spriteSlots.length + 1; ++c)
                    if (c == this.spriteSlots.length)
                        for (; f.length > 0;) {
                            var g = f.length - 1,
                                h = f[g];
                            h.spriteSlot.draw(d, b);
                            f.splice(g, 1);
                            if (h.idx !=
                                -1) {
                                c = h.idx - 1;
                                break
                            }
                        } else {
                            var e = this.spriteSlots[c],
                                i = e.cubeSprite;
                            if (!e._isDrawn) {
                                var t = e.zMin >= b || e.zMax <= d;
                                if (!t || i.shadow.diameter && !(i.shadow.z >= b || i.shadow.z < d)) {
                                    for (var q = false, g = f.length; g--;) {
                                        var h = f[g],
                                            s = i.pos.x + i.tmpOffset.x + i.size.x <= h.xMin || i.pos.x + i.tmpOffset.x >= h.xMax;
                                        if (e.yIndex > h.yMax) {
                                            h.spriteSlot.draw(d, b);
                                            f.splice(g, 1);
                                            if (h.idx != -1) {
                                                c = h.idx - 1;
                                                q = true;
                                                break
                                            }
                                        } else if (!s && i.pos.z + i.tmpOffset.z + i.size.z * i.aboveZ >= h.zMax) {
                                            q = true;
                                            h.idx = h.idx == -1 ? c : Math.min(c, h.idx)
                                        } else if (!s && e.ground) h.yMax =
                                            Math.max(h.yMax, i.pos.y + i.tmpOffset.y + i.size.y - ig.COLLISION.EPS)
                                    }
                                    if (!q) {
                                        e._isDrawn = true;
                                        if (e.ground) {
                                            a(e, d, b);
                                            t || (!ig.perf.spriteOverlapSolver || i.noOverlapSolving || i.size.y < i.size.z ? e.draw(d, b) : f.push({
                                                xMin: i.pos.x + i.tmpOffset.x + ig.COLLISION.EPS,
                                                xMax: i.pos.x + i.tmpOffset.x + i.size.x - ig.COLLISION.EPS,
                                                yMax: i.pos.y + i.tmpOffset.y + i.size.y - i.wallY - ig.COLLISION.EPS,
                                                zMax: i.pos.z + i.tmpOffset.z + i.size.z - ig.COLLISION.EPS,
                                                idx: -1,
                                                spriteSlot: e
                                            }))
                                        } else {
                                            a(e, d, b);
                                            e.zMin >= b || e.zMax <= d || e.draw(d, b)
                                        }
                                    }
                                }
                            }
                        }
                ig.system.context.globalCompositeOperation =
                    "source-over"
            }
        },
        drawAnimation: function(a, b, d, e, f, g, h, i) {
            var t = a.sequence.length,
                e = Math.floor(e / a.frameTime),
                q = a.stop ? Math.min(e, t - 1) : e % t,
                t = a.sheet,
                e = a.sheet.image,
                s = t.getTileSrc(c, a.sequence[q]),
                v = ig.system.context;
            a.framesAlpha && (f = f * a.framesAlpha[q]);
            h == void 0 && (h = 1);
            i == void 0 && (i = 1);
            if (q = g || h != 1 || i != 1) {
                ig.system.context.save();
                ig.system.context.translate(ig.system.getDrawPos(b + a.pivot.x), ig.system.getDrawPos(d + a.pivot.y));
                ig.system.context.rotate(g);
                (h != 1 || i != 1) && ig.system.context.scale(h, i);
                b = -a.pivot.x;
                d = -a.pivot.y
            }
            g = a.renderMode || "source-over";
            if (g != v.globalCompositeOperation) v.globalCompositeOperation = g;
            var y;
            if (f != 1) {
                y = v.globalAlpha;
                v.globalAlpha = v.globalAlpha * f
            }
            e.draw(b, d, s.x, s.y, t.width, t.height, a.flip.x, a.flip.y);
            if (f != 1) v.globalAlpha = y;
            q && ig.system.context.restore()
        },
        mapCleared: function() {
            this.spriteSlots = [];
            this.guiSpriteSlots = []
        }
    });
    var e = Vec2.create(),
        f = 0,
        g = 0,
        h = 0,
        i = 0;
    ig.Renderer2d.SpriteDrawSlot = ig.Class.extend({
        cubeSprite: null,
        ground: false,
        yIndex: 0,
        zMin: 0,
        zMax: 0,
        spriteIdx: 0,
        drawShadow: false,
        init: function(a, b, c) {
            this.cubeSprite = a;
            this.ground = b;
            this.spriteIdx = c
        },
        update: function(a) {
            this.drawShadow = a;
            a = this.cubeSprite;
            if (a.gui) this.yIndex = a.pos.z + a.tmpOffset.z;
            else if (this.ground) {
                this.yIndex = a.pos.y + a.tmpOffset.y + ig.COLLISION.EPS;
                this.zMax = this.zMin = a.pos.z + a.tmpOffset.z + a.size.z
            } else {
                this.yIndex = a.pos.y + a.tmpOffset.y + a.size.y - a.wallY;
                this.zMax = a.pos.z + a.tmpOffset.z + (a.size.z || 1);
                this.zMin = a.pos.z + a.tmpOffset.z
            }
        },
        draw: function(a, b) {
            var c = this.cubeSprite;
            if (c.renderMode) ig.system.context.globalCompositeOperation =
                c.renderMode;
            else if (ig.system.context.globalCompositeOperation != "source-over") ig.system.context.globalCompositeOperation = "source-over";
            if (c.image) {
                var d = c.pos.x + c.tmpOffset.x + c.gfxOffset.x,
                    e = c.pos.y + c.tmpOffset.y - (c.pos.z + c.tmpOffset.z) - c.size.z + c.gfxOffset.y,
                    f = 0,
                    g = 0,
                    h = 0,
                    i = c.size.x,
                    q = c.size.y + c.size.z,
                    g = 0,
                    s = c.src.x,
                    v = c.src.y;
                c.wallY < c.size.y && !this.ground ? f = f + (c.size.y - c.wallY) : c.wallY < c.size.y && this.ground && (g = q - (c.size.y - c.wallY));
                if (!this.ground && a !== void 0) {
                    if (c.pos.z + c.tmpOffset.z + c.size.z >
                        b) {
                        h = Math.round(c.pos.z + c.tmpOffset.z + c.size.z - b);
                        c.rotate && (h = h - 1);
                        f = f + h
                    } else c.mergeTop && (f = 0);
                    c.pos.z + c.tmpOffset.z < a && (g = g + (q - Math.round(q - (a - (c.pos.z + c.tmpOffset.z) + c.wallY))))
                }
                c.gfxCut.top && (f = Math.max(c.gfxCut.top, f));
                c.gfxCut.bottom && (g = Math.max(g, c.gfxCut.bottom));
                q = q - (g + f);
                if (c.flip.x) {
                    g = c.gfxCut.left;
                    h = c.gfxCut.right
                } else g = h = c.gfxCut.left;
                i = i - (c.gfxCut.left + c.gfxCut.right);
                if (!(i <= 0 || q <= 0 || c.scale.x == 0 || c.scale.y == 0 || c.alpha <= 0)) {
                    var d = Math.round(d) - ig.game.screen.x,
                        e = Math.round(e) - ig.game.screen.y,
                        y = ig.system.context.globalAlpha,
                        u = y * c.alpha,
                        z = false;
                    if (c.alpha != 1) {
                        z = true;
                        ig.system.context.globalAlpha = u
                    }
                    var D = c.rotate != 0 || c.scale.x != 1 || c.scale.y != 1;
                    if (D) {
                        ig.system.context.save();
                        ig.system.context.translate(ig.system.getDrawPos(d + c.pivot.x), ig.system.getDrawPos(e + c.pivot.y));
                        ig.system.context.rotate(c.rotate);
                        ig.system.context.scale(c.scale.x, c.scale.y);
                        d = -c.pivot.x;
                        e = -c.pivot.y
                    }
                    if (!(c.renderData.fragment && c.overlay.alpha == 1))
                        if (c.image instanceof ig.Image || c.image instanceof ig.ImageCanvasWrapper) c.image.draw(d +
                            g, e + f, s + h, v + f, i, q, c.flip.x, c.flip.y);
                        else if (c.image instanceof ig.ImagePattern) c.image.draw(d + g, e + f, s + h, v + f, i, q);
                    else if (c.image instanceof ig.SimpleColor || c.image instanceof ig.SimpleCircle || c.image instanceof ig.ComplexLineCircleBox || c.image instanceof ig.TransitionColor || c.image instanceof ig.DoubleColor) {
                        s = c.image;
                        s instanceof ig.DoubleColor && (s = this.ground ? s.color1 : s.color2);
                        s.draw(d + g, e + f, i, q)
                    }
                    if (c.renderData.fragment) {
                        if (c.overlay.alpha != 1) {
                            ig.system.context.globalAlpha = u * c.overlay.alpha;
                            z = true
                        }
                        c.renderData.fragment.draw(d + g, e + f, h, f, i, q, c.flip.x, c.flip.y)
                    }
                    if (c.renderData.lighterFragment) {
                        s = ig.system.context.globalCompositeOperation;
                        ig.system.context.globalCompositeOperation = "lighter";
                        if (c.lighterOverlay.alpha != 1) {
                            ig.system.context.globalAlpha = u * c.lighterOverlay.alpha;
                            z = true
                        }
                        c.renderData.lighterFragment.draw(d + g, e + f, h, f, i, q, c.flip.x, c.flip.y);
                        ig.system.context.globalCompositeOperation = s
                    }
                    D && ig.system.context.restore();
                    if (z) ig.system.context.globalAlpha = y
                }
            }
        }
    })
});
ig.baked = !0;
