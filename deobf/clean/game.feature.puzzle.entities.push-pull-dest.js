/**
 * game.feature.puzzle.entities.push-pull-dest
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.push-pull-dest")`.
 *
 * `ig.ENTITY.PushPullDest`: the destination socket a push-pullable block
 * locks into. Detects nearby push-pullables, saves the placed state to a
 * map/tmp variable, animates a z-move when the block locks in, and respawns
 * the block on load.
 */
ig.module("game.feature.puzzle.entities.push-pull-dest")
    .requires("impact.base.actor-entity", "impact.base.entity", "game.feature.puzzle.components.push-pullable")
    .defines(function () {

    var distVec = Vec2.create(),
        alignedPos = Vec3.create();

    sc.PUSH_PULL_DEST_TYPES = {};

    var SAVE_TYPES = {
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
            lockIn: new ig.Sound("media/sound/puzzle/push-click.ogg", 1)
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
                    _select: SAVE_TYPES
                },
                variable: {
                    _type: "String",
                    _info: "Variable to increase when push-pullable is placed"
                }
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 0;
            this.coll.zBounciness = 0.3;
            this.coll.weight = -1;
            this.coll.shadow.size = 16;
            this.placeTimer = new ig.WeightTimer;
            this.variable = settings.variable || null;
            this.zMove = settings.zMove || 0;
            this.saveType = SAVE_TYPES[settings.saveType || "PERMANENT"];
            this.zStart = this.coll.pos.z;
            var type = sc.PUSH_PULL_DEST_TYPES[settings.pushPullDestType];
            if (type) {
                this.terrain = type.terrain;
                Vec3.assign(this.coll.size, type.size);
                if (type.useStyleSheet) {
                    var puzzleStyle = ig.mapStyle.get("puzzle");
                    type.anims.sheet.src = puzzleStyle.sheet
                }
                this.initAnimations(type.anims)
            }
            this.loadPushPullable()
        },

        onPushPullableDetect: function (block, out) {
            var dist = ig.CollTools.getDistVec2(this.coll, block.coll, distVec);
            if (Vec2.length(dist) <= 8) {
                Vec2.assign(out, this.coll.pos);
                return true
            }
            return false
        },

        onPushPullablePlaced: function (block) {
            this.savePushPullable(block);
            this.placeTimer.set(0.2, ig.TIMER_MODE.ONCE);
            this.effects.spawnOnTarget("boxLockIn", block)
        },

        savePushPullable: function (block) {
            this.placedData = {
                id: block.mapId
            };
            this.placed = true;
            var varName = this._getVarName();
            ig.vars.set(varName, this.placedData);
            this.variable && ig.vars.add(this.variable, 1)
        },

        loadPushPullable: function () {
            (this.placedData = ig.vars.get(this._getVarName())) && this.setZPos(this.zStart + this.zMove)
        },

        initPushPullable: function () {
            if (!this.placed && this.placedData) {
                var block = ig.game.getEntityByMapId(this.placedData.id);
                if (block) {
                    var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, alignedPos);
                    block.resetPos(pos, true);
                    block.pushPullable.setActive(false);
                    this.placed = true
                }
            }
        },

        _getVarName: function () {
            return (this.saveType == SAVE_TYPES.TEMP ? "tmp." : "map.") + "entity" + this.mapId + "_placed"
        },

        update: function () {
            if (!this.placeTimer.done()) {
                this.placeTimer.tick();
                var progress = this.placeTimer.get();
                if (this.delayed) this.setZPos(this.zStart + progress * this.zMove);
                else if (progress == 1) {
                    this.sound.lockIn.play();
                    this.placeTimer.set(Math.abs(0.4), ig.TIMER_MODE.ONCE);
                    this.delayed = true
                }
            }
            this.parent()
        },

        deferredUpdate: function () {
            !this.placed && this.placedData && this.initPushPullable()
        },

        onInteraction: function () {
            this.pushPullable.onInteraction()
        },

        onInteractionEnd: function () {
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
