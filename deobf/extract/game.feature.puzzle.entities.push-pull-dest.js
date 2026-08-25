ig.module("game.feature.puzzle.entities.push-pull-dest").requires("impact.base.actor-entity", "impact.base.entity", "game.feature.puzzle.components.push-pullable").defines(function() {
    var b = Vec2.create(),
        a = Vec3.create();
    sc.PUSH_PULL_DEST_TYPES = {};
    var d = {
        PERMANENT: 1,
        TEMP: 2
    };
    ig.ENTITY.PushPullDest = ig.AnimatedEntity.extend({
        variable: null,
        zMove: 0,
        saveType: 0,
        placedData: null,
        placed: false,
        zStart: 0,
        placeTimer: 0,
        delayed: false,
        effects: new ig.EffectSheet("puzzle"),
        sound: {
            lockIn: new ig.Sound("media/sound/puzzle/push-click.ogg",
                1)
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                pushPullDestType: {
                    _type: "String",
                    _info: "Type of push pull dest",
                    _select: sc.PUSH_PULL_DEST_TYPES
                },
                zMove: {
                    _type: "Number",
                    _info: "Z Movememnt aber PushPullable has been placed"
                },
                saveType: {
                    _type: "String",
                    _info: "How state of box should be saved",
                    _select: d
                },
                variable: {
                    _type: "String",
                    _info: "Variable to increase when push-pullable is placed"
                }
            }
        }),
        init: function(a, b, f, g) {
            this.parent(a, b, f, g);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 0;
            this.coll.zBounciness =
                0.3;
            this.coll.weight = -1;
            this.coll.shadow.size = 16;
            this.placeTimer = new ig.WeightTimer;
            this.variable = g.variable || null;
            this.zMove = g.zMove || 0;
            this.saveType = d[g.saveType || "PERMANENT"];
            this.zStart = this.coll.pos.z;
            if (a = sc.PUSH_PULL_DEST_TYPES[g.pushPullDestType]) {
                this.terrain = a.terrain;
                Vec3.assign(this.coll.size, a.size);
                if (a.useStyleSheet) {
                    b = ig.mapStyle.get("puzzle");
                    a.anims.sheet.src = b.sheet
                }
                this.initAnimations(a.anims)
            }
            this.loadPushPullable()
        },
        onPushPullableDetect: function(a, d) {
            var f = ig.CollTools.getDistVec2(this.coll,
                a.coll, b);
            if (Vec2.length(f) <= 8) {
                Vec2.assign(d, this.coll.pos);
                return true
            }
            return false
        },
        onPushPullablePlaced: function(a) {
            this.savePushPullable(a);
            this.placeTimer.set(0.2, ig.TIMER_MODE.ONCE);
            this.effects.spawnOnTarget("boxLockIn", a)
        },
        savePushPullable: function(a) {
            this.placedData = {
                id: a.mapId
            };
            this.placed = true;
            a = this._getVarName();
            ig.vars.set(a, this.placedData);
            this.variable && ig.vars.add(this.variable, 1)
        },
        loadPushPullable: function() {
            (this.placedData = ig.vars.get(this._getVarName())) && this.setZPos(this.zStart +
                this.zMove)
        },
        initPushPullable: function() {
            if (!this.placed && this.placedData) {
                var b = ig.game.getEntityByMapId(this.placedData.id);
                if (b) {
                    var d = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
                    b.resetPos(d, true);
                    b.pushPullable.setActive(false);
                    this.placed = true
                }
            }
        },
        _getVarName: function() {
            return (this.saveType == d.TEMP ? "tmp." : "map.") + "entity" + this.mapId + "_placed"
        },
        update: function() {
            if (!this.placeTimer.done()) {
                this.placeTimer.tick();
                var a = this.placeTimer.get();
                if (this.delayed) this.setZPos(this.zStart + a * this.zMove);
                else if (a == 1) {
                    this.sound.lockIn.play();
                    this.placeTimer.set(Math.abs(0.4), ig.TIMER_MODE.ONCE);
                    this.delayed = true
                }
            }
            this.parent()
        },
        deferredUpdate: function() {
            !this.placed && this.placedData && this.initPushPullable()
        },
        onInteraction: function() {
            this.pushPullable.onInteraction()
        },
        onInteractionEnd: function() {
            this.pushPullable.onInteractionEnd()
        }
    });
    sc.PUSH_PULL_DEST_TYPES.DEFAULT = {
        size: {
            x: 32,
            y: 32,
            z: 0
        },
        terrain: ig.TERRAIN.METAL,
        useStyleSheet: true,
        anims: {
            sheet: {
                src: null,
                width: 32,
                height: 32,
                offX: 224,
                offY: 96
            },
            aboveZ: 1,
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }]
        }
    }
});
ig.baked = !0;
