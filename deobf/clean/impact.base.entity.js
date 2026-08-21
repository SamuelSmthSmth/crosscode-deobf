/*
 * impact.base.entity
 * ------------------
 * The `ig.Entity` base class: position/collision via `ig.CollEntry`, sprite
 * management, alignment helpers, kill/show/hide lifecycle, and the global
 * collision-type/shape tables used by the physics system.
 *
 * Original: deobf/extract/impact.base.entity.js
 * Faithful to the original logic — only local names and docs were added.
 */

ig.module("impact.base.entity").requires("impact.base.animation", "impact.base.coll-entry", "impact.base.impact").defines(function () {
    /**
     * Add a color overlay to an entity's animation state, recursing into its
     * sub-collision entities.
     */
    function addColorOverlayRecursive(entity, overlay) {
        if (!entity.animState) return false;
        entity.animState.addColorOverlay(overlay);
        for (var i = entity.coll.subColls.length; i--;) {
            addColorOverlayRecursive(entity.coll.subColls[i].entity, overlay);
        }
        return true;
    }

    /**
     * Expand `bounds` (left/right/top/bottom) to contain every sprite of
     * `entity`, recursing into sub-collision entities. Skips hidden entities.
     */
    function expandSpriteBounds(bounds, entity, rootEntity) {
        if (!entity._hidden) {
            for (var i = entity.sprites, n = i.length; n--;) {
                var bound = bounds;
                var sprite = i[n];
                if (sprite.size.x && (sprite.size.y || sprite.size.z) && sprite.image) {
                    var right = sprite.pos.x + sprite.size.x;
                    var top = sprite.pos.y - sprite.pos.z - sprite.size.z;
                    var bottom = sprite.pos.y - sprite.pos.z + sprite.size.y;
                    var coll = rootEntity.coll;
                    var centerX = coll.pos.x;
                    var centerY = (coll = coll.pos.y - coll.pos.z);
                    bound.left = Math.max(bound.left, centerX - sprite.pos.x);
                    bound.right = Math.max(bound.right, right - centerX);
                    bound.top = Math.max(bound.top, centerY - top);
                    bound.bottom = Math.max(bound.bottom, bottom - centerY);
                }
            }
            entity = entity.coll.subColls;
            if (entity.length > 0) {
                for (n = entity.length; n--;) expandSpriteBounds(bounds, entity[n].entity, rootEntity);
            }
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

    var scratchVec2 = Vec2.create();
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

        init: function (x, y, z, settings) {
            this.uid = ++ig.Entity._lastId;
            this.coll = new ig.CollEntry(this);
            this.coll.setPos(x, y, z);
            if (settings.size) ig.merge(this.coll.size, settings.size);
            else if (window.wm) {
                if (this._wm.scalableX) this.coll.size.x = 32;
                if (this._wm.scalableY) this.coll.size.y = 32;
            }
            if (settings.mapId) this.mapId = settings.mapId;
            this.name = settings.name || this.name;
        },

        reset: function (x, y, z, settings) {
            this.uid = ++ig.Entity._lastId;
            this.coll.reset();
            this.coll.setPos(x, y, z);
            this._killed = false;
            this._hidden = true;
            if (settings.size) ig.merge(this.coll.size, settings.size);
            else if (window.wm) {
                if (this._wm.scalableX) this.coll.size.x = 32;
                if (this._wm.scalableY) this.coll.size.y = 32;
            }
            if (settings.mapId) this.mapId = settings.mapId;
            this.name = settings.name || this.name;
        },

        initSprites: function () {},

        setPos: function (x, y, z, force) {
            this.coll.setPos(x, y, z, force);
        },

        setZPos: function (z) {
            this.setPos(void 0, void 0, z);
        },

        setSize: function (x, y, z) {
            this.coll.setSize(x, y, z);
        },

        getCenter: function (out) {
            return this.coll.getCenter(out);
        },

        getAlignedPos: function (align, out) {
            var pos = out || Vec3.create();
            var center = this.getCenter(pos);
            center.z = this.coll.pos.z;
            switch (align) {
                case ig.ENTITY_ALIGN.TOP:
                    center.z = center.z + this.coll.size.z;
                    break;
                case ig.ENTITY_ALIGN.CENTER:
                    center.z = center.z + this.coll.size.z / 2;
                    break;
                case ig.ENTITY_ALIGN.FACE:
                case ig.ENTITY_ALIGN.FACE_BASE:
                    var faceOffset;
                    if (this.getFaceOffset && (faceOffset = this.getFaceOffset())) {
                        center.y = center.y + this.coll.size.y / 2;
                        center.x = center.x + (faceOffset && faceOffset.x || 0);
                        center.y = center.y + (faceOffset && faceOffset.y || 0);
                        center.z = center.z + (faceOffset && faceOffset.z || 0);
                    }
                    if (align == ig.ENTITY_ALIGN.FACE_BASE) center.z = this.coll.baseZPos;
                    break;
                case ig.ENTITY_ALIGN.BASE:
                    center.z = this.coll.baseZPos;
                    break;
                case ig.ENTITY_ALIGN.WALL_HIT:
                    if ((faceOffset = this.coll._collData && this.coll._collData.blockDir)) {
                        if (faceOffset.x > 0) center.x = center.x + this.coll.size.x / 2;
                        else if (faceOffset.x < 0) center.x = center.x - this.coll.size.x / 2;
                        if (faceOffset.y > 0) center.y = center.y + this.coll.size.y / 2;
                        else if (faceOffset.y < 0) center.y = center.y - this.coll.size.y / 2;
                    }
            }
            return center;
        },

        getOverlapCenterCoords: function (other, out) {
            return this.coll.getOverlapCenterCoords(other.coll, out);
        },

        getHitDir: function (other, out) {
            out = out || Vec2.create();
            other.getCenter(out);
            Vec2.sub(out, this.getCenter(scratchVec2));
            return out;
        },

        getCollideSide: function (other) {
            Vec2.assign(scratchVec2, this.coll.vel);
            Vec2.sub(scratchVec2, other.coll.vel);
            Vec2.mulF(scratchVec2, ig.system.tick);
            var hitTimeX = -1;
            var hitTimeY = -1;
            scratchVec2.x && (hitTimeX = scratchVec2.x > 0 ? (this.coll.pos.x + this.coll.size.x - other.coll.pos.x) / scratchVec2.x : (other.coll.pos.x + other.coll.size.x - this.coll.pos.x) / -scratchVec2.x);
            scratchVec2.y && (hitTimeY = scratchVec2.y > 0 ? (this.coll.pos.y + this.coll.size.y - other.coll.pos.y) / scratchVec2.y : (other.coll.pos.y + other.coll.size.y - this.coll.pos.y) / -scratchVec2.y);
            return hitTimeX < 0 || hitTimeX > 1 ? ig.ActorEntity.FACE4[scratchVec2.y > 0 ? "NORTH" : "SOUTH"] : hitTimeY < 0 || hitTimeY > 1 ? ig.ActorEntity.FACE4[scratchVec2.x > 0 ? "WEST" : "EAST"] : hitTimeX < hitTimeY ? ig.ActorEntity.FACE4[scratchVec2.x > 0 ? "WEST" : "EAST"] : ig.ActorEntity.FACE4[scratchVec2.y > 0 ? "NORTH" : "SOUTH"];
        },

        update: function () {
            this.coll.update();
        },

        handleMovementTrace: function (result) {
            this.coll.handleMovementTrace(result);
        },

        setSpriteCount: function (count, allowPool) {
            var diff = this.sprites.length - count;
            if (diff < 0) {
                for (; diff++;) this.sprites.push(ig.spritePool.get(allowPool || false));
            } else if (diff > 0) {
                for (; diff--;) this.sprites.pop().kill();
            }
        },

        updateSprites: function () {},

        addEntityAttached: function (entity) {
            entity && entity.onEntityKillDetach && this.entityAttached.push(entity);
        },

        removeEntityAttached: function (entity) {
            this.entityAttached.erase(entity);
        },

        clearEntityAttached: function (filter) {
            for (var i = this.entityAttached.length; i--;) {
                if (!filter || filter(this.entityAttached[i])) {
                    var entity = this.entityAttached[i];
                    this.entityAttached.splice(i, 1);
                    if (entity) entity.onEntityKillDetach();
                }
            }
        },

        show: function () {
            ig.game.showEntity(this);
        },

        hide: function () {
            ig.game.hideEntity(this);
        },

        onHideRequest: null,

        kill: function (data) {
            if (!this._killed) {
                ig.ENTITY_KILL_CALL++;
                this.onKill(data);
                if (!this._killed) throw Error("Killed Entity actually not killed", this);
                this.clearEntityAttached();
                for (var i = 0; i < this.sprites.length; ++i) this.sprites[i].kill();
                this.sprites = [];
                ig.game.removeEntity(this);
                for (var subColls = this.coll.subColls, i = subColls.length; i--;) subColls[i].entity.kill(data);
            }
        },

        onKill: function () {
            if (!ig.ENTITY_KILL_CALL) throw Error("Called Entity .onKill() outside of ig.game.kill()");
            ig.ENTITY_KILL_CALL--;
            this._killed = true;
            this.coll._killed = true;
        },

        erase: function () {},

        getOverlappingEntities: function (mask) {
            return ig.game.getEntitiesInRectangle(this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, this.coll.size.x, this.coll.size.y, this.coll.size.z, this, null, mask);
        },

        setSlipThrough: function (slipThrough) {
            this.coll.ignoreCollision = slipThrough;
        },

        distanceTo: function (other) {
            return ig.CollTools.getGroundDistance(this.coll, other.coll);
        },

        onVarAccess: function (access, path) {
            if (path[1] == "name") return this.name;
            if (path[1] == "id") return this.id;
            if (path[1] == "accel") return ig.vars.resolveObjectAccess(this.coll.accelDir, path, 2);
            if (path[1] == "pos") return ig.vars.resolveObjectAccess(this.coll.pos, path, 2);
            if (path[1] == "onGround") return this.coll.pos.z == this.coll.baseZPos;
            if (path[1] == "vel") return ig.vars.resolveObjectAccess(this.coll.vel, path, 2);
            if (path[1] == "collWall") {
                var blockDir = this.coll._collData && this.coll._collData.blockDir;
                if (blockDir) return ig.vars.resolveObjectAccess(blockDir, path, 2);
            }
            return null;
        },

        check: function () {},
        collideWith: function () {},
        animationEnded: function () {},
        onFallFromEdge: null,
        onTouchGround: null
    });

    ig.WIPE_DIRECTION = {
        NORTH: 1,
        SOUTH: 3
    };

    ig.EntityTools = {
        getSpriteBounds: function (entity, updateSprites) {
            updateSprites && updateSprites.updateSprites();
            entity.left = entity.right = entity.top = entity.bottom = -1e4;
            expandSpriteBounds(entity, updateSprites, updateSprites);
        },

        hasGroundEntity: function (entity) {
            entity = entity.coll;
            return entity._collData && entity._collData.groundEntry;
        },

        getGroundEntity: function (entity) {
            entity = entity.coll;
            if (!entity._collData) return null;
            return (entity = entity._collData.groundEntry) && entity.entity;
        },

        getCeilingEntity: function (entity) {
            entity = entity.coll;
            if (!entity._collData) return null;
            return (entity = entity._collData.ceilingEntry) && entity.entity;
        },

        isInScreen: function (entity, marginX, marginY) {
            return ig.CollTools.isInScreen(entity.coll, marginX, marginY);
        },

        addEntityColorOverlay: function (entity, overlay, skipSiblings) {
            if (addColorOverlayRecursive(entity, overlay)) {
                entity = entity.coll;
                if (entity.parentColl && entity.parentGroup && !skipSiblings) {
                    for (var siblings = entity.parentColl.subColls, i = siblings.length; i--;) {
                        var sibling = siblings[i];
                        sibling != entity && sibling.parentGroup == entity.parentGroup && addColorOverlayRecursive(sibling.entity, overlay);
                    }
                }
            }
        },

        clearEntitySpriteCut: function (entity, wipeDirection) {
            for (var sprites = entity.sprites, i = sprites.length; i--;) {
                var sprite = sprites[i];
                var top = 0;
                var bottom = 0;
                if (wipeDirection) {
                    if (wipeDirection != ig.WIPE_DIRECTION.NORTH) top = sprite.gfxCut.top;
                    if (wipeDirection != ig.WIPE_DIRECTION.SOUTH) bottom = sprite.gfxCut.bottom;
                }
                sprite.setGfxCut(top, bottom);
            }
            var subColls = entity.coll.subColls;
            if (subColls.length > 0) {
                for (i = subColls.length; i--;) this.clearEntitySpriteCut(subColls[i].entity, wipeDirection);
            }
        },

        clearEntitySpriteOffset: function (entity) {
            for (var sprites = entity.sprites, i = sprites.length; i--;) Vec3.assignC(sprites[i].tmpOffset, 0, 0, 0);
            entity = entity.coll.subColls;
            if (entity.length > 0) {
                for (i = entity.length; i--;) this.clearEntitySpriteOffset(entity[i].entity);
            }
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

    // The global collision-type pair matrix (type A -> set of type B that it
    // collides with). Read as: an entity of the keyed type collides with
    // entities of the listed type.
    ig.Entity.COLLISION_MAP = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NONE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.IGNORE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.IGNORE][ig.COLLTYPE.BLOCK] = true;
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
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK][ig.COLLTYPE.PBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PBLOCK][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPBLOCK][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.PROJECTILE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.PBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.SEMI_IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.BLOCK][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.PROJECTILE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.VIRTUAL] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.PBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.NPBLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.SEMI_IGNORE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.BLOCK] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.FENCE][ig.COLLTYPE.NPFENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE] = {};
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.FENCE] = true;
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.NPFENCE][ig.COLLTYPE.IGNORE] = true;
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
    ig.Entity.COLLISION_MAP[ig.COLLTYPE.PASSIVE][ig.COLLTYPE.BLOCK] = true;

    ig.COLLSHAPE = {
        RECTANGLE: 1,
        SLOPE_NE: 2,
        SLOPE_SE: 3,
        SLOPE_SW: 4,
        SLOPE_NW: 5
    };

    /** An entity with an animation state + animation sheet. */
    ig.AnimatedEntity = ig.Entity.extend({
        animSheet: null,
        animState: null,
        animSpeedFactor: 1,
        currentAnim: null,
        followUpAnim: null,
        callbackOnFinish: false,
        _createdAnimSheet: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.animState = new ig.AnimationState();
        },

        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.animState.reset();
            this.animSpeedFactor = 1;
            this.followUpAnim = this.currentAnim = null;
            this._createdAnimSheet = this.callbackOnFinish = false;
        },

        onKill: function (data) {
            this.parent(data);
            this._createdAnimSheet && this.animSheet.clearCached();
        },

        initSprites: function () {
            this.setSpriteCount(0);
        },

        initAnimations: function (animSheet) {
            if (animSheet) {
                if (animSheet instanceof ig.AnimationSheet) {
                    this.animSheet = animSheet;
                } else {
                    this._createdAnimSheet = true;
                    this.animSheet = new ig.AnimationSheet(animSheet);
                }
            }
            if (!this.animState.hasAnimations()) {
                var animName;
                for (animName in this.animSheet.anims) break;
                if (animName) {
                    this.setCurrentAnim(animName);
                    this.animState.setAnimation(this, this.animSheet.anims[animName].getAnimations(this));
                }
            }
        },

        getCurrentAnimFaceCount: function () {
            return !this.animSheet.anims[this.currentAnim] ? 1 : this.animSheet.anims[this.currentAnim].numDirs || 1;
        },

        rewindAnim: function () {
            this.animState.rewind();
            for (var subColls = this.coll.subColls, i = subColls.length; i--;) {
                var entity = subColls[i].entity;
                entity.persistAnim || entity.rewindAnim();
            }
        },

        setCurrentAnim: function (name, rewind, followUp, force, callbackOnFinish) {
            followUp = followUp || null;
            if (force || (followUp || name) != (this.followUpAnim || this.currentAnim)) {
                this.callbackOnFinish = callbackOnFinish;
                this.currentAnim = name;
                rewind && this.rewindAnim();
                this.followUpAnim = followUp;
                this.updateAnim();
            }
        },

        updateAnim: function () {
            if (this.animSheet) {
                if (this.animState.loopCount > 0 && this.callbackOnFinish) {
                    this.callbackOnFinish = false;
                    this.animationEnded(this.currentAnim);
                }
                if (this.followUpAnim && this.animState.loopCount > 0) {
                    this.rewindAnim();
                    this.currentAnim = this.followUpAnim;
                    this.followUpAnim = null;
                }
                var anim = this.currentAnim;
                typeof anim == "string" && (anim = this.animSheet.anims[this.currentAnim]);
                if (anim) {
                    anim = anim.getAnimations(this);
                    this.animState.setAnimation(this, anim);
                }
            }
        },

        update: function () {
            this.updateAnim();
            this.parent();
        },

        updateSprites: function () {
            this.animSheet && this.animState.updateSprite(this, this.animSpeedFactor);
        }
    });

    /** An animation "part" entity owned by a parent (e.g. a head/hair part). */
    ig.AnimationPartEntity = ig.AnimatedEntity.extend({
        partName: null,
        owner: null,
        persistAnim: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = settings.collType;
            this.coll.weight = -1;
            this.coll.heightShape = settings.heightShape;
            this.coll.parentGroup = settings.group;
            this.coll.alwaysRender = true;
            this.owner = settings.owner;
            this.partName = settings.partName;
            this.animSheet = settings.animSheet;
            this.persistAnim = settings.persistAnim;
            this.defaultCollType = settings.collType;
            (x = settings.padding) && this.coll.setPadding(x.x, x.y);
        }
    });
});
ig.baked = !0;
