/**
 * game.feature.puzzle.entities.boss-platform
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.boss-platform")`.
 *
 * `ig.ENTITY.BossPlatform`: a boss-arena platform that bounces/nudges under
 * impact. `sc.BossPlatforms` tracks all platforms and `startImpact` shakes
 * the ones inside an impact radius with a falloff; platforms can be locked to
 * a fixed height (`setFixedHeight`) and released later.
 */
ig.module("game.feature.puzzle.entities.boss-platform")
    .requires("impact.base.entity", "impact.feature.base.entities.object-layer-view")
    .defines(function () {

    var spriteOffset = Vec3.create(),
        centerVec = Vec2.create();

    sc.BossPlatforms = {
        list: [],

        registerPlatform: function (platform) {
            this.list.push(platform)
        },

        unregisterPlatform: function (platform) {
            this.list.push(platform)
        },

        startImpact: function (center, nudgeAmount, radius, falloff, duration, minRadius, color) {
            var falloffFactor = radius / falloff;
            for (var i = this.list.length; i--;) {
                var platform = this.list[i],
                    distVec = platform.getCenter(centerVec);
                Vec2.sub(distVec, center);
                var dist = Vec2.length(distVec);
                if (dist < radius && dist >= minRadius) {
                    var falloffProgress = 1 - 1 * (dist / radius);
                    platform.nudge(nudgeAmount * falloffProgress, (dist - minRadius) / (radius - minRadius) * falloffFactor, duration * (1 - 0.35 * (dist / radius)), falloffProgress, color)
                }
            }
        },

        releaseHeightFix: function () {
            for (var i = this.list.length; i--;) this.list[i].releaseHeightFix()
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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.size.z = settings.zHeight || 0;
            this.terrain = settings.terrain || 0;
            this.wallY = (settings.wallY || 0).limit(0, 1);
            this.coll.shape = ig.COLLSHAPE[settings.shape || "RECTANGLE"];
            this.maps = ig.game.getObjectMaps(settings.layer);
            Vec3.assign(this.startPos, this.coll.pos);
            this.timer = new ig.WeightTimer;
            this.setSpriteCount(0);
            this.totalSprites = ig.ObjectLayerTools.getSpriteCount(this, this.maps);
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC);
            sc.BossPlatforms.registerPlatform(this);
            this.gfx = new ig.Image("media/map/arid-heaven.png")
        },

        show: function (show) {
            this.parent(show)
        },

        onKill: function () {
            this.parent();
            sc.BossPlatforms.unregisterPlatform(this);
            this.gfx.decreaseRef()
        },

        update: function () {
            var heightDelta = 0;
            this.colorAlpha = 0;
            this.color = null;
            for (var i = this.movements.length; i--;) {
                var movement = this.movements[i];
                movement.timer.tick();
                if (movement.state == 2) {
                    var progress = movement.timer.get(),
                        height = movement.height * Math.sin(progress * Math.PI),
                        heightDelta = heightDelta + height,
                        alpha = movement.intensity * Math.sin(progress * Math.PI);
                    this.colorAlpha = this.colorAlpha + alpha;
                    this.color = movement.color;
                    if (movement.fixed && progress >= 0.5 && this.fixedState == 2) this.fixedState = 3
                }
                if (movement.timer.done())
                    if (movement.state == 1) {
                        movement.state = 2;
                        movement.timer.set(movement.duration, ig.TIMER_MODE.ONCE)
                    } else movement.state == 2 && this.movements.splice(i, 1)
            }
            if (this.fixedState == 3) heightDelta = this.fixedHeight;
            var finalZ = this.startPos.z + Math.round(heightDelta);
            this.setPos(this.startPos.x, this.startPos.y, finalZ, true);
            if (this.movements.length == 0) {
                this.color = null;
                if (this.fixedState == 4) this.fixedState = this.fixedHeight = 0;
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
            }
            this.parent()
        },

        nudge: function (height, startDelay, duration, intensity, color) {
            if (!(this.fixedState >= 2)) {
                var movement = {
                    state: 1,
                    height: height,
                    duration: duration,
                    intensity: intensity,
                    color: color || "#444",
                    timer: new ig.WeightTimer
                };
                if (this.fixedState == 1) {
                    movement.height = this.fixedHeight;
                    movement.fixed = true;
                    this.fixedState = 2
                }
                movement.timer.set(startDelay, ig.TIMER_MODE.ONCE);
                this.movements.push(movement);
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC)
            }
        },

        setFixedHeight: function (height) {
            this.fixedState = 1;
            this.fixedHeight = height
        },

        releaseHeightFix: function () {
            if (this.fixedState && this.fixedState < 4) {
                var movement = {
                    state: 2,
                    height: this.fixedHeight,
                    duration: 0.4,
                    intensity: 1,
                    color: "#000",
                    timer: new ig.WeightTimer
                };
                movement.timer.set(0.4, ig.TIMER_MODE.ONCE);
                movement.timer.setRemainingTime(0.2);
                this.movements.push(movement);
                this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.DYNAMIC);
                this.fixedState = 4
            }
        },

        updateSprites: function () {
            if (!this.color && this.fixedState < 2) this.setSpriteCount(0);
            else {
                this.setSpriteCount(this.totalSprites + (this.fixedState ? 1 : 0));
                var maps = this.maps,
                    offset = Vec3.sub(this.coll.pos, this.startPos, spriteOffset);
                ig.ObjectLayerTools.updateSprites(this, maps, this.wallY, offset);
                if (this.fixedState) {
                    var sprite = this.sprites[this.sprites.length - 1],
                        coll = this.coll;
                    sprite.setPos(coll.pos.x, coll.pos.y, coll.pos.z + coll.size.z);
                    sprite.setSize(coll.size.x, coll.size.y, 0, 0);
                    sprite.aboveZ = 1;
                    sprite.setImageSrc(this.gfx, 96, 128);
                    sprite.setAlpha(Math.min(1, (this.coll.pos.z - this.startPos.z) / this.fixedHeight * 4))
                }
                if (this.color)
                    for (var i = this.sprites.length; i--;) {
                        var sprite = this.sprites[i];
                        sprite.noOverlapSolving = true;
                        sprite.setLighterOverlayColor(this.color, this.colorAlpha)
                    }
            }
        }
    })
});
ig.baked = !0;
