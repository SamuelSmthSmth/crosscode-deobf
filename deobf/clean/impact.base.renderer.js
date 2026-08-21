/**
 * impact.base.renderer
 * =====================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.renderer")`.
 *
 * `ig.Renderer2d` is the 2D draw pipeline: it walks entities, fills reusable
 * `SpriteDrawSlot`s (wall/ground per cube sprite), sorts them by depth, and draws
 * them level-by-level with shadow, overlay and "lighter" fragment support.
 * Also draws sprite animations (`drawAnimation`) and map layers.
 */
ig.module("impact.base.renderer").requires("impact.base.image", "impact.base.sprite").defines(function () {

    /** Draw every enabled map in a given level bucket ("first", level index, "last", "light"...). */
    function drawMapLayers(game, levelKey) {
        for (var i = 0; i < game.levels[levelKey].maps.length; i++) {
            var map = game.levels[levelKey].maps[i];
            if (map.enabled) {
                if (map.drawAnimated) map.drawAnimated();
                map.draw();
            }
        }
    }

    /** Draw a sprite slot's drop shadow (if any). */
    function drawSpriteShadow(slot, zMin, zMax) {
        if (ig.perf.spriteShadow && slot.drawShadow) {
            var game = ig.game;
            var sprite = slot.cubeSprite;
            if (game.shadowImage && sprite.shadow.diameter && sprite.shadow.z >= zMin && sprite.shadow.z < zMax) {
                if (ig.system.context.globalCompositeOperation != "source-over") {
                    ig.system.context.globalCompositeOperation = "source-over";
                }
                var zOffset = sprite.pos.z + sprite.tmpOffset.z - sprite.shadow.z;
                if (sprite.shadow.type == ig.COLL_SHADOW_TYPE.STATIC_SIZE) zOffset = 0;
                var diameter = sprite.shadow.diameter - zOffset / 8;
                var screenX = Math.round(sprite.shadow.x) - ig.game.screen.x;
                var screenY = Math.round(sprite.shadow.y - sprite.shadow.z) - ig.game.screen.y;
                if ((diameter > 0 && screenX - diameter / 2 <= ig.system.width) ||
                    screenY - diameter / 2 <= ig.system.height ||
                    screenX + diameter / 2 >= 0 || screenY + diameter / 2 >= 0) {
                    var prevAlpha = ig.system.context.globalAlpha;
                    ig.system.context.globalAlpha = ig.system.context.globalAlpha * 0.5 * sprite.alpha;
                    if (diameter <= 32) {
                        var tile = (8 - Math.floor(diameter / 4)).limit(0, 7);
                        game.shadowImage.drawTile(screenX - 16, screenY - 16, tile, 32, 32, 0, 0);
                    } else {
                        ig.system.context.save();
                        ig.system.context.translate(ig.system.getDrawPos(screenX), ig.system.getDrawPos(screenY));
                        var shadowScale = Math.floor(diameter / 4) * 4 / 224;
                        ig.system.context.scale(shadowScale, shadowScale * (sprite.shadow.scaleY || 1));
                        game.shadowImage.draw(-112, -112, 0, 32, 224, 224);
                        ig.system.context.restore();
                    }
                    ig.system.context.globalAlpha = prevAlpha;
                }
            }
        }
    }

    /** Create/update/remove a SpriteDrawSlot entry on a sprite's renderData. */
    function setSpriteSlot(sprite, enabled, slotKey, ground, spriteIdx) {
        if (enabled) {
            if (sprite.renderData[slotKey]) sprite.renderData[slotKey].spriteIdx = spriteIdx;
            else sprite.renderData[slotKey] = new ig.Renderer2d.SpriteDrawSlot(sprite, ground, spriteIdx);
        } else if (sprite.renderData[slotKey]) {
            sprite.renderData[slotKey] = null;
        }
    }

    var scratch = {};                 // used as a scratch Vec2 by drawAnimation
    var viewportMinX = 0;
    var viewportMinY = 0;
    var viewportMaxX = 0;
    var viewportMaxY = 0;

    ig.Renderer2d = ig.Class.extend({
        spriteSlots: [],
        guiSpriteSlots: [],

        init: function () {},

        /**
         * Fill sprite slots from the visible entities and pre-render fragments.
         * @param {Array} entities
         * @param {boolean} [force] bypass the map-rendering-blocked check
         */
        prepareDraw: function (entities, force) {
            ig.ImageModFragment.clear();
            var zoomMinOffset = ig.system.getZoomMinOffset(scratch);
            viewportMinX = zoomMinOffset.x + ig.game.screen.x;
            viewportMinY = zoomMinOffset.y + ig.game.screen.y;
            viewportMaxX = viewportMinX + ig.system.width / ig.system.zoom;
            viewportMaxY = viewportMinY + ig.system.height / ig.system.zoom;

            if (force || !ig.game.mapRenderingBlocked) {
                var slotIdx = 0;
                this.spriteSlots.length = 0;
                for (var guiCount = this.guiSpriteSlots.length = 0; guiCount < entities.length; guiCount++) {
                    var entity = entities[guiCount];
                    var isVisible = entity && (entity.coll.alwaysRender || !(
                        entity.coll.pos.x + entity.coll.size.x + 48 < viewportMinX ||
                        entity.coll.pos.x - 48 > viewportMaxX ||
                        entity.coll.pos.y - entity.coll.baseZPos + entity.coll.size.y + 32 < viewportMinY ||
                        entity.coll.pos.y - entity.coll.pos.z - entity.coll.size.z - 32 > viewportMaxY));
                    if (isVisible) {
                        entity.updateSprites();
                        for (var s = 0; s < entity.sprites.length; s++) {
                            slotIdx++;
                            var sprite = entity.sprites[s];
                            var spriteIdx = slotIdx;
                            var targetSlots = sprite.gui ? this.guiSpriteSlots : this.spriteSlots;

                            setSpriteSlot(sprite, sprite.mergeTop || sprite.size.z > 0 || sprite.wallY > 0, "wall", false, spriteIdx);
                            setSpriteSlot(sprite, !sprite.mergeTop && sprite.size.y > 0 && sprite.wallY < sprite.size.y, "ground", true, spriteIdx);

                            var wallSlot = sprite.renderData.wall;
                            var groundSlot = sprite.renderData.ground;
                            var onlyWall = wallSlot && !groundSlot;
                            if (wallSlot) wallSlot.update(onlyWall);
                            if (groundSlot) groundSlot.update(!onlyWall);

                            var shouldDraw = !ig.perf.spriteFilter ||
                                ((!sprite.image && !sprite.shadow.diameter) ? 0 :
                                sprite.alwaysRender ||
                                (sprite.scale.x > 1 || sprite.scale.y > 1 || sprite.rotate) ||
                                !(sprite.pos.x + sprite.tmpOffset.x + sprite.gfxOffset.x + sprite.size.x < viewportMinX ||
                                  sprite.pos.x + sprite.tmpOffset.x + sprite.gfxOffset.x > viewportMaxX ||
                                  sprite.pos.y + sprite.tmpOffset.y + sprite.gfxOffset.y - (sprite.pos.z + sprite.tmpOffset.z) - sprite.size.z > viewportMaxY ||
                                  sprite.pos.y + sprite.tmpOffset.y + sprite.gfxOffset.y + sprite.size.y - (sprite.shadow.diameter ? sprite.shadow.z : sprite.pos.z + sprite.tmpOffset.z) < viewportMinY));

                            if (shouldDraw) {
                                if (wallSlot) targetSlots.push(wallSlot);
                                if (groundSlot) targetSlots.push(groundSlot);
                                sprite.renderData.fragment = sprite.overlay.color
                                    ? new ig.ImageModFragment(sprite.image, sprite.src.x, sprite.src.y, sprite.size.x, sprite.size.y + sprite.size.z, sprite.overlay.color)
                                    : null;
                                sprite.renderData.lighterFragment = sprite.lighterOverlay.color
                                    ? new ig.ImageModFragment(sprite.image, sprite.src.x, sprite.src.y, sprite.size.x, sprite.size.y + sprite.size.z, sprite.lighterOverlay.color)
                                    : null;
                            }
                        }
                    }
                }
            }

            ig.ImageModFragment.prepare();
            if (force || !ig.game.mapRenderingBlocked) {
                this.spriteSlots.sort(function (a, b) {
                    return a.yIndex - b.yIndex || a.spriteIdx - b.spriteIdx;
                });
                this.guiSpriteSlots.sort(function (a, b) {
                    return a.yIndex - b.yIndex;
                });
            }
            ig.imageAtlas.fillFragments();
        },

        /**
         * Draw all map layers + entities, level by level.
         * @param {boolean} [force] bypass map-rendering-blocked check
         * @param {boolean} [skipClear]
         */
        drawLayers: function (force, skipClear) {
            var game = ig.game;
            if (!skipClear) {
                ig.system.context.fillStyle = "black";
                if (game.clearColor) ig.system.clear(game.clearColor);
            }
            if ((force || !ig.game.mapRenderingBlocked) && !ig.loading && game.maxLevel > 0) {
                drawMapLayers(game, "first");
                for (var level = -1; level < game.maxLevel; ++level) {
                    if (level >= 0) drawMapLayers(game, level);
                    this.drawEntities(level);
                }
                drawMapLayers(game, "last");
            }
        },

        drawLight: function () {
            var game = ig.game;
            if (!ig.loading && game.maxLevel > 0) drawMapLayers(game, "light");
        },

        drawPostLayerSprites: function () {
            var game = ig.game;
            if (!(ig.loading || game.maxLevel <= 0)) {
                drawMapLayers(game, "postlight");
                for (var i = 0; i < this.guiSpriteSlots.length; ++i) this.guiSpriteSlots[i].draw();
                if (this.guiSpriteSlots.length > 0) ig.system.context.globalCompositeOperation = "source-over";
                if (window.IG_GAME_DEBUG) {
                    for (var key in game.levels) {
                        for (var k2 in game.levels[key]) {
                            var map = game.levels[key][k2];
                            if (map instanceof ig.Map && map.debugDraw && map.draw) map.draw(game.levels[key].height);
                        }
                    }
                }
            }
        },

        /**
         * Draw entity sprite slots for a given z-level, with depth/overlap sorting.
         * @param {number} level
         */
        drawEntities: function (level) {
            if (ig.perf.drawSprites) {
                var game = ig.game;
                var zMin = level == -1 ? -9999999 : game.levels[level].height;
                var zMax = level + 1 < game.maxLevel ? game.levels[level + 1].height : 99999999;

                for (var i = 0; i < this.spriteSlots.length; ++i) {
                    var slot = this.spriteSlots[i];
                    if (slot.ground && slot.zMin == zMin) {
                        drawSpriteShadow(slot, zMin, zMax);
                        slot.draw(zMin, zMax);
                        slot._isDrawn = true;
                    } else {
                        slot._isDrawn = false;
                    }
                }

                var overlapStack = [];
                for (var j = 0; j < this.spriteSlots.length + 1; ++j) {
                    if (j == this.spriteSlots.length) {
                        while (overlapStack.length > 0) {
                            var stackIdx = overlapStack.length - 1;
                            var stackEntry = overlapStack[stackIdx];
                            stackEntry.spriteSlot.draw(zMin, zMax);
                            overlapStack.splice(stackIdx, 1);
                            if (stackEntry.idx != -1) {
                                j = stackEntry.idx - 1;
                                break;
                            }
                        }
                    } else {
                        var slot2 = this.spriteSlots[j];
                        var sprite = slot2.cubeSprite;
                        if (!slot2._isDrawn) {
                            var outsideLevel = slot2.zMin >= zMax || slot2.zMax <= zMin;
                            if (!outsideLevel || (sprite.shadow.diameter && !(sprite.shadow.z >= zMax || sprite.shadow.z < zMin))) {
                                var overlap = false;
                                for (var s2 = overlapStack.length; s2--;) {
                                    var entry = overlapStack[s2];
                                    var noXOverlap = sprite.pos.x + sprite.tmpOffset.x + sprite.size.x <= entry.xMin ||
                                        sprite.pos.x + sprite.tmpOffset.x >= entry.xMax;
                                    if (slot2.yIndex > entry.yMax) {
                                        entry.spriteSlot.draw(zMin, zMax);
                                        overlapStack.splice(s2, 1);
                                        if (entry.idx != -1) {
                                            j = entry.idx - 1;
                                            overlap = true;
                                            break;
                                        }
                                    } else if (!noXOverlap &&
                                        sprite.pos.z + sprite.tmpOffset.z + sprite.size.z * sprite.aboveZ >= entry.zMax) {
                                        overlap = true;
                                        entry.idx = entry.idx == -1 ? j : Math.min(j, entry.idx);
                                    } else if (!noXOverlap && slot2.ground) {
                                        entry.yMax = Math.max(entry.yMax,
                                            sprite.pos.y + sprite.tmpOffset.y + sprite.size.y - ig.COLLISION.EPS);
                                    }
                                }
                                if (!overlap) {
                                    slot2._isDrawn = true;
                                    if (slot2.ground) {
                                        drawSpriteShadow(slot2, zMin, zMax);
                                        if (outsideLevel ||
                                            (!ig.perf.spriteOverlapSolver || sprite.noOverlapSolving || sprite.size.y < sprite.size.z)) {
                                            slot2.draw(zMin, zMax);
                                        } else {
                                            overlapStack.push({
                                                xMin: sprite.pos.x + sprite.tmpOffset.x + ig.COLLISION.EPS,
                                                xMax: sprite.pos.x + sprite.tmpOffset.x + sprite.size.x - ig.COLLISION.EPS,
                                                yMax: sprite.pos.y + sprite.tmpOffset.y + sprite.size.y - sprite.wallY - ig.COLLISION.EPS,
                                                zMax: sprite.pos.z + sprite.tmpOffset.z + sprite.size.z - ig.COLLISION.EPS,
                                                idx: -1,
                                                spriteSlot: slot2,
                                            });
                                        }
                                    } else {
                                        drawSpriteShadow(slot2, zMin, zMax);
                                        if (!(slot2.zMin >= zMax || slot2.zMax <= zMin)) slot2.draw(zMin, zMax);
                                    }
                                }
                            }
                        }
                    }
                }
                ig.system.context.globalCompositeOperation = "source-over";
            }
        },

        /**
         * Draw a single animation frame (used for standalone sprite animations).
         */
        drawAnimation: function (animation, x, y, time, alpha, rotate, scaleX, scaleY) {
            var seqLen = animation.sequence.length;
            var frameIdx = Math.floor(time / animation.frameTime);
            var frame = animation.stop ? Math.min(frameIdx, seqLen - 1) : frameIdx % seqLen;
            var sheet = animation.sheet;
            var image = animation.sheet.image;
            var src = sheet.getTileSrc(scratch, animation.sequence[frame]);
            var ctx = ig.system.context;

            if (animation.framesAlpha) alpha = alpha * animation.framesAlpha[frame];
            if (scaleX == undefined) scaleX = 1;
            if (scaleY == undefined) scaleY = 1;

            var needsTransform = rotate || scaleX != 1 || scaleY != 1;
            if (needsTransform) {
                ig.system.context.save();
                ig.system.context.translate(ig.system.getDrawPos(x + animation.pivot.x), ig.system.getDrawPos(y + animation.pivot.y));
                ig.system.context.rotate(rotate);
                if (scaleX != 1 || scaleY != 1) ig.system.context.scale(scaleX, scaleY);
                x = -animation.pivot.x;
                y = -animation.pivot.y;
            }

            var renderMode = animation.renderMode || "source-over";
            if (renderMode != ctx.globalCompositeOperation) ctx.globalCompositeOperation = renderMode;

            var prevAlpha;
            if (alpha != 1) {
                prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = ctx.globalAlpha * alpha;
            }
            image.draw(x, y, src.x, src.y, sheet.width, sheet.height, animation.flip.x, animation.flip.y);
            if (alpha != 1) ctx.globalAlpha = prevAlpha;
            if (needsTransform) ig.system.context.restore();
        },

        mapCleared: function () {
            this.spriteSlots = [];
            this.guiSpriteSlots = [];
        },
    });

    ig.Renderer2d.SpriteDrawSlot = ig.Class.extend({
        cubeSprite: null,
        ground: false,
        yIndex: 0,
        zMin: 0,
        zMax: 0,
        spriteIdx: 0,
        drawShadow: false,

        init: function (cubeSprite, ground, spriteIdx) {
            this.cubeSprite = cubeSprite;
            this.ground = ground;
            this.spriteIdx = spriteIdx;
        },

        update: function (drawShadow) {
            this.drawShadow = drawShadow;
            var sprite = this.cubeSprite;
            if (sprite.gui) {
                this.yIndex = sprite.pos.z + sprite.tmpOffset.z;
            } else if (this.ground) {
                this.yIndex = sprite.pos.y + sprite.tmpOffset.y + ig.COLLISION.EPS;
                this.zMax = this.zMin = sprite.pos.z + sprite.tmpOffset.z + sprite.size.z;
            } else {
                this.yIndex = sprite.pos.y + sprite.tmpOffset.y + sprite.size.y - sprite.wallY;
                this.zMax = sprite.pos.z + sprite.tmpOffset.z + (sprite.size.z || 1);
                this.zMin = sprite.pos.z + sprite.tmpOffset.z;
            }
        },

        draw: function (zMin, zMax) {
            var sprite = this.cubeSprite;
            if (sprite.renderMode) {
                ig.system.context.globalCompositeOperation = sprite.renderMode;
            } else if (ig.system.context.globalCompositeOperation != "source-over") {
                ig.system.context.globalCompositeOperation = "source-over";
            }

            if (sprite.image) {
                var drawX = sprite.pos.x + sprite.tmpOffset.x + sprite.gfxOffset.x;
                var drawY = sprite.pos.y + sprite.tmpOffset.y - (sprite.pos.z + sprite.tmpOffset.z) - sprite.size.z + sprite.gfxOffset.y;
                var cutTop = 0;
                var cutBottom = 0;
                var cutAtZ = 0;
                var width = sprite.size.x;
                var height = sprite.size.y + sprite.size.z;
                var srcX = sprite.src.x;
                var srcY = sprite.src.y;

                if (sprite.wallY < sprite.size.y && !this.ground) {
                    cutTop = cutTop + (sprite.size.y - sprite.wallY);
                } else if (sprite.wallY < sprite.size.y && this.ground) {
                    cutBottom = height - (sprite.size.y - sprite.wallY);
                }

                if (!this.ground && zMin !== undefined) {
                    if (sprite.pos.z + sprite.tmpOffset.z + sprite.size.z > zMax) {
                        cutAtZ = Math.round(sprite.pos.z + sprite.tmpOffset.z + sprite.size.z - zMax);
                        if (sprite.rotate) cutAtZ = cutAtZ - 1;
                        cutTop = cutTop + cutAtZ;
                    } else if (sprite.mergeTop) {
                        cutTop = 0;
                    }
                    if (sprite.pos.z + sprite.tmpOffset.z < zMin) {
                        cutBottom = cutBottom + (height - Math.round(height - (zMin - (sprite.pos.z + sprite.tmpOffset.z) + sprite.wallY)));
                    }
                }

                if (sprite.gfxCut.top) cutTop = Math.max(sprite.gfxCut.top, cutTop);
                if (sprite.gfxCut.bottom) cutBottom = Math.max(cutBottom, sprite.gfxCut.bottom);
                height = height - (cutBottom + cutTop);

                var cutLeftDraw, cutLeftSrc;
                if (sprite.flip.x) {
                    cutLeftDraw = sprite.gfxCut.left;
                    cutLeftSrc = sprite.gfxCut.right;
                } else {
                    cutLeftDraw = cutLeftSrc = sprite.gfxCut.left;
                }
                width = width - (sprite.gfxCut.left + sprite.gfxCut.right);

                if (!(width <= 0 || height <= 0 || sprite.scale.x == 0 || sprite.scale.y == 0 || sprite.alpha <= 0)) {
                    drawX = Math.round(drawX) - ig.game.screen.x;
                    drawY = Math.round(drawY) - ig.game.screen.y;
                    var prevAlpha = ig.system.context.globalAlpha;
                    var newAlpha = prevAlpha * sprite.alpha;
                    var alphaChanged = false;
                    if (sprite.alpha != 1) {
                        alphaChanged = true;
                        ig.system.context.globalAlpha = newAlpha;
                    }

                    var needsTransform = sprite.rotate != 0 || sprite.scale.x != 1 || sprite.scale.y != 1;
                    if (needsTransform) {
                        ig.system.context.save();
                        ig.system.context.translate(ig.system.getDrawPos(drawX + sprite.pivot.x), ig.system.getDrawPos(drawY + sprite.pivot.y));
                        ig.system.context.rotate(sprite.rotate);
                        ig.system.context.scale(sprite.scale.x, sprite.scale.y);
                        drawX = -sprite.pivot.x;
                        drawY = -sprite.pivot.y;
                    }

                    if (!(sprite.renderData.fragment && sprite.overlay.alpha == 1)) {
                        if (sprite.image instanceof ig.Image || sprite.image instanceof ig.ImageCanvasWrapper) {
                            sprite.image.draw(drawX + cutLeftDraw, drawY + cutTop, srcX + cutLeftSrc, srcY + cutTop, width, height, sprite.flip.x, sprite.flip.y);
                        } else if (sprite.image instanceof ig.ImagePattern) {
                            sprite.image.draw(drawX + cutLeftDraw, drawY + cutTop, srcX + cutLeftSrc, srcY + cutTop, width, height);
                        }
                    } else if (sprite.image instanceof ig.SimpleColor || sprite.image instanceof ig.SimpleCircle ||
                        sprite.image instanceof ig.ComplexLineCircleBox || sprite.image instanceof ig.TransitionColor ||
                        sprite.image instanceof ig.DoubleColor) {
                        var colorImage = sprite.image;
                        if (colorImage instanceof ig.DoubleColor) colorImage = this.ground ? colorImage.color1 : colorImage.color2;
                        colorImage.draw(drawX + cutLeftDraw, drawY + cutTop, width, height);
                    }

                    if (sprite.renderData.fragment) {
                        if (sprite.overlay.alpha != 1) {
                            ig.system.context.globalAlpha = newAlpha * sprite.overlay.alpha;
                            alphaChanged = true;
                        }
                        sprite.renderData.fragment.draw(drawX + cutLeftDraw, drawY + cutTop, cutLeftSrc, cutTop, width, height, sprite.flip.x, sprite.flip.y);
                    }

                    if (sprite.renderData.lighterFragment) {
                        var prevOp = ig.system.context.globalCompositeOperation;
                        ig.system.context.globalCompositeOperation = "lighter";
                        if (sprite.lighterOverlay.alpha != 1) {
                            ig.system.context.globalAlpha = newAlpha * sprite.lighterOverlay.alpha;
                            alphaChanged = true;
                        }
                        sprite.renderData.lighterFragment.draw(drawX + cutLeftDraw, drawY + cutTop, cutLeftSrc, cutTop, width, height, sprite.flip.x, sprite.flip.y);
                        ig.system.context.globalCompositeOperation = prevOp;
                    }

                    if (needsTransform) ig.system.context.restore();
                    if (alphaChanged) ig.system.context.globalAlpha = prevAlpha;
                }
            }
        },
    });
});
