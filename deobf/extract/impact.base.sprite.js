ig.module("impact.base.sprite").requires("impact.base.image").defines(function() {
    ig.CubeSprite = ig.Class.extend({
        pos: {
            x: 0,
            y: 0,
            z: 0
        },
        size: {
            x: 0,
            y: 0,
            z: 0
        },
        shadow: {
            x: 0,
            y: 0,
            z: 0,
            diameter: 0,
            scaleY: 1
        },
        gfxOffset: {
            x: 0,
            y: 0
        },
        gfxCut: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        },
        tmpOffset: {
            x: 0,
            y: 0,
            z: 0
        },
        wallY: 0,
        image: null,
        src: {
            x: 0,
            y: 0
        },
        alpha: 1,
        flip: {
            x: false,
            y: false
        },
        scale: {
            x: 1,
            y: 1
        },
        rotate: 0,
        pivot: {
            x: 0,
            y: 0
        },
        overlay: {
            color: null,
            alpha: 0
        },
        lighterOverlay: {
            color: null,
            alpha: 0
        },
        aboveZ: 0,
        mergeTop: false,
        renderData: {},
        gui: false,
        renderMode: null,
        alwaysRender: false,
        noOverlapSolving: false,
        init: function(b) {
            this.gui = b
        },
        clear: function(b) {
            this.gui = b;
            this.image = null;
            this.shadow.x = this.shadow.y = this.shadow.z = this.shadow.diameter = 0;
            this.shadow.type = ig.COLL_SHADOW_TYPE.DEFAULT;
            this.gfxOffset.x = this.gfxOffset.y = 0;
            this.wallY = this.tmpOffset.x = this.tmpOffset.y = this.tmpOffset.z = 0;
            this.src.x = this.src.y = 0;
            this.alpha = 1;
            this.flip.x = this.flip.y = false;
            this.scale.x = this.scale.y = 1;
            this.rotate = 0;
            this.pivot.x = this.pivot.y = 0;
            this.overlay.color = null;
            this.overlay.alpha =
                0;
            this.lighterOverlay.color = null;
            this.lighterOverlay.alpha = 0;
            this.renderMode = null;
            this.mergeTop = false;
            this.gfxCut.top = this.gfxCut.bottom = 0;
            this.gfxCut.left = this.gfxCut.right = 0;
            this.noOverlapSolving = this.alwaysRender = false
        },
        kill: function() {
            this.renderData = {};
            ig.spritePool.sprites.push(this)
        },
        setPos: function(b, a, d) {
            this.pos.x = b;
            this.pos.y = a;
            this.pos.z = d
        },
        setGfxOffset: function(b, a) {
            this.gfxOffset.x = b;
            this.gfxOffset.y = a
        },
        setGfxCut: function(b, a, d, c) {
            this.gfxCut.top = b || 0;
            this.gfxCut.bottom = a || 0;
            this.gfxCut.left =
                d || 0;
            this.gfxCut.right = c || 0
        },
        setShadow: function(b, a, d, c, e, f) {
            this.shadow.x = b;
            this.shadow.y = a;
            this.shadow.z = d;
            this.shadow.scaleY = f || 1;
            this.shadow.diameter = c;
            this.shadow.type = e || ig.COLL_SHADOW_TYPE.DEFAULT
        },
        setSize: function(b, a, d, c) {
            this.size.x = b;
            this.size.y = a;
            this.size.z = d;
            this.wallY = c || 0
        },
        setImageSrc: function(b, a, d) {
            this.image = b;
            this.src.x = a || 0;
            this.src.y = d || 0
        },
        setFlip: function(b, a) {
            this.flip.x = b || false;
            this.flip.y = a || false
        },
        setPivot: function(b, a) {
            this.pivot.x = b;
            this.pivot.y = a
        },
        setTransform: function(b,
            a, d) {
            this.scale.x = b;
            this.scale.y = a;
            this.rotate = d
        },
        setAlpha: function(b) {
            this.alpha = b
        },
        setOverlayColor: function(b, a) {
            this.overlay.color = b;
            this.overlay.alpha = a
        },
        setLighterOverlayColor: function(b, a) {
            this.lighterOverlay.color = b;
            this.lighterOverlay.alpha = a
        },
        setInvisible: function() {
            this.image = null;
            this.setShadow(0, 0, 0, 0)
        },
        setSizeFromEntity: function(b, a, d, c, e) {
            var f = b.coll,
                b = f.size.y,
                f = f.size.z;
            this.mergeTop = false;
            if (c == ig.ANIM_SHAPE_TYPE.Y_FLAT) {
                d < f && (f = d);
                b = d - f;
                this.mergeTop = true
            } else if (c == ig.ANIM_SHAPE_TYPE.Z_FLAT) {
                b =
                    d;
                f = 0
            } else {
                d = d - b - f;
                if (d > 0) switch (c) {
                    case ig.ANIM_SHAPE_TYPE.Z_EXPAND:
                        f = f + d;
                        break;
                    case ig.ANIM_SHAPE_TYPE.Y_EXPAND:
                        b = b + d;
                        break;
                    case ig.ANIM_SHAPE_TYPE.YZ_EXPAND:
                        b = b + Math.floor(d / 2);
                        f = f + Math.ceil(d / 2)
                } else if (d < 0)
                    if (b + d >= 0) b = b + d;
                    else {
                        f = f + (d + b);
                        b = 0
                    }
            }
            this.setSize(a, b, f, Math.round((e || 0) * b))
        },
        setImageSrcFromEntity: function(b, a, d, c, e, f) {
            this.size.y + this.size.z < d && (f = f + (d - this.size.y - this.size.z));
            this.setImageSrc(c, e, f)
        },
        setShadowFromEntity: function(b) {
            b = b.coll;
            this.setShadow(b.pos.x + b.size.x / 2, b.pos.y +
                b.size.y / 2, b.baseZPos, b.shadow.size, b.shadow.type, b.shadow.scaleY)
        },
        setPosFromEntity: function(b, a, d, c) {
            var b = b.coll,
                d = b.pos.x - (this.size.x - b.size.x) / 2,
                e = b.pos.y,
                f = b.pos.z;
            this.size.y < b.size.y ? e = e + (b.size.y - this.size.y) : this.size.y > b.size.y && (e = e - Math.round((1 - (c || 0)) * (this.size.y - b.size.y)));
            if (a) {
                d = d + a.x;
                e = e + a.y;
                f = f + a.z
            }
            this.setPos(d, e, f)
        },
        centerPivot: function(b) {
            var a = this.pos.y - this.size.z + this.pivot.y - b.coll.pos.y;
            this.gfxOffset.x = this.gfxOffset.x - (this.pos.x + this.pivot.x - b.coll.pos.x);
            this.gfxOffset.y =
                this.gfxOffset.y - a
        },
        setEntityDefault: function(b, a, d, c, e, f, g, h, i) {
            c = c || ig.ANIM_SHAPE_TYPE.NO_EXPAND;
            this.setSizeFromEntity(b, a, d, c, e);
            this.setImageSrcFromEntity(b, a, d, g, h, i);
            this.setShadowFromEntity(b);
            this.setPosFromEntity(b, f, c, e)
        },
        assign: function(b) {
            Vec3.assign(this.pos, b.pos);
            Vec3.assign(this.size, b.size);
            this.image = b.image;
            Vec3.assign(this.shadow, b.shadow);
            this.shadow.diameter = b.shadow.diameter;
            this.shadow.yScale = b.shadow.yScale;
            Vec2.assign(this.gfxOffset, b.gfxOffset);
            Vec3.assign(this.tmpOffset,
                b.tmpOffset);
            this.wallY = b.wallY;
            Vec2.assign(this.src, b.src);
            this.alpha = b.alpha;
            Vec2.assign(this.flip, b.flip);
            Vec2.assign(this.scale, b.scale);
            this.rotate = b.rotate;
            Vec2.assign(this.pivot, b.pivot);
            this.overlay.color = b.overlay.color;
            this.overlay.alpha = b.overlay.alpha;
            this.lighterOverlay.color = b.lighterOverlay.color;
            this.lighterOverlay.alpha = b.lighterOverlay.alpha;
            this.renderMode = b.renderMode;
            this.gfxCut.top = b.gfxCut.top;
            this.gfxCut.bottom = b.gfxCut.bottom;
            this.gfxCut.left = b.gfxCut.left;
            this.gfxCut.right =
                b.gfxCut.right;
            this.mergeTop = b.mergeTop
        }
    });
    ig.SpritePool = ig.Class.extend({
        sprites: [],
        get: function(b) {
            if (this.sprites.length) {
                var a = this.sprites.pop();
                a.clear(b);
                return a
            }
            return new ig.CubeSprite(b)
        }
    });
    ig.spritePool = new ig.SpritePool
});
ig.baked = !0;
