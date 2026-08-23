/**
 * game.feature.puzzle.entities.ol-platform
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.ol-platform")`.
 *
 * `ig.ENTITY.OLPlatform`: a moving platform rendered from an object layer.
 * It has named states (each with a var condition, offset position, optional
 * maps and a spline); when the active state changes the platform moves
 * between positions at `sc.OL_PLATFORM_SPEED`, blocking navigation while in
 * motion.
 */
ig.module("game.feature.puzzle.entities.ol-platform")
    .requires("impact.base.entity", "impact.feature.base.entities.object-layer-view")
    .defines(function () {

    sc.OL_PLATFORM_SPEED = {
        FLEGMON: 10,
        SLOWEST: 25,
        SLOWER: 50,
        SLOW: 75,
        MEDIUM: 100,
        FAST: 150
    };

    var lerpPos = Vec3.create(),
        alignedPos = Vec3.create();

    ig.ENTITY.OLPlatform = ig.Entity.extend({
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
                wallY: {
                    _type: "Number",
                    _info: "Wall Y Value"
                },
                terrain: {
                    _type: "String",
                    _info: "Type of ground terrain",
                    _select: ig.TERRAIN
                },
                states: {
                    _type: "OlPlatformStates",
                    _info: "States of the platform",
                    _popup: true
                },
                speed: {
                    _type: "String",
                    _info: "Speed of transition",
                    _select: sc.OL_PLATFORM_SPEED
                },
                staticSpeed: {
                    _type: "Boolean",
                    _info: "Speed independent of distance"
                },
                positionSound: {
                    _type: "Boolean",
                    _info: "Make sound positional",
                    _default: false
                },
                shape: {
                    _type: "String",
                    _info: "Height-Shape of Block Entity",
                    _select: ig.COLLSHAPE,
                    _optional: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true,
                    _optional: true
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
        states: [],
        speed: 0,
        staticSpeed: false,
        squishRespawn: true,
        usePositionalSound: false,
        sound: {
            move: new ig.Sound("media/sound/puzzle/push-start.ogg", 1)
        },
        _lastPos: Vec3.create(),
        timer: null,
        currentState: null,
        spritesInitialized: false,
        navBlocker: null,
        quickNavUpdate: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.size.z = settings.zHeight || 0;
            this.terrain = settings.terrain || 0;
            this.speed = sc.OL_PLATFORM_SPEED[settings.speed || "MEDIUM"];
            this.wallY = (settings.wallY || 0).limit(0, 1);
            this.staticSpeed = settings.staticSpeed || false;
            this.usePositionalSound = settings.positionSound || false;
            this.coll.shape = ig.COLLSHAPE[settings.shape || "RECTANGLE"];
            this.maps = ig.game.getObjectMaps(settings.layer);
            Vec3.assign(this.startPos, this.coll.pos);
            this.timer = new ig.WeightTimer;
            var states = settings.states;
            if (states)
                for (var i = 0; i < states.length; ++i) {
                    var state = states[i],
                        stateMaps = null;
                    state.layer && (stateMaps = ig.game.getObjectMaps(state.layer));
                    this.states.push({
                        condition: new ig.VarCondition(state.condition),
                        pos: Vec3.add(state.offset, this.startPos, Vec3.create()),
                        maps: stateMaps,
                        spline: KEY_SPLINES[state.spline || "EASE_IN_OUT"]
                    })
                }
            var spriteCount = ig.ObjectLayerTools.getSpriteCount(this, this.maps);
            this.setSpriteCount(spriteCount);
            window.wm || this.updateState(true)
        },

        show: function (show) {
            this.parent(show);
            this.navBlocker = ig.navigation.getNavBlock(this)
        },

        onKill: function () {
            this.navBlocker && this.navBlocker.remove();
            this.parent()
        },

        updateState: function (instant) {
            for (var i = this.states.length, nextState = null; i--;) {
                var state = this.states[i];
                if (state.condition.evaluate()) {
                    nextState = state;
                    break
                }
            }
            if (nextState && nextState != this.currentState) {
                Vec3.assign(this._lastPos, this.coll.pos);
                if (instant) Vec3.assign(this.coll.pos, nextState.pos);
                else {
                    var sound = this.sound.move.play();
                    this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, alignedPos);
                    this.usePositionalSound && sound.setFixPosition(alignedPos, 800);
                    var duration = Vec3.distance(this._lastPos, nextState.pos);
                    this.staticSpeed && (duration = 32);
                    duration = duration / this.speed;
                    this.timer.set(duration, ig.TIMER_MODE.ONCE);
                    this.quickNavUpdate = duration > 1
                }
                if (this.currentState && this.currentState.maps != nextState.maps) this.spritesInitialized = false
            }
            this.currentState = nextState
        },

        update: function () {
            this.parent();
            if (!this.timer.done()) {
                this.timer.tick();
                var progress = this.timer.get();
                if (this.quickNavUpdate && this.timer.getTimePassed() > 1) {
                    this.quickNavUpdate = false;
                    this.navBlocker && this.navBlocker.update()
                }
                progress = this.currentState.spline.get(progress);
                Vec3.lerp(this._lastPos, this.currentState.pos, progress, lerpPos);
                this.setPos(lerpPos.x, lerpPos.y, lerpPos.z, true);
                this.timer.done() && this.navBlocker && this.navBlocker.update()
            }
        },

        updateSprites: function () {
            if (!this.spritesInitialized) {
                var maps = this.currentState && this.currentState.maps || this.maps,
                    offset = Vec3.sub(this.coll.pos, this.startPos, lerpPos);
                if (ig.ObjectLayerTools.updateSprites(this, maps, this.wallY, offset)) this.spritesInitialized = false
            }
        },

        varsChanged: function () {
            this.updateState()
        }
    })
});
ig.baked = !0;
