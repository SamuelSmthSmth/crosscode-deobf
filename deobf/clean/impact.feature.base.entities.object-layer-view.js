/**
 * impact.feature.base.entities.object-layer-view
 * ==============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.base.entities.object-layer-view")`.
 *
 * `ig.ENTITY.ObjectLayerView`: displays the pre-rendered chunks of an object
 * layer through a colliding box. `ig.ObjectLayerTools` computes how many
 * chunk sprites are needed and positions/crops them; `ig.EntityHideManager`
 * fades entities in/out based on a condition.
 */
ig.module("impact.feature.base.entities.object-layer-view")
    .requires("impact.base.actor-entity")
    .defines(function () {

    var scratchVec2a = Vec2.create(),
        scratchVec2b = Vec2.create();

    ig.ObjectLayerTools = {

        /** How many chunk sprites cover `entity` across the given maps. */
        getSpriteCount: function (entity, maps, pos, size) {
            for (var coll = entity.coll, pos = pos || coll.pos, size = size || coll.size, count = i = 0; i < maps.length; ++i) {
                var map = maps[i],
                    chunkW = map.chunkSizeX / ig.system.scale,
                    chunkH = map.chunkSizeY / ig.system.scale,
                    countAdd = 1;
                Math.floor(pos.x / chunkW) != Math.floor((pos.x + size.x) / chunkW) && (countAdd = countAdd * 2);
                Math.floor((pos.y - pos.z - size.z) / chunkH) != Math.floor((pos.y - pos.z + size.y) / chunkH) && (countAdd = countAdd * 2);
                count = count + countAdd;
            }
            return count;
        },

        /**
         * Position and crop the chunk sprites for `entity`'s box across the
         * maps. Returns true when all sprites could be placed (or no maps).
         */
        updateSprites: function (entity, maps, wallY, offset, pos, size) {
            if (!maps.length) return true;
            for (var i = maps.length; i--;)
                if (!maps[i].preRenderedChunks) return false;
            var coll = entity.coll,
                pos = pos || coll.pos,
                size = size || coll.size,
                topLeft = Vec2.assignC(scratchVec2a, pos.x, pos.y - pos.z - size.z),
                bottomRight = Vec2.assignC(scratchVec2b, pos.x + size.x, pos.y - pos.z + size.y);
            if (offset) {
                Vec2.subC(topLeft, offset.x, offset.y - offset.z || 0);
                Vec2.subC(bottomRight, offset.x, offset.y - offset.z || 0);
                topLeft.x = Math.round(topLeft.x);
                topLeft.y = Math.round(topLeft.y);
                bottomRight.x = Math.round(bottomRight.x);
                bottomRight.y = Math.round(bottomRight.y);
            }
            for (var spriteIdx = offset = 0; spriteIdx < maps.length; ++spriteIdx) {
                for (var map = maps[spriteIdx], chunkW = map.chunkSizeX / ig.system.scale,
                        chunkH = map.chunkSizeY / ig.system.scale,
                        minX = Math.floor(topLeft.x / chunkW), maxX = Math.floor(bottomRight.x / chunkW),
                        minY = Math.floor(topLeft.y / chunkH), maxY = Math.floor(bottomRight.y / chunkH),
                        offX = topLeft.x % chunkW, offY = topLeft.y % chunkH; offX < 0;) offX = offX + chunkW;
                for (; offY < 0;) offY = offY + chunkH;
                for (var chunkW = chunkW - offX, chunkH = chunkH - offY,
                        wallH = Math.round(size.y * wallY), wallH = size.y - wallH, y = minY; y <= maxY; ++y)
                    for (var x = minX; x <= maxX; ++x) {
                        var xPos = pos.x,
                            yPos = pos.y,
                            zPos = pos.z,
                            w = size.x,
                            h = size.y,
                            z = size.z,
                            chunk = map.preRenderedChunks[y] && map.preRenderedChunks[y][x],
                            wallDraw = Math.round(wallY * h);
                        if (chunk) {
                            if (x < maxX) {
                                w = chunkW;
                            } else if (x > minX) {
                                w = w - chunkW;
                                xPos = xPos + chunkW;
                            }
                            if (y < maxY) {
                                if (chunkH >= wallH) {
                                    wallDraw = wallH + z - chunkH;
                                    if (wallDraw >= 0) {
                                        z = z - wallDraw;
                                        zPos = zPos + wallDraw;
                                        h = wallH;
                                        wallDraw = 0;
                                    } else {
                                        h = wallH - wallDraw;
                                        wallDraw = -wallDraw;
                                    }
                                } else {
                                    zPos = zPos + z;
                                    h = chunkH;
                                    wallDraw = z = 0;
                                }
                            } else if (y > minY) {
                                if (chunkH >= wallH) {
                                    wallDraw = wallH + z - chunkH;
                                    if (wallDraw >= 0) {
                                        yPos = yPos + wallH;
                                        z = z - (chunkH - wallH);
                                        wallDraw = h = h - wallH;
                                    } else {
                                        z = 0;
                                        yPos = yPos + (wallH - wallDraw);
                                        h = h - (wallH - wallDraw);
                                        wallDraw = 0;
                                    }
                                } else {
                                    yPos = yPos + chunkH;
                                    h = h - chunkH;
                                }
                            }
                            var gfxX = x > minX ? 0 : offX,
                                gfxY = y > minY ? 0 : offY;
                            if (entity.sprites[spriteIdx]) {
                                entity.sprites[spriteIdx].setPos(xPos, yPos, zPos);
                                entity.sprites[spriteIdx].setSize(w, h, z, wallDraw);
                                entity.sprites[spriteIdx].aboveZ = 1;
                                entity.sprites[spriteIdx].setImageSrc(new ig.ImageCanvasWrapper(chunk), gfxX, gfxY);
                            }
                            spriteIdx++;
                        }
                    }
            }
            return true;
        }
    };

    /** Fades an entity to (almost) invisible while `hideCondition` holds. */
    ig.EntityHideManager = ig.Class.extend({
        hideCondition: null,
        hideTimer: 0,
        hidden: false,
        efficientMode: false,

        init: function (condition) {
            this.hideCondition = new ig.VarCondition(condition);
        },

        update: function (entity) {
            this.efficientMode || this.varsChanged(entity);
            this.hideTimer = Math.max(0, this.hideTimer - ig.system.actualTick);
            var t = this.hideTimer / 0.2,
                t = this.hidden ? t : 1 - t,
                alpha = 0.1 * (1 - t) + 1 * t;
            if (entity.animState) {
                entity.animState.alpha = alpha;
            } else {
                for (var i = entity.sprites.length; i--;) entity.sprites[i].setAlpha(alpha);
            }
            this.efficientMode && !this.hideTimer && entity.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
        },

        isBusy: function () {
            return this.hideTimer;
        },

        varsChanged: function (entity) {
            var hidden = this.hideCondition.evaluate();
            if (hidden != this.hidden) {
                this.hideTimer = 0.2 - this.hideTimer;
                this.hidden = hidden;
                this.efficientMode && entity.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
            }
        }
    });

    /** A colliding box that renders the chunks of an object layer. */
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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE[settings.collType || "BLOCK"];
            this.coll.size.z = settings.zHeight || 0;
            this.coll.heightShape = ig.COLL_HEIGHT_SHAPE[settings.heightShape] || ig.COLL_HEIGHT_SHAPE.NONE;
            this.coll.shape = ig.COLLSHAPE[settings.shape || "RECTANGLE"];
            this.maps = ig.game.getObjectMaps(settings.layer);
            this.wallY = (settings.wallY || 0).limit(0, 1);
            this.terrain = ig.TERRAIN[settings.terrain] || null;
            this.fx.show = settings.showEffect ? new ig.EffectHandle(settings.showEffect) : null;
            this.fx.hide = settings.hideEffect ? new ig.EffectHandle(settings.hideEffect) : null;
            this.blockNavMap = settings.blockNavMap;
            this.guiSprites = settings.guiSprites || false;
            settings.hideCondition ? this.hideManager = new ig.EntityHideManager(settings.hideCondition) :
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
        },

        onKill: function (entity) {
            this.parent(entity);
            this.fx.show && this.fx.show.clearCached();
            this.fx.hide && this.fx.hide.clearCached();
        },

        show: function (value) {
            this.parent(value);
            this.fx.handle && this.fx.handle.stop();
            if (!value && this.fx.show) {
                this.animState.alpha = 0;
                this.fx.isHiding = false;
                this.fx.handle = this.fx.show.spawnOnTarget(this, {
                    callback: this
                });
            }
            if (this.blockNavMap) this.navBlocker = ig.navigation.getNavBlock(this);
        },

        onHideRequest: function () {
            this.navBlocker && this.navBlocker.remove();
            this.navBlocker = null;
            if (this.fx.hide) {
                this.fx.isHiding = true;
                this.fx.handle = this.fx.hide.spawnOnTarget(this, {
                    callback: this
                });
            } else {
                this.hide();
            }
        },

        onEffectEvent: function () {
            if (this.fx.handle && this.fx.handle.isDone()) {
                this.fx.handle = null;
                this.fx.isHiding && this.hide();
            }
        },

        initSprites: function () {
            var count = ig.ObjectLayerTools.getSpriteCount(this, this.maps);
            this.setSpriteCount(count, this.guiSprites);
        },

        update: function () {
            this.hideManager && this.hideManager.update(this);
        },

        updateSprites: function () {
            if (!this.spritesInitialized &&
                ig.ObjectLayerTools.updateSprites(this, this.maps, this.wallY)) {
                this.spritesInitialized = true;
            }
            for (var i = this.sprites.length; i--;) this.sprites[i].setAlpha(this.animState.alpha);
            this.animState.updateSpriteColor(this);
        }
    });

    ig.ENTITY.ObjectLayerView.staticNavBlock = true;
});
ig.baked = !0;
