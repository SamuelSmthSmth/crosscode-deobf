ig.module("game.feature.puzzle.entities.ol-platform").requires("impact.base.entity", "impact.feature.base.entities.object-layer-view").defines(function() {
    sc.OL_PLATFORM_SPEED = {
        FLEGMON: 10,
        SLOWEST: 25,
        SLOWER: 50,
        SLOW: 75,
        MEDIUM: 100,
        FAST: 150
    };
    var b = Vec3.create(),
        a = Vec3.create();
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
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.size.z = f.zHeight || 0;
            this.terrain = f.terrain || 0;
            this.speed = sc.OL_PLATFORM_SPEED[f.speed || "MEDIUM"];
            this.wallY = (f.wallY || 0).limit(0, 1);
            this.staticSpeed = f.staticSpeed || false;
            this.usePositionalSound = f.positionSound || false;
            this.coll.shape = ig.COLLSHAPE[f.shape || "RECTANGLE"];
            this.maps = ig.game.getObjectMaps(f.layer);
            Vec3.assign(this.startPos,
                this.coll.pos);
            this.timer = new ig.WeightTimer;
            if (a = f.states)
                for (b = 0; b < a.length; ++b) {
                    e = a[b];
                    f = null;
                    e.layer && (f = ig.game.getObjectMaps(e.layer));
                    this.states.push({
                        condition: new ig.VarCondition(e.condition),
                        pos: Vec3.add(e.offset, this.startPos, Vec3.create()),
                        maps: f,
                        spline: KEY_SPLINES[e.spline || "EASE_IN_OUT"]
                    })
                }
            a = ig.ObjectLayerTools.getSpriteCount(this, this.maps);
            this.setSpriteCount(a);
            window.wm || this.updateState(true)
        },
        show: function(a) {
            this.parent(a);
            this.navBlocker = ig.navigation.getNavBlock(this)
        },
        onKill: function() {
            this.navBlocker &&
                this.navBlocker.remove();
            this.parent()
        },
        updateState: function(b) {
            for (var c = this.states.length, e = null; c--;) {
                var f = this.states[c];
                if (f.condition.evaluate()) {
                    e = f;
                    break
                }
            }
            if (e && e != this.currentState) {
                Vec3.assign(this._lastPos, this.coll.pos);
                if (b) Vec3.assign(this.coll.pos, e.pos);
                else {
                    b = this.sound.move.play();
                    this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, a);
                    this.usePositionalSound && b.setFixPosition(a, 800);
                    b = Vec3.distance(this._lastPos, e.pos);
                    this.staticSpeed && (b = 32);
                    b = b / this.speed;
                    this.timer.set(b, ig.TIMER_MODE.ONCE);
                    this.quickNavUpdate = b > 1
                }
                if (this.currentState && this.currentState.maps != e.maps) this.spritesInitialized = false
            }
            this.currentState = e
        },
        update: function() {
            this.parent();
            if (!this.timer.done()) {
                this.timer.tick();
                var a = this.timer.get();
                if (this.quickNavUpdate && this.timer.getTimePassed() > 1) {
                    this.quickNavUpdate = false;
                    this.navBlocker && this.navBlocker.update()
                }
                a = this.currentState.spline.get(a);
                Vec3.lerp(this._lastPos, this.currentState.pos, a, b);
                this.setPos(b.x, b.y, b.z, true);
                this.timer.done() && this.navBlocker && this.navBlocker.update()
            }
        },
        updateSprites: function() {
            if (!this.spritesInitialized) {
                var a = this.currentState && this.currentState.maps || this.maps,
                    c = Vec3.sub(this.coll.pos, this.startPos, b);
                if (ig.ObjectLayerTools.updateSprites(this, a, this.wallY, c)) this.spritesInitialized = false
            }
        },
        varsChanged: function() {
            this.updateState()
        }
    })
});
ig.baked = !0;
