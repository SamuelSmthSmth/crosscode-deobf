ig.module("impact.base.entity").requires("impact.base.animation", "impact.base.coll-entry", "impact.base.impact").defines(function() {
    function b(a, d) {
        if (!a.animState) return false;
        a.animState.addColorOverlay(d);
        for (var f = a.coll, g = f.subColls.length; g--;) b(f.subColls[g].entity, d);
        return true
    }

    function a(b, d, f) {
        if (!d._hidden) {
            for (var g = d.sprites, h = g.length; h--;) {
                var i = b,
                    j = g[h];
                if (j.size.x && (j.size.y || j.size.z) && j.image) {
                    var k = j.pos.x + j.size.x,
                        l = j.pos.y - j.pos.z - j.size.z,
                        o = j.pos.y - j.pos.z + j.size.y,
                        m = f.coll,
                        n = m.pos.x,
                        m = m.pos.y - m.pos.z;
                    i.left = Math.max(i.left, n - j.pos.x);
                    i.right = Math.max(i.right, k - n);
                    i.top = Math.max(i.top, m - l);
                    i.bottom = Math.max(i.bottom, o - m)
                }
            }
            d = d.coll.subColls;
            if (d.length > 0)
                for (h = d.length; h--;) a(b, d[h].entity, f)
        }
    }
    ig.ENTITY_SPRITE_MODE = {
        FLAT: 1,
        CUBE: 2
    };
    ig.ENTITY_ALIGN = {
        BOTTOM: 1,
        CENTER: 2,
        TOP: 3,
        FACE: 4,
        BASE: 5,
        WALL_HIT: 6,
        FACE_BASE: 7
    };
    var d = Vec2.create();
    ig.ENTITY_KILL_CALL = false;
    ig.Entity = ig.Class.extend({
        id: 0,
        uid: 0,
        mapId: 0,
        settings: {},
        name: null,
        coll: null,
        sprites: [],
        entityAttached: [],
        _hidden: true,
        _hideRequest: true,
        _killed: false,
        _wm: new ig.Config({}),
        init: function(a, b, d, g) {
            this.uid = ++ig.Entity._lastId;
            this.coll = new ig.CollEntry(this);
            this.coll.setPos(a, b, d);
            if (g.size) ig.merge(this.coll.size, g.size);
            else if (window.wm) {
                if (this._wm.scalableX) this.coll.size.x = 32;
                if (this._wm.scalableY) this.coll.size.y = 32
            }
            if (g.mapId) this.mapId = g.mapId;
            this.name = g.name || this.name
        },
        reset: function(a, b, d, g) {
            this.uid = ++ig.Entity._lastId;
            this.coll.reset();
            this.coll.setPos(a, b, d);
            this._killed = false;
            this._hidden = true;
            if (g.size) ig.merge(this.coll.size,
                g.size);
            else if (window.wm) {
                if (this._wm.scalableX) this.coll.size.x = 32;
                if (this._wm.scalableY) this.coll.size.y = 32
            }
            if (g.mapId) this.mapId = g.mapId;
            this.name = g.name || this.name
        },
        initSprites: function() {},
        setPos: function(a, b, d, g) {
            this.coll.setPos(a, b, d, g)
        },
        setZPos: function(a) {
            this.setPos(void 0, void 0, a)
        },
        setSize: function(a, b, d) {
            this.coll.setSize(a, b, d)
        },
        getCenter: function(a) {
            return this.coll.getCenter(a)
        },
        getAlignedPos: function(a, b) {
            var b = b || Vec3.create(),
                d = this.getCenter(b);
            d.z = this.coll.pos.z;
            switch (a) {
                case ig.ENTITY_ALIGN.TOP:
                    d.z =
                        d.z + this.coll.size.z;
                    break;
                case ig.ENTITY_ALIGN.CENTER:
                    d.z = d.z + this.coll.size.z / 2;
                    break;
                case ig.ENTITY_ALIGN.FACE:
                case ig.ENTITY_ALIGN.FACE_BASE:
                    var g;
                    if (this.getFaceOffset && (g = this.getFaceOffset())) {
                        d.y = d.y + this.coll.size.y / 2;
                        d.x = d.x + (g && g.x || 0);
                        d.y = d.y + (g && g.y || 0);
                        d.z = d.z + (g && g.z || 0)
                    }
                    if (a == ig.ENTITY_ALIGN.FACE_BASE) d.z = this.coll.baseZPos;
                    break;
                case ig.ENTITY_ALIGN.BASE:
                    d.z = this.coll.baseZPos;
                    break;
                case ig.ENTITY_ALIGN.WALL_HIT:
                    if (g = this.coll._collData && this.coll._collData.blockDir) {
                        if (g.x > 0) d.x =
                            d.x + this.coll.size.x / 2;
                        else if (g.x < 0) d.x = d.x - this.coll.size.x / 2;
                        if (g.y > 0) d.y = d.y + this.coll.size.y / 2;
                        else if (g.y < 0) d.y = d.y - this.coll.size.y / 2
                    }
            }
            return d
        },
        getOverlapCenterCoords: function(a, b) {
            return this.coll.getOverlapCenterCoords(a.coll, b)
        },
        getHitDir: function(a, b) {
            b = b || Vec2.create();
            a.getCenter(b);
            Vec2.sub(b, this.getCenter(d));
            return b
        },
        getCollideSide: function(a) {
            Vec2.assign(d, this.coll.vel);
            Vec2.sub(d, a.coll.vel);
            Vec2.mulF(d, ig.system.tick);
            var b = -1,
                f = -1;
            d.x && (b = d.x > 0 ? (this.coll.pos.x + this.coll.size.x -
                a.coll.pos.x) / d.x : (a.coll.pos.x + a.coll.size.x - this.coll.pos.x) / -d.x);
            d.y && (f = d.y > 0 ? (this.coll.pos.y + this.coll.size.y - a.coll.pos.y) / d.y : (a.coll.pos.y + a.coll.size.y - this.coll.pos.y) / -d.y);
            return b < 0 || b > 1 ? ig.ActorEntity.FACE4[d.y > 0 ? "NORTH" : "SOUTH"] : f < 0 || f > 1 ? ig.ActorEntity.FACE4[d.x > 0 ? "WEST" : "EAST"] : b < f ? ig.ActorEntity.FACE4[d.x > 0 ? "WEST" : "EAST"] : ig.ActorEntity.FACE4[d.y > 0 ? "NORTH" : "SOUTH"]
        },
        update: function() {
            this.coll.update()
        },
        handleMovementTrace: function(a) {
            this.coll.handleMovementTrace(a)
        },
        setSpriteCount: function(a,
            b) {
            var d = this.sprites.length - a;
            if (d < 0)
                for (; d++;) this.sprites.push(ig.spritePool.get(b || false));
            else if (d > 0)
                for (; d--;) this.sprites.pop().kill()
        },
        updateSprites: function() {},
        addEntityAttached: function(a) {
            a && a.onEntityKillDetach && this.entityAttached.push(a)
        },
        removeEntityAttached: function(a) {
            this.entityAttached.erase(a)
        },
        clearEntityAttached: function(a) {
            for (var b = this.entityAttached.length; b--;)
                if (!a || a(this.entityAttached[b])) {
                    var d = this.entityAttached[b];
                    this.entityAttached.splice(b, 1);
                    if (d) d.onEntityKillDetach()
                }
        },
        show: function() {
            ig.game.showEntity(this)
        },
        hide: function() {
            ig.game.hideEntity(this)
        },
        onHideRequest: null,
        kill: function(a) {
            if (!this._killed) {
                ig.ENTITY_KILL_CALL++;
                this.onKill(a);
                if (!this._killed) throw Error("Killed Entity actually not killed", this);
                this.clearEntityAttached();
                for (var b = 0; b < this.sprites.length; ++b) this.sprites[b].kill();
                this.sprites = [];
                ig.game.removeEntity(this);
                for (var d = this.coll.subColls, b = d.length; b--;) d[b].entity.kill(a)
            }
        },
        onKill: function() {
            if (!ig.ENTITY_KILL_CALL) throw Error("Called Entity .onKill() outside of ig.game.kill()");
            ig.ENTITY_KILL_CALL--;
            this._killed = true;
            this.coll._killed = true
        },
        erase: function() {},
        getOverlappingEntities: function(a) {
            return ig.game.getEntitiesInRectangle(this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, this.coll.size.x, this.coll.size.y, this.coll.size.z, this, null, a)
        },
        setSlipThrough: function(a) {
            this.coll.ignoreCollision = a
        },
        distanceTo: function(a) {
            return ig.CollTools.getGroundDistance(this.coll, a.coll)
        },
        onVarAccess: function(a, b) {
            if (b[1] == "name") return this.name;
            if (b[1] == "id") return this.id;
            if (b[1] ==
                "accel") return ig.vars.resolveObjectAccess(this.coll.accelDir, b, 2);
            if (b[1] == "pos") return ig.vars.resolveObjectAccess(this.coll.pos, b, 2);
            if (b[1] == "onGround") return this.coll.pos.z == this.coll.baseZPos;
            if (b[1] == "vel") return ig.vars.resolveObjectAccess(this.coll.vel, b, 2);
            if (b[1] == "collWall") {
                var d = this.coll._collData && this.coll._collData.blockDir;
                if (d) return ig.vars.resolveObjectAccess(d, b, 2)
            }
            return null
        },
        check: function() {},
        collideWith: function() {},
        animationEnded: function() {},
        onFallFromEdge: null,
        onTouchGround: null
    });
    ig.WIPE_DIRECTION = {
        NORTH: 1,
        SOUTH: 3
    };
    ig.EntityTools = {
        getSpriteBounds: function(b, d) {
            d && d.updateSprites();
            b.left = b.right = b.top = b.bottom = -1E4;
            a(b, d, d)
        },
        hasGroundEntity: function(a) {
            a = a.coll;
            return a._collData && a._collData.groundEntry
        },
        getGroundEntity: function(a) {
            a = a.coll;
            if (!a._collData) return null;
            return (a = a._collData.groundEntry) && a.entity
        },
        getCeilingEntity: function(a) {
            a = a.coll;
            if (!a._collData) return null;
            return (a = a._collData.ceilingEntry) && a.entity
        },
        isInScreen: function(a, b, d) {
            return ig.CollTools.isInScreen(a.coll,
                b, d)
        },
        addEntityColorOverlay: function(a, d, f) {
            if (b(a, d)) {
                a = a.coll;
                if (a.parentColl && a.parentGroup && !f)
                    for (var f = a.parentColl.subColls, g = f.length; g--;) {
                        var h = f[g];
                        h != a && h.parentGroup == a.parentGroup && b(h.entity, d)
                    }
            }
        },
        clearEntitySpriteCut: function(a, b) {
            for (var d = a.sprites, g = d.length; g--;) {
                var h = d[g],
                    i = 0,
                    j = 0;
                if (b) {
                    if (b != ig.WIPE_DIRECTION.NORTH) i = h.gfxCut.top;
                    if (b != ig.WIPE_DIRECTION.SOUTH) j = h.gfxCut.bottom
                }
                h.setGfxCut(i, j)
            }
            d = a.coll.subColls;
            if (d.length > 0)
                for (g = d.length; g--;) this.clearEntitySpriteCut(d[g].entity,
                    b)
        },
        clearEntitySpriteOffset: function(a) {
            for (var b = a.sprites, d = b.length; d--;) Vec3.assignC(b[d].tmpOffset, 0, 0, 0);
            a = a.coll.subColls;
            if (a.length > 0)
                for (d = a.length; d--;) this.clearEntitySpriteOffset(a[d].entity)
        }
    };
    ig.Entity._lastId = 0;
    ig.COLLTYPE = {
        NONE: 0,
        IGNORE: 1,
        PROJECTILE: 2,
        VIRTUAL: 3,
        PBLOCK: 4,
        NPBLOCK: 5,
        BLOCK: 6,
        TRIGGER: 7,
        PASSIVE: 8,
        SEMI_IGNORE: 9,
        FENCE: 10,
        NPFENCE: 11
    };
    ig.Entity.COLLISION_MAP = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NONE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.IGNORE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.IGNORE][ig.COLLTYPE.BLOCK] =
        true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.IGNORE][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.IGNORE][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.IGNORE][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PROJECTILE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PROJECTILE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PROJECTILE][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PROJECTILE][ig.COLLTYPE.PBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.VIRTUAL] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.VIRTUAL][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.VIRTUAL][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.VIRTUAL][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.VIRTUAL][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.VIRTUAL][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK][ig.COLLTYPE.PROJECTILE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK][ig.COLLTYPE.PBLOCK] =
        true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.NPFENCE] =
        true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.PROJECTILE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.PBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.SEMI_IGNORE] =
        true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.PROJECTILE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.PBLOCK] =
        true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.SEMI_IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.IGNORE] =
        true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.PBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.SEMI_IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.SEMI_IGNORE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.SEMI_IGNORE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.SEMI_IGNORE][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.SEMI_IGNORE][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.SEMI_IGNORE][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.TRIGGER] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PASSIVE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PASSIVE][ig.COLLTYPE.BLOCK] =
        true;
    ig.COLLSHAPE = {
        RECTANGLE: 1,
        SLOPE_NE: 2,
        SLOPE_SE: 3,
        SLOPE_SW: 4,
        SLOPE_NW: 5
    };
    ig.AnimatedEntity = ig.Entity.extend({
        animSheet: null,
        animState: null,
        animSpeedFactor: 1,
        currentAnim: null,
        followUpAnim: null,
        callbackOnFinish: false,
        _createdAnimSheet: false,
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.animState = new ig.AnimationState
        },
        reset: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.animState.reset();
            this.animSpeedFactor = 1;
            this.followUpAnim = this.currentAnim = null;
            this._createdAnimSheet = this.callbackOnFinish = false
        },
        onKill: function(a) {
            this.parent(a);
            this._createdAnimSheet && this.animSheet.clearCached()
        },
        initSprites: function() {
            this.setSpriteCount(0)
        },
        initAnimations: function(a) {
            if (a)
                if (a instanceof ig.AnimationSheet) this.animSheet = a;
                else {
                    this._createdAnimSheet = true;
                    this.animSheet = new ig.AnimationSheet(a)
                } if (!this.animState.hasAnimations()) {
                for (var b in this.animSheet.anims) break;
                if (b) {
                    this.setCurrentAnim(b);
                    this.animState.setAnimation(this, this.animSheet.anims[b].getAnimations(this))
                }
            }
        },
        getCurrentAnimFaceCount: function() {
            return !this.animSheet.anims[this.currentAnim] ?
                1 : this.animSheet.anims[this.currentAnim].numDirs || 1
        },
        rewindAnim: function() {
            this.animState.rewind();
            for (var a = this.coll.subColls, b = a.length; b--;) {
                var d = a[b].entity;
                d.persistAnim || d.rewindAnim()
            }
        },
        setCurrentAnim: function(a, b, d, g, h) {
            d = d || null;
            if (g || (d || a) != (this.followUpAnim || this.currentAnim)) {
                this.callbackOnFinish = h;
                this.currentAnim = a;
                b && this.rewindAnim();
                this.followUpAnim = d;
                this.updateAnim()
            }
        },
        updateAnim: function() {
            if (this.animSheet) {
                if (this.animState.loopCount > 0 && this.callbackOnFinish) {
                    this.callbackOnFinish =
                        false;
                    this.animationEnded(this.currentAnim)
                }
                if (this.followUpAnim && this.animState.loopCount > 0) {
                    this.rewindAnim();
                    this.currentAnim = this.followUpAnim;
                    this.followUpAnim = null
                }
                var a = this.currentAnim;
                typeof a == "string" && (a = this.animSheet.anims[this.currentAnim]);
                if (a) {
                    a = a.getAnimations(this);
                    this.animState.setAnimation(this, a)
                }
            }
        },
        update: function() {
            this.updateAnim();
            this.parent()
        },
        updateSprites: function() {
            this.animSheet && this.animState.updateSprite(this, this.animSpeedFactor)
        }
    });
    ig.AnimationPartEntity = ig.AnimatedEntity.extend({
        partName: null,
        owner: null,
        persistAnim: null,
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.coll.type = g.collType;
            this.coll.weight = -1;
            this.coll.heightShape = g.heightShape;
            this.coll.parentGroup = g.group;
            this.coll.alwaysRender = true;
            this.owner = g.owner;
            this.partName = g.partName;
            this.animSheet = g.animSheet;
            this.persistAnim = g.persistAnim;
            this.defaultCollType = g.collType;
            (a = g.padding) && this.coll.setPadding(a.x, a.y)
        }
    })
});
ig.baked = !0;
